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
- MED-2. Lyrics files are `.lrc` or `.txt`. Audio files are `.mp3` or `.m4a`. ⚠ Video (`.mp4`) is not yet supported.
- MED-3. `_playlist.tsv` (name matched case-insensitively) is tab-separated with a header row and the columns `lyrics`, `audio`, `start`, `end`, `fade`. One row is one song; row order is play order.
- MED-4. `lyrics` is required. `audio`, `start`, `end` and `fade` are optional. A row with no audio shows its lyrics with no sound, and the user advances manually.
- MED-5. Times in `start`, `end` and `fade` are seconds (`35.6`) or `m:ss.xx` (`0:35.63`). Blank means: start at 0, end at end of file, no fade.
- MED-6. A row is skipped, and the problem reported, if its lyrics cell is empty, its lyrics file is missing, or its extension is unsupported. A missing audio file is reported but the row is kept. Problems are shown to the user on screen, never only in the console. They must not interrupt the show: they appear before play starts, or as a discreet on-screen message during play (not an alert or modal). ⚠ Errors currently go to the console only.
- MED-7. If the folder has no `_playlist.tsv`, the app generates a starter file, downloads it, and asks the user to save it into the folder and retry. Each audio file is paired with the most similar lyrics filename. Unmatched lyrics files are appended as rows with no audio.
- MED-8. File names in the playlist must match exactly (case-sensitive).

# Lyrics (LYR)

- LYR-1. `.lrc`: each `[mm:ss.xx]text` line is a lyric line shown at that time. A line with several timestamps becomes several lines. Lines are ordered by timestamp.
- LYR-2. `.lrc`: metadata tags such as `[ar:…]` and `[ti:…]` are never displayed. A timestamp with no text is a blank line, which moves the highlight off the previous line.
- LYR-3. `.txt`: each line of the file is a lyric line with no timestamps. The user advances manually.
- LYR-4. A blank line is added at the start of every track, so the first lyric starts as a preview rather than the active line.
- LYR-5. A fixed number of lines is visible (the visible line count; currently 4, and it may change or become user-configurable). The first is the current line, shown large. The rest are shown smaller as a preview. Requirements refer to the visible line count, never to a specific number.
- LYR-6. In an `.lrc` file, the next line advances automatically after the delay between the current and next timestamps.
- LYR-7. "Next line" moves forward immediately. The following automatic advance is rescheduled relative to the line the user moved to. This is how the user nudges timing to follow live musicians.
- LYR-8. "Previous line" restarts the current line's timer. Two presses within 0.8s move back one line. Stepping back brings the previous line in at the top as the current line, and the bottom line leaves, so the visible line count stays the same (see LYR-5).
- LYR-9. A "next" input within 0.5s of an automatic advance is ignored, to avoid double-advancing.
- LYR-10. ⚠ `.txt` files must render, with or without audio. The TODO suspects they currently require audio.
- LYR-11. ⚠ Empty lines at the top of the screen must not take up large vertical space.
- LYR-12. When a track has `start`/`end`, lyrics begin at the line matching `start`, and lines after `end` are dropped.

# Playback (PLY)

- PLY-1. Pressing Go enters fullscreen, hides the cursor, and starts the first track. The Tab key is disabled during the show.
- PLY-2. A track plays from `start` to `end`. When it ends, the next track starts automatically.
- PLY-3. `fade` on a row is the overlap between that track and the next. The next track starts `fade` seconds before this one ends, with a linear crossfade. A `fade` of 0 means no overlap.
- PLY-4. Lyrics switch to the new track about two-thirds of the way through the fade.
- PLY-5. Reaching the last lyric line never ends a track by itself. If the lyrics finish while the audio is still going, the audio keeps playing until the track's `end` (or the end of the file) is reached, as in PLY-2, or until the user gives a "next line" input (key or gesture) on the last line, which moves to the next track. For a track with no audio, only that user input moves on.
- PLY-6. The show ends after the last track completes, i.e. when its audio reaches `end` (or the end of the file), or when the user gives a "next line" input on its last lyric line (PLY-5). Nothing restarts or loops. ⚠ The code currently replays the last track, and the home screen help text says so. When the show ends, the lyrics fade to a blank screen.
- PLY-7. OS media keys work: play, pause, next, previous. A silent looping audio element keeps the media session active.
- PLY-8. OS pause pauses the audio and the lyrics timer together. OS play resumes both from where they stopped, so lyrics stay in sync with the audio. The timer that moves to the next track at the track's end (PLY-2) is paused and resumed too. ⚠ Currently pause suspends the audio only; the lyric and track-end timers keep running, and play/resume is broken (TODO).

# Controls (CTL)

- CTL-1. Next line: Space, ↓, →, PageDown. Previous or restart line: ↑, ←, PageUp.
- CTL-2. Next song: Shift+N. Previous song: Shift+P. Toggle screen setup: Shift+Z.
- CTL-3. Text size follows browser zoom (Ctrl +, Ctrl −, Ctrl 0). Ctrl+R returns to the home screen.
- CTL-4. Touch: a double tap on the right half of the screen is next line; on the left half is previous line. A single tap does nothing, to prevent accidental input.

# Screen setup (SCR)

- SCR-1. The lyrics area is a rectangle that can be dragged and resized. Screen setup is entered from the home screen button or Shift+Z.  Screen setup is exited by any of: Enter, Space, Esc, Shift+Z, or a visible ❌ button in the top-right corner of the area. While in screen setup, these keys do only that: Space does not also advance the lyrics (CTL-1). ⚠ Currently only Shift+Z and the ❌ button exit.
- SCR-2. Font size scales with the area's width: the current line is 5% of the width, preview lines half that.
- SCR-3. ⚠ All four corners should be draggable, to support angled projection (TODO).
- SCR-4. The browser must support the File System Access API (`showOpenFilePicker`). Otherwise the user sees an "unsupported browser" page.
- SCR-5. ⚠ The home screen scrolls incorrectly (TODO: possibly make it a modal).
