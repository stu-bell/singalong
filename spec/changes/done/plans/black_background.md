---
status: done
---

# Black background around and behind the lyrics: implementation plan

Requested directly by the user on the `lyrics` branch: "change the background to black on video - there's a white
border around the video".

Cause: the lyrics area is 98vw × 98vh, offset from the corner (`src/drag.ts`), and the page behind it has no
background colour, so a white strip shows around it. This happens on every track; it stands out most with video.

## Draft spec update

New SCR-9 in `spec/_spec.md`:

> - SCR-9. While the lyrics area is shown (during the show and in screen setup), the page around it is black, so only
>   the lyrics area lights up on the projector.

SCR-8: "Audio-only tracks use a dark background" becomes "a black background". The bars around a contained video
(SCR-6) are black too, since they show the same background.

SCR-2 (missed in the font change): "preview lines half that" becomes "preview lines 2/3 of that (LYR-5)".

## Approach

- `src/theme.ts`: `backgroundColor` from `#111111` to `#000000`; this is the lyrics area background (SCR-6, SCR-8).
  New `pageColor: "#000000"` for the page around the area, exposed as a CSS custom property by `applyTheme`.
- `src/styles.css`: `body:has(#dragcontainer:not(.hidden)) { background-color: var(--theme-page) }`. No script
  changes: the page turns black whenever the lyrics area is visible, and goes back to normal on the home screen.
  `:has` needs Chrome 105+; the app already needs a newer Chrome (SCR-4).

## Impact

- The home screen is unchanged.
- In screen setup, the blue outline and handles show on black instead of white.
- Audio-only tracks go from very dark grey to black. With video, the translucent filter (SCR-7) already darkens the
  picture, so nothing changes there.

## Alternatives

- Make the lyrics area fill the whole screen. Rejected: the area is meant to be resizable for projection (SCR-1).
- Black only while a video is playing. Rejected: the white strip shows on audio tracks too.
