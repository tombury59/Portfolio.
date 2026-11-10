import { ARRIVAL_SCREENS, STOPS, TOTAL_SCREENS, progressAt, screensAt } from "./stops";

/** What the 3D scene reads from the page, and the hooks it plugs back in. */
export interface Trip {
  /** 0 … STOPS - 1, straight from the scroll position */
  progress: number;
  /** pointer position, -1 … 1 on both axes (desktop only), for a little camera parallax */
  pointer: { x: number; y: number };
  /** the stop a click on the rail is flying to, without stopping on the way; null otherwise */
  bound: number | null;
  coarse: boolean;
  reduced: boolean;
  cabin: HTMLElement;
  /** replaced by the scene: called whenever a new frame might be needed */
  wake: () => void;
  /** back to the plain list (no WebGL, or the scene failed to load) */
  disable: () => void;
  /** stop the autopilot and any flight to a stop: the page is about to jump elsewhere */
  halt: () => void;
  /** called by the scene once its first frame is on screen: the trip can start */
  ready: () => void;
}

export function initTrip(opts: { enabled: boolean; reduced: boolean }): Trip {
  const root = document.documentElement;
  const section = document.getElementById("voyage")!;
  const cabin = document.getElementById("cabin")!;
  const welcome = document.getElementById("welcome")!;
  const arrival = document.getElementById("arrival")!;
  const hud = document.querySelector<HTMLElement>("[data-hud]")!;
  const tickets = Array.from(document.querySelectorAll<HTMLElement>(".ticket"));
  const railList = document.querySelector<HTMLOListElement>("#rail ol")!;

  const trip: Trip = {
    progress: 0,
    pointer: { x: 0, y: 0 },
    bound: null,
    coarse: matchMedia("(hover: none) and (pointer: coarse)").matches,
    reduced: opts.reduced,
    cabin,
    wake: () => {},
    disable,
    halt: () => {},
    ready: () => {},
  };

  // screen readers hear the stop change; the tickets themselves stay in the page
  const announcer = document.createElement("p");
  announcer.className = "visually-hidden";
  announcer.setAttribute("aria-live", "polite");
  cabin.appendChild(announcer);

  const railItems = tickets.map((t, k) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.innerHTML = `<span class="rail-dot" aria-hidden="true"></span><span class="rail-name">${t.dataset.name}</span>`;
    btn.setAttribute("aria-label", `Escale ${k + 1} : ${t.dataset.name}`);
    btn.addEventListener("click", () => flyTo(k));
    // formations are the main stops; what was done during them hangs off them, smaller
    li.className = t.dataset.kind === "experience" ? "is-sub" : "is-main";
    li.appendChild(btn);
    railList.appendChild(li);
    return li;
  });

  let on = opts.enabled;
  if (!on) return trip;

  // ---- boarding: until the scene is ready the trip stays parked at take-off ----
  // Scrolling is held (no part of the flight gets skipped), and a click on "Embarquer", the autopilot
  // or a stop waits and goes as soon as the plane can fly.
  let isReady = false;
  let pending: (() => void) | null = null;
  if (scrollY < innerHeight * 0.5) root.classList.add("is-boarding");
  const whenReady = (action: () => void) => {
    if (isReady) return true;
    pending = action;
    root.classList.add("is-preparing");
    return false;
  };
  trip.ready = () => {
    if (isReady) return;
    isReady = true;
    root.classList.remove("is-boarding", "is-preparing");
    const action = pending;
    pending = null;
    action?.();
  };

  // ---- scroll geometry ----
  const unit = CSS.supports("height", "100svh") ? "svh" : "vh";
  section.style.height = `${(TOTAL_SCREENS + 1) * 100}${unit}`;
  let sectionTop = 0;
  let screenH = 1;
  const measure = () => {
    sectionTop = section.getBoundingClientRect().top + scrollY;
    screenH = cabin.clientHeight || innerHeight;
  };
  const screensScrolled = () => (scrollY - sectionTop) / screenH;
  const scrollToScreens = (s: number) =>
    scrollTo({ top: sectionTop + s * screenH, behavior: trip.reduced ? "auto" : "smooth" });

  /** Fly to stop k at the autopilot's speed, forwards or backwards. */
  function flyTo(k: number) {
    if (!whenReady(() => flyTo(k))) return;
    setAutopilot(false);
    const target = k === STOPS - 1 ? TOTAL_SCREENS - ARRIVAL_SCREENS * 0.5 : screensAt(k);
    if (trip.reduced) scrollToScreens(target);
    else startTransit(target, k);
  }

  // ---- page state from the scroll ----
  let current = -1;
  function setCurrent(k: number) {
    if (k === current) return;
    current = k;
    tickets.forEach((t, i) => t.classList.toggle("is-current", i === k));
    railItems.forEach((li, i) => {
      li.classList.toggle("is-current", i === k);
      li.classList.toggle("is-past", i < k);
      li.querySelector("button")!.setAttribute("aria-current", i === k ? "step" : "false");
    });
    const t = tickets[k];
    announcer.textContent = `Escale ${k + 1} sur ${STOPS} : ${t.querySelector("h3")!.textContent}, ${t.querySelector(".ticket-org")!.textContent}`;
  }

  function update() {
    if (!on) return;
    const s = screensScrolled();
    trip.progress = Math.min(STOPS - 1, Math.max(0, progressAt(s)));
    const k = Math.round(trip.progress);
    setCurrent(k);

    const atStart = s < 0.03;
    const landed = s > TOTAL_SCREENS - ARRIVAL_SCREENS + 0.05;
    section.classList.toggle("is-start", atStart);
    section.classList.toggle("is-landed", landed);
    welcome.toggleAttribute("inert", !atStart);
    arrival.toggleAttribute("inert", !landed);

    // flying straight to a stop picked on the rail: no ticket on the way, the destination in the HUD
    const passing = trip.bound !== null && k !== trip.bound;
    section.classList.toggle("is-passing", passing);
    const frac = trip.progress - Math.floor(trip.progress);
    const to = passing ? tickets[trip.bound!].dataset.place : tickets[Math.floor(trip.progress) + 1]?.dataset.place;
    const here = tickets[k].dataset.place;
    hud.textContent =
      passing || (frac > 0.22 && frac < 0.78 && to) ? `EN VOL → ${to!.toUpperCase()}` : `ESCALE ${k + 1}/${STOPS} · ${here!.toUpperCase()}`;
    trip.wake();
  }

  // ---- autopilot ----
  // Desktop: hold the button to fly, let go to stop. Phone: tap to start, tap to pause,
  // and the plane parks at each stop long enough to read the ticket.
  const autoButton = document.getElementById("autopilot") as HTMLButtonElement;
  const autoLabel = autoButton.querySelector(".autopilot-label")!;
  const holdToFly = !trip.coarse;
  const CRUISE = holdToFly ? 0.4 : 0.34; // screens per second: about three to four seconds per hop
  const READ_MS = 2500;
  const IDLE_LABEL = holdToFly ? "Maintenir pour avancer" : "Pilote automatique";
  autoLabel.textContent = IDLE_LABEL;
  let autopilot = false;
  let autoFrame = 0;
  let autoY = 0;
  let autoLast = 0;
  let parkedUntil = 0;
  let parkedAt = 0;

  function setAutopilot(engaged: boolean) {
    if (!isReady) {
      // letting go of the button before the scene is ready cancels the wait
      if (engaged) whenReady(() => setAutopilot(true));
      else pending = null;
      return;
    }
    if (engaged === autopilot) return;
    autopilot = engaged;
    if (engaged) stopTransit();
    autoButton.setAttribute("aria-pressed", String(engaged));
    autoLabel.textContent = engaged ? (holdToFly ? "En vol…" : "Pause") : IDLE_LABEL;
    section.classList.toggle("is-auto", engaged);
    cancelAnimationFrame(autoFrame);
    if (!engaged) return;
    measure();
    // from the arrival, start the trip again
    if (screensScrolled() > TOTAL_SCREENS - ARRIVAL_SCREENS - 0.05) scrollTo(0, sectionTop);
    autoY = Math.max(scrollY, sectionTop);
    autoLast = performance.now();
    parkedUntil = 0;
    // a stop we are already sitting on does not count as reached again
    parkedAt = Math.round(progressAt((autoY - sectionTop) / screenH) * 1000) / 1000;
    parkedAt = Number.isInteger(parkedAt) ? parkedAt : Math.floor(parkedAt);
    autoFrame = requestAnimationFrame(cruise);
  }

  function cruise(now: number) {
    // up to a quarter of a second per frame, so a slow machine is not a slow flight
    const dt = Math.min(0.25, (now - autoLast) / 1000);
    autoLast = now;
    if (now < parkedUntil) {
      autoFrame = requestAnimationFrame(cruise);
      return;
    }
    const end = sectionTop + (TOTAL_SCREENS - ARRIVAL_SCREENS * 0.5) * screenH;
    if (trip.reduced) {
      // no flying: straight to the next stop, then a pause to read
      const next = parkedAt + 1;
      autoY = next >= STOPS - 1 ? end : sectionTop + screensAt(next) * screenH;
      parkedAt = next;
      parkedUntil = now + READ_MS;
    } else {
      autoY += CRUISE * screenH * dt;
      // a few thousandths of tolerance: the scroll position is rounded to whole pixels
      const reached = Math.floor(progressAt((autoY - sectionTop) / screenH) + 0.002);
      // holding the button means "go": no parking then, letting go is the pause
      if (!holdToFly && reached > parkedAt && reached < STOPS - 1) {
        // a new stop: park exactly on it for a moment
        autoY = sectionTop + screensAt(reached) * screenH;
        parkedAt = reached;
        parkedUntil = now + READ_MS;
      }
    }
    autoY = Math.min(autoY, end);
    scrollTo(0, Math.round(autoY));
    if (autoY >= end) setAutopilot(false);
    else autoFrame = requestAnimationFrame(cruise);
  }

  if (holdToFly) {
    autoButton.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      autoButton.setPointerCapture(e.pointerId);
      setAutopilot(true);
    });
    for (const ev of ["pointerup", "pointercancel", "lostpointercapture"]) autoButton.addEventListener(ev, () => setAutopilot(false));
    autoButton.addEventListener("keydown", (e) => {
      if (e.key !== " " && e.key !== "Enter") return;
      e.preventDefault();
      if (!e.repeat) setAutopilot(true);
    });
    autoButton.addEventListener("keyup", (e) => (e.key === " " || e.key === "Enter") && setAutopilot(false));
    addEventListener("blur", () => setAutopilot(false));
  } else {
    autoButton.addEventListener("click", () => setAutopilot(!autopilot));
  }
  // ---- transit: a click on a stop flies there at the cruising speed ----
  const MAX_TRANSIT_S = 8; // a far jump speeds up just enough to never take longer than this
  let transitFrame = 0;
  let transitFrom = 0;
  let transitGoal = 0;
  let transitStart = 0;
  let transitDuration = 0;

  function startTransit(targetScreens: number, stop: number) {
    stopTransit();
    trip.bound = stop;
    measure();
    transitFrom = scrollY;
    transitGoal = sectionTop + targetScreens * screenH;
    const distance = Math.abs(transitGoal - transitFrom);
    transitDuration = Math.min(MAX_TRANSIT_S, distance / (CRUISE * screenH)) * 1000;
    transitStart = performance.now();
    transitFrame = requestAnimationFrame(transit);
  }
  // position from the time elapsed, not from frame to frame: the same speed even when frames are slow
  function transit(now: number) {
    const f = transitDuration > 0 ? Math.min(1, (now - transitStart) / transitDuration) : 1;
    scrollTo(0, Math.round(transitFrom + (transitGoal - transitFrom) * f));
    if (f < 1) transitFrame = requestAnimationFrame(transit);
    else stopTransit();
  }
  function stopTransit() {
    cancelAnimationFrame(transitFrame);
    if (trip.bound === null) return;
    trip.bound = null;
    update();
  }

  // the visitor takes the controls back as soon as they scroll themselves
  const takeOver = () => {
    setAutopilot(false);
    stopTransit();
  };
  trip.halt = takeOver;
  addEventListener("wheel", takeOver, { passive: true });
  addEventListener("touchstart", (e) => !(e.target as Element).closest?.(".autopilot") && takeOver(), { passive: true });
  addEventListener("keydown", (e) => {
    if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(e.key) && e.target !== autoButton) takeOver();
  });

  // "Embarquer": on a phone the autopilot takes over; on a desktop, a smooth hop to the first stop,
  // and the button bottom right is there to hold
  document.getElementById("board")!.addEventListener("click", () => (holdToFly ? flyTo(1) : setAutopilot(true)));
  document.getElementById("again")!.addEventListener("click", () => {
    setAutopilot(false);
    scrollToScreens(0);
  });

  if (!trip.coarse) {
    addEventListener(
      "pointermove",
      (e) => {
        trip.pointer.x = (e.clientX / innerWidth) * 2 - 1;
        trip.pointer.y = (e.clientY / innerHeight) * 2 - 1;
        trip.wake();
      },
      { passive: true },
    );
  }

  function disable() {
    on = false;
    root.classList.remove("has-3d", "scene-on");
    section.style.height = "";
    tickets.forEach((t) => t.classList.remove("is-current"));
    welcome.removeAttribute("inert");
    arrival.removeAttribute("inert");
  }

  // first measurement on the next frame, once the new section height has been laid out (no forced reflow)
  requestAnimationFrame(() => {
    measure();
    update();
  });
  addEventListener("resize", () => {
    measure();
    update();
  });
  addEventListener("load", () => {
    measure();
    update();
  });
  addEventListener("scroll", update, { passive: true });
  return trip;
}
