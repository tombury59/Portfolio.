import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PlaneGeometry,
  Quaternion,
  Vector3,
} from "three";
import { STOP_XZ } from "../stops";

// ------------------------------------------------------------------ randomness
/** Seeded xorshift32, so the map is the same on every visit. */
export function seeded(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

function lattice(ix: number, iz: number) {
  const n = Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

/** Smooth value noise in 0 … 1. */
function noise(x: number, z: number) {
  const ix = Math.floor(x),
    iz = Math.floor(z);
  const fx = x - ix,
    fz = z - iz;
  const u = fx * fx * (3 - 2 * fx),
    v = fz * fz * (3 - 2 * fz);
  const a = lattice(ix, iz),
    b = lattice(ix + 1, iz),
    c = lattice(ix, iz + 1),
    d = lattice(ix + 1, iz + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export const ramp = (lo: number, hi: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - lo) / (hi - lo)));
  return t * t * (3 - 2 * t);
};

// ------------------------------------------------------------------ the map
type P2 = [number, number];
/**
 * The Loire runs west–east south of Angers, the Maine comes down through the city,
 * the Layon winds past Faye-d'Anjou to the Loire, the Sèvre crosses the Mauges.
 */
export const LOIRE: P2[] = [[-190, 31], [-90, 26], [-30, 24], [20, 21], [70, 18], [190, 25]];
export const RIVERS: { pts: P2[]; width: number }[] = [
  { pts: LOIRE, width: 4.2 },
  { pts: [[-15, -190], [-13, -70], [-12, -14], [-11, 8], [-10, 23]], width: 2.6 },
  { pts: [[60, 75], [32, 58], [12, 50], [-8, 42], [-24, 31], [-32, 26]], width: 1.6 },
  { pts: [[-80, 36], [-60, 52], [-48, 64], [-30, 82], [-10, 110]], width: 1.8 },
];
export const WATER_Y = -0.9;
const CITY: P2 = [0, 0];
/** Landmarks that do not sit right under a stop (the plane needs room to take off and land). */
export const SITES: Record<"chateau" | "lycee" | "home" | "bac" | "negocom", P2> = {
  bac: [-30, -62], // the lycée of the bac, next to the take-off spot
  negocom: [10, 8.5], // the office tower, next to the landing spot
  chateau: [-5.5, -18], // on the east bank of the Maine
  lycee: [-1, -12.5],
  home: [10, 40], // Faye-d'Anjou, next to the landing spot
};
/** The village of Faye-d'Anjou, its church on the hillside. */
export const FAYE: P2 = [2, 37];
/** Everything the town blocks and the trees keep away from. */
const CLEAR: P2[] = [...STOP_XZ, ...Object.values(SITES), FAYE];
const HILL: P2 = STOP_XZ[3];

function distToPolyline(x: number, z: number, pts: P2[]) {
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i];
    const [bx, bz] = pts[i + 1];
    const dx = bx - ax,
      dz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t));
  }
  return best;
}

/** How deep inside a river bed a point is: 1 in the water, 0 on dry land. */
export function wetness(x: number, z: number) {
  let w = 0;
  for (const r of RIVERS) w = Math.max(w, 1 - ramp(r.width * 0.6, r.width * 1.6, distToPolyline(x, z, r.pts)));
  return w;
}

/** The lie of the land, before the flat spots and the river beds. */
function terrainShape(x: number, z: number) {
  let h = noise(x * 0.025, z * 0.025) * 5.5 + noise(x * 0.07 + 9, z * 0.07 - 4) * 1.6 - 0.2;
  // the hill with the relay mast
  h += 10 * Math.exp(-((x - HILL[0]) ** 2 + (z - HILL[1]) ** 2) / 160);
  // the Mauges, south-west: higher, rounder hills
  h += ramp(28, 70, z) * ramp(5, -45, x) * (noise(x * 0.035 + 3, z * 0.035 - 8) * 11 + 2);
  // the slopes of the Layon valley around Faye
  h += Math.exp(-((x - 4) ** 2 + (z - 36) ** 2) / 300) * 3.5;
  // the city sits low and flat
  const dc = Math.hypot(x - CITY[0], z - CITY[1]);
  return h + (0.5 - h) * (1 - ramp(12, 22, dc));
}
/** Each clear spot is levelled at its own natural height, so a stop in the hills sits on a terrace, not in a pit. */
const LEVEL = CLEAR.map(([x, z]) => terrainShape(x, z));

/** Ground height anywhere on the map. */
export function heightAt(x: number, z: number) {
  let h = terrainShape(x, z);
  CLEAR.forEach(([sx, sz], i) => {
    const d = Math.hypot(x - sx, z - sz);
    if (d < 7) h += (LEVEL[i] - h) * (1 - ramp(3, 7, d));
  });
  // river beds last, so they cut through everything
  const w = wetness(x, z);
  return h + (WATER_Y - 0.8 - h) * w;
}

// ------------------------------------------------------------------ meshes
const GROUND = {
  bank: new Color("#3b4a52"),
  low: new Color("#1f3d35"),
  mid: new Color("#26473b"),
  field: new Color("#2f4f3a"),
  field2: new Color("#3a5638"),
  high: new Color("#3d5f4c"),
  top: new Color("#4b6c5a"),
};

function buildGround() {
  const SIZE = 380;
  // heights on the shared grid first (6× fewer calls), then split the triangles apart for flat colours
  const grid = new PlaneGeometry(SIZE, SIZE, 128, 128).rotateX(-Math.PI / 2);
  const gp = grid.getAttribute("position") as BufferAttribute;
  for (let i = 0; i < gp.count; i++) gp.setY(i, heightAt(gp.getX(i), gp.getZ(i)));
  const g = grid.toNonIndexed();
  grid.dispose();
  const pos = g.getAttribute("position") as BufferAttribute;
  // one colour per triangle, from its centre: a faceted, low-poly look
  const colors = new Float32Array(pos.count * 3);
  const c = new Color();
  for (let i = 0; i < pos.count; i += 3) {
    const x = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3;
    const y = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3;
    const z = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3;
    if (y < WATER_Y + 0.5) c.copy(GROUND.bank);
    else if (y > 7) c.copy(GROUND.top);
    else if (y > 3.5) c.copy(GROUND.high);
    else {
      const patch = noise(x * 0.09 + 40, z * 0.09);
      c.copy(patch > 0.66 ? GROUND.field2 : patch > 0.45 ? GROUND.field : y < 1.2 ? GROUND.low : GROUND.mid);
    }
    c.multiplyScalar(0.92 + lattice(i, 7) * 0.16);
    for (let k = 0; k < 3; k++) colors.set([c.r, c.g, c.b], (i + k) * 3);
  }
  g.setAttribute("color", new BufferAttribute(colors, 3));
  g.computeVertexNormals();
  const mesh = new Mesh(g, new MeshLambertMaterial({ vertexColors: true }));
  mesh.receiveShadow = false;
  return mesh;
}

/** Low sandbanks in the Loire, as in summer. */
function buildSandbanks(rand: () => number) {
  const g = new Group();
  const sand = new MeshLambertMaterial({ color: "#5e5b4e" });
  for (let i = 0; i < 9; i++) {
    const x = -120 + i * 28 + rand() * 12;
    // follow the Loire: find its z at this x
    let z = 24;
    for (let k = 0; k < LOIRE.length - 1; k++) {
      const [ax, az] = LOIRE[k];
      const [bx, bz] = LOIRE[k + 1];
      if (x >= ax && x <= bx) z = az + ((bz - az) * (x - ax)) / (bx - ax);
    }
    const bank = new Mesh(new CylinderGeometry(1, 1, 0.2, 9), sand);
    bank.scale.set(4 + rand() * 4, 1, 0.9 + rand() * 0.8);
    bank.position.set(x, WATER_Y + 0.02, z + (rand() - 0.5) * 2);
    bank.rotation.y = (rand() - 0.5) * 0.3;
    g.add(bank);
  }
  return g;
}

/** Vine rows: Coteaux du Layon around Faye, and the slopes behind the Champenais. */
function buildVineyards(rand: () => number) {
  const patches: { at: P2; w: number; d: number; rot: number }[] = [
    { at: [17, 45], w: 10, d: 7, rot: 0.35 },
    { at: [-4, 34], w: 9, d: 6, rot: -0.2 },
    { at: [28, 46], w: 8, d: 6, rot: 0.5 },
    { at: [33, 4], w: 9, d: 6, rot: 0.1 },
    { at: [48, 5], w: 8, d: 5, rot: -0.3 },
  ];
  const seg = new BoxGeometry(1, 0.42, 0.2).translate(0, 0.21, 0);
  const rows = new InstancedMesh(seg, new MeshLambertMaterial({ color: "#2f5a35" }), 1400);
  let n = 0;
  for (const p of patches) {
    _q.setFromAxisAngle(UP, p.rot);
    const across = new Vector3(0, 0, 1).applyQuaternion(_q);
    const along = new Vector3(1, 0, 0).applyQuaternion(_q);
    for (let r = -p.d / 2; r <= p.d / 2; r += 0.75) {
      for (let s = -p.w / 2; s < p.w / 2 && n < 1400; s += 1) {
        const x = p.at[0] + across.x * r + along.x * s;
        const z = p.at[1] + across.z * r + along.z * s;
        if (wetness(x, z) > 0 || nearAnyStop(x, z, 3.5)) continue;
        _p.set(x, heightAt(x, z) - 0.05, z);
        rows.setMatrixAt(n++, _m.compose(_p, _q, _s.set(1.02, 0.85 + rand() * 0.3, 1)));
      }
    }
  }
  rows.count = n;
  return rows;
}

/** A ring of mountain silhouettes far beyond the map, so the horizon is never flat. Unaffected by fog. */
function buildMountains() {
  const ridges = [
    { r: 250, top: [8, 26], colour: "#152752" },
    { r: 300, top: [16, 40], colour: "#101e42" },
  ];
  const g = new Group();
  ridges.forEach((ridge, layer) => {
    const N = 96;
    const pos: number[] = [];
    const peak = (i: number) => {
      const a = (i / N) * Math.PI * 2;
      const n = noise(Math.cos(a) * 3 + layer * 7, Math.sin(a) * 3) * 0.7 + noise(Math.cos(a) * 9, Math.sin(a) * 9 + layer) * 0.3;
      return { a, y: ridge.top[0] + (ridge.top[1] - ridge.top[0]) * n * n };
    };
    for (let i = 0; i < N; i++) {
      const p = peak(i),
        q = peak(i + 1);
      const base = -6;
      const ax = Math.cos(p.a) * ridge.r,
        az = Math.sin(p.a) * ridge.r;
      const bx = Math.cos(q.a) * ridge.r,
        bz = Math.sin(q.a) * ridge.r;
      pos.push(ax, base, az, bx, base, bz, ax, p.y, az);
      pos.push(bx, base, bz, bx, q.y, bz, ax, p.y, az);
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
    g.add(new Mesh(geo, new MeshBasicMaterial({ color: ridge.colour, fog: false, side: DoubleSide })));
  });
  g.renderOrder = -0.5;
  return g;
}

function buildWater() {
  const g = new PlaneGeometry(380, 380).rotateX(-Math.PI / 2);
  const m = new Mesh(g, new MeshLambertMaterial({ color: "#16305e", emissive: new Color("#0c1d40"), emissiveIntensity: 0.6 }));
  m.position.y = WATER_Y;
  return m;
}

const _m = new Matrix4();
const _q = new Quaternion();
const _p = new Vector3();
const _s = new Vector3();
const UP = new Vector3(0, 1, 0);

function nearAnyStop(x: number, z: number, r: number) {
  return CLEAR.some(([sx, sz]) => Math.hypot(x - sx, z - sz) < r);
}

function buildTrees(rand: () => number) {
  const cone = new ConeGeometry(0.9, 2.6, 5).translate(0, 1.3, 0);
  const COUNT = 1100;
  const trees = new InstancedMesh(cone, new MeshLambertMaterial(), COUNT);
  const shades = ["#1d4a36", "#235a3f", "#2b6446", "#1a3f30"].map((h) => new Color(h));
  let n = 0;
  for (let tries = 0; tries < COUNT * 6 && n < COUNT; tries++) {
    const x = (rand() - 0.5) * 340,
      z = (rand() - 0.5) * 340;
    if (wetness(x, z) > 0 || Math.hypot(x, z) < 20 || nearAnyStop(x, z, 9)) continue;
    // clumps: woods where the noise says so, a few loose trees elsewhere
    if (noise(x * 0.05 - 7, z * 0.05 + 3) < 0.48 && rand() > 0.15) continue;
    const s = 0.7 + rand() * 0.7;
    _p.set(x, heightAt(x, z) - 0.1, z);
    _q.setFromAxisAngle(UP, rand() * 6.28);
    _s.set(s, s * (0.8 + rand() * 0.5), s);
    trees.setMatrixAt(n, _m.compose(_p, _q, _s));
    trees.setColorAt(n, shades[Math.floor(rand() * shades.length)]);
    n++;
  }
  trees.count = n;
  return trees;
}

/** Low buildings with lit windows, around the city and each village. */
function buildTowns(rand: () => number) {
  const towns: { at: P2; radius: number; count: number; tall: number }[] = [
    { at: CITY, radius: 15, count: 170, tall: 3.2 },
    { at: STOP_XZ[0], radius: 9, count: 30, tall: 1.2 },
    { at: STOP_XZ[2], radius: 9, count: 26, tall: 1.2 },
    { at: STOP_XZ[5], radius: 10, count: 40, tall: 1.4 },
    { at: [STOP_XZ[3][0] - 9, STOP_XZ[3][1] + 8], radius: 5, count: 12, tall: 1 },
    { at: FAYE, radius: 7, count: 24, tall: 0.6 },
  ];
  const total = towns.reduce((a, t) => a + t.count, 0);
  const box = new BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const blocks = new InstancedMesh(box, new MeshLambertMaterial(), total);
  const lights = new InstancedMesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial({ toneMapped: false }), total * 4);
  const walls = ["#26314f", "#2d3a5c", "#343f60", "#3b4766"].map((h) => new Color(h));
  const glow = ["#ffd27a", "#ffe3a3", "#ffc56b", "#a9c8ff"].map((h) => new Color(h));
  const local = new Vector3();
  let nb = 0,
    nl = 0;
  for (const t of towns) {
    for (let tries = 0, placed = 0; placed < t.count && tries < t.count * 30; tries++) {
      const a = rand() * Math.PI * 2,
        r = Math.sqrt(rand()) * t.radius;
      const x = t.at[0] + Math.cos(a) * r,
        z = t.at[1] + Math.sin(a) * r;
      if (wetness(x, z) > 0 || nearAnyStop(x, z, 4.6)) continue;
      const w = 0.9 + rand() * 1.3,
        d = 0.9 + rand() * 1.3;
      const centre = 1 - r / t.radius;
      const h = 0.7 + rand() * 0.8 + centre * centre * t.tall * rand();
      const rot = Math.round(rand() * 4) * (Math.PI / 2) + (rand() - 0.5) * 0.3;
      _q.setFromAxisAngle(UP, rot);
      _p.set(x, heightAt(x, z) - 0.15, z);
      blocks.setMatrixAt(nb, _m.compose(_p, _q, _s.set(w, h + 0.15, d)));
      blocks.setColorAt(nb, walls[Math.floor(rand() * walls.length)]);
      nb++;
      placed++;
      // two to four lit windows on the long faces
      const lit = 2 + Math.floor(rand() * 3);
      for (let k = 0; k < lit; k++) {
        const side = rand() < 0.5 ? -1 : 1;
        const onX = rand() < 0.5;
        local.set(onX ? side * (w / 2 + 0.01) : (rand() - 0.5) * (w - 0.4), 0.35 + rand() * Math.max(0.1, h - 0.6), onX ? (rand() - 0.5) * (d - 0.4) : side * (d / 2 + 0.01));
        local.applyQuaternion(_q).add(_p);
        _s.set(onX ? 0.04 : 0.24, 0.26, onX ? 0.24 : 0.04);
        lights.setMatrixAt(nl, _m.compose(local, _q, _s));
        lights.setColorAt(nl, glow[rand() < 0.85 ? Math.floor(rand() * 3) : 3]);
        nl++;
      }
    }
  }
  blocks.count = nb;
  lights.count = nl;
  const g = new Group();
  g.add(blocks, lights);
  return g;
}

export function buildWorld() {
  const rand = seeded(2026);
  const world = new Group();
  world.add(buildGround(), buildWater(), buildSandbanks(rand), buildVineyards(rand), buildTrees(rand), buildTowns(rand), buildMountains());
  return world;
}
