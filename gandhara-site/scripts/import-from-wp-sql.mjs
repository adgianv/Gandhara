#!/usr/bin/env node
/**
 * Import WordPress content from SQL dump into Astro JSON data files.
 * Run: node scripts/import-from-wp-sql.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SQL_PATH = path.join(ROOT, '..', 'Gand_', 'dbppgfjxviqljp.sql');
const DATA_DIR = path.join(ROOT, 'src', 'data');
const UPLOADS_DIR = path.join(ROOT, 'public', 'uploads');

/** Media esclusi temporaneamente (file pesanti rimossi dal repo). */
const EXCLUDED_MEDIA = [
  'SFILATA-SMORZO-HD-1080p.mov',
];

const EXCLUDED_VIDEO_PLACEHOLDER =
  '<!-- VIDEO ESCLUSO (file pesante, reinserire in public/uploads): /uploads/2021/11/SFILATA-SMORZO-HD-1080p.mov -->';

/** Voci con contenuto ridotto: solo testo, galleria esclusa. */
const TEXT_ONLY_SLUGS = new Set(['presentazione']);

const PRESENTAZIONE_PLACEHOLDER =
  '<!-- PRESENTAZIONE: galleria immagini esclusa (file pesanti). Reinserire le foto da /uploads/2022/06/ (nikon-fm2-x-Gandhara0001, ecc.) -->';

/** slug nel JSON Astro → { wp post_name, wp post_type, opzionale post_id alternativo } */
const SLUG_MAP = {
  pharmakon: {
    'pharmakon-ep2': { post_name: 'pharmakon-ep-2', post_type: 'pharmakon' },
    'pharmakon-ep1': { post_name: 'articolo-1-pharmakon', post_type: 'pharmakon' },
    presentazione: { post_name: 'presentazione', post_type: 'pharmakon' },
  },
  stampa: {
    'pharmakon-ep1': { post_name: 'articolo-1-stampa', post_type: 'stampa' },
    altro: { post_name: 'altro', post_type: 'stampa' },
  },
  collab: {
    'una-vetrina': { post_name: 'prova-collab', post_type: 'collab' },
    'villa-medici': { post_name: 'villa-medici', post_type: 'collab' },
    'haus-of-dreamers': { post_name: 'haus-of-dreamers', post_type: 'collab' },
    wegil: { post_name: 'wegil', post_type: 'collab' },
  },
  mostre: {
    smorzo: { post_name: 'smorzo', post_type: 'post', post_id: 744 },
    'altri-luoghi': { post_name: 'altri-luoghi', post_type: 'post', post_id: 716 },
    habicura: { post_name: 'habicura-giardini-verano', post_type: 'post', post_id: 763 },
    extrart: { post_name: 'extrart', post_type: 'post' },
    'instant-paper': { post_name: 'gandhara-slice-instant-paper', post_type: 'post' },
    riflettiti: { post_name: 'riflettiti', post_type: 'post' },
    'naked-nature': { post_name: 'naked-nature', post_type: 'post' },
  },
  cataloghi: {
    smorzo: { post_name: 'smorzo', post_type: 'cataloghi', post_id: 651 },
    'altri-luoghi': { post_name: 'altri-luoghi', post_type: 'cataloghi' },
    'abitare-linabitabile': { post_name: 'inabitabile', post_type: 'cataloghi' },
  },
};

// --- SQL parsing ---

function parseSqlStringFields(row) {
  const fields = [];
  let i = 0;
  if (row[0] === '(') i = 1;
  while (i < row.length && fields.length < 22) {
    if (row[i] === 'N' && row.slice(i, i + 4) === 'NULL') {
      fields.push(null);
      i += 4;
      if (row[i] === ',') i++;
      continue;
    }
    if (row[i] !== "'") {
      // unquoted number
      let j = i;
      while (j < row.length && /[0-9-]/.test(row[j])) j++;
      fields.push(row.slice(i, j));
      i = j;
      if (row[i] === ',') i++;
      continue;
    }
    i++;
    let s = '';
    while (i < row.length) {
      const c = row[i];
      if (c === '\\' && i + 1 < row.length) {
        const next = row[i + 1];
        if (next === "'") {
          s += "'";
          i += 2;
          continue;
        }
        if (next === 'n') {
          s += '\n';
          i += 2;
          continue;
        }
        if (next === 'r') {
          s += '\r';
          i += 2;
          continue;
        }
        if (next === 't') {
          s += '\t';
          i += 2;
          continue;
        }
        if (next === '\\') {
          s += '\\';
          i += 2;
          continue;
        }
        s += next;
        i += 2;
        continue;
      }
      if (c === "'") {
        if (row[i + 1] === "'") {
          s += "'";
          i += 2;
          continue;
        }
        i++;
        break;
      }
      s += c;
      i++;
    }
    fields.push(s);
    if (row[i] === ',') i++;
  }
  return fields;
}

function loadPosts(sql) {
  const insertHeader = 'INSERT INTO `kzc_posts`';
  const blocks = [];
  let pos = 0;
  while (true) {
    const start = sql.indexOf(insertHeader, pos);
    if (start < 0) break;
    const valuesIdx = sql.indexOf('VALUES', start);
    const nextInsert = sql.indexOf('\nINSERT INTO `', valuesIdx + 6);
    const block = sql.slice(valuesIdx + 6, nextInsert > 0 ? nextInsert : sql.length);
    blocks.push(block);
    pos = start + insertHeader.length;
  }

  const posts = new Map();
  const attachments = new Map();

  for (const block of blocks) {
  const rowRe = /^\(\d+,/gm;
  let m;
  const starts = [];
  while ((m = rowRe.exec(block)) !== null) starts.push(m.index);

  for (let i = 0; i < starts.length; i++) {
    const slice = block.slice(starts[i], starts[i + 1] ?? block.length).replace(/\),\s*$/, '').replace(/\);?\s*$/, '');
    const fields = parseSqlStringFields(slice);
    if (fields.length < 21) continue;
    const post = {
      ID: parseInt(fields[0], 10),
      post_content: fields[4] ?? '',
      post_title: fields[5] ?? '',
      post_status: fields[7] ?? '',
      post_name: fields[11] ?? '',
      post_type: fields[20] ?? '',
      guid: fields[18] ?? '',
    };
    if (post.post_type === 'attachment') {
      const guid = post.guid;
      const match = guid.match(/uploads\/(.+)$/i) || post.post_content.match(/uploads\/(.+)/i);
      if (match) attachments.set(post.ID, match[1]);
    } else {
      posts.set(post.ID, post);
      const key = `${post.post_type}:${post.post_name}`;
      posts.set(key, post);
    }
  }
  }
  return { posts, attachments };
}

function loadPostMeta(sql) {
  const meta = new Map();
  const re = /\((\d+),\s*(\d+),\s*'([^']+)',\s*'((?:[^'\\]|\\.|'')*)'\)/g;
  let m;
  while ((m = re.exec(sql)) !== null) {
    const postId = parseInt(m[2], 10);
    const key = m[3].replace(/\\'/g, "'").replace(/''/g, "'");
    let val = m[4].replace(/\\'/g, "'").replace(/''/g, "'");
    if (!meta.has(postId)) meta.set(postId, {});
    meta.get(postId)[key] = val;
  }
  return meta;
}

function listUploadFiles(dir, base = '/uploads') {
  const out = new Set();
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      for (const x of listUploadFiles(p, `${base}/${ent.name}`)) out.add(x);
    } else {
      out.add(`${base}/${ent.name}`);
    }
  }
  return out;
}

function resolveUploadUrl(urlPath, existingFiles) {
  if (!urlPath) return urlPath;
  let p = urlPath.replace(/^https?:\/\/[^/]+/i, '');
  if (!p.startsWith('/uploads/')) {
    const idx = p.indexOf('/uploads/');
    if (idx >= 0) p = p.slice(idx);
    else if (p.includes('wp-content/uploads/')) {
      p = '/uploads/' + p.split('wp-content/uploads/')[1];
    }
  }
  p = p.replace(/ /g, '%20');
  if (existingFiles.has(p)) return p;
  // try without size suffix
  const base = p.replace(/-\d+x\d+(\.[a-z0-9]+)$/i, '$1');
  if (existingFiles.has(base)) return base;
  return p;
}

function rewriteUrls(html, existingFiles) {
  return html.replace(
    /(?:https?:)?\/\/(?:gandhara\.info\/wp-content\/uploads|gandhara\.info\/wp-content\/uploads|\/wp-content\/uploads)(\/[^\s"'<>]+)/gi,
    (_, rest) => resolveUploadUrl('/uploads' + rest.replace(/ /g, '%20'), existingFiles),
  ).replace(
    /src="([^"]+)"/g,
    (_, u) => `src="${resolveUploadUrl(u, existingFiles)}"`,
  );
}

function stripExcludedMedia(html) {
  let out = html;
  for (const pattern of EXCLUDED_MEDIA) {
    const re = new RegExp(
      `<!-- wp:video[^]*?${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^]*?<!-- /wp:video -->`,
      'gi',
    );
    out = out.replace(re, EXCLUDED_VIDEO_PLACEHOLDER);
    out = out.replace(
      new RegExp(`<figure class="wp-block-video">[^]*?${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^]*?</figure>`, 'gi'),
      EXCLUDED_VIDEO_PLACEHOLDER,
    );
  }
  return out;
}

function gutenbergToHtml(content, { textOnly = false } = {}) {
  if (!content) return '';

  let html = content;

  // Remove Gutenberg block comments, keep inner HTML
  html = html.replace(/<!-- \/wp:[^>]+ -->/g, '');
  html = html.replace(/<!-- wp:[^>]+ -->/g, '');

  // PDF embed → link
  html = html.replace(
    /<p class="wp-block-pdfemb[^"]*"><\/p>/g,
    '',
  );

  // Empty wp blocks
  html = html.replace(/<figure class="wp-block-image"><img alt=""\s*\/?><\/figure>/gi, '');

  if (textOnly) {
    // Keep only paragraphs, headings, links
    const parts = [];
    const pRe = /<p[^>]*>([\s\S]*?)<\/p>|<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>|<em>([\s\S]*?)<\/em>/gi;
    let m;
    while ((m = pRe.exec(html)) !== null) {
      const inner = m[1] || m[2] || m[3];
      if (inner && inner.trim() && !inner.includes('wp-image')) {
        if (m[2]) parts.push(`<h4>${inner}</h4>`);
        else parts.push(`<p>${inner}</p>`);
      }
    }
    return PRESENTAZIONE_PLACEHOLDER + '\n' + parts.join('\n');
  }

  // Simplify gallery grids to stacked figures
  html = html.replace(/<ul class="blocks-gallery-grid">([\s\S]*?)<\/ul>/gi, (_, inner) => {
    const imgs = [...inner.matchAll(/<img[^>]+>/gi)].map((x) => x[0]);
    return imgs.map((img) => `<figure class="wp-block-image">${img}</figure>`).join('\n');
  });

  // Collapse excessive empty columns/divs from theme blocks
  html = html.replace(/<div class="wp-block-column"[^>]*>\s*<\/div>/gi, '');
  html = html.replace(/<p>\s*<\/p>/gi, '');

  return html.trim();
}

function findPost(posts, { post_name, post_type, post_id }) {
  if (post_id && posts.has(post_id)) return posts.get(post_id);
  const key = `${post_type}:${post_name}`;
  if (posts.has(key)) return posts.get(key);
  for (const p of posts.values()) {
    if (typeof p === 'object' && p.post_name === post_name && p.post_type === post_type && p.post_status === 'publish') {
      return p;
    }
  }
  return null;
}

function getCoverImage(postId, meta, attachments, content, existingFiles) {
  const m = meta.get(postId) || {};
  let attId = m.immagine_copertina || m._thumbnail_id;
  if (attId && attachments.has(parseInt(attId, 10))) {
    const rel = '/uploads/' + attachments.get(parseInt(attId, 10));
    return resolveUploadUrl(rel, existingFiles);
  }
  const img = content.match(/src="(\/uploads\/[^"]+)"/);
  if (img) return img[1];
  const wpImg = content.match(/uploads\/([^"'\s]+)/);
  if (wpImg) return resolveUploadUrl('/uploads/' + wpImg[1], existingFiles);
  return '';
}

function importSection(section, posts, meta, attachments, existingFiles) {
  const map = SLUG_MAP[section];
  const jsonPath = path.join(DATA_DIR, `${section}.json`);
  const existing = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const results = [];

  for (const item of existing) {
    const cfg = map[item.slug];
    if (!cfg) {
      console.warn(`  [${section}] no WP mapping for slug: ${item.slug}`);
      results.push(item);
      continue;
    }
    const post = findPost(posts, cfg);
    if (!post) {
      console.warn(`  [${section}] post not found: ${item.slug}`);
      results.push({ ...item, content: item.content || '' });
      continue;
    }

    const textOnly = TEXT_ONLY_SLUGS.has(item.slug);
    let content = gutenbergToHtml(post.post_content, { textOnly });
    content = stripExcludedMedia(content);
    content = rewriteUrls(content, existingFiles);

    const coverImage = textOnly
      ? ''
      : getCoverImage(post.ID, meta, attachments, content, existingFiles);

    results.push({
      slug: item.slug,
      title: post.post_title || item.title,
      coverImage,
      content,
    });
    console.log(`  ✓ ${section}/${item.slug} (${content.length} chars)`);
  }

  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2) + '\n');
}

function importAbout(posts, existingFiles) {
  const home = findPost(posts, { post_name: 'home', post_type: 'page' });
  if (!home) return;
  let content = gutenbergToHtml(home.post_content);
  content = rewriteUrls(content, existingFiles);
  fs.writeFileSync(
    path.join(DATA_DIR, 'about.json'),
    JSON.stringify({ content }, null, 2) + '\n',
  );
  console.log(`  ✓ about.json (${content.length} chars)`);
}

// --- main ---

console.log('Import from WordPress SQL\n');
if (!fs.existsSync(SQL_PATH)) {
  console.error('SQL not found:', SQL_PATH);
  process.exit(1);
}

const sql = fs.readFileSync(SQL_PATH, 'utf8');
const { posts, attachments } = loadPosts(sql);
const meta = loadPostMeta(sql);
const existingFiles = listUploadFiles(UPLOADS_DIR);

const postCount = [...posts.values()].filter((p) => typeof p === 'object' && p.ID && p.post_status).length;
console.log(`Posts: ${postCount}, attachments: ${attachments.size}`);
console.log(`Upload files on disk: ${existingFiles.size}\n`);

for (const section of ['pharmakon', 'stampa', 'collab', 'mostre', 'cataloghi']) {
  console.log(`[${section}]`);
  importSection(section, posts, meta, attachments, existingFiles);
}

console.log('\n[about]');
importAbout(posts, existingFiles);

console.log('\nDone.');
