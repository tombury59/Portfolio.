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
    import("./scene/index")
      .then(({ startScene }) => startScene(document.getElementById("sky") as HTMLCanvasElement, trip))
      .catch((err) => {
        console.warn("Scène 3D indisponible, l'itinéraire reste lisible en liste.", err);
        trip.disable();
      });
  };
  if (trip.coarse) {
    // on a phone, building the scene keeps the CPU busy for a moment: wait until the visitor does something
    for (const ev of ["touchstart", "pointerdown", "scroll", "keydown"]) addEventListener(ev, loadScene, { once: true, passive: true });
  } else if ("requestIdleCallback" in window) {
    requestIdleCallback(loadScene, { timeout: 1000 });
  } else {
    setTimeout(loadScene, 150);
  }
}

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
