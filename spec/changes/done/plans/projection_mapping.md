---
status: done
---

# Projection mapping (four draggable corners): implementation plan

Implements `spec/changes/feat/projection_mapping.md` and TODO "Next" item 1. Covers SCR-3 (was ⚠), and adds
SCR-10 to SCR-13. Plan approved by the user, with changes recorded under "Decisions".

## Current state

- `src/drag.ts` moves and resizes `#dragcontainer` by writing `left`/`top`/`width`/`height` (layout properties). Only
  two handles exist: top-left (move + resize) and bottom-right (resize). The area is always a rectangle.
- `src/resizing.ts` watches the container with a `ResizeObserver` during screen setup and rewrites a `<style>` block
  so the font is 5% of the area's width (SCR-2).
- The video, filter and lyrics are all children of `#dragcontainer`, so anything applied to it applies to all three.
- Handles are mouse + touch listeners on `document`. Positions live in inline styles and are lost on reload.

## Approach: CSS `matrix3d` homography

A projector aimed off-axis turns a rectangle into a general four-sided shape (keystone). The exact correction for
this is a perspective transform (homography): a 3×3 matrix that maps the rectangle's four corners onto four chosen
points. CSS can apply one directly with `transform: matrix3d(...)`.

1. `#dragcontainer` keeps a fixed layout size: the full viewport (`inset: 0`, `transform-origin: 0 0`). It no longer
   changes `left`/`top`/`width`/`height`.
2. The user drags four corner handles. On each move, compute the homography from the viewport rectangle
   `(0,0) (w,0) (w,h) (0,h)` to the four handle positions, and set it as `matrix3d`. This is about 40 lines of maths
   in a new `src/projection.ts` (square-to-quad, no dependency).
3. Handles and the ❌ button move to a separate, untransformed overlay layer positioned at the corner points, so they
   are not warped and stay a constant, tappable size.
4. Dragging the area's interior moves all four corners together (keeps SCR-1 "dragged"). Dragging a corner reshapes
   it (covers "resized" and angled projection).
5. A "reset" control returns the area to the default rectangle.

### Font size (SCR-2)

Because the layout box no longer changes size, the font no longer needs recomputing while corners move: the warp
scales the text along with the video. `resizing.ts` keeps its `ResizeObserver` during setup, which now fires only when
the window itself changes size (e.g. entering fullscreen), not on every drag. Text keeps the same proportion of the
area, which is what SCR-2 intends.

### Storing the corners

Corners are stored as fractions of the viewport (0–1), not pixels, and converted to pixels when applied. So the
mapping survives the window resizing, e.g. entering fullscreen. Screen setup already enters fullscreen
(`enterScreenSetup` in `main.ts`), which keeps setup and show at the same size.

## Performance

The feature brief asks for minimal impact on video and memory. This approach is chosen mainly for that.

| Concern | Impact | Notes |
| --- | --- | --- |
| Per-frame cost during the show | None in JS | The transform is static. The GPU compositor draws the warped layer each frame, as it already composites the video under the filter. No `requestAnimationFrame` loop, no canvas. |
| Video frames | No extra copies | The video stays a normal `<video>` element. The browser samples its decoded frame as a texture with the transform applied. No `drawImage`/`texImage2D` per frame (the WebGL alternative would need this). |
| Hardware video overlay | Possibly lost | Some GPUs can scan out video directly ("overlay planes") only with no transform. A 3D transform falls back to normal compositing: one extra textured draw per frame, negligible on any GPU. Overlay is already unlikely because the filter and text sit on top of the video. |
| Dragging corners | Composite only | Changing `transform` triggers no layout or paint. Pointer moves are coalesced to one update per frame with `requestAnimationFrame`. Today's drag changes `width`/`height`, which re-lays out the lyrics on every mouse move, so this is cheaper than the current code. |
| Memory | About one layer | The container becomes one GPU layer the size of the viewport (≈8 MB at 1920×1080). It is not made larger than the viewport. |
| Text sharpness | Watch | The browser rasterises text at its layout size, then warps it. Shrinking stays sharp; stretching softens. Because the layout box is the full viewport and a projected area is usually smaller, the warp mostly shrinks. |
| `will-change: transform` | Setup only | Set while dragging, so the layer isn't re-rasterised on every move. Removed on exit, so Chrome re-rasterises once at the final transform and the text is as sharp as possible during the show (with `will-change` left on, Chrome keeps the raster at the scale it had, which can blur text). |
| Lyric line changes | Unchanged | Font-size transitions on `li` repaint inside the layer, as they do now. |
| 3D context | Kept flat | Children use the default `transform-style: flat`, so the browser flattens the container once instead of placing each child in 3D. |

## Validity of the shape

If a corner is dragged across another, the shape folds over and the homography flips the image or blows up. Corner
moves are rejected (the handle stops at the last valid position) unless the shape stays convex with every corner
angle between 15° and 165°, and every edge at least 60 px. Testing showed that convexity alone allowed near-triangles
with extreme stretching. Both limits are constants in `projection.ts`.

## Toolbar placement (user request)

The ❌ and a new reset (↺) button form one small toolbar, which must never overlap a corner handle. On each render
it tries positions in order: left of, then below, the top-right handle (the ❌'s usual spot); then beside the other
handles, on the side facing into the area; then the middle of the area and of the screen. It takes the first that
clears every handle by 8 px.

## Additions to the brief (made during implementation)

- Shift or Ctrl while dragging a handle scales the shape about the opposite corner, keeping its aspect ratio (SCR-12).
  Touch has no modifiers, so corners drag freely there.
- A sample lyric "Sing-along!" shows in setup opened from the home screen (SCR-13). It is hidden during the show,
  where it would cover the real lyrics.
- The home screen is hidden while the lyrics area is shown, because a warped area no longer covers it (SCR-3, SCR-9).

## Draft spec updates (`spec/_spec.md`)

- SCR-1: "The lyrics area is a rectangle that can be dragged and resized" becomes "The lyrics area is a four-sided
  area that can be dragged (all corners together) and reshaped by dragging any of its four corners (SCR-3)."
- SCR-2: "Font size scales with the area's width" becomes "Text scales with the area: the current line is 5% of the
  area's width (before the corner warp is applied), so text keeps its proportion when the area is resized or reshaped."
- SCR-3 (replaces the ⚠ item): "All four corners of the lyrics area can be dragged independently, so the picture can
  be fitted to a projector screen when the projector is at an angle. The video, filter and lyrics are warped together
  with a perspective transform, so straight lines stay straight. A corner cannot be dragged so that the shape folds
  over itself. A reset control returns the area to the default rectangle. Handles and the ❌ button are not warped."
- SCR-10 (new): "Projection mapping must not add per-frame script work or copies of video frames. The warp is applied
  by the browser's compositor (a CSS transform), so video playback costs the same with or without it."
- SCR-11 (new): "The area's corners are kept as fractions of the screen size, so the mapping stays aligned when the
  window changes size (for example on entering fullscreen). They are not saved: a refresh resets the area to the
  default rectangle."
- SCR-12, SCR-13 (new): see "Additions to the brief" above. Final wording is in `spec/_spec.md`.

## Files

- New `src/projection.ts`: homography maths, convexity check, applying the transform, corner storage.
- `src/drag.ts`: rewritten for four corner handles, modifier scaling, interior drag, reset, toolbar placement and
  window resize, in an untransformed overlay layer. `main.ts` needed no changes.
- `src/resizing.ts`: the setup sample shares the current line's style.
- `src/index.html`: the sample lyric element.
- `src/styles.css`: hide the home screen while the area is shown; sample lyric placement.

## Checks

- Drag each corner; the video and lyrics follow, lines stay straight, the ❌ and handles are not distorted.
- Try to fold a corner over another: it stops.
- Enter and leave fullscreen: the area stays aligned to the same screen positions.
- Play an mp4 with a strongly warped area: watch for dropped frames (Chrome `chrome://media-internals` or the
  Performance panel's frame track) against the unwarped baseline. Check CPU/GPU in the task manager.
- Look at the text on the projector at a strong angle, with `will-change` removed, to judge sharpness.
- Reset returns the default rectangle.

## Alternatives considered

- **Tilt sliders (`perspective` + `rotateX`/`rotateY`)**, as in the TODO "plane rotation" idea. Fewer controls, but
  can't match an arbitrary keystone exactly, and users have to guess angles. Corner pins are direct: put each corner
  on the screen's corner. Not recommended.
- **WebGL or canvas rendering.** Draw the video into a texture each frame and render text to a canvas. Allows curved
  screens (mesh warp), but copies every video frame, adds GPU memory and code, and text quality is worse. Rejected on
  the brief's performance requirement.
- **Keep layout resizing and add the warp on top.** Fewer changes to `drag.ts`, but then two mechanisms control the
  shape and dragging keeps re-laying out the lyrics. Not recommended.

## Decisions

1. **Persisting the mapping: no.** The user wants a refresh to act as a reset (SCR-11).
2. **Keyboard nudge: not built.** Not confirmed; can follow if precise alignment proves hard on a projector.
3. **Pointer events: used.** One path for mouse, touch and pen, with pointer capture. Departs from the old separate
   mouse and touch listeners.
4. **Text zoom (CTL-3):** fonts are still only recomputed during setup, so Ctrl +/− during the show behaves as before.
   Not yet checked by hand.

## Verified (headless Chromium)

- Homography maps the four corners exactly; folded and flattened shapes are rejected.
- Dragging all four corners, area drag, reset and exit work, with no page errors.
- Over 60 random corner drags, the toolbar never overlapped a handle; it moves below the top-right handle when the
  top-left handle takes its usual spot.
- Halving the window keeps the corners at the same screen fractions.
- Shift and Ctrl scaling keep the aspect ratio about the opposite corner.

Still to check by hand: a real mp4 under a strong warp (frame drops, CPU/GPU), text sharpness on a projector,
touch dragging on a real device, and CTL-3 zoom.
