---
status: done
---

# Hide preview lines during instrumentals: implementation plan

Implements `spec/changes/feat/previewlines.md` on the `lyrics` branch.

## Draft spec update

Add to the Lyrics (LYR) section of `spec/_spec.md`:

> - LYR-13. While the current line is blank (including the starting blank line, LYR-4) and the next line is more than
>   the preview lead time away, the preview lines are hidden, so no text is on screen during intros and instrumentals.
>   The preview lines all appear together, the lead time before the next line. The lead time is currently 2 seconds,
>   and is kept as a constant in one place so it is easy to change. Untimed lyrics (`.txt`) always show their preview lines.
> - LYR-14. While the preview lines are hidden (LYR-13), "next line" shows them instead of moving forward. The next
>   "next line" moves forward as usual (LYR-7). This lets the user bring the lyrics in early, e.g. for live musicians.

No change to LYR-2. It already says a timestamp with no text is a blank line; the code doesn't do that for all files
(see phase 1).

## Phases

### 1. Fix: keep blank lines in all `.lrc` files (LYR-2)

`src/lrcFile.ts`, `parseLrcLines`:

- Line endings: `replace('\r\n', '\n')` only replaces the first one. Use `/\r\n?/g`, so every line ending is handled.
- The filter that drops tag lines (`[ar:…]`, `[ti:…]`) also drops lines that are only a timestamp, e.g. `[00:05.00]`.
  This only bites in files with Unix (LF) line endings; in Windows (CRLF) files the trailing `\r` happens to hide them
  from the filter. Change it to drop only lines with no timestamp. Metadata tags never match the timestamp pattern,
  so they are still ignored.

Effect: blank lines behave the same whatever editor saved the file. Files with Unix line endings will now get the
blank lines their author wrote.

### 2. Hide and reveal preview lines (LYR-13, LYR-14)

`src/lyrics.ts`:

- New constant `PREVIEW_LEAD_SECONDS = 2`, commented with LYR-13.
- After each line change (`renderLyrics`, `scrollNextLine`, `scrollPreviousLine`), check: is the current line blank
  (text is empty after trimming), and is the next line's timestamp more than the lead time away?
  - If so, add a `preview-hidden` class to the lyrics list, and start a reveal timer for (gap − lead time).
  - Otherwise, remove the class.
- The reveal timer uses the same pause/resume handling as the scroll timer (PLY-8), so pausing the music also pauses
  the reveal. It is cancelled whenever the line changes.
- `scrollNextLine`: if the preview lines are hidden, cancel the reveal timer and show them, then return without moving
  forward (LYR-14). The scroll timer keeps running, so the next line still arrives on time.

`src/resizing.ts`: `#lyricsContainer.preview-hidden li { opacity: 0 }`. The lines stay in the layout (so nothing jumps
when they appear) and fade in with the existing transition.

## Impact

- Intros: with the starting blank line (LYR-4), the screen is now empty until 2s before the first lyric, instead of
  showing the first lines straight away. A track that starts part way through (`start`) follows the same rule from
  that point.
- Instrumentals only hide the lyrics if the LRC file has a blank line at the end of the sung part. Files without
  blank lines behave as now.
- During a long sung line (current line has text) the preview lines stay visible, so singers can still read ahead.
- `.txt` files are unaffected: they have no timestamps, so there is no gap to measure.
- The "next line" key/gesture during a hidden gap no longer skips a line; it reveals the lyrics. The 0.5s
  double-advance guard (LYR-9) is unchanged.

## Alternatives

- Hide preview lines whenever the next line is far away, even if the current line has text. Rejected: lyrics would
  vanish during long held notes.
- Reveal the preview lines one at a time as each comes within the lead time. Rejected: the feature note asks for
  all-or-nothing, which is less distracting.
- Let the user set the lead time. Not needed now; it's a single constant, so this can be added later.

## Testing

- Unit check of `parseLrcLines` with LF and CRLF files containing blank timestamp lines (scratch script; the project
  has no test runner).
- Browser check (Playwright) with a test LRC file: long intro → nothing shown until 2s before the first line;
  "next" during the gap reveals the preview lines; pause during the gap delays the reveal; short gaps behave as before.
