/* vendor/typed.min.js */
/*!
 * 
 *   typed.js - A JavaScript Typing Animation Library
 *   Author: Matt Boldt <me@mattboldt.com>
 *   Version: v2.0.12
 *   Url: https://github.com/mattboldt/typed.js
 *   License(s): MIT
 * 
 */
(function(t,e){"object"==typeof exports&&"object"==typeof module?module.exports=e():"function"==typeof define&&define.amd?define([],e):"object"==typeof exports?exports.Typed=e():t.Typed=e()})(this,function(){return function(t){function e(n){if(s[n])return s[n].exports;var i=s[n]={exports:{},id:n,loaded:!1};return t[n].call(i.exports,i,i.exports,e),i.loaded=!0,i.exports}var s={};return e.m=t,e.c=s,e.p="",e(0)}([function(t,e,s){"use strict";function n(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}Object.defineProperty(e,"__esModule",{value:!0});var i=function(){function t(t,e){for(var s=0;s<e.length;s++){var n=e[s];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}return function(e,s,n){return s&&t(e.prototype,s),n&&t(e,n),e}}(),r=s(1),o=s(3),a=function(){function t(e,s){n(this,t),r.initializer.load(this,s,e),this.begin()}return i(t,[{key:"toggle",value:function(){this.pause.status?this.start():this.stop()}},{key:"stop",value:function(){this.typingComplete||this.pause.status||(this.toggleBlinking(!0),this.pause.status=!0,this.options.onStop(this.arrayPos,this))}},{key:"start",value:function(){this.typingComplete||this.pause.status&&(this.pause.status=!1,this.pause.typewrite?this.typewrite(this.pause.curString,this.pause.curStrPos):this.backspace(this.pause.curString,this.pause.curStrPos),this.options.onStart(this.arrayPos,this))}},{key:"destroy",value:function(){this.reset(!1),this.options.onDestroy(this)}},{key:"reset",value:function(){var t=arguments.length<=0||void 0===arguments[0]||arguments[0];clearInterval(this.timeout),this.replaceText(""),this.cursor&&this.cursor.parentNode&&(this.cursor.parentNode.removeChild(this.cursor),this.cursor=null),this.strPos=0,this.arrayPos=0,this.curLoop=0,t&&(this.insertCursor(),this.options.onReset(this),this.begin())}},{key:"begin",value:function(){var t=this;this.options.onBegin(this),this.typingComplete=!1,this.shuffleStringsIfNeeded(this),this.insertCursor(),this.bindInputFocusEvents&&this.bindFocusEvents(),this.timeout=setTimeout(function(){t.currentElContent&&0!==t.currentElContent.length?t.backspace(t.currentElContent,t.currentElContent.length):t.typewrite(t.strings[t.sequence[t.arrayPos]],t.strPos)},this.startDelay)}},{key:"typewrite",value:function(t,e){var s=this;this.fadeOut&&this.el.classList.contains(this.fadeOutClass)&&(this.el.classList.remove(this.fadeOutClass),this.cursor&&this.cursor.classList.remove(this.fadeOutClass));var n=this.humanizer(this.typeSpeed),i=1;return this.pause.status===!0?void this.setPauseStatus(t,e,!0):void(this.timeout=setTimeout(function(){e=o.htmlParser.typeHtmlChars(t,e,s);var n=0,r=t.substr(e);if("^"===r.charAt(0)&&/^\^\d+/.test(r)){var a=1;r=/\d+/.exec(r)[0],a+=r.length,n=parseInt(r),s.temporaryPause=!0,s.options.onTypingPaused(s.arrayPos,s),t=t.substring(0,e)+t.substring(e+a),s.toggleBlinking(!0)}if("`"===r.charAt(0)){for(;"`"!==t.substr(e+i).charAt(0)&&(i++,!(e+i>t.length)););var u=t.substring(0,e),l=t.substring(u.length+1,e+i),c=t.substring(e+i+1);t=u+l+c,i--}s.timeout=setTimeout(function(){s.toggleBlinking(!1),e>=t.length?s.doneTyping(t,e):s.keepTyping(t,e,i),s.temporaryPause&&(s.temporaryPause=!1,s.options.onTypingResumed(s.arrayPos,s))},n)},n))}},{key:"keepTyping",value:function(t,e,s){0===e&&(this.toggleBlinking(!1),this.options.preStringTyped(this.arrayPos,this)),e+=s;var n=t.substr(0,e);this.replaceText(n),this.typewrite(t,e)}},{key:"doneTyping",value:function(t,e){var s=this;this.options.onStringTyped(this.arrayPos,this),this.toggleBlinking(!0),this.arrayPos===this.strings.length-1&&(this.complete(),this.loop===!1||this.curLoop===this.loopCount)||(this.timeout=setTimeout(function(){s.backspace(t,e)},this.backDelay))}},{key:"backspace",value:function(t,e){var s=this;if(this.pause.status===!0)return void this.setPauseStatus(t,e,!1);if(this.fadeOut)return this.initFadeOut();this.toggleBlinking(!1);var n=this.humanizer(this.backSpeed);this.timeout=setTimeout(function(){e=o.htmlParser.backSpaceHtmlChars(t,e,s);var n=t.substr(0,e);if(s.replaceText(n),s.smartBackspace){var i=s.strings[s.arrayPos+1];i&&n===i.substr(0,e)?s.stopNum=e:s.stopNum=0}e>s.stopNum?(e--,s.backspace(t,e)):e<=s.stopNum&&(s.arrayPos++,s.arrayPos===s.strings.length?(s.arrayPos=0,s.options.onLastStringBackspaced(),s.shuffleStringsIfNeeded(),s.begin()):s.typewrite(s.strings[s.sequence[s.arrayPos]],e))},n)}},{key:"complete",value:function(){this.options.onComplete(this),this.loop?this.curLoop++:this.typingComplete=!0}},{key:"setPauseStatus",value:function(t,e,s){this.pause.typewrite=s,this.pause.curString=t,this.pause.curStrPos=e}},{key:"toggleBlinking",value:function(t){this.cursor&&(this.pause.status||this.cursorBlinking!==t&&(this.cursorBlinking=t,t?this.cursor.classList.add("typed-cursor--blink"):this.cursor.classList.remove("typed-cursor--blink")))}},{key:"humanizer",value:function(t){return Math.round(Math.random()*t/2)+t}},{key:"shuffleStringsIfNeeded",value:function(){this.shuffle&&(this.sequence=this.sequence.sort(function(){return Math.random()-.5}))}},{key:"initFadeOut",value:function(){var t=this;return this.el.className+=" "+this.fadeOutClass,this.cursor&&(this.cursor.className+=" "+this.fadeOutClass),setTimeout(function(){t.arrayPos++,t.replaceText(""),t.strings.length>t.arrayPos?t.typewrite(t.strings[t.sequence[t.arrayPos]],0):(t.typewrite(t.strings[0],0),t.arrayPos=0)},this.fadeOutDelay)}},{key:"replaceText",value:function(t){this.attr?this.el.setAttribute(this.attr,t):this.isInput?this.el.value=t:"html"===this.contentType?this.el.innerHTML=t:this.el.textContent=t}},{key:"bindFocusEvents",value:function(){var t=this;this.isInput&&(this.el.addEventListener("focus",function(e){t.stop()}),this.el.addEventListener("blur",function(e){t.el.value&&0!==t.el.value.length||t.start()}))}},{key:"insertCursor",value:function(){this.showCursor&&(this.cursor||(this.cursor=document.createElement("span"),this.cursor.className="typed-cursor",this.cursor.setAttribute("aria-hidden",!0),this.cursor.innerHTML=this.cursorChar,this.el.parentNode&&this.el.parentNode.insertBefore(this.cursor,this.el.nextSibling)))}}]),t}();e["default"]=a,t.exports=e["default"]},function(t,e,s){"use strict";function n(t){return t&&t.__esModule?t:{"default":t}}function i(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}Object.defineProperty(e,"__esModule",{value:!0});var r=Object.assign||function(t){for(var e=1;e<arguments.length;e++){var s=arguments[e];for(var n in s)Object.prototype.hasOwnProperty.call(s,n)&&(t[n]=s[n])}return t},o=function(){function t(t,e){for(var s=0;s<e.length;s++){var n=e[s];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}return function(e,s,n){return s&&t(e.prototype,s),n&&t(e,n),e}}(),a=s(2),u=n(a),l=function(){function t(){i(this,t)}return o(t,[{key:"load",value:function(t,e,s){if("string"==typeof s?t.el=document.querySelector(s):t.el=s,t.options=r({},u["default"],e),t.isInput="input"===t.el.tagName.toLowerCase(),t.attr=t.options.attr,t.bindInputFocusEvents=t.options.bindInputFocusEvents,t.showCursor=!t.isInput&&t.options.showCursor,t.cursorChar=t.options.cursorChar,t.cursorBlinking=!0,t.elContent=t.attr?t.el.getAttribute(t.attr):t.el.textContent,t.contentType=t.options.contentType,t.typeSpeed=t.options.typeSpeed,t.startDelay=t.options.startDelay,t.backSpeed=t.options.backSpeed,t.smartBackspace=t.options.smartBackspace,t.backDelay=t.options.backDelay,t.fadeOut=t.options.fadeOut,t.fadeOutClass=t.options.fadeOutClass,t.fadeOutDelay=t.options.fadeOutDelay,t.isPaused=!1,t.strings=t.options.strings.map(function(t){return t.trim()}),"string"==typeof t.options.stringsElement?t.stringsElement=document.querySelector(t.options.stringsElement):t.stringsElement=t.options.stringsElement,t.stringsElement){t.strings=[],t.stringsElement.style.display="none";var n=Array.prototype.slice.apply(t.stringsElement.children),i=n.length;if(i)for(var o=0;o<i;o+=1){var a=n[o];t.strings.push(a.innerHTML.trim())}}t.strPos=0,t.arrayPos=0,t.stopNum=0,t.loop=t.options.loop,t.loopCount=t.options.loopCount,t.curLoop=0,t.shuffle=t.options.shuffle,t.sequence=[],t.pause={status:!1,typewrite:!0,curString:"",curStrPos:0},t.typingComplete=!1;for(var o in t.strings)t.sequence[o]=o;t.currentElContent=this.getCurrentElContent(t),t.autoInsertCss=t.options.autoInsertCss,this.appendAnimationCss(t)}},{key:"getCurrentElContent",value:function(t){var e="";return e=t.attr?t.el.getAttribute(t.attr):t.isInput?t.el.value:"html"===t.contentType?t.el.innerHTML:t.el.textContent}},{key:"appendAnimationCss",value:function(t){var e="data-typed-js-css";if(t.autoInsertCss&&(t.showCursor||t.fadeOut)&&!document.querySelector("["+e+"]")){var s=document.createElement("style");s.type="text/css",s.setAttribute(e,!0);var n="";t.showCursor&&(n+="\n        .typed-cursor{\n          opacity: 1;\n        }\n        .typed-cursor.typed-cursor--blink{\n          animation: typedjsBlink 0.7s infinite;\n          -webkit-animation: typedjsBlink 0.7s infinite;\n                  animation: typedjsBlink 0.7s infinite;\n        }\n        @keyframes typedjsBlink{\n          50% { opacity: 0.0; }\n        }\n        @-webkit-keyframes typedjsBlink{\n          0% { opacity: 1; }\n          50% { opacity: 0.0; }\n          100% { opacity: 1; }\n        }\n      "),t.fadeOut&&(n+="\n        .typed-fade-out{\n          opacity: 0;\n          transition: opacity .25s;\n        }\n        .typed-cursor.typed-cursor--blink.typed-fade-out{\n          -webkit-animation: 0;\n          animation: 0;\n        }\n      "),0!==s.length&&(s.innerHTML=n,document.body.appendChild(s))}}}]),t}();e["default"]=l;var c=new l;e.initializer=c},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var s={strings:["These are the default values...","You know what you should do?","Use your own!","Have a great day!"],stringsElement:null,typeSpeed:0,startDelay:0,backSpeed:0,smartBackspace:!0,shuffle:!1,backDelay:700,fadeOut:!1,fadeOutClass:"typed-fade-out",fadeOutDelay:500,loop:!1,loopCount:1/0,showCursor:!0,cursorChar:"|",autoInsertCss:!0,attr:null,bindInputFocusEvents:!1,contentType:"html",onBegin:function(t){},onComplete:function(t){},preStringTyped:function(t,e){},onStringTyped:function(t,e){},onLastStringBackspaced:function(t){},onTypingPaused:function(t,e){},onTypingResumed:function(t,e){},onReset:function(t){},onStop:function(t,e){},onStart:function(t,e){},onDestroy:function(t){}};e["default"]=s,t.exports=e["default"]},function(t,e){"use strict";function s(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}Object.defineProperty(e,"__esModule",{value:!0});var n=function(){function t(t,e){for(var s=0;s<e.length;s++){var n=e[s];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}return function(e,s,n){return s&&t(e.prototype,s),n&&t(e,n),e}}(),i=function(){function t(){s(this,t)}return n(t,[{key:"typeHtmlChars",value:function(t,e,s){if("html"!==s.contentType)return e;var n=t.substr(e).charAt(0);if("<"===n||"&"===n){var i="";for(i="<"===n?">":";";t.substr(e+1).charAt(0)!==i&&(e++,!(e+1>t.length)););e++}return e}},{key:"backSpaceHtmlChars",value:function(t,e,s){if("html"!==s.contentType)return e;var n=t.substr(e).charAt(0);if(">"===n||";"===n){var i="";for(i=">"===n?"<":"&";t.substr(e-1).charAt(0)!==i&&(e--,!(e<0)););e--}return e}}]),t}();e["default"]=i;var r=new i;e.htmlParser=r}])});
;
/* menu.js */
// Desktop navigation: menu overlay and the About / Works / Contact panels.
// Plain-JS port of the template's jQuery code (same classes, same timings), so the page no longer ships jQuery.
(function () {
  const body = document.body;
  const main = document.getElementById('main');
  const menu = document.getElementById('menu');
  const menuClose = document.getElementById('menu-close');
  if (!main || !menu || !menuClose) return;

  function on(el, handler) {
    if (!el) return;
    el.addEventListener('click', function (e) {
      e.preventDefault();
      handler();
    });
  }
  function later(ms, fn) { setTimeout(fn, ms); }

  document.querySelectorAll('img, a').forEach(function (el) {
    el.addEventListener('dragstart', function (e) { e.preventDefault(); });
  });

  on(document.getElementById('menu-trigger'), function () {
    menu.classList.add('animate-in');
    later(1200, function () {
      menuClose.classList.add('is-scaled-up');
      body.classList.add('overflow-hidden');
      main.classList.add('menu-is-visible');
    });
  });

  function closeMenu() {
    menu.classList.add('animate-out');
    later(700, function () { main.classList.remove('menu-is-visible'); });
    later(1200, function () {
      menu.classList.remove('animate-in', 'animate-out');
      menuClose.classList.remove('is-scaled-up');
      body.classList.remove('overflow-hidden');
    });
  }
  on(menuClose, closeMenu);
  on(document.getElementById('home-trigger'), closeMenu);

  // Menu link to a section: slide the menu and the hero out
  menu.querySelectorAll('.inner-link').forEach(function (link) {
    on(link, function () {
      main.classList.add('move-out');
      menu.classList.add('move-out');
      later(2100, function () {
        menu.classList.remove('animate-in', 'animate-out', 'move-out');
        menuClose.classList.remove('is-scaled-up');
        main.classList.remove('menu-is-visible', 'move-out');
        body.classList.add('overflow-hidden');
      });
    });
  });

  // Section close button: bring the hero back
  document.querySelectorAll('.inner .section-close').forEach(function (btn) {
    on(btn, function () {
      later(900, function () { main.classList.add('move-in'); });
      later(2000, function () {
        main.classList.remove('move-in');
        body.classList.remove('overflow-hidden');
      });
    });
  });

  // Open / close one section panel
  ['about', 'works', 'contact'].forEach(function (id) {
    const section = document.getElementById(id);
    const close = document.getElementById(id + '-close');
    if (!section || !close) return;

    on(document.getElementById(id + '-trigger'), function () {
      later(600, function () { section.classList.add('animate-in'); });
      later(1200, function () { close.classList.add('is-scaled-up'); });
    });
    on(close, function () {
      section.classList.add('animate-out');
      later(600, function () { section.classList.add('to-back'); });
      later(2000, function () {
        section.classList.remove('animate-in', 'animate-out', 'to-back');
        close.classList.remove('is-scaled-up');
      });
    });
  });
})();
;
/* custom.js */
// ------------------------------------------------
// Hero: typing headline (Typed.js) + animated triangles (particles.js, desktop only)
// ------------------------------------------------
"use strict";

// matchMedia, not innerWidth: reading innerWidth forces a layout while the page is still rendering
const isPhone = window.matchMedia('(max-width: 768px)').matches;

// Start as soon as the DOM is ready (scripts are deferred)
initTyped();
initParticles();

// Typed.js
function initTyped() {
  if (!document.querySelector(".animated-headline") || typeof Typed === 'undefined') return;

  const startTyping = function () {
    new Typed('#typed', {
      stringsElement: '#typed-strings',
      loop: true,
      typeSpeed: 40,
      backSpeed: 20,
      backDelay: 2500
    });
  };

  // Desktop: start right away.
  if (!isPhone) { startTyping(); return; }

  // Phones: index.html already shows a headline as plain text, so the first paint
  // does not wait for this script. Once the page has finished loading, erase it, then type.
  const el = document.getElementById('typed');
  const eraseThenType = function () {
    setTimeout(function () {
      let text = el.textContent;
      const timer = setInterval(function () {
        text = text.slice(0, -1);
        el.textContent = text;
        if (!text) { clearInterval(timer); startTyping(); }
      }, 22);
    }, 700);
  };
  if (document.readyState === 'complete') eraseThenType();
  else window.addEventListener('load', eraseThenType);
}

// particles.js: desktop only, downloaded after the page has loaded so it never competes with the first paint
function initParticles() {
  if (isPhone || !document.getElementById('triangles-js')) return;

  const start = function () {
    const script = document.createElement('script');
    script.src = document.querySelector('script[data-particles]').getAttribute('data-particles');
    script.onload = drawTriangles;
    document.head.appendChild(script);
  };
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
}

function drawTriangles() {
  // Front layer: white triangles linked by lines, reacting to the mouse
  particlesJS('triangles-js', {
    particles: {
      number: { value: 33, density: { enable: true, value_area: 1420.4657549380909 } },
      color: { value: "#ffffff" },
      shape: { type: "triangle", stroke: { width: 0, color: "#000000" }, polygon: { nb_sides: 5 } },
      opacity: { value: 0.06313181133058181, random: false, anim: { enable: false, speed: 1, opacity_min: 0.1, sync: false } },
      size: { value: 11.83721462448409, random: true, anim: { enable: false, speed: 40, size_min: 0.1, sync: false } },
      line_linked: { enable: true, distance: 150, color: "#ffffff", opacity: 0.4, width: 1 },
      move: {
        enable: true, speed: 4, direction: "none", random: false, straight: false, out_mode: "out", bounce: false,
        attract: { enable: false, rotateX: 600, rotateY: 1200 }
      }
    },
    interactivity: {
      detect_on: "canvas",
      events: { onhover: { enable: true, mode: "repulse" }, onclick: { enable: true, mode: "push" }, resize: true },
      modes: {
        grab: { distance: 400, line_linked: { opacity: 1 } },
        bubble: { distance: 400, size: 40, duration: 2, opacity: 8, speed: 3 },
        repulse: { distance: 200, duration: 0.4 },
        push: { particles_nb: 4 },
        remove: { particles_nb: 2 }
      }
    },
    retina_detect: true
  });

  // Back layer (depth parallax, lighter and slower)
  particlesJS('triangles-back', {
    particles: {
      number: { value: 28, density: { enable: true, value_area: 1420 } },
      color: { value: "#4d84cc" },
      shape: { type: "triangle" },
      opacity: { value: 0.14, random: true },
      size: { value: 6, random: true },
      line_linked: { enable: false },
      move: { enable: true, speed: 1.2, direction: "none", random: true, straight: false, out_mode: "out" }
    },
    interactivity: {
      detect_on: "canvas",
      events: { onhover: { enable: false }, onclick: { enable: false }, resize: true }
    },
    retina_detect: true
  });
}
;
/* parallax.js */
// Parallax: hero (mouse) + inner sections (scroll)
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // --- Hero: mouse parallax with smoothing ---
  const main = document.getElementById('main');
  const heroImage = document.querySelector('.mainmedia__image');
  const heroMedia = document.querySelector('.main__media');
  const layers = document.querySelectorAll('.main .parallax-layer');
  const canHover = window.matchMedia('(hover: hover)').matches;

  if (main && canHover) {
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    let running = false;

    function frame() {
      cur.x += (target.x - cur.x) * 0.08;
      cur.y += (target.y - cur.y) * 0.08;

      if (heroImage) {
        heroImage.style.transform =
          'translate3d(' + (-cur.x * 14).toFixed(2) + 'px,' + (-cur.y * 14).toFixed(2) + 'px,0) scale(1.12)';
      }
      if (heroMedia) {
        heroMedia.style.backgroundPosition =
          'calc(50% + ' + (cur.x * -22).toFixed(2) + 'px) calc(50% + ' + (cur.y * -22).toFixed(2) + 'px)';
      }
      layers.forEach(function (l) {
        const d = parseFloat(l.dataset.depth) || 1;
        l.style.transform =
          'translate3d(' + (-cur.x * 16 * d).toFixed(2) + 'px,' + (-cur.y * 16 * d).toFixed(2) + 'px,0)';
      });

      if (Math.abs(target.x - cur.x) > 0.001 || Math.abs(target.y - cur.y) > 0.001) {
        requestAnimationFrame(frame);
      } else {
        running = false;
      }
    }

    window.addEventListener('mousemove', function (e) {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.y = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!running) {
        running = true;
        requestAnimationFrame(frame);
      }
    }, { passive: true });
  }

  // --- Inner sections: scroll parallax on media images ---
  const mobileMQ = window.matchMedia('(max-width: 768px)');
  const AMPLITUDE = 50; // px of travel; image is scaled 1.12 to avoid gaps
  let ticking = false;

  function progress(img) {
    const row = img.closest('.row');
    const content = row && row.querySelector('.inner__content');
    // Content column scrolls itself (About / Contact): use its scroll progress
    if (content && content.scrollHeight > content.clientHeight + 1) {
      return content.scrollTop / (content.scrollHeight - content.clientHeight) - 0.5;
    }
    // Otherwise the whole section scrolls (Works): use position relative to viewport
    const r = img.parentElement.getBoundingClientRect();
    return (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
  }

  function update() {
    ticking = false;
    // Phones: only images near the viewport (sections below are skipped by content-visibility; measuring them would force their layout)
    const imgs = Array.from(mobileMQ.matches ? nearImages : document.querySelectorAll('.inner.animate-in .media__image'));
    // measure everything first, then write: interleaving reads and writes forces a layout per image
    const shifts = imgs.map(function (img) { return Math.max(-1, Math.min(1, progress(img))); });
    imgs.forEach(function (img, i) {
      img.style.transform = 'translate3d(0,' + (-shifts[i] * AMPLITUDE).toFixed(2) + 'px,0) scale(1.12)';
    });
  }

  // Images currently near the viewport (phones)
  const nearImages = new Set();
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) nearImages.add(en.target); else nearImages.delete(en.target);
      });
      onScroll();
    }, { rootMargin: '300px 0px' });
    document.querySelectorAll('.inner .media__image').forEach(function (img) { io.observe(img); });
  }
  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  // scroll events don't bubble: capture them from any inner scroller
  document.addEventListener('scroll', onScroll, { capture: true, passive: true });
  window.addEventListener('resize', onScroll);
})();
;
/* mobile.js */
// Mobile mode (<= 768px): single scrolling page, floating dock, reveal on scroll
(function () {
  const mq = window.matchMedia('(max-width: 768px)');
  const dock = document.querySelector('.dock');
  if (!dock) return;

  const items = Array.from(dock.querySelectorAll('.dock__item'));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Smooth scroll to the section
  items.forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (!mq.matches) return;
      e.preventDefault();
      const target = document.getElementById(a.dataset.target);
      if (target) target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });

  // Highlight the section currently in the middle of the screen
  function setActive(id) {
    items.forEach(function (a) { a.classList.toggle('is-active', a.dataset.target === id); });
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) setActive(en.target.id); });
    }, { rootMargin: '-50% 0px -50% 0px' });
    items.forEach(function (a) {
      const sec = document.getElementById(a.dataset.target);
      if (sec) io.observe(sec);
    });
  }

  // Reveal-on-scroll for content blocks
  if (!('IntersectionObserver' in window) || reduceMotion) return;
  const selector = [
    '.inner h2', '.inner .section__subtitle', '.inner .section__text', '.inner .skillbar',
    '.inner .features__title', '.inner .features__text', '.inner .Certification__ex',
    '.inner .project-container', '.inner blockquote', '.inner .media__container',
    '.inner .contact-data__text', '.inner .form'
  ].join(',');

  const ro = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add('is-in');
        ro.unobserve(en.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  document.querySelectorAll(selector).forEach(function (el) {
    // skip nested elements: their ancestor already animates
    if (el.parentElement && el.parentElement.closest('.js-reveal')) return;
    el.classList.add('js-reveal');
    ro.observe(el);
  });
})();
;
/* contact.js */
// Email links: open the mail app (mailto) AND copy the address,
// so contacting still works when no mail client is configured.
(function () {
  let toast;
  let hideTimer;

  function showToast(message) {
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'mail-toast';
      toast.setAttribute('role', 'status');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    // restart the transition if already visible
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () { toast.classList.remove('show'); }, 4000);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      const input = document.createElement('input');
      input.value = text;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      try {
        document.execCommand('copy') ? resolve() : reject();
      } catch (e) {
        reject(e);
      }
      document.body.removeChild(input);
    });
  }

  document.addEventListener('click', function (e) {
    const link = e.target.closest && e.target.closest('a[href^="mailto:"]');
    if (!link) return;
    const address = link.getAttribute('href').replace(/^mailto:/i, '').split('?')[0];
    copyText(address).then(function () {
      showToast('Adresse copiée : ' + address);
    }, function () {
      showToast('Écris-moi à ' + address);
    });
    // no preventDefault: the mailto still opens the mail app when there is one
  });
})();
