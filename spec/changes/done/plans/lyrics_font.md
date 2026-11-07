---
status: done
---

# Lyrics font and preview size: implementation plan

Implements `spec/changes/feat/lyrics_font.md` on the `lyrics` branch.

## Draft spec update

SCR-7 in `spec/_spec.md`: replace "in a bold display font. ❓ The exact font, outline width and filter strength are
to be chosen …" with:

> … in Fredoka SemiBold (weight 600), with a bold brush cursive font as the fallback. ❓ The outline width and filter
> strength are to be chosen by testing options visually and getting user feedback, ideally on a projector. They are
> kept as constants in one place, so options are easy to change. The font must be bundled with the app, not loaded
> from an online font service, so the app works offline.

LYR-5: "The rest are shown smaller as a preview" becomes:

> The rest are shown smaller as a preview, at 2/3 the size of the current line.

## Approach

- Add the npm package `@fontsource/fredoka` (OFL-1.1 licence, v5.3.0) and import its weight 600 stylesheet in
  `src/main.ts`. Vite copies the `.woff2` files into the build, so the font is served with the app and works
  offline. Only the weight 600 files are included.
- `src/theme.ts`:
  - `fontFamily: '"Fredoka", "Brush Script MT", cursive'`, `fontWeight: 600`. Remove the TODO about choosing a font.
  - New `previewScale: 2 / 3`: preview line size as a fraction of the current line.
- `src/resizing.ts`: preview lines use `previewScale` for font size, outline width and line width (currently
  hard-coded `0.5` and `50%`). The width is scaled too, as the existing comment says size and width must stay in
  proportion for the animation.

### Fallback

The fallback only shows if the font file fails to load, or for characters Fredoka doesn't have (it covers Latin and
Hebrew, but not e.g. Greek or Cyrillic). Options:

1. **System fonts (recommended):** `"Brush Script MT", cursive`. Brush Script MT comes with Windows and macOS; other
   systems use their default cursive font. Nothing extra to download. Brush Script MT has no bold, so the browser
   thickens it, and the outline keeps it readable.
2. **Bundle a second, bold brush font** (e.g. Kaushan Script, OFL). Looks the same everywhere, but adds a file to
   the app that will rarely be used, and it also only covers Latin characters.

## Impact

- Fredoka is rounder and wider than Impact, so long lines wrap sooner. The outline ratio (`outlineRatio`) may need
  adjusting after a visual check; I'll include screenshots.
- Bigger preview lines: 3 lines now take more height on screen, and long preview lines wrap more.
- The build gets 1–3 small `.woff2` files (one per character set, ~20–40 KB each). The browser only downloads the
  sets it needs.

## Testing

- Type-check and build; check the font files are in the build output and none load from the internet.
- Browser screenshots (Playwright) of an audio track and a video track, to compare outline and sizes.
