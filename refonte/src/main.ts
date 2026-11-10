import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/ibm-plex-sans/latin-700.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "./style.css";
import { initTrip } from "./trip";

function webgl2Available(): boolean {
  try {
    const ctx = document.createElement("canvas").getContext("webgl2");
    ctx?.getExtension("WEBGL_lose_context")?.loseContext();
    return !!ctx;
  } catch {
    return false;
  }
}

const enabled = webgl2Available();
document.documentElement.classList.toggle("has-3d", enabled);
const trip = initTrip({ enabled, reduced: matchMedia("(prefers-reduced-motion: reduce)").matches });

if (enabled) {
  let loading = false;
  const loadScene = () => {
    if (loading) return;
    loading = true;
    document.documentElement.classList.add("is-preparing");
    import("./scene/index")
      .then(({ startScene }) => startScene(document.getElementById("sky") as HTMLCanvasElement, trip))
      .catch((err) => {
        console.warn("Scène 3D indisponible, l'itinéraire reste lisible en liste.", err);
        trip.disable();
        trip.ready();
      });
  };
  // the first attempt to scroll or click starts the loading right away
  for (const ev of ["touchstart", "pointerdown", "wheel", "scroll", "keydown"]) addEventListener(ev, loadScene, { once: true, passive: true });
  // on a desktop, don't wait for it: as soon as the browser is free. On a phone, building the scene
  // keeps the CPU busy for a moment, so it waits for that first gesture.
  if (!trip.coarse) {
    if ("requestIdleCallback" in window) requestIdleCallback(loadScene, { timeout: 1000 });
    else setTimeout(loadScene, 150);
  }
}

// in-page links: the trip is ten screens tall, so instead of scrolling through it (or jumping cold),
// the page dips to night for a moment, moves, and comes back
const FADE_OUT_MS = 200;
document.addEventListener("click", (e) => {
  const link = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
  if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
  const target = document.querySelector<HTMLElement>(link.hash);
  if (!target) return;
  e.preventDefault();
  trip.halt();
  const land = () => {
    target.scrollIntoView({ block: "start" });
    history.pushState(null, "", link.hash);
    // keyboard and screen-reader users continue from the new section
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  };
  if (trip.reduced) return land();
  document.documentElement.classList.add("is-fading");
  setTimeout(() => {
    land();
    requestAnimationFrame(() => document.documentElement.classList.remove("is-fading"));
  }, FADE_OUT_MS);
});

// highlight the section being read in the top bar
const navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>(".bar-nav a"));
const sections = navLinks.map((a) => document.querySelector<HTMLElement>(a.hash)!);
const spy = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      navLinks.forEach((a, i) => a.classList.toggle("is-here", sections[i] === entry.target));
    }
  },
  { rootMargin: "-50% 0px -49% 0px" },
);
sections.forEach((s) => s && spy.observe(s));
