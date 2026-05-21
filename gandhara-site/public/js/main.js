

// CURSOR BALL

const $bigBall = document.querySelector('.cursor__ball--big');
const $smallBall = document.querySelector('.cursor__ball--small');
const $hoverables = document.querySelectorAll('.hoverable');

// Listeners
document.body.addEventListener('mousemove', onMouseMove);
for (let i = 0; i < $hoverables.length; i++) {
  $hoverables[i].addEventListener('mouseenter', onMouseHover);
  $hoverables[i].addEventListener('mouseleave', onMouseHoverOut);
}

// Move the cursor
function onMouseMove(e) {
  TweenMax.to($bigBall, .4, {
    x: e.pageX - 15,
    y: e.pageY - 15 });

  TweenMax.to($smallBall, .1, {
    x: e.pageX - 5,
    y: e.pageY - 7 });

}

// Hover an element
function onMouseHover() {
  TweenMax.to($bigBall, .3, {
    scale: 4 });

}
function onMouseHoverOut() {
  TweenMax.to($bigBall, .3, {
    scale: 1 });
}


jQuery(document).on('scroll', function(){
  jQuery('p1').css("left", Math.max(100 - 0.2*window.scrollY, 1) + "vw");
  jQuery('p2').css("right", Math.max(100 - 0.2*window.scrollY, 1) + "vw");
  jQuery('p3').css("left", Math.max(100 - 0.2*window.scrollY, 1) + "vw");
})






//FLAG


function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}console.clear();

const SVGNS = "http://www.w3.org/2000/svg",
XLINKNS = "http://www.w3.org/1999/xlink",
TAU = 2 * Math.PI,
skins = ["#FFDFC4", "#F0D5BE", "#EECEB3", "#E1B899", "#E5C298", "#FFDCB2", "#E5B887", "#E5A073", "#E79E6D", "#DB9065", "#CE967C", "#C67856", "#BA6C49", "#A57257", "#F0C8C9", "#DDA8A0", "#B97C6D", "#A8756C", "#AD6452", "#5C3836", "#CB8442", "#BD723C", "#704139", "#A3866A", "#870400", "#710101", "#430000", "#5B0001", "#302E2E"],
COLORS = ["#000000", "#000033", "#000066", "#000099", "#0000CC", "#0000FF",
"#003300", "#003333", "#003366", "#003399", "#0033CC", "#0033FF",
"#006600", "#006633", "#006666", "#006699", "#0066CC", "#0066FF",
"#009900", "#009933", "#009966", "#009999", "#0099CC", "#0099FF",
"#00CC00", "#00CC33", "#00CC66", "#00CC99", "#00CCCC", "#00CCFF",
"#00FF00", "#00FF33", "#00FF66", "#00FF99", "#00FFCC", "#00FFFF",

"#330000", "#330033", "#330066", "#330099", "#3300CC", "#3300FF",
"#333300", "#333333", "#333366", "#333399", "#3333CC", "#3333FF",
"#336600", "#336633", "#336666", "#336699", "#3366CC", "#3366FF",
"#339900", "#339933", "#339966", "#339999", "#3399CC", "#3399FF",
"#33CC00", "#33CC33", "#33CC66", "#33CC99", "#33CCCC", "#33CCFF",
"#33FF00", "#33FF33", "#33FF66", "#33FF99", "#33FFCC", "#33FFFF",

"#660000", "#660033", "#660066", "#660099", "#6600CC", "#6600FF",
"#663300", "#663333", "#663366", "#663399", "#6633CC", "#6633FF",
"#666600", "#666633", "#666666", "#666699", "#6666CC", "#6666FF",
"#669900", "#669933", "#669966", "#669999", "#6699CC", "#6699FF",
"#66CC00", "#66CC33", "#66CC66", "#66CC99", "#66CCCC", "#66CCFF",
"#66FF00", "#66FF33", "#66FF66", "#66FF99", "#66FFCC", "#66FFFF",

"#990000", "#990033", "#990066", "#990099", "#9900CC", "#9900FF",
"#993300", "#993333", "#993366", "#993399", "#9933CC", "#9933FF",
"#996600", "#996633", "#996666", "#996699", "#9966CC", "#9966FF",
"#999900", "#999933", "#999966", "#999999", "#9999CC", "#9999FF",
"#99CC00", "#99CC33", "#99CC66", "#99CC99", "#99CCCC", "#99CCFF",
"#99FF00", "#99FF33", "#99FF66", "#99FF99", "#99FFCC", "#99FFFF",

"#CC0000", "#CC0033", "#CC0066", "#CC0099", "#CC00CC", "#CC00FF",
"#CC3300", "#CC3333", "#CC3366", "#CC3399", "#CC33CC", "#CC33FF",
"#CC6600", "#CC6633", "#CC6666", "#CC6699", "#CC66CC", "#CC66FF",
"#CC9900", "#CC9933", "#CC9966", "#CC9999", "#CC99CC", "#CC99FF",
"#CCCC00", "#CCCC33", "#CCCC66", "#CCCC99", "#CCCCCC", "#CCCCFF",
"#CCFF00", "#CCFF33", "#CCFF66", "#CCFF99", "#CCFFCC", "#CCFFFF",

"#FF0000", "#FF0033", "#FF0066", "#FF0099", "#FF00CC", "#FF00FF",
"#FF3300", "#FF3333", "#FF3366", "#FF3399", "#FF33CC", "#FF33FF",
"#FF6600", "#FF6633", "#FF6666", "#FF6699", "#FF66CC", "#FF66FF",
"#FF9900", "#FF9933", "#FF9966", "#FF9999", "#FF99CC", "#FF99FF",
"#FFCC00", "#FFCC33", "#FFCC66", "#FFCC99", "#FFCCCC", "#FFCCFF",
"#FFFF00", "#FFFF33", "#FFFF66", "#FFFF99", "#FFFFCC", "#FFFFFF"],

transparent = "transparent",
black = "#000000",
white = "#ffffff",
PIANO_BASE = Math.pow(2, 1 / 12),
audio = new AudioContext(),
OSCILLATORS = [];

function piano(n) {
  return 440 * Math.pow(PIANO_BASE, n - 49);
}

//setup audio or a polyfill for requestAnimationFrame for when CodePen displays pens in profile views.
let IS_IN_GRID = false,
initAudio = null,
play = null,
noteOn = null,
noteOff = null,
NOTE_STACK = [],
MAX_NOTE_COUNT = 10;

if (audio.createGain) {
  var out = audio.createGain();
  out.connect(audio.destination);

  initAudio = function (minNote, maxNote, type = "sawtooth") {
    let dNote = maxNote - minNote;
    for (var i = 0; i < dNote; ++i) {
      var gn = audio.createGain();
      gn.gain.value = 0;
      var o = audio.createOscillator();
      o.type = type;
      o.frequency.value = piano(minNote + i + 1);
      o.connect(gn);
      o.start();
      gn.connect(out);
      gn.osc = o;
      OSCILLATORS.push(gn);
    }
  };

  noteOn = function (volume, i) {
    if (0 <= i && i < OSCILLATORS.length) {
      let o = OSCILLATORS[i];
      o.gain.value = volume;
      return o;
    }
  };

  noteOff = noteOn.bind(this, 0);

  play = function (i, volume, duration) {
    if (OSCILLATORS.length == 0) {
      initAudio(0, 88);
    }
    var o = noteOn(volume, i);
    if (o) {
      if (o.timeout) {
        clearTimeout(o.timeout);
        o.timeout = null;
      }
      o.timeout = setTimeout(function () {
        noteOff(i);
        o.timeout = null;
      }, duration * 1000);
    }
  };

} else {
  IS_IN_GRID = true;

  // a polyfill to fix animation for the CodePen front-page
  (function () {
    var startT = null;
    window.requestAnimationFrame = function (thunk) {
      setTimeout(function () {
        if (startT == null) {
          startT = Date.now();
        }
        thunk(Date.now() - startT);
      }, 16);
    };
  })();

  initAudio = noteOn = noteOff = play = function () {};
}

Math.randomRange = (min, max) => Math.random() * (max - min) + min;
Math.randomInt = (min, max) => Math.floor(Math.randomRange(max == undefined ? 0 : min, max == undefined ? min : max));
Math.randomSteps = (min, max, steps) => min + Math.randomInt(0, (1 + max - min) / steps) * steps;

Array.prototype.random = function () {
  return this[Math.randomInt(0, this.length)];
};

function group() {
  let g = document.createElementNS(SVGNS, "g");
  Array.prototype.forEach.call(arguments, g.appendChild.bind(g));
  return g;
}

function svg() {
  let g = document.createElementNS(SVGNS, "svg");
  Array.prototype.forEach.call(arguments, g.appendChild.bind(g));
  return g;
}

function makeTransform() {
  let args = Array.prototype.slice.call(arguments),
  name = args.shift(),
  units = args.shift(),
  params = args.map(a => a + units).join(',');

  return `${name}(${params})`;
}

SVGElement.prototype.setAttr = function (ns, attr, val) {
  this.setAttributeNS(ns, attr, val);
  return this;
};

let identity = function () {},
translate = (x, y, units = "") => makeTransform("translate", units, x, y),
rotate = (a, units = "") => makeTransform("rotate", units, a),
scale = (x, y) => makeTransform("scale", "", x, y),
use = name => document.createElementNS(SVGNS, "use").link(name),
rect = (x, y, w, h) => document.createElementNS(SVGNS, "rect").
setAttr(null, "x", x).
setAttr(null, "y", y).
setAttr(null, "width", w).
setAttr(null, "height", h),
path = () => document.createElementNS(SVGNS, "path");

function text(txt, size) {
  var elem = document.createElementNS(SVGNS, "text");
  elem.appendChild(document.createTextNode(txt));
  return elem.setAttr(null, "font-size", size).
  setAttr(null, "font-family", "Verdana").
  setAttr(null, "color", "currentColor");
}

SVGElement.prototype.fill = function (color) {
  return this.setAttr(null, "fill", color);
};

SVGElement.prototype.bg = SVGElement.prototype.fill;

SVGElement.prototype.stroke = function (color) {
  return this.setAttr(null, "stroke", color);
};

SVGElement.prototype.strokeWidth = function (size) {
  return this.setAttr(null, "stroke-width", size);
};

SVGElement.prototype.fg = function (color) {
  return this.setAttr(null, "color", color);
};

SVGElement.prototype.link = function (id) {
  return this.setAttr(XLINKNS, "href", id);
};

SVGElement.prototype.d = function (val) {
  return this.setAttr(null, "d", val);
};

SVGElement.prototype.ID = function (val) {
  return this.setAttr(null, "id", val);
};

function transform() {
  let args = Array.prototype.slice.call(arguments),
  elem = args.shift(),
  t = args.join(' ');
  if (elem instanceof SVGElement) {
    elem.setAttr(null, "transform", t);
  } else {
    elem.style.transform = t;
  }
  return elem;
}

SVGElement.prototype.trans = function () {
  let args = Array.prototype.slice.call(arguments);
  args.unshift(this);
  return transform.apply(window, args);
};

CanvasRenderingContext2D.prototype.roundedRect = function (x, y, width, height, radius = 5, fill = true, stroke = false) {
  this.beginPath();
  this.moveTo(x + radius, y);
  this.lineTo(x + width - radius, y);
  this.quadraticCurveTo(x + width, y, x + width, y + radius);
  this.lineTo(x + width, y + height - radius);
  this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  this.lineTo(x + radius, y + height);
  this.quadraticCurveTo(x, y + height, x, y + height - radius);
  this.lineTo(x, y + radius);
  this.quadraticCurveTo(x, y, x + radius, y);
  this.closePath();
  if (fill) {
    this.fill();
  }
  if (stroke) {
    this.stroke();
  }
};

CanvasRenderingContext2D.prototype.circle = function (x, y, radius, fill = true, stroke = false) {
  this.beginPath();
  this.arc(x, y, radius, 0, TAU, false);
  if (fill) {
    this.fill();
  }
  if (stroke) {
    this.stroke();
  }
};

function animate(update, paint, resize) {
  let lt = null,
  dt = 0,
  st = 1000 / 60,
  mt = st * 3,
  ft = st / 1000,
  onpaint = t => {
    requestAnimationFrame(onpaint);
    if (lt != null) {
      dt += t - lt;
      while (dt >= st) {
        if (dt < mt) {
          update(ft, t - lt);
        }
        dt -= st;
      }
      if (paint) {
        paint();
      }
    }
    lt = t;
  };
  requestAnimationFrame(onpaint);
  if (resize) {
    window.addEventListener("resize", resize, false);
    resize();
  }
}

// This function is what is called a "Higher-order function", i.e. it is a function that takes a function as a parameter. Think of it as a function that doesn't know how to do the entire job, but it knows how to do some of it, and asks for the rest of the job as a parameter. It's a convenient way to be able to combine different bits of functionality without having to write the same code over and over again.
function FCT(thunk, evt) {
  // for every point that has changed (we don't need to update points that didn't change, and on the touchend event, there is no element for the most recently released finger in the regular "touches" property).
  for (var i = 0; i < evt.changedTouches.length; ++i) {
    // call whatever function we were given. It's going to be one of start/move/end above, and as you can see, we're overriding the default value of the idx parameter.
    thunk(evt.changedTouches[i], evt.changedTouches[i].identifier);
  }
  evt.preventDefault();
}

// we want to wire up all of the event handlers to the Canvas element itself, so that the X and Y coordinates of the events are offset correctly into the container.
function E(elem, k, f, t) {
  if (t) {
    elem.addEventListener(k, FCT.bind(this, f), false);
  } else {
    elem.addEventListener(k, f, false);
  }
}

function beginApp(update, render, resize, elem) {
  let lt = null,
  dt = 0,
  st = 1000 / 60,
  mt = st * 3,
  ft = st / 1000,
  points = {},
  keys = {},
  hover = {},
  onpaint = t => {
    var ticker = requestAnimationFrame(onpaint);
    try {
      if (lt != null) {
        let realDT = t - lt;
        dt += realDT;
        while (dt >= st) {
          if (dt < mt) {
            update(ft, points, keys, hover);
          }
          dt -= st;
        }
        render(realDT);
      }
    } catch (err) {
      cancelAnimationFrame(ticker);
      throw err;
    }
    lt = t;
  };

  function setHover(evt, idx) {
    hover[idx] = {
      x: evt.clientX,
      y: evt.clientY };

  }

  // This function gets called the first time a mouse button is pressed or a new finger touches the screen. The idx value defaults to 10 because mouse clicks don't have an identifier value, but we need one to keep track of mouse clicks separately than touches, which do have identifier values, ending at 9.
  function startPoint(evt, idx = 10) {
    if (idx == 10) {
      evt.preventDefault();
    }
    if (!points[idx]) {
      points[idx] = [];
    }
    var obj = {
      x: evt.clientX,
      y: evt.clientY,
      rx: evt.radiusX || 1,
      ry: evt.radiusY || 1 };


    points[idx].push(obj);
    setHover(evt, idx);
  }

  // This function gets called anytime the mouse or one of the fingers moves. It's just recording the points that were covered, it doesn't do much of anything else.
  function movePoint(evt, idx = 10) {
    if (idx == 10) {
      evt.preventDefault();
    }
    if (points[idx]) {
      startPoint(evt, idx);
    }
    setHover(evt, idx);
  }

  // This function gets called anytime the mouse or one of the fingers is released. It just cleans up our tracking objects, so the next time the mouse button is pressed, it can all start over again.
  function endPoint(evt, idx = 10) {
    if (idx == 10) {
      evt.preventDefault();
    }
    delete points[idx];
    delete hover[idx];
  }

  function keyDown(evt) {
    keys[evt.keyCode] = true;
    keys.shift = evt.shiftKey;
    keys.ctrl = evt.ctrlKey;
    keys.alt = evt.altKey;
  }

  function keyUp(evt) {
    keys[evt.keyCode] = false;
    keys.shift = evt.shiftKey;
    keys.ctrl = evt.ctrlKey;
    keys.alt = evt.altKey;
  }

  E(elem, "mousedown", startPoint);
  E(elem, "mousemove", movePoint);
  E(elem, "mouseup", endPoint);
  E(elem, "touchstart", startPoint, true);
  E(elem, "touchmove", movePoint, true);
  E(elem, "touchend", endPoint, true);

  E(window, "keydown", keyDown);
  E(window, "keyup", keyUp);
  E(window, "resize", resize);

  resize();
  requestAnimationFrame(onpaint);
}

function findEverything() {
  return Array.prototype.
  filter.call(document.querySelectorAll("*"), e => e.id).
  reduce((o, e) => (o[e.id] = e, o), {});
}

function onKeyCode(time, keys, code, thunk, delay = 0.25) {
  if (!keys[code]) {
    onKeyCode.lastSwitch = onKeyCode.lastSwitch || {};
    onKeyCode.lastSwitch[code] = 0;
  }
  if (keys[code] && time - onKeyCode.lastSwitch[code] >= delay) {
    onKeyCode.lastSwitch[code] = time;
    thunk();
  }
}

function createWorker(script, stripFunc = true) {
  if (typeof script === "function") {
    script = script.toString();
  }
  if (stripFunc) {
    script = script.trim();
    let start = script.indexOf('{');
    script = script.substring(start + 1, script.length - 1);
  }

  let blob = new Blob([script], {
    type: "text/javascript" }),

  dataURI = URL.createObjectURL(blob);

  return new Worker(dataURI);
}

// Because of the significant overhead for serializing and deserializing objects between threads, if your updates are simple, but your data is large, then you will probably be able to process more of them on the main thread than you can communicate between threads. But if your processing is expensive for a relatively small amount of data, the serialization overhead might be worth the effort. Also, running expensive updates on the worker thread will keep the UI thread responsive, so even if the updates can only run at, say, 10FPS, the rendering is still running at 60FPS.
class Workerize {
  constructor(func) {
    // First, rebuild the script that defines the class. Since we're dealing with pre-ES6 browsers, we have to use ES5 syntax in the script, or invoke a conversion at a point post-script reconstruction, pre-workerization.

    // start with the constructor function
    let script = func.toString(),
    // strip out the name in a way that Internet Explorer also undrestands (IE doesn't have the Function.name property supported by Chrome and Firefox)
    name = script.match(/function (\w+)\(/)[1];

    // then rebuild the member methods
    for (var k in func.prototype) {
      // We preserve some formatting so it's easy to read the code in the debug view. Yes, you'll be able to see the generated code in your browser's debugger.
      script += `

${name}.prototype.${k} = ${func.prototype[k].toString()};`;
    }

    // Automatically instantiate an object out of the class inside the worker, in such a way that the user-defined function won't be able to get to it.
    script += `

(function(){
  var instance = new ${name}();`;

    // Create a mapper from the events that the class defines to the worker-side postMessage method, to send message to the UI thread that one of the events occured.
    script += `
  if(instance.addEventListener){
    for(var k in instance.listeners) {
      instance.addEventListener(k, function(){
        var args = Array.prototype.slice.call(arguments);
        postMessage(args);
      }.bind(this, k));
    }
  }`;

    // Create a mapper from the worker-side onmessage event, to receive messages from the UI thread that methods were called on the object.
    script += `

  onmessage = function(evt){
    var f = evt.data.shift();
    if(instance[f]){
      instance[f].apply(instance, evt.data);
    }
  }

})();`;

    // The binary-large-object can be used to convert the script from text to a data URI, because workers can only be created from same-origin URIs.
    this.worker = createWorker(script, false);

    // create a mapper from the UI-thread side onmessage event, to receive messages from the worker thread that events occured and pass them on to the UI thread.
    this.listeners = {};
    this.worker.onmessage = e => {
      let f = e.data.shift();
      if (this.listeners[f]) {
        this.listeners[f].forEach(g => g.apply(this, e.data));
      }
    };

    // create mappers from the UI-thread side method calls to the UI-thread side postMessage method, to inform the worker thread that methods were called, with parameters.
    for (var k in func.prototype) {
      // we skip the addEventListener method because we override it in a different way, to be able to pass messages across the thread boundary.
      if (k != "addEventListener") {
        this[k] = function () {
          // convert the varargs array to a real array
          var args = Array.prototype.slice.call(arguments);
          this.worker.postMessage(args);
        }.bind(this, k); // make the name of the function the first argument, no matter what.
      }
    }
  }

  // Adding an event listener just registers a function as being ready to receive events, it doesn't do anything with the worker thread yet.
  addEventListener(evt, thunk) {
    if (!this.listeners[evt]) {
      this.listeners[evt] = [];
    }
    this.listeners[evt].push(thunk);
  }}

console.clear();

// You can save some processing time by making the strips wider, but the fidelity of the image will suffer.
const STRIP_WIDTH = IS_IN_GRID ? 10 : 1;

class Flag {
  // You can change these scaling factors to change the number of folds and the speed of the waive of the flag.




  // This offset factor pushes the shadow to the side to make it look a little more realistic.


  constructor(f) {
    this.image = f;
    this.DOMElement = document.createElement("div");
    this.parts = [];
    this.shadows = [];
    this.t = 0;

    if (this.image.clientWidth > 0) {
      this.onload();
    } else {
      // just in case the image took longer to load than we expected
      this.image.addEventListener(
      "load",
      this.onload.bind(this),
      false);
    }
  }

  onload() {
    // we set the container element's width and height to explicitly match the size of the original image. This makes it easier to calculate the offsets for the image strips.
    this.DOMElement.style.width = `${this.image.clientWidth}px`;
    this.DOMElement.style.height = `${this.image.clientHeight}px`;

    // generate all of the image strips:
    for (var x = 0; x < this.image.clientWidth; x += STRIP_WIDTH) {
      // a DIV element for both the image strip and the shadow strip
      var p = document.createElement("div"),
      s = document.createElement("div");

      this.parts.push(p);
      this.shadows.push(s);

      // set the strip's background image to the src attribute of the original element. If the image loaded, then this should work fine.
      p.style.backgroundImage = `url(${this.image.src})`;

      // put the strip into its place inside of the container.
      s.style.left = p.style.left = `${x}px`;
      s.style.width = p.style.width = `${STRIP_WIDTH}px`;

      // and reset the position of the background image within it, so that they create a thin, tall window over the background image.
      p.style.backgroundPosition = `${-x}px 0`;

      // and of course, put the elements in the container.
      this.DOMElement.appendChild(p);
      this.DOMElement.appendChild(s);
    }

    // finally, we replace the original image with our ersatz image, and copy the class and ID from the image to the new element, so it can pick up some of the positioning attributes of the original image
    this.image.parentElement.replaceChild(this.DOMElement, this.image);
    this.DOMElement.className = this.image.className;
    this.DOMElement.id = this.image.id;
  }

  update(dt) {
    this.t += dt;
  }

  render() {
    this.parts.forEach(function (p, x) {
      let s = this.shadows[x],
      // The waiving shape is a sinusoidal function. We apply the scaling and offset factors here, to change the shape of the sine waive.
      a = (x * Flag.SCALE_I + this.t * Flag.SCALE_T) * Flag.SCALE_A,
      v1 = Math.sin(a),
      v2 = Math.sin(a - Flag.OFFSET_S);

      // both the shadow and the image strip need to be repositioned or else the shadow won't overlap the image correctly.
      s.style.top = p.style.top = `${v1 * 10}px`;

      // Setting the opacity of the shadow strip lets the image underneath blend through, creating the effect of depth on the flag.
      s.style.opacity = (v2 + 1) / 4;
    }.bind(this));
  }}


// find every element tagged with the "flag" CSS class, and turn them into Flag objects
_defineProperty(Flag, "SCALE_I", 1);_defineProperty(Flag, "SCALE_T", 100 / STRIP_WIDTH);_defineProperty(Flag, "SCALE_A", 0.02 * STRIP_WIDTH);_defineProperty(Flag, "OFFSET_S", 1.5 * STRIP_WIDTH);let flags = Array.prototype.map.call(document.querySelectorAll(".flag"), f => new Flag(f));

animate(
dt => flags.forEach(f => f.update(dt)),
() => flags.forEach(f => f.render()));
