// projection.ts holds the maths for projection mapping (SCR-3): warping the lyrics area so its four corners land on
// four chosen points, to fit a projector screen when the projector is at an angle.
// The warp is a perspective transform (homography), applied as a CSS matrix3d. The browser's compositor draws it, so
// it costs no script work per frame and makes no copies of video frames (SCR-10). These functions run only when a
// corner moves or the window changes size.

export type Point = { x: number; y: number };
// corners in order: top-left, top-right, bottom-right, bottom-left
export type Corners = [Point, Point, Point, Point];

// DEFAULT_CORNERS is the starting rectangle, and what reset returns to, as fractions of the screen (SCR-11).
// A small margin keeps the corner handles clear of the screen edge.
export const DEFAULT_CORNERS: Corners = [
  { x: 0.01, y: 0.01 },
  { x: 0.99, y: 0.01 },
  { x: 0.99, y: 0.99 },
  { x: 0.01, y: 0.99 },
];

// Limits that keep the shape sensible. Without them the shape could fold over itself or flatten into a triangle,
// where the warp flips the picture or stretches it to extremes.
// MIN_CORNER_ANGLE_DEG: every corner's angle must be between this and 180° minus this. Projector keystone rarely
// needs corners outside 45°–135°, so 15° is generous.
const MIN_CORNER_ANGLE_DEG = 15;
// MIN_EDGE_PX: the shortest allowed edge, so two corners (and their handles) can't be dragged on top of each other
const MIN_EDGE_PX = 60;
const MIN_SIN = Math.sin((MIN_CORNER_ANGLE_DEG * Math.PI) / 180);

export const copyCorners = (corners: Corners): Corners => corners.map((p) => ({ ...p })) as Corners;

// toPixels converts corners from fractions of the screen to pixels
export const toPixels = (corners: Corners, w: number, h: number): Corners =>
  corners.map((p) => ({ x: p.x * w, y: p.y * h })) as Corners;

// toFractions converts corners from pixels to fractions of the screen
export const toFractions = (corners: Corners, w: number, h: number): Corners =>
  corners.map((p) => ({ x: p.x / w, y: p.y / h })) as Corners;

// isValidShape is true if the corners (in pixels) make a convex shape within the limits above. A convex shape keeps
// the warp well defined everywhere inside it.
export function isValidShape(corners: Corners): boolean {
  for (let i = 0; i < 4; i++) {
    const a = corners[i];
    const b = corners[(i + 1) % 4];
    const c = corners[(i + 2) % 4];
    const e1 = Math.hypot(b.x - a.x, b.y - a.y);
    const e2 = Math.hypot(c.x - b.x, c.y - b.y);
    if (e1 < MIN_EDGE_PX) {
      return false;
    }
    // corners run clockwise on screen (y points down), so every turn has a positive cross product.
    // cross / (e1 · e2) is the sine of the turn, which is small when the corner is nearly flat or nearly folded back.
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (cross < MIN_SIN * e1 * e2) {
      return false;
    }
  }
  return true;
}

// cornersToMatrix3d returns a CSS transform mapping a w × h box at the screen origin onto the corners (in pixels).
// The element needs `transform-origin: 0 0`.
// Method: Heckbert's square-to-quad mapping, then scaled from the unit square to w × h.
export function cornersToMatrix3d(corners: Corners, w: number, h: number): string {
  const [p0, p1, p2, p3] = corners;
  const sx = p0.x - p1.x + p2.x - p3.x;
  const sy = p0.y - p1.y + p2.y - p3.y;
  const dx1 = p1.x - p2.x;
  const dx2 = p3.x - p2.x;
  const dy1 = p1.y - p2.y;
  const dy2 = p3.y - p2.y;
  const den = dx1 * dy2 - dx2 * dy1;
  // perspective terms. Both are 0 for a parallelogram, which makes the mapping affine.
  const g = (sx * dy2 - dx2 * sy) / den;
  const k = (dx1 * sy - sx * dy1) / den;
  const a = p1.x - p0.x + g * p1.x;
  const b = p3.x - p0.x + k * p3.x;
  const d = p1.y - p0.y + g * p1.y;
  const e = p3.y - p0.y + k * p3.y;
  // matrix3d is column-major. x' = (a/w·x + b/h·y + p0.x) / (g/w·x + k/h·y + 1), and likewise for y'. z is unchanged.
  const m = [
    a / w, d / w, 0, g / w,
    b / h, e / h, 0, k / h,
    0, 0, 1, 0,
    p0.x, p0.y, 0, 1,
  ];
  return `matrix3d(${m.join(",")})`;
}
