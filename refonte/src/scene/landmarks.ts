import {
  BoxGeometry,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  InstancedMesh,
  Material,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Object3D,
  SphereGeometry,
  Vector3,
} from "three";
import { heightAt } from "./world";

export interface Landmark {
  object: Object3D;
  /** optional animation, called every frame with the time in seconds */
  tick?: (time: number) => void;
}

const lambert = (color: string) => new MeshLambertMaterial({ color });
const glow = (color: string) => new MeshBasicMaterial({ color, toneMapped: false });

const M = {
  schist: lambert("#353c4f"),
  tuffeau: lambert("#b9b09a"),
  slate: lambert("#2c3550"),
  wall: lambert("#2f3b5e"),
  dark: lambert("#10141f"),
  glass: lambert("#2d4b7e"),
  white: lambert("#c9d2e2"),
  red: lambert("#a4372a"),
  deck: lambert("#4a3a2e"),
  fox: lambert("#d9642d"),
  window: glow("#ffd27a"),
  blue: glow("#4d84cc"),
  blueSoft: glow("#7fb0ec"),
};

/** A mesh from a geometry, placed and turned. */
function part(geo: BufferGeometry, mat: Material, x: number, y: number, z: number, rotY = 0) {
  const m = new Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.y = rotY;
  return m;
}
const block = (w: number, h: number, d: number) => new BoxGeometry(w, h, d).translate(0, h / 2, 0);

/** Places a group on the ground at x, z. */
function grounded(g: Group, x: number, z: number, rotY = 0) {
  g.position.set(x, heightAt(x, z) - 0.05, z);
  g.rotation.y = rotY;
  return g;
}

/** A grid of lit windows on the +z face of a box of size w × h × d. */
function windows(w: number, h: number, d: number, cols: number, rows: number, mat: Material, y0 = 0.4) {
  const pane = new BoxGeometry(0.26, 0.3, 0.04);
  const inst = new InstancedMesh(pane, mat, cols * rows * 2);
  const m = new Matrix4();
  let n = 0;
  for (const side of [1, -1])
    for (let c = 0; c < cols; c++)
      for (let r = 0; r < rows; r++) {
        const x = -w / 2 + ((c + 0.5) * w) / cols;
        const y = y0 + (r * (h - y0 - 0.3)) / Math.max(1, rows - 1);
        inst.setMatrixAt(n++, m.makeTranslation(x, y, side * (d / 2 + 0.02)));
      }
  return inst;
}

// ------------------------------------------------------------------ Angers
/** The Château d'Angers: a ring of round towers banded in dark schist and pale tuffeau. */
export function chateau(x: number, z: number): Landmark {
  const g = new Group();
  const towers: [number, number][] = [];
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2;
    towers.push([Math.cos(a) * 3.0, Math.sin(a) * 2.2]);
  }
  towers.forEach(([tx, tz], k) => {
    for (let band = 0; band < 4; band++) {
      g.add(part(new CylinderGeometry(0.72, 0.8, 0.55, 12).translate(0, 0.275, 0), band % 2 ? M.tuffeau : M.schist, tx, band * 0.55, tz));
    }
    const [nx, nz] = towers[(k + 1) % towers.length];
    const len = Math.hypot(nx - tx, nz - tz);
    g.add(part(block(len, 1.6, 0.4), M.schist, (tx + nx) / 2, 0, (tz + nz) / 2, -Math.atan2(nz - tz, nx - tx)));
  });
  // the royal lodge in the courtyard, slate roof
  g.add(part(block(2.2, 1.1, 1.2), M.tuffeau, 0, 0, 0));
  const roof = new Mesh(new ConeGeometry(1.4, 0.8, 4).rotateY(Math.PI / 4).scale(1.1, 1, 0.62), M.slate);
  roof.position.set(0, 1.5, 0);
  g.add(roof);
  return { object: grounded(g, x, z, 0.4) };
}

/** Lycée Chevrollier: two tuffeau wings with slate roofs around a yard. */
export function lycee(x: number, z: number): Landmark {
  const g = new Group();
  for (const [wx, wz, rot] of [
    [0, -1.6, 0],
    [-2.2, 0.6, Math.PI / 2],
  ] as const) {
    const wing = new Group();
    wing.add(part(block(5, 1.6, 1.6), M.tuffeau, 0, 0, 0));
    const roof = new Mesh(new CylinderGeometry(0.01, 1.05, 5.1, 3, 1).rotateZ(Math.PI / 2).rotateX(Math.PI / 6), M.slate);
    roof.position.y = 1.95;
    wing.add(roof, windows(5, 1.6, 1.6, 7, 2, M.window));
    wing.position.set(wx, 0, wz);
    wing.rotation.y = rot;
    g.add(wing);
  }
  return { object: grounded(g, x, z, 0.5) };
}

/** My Digital School: a modern block with a glowing blue band. */
export function campus(x: number, z: number): Landmark {
  const g = new Group();
  g.add(part(block(4.4, 2.6, 2.6), M.wall, 0, 0, 0));
  g.add(part(block(4.5, 0.18, 2.7), M.blue, 0, 1.9, 0));
  g.add(windows(4.4, 1.7, 2.6, 6, 2, M.blueSoft, 0.4));
  g.add(part(block(1.6, 0.9, 1.6), M.glass, 2.6, 0, 0.6));
  return { object: grounded(g, x, z, -0.3) };
}

/** Negocom Atlantique: a glass office tower, its windows lit, a red light on top. */
export function office(x: number, z: number): Landmark {
  const g = new Group();
  g.add(part(block(2.6, 6.5, 2.6), M.glass, 0, 0, 0));
  g.add(windows(2.6, 6.2, 2.6, 4, 9, M.window, 0.5));
  const turned = windows(2.6, 6.2, 2.6, 4, 9, M.window, 0.5);
  turned.rotation.y = Math.PI / 2;
  g.add(turned);
  g.add(part(block(1.2, 0.5, 1.2), M.wall, 0, 6.5, 0));
  const beacon = new Mesh(new SphereGeometry(0.16, 10, 8), glow("#ff4d4d"));
  beacon.position.y = 7.15;
  g.add(beacon);
  return {
    object: grounded(g, x, z, 0.2),
    tick: (t) => {
      beacon.visible = Math.sin(t * 3.2) > -0.2;
    },
  };
}

/** Home: a small house and the server shed, its LEDs blinking. */
export function home(x: number, z: number): Landmark {
  const g = new Group();
  g.add(part(block(2.2, 1.3, 1.8), M.white, 0, 0, 0));
  const roof = new Mesh(new ConeGeometry(1.7, 0.9, 4).rotateY(Math.PI / 4).scale(1, 1, 0.82), M.slate);
  roof.position.y = 1.75;
  g.add(roof, windows(2.2, 1.3, 1.8, 3, 1, M.window, 0.55));
  // the shed with an open front and two racks
  const shed = new Group();
  shed.position.set(2.6, 0, 0.3);
  shed.add(part(block(1.6, 1.5, 1.4), M.dark, 0, 0, 0));
  const leds = new InstancedMesh(new BoxGeometry(0.08, 0.05, 0.03), new MeshBasicMaterial({ toneMapped: false }), 24);
  const m = new Matrix4();
  for (let i = 0; i < 24; i++) leds.setMatrixAt(i, m.makeTranslation(-0.45 + (i % 2) * 0.12 + Math.floor(i / 12) * 0.55, 0.25 + (Math.floor(i / 2) % 6) * 0.18, 0.72));
  const on = [new Color("#3ee08a"), new Color("#4d84cc"), new Color("#ffd27a")];
  const off = new Color("#14202f");
  shed.add(leds);
  g.add(shed);
  let last = -1;
  return {
    object: grounded(g, x, z, -0.6),
    tick: (t) => {
      const step = Math.floor(t * 6);
      if (step === last) return;
      last = step;
      for (let i = 0; i < 24; i++) {
        const lit = Math.sin(i * 12.9898 + step * (0.7 + (i % 5) * 0.31)) > -0.1;
        leds.setColorAt(i, lit ? on[i % 3] : off);
      }
      leds.instanceColor!.needsUpdate = true;
    },
  };
}

// ------------------------------------------------------------------ the rest of the map
/** Le Champenais: a bar-restaurant by the Loire, a deck with tables and a string of lights. */
export function guinguette(x: number, z: number): Landmark {
  const g = new Group();
  g.add(part(block(3, 1.5, 2), M.tuffeau, 0, 0, 0));
  const roof = new Mesh(new ConeGeometry(2.2, 0.9, 4).rotateY(Math.PI / 4).scale(1.05, 1, 0.72), M.slate);
  roof.position.y = 1.95;
  g.add(roof, windows(3, 1.5, 2, 3, 1, M.window, 0.5));
  g.add(part(block(3.4, 0.12, 2.6), M.deck, 0, 0, 2.4));
  for (const [tx, tz] of [
    [-1, 1.9],
    [0.2, 2.9],
    [1.2, 1.9],
  ]) {
    g.add(part(new CylinderGeometry(0.32, 0.32, 0.06, 10).translate(0, 0.55, 0), M.white, tx, 0.12, tz));
    g.add(part(new CylinderGeometry(0.05, 0.05, 0.55, 6).translate(0, 0.27, 0), M.white, tx, 0.12, tz));
  }
  // two poles and the bulbs hanging between them
  const poleGeo = new CylinderGeometry(0.05, 0.06, 2.4, 6).translate(0, 1.2, 0);
  g.add(part(poleGeo, M.deck, -1.8, 0, 3.8), part(poleGeo, M.deck, 1.8, 0, 3.8));
  const bulbs: Mesh[] = [];
  const bulbGeo = new SphereGeometry(0.09, 8, 6);
  const colours = ["#ffd27a", "#ff9a6b", "#7fb0ec", "#fff1c1"];
  for (const [ax, az, bx, bz] of [
    [-1.8, 3.8, 1.8, 3.8],
    [-1.8, 3.8, -1.5, 1.1],
    [1.8, 3.8, 1.5, 1.1],
  ]) {
    for (let i = 1; i < 8; i++) {
      const t = i / 8;
      const bulb = new Mesh(bulbGeo, glow(colours[(i + bulbs.length) % colours.length]));
      bulb.position.set(ax + (bx - ax) * t, 2.35 - Math.sin(Math.PI * t) * 0.5, az + (bz - az) * t);
      bulbs.push(bulb);
      g.add(bulb);
    }
  }
  return {
    object: grounded(g, x, z, Math.PI),
    tick: (t) => bulbs.forEach((b, i) => b.scale.setScalar(0.85 + 0.25 * Math.max(0, Math.sin(t * 2 + i * 1.3)))),
  };
}

/** Ecolab, remote: a red and white relay mast on the hill, a dish and a blinking light. */
export function relay(x: number, z: number): Landmark {
  const g = new Group();
  for (let k = 0; k < 7; k++) {
    const r0 = 0.32 - k * 0.03,
      r1 = 0.32 - (k + 1) * 0.03;
    g.add(part(new CylinderGeometry(r1, r0, 1, 8).translate(0, 0.5, 0), k % 2 ? M.white : M.red, 0, k, 0));
  }
  for (const [y, rot] of [
    [4.2, 0.4],
    [5.4, 2.6],
  ]) {
    const dish = new Mesh(new SphereGeometry(0.55, 14, 8, 0, Math.PI * 2, 0, Math.PI / 3), M.white);
    dish.position.set(Math.cos(rot) * 0.35, y, Math.sin(rot) * 0.35);
    dish.lookAt(new Vector3(Math.cos(rot) * 5, y + 1, Math.sin(rot) * 5).add(dish.position));
    dish.rotateX(-Math.PI / 2);
    g.add(dish);
  }
  g.add(part(block(1.4, 0.9, 1.1), M.white, 1.3, 0, 0.6));
  const light = new Mesh(new SphereGeometry(0.17, 10, 8), glow("#ff4d4d"));
  light.position.y = 7.2;
  g.add(light);
  return {
    object: grounded(g, x, z),
    tick: (t) => {
      light.visible = t % 1.4 < 0.6;
    },
  };
}

/** Blackfox, Sèvremoine: a black building with a blue band and a fox's ears over the door. */
export function blackfox(x: number, z: number): Landmark {
  const g = new Group();
  g.add(part(block(5, 1.9, 3.2), M.dark, 0, 0, 0));
  g.add(part(block(5.1, 0.14, 3.3), M.blue, 0, 1.25, 0));
  g.add(windows(5, 1.1, 3.2, 6, 1, M.blueSoft, 0.45));
  for (const side of [-1, 1]) {
    const ear = new Mesh(new ConeGeometry(0.28, 0.6, 3), M.fox);
    ear.position.set(side * 0.32, 2.2, 1.62);
    ear.rotation.z = -side * 0.25;
    g.add(ear);
  }
  g.add(part(block(1.5, 0.08, 4.5), M.wall, 3.6, 0, 0.4));
  return { object: grounded(g, x, z, 0.7) };
}

// ------------------------------------------------------------------ Anjou, along the way
/** A moulin cavier, the Anjou windmill: a stone cone, a wooden cabin on top, four sails turning slowly. */
export function windmill(x: number, z: number, phase: number): Landmark {
  const g = new Group();
  g.add(part(new CylinderGeometry(0.55, 1.5, 2.2, 10).translate(0, 1.1, 0), M.tuffeau, 0, 0, 0));
  g.add(part(block(1.1, 1.1, 1.3), M.deck, 0, 2.2, 0));
  const cap = new Mesh(new ConeGeometry(0.95, 0.7, 4).rotateY(Math.PI / 4), M.slate);
  cap.position.y = 3.65;
  g.add(cap);
  const sails = new Group();
  sails.position.set(0, 2.8, 0.75);
  for (let k = 0; k < 4; k++) {
    const arm = new Mesh(new BoxGeometry(0.16, 2.3, 0.04).translate(0, 1.15, 0), M.white);
    arm.rotation.z = (k * Math.PI) / 2;
    sails.add(arm);
  }
  g.add(sails);
  return {
    object: grounded(g, x, z, phase),
    tick: (t) => {
      sails.rotation.z = phase + t * 0.6;
    },
  };
}

/** Faye-d'Anjou: the church on the hillside, its slate spire above the village roofs. */
export function church(x: number, z: number): Landmark {
  const g = new Group();
  g.add(part(block(1.6, 1.5, 3.4), M.tuffeau, 0, 0, 0));
  const roof = new Mesh(new CylinderGeometry(0.01, 1.0, 3.5, 3, 1).rotateZ(Math.PI / 2).rotateY(Math.PI / 2).rotateZ(Math.PI / 6), M.slate);
  roof.position.y = 1.85;
  g.add(roof);
  g.add(part(block(1.1, 2.6, 1.1), M.tuffeau, 0, 0, -2.1));
  const spire = new Mesh(new ConeGeometry(0.75, 2.6, 8).translate(0, 1.3, 0), M.slate);
  spire.position.set(0, 2.6, -2.1);
  g.add(spire);
  const clock = new Mesh(new SphereGeometry(0.18, 10, 8), M.window);
  clock.position.set(0, 2.0, -1.55);
  g.add(clock);
  return { object: grounded(g, x, z, 0.3) };
}
