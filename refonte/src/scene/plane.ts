import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshLambertMaterial,
  Vector3,
} from "three";

/** A folded paper plane, nose along +z: two wings and a keel, nothing else. */
export function buildPaperPlane() {
  const nose = [0, 0, 1.3];
  const tail = [0, 0, -0.75];
  const keel = [0, -0.3, -0.75];
  const left = [-1.0, 0.12, -0.8];
  const right = [1.0, 0.12, -0.8];
  // prettier-ignore
  const tris = [
    ...nose, ...tail, ...left,   // left wing
    ...nose, ...right, ...tail,  // right wing
    ...nose, ...keel, ...tail,   // keel, both faces come from DoubleSide
  ];
  const geo = new BufferGeometry();
  geo.setAttribute("position", new BufferAttribute(new Float32Array(tris), 3));
  geo.computeVertexNormals();
  const paper = new MeshLambertMaterial({ color: "#f4f6fb", emissive: new Color("#8fb3ef"), emissiveIntensity: 0.35, side: DoubleSide });
  const body = new Mesh(geo, paper);
  // a crease line down the middle, in the site's blue
  const crease = new Line(
    new BufferGeometry().setFromPoints([new Vector3(...nose), new Vector3(...tail)]),
    new LineBasicMaterial({ color: "#4d84cc" }),
  );
  const plane = new Group();
  plane.add(body, crease);
  return plane;
}

/** A fading ribbon of light behind the plane: the last N positions, newest first. */
export function buildTrail(length = 70) {
  const positions = new Float32Array(length * 3);
  const colors = new Float32Array(length * 3);
  const head = new Color("#9fc4ff");
  for (let i = 0; i < length; i++) {
    const fade = (1 - i / length) ** 1.6;
    colors.set([head.r * fade, head.g * fade, head.b * fade], i * 3);
  }
  const geo = new BufferGeometry();
  geo.setAttribute("position", new BufferAttribute(positions, 3));
  geo.setAttribute("color", new BufferAttribute(colors, 3));
  const line = new Line(geo, new LineBasicMaterial({ vertexColors: true, blending: AdditiveBlending, transparent: true, depthWrite: false }));
  line.frustumCulled = false;
  let filled = false;
  return {
    line,
    /** shift everything one slot back and put `p` at the front */
    push(p: Vector3) {
      if (!filled) {
        for (let i = 0; i < length; i++) positions.set([p.x, p.y, p.z], i * 3);
        filled = true;
      }
      positions.copyWithin(3, 0, (length - 1) * 3);
      positions.set([p.x, p.y, p.z], 0);
      geo.getAttribute("position").needsUpdate = true;
    },
    reset() {
      filled = false;
    },
  };
}
