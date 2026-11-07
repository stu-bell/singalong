---
status: done
---

# Fix: lyrics after an instrumental show early as preview lines

Bug reported by the user on the `lyrics` branch. With

```
[00:01]first line
[00:02]
[00:05]third line
```

"third line" shows as a preview while "first line" is current, then disappears when the blank line becomes current,
and comes back 2s before it is sung. It should not show at all until 2s before it is sung.

Cause: LYR-13 is implemented by checking only whether the *current* line is blank. A blank line further down the
preview is ignored, so the lines after it show early.

## Draft spec update

Replace LYR-13 in `spec/_spec.md` with:

> - LYR-13. A blank line followed by a gap longer than the preview lead time is a break (an intro or instrumental).
>   Lines after a break are not shown until the lead time before the line that follows the break; they then appear
>   together. Lines before a break show as usual. So no text is on screen during intros and instrumentals, and lyrics
>   after an instrumental never show ahead of it. The starting blank line (LYR-4) is a break if the first lyric is more
>   than the lead time away. The lead time is currently 2 seconds, and is kept as a constant in one place so it is easy
>   to change. While the current line has text, the lines up to the next break stay visible, even before a long gap, so
>   lyrics don't vanish during long notes. Untimed lyrics (`.txt`) have no breaks.

Update LYR-14 to say which hidden lines "next line" reveals:

> - LYR-14. While the current line is a break and the lines after it are hidden (LYR-13), "next line" shows them
>   instead of moving forward. The next "next line" moves forward as usual (LYR-7). While the current line has text,
>   "next line" moves forward as usual, even if lines further down are hidden.

## Approach

`src/lyrics.ts`:

- Replace the current-line check with a scan of the visible lines (current + preview). Find the first break: a blank
  line whose gap to the following line is more than the lead time, and whose reveal time (following line's timestamp
  − lead time) is still in the future. Song time "now" is the current line's timestamp, or the seek offset on the
  first render, as the scroll timer already uses.
- Hide each visible line after that break, with a `preview-hidden` class on the line itself (instead of on the list),
  and schedule the reveal for its reveal time. When the reveal fires, scan again from that time, so a second break
  later in the visible lines is handled too.
- Run the scan after the lines on screen change. `advanceLine` and `scrollPreviousLine` currently reset the timer
  before updating the lines on screen; swap the order so the scan sees the new lines. Lines on their way out
  (`.zero`) are skipped.
- LYR-14: `scrollNextLine` reveals instead of moving forward only when the break is the current line.

`src/resizing.ts`: style `#lyricsContainer li.preview-hidden { opacity: 0 }` in place of the list-level rule.

## Impact

- Fixes the reported case, and the same thing for a long intro after the starting blank line (which already works).
- Short blank lines (gap of 2s or less) are not breaks: they move the highlight off the previous line, and the lines
  after them show as preview, as before.
- Pause/resume of the reveal timer (PLY-8) is unchanged.

## Alternatives

- Hide each preview line until 2s before it is sung, whether or not there's a blank line. Rejected: normal lyrics
  would only show 2s ahead, which goes against reading ahead during long notes (LYR-13).

## Testing

- Browser check (Playwright) with the case above: "third line" stays hidden while "first line" and the blank line are
  current, and appears 2s before it is sung. Re-run the earlier intro, gap, "next" and pause checks.
