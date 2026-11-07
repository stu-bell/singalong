---
status: done
---

# Opaque preview lyrics: implementation plan

Implements `spec/changes/lyrics_theme.md` on the `lyrics` branch. Spec revision: SCR-7 in `spec/_spec.md`
(preview lines are opaque and a very pale grey).

## Approach

- `theme.ts`: add `previewTextColor`, a very pale grey (start with `#d9d9d9`), next to `textColor`.
- `resizing.ts`: preview lines (`#lyricsContainer li`) use `previewTextColor` at `opacity: 1`, instead of white at `opacity: 0.6`.
  The current line (`li.large`) sets `color: textColor` (white).
- `styles.css`: remove the old `li { opacity: 0.6 }` / `li.large { opacity: 1 }` rules. The dynamic styles in `resizing.ts` already
  override them, so they are dead code that would confuse future changes.

## Impact

- Applies to every track, not just video, because SCR-8 says one lyrics style applies to all tracks. On the dark background
  the preview lines will look brighter than before.
- When a line becomes the current line, the existing 0.2s transition fades it from grey to white as it grows. No extra code needed.
- The outline stays the same dark grey on both preview and current lines.

## Alternatives

- Keep slight transparency (e.g. 0.9 opacity). Rejected: the change asks for opaque text.
- Mark preview lines another way (thinner outline, smaller size only). Rejected: the change asks for a greyer colour.

## Testing

- `npm run build` to check types.
- Visual check in the browser with `tests/sampledata` (audio track and video track), using Playwright screenshots.
