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
