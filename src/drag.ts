// drag.ts is the screen setup journey for the lyrics area (SCR-1, SCR-3).
// The area keeps a fixed, full-screen layout box and is warped with a CSS transform (see projection.ts), so the video,
// filter and lyrics move together. In setup mode (the 'dragmode' class) four handles reshape it, dragging inside it
// moves it, and a toolbar holds reset and exit. The handles and toolbar sit in an overlay that is not warped, so they
// keep their size and shape.
// Corner positions are not saved: a refresh resets the area to the default rectangle.
import {
  Corners,
  DEFAULT_CORNERS,
  copyCorners,
  cornersToMatrix3d,
  isValidShape,
  toFractions,
  toPixels,
} from "./projection";

// HANDLE_SIZE is the width and height of a corner handle in px. It is also the touch target, so keep it finger-sized.
const HANDLE_SIZE = 40;
// toolbar size in px (reset and exit buttons side by side)
const TOOLBAR_WIDTH = 68;
const TOOLBAR_HEIGHT = 30;
// TOOLBAR_GAP is the minimum space in px between the toolbar and any corner handle
const TOOLBAR_GAP = 8;

type Box = { x: number; y: number; w: number; h: number };

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

// size of the screen in CSS px. The area's layout box fills it (position: fixed; inset: 0).
const viewport = () => ({
  w: document.documentElement.clientWidth,
  h: document.documentElement.clientHeight,
});

const overlaps = (a: Box, b: Box, gap: number) =>
  a.x < b.x + b.w + gap && b.x < a.x + a.w + gap && a.y < b.y + b.h + gap && b.y < a.y + a.h + gap;

// handleBox is the handle centred on its corner, kept inside the screen so a corner at the edge can still be grabbed
const handleBox = (p: { x: number; y: number }, w: number, h: number): Box => ({
  x: clamp(p.x - HANDLE_SIZE / 2, 0, w - HANDLE_SIZE),
  y: clamp(p.y - HANDLE_SIZE / 2, 0, h - HANDLE_SIZE),
  w: HANDLE_SIZE,
  h: HANDLE_SIZE,
});

// placeToolbar finds a toolbar position that overlaps no corner handle (SCR-3). It prefers the spot beside the
// top-right handle, where the ❌ has always been, then tries beside the other handles (on the side facing into the
// area), then the middle of the area and of the screen. Returns the first candidate that fits.
function placeToolbar(handles: Box[], centre: { x: number; y: number }, w: number, h: number): Box {
  const [tl, tr, br, bl] = handles;
  const g = TOOLBAR_GAP;
  const tw = TOOLBAR_WIDTH;
  const th = TOOLBAR_HEIGHT;
  const candidates = [
    { x: tr.x - g - tw, y: tr.y }, // left of top-right
    { x: tr.x + tr.w - tw, y: tr.y + tr.h + g }, // below top-right
    { x: tl.x + tl.w + g, y: tl.y }, // right of top-left
    { x: tl.x, y: tl.y + tl.h + g }, // below top-left
    { x: br.x - g - tw, y: br.y + br.h - th }, // left of bottom-right
    { x: br.x + br.w - tw, y: br.y - g - th }, // above bottom-right
    { x: bl.x + bl.w + g, y: bl.y + bl.h - th }, // right of bottom-left
    { x: bl.x, y: bl.y - g - th }, // above bottom-left
    { x: centre.x - tw / 2, y: centre.y - th / 2 }, // middle of the area
    { x: w / 2 - tw / 2, y: g }, // top middle of the screen
    { x: w / 2 - tw / 2, y: h / 2 - th / 2 }, // middle of the screen
  ].map((c) => ({ x: clamp(c.x, 0, w - tw), y: clamp(c.y, 0, h - th), w: tw, h: th }));
  return candidates.find((c) => handles.every((hb) => !overlaps(c, hb, g))) ?? candidates[0];
}

function makeDragable(elmnt: HTMLElement, onExit: () => any = () => {}) {
  // corners of the area as fractions of the screen (SCR-11), so the mapping survives resizes such as entering fullscreen
  let corners: Corners = copyCorners(DEFAULT_CORNERS);
  let frame = 0; // pending requestAnimationFrame id, 0 if none

  const styleElement = document.createElement("style");
  styleElement.textContent = `
        .dragcontainer {
          position: fixed;
          inset: 0;
          transform-origin: 0 0;
        }
        /* will-change only while in setup: the layer then isn't re-rasterised on every move. Removing it on exit lets
           the browser re-rasterise once at the final warp, so text stays sharp during the show. */
        .dragmode {
          outline: 2px solid blue;
          outline-offset: -2px;
          cursor: move;
          touch-action: none;
          will-change: transform;
        }
        .mapping-overlay {
          display: none;
          position: fixed;
          inset: 0;
          z-index: 10;
          pointer-events: none;
        }
        .dragmode + .mapping-overlay {
          display: block;
        }
        .mapping-handle,
        .mapping-toolbar {
          position: absolute;
          top: 0;
          left: 0;
          pointer-events: auto;
          touch-action: none;
          user-select: none;
        }
        .mapping-handle {
          width: ${HANDLE_SIZE}px;
          height: ${HANDLE_SIZE}px;
          box-sizing: border-box;
          border: 3px solid white;
          border-radius: 50%;
          background-color: rgba(0, 0, 255, 0.6);
          cursor: grab;
        }
        .mapping-toolbar {
          display: flex;
          gap: 4px;
          width: ${TOOLBAR_WIDTH}px;
          height: ${TOOLBAR_HEIGHT}px;
        }
        .mapping-toolbar > div {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: blue;
          color: white;
          cursor: pointer;
        }
  `;
  document.head.appendChild(styleElement);

  // overlay with the handles and toolbar. It follows the area, so CSS shows it only in setup mode.
  const overlay = document.createElement("div");
  overlay.classList.add("mapping-overlay");
  const handles = corners.map((_, i) => {
    const handle = document.createElement("div");
    handle.classList.add("mapping-handle");
    handle.addEventListener("pointerdown", (e) => startCornerDrag(e, i));
    overlay.append(handle);
    return handle;
  });
  const toolbar = document.createElement("div");
  toolbar.classList.add("mapping-toolbar");
  const resetBtn = document.createElement("div");
  resetBtn.textContent = "↺";
  resetBtn.title = "Reset to a rectangle";
  resetBtn.onclick = () => {
    corners = copyCorners(DEFAULT_CORNERS);
    scheduleRender();
  };
  const exitBtn = document.createElement("div");
  exitBtn.textContent = "❌";
  exitBtn.title = "Exit screen setup";
  exitBtn.onclick = onExit;
  toolbar.append(resetBtn, exitBtn);
  overlay.append(toolbar);
  elmnt.after(overlay);

  // dragging inside the area moves all four corners
  elmnt.addEventListener("pointerdown", (e) => {
    if (elmnt.classList.contains("dragmode")) {
      startAreaDrag(e);
    }
  });
  window.addEventListener("resize", scheduleRender);

  // render applies the corners: the area's warp, and the handle and toolbar positions. Transforms only, so no layout.
  function render() {
    frame = 0;
    const { w, h } = viewport();
    if (!w || !h) return;
    const px = toPixels(corners, w, h);
    elmnt.style.transform = cornersToMatrix3d(px, w, h);
    const boxes = px.map((p) => handleBox(p, w, h));
    boxes.forEach((b, i) => (handles[i].style.transform = `translate(${b.x}px, ${b.y}px)`));
    const centre = { x: px.reduce((s, p) => s + p.x, 0) / 4, y: px.reduce((s, p) => s + p.y, 0) / 4 };
    const t = placeToolbar(boxes, centre, w, h);
    toolbar.style.transform = `translate(${t.x}px, ${t.y}px)`;
  }

  // scheduleRender coalesces updates to at most one per frame, however fast pointer events arrive
  function scheduleRender() {
    if (!frame) {
      frame = requestAnimationFrame(render);
    }
  }

  // trackPointer captures the pointer on `target`, calls onMove with the pointer position for each move, and stops on
  // release. Pointer events cover mouse, touch and pen in one path.
  function trackPointer(
    e: PointerEvent,
    target: HTMLElement,
    onMove: (x: number, y: number, ev: PointerEvent) => void,
  ) {
    e.preventDefault();
    target.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return;
      onMove(ev.clientX, ev.clientY, ev);
      scheduleRender();
    };
    const end = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return;
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", end);
      target.removeEventListener("pointercancel", end);
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", end);
    target.addEventListener("pointercancel", end);
  }

  // startCornerDrag moves one corner by the pointer's movement, so the corner doesn't jump when grabbed (SCR-3).
  // With Shift or Ctrl held, the whole shape scales about the opposite corner instead, keeping its aspect ratio
  // (SCR-12). The keys are read on every move, so they can be pressed or released mid-drag.
  // The shape stays on screen, and stops at the last valid position rather than fold over or leave the screen.
  function startCornerDrag(e: PointerEvent, index: number) {
    const { w, h } = viewport();
    const startPx = toPixels(corners, w, h);
    const start = startPx[index];
    const anchor = startPx[(index + 2) % 4];
    trackPointer(e, handles[index], (x, y, ev) => {
      const target = { x: start.x + x - e.clientX, y: start.y + y - e.clientY };
      let px: Corners;
      if (ev.shiftKey || ev.ctrlKey) {
        // scale factor: how far the pointer has moved along the diagonal from the opposite corner
        const dx = start.x - anchor.x;
        const dy = start.y - anchor.y;
        const s = ((target.x - anchor.x) * dx + (target.y - anchor.y) * dy) / (dx * dx + dy * dy);
        px = startPx.map((p) => ({ x: anchor.x + s * (p.x - anchor.x), y: anchor.y + s * (p.y - anchor.y) })) as Corners;
        if (px.some((p) => p.x < 0 || p.x > w || p.y < 0 || p.y > h)) return;
      } else {
        px = copyCorners(startPx);
        px[index] = { x: clamp(target.x, 0, w), y: clamp(target.y, 0, h) };
      }
      if (isValidShape(px)) {
        corners = toFractions(px, w, h);
      }
    });
  }

  // startAreaDrag moves all corners together, stopping at the screen edges so the shape is unchanged
  function startAreaDrag(e: PointerEvent) {
    const { w, h } = viewport();
    const startPx = toPixels(corners, w, h);
    const minX = Math.min(...startPx.map((p) => p.x));
    const maxX = Math.max(...startPx.map((p) => p.x));
    const minY = Math.min(...startPx.map((p) => p.y));
    const maxY = Math.max(...startPx.map((p) => p.y));
    trackPointer(e, elmnt, (x, y) => {
      const dx = clamp(x - e.clientX, -minX, w - maxX);
      const dy = clamp(y - e.clientY, -minY, h - maxY);
      corners = toFractions(
        startPx.map((p) => ({ x: p.x + dx, y: p.y + dy })) as Corners,
        w,
        h,
      );
    });
  }

  render();
}

export { makeDragable };
