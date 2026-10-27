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
