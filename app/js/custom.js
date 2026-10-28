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
