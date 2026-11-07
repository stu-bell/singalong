// theme.ts holds the look of the lyrics screen in one place, so options can be tried out easily (SCR-7).
// Colours are CSS colours. Ratios are fractions of the lyric font size, which itself scales with the lyrics area (see resizing.ts).
export const theme = {
  // Fredoka SemiBold is bundled with the app (imported in main.ts). The brush cursive fallback is only used if the font
  // fails to load, or for characters Fredoka lacks (it covers Latin and Hebrew). Brush Script MT ships with Windows and
  // macOS; other systems use their default cursive font. It has no bold, so the browser thickens it (SCR-7).
  fontFamily: '"Fredoka", "Brush Script MT", cursive',
  fontWeight: 600,
  // preview line size, as a fraction of the current line (LYR-5)
  previewScale: 2 / 3,
  textColor: "#ffffff",
  // preview (upcoming) lines are opaque, in a very pale grey, so they read clearly over video but look not yet active
  previewTextColor: "#d9d9d9",
  outlineColor: "#3a3a3a",
  // outline width as a fraction of the font size. The outline is centred on the glyph edge, so about half of it shows outside the letter.
  outlineRatio: 0.12,
  // background of the lyrics area, visible when there is no video (SCR-8) and behind a contained video (SCR-6)
  backgroundColor: "#000000",
  // page around the lyrics area, while the area is shown, so only the area lights up on a projector (SCR-9)
  pageColor: "#000000",
  // opacity of the dark filter between the video and the text (0 = none, 1 = black)
  filterOpacity: 0.45,
};

// applyTheme exposes the theme values used by plain CSS as custom properties
export function applyTheme() {
  const root = document.documentElement.style;
  root.setProperty("--theme-background", theme.backgroundColor);
  root.setProperty("--theme-page", theme.pageColor);
  root.setProperty("--theme-filter-opacity", String(theme.filterOpacity));
}
