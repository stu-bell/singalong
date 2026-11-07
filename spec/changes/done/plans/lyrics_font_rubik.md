---
status: done
---

# Rubik Bold as the lyrics font: implementation plan

Requested directly by the user: "can we try the rubik bold font", then "drop the fonts config, just use rubik as the
default font". A build-time font option was built in between and then removed at the user's request, so none of it
remains.

## Draft spec update

SCR-7: "in Fredoka SemiBold (weight 600)" becomes "in Rubik Bold (weight 700)".

## Approach

- `@fontsource/rubik` replaces `@fontsource/fredoka` as a dependency. Bundled, so the app still works offline.
- `src/main.ts` imports `@fontsource/rubik/700.css` (one weight only).
- `src/theme.ts`: `fontFamily` is `"Rubik", "Brush Script MT", cursive`, `fontWeight` is 700. The fallback is
  unchanged.

## Impact

- Rubik covers Latin, Cyrillic, Hebrew and Arabic (Fredoka: Latin and Hebrew), so more lyrics render in the main font.
  The build ships 6 font files instead of 2; browsers download only the ones the lyrics need (unicode-range).
- `theme.outlineRatio` was tuned for Fredoka. Rubik Bold is heavier, so the outline may want a retune on a projector
  (SCR-7 already leaves outline width to visual testing).

## Alternatives considered

- Keep Fredoka and offer Rubik as a build-time option. Built, then dropped by the user.
