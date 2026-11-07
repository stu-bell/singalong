This is a Singalong app, used to project lyrics of songs on a projector screen, while playing the music track and/or music video in sync with the lyrics, so that viewers can sing along with the music.

It should run in the browser, using local media files. The setup process involves loading a local folder containing the media.

Lyrics files are .LRC files or .txt files.

Music and video files are mp3, m4a, mp4 etc.

A _playlist.tsv file in the media folder specifies the track order, and allows trimming the media to help sync the lyrics with the song media.

Since the app may be projected, a screen setup journey may occur before starting the show. This allows resizing of the screen to fit a projector screen.

When a track plays, the lyrics are presented on the screen, line by line, relative to the timestamp of the LRC file.

Keyboard shortcuts or tap gestures allow micro adjustments to the displayed lyric timing, to make fine tune adjustments during play, or to sync with live musicians.

# Conventions

Requirements below are numbered (e.g. `LYR-3`) so that tests, TODO items and commits can refer to them. Each should be checkable by hand or testable.

- ⚠ = intended behaviour that the code does not yet meet (a known bug or gap)
- ❓ = the code does this, but it is not confirmed as intended. Needs a decision.

A bug is a deviation from a requirement. Fixing a bug covered by an existing requirement needs no spec change. If no requirement covers it, add one first.

`TODO.md` holds unsettled ideas only. Once an idea is accepted, it becomes a requirement here.

# Media folder (MED)

- MED-1. The user selects one folder. The app reads files from it and all its subfolders, so lyrics and media may be kept in separate subfolders. Playlist entries refer to files by file name only, not by path. If two files in different subfolders share a name, and a playlist row refers to that name, the row is ambiguous: it is reported as an error and skipped. ⚠ The code currently uses the first match silently. Errors are shown as described in MED-6.
- MED-2. Lyrics files are `.lrc` or `.txt`. Audio and video files are `.mp3`, `.m4a` or `.mp4`.
- MED-3. `_playlist.tsv` (name matched case-insensitively) is tab-separated with a header row and the columns `lyrics`, `media`, `start`, `end`, `fade`. One row is one song; row order is play order. The `media` column names an audio or video file; for a video file the audio comes from the video. For backward compatibility, a column named `audio` is accepted as an alias for `media`. If a file has both, `media` is used.
- MED-4. `lyrics` is required. `media`, `start`, `end` and `fade` are optional. A row with no media shows its lyrics with no sound, and the user advances manually.
- MED-5. Times in `start`, `end` and `fade` are seconds (`35.6`) or `m:ss.xx` (`0:35.63`). Blank means: start at 0, end at end of file, no fade.
- MED-6. A row is skipped, and the problem reported, if its lyrics cell is empty, its lyrics file is missing, or its extension is unsupported. A missing media file is reported but the row is kept. Problems are shown to the user on screen, never only in the console. They must not interrupt the show: they appear before play starts, or as a discreet on-screen message during play (not an alert or modal). ⚠ Errors currently go to the console only.
- MED-7. If the folder has no `_playlist.tsv`, the app generates a starter file, downloads it, and asks the user to save it into the folder and retry. The file uses the `media` column name. Each media file (audio or video) is paired with the most similar lyrics filename. Unmatched lyrics files are appended as rows with no media.
- MED-8. File names in the playlist must match exactly (case-sensitive).

# Lyrics (LYR)

- LYR-1. `.lrc`: each `[mm:ss.xx]text` line is a lyric line shown at that time. A line with several timestamps becomes several lines. Lines are ordered by timestamp.
- LYR-2. `.lrc`: metadata tags such as `[ar:…]` and `[ti:…]` are never displayed. A timestamp with no text is a blank line, which moves the highlight off the previous line. Blank lines are how the LRC author clears lyrics from the screen, e.g. for an instrumental (see LYR-13). They behave the same whatever line endings the file uses (Windows or Unix).
- LYR-3. `.txt`: each line of the file is a lyric line with no timestamps. The user advances manually.
- LYR-4. A blank line is added at the start of every track, so the first lyric starts as a preview rather than the active line.
- LYR-5. A fixed number of lines is visible (the visible line count; currently 3, and it may change or become user-configurable). The first is the current line, shown large. The rest are shown smaller as a preview, at 2/3 the size of the current line. Requirements refer to the visible line count, never to a specific number.
- LYR-6. In an `.lrc` file, the next line advances automatically after the delay between the current and next timestamps.
- LYR-7. "Next line" moves forward immediately. The following automatic advance is rescheduled relative to the line the user moved to. This is how the user nudges timing to follow live musicians.
- LYR-8. "Previous line" restarts the current line's timer. Two presses within 0.8s move back one line. Stepping back brings the previous line in at the top as the current line, and the bottom line leaves, so the visible line count stays the same (see LYR-5).
- LYR-9. A "next" input within 0.5s of an automatic advance is ignored, to avoid double-advancing.
- LYR-10. `.txt` files must render, with or without audio, starting at their first line.
- LYR-11. ⚠ Empty lines at the top of the screen must not take up large vertical space.
- LYR-12. When a track has `start`/`end`, lyrics begin at the line matching `start`, and lines after `end` are dropped.
- LYR-13. A blank line followed by a gap longer than the preview lead time is a break (an intro or instrumental). Lines after a break are not shown until the lead time before the line that follows the break; they then appear together. Lines before a break show as usual. So no text is on screen during intros and instrumentals, and lyrics after an instrumental never show ahead of it. The starting blank line (LYR-4) is a break if the first lyric is more than the lead time away. The lead time is currently 2 seconds, and is kept as a constant in one place so it is easy to change. While the current line has text, the lines up to the next break stay visible, even before a long gap, so lyrics don't vanish during long notes. Untimed lyrics (`.txt`) have no breaks.
- LYR-14. While the current line is a break and the lines after it are hidden (LYR-13), "next line" shows them instead of moving forward. The next "next line" moves forward as usual (LYR-7). While the current line has text, "next line" moves forward as usual, even if lines further down are hidden. This lets the user bring the lyrics in early, e.g. for live musicians.

# Playback (PLY)

- PLY-1. Pressing Go enters fullscreen, hides the cursor, and starts the first track. The Tab key is disabled during the show.
- PLY-2. A track plays from `start` to `end`. When it ends, the next track starts automatically.
- PLY-3. `fade` on a row is the overlap between that track and the next. The next track starts `fade` seconds before this one ends, with a linear crossfade. A `fade` of 0 means no overlap.
- PLY-4. Lyrics switch to the new track about two-thirds of the way through the fade.
- PLY-5. Reaching the last lyric line never ends a track by itself. If the lyrics finish while the audio is still going, the audio keeps playing until the track's `end` (or the end of the file) is reached, as in PLY-2, or until the user gives a "next line" input (key or gesture) on the last line, which moves to the next track. For a track with no audio, only that user input moves on.
- PLY-6. The show ends after the last track completes, i.e. when its audio reaches `end` (or the end of the file), or when the user gives a "next line" input on its last lyric line (PLY-5). Nothing restarts or loops. ⚠ The code currently replays the last track, and the home screen help text says so. When the show ends, the lyrics (and video, if any) fade to a blank screen.
- PLY-7. OS media keys work: play, pause, next, previous. A silent looping audio element keeps the media session active.
- PLY-8. OS pause pauses the media (audio, and video if present) and the lyrics timer together. OS play resumes both from where they stopped, so lyrics stay in sync with the audio. The timer that moves to the next track at the track's end (PLY-2) is paused and resumed too. ⚠ OS play/resume was reported broken (TODO) and still needs checking with real media keys.
- PLY-9. For an mp4, the audio plays exactly as for an audio file: same `start`, `end` and `fade` behaviour (PLY-2 to PLY-4). The video is shown in sync with the audio, starting at `start`.
- PLY-10. Video crossfades over the same `fade` duration as the audio. If the next track has no video, the outgoing video fades to the background.
- PLY-11. If an mp4's video can't be decoded, the track plays audio-only and the problem is reported as in MED-6.

# Controls (CTL)

- CTL-1. Next line: Space, ↓, →, PageDown. Previous or restart line: ↑, ←, PageUp.
- CTL-2. Next song: Shift+N. Previous song: Shift+P. Toggle screen setup: Shift+Z.
- CTL-3. Text size follows browser zoom (Ctrl +, Ctrl −, Ctrl 0). Ctrl+R returns to the home screen.
- CTL-4. Touch: a double tap on the right half of the screen is next line; on the left half is previous line. A single tap does nothing, to prevent accidental input.

# Screen setup (SCR)

- SCR-1. The lyrics area is a four-sided area that can be dragged (all corners together) and reshaped by dragging any of its four corners (SCR-3). Screen setup is entered from the home screen button or Shift+Z.  Screen setup is exited by any of: Enter, Space, Esc, Shift+Z, or a visible ❌ button in the top-right corner of the area. While in screen setup, these keys do only that: Space does not also advance the lyrics (CTL-1). ⚠ Currently only Shift+Z and the ❌ button exit.
- SCR-2. Text scales with the area: the current line is 5% of the area's width before the corner warp (SCR-3) is applied, preview lines 2/3 of that (LYR-5). So text keeps its proportion when the area is moved, resized or reshaped.
- SCR-3. All four corners of the lyrics area can be dragged independently, so the picture can be fitted to a projector screen when the projector is at an angle. The video, filter and lyrics are warped together with a perspective transform, so straight lines stay straight. A corner cannot be dragged so that the shape folds over itself, flattens towards a triangle, or puts two corners almost on top of each other; it stops at the last valid position. A reset control returns the area to the default rectangle. The corner handles, the reset control and the ❌ button are not warped. The ❌ and reset controls never overlap a corner handle: they sit beside the top-right handle when there is room, and move elsewhere when a handle is in the way. While the area is shown, the home screen is hidden, so only the area lights up on the projector (SCR-9).
- SCR-4. The browser must support the File System Access API (`showOpenFilePicker`). Otherwise the user sees an "unsupported browser" page.
- SCR-5. ⚠ The home screen scrolls incorrectly (TODO: possibly make it a modal).
- SCR-6. The video fills the lyrics area behind the text, shown with `contain`: the whole frame is visible, with bars where its shape doesn't match the area. It is clipped to the resizable area and resizes with it (SCR-1).
- SCR-7. A translucent filter sits over the video and under the text. The lyrics text is white and thick, with a dark grey outline, in Rubik Bold (weight 700), with a bold brush cursive font as the fallback (system fonts: Brush Script MT, then the default cursive font). Preview lines (LYR-5) are fully opaque, so the video does not show through them, and use a very pale grey instead of white. They must stay easy to read, and look different from the current line so it is clear they are not being sung yet. ❓ The outline width and filter strength are to be chosen by testing options visually and getting user feedback, ideally on a projector. They are kept as constants in one place, so options are easy to change. The font must be bundled with the app, not loaded from an online font service, so the app works offline.
- SCR-8. Audio-only tracks use a black background, so the lyrics style in SCR-7 applies to every track.
- SCR-9. While the lyrics area is shown (during the show and in screen setup), the page around it is black, so only the lyrics area lights up on the projector.
- SCR-10. Projection mapping must not add per-frame script work or copies of video frames. The warp is applied by the browser's compositor (a CSS transform), so video playback costs the same with or without it.
- SCR-11. The area's corners are kept as fractions of the screen size, so the mapping stays aligned when the window changes size (for example on entering fullscreen). They are not saved: a refresh resets the area to the default rectangle.
- SCR-12. Holding Shift or Ctrl while dragging a corner handle scales the area about the opposite corner, keeping its shape and aspect ratio, by the pointer's movement along that diagonal. On touch-only devices, with no modifier keys, corners are always dragged freely (SCR-3).
- SCR-13. When screen setup is opened from the home screen, a sample lyric "Sing-along!" is shown in the lyrics area, styled as the current line, as a visual aid for sizing. It may be seen by the audience. It is not shown when setup is opened during the show, where the real lyrics are on screen.
- SCR-14. The home screen (and the unsupported browser page, SCR-4) uses a dark theme: a dark grey background with light text, and links and table colours chosen to stay readable on it. This avoids a bright white page on the projector before and between shows.
- SCR-15. On the home screen, the Tab key moves through the buttons in this order: Choose Folder, Go, Screen setup. Go is skipped while it is disabled (before a folder is chosen). The buttons keep their visual order.
