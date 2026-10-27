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
    document.querySelectorAll(mobileMQ.matches ? '.inner .media__image' : '.inner.animate-in .media__image').forEach(function (img) {
      const p = Math.max(-1, Math.min(1, progress(img)));
      img.style.transform = 'translate3d(0,' + (-p * AMPLITUDE).toFixed(2) + 'px,0) scale(1.12)';
    });
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
