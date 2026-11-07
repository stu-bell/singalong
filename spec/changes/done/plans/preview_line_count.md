---
status: done
---

# Fewer preview lines: implementation plan

Requested directly by the user on the `lyrics` branch: reduce the number of preview lines by one.

## Draft spec update

LYR-5 in `spec/_spec.md`, change "currently 4" to "currently 3":

> - LYR-5. A fixed number of lines is visible (the visible line count; currently 3, and it may change or become
>   user-configurable). The first is the current line, shown large. The rest are shown smaller as a preview.
>   Requirements refer to the visible line count, never to a specific number.

## Approach

- `src/lyrics.ts`: set `numberOfLines` from 4 to 3, so 1 current line and 2 preview lines are shown.
- Add a comment on `numberOfLines` pointing to LYR-5.

## Impact

- Applies to every track, audio and video.
- All the line logic (advance, step back, seek) already uses `numberOfLines`, as LYR-5 requires, so nothing else changes.
- The lyrics take up less height on screen, leaving more of the video visible.

## Alternatives

- Make the count a user setting. Not needed now; LYR-5 already allows it later.

## Testing

- Type-check and build.
- Browser check with `tests/sampledata`: 3 lines on screen, and next/previous line still keep the count at 3.
