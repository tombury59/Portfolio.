import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  RingGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";
import { STOPS, STOP_XZ } from "../stops";
import type { Trip } from "../trip";
import { buildWorld, FAYE, heightAt, ramp, seeded, SITES, wetness } from "./world";
import { blackfox, campus, chateau, church, guinguette, home, lycee, office, relay, windmill, type Landmark } from "./landmarks";
import { buildPaperPlane, buildTrail } from "./plane";

const NIGHT = new Color("#0a1430");
const UP = new Vector3(0, 1, 0);

/** How high the plane passes over each stop (the mast and the tower need more room). Take-off and landing are on the ground. */
const PASS_HEIGHT = [0.75, 6, 5.5, 9.5, 6, 5.5, 6, 0.75];

/** Frame-rate independent approach: the fraction of the way to cover this frame. */
const approach = (rate: number, dt: number) => 1 - Math.exp(-rate * dt);

function skyDome() {
  const material = new ShaderMaterial({
    side: BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      zenith: { value: new Color("#050a1c") },
      horizon: { value: new Color("#1e3a8a") },
      glow: { value: new Color("#4d84cc") },
    },
    vertexShader: /* glsl */ `
      varying float vHeight;
      void main() {
        vHeight = normalize(position).y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 zenith, horizon, glow;
      varying float vHeight;
      void main() {
        float up = clamp(vHeight, 0.0, 1.0);
        vec3 c = mix(horizon, zenith, pow(up, 0.45));
        c += glow * 0.35 * exp(-abs(vHeight) * 14.0);
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const dome = new Mesh(new SphereGeometry(500, 32, 16), material);
  dome.renderOrder = -1;
  return dome;
}

/** A soft round dot, so the route points are not squares. */
function dotTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.5, "rgba(255,255,255,0.9)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  return new CanvasTexture(c);
}

function stars() {
  const rand = seeded(7);
  const n = 1400;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = rand() * Math.PI * 2;
    const y = 0.08 + rand() * 0.92; // upper half of the sky only
    const r = Math.sqrt(1 - y * y);
    pos.set([Math.cos(a) * r * 450, y * 450, Math.sin(a) * r * 450], i * 3);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(pos, 3));
  return new Points(g, new PointsMaterial({ color: "#dfe8ff", size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.85 }));
}

/** A tall column of light over each stop, and a ring on the ground. */
function beacon(x: number, z: number) {
  const g = new Group();
  g.position.set(x, heightAt(x, z) + 0.05, z);
  const columnMat = new MeshBasicMaterial({ color: "#4d84cc", transparent: true, opacity: 0.1, blending: AdditiveBlending, depthWrite: false });
  const column = new Mesh(new CylinderGeometry(0.5, 0.5, 70, 16, 1, true).translate(0, 35, 0), columnMat);
  const ringMat = new MeshBasicMaterial({ color: "#7fb0ec", transparent: true, opacity: 0.5, blending: AdditiveBlending, depthWrite: false });
  const ring = new Mesh(new RingGeometry(1.7, 2.0, 48).rotateX(-Math.PI / 2), ringMat);
  ring.position.y = 0.08;
  g.add(column, ring);
  return { group: g, columnMat, ring, ringMat };
}

export function startScene(canvas: HTMLCanvasElement, trip: Trip) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.outputColorSpace = SRGBColorSpace;
  let pixelRatio = Math.min(devicePixelRatio || 1, trip.coarse ? 1.5 : 2);
  renderer.setPixelRatio(pixelRatio);

  const scene = new Scene();
  scene.background = NIGHT;
  scene.fog = new Fog(NIGHT, 70, 240);
  const camera = new PerspectiveCamera(50, 1, 0.1, 1200);

  // moonlight from the north-west, a cool sky above and the dark ground below
  scene.add(new HemisphereLight("#7d9be0", "#0b1326", 1.5));
  const moon = new DirectionalLight("#cfdcff", 1.3);
  moon.position.set(-60, 90, -80);
  scene.add(moon);

  const sky = new Group();
  sky.add(skyDome(), stars());
  const moonDisc = new Mesh(new SphereGeometry(9, 24, 16), new MeshBasicMaterial({ color: "#eef2ff", fog: false }));
  moonDisc.position.set(-150, 170, -330);
  sky.add(moonDisc);
  scene.add(sky);

  scene.add(buildWorld());

  // landmarks
  const at = (k: number) => STOP_XZ[k];
  const landmarks: Landmark[] = [
    lycee(...SITES.bac),
    lycee(...SITES.lycee),
    chateau(...SITES.chateau),
    guinguette(...at(2)),
    relay(...at(3)),
    campus(...at(4)),
    blackfox(...at(5)),
    office(...SITES.negocom),
    home(...SITES.home),
    church(FAYE[0] - 2, FAYE[1] - 1),
    // moulins caviers on the high ground, wherever there is dry land for them
    ...([
      [-26, -30],
      [52, -22],
      [-52, 66],
      [26, 62],
      [-44, 4],
      [70, 34],
    ] as [number, number][])
      .filter(([x, z]) => wetness(x, z) === 0)
      .map(([x, z], i) => windmill(x, z, i * 0.9)),
  ];
  for (const l of landmarks) scene.add(l.object);
  const animated = landmarks.filter((l) => l.tick);

  const beacons = STOP_XZ.map(([x, z]) => {
    const b = beacon(x, z);
    scene.add(b.group);
    return b;
  });

  // ---- the route: through every stop, climbing between them ----
  const ground = STOP_XZ.map(([x, z]) => heightAt(x, z));
  const points: Vector3[] = [];
  STOP_XZ.forEach(([x, z], k) => {
    points.push(new Vector3(x, ground[k] + PASS_HEIGHT[k], z));
    if (k === STOPS - 1) return;
    const [nx, nz] = STOP_XZ[k + 1];
    const dist = Math.hypot(nx - x, nz - z);
    let top = 0;
    for (let i = 1; i < 8; i++) top = Math.max(top, heightAt(x + ((nx - x) * i) / 8, z + ((nz - z) * i) / 8));
    // a gentle climb out of each stop, cruising higher on the long hops
    points.push(new Vector3((x + nx) / 2, top + Math.min(16, 6 + dist * 0.18), (z + nz) / 2));
  });
  const route = new CatmullRomCurve3(points, false, "centripetal");
  const tAtStop = (k: number) => (2 * k) / (points.length - 1);
  // the route ahead, as a dotted line of light: only from the plane to the next stop, so Angers stays readable
  const DOTS = 1200;
  const dots = new Points(
    new BufferGeometry().setFromPoints(Array.from({ length: DOTS + 1 }, (_, i) => route.getPoint(i / DOTS))),
    new PointsMaterial({ color: "#7fb0ec", size: 0.45, map: dotTexture(), transparent: true, opacity: 0.75, depthWrite: false }),
  );
  dots.frustumCulled = false;
  scene.add(dots);

  /**
   * Progress (0 … STOPS - 1) → curve parameter. Easing slows the plane over each stop;
   * `dwell` (0 … 1) fades it out when flying straight past stops to one picked on the rail.
   */
  const tAt = (p: number, dwell: number) => {
    const k = Math.min(STOPS - 2, Math.floor(p));
    const f = Math.min(1, p - k);
    const eased = dwell * (0.72 * (f * f * (3 - 2 * f)) + 0.28 * f) + (1 - dwell) * f;
    return tAtStop(k) + (tAtStop(k + 1) - tAtStop(k)) * eased;
  };

  const plane = buildPaperPlane();
  plane.scale.setScalar(1.1);
  const trail = buildTrail();
  scene.add(plane, trail.line);

  // what the camera looks at for each stop: the landmark, and how high to aim on it
  const SUBJECT: [number, number, number][] = [
    [...SITES.bac, 1.2],
    [...SITES.lycee, 1.2],
    [...STOP_XZ[2], 1.2],
    [...STOP_XZ[3], 4],
    [...STOP_XZ[4], 1.4],
    [...STOP_XZ[5], 1.2],
    [...STOP_XZ[6], 1.4],
    [...SITES.negocom, 3.2],
  ];
  // per stop: where the camera sits while the ticket is read.
  // Out in the country, a wide view from above; in Angers, where the stops are close together,
  // a low close-up that slowly circles the building, so the neighbours stay out of the picture.
  const views = STOP_XZ.map(([x, z], k) => {
    const dir = route.getTangent(tAtStop(k)).setY(0);
    if (dir.lengthSq() < 1e-4) dir.set(0, 0, -1);
    dir.normalize();
    const side = new Vector3().crossVectors(dir, UP).normalize();
    const [sx, sz, sh] = SUBJECT[k];
    const inTown = Math.hypot(x, z) < 18;
    // in town, aim between the building and the plane hovering over it, so both are in the picture
    const look = inTown
      ? new Vector3((sx + x) / 2, ground[k] + (sh + PASS_HEIGHT[k]) * 0.5, (sz + z) / 2)
      : new Vector3(x, ground[k] + Math.min(PASS_HEIGHT[k], 4), z);
    const eye = inTown
      ? look.clone().addScaledVector(side, 12).addScaledVector(dir, -6).addScaledVector(UP, 4)
      : look.clone().addScaledVector(side, 15).addScaledVector(dir, -9).addScaledVector(UP, 9 + PASS_HEIGHT[k] * 0.5);
    return { eye, look, inTown };
  });

  // ---- sizing ----
  function resize() {
    const w = Math.max(1, trip.cabin.clientWidth);
    const h = Math.max(1, trip.cabin.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const portrait = w / h < 0.75;
    camera.fov = portrait ? 64 : 50;
    // the ticket covers the bottom of a phone screen, and the left of a wide one: frame the scene away from it
    if (portrait) camera.setViewOffset(w, h, 0, h * 0.18, w, h);
    else if (w > 900) camera.setViewOffset(w, h, -w * 0.14, 0, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  addEventListener("resize", () => {
    resize();
    wake();
  });
  resize();

  // ---- state ----
  let shown = trip.progress; // smoothed progress
  let roll = 0;
  let dwell = 1; // 1: slow down and look at each stop, 0: fly straight past them
  let time = 0;
  const eye = new Vector3();
  const look = new Vector3();
  const wantEye = new Vector3();
  const wantLook = new Vector3();
  const pos = new Vector3();
  const tangent = new Vector3();
  const ahead = new Vector3();
  const side = new Vector3();
  const tmp = new Vector3();
  const orbit = new Vector3();
  const flatDir = new Vector3();
  const landingLook = new Vector3();
  const LANDING_VIEW = new Vector3(-6, 7, 13);
  let first = true;

  function frame(dt: number) {
    time += dt;
    const target = trip.progress;
    shown = trip.reduced ? Math.round(target) : shown + (target - shown) * approach(5, dt);
    if (Math.abs(target - shown) < 1e-4) shown = target;

    // flying to a stop picked on the rail: no slowing down and no landmark view on the way,
    // both come back for the destination
    const passing = trip.bound !== null && Math.abs(shown - trip.bound) > 0.6;
    dwell += ((passing ? 0 : 1) - dwell) * approach(3, dt);

    // the plane on the route, nose along the tangent, banking into the turns
    const t = tAt(shown, dwell);
    route.getPoint(t, pos);
    route.getTangent(t, tangent);
    route.getTangent(Math.min(1, t + 0.004), ahead);
    const turn = Math.atan2(tangent.x, tangent.z) - Math.atan2(ahead.x, ahead.z);
    const wrapped = Math.atan2(Math.sin(turn), Math.cos(turn));
    const airborne = ramp(0.02, 0.25, shown) * (1 - ramp(STOPS - 1.25, STOPS - 1.02, shown));
    roll += (Math.max(-0.7, Math.min(0.7, wrapped * 40)) * airborne - roll) * approach(4, dt);
    const bob = trip.reduced ? 0 : Math.sin(time * 1.7) * 0.08 * airborne;
    plane.position.copy(pos).addScaledVector(UP, bob);
    plane.lookAt(tmp.copy(plane.position).add(tangent));
    plane.rotateZ(roll);
    if (airborne > 0.05) trail.push(plane.position);
    else trail.reset();
    trail.line.visible = airborne > 0.05;

    // camera: chase behind the plane, then a wide view of the landmark near each stop
    side.crossVectors(tangent, UP).normalize();
    // its own vector: tmp is reused below, and flat must not move with it
    const flat = flatDir.copy(tangent).setY(0).normalize();
    wantEye.copy(pos).addScaledVector(flat, -15).addScaledVector(UP, 5).addScaledVector(side, 3);
    wantLook.copy(pos).addScaledVector(flat, 4);
    const k = Math.round(shown);
    const nearStop = (1 - ramp(0.05, 0.38, Math.abs(shown - k))) * (k === trip.bound ? 1 : dwell);
    if (k > 0 && k < STOPS - 1 && nearStop > 0) {
      const v = views[k];
      let viewEye = v.eye;
      if (v.inTown && !trip.reduced) {
        // circle the building, a few degrees per second
        viewEye = orbit.copy(v.eye).sub(v.look).applyAxisAngle(UP, time * 0.06).add(v.look);
      }
      wantEye.lerp(viewEye, nearStop);
      wantLook.lerp(v.look, nearStop);
    }
    // on the ground at the start, a low view of the plane next to the lycée of the bac
    const start = 1 - ramp(0, 0.3, shown);
    if (start > 0) {
      tmp.copy(points[0]).addScaledVector(side, 6).addScaledVector(flat, 5).addScaledVector(UP, 3);
      wantEye.lerp(tmp, start);
      wantLook.lerp(points[0], start);
    }
    // landing: the plane on its spot at the foot of the Negocom tower
    const end = ramp(STOPS - 1.4, STOPS - 1, shown);
    if (end > 0) {
      const [px, pz] = STOP_XZ[STOPS - 1];
      landingLook.set((px + SITES.negocom[0]) / 2, ground[STOPS - 1] + 2.5, (pz + SITES.negocom[1]) / 2);
      wantEye.lerp(tmp.copy(landingLook).add(LANDING_VIEW), end);
      wantLook.lerp(landingLook, end);
    }
    // a hint of parallax from the mouse
    if (!trip.reduced) wantEye.addScaledVector(side, trip.pointer.x * 1.2).addScaledVector(UP, -trip.pointer.y * 0.8);

    if (first || trip.reduced) {
      eye.copy(wantEye);
      look.copy(wantLook);
      first = false;
    } else {
      eye.lerp(wantEye, approach(5, dt));
      look.lerp(wantLook, approach(5, dt));
    }
    // never inside a hill
    const floor = heightAt(eye.x, eye.z) + 1.5;
    if (eye.y < floor) eye.y = floor;
    camera.position.copy(eye);
    camera.lookAt(look);
    sky.position.copy(camera.position);

    // the dotted route: from the plane up to the stop after the one in sight
    const next = Math.min(STOPS - 1, Math.round(shown) + 1);
    const from = Math.floor(t * DOTS);
    dots.geometry.setDrawRange(from, Math.max(0, Math.ceil(tAtStop(next) * DOTS) - from));

    // the current stop's beacon brightens and its ring breathes; its close neighbours switch off
    const [cx, cz] = STOP_XZ[k];
    beacons.forEach((b, i) => {
      const active = i === k || (STOP_XZ[i][0] === cx && STOP_XZ[i][1] === cz);
      const far = Math.hypot(STOP_XZ[i][0] - cx, STOP_XZ[i][1] - cz) > 20;
      const level = active ? 1 : far ? 0.25 : 0;
      b.columnMat.opacity += (0.28 * level - b.columnMat.opacity) * approach(4, dt);
      b.ringMat.opacity += (0.75 * level - b.ringMat.opacity) * approach(4, dt);
      b.ring.scale.setScalar(active && !trip.reduced ? 1 + 0.12 * Math.sin(time * 3) : 1);
    });
    for (const l of animated) l.tick!(time);

    return Math.abs(target - shown) > 1e-4 || eye.distanceToSquared(wantEye) > 1e-4;
  }

  // ---- loop: full speed while moving, a calm 20 fps for the blinking lights otherwise ----
  let running = false;
  let last = 0;
  let lastRender = 0;
  let idleSince = 0;
  let visible = true;
  let onScreen = true;
  let slow = 0;

  function loop(now: number) {
    if (!visible || !onScreen) {
      running = false;
      return;
    }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const moving = frame(dt);
    if (moving) idleSince = now;
    const idle = now - idleSince > 1200;
    if (!idle || now - lastRender >= 48) {
      renderer.render(scene, camera);
      lastRender = now;
    }
    // frames that keep taking too long: lower the resolution a step
    if (!navigator.webdriver && dt > 0.03) slow++;
    else slow = Math.max(0, slow - 1);
    if (slow > 40 && pixelRatio > 1) {
      pixelRatio = Math.max(1, pixelRatio - 0.25);
      renderer.setPixelRatio(pixelRatio);
      slow = 0;
    }
    requestAnimationFrame(loop);
  }
  function wake() {
    idleSince = performance.now();
    if (running || !visible || !onScreen) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(loop);
  }
  document.addEventListener("visibilitychange", () => {
    visible = !document.hidden;
    wake();
  });
  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    wake();
  }).observe(trip.cabin);

  trip.wake = wake;  frame(0);
  renderer.render(scene, camera);
  requestAnimationFrame(() => document.documentElement.classList.add("scene-on"));
  wake();
}
