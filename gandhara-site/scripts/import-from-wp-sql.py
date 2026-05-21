#!/usr/bin/env python3
"""Import WordPress SQL dump into Astro JSON data files."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SQL_PATH = ROOT.parent / "Gand_" / "dbppgfjxviqljp.sql"
DATA_DIR = ROOT / "src" / "data"
UPLOADS_DIR = ROOT / "public" / "uploads"

EXCLUDED_MEDIA = ["SFILATA-SMORZO-HD-1080p.mov"]

EXCLUDED_VIDEO_PLACEHOLDER = (
    "<!-- VIDEO ESCLUSO (file pesante, reinserire in public/uploads): "
    "/uploads/2021/11/SFILATA-SMORZO-HD-1080p.mov -->"
)

TEXT_ONLY_SLUGS = {"presentazione"}

PRESENTAZIONE_PLACEHOLDER = (
    "<!-- PRESENTAZIONE: galleria immagini esclusa (file pesanti). "
    "Reinserire le foto da /uploads/2022/06/ (nikon-fm2-x-Gandhara0001, ecc.) -->"
)

SLUG_MAP: dict[str, dict[str, dict]] = {
    "pharmakon": {
        "pharmakon-ep2": {"post_name": "pharmakon-ep-2", "post_type": "pharmakon"},
        "pharmakon-ep1": {"post_name": "articolo-1-pharmakon", "post_type": "pharmakon"},
        "presentazione": {"post_name": "presentazione", "post_type": "pharmakon"},
    },
    "stampa": {
        "pharmakon-ep1": {"post_name": "articolo-1-stampa", "post_type": "stampa"},
        "altro": {"post_name": "altro", "post_type": "stampa"},
    },
    "collab": {
        "una-vetrina": {"post_name": "prova-collab", "post_type": "collab"},
        "villa-medici": {"post_name": "villa-medici", "post_type": "collab"},
        "haus-of-dreamers": {"post_name": "haus-of-dreamers", "post_type": "collab"},
        "wegil": {"post_name": "wegil", "post_type": "collab"},
    },
    "mostre": {
        "smorzo": {"post_name": "smorzo", "post_type": "post", "post_id": 744},
        "altri-luoghi": {"post_name": "altri-luoghi", "post_type": "post", "post_id": 716},
        "habicura": {"post_name": "habicura-giardini-verano", "post_type": "post", "post_id": 763},
        "extrart": {"post_name": "extrart", "post_type": "post"},
        "instant-paper": {"post_name": "gandhara-slice-instant-paper", "post_type": "post"},
        "riflettiti": {"post_name": "riflettiti", "post_type": "post"},
        "naked-nature": {"post_name": "naked-nature", "post_type": "post"},
    },
    "cataloghi": {
        "smorzo": {"post_name": "smorzo", "post_type": "cataloghi", "post_id": 651},
        "altri-luoghi": {"post_name": "altri-luoghi", "post_type": "cataloghi"},
        "abitare-linabitabile": {"post_name": "abitare-linabitabile", "post_type": "cataloghi", "post_id": 742},
    },
}


def parse_sql_row(row: str) -> list[str | None]:
    fields: list[str | None] = []
    i = 1 if row.startswith("(") else 0
    n = len(row)

    while i < n and len(fields) < 22:
        while i < n and row[i] in " \t\r\n":
            i += 1
        if i >= n:
            break
        if row[i : i + 4] == "NULL":
            fields.append(None)
            i += 4
            continue
        if row[i] != "'":
            j = i
            while j < n and row[j] in "0123456789-":
                j += 1
            fields.append(row[i:j])
            i = j
            while i < n and row[i] in ", \t\r\n":
                i += 1
            continue
        i += 1
        chars: list[str] = []
        while i < n:
            c = row[i]
            if c == "\\" and i + 1 < n:
                nxt = row[i + 1]
                if nxt == "'":
                    chars.append("'")
                    i += 2
                    continue
                if nxt == "n":
                    chars.append("\n")
                    i += 2
                    continue
                if nxt == "r":
                    chars.append("\r")
                    i += 2
                    continue
                if nxt == "t":
                    chars.append("\t")
                    i += 2
                    continue
                if nxt == "\\":
                    chars.append("\\")
                    i += 2
                    continue
                chars.append(nxt)
                i += 2
                continue
            if c == "'":
                if i + 1 < n and row[i + 1] == "'":
                    chars.append("'")
                    i += 2
                    continue
                i += 1
                break
            chars.append(c)
            i += 1
        fields.append("".join(chars))
        while i < n and row[i] in ", \t\r\n":
            i += 1
    return fields


def load_posts(sql: str) -> tuple[dict, dict]:
    posts: dict = {}
    attachments: dict[int, str] = {}
    header = "INSERT INTO `kzc_posts`"
    pos = 0

    while True:
        start = sql.find(header, pos)
        if start < 0:
            break
        values_idx = sql.find("VALUES", start)
        next_insert = sql.find("\nINSERT INTO `", values_idx + 6)
        block = sql[values_idx + 6 : next_insert if next_insert > 0 else len(sql)]
        pos = start + len(header)

        # Each post row is a single line in this dump
        for line in block.split("\n"):
            slice_ = line.strip().rstrip(",").rstrip(";")
            if not slice_.startswith("("):
                continue
            fields = parse_sql_row(slice_)
            if len(fields) < 21 or not fields[0] or not str(fields[0]).isdigit():
                continue
            post = {
                "ID": int(fields[0]),
                "post_content": fields[4] or "",
                "post_title": fields[5] or "",
                "post_status": fields[7] or "",
                "post_name": fields[11] or "",
                "post_type": fields[20] or "",
                "guid": fields[18] or "",
            }
            if post["post_type"] == "attachment":
                match = re.search(r"uploads/(.+)$", post["guid"], re.I)
                if match:
                    attachments[post["ID"]] = match.group(1)
            else:
                posts[post["ID"]] = post
                posts[f"{post['post_type']}:{post['post_name']}"] = post

    return posts, attachments


def load_postmeta(sql: str) -> dict[int, dict[str, str]]:
    meta: dict[int, dict[str, str]] = {}
    for m in re.finditer(
        r"\((\d+),\s*(\d+),\s*'((?:[^'\\]|\\.|'')*)',\s*'((?:[^'\\]|\\.|'')*)'\)",
        sql,
    ):
        post_id = int(m.group(2))
        key = m.group(3).replace("\\'", "'").replace("''", "'")
        val = m.group(4).replace("\\'", "'").replace("''", "'")
        meta.setdefault(post_id, {})[key] = val
    return meta


def list_upload_files(directory: Path, base: str = "/uploads") -> set[str]:
    out: set[str] = set()
    if not directory.exists():
        return out
    for p in directory.rglob("*"):
        if p.is_file():
            rel = f"{base}/{p.relative_to(directory).as_posix()}"
            out.add(rel)
    return out


def resolve_upload_url(url_path: str, existing: set[str]) -> str:
    if not url_path:
        return url_path
    p = re.sub(r"^https?://[^/]+", "", url_path, flags=re.I)
    if "wp-content/uploads/" in p:
        p = "/uploads/" + p.split("wp-content/uploads/")[1]
    if not p.startswith("/uploads/"):
        idx = p.find("/uploads/")
        if idx >= 0:
            p = p[idx:]
    if p in existing:
        return p
    base = re.sub(r"-\d+x\d+(\.[a-z0-9]+)$", r"\1", p, flags=re.I)
    if base in existing:
        return base
    return p


def rewrite_urls(html: str, existing: set[str]) -> str:
    def repl(m: re.Match) -> str:
        path = m.group(1)
        return resolve_upload_url("/uploads" + path.replace(" ", "%20"), existing)

    html = re.sub(
        r"(?:https?:)?//[^/]+/wp-content/uploads(/[^\s\"'<>]+)",
        repl,
        html,
        flags=re.I,
    )
    html = re.sub(
        r"/wp-content/uploads(/[^\s\"'<>]+)",
        repl,
        html,
        flags=re.I,
    )

    def src_repl(m: re.Match) -> str:
        return f'src="{resolve_upload_url(m.group(1), existing)}"'

    return re.sub(r'src="([^"]+)"', src_repl, html)


def strip_excluded_media(html: str) -> str:
    out = html
    for pattern in EXCLUDED_MEDIA:
        esc = re.escape(pattern)
        out = re.sub(
            rf"<!-- wp:video[^]*?{esc}[^]*?<!-- /wp:video -->",
            EXCLUDED_VIDEO_PLACEHOLDER,
            out,
            flags=re.I | re.DOTALL,
        )
        out = re.sub(
            rf"<figure class=\"wp-block-video\">[^]*?{esc}[^]*?</figure>",
            EXCLUDED_VIDEO_PLACEHOLDER,
            out,
            flags=re.I | re.DOTALL,
        )
        out = re.sub(
            rf"<video[^>]*src=\"[^\"]*{esc}[^\"]*\"[^>]*>.*?</video>",
            EXCLUDED_VIDEO_PLACEHOLDER,
            out,
            flags=re.I | re.DOTALL,
        )
        out = re.sub(
            rf"<figure class=\"wp-block-video\">[^]*?{esc}[^]*?</figure>",
            EXCLUDED_VIDEO_PLACEHOLDER,
            out,
            flags=re.I | re.DOTALL,
        )
    return out


def gutenberg_to_html(content: str, *, text_only: bool = False) -> str:
    if not content:
        return ""
    html = re.sub(r"<!-- /wp:[^>]+ -->", "", content)
    html = re.sub(r"<!-- wp:[^>]+ -->", "", html)
    html = re.sub(r'<p class="wp-block-pdfemb[^"]*"></p>', "", html)
    html = re.sub(
        r'<figure class="wp-block-image"><img alt=""\s*/?></figure>',
        "",
        html,
        flags=re.I,
    )

    if text_only:
        parts: list[str] = []
        for m in re.finditer(
            r"<p[^>]*>([\s\S]*?)</p>|<h([1-6])[^>]*>([\s\S]*?)</h\2>",
            html,
            re.I,
        ):
            if m.group(1):
                inner = m.group(1)
                if inner.strip() and "wp-image" not in inner:
                    parts.append(f"<p>{inner}</p>")
            elif m.group(3):
                parts.append(f"<h4>{m.group(3)}</h4>")
        return PRESENTAZIONE_PLACEHOLDER + "\n" + "\n".join(parts)

    def gallery_repl(m: re.Match) -> str:
        imgs = re.findall(r"<img[^>]+>", m.group(1), re.I)
        return "\n".join(f'<figure class="wp-block-image">{img}</figure>' for img in imgs)

    html = re.sub(
        r'<ul class="blocks-gallery-grid">([\s\S]*?)</ul>',
        gallery_repl,
        html,
        flags=re.I,
    )
    html = re.sub(r'<div class="wp-block-column"[^>]*>\s*</div>', "", html, flags=re.I)
    html = re.sub(r"<p>\s*</p>", "", html, flags=re.I)
    return html.strip()


def find_post(posts: dict, cfg: dict):
    post_id = cfg.get("post_id")
    if post_id and post_id in posts:
        return posts[post_id]
    key = f"{cfg['post_type']}:{cfg['post_name']}"
    if key in posts:
        return posts[key]
    for p in posts.values():
        if (
            isinstance(p, dict)
            and p.get("post_name") == cfg["post_name"]
            and p.get("post_type") == cfg["post_type"]
            and p.get("post_status") == "publish"
        ):
            return p
    return None


def get_cover_image(
    post_id: int,
    meta: dict,
    attachments: dict,
    content: str,
    existing: set[str],
) -> str:
    m = meta.get(post_id, {})
    att_id = m.get("immagine_copertina") or m.get("_thumbnail_id")
    if att_id:
        aid = int(att_id)
        if aid in attachments:
            return resolve_upload_url(f"/uploads/{attachments[aid]}", existing)
    img = re.search(r'src="(/uploads/[^"]+)"', content)
    if img:
        return img.group(1)
    wp_img = re.search(r"uploads/([^\"'\s]+)", content)
    if wp_img:
        return resolve_upload_url(f"/uploads/{wp_img.group(1)}", existing)
    return ""


def import_section(
    section: str,
    posts: dict,
    meta: dict,
    attachments: dict,
    existing: set[str],
) -> None:
    mapping = SLUG_MAP[section]
    json_path = DATA_DIR / f"{section}.json"
    items = json.loads(json_path.read_text(encoding="utf-8"))
    results = []

    for item in items:
        cfg = mapping.get(item["slug"])
        if not cfg:
            print(f"  [{section}] no mapping: {item['slug']}")
            results.append(item)
            continue
        post = find_post(posts, cfg)
        if not post:
            print(f"  [{section}] not found: {item['slug']}")
            results.append(item)
            continue

        text_only = item["slug"] in TEXT_ONLY_SLUGS
        raw = strip_excluded_media(post["post_content"])
        content = gutenberg_to_html(raw, text_only=text_only)
        content = strip_excluded_media(content)
        content = rewrite_urls(content, existing)
        cover = (
            ""
            if text_only
            else get_cover_image(post["ID"], meta, attachments, content, existing)
        )
        results.append(
            {
                "slug": item["slug"],
                "title": post["post_title"] or item["title"],
                "coverImage": cover,
                "content": content,
            }
        )
        print(f"  ✓ {section}/{item['slug']} ({len(content)} chars)")

    json_path.write_text(
        json.dumps(results, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def import_about(posts: dict, existing: set[str]) -> None:
    post = find_post(posts, {"post_name": "home", "post_type": "page"})
    if not post:
        return
    content = rewrite_urls(gutenberg_to_html(post["post_content"]), existing)
    (DATA_DIR / "about.json").write_text(
        json.dumps({"content": content}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"  ✓ about.json ({len(content)} chars)")


def main() -> None:
    print("Import from WordPress SQL\n")
    if not SQL_PATH.exists():
        raise SystemExit(f"SQL not found: {SQL_PATH}")

    sql = SQL_PATH.read_text(encoding="utf-8", errors="replace")
    posts, attachments = load_posts(sql)
    meta = load_postmeta(sql)
    existing = list_upload_files(UPLOADS_DIR)

    post_count = len({k for k, v in posts.items() if isinstance(k, int)})
    print(f"Posts: {post_count}, attachments: {len(attachments)}")
    print(f"Upload files on disk: {len(existing)}\n")

    for section in ["pharmakon", "stampa", "collab", "mostre", "cataloghi"]:
        print(f"[{section}]")
        import_section(section, posts, meta, attachments, existing)

    print("\n[about]")
    import_about(posts, existing)
    print("\nDone.")


if __name__ == "__main__":
    main()
