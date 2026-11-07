---
status: done
---

# Video (mp4) support: implementation plan

Implements the approved spec in `spec/_spec.md` on the `video` branch. No spec changes are needed.
Requirement IDs below refer to that file.

## Approach

Keep the existing audio engine. A muted `<video>` plays the same file and follows the audio clock.
The video is created and seeked in advance while the track is queued, so playback starts instantly.
Video logic lives in a new `src/video.ts`, with small hooks into `player.ts`, `playlist.ts`, the layout and the theme.

## Decisions

- Pause/resume (PLY-8) is built first, on this branch, as its own commit. Video pause depends on it.
- Errors for PLY-11 (and other playlist problems) stay in the console. The on-screen toast (MED-6) is out of scope for this work. The spec keeps its warning marker for it.

## Phases

Each phase ends in a working, committable state.

### 0. Pause and resume (PLY-8)

Files: `player.ts`, `lyrics.ts`, `audio.ts`, `mediaSession.ts`

- `pauseSong()` also pauses the lyrics scroll timer and the track-end timer (`nextSongTimeout`), recording the time remaining on each.
- `resumeSong()` resumes the audio and reschedules both timers from the remaining time.
- Investigate and fix why OS play/resume is currently broken (TODO), which may be a separate cause.
- Check: pause for 30s mid-song; on resume the lyrics are in sync with the audio and the next track does not start early.

### 1. Playlist parsing (MED-2, MED-3, MED-7)

Files: `playlist.ts`, `files.ts`, `audio.ts`

- Accept a `media` column, with `audio` as an alias. If both exist, `media` wins.
- Accept `.mp4`. Report an unsupported media extension as an error.
- The starter-playlist generator writes the `media` header, includes `.mp4`, and pairs any media file with a lyrics file.
- Read the duration of every media file (audio and video) from its metadata, using an `<audio>` or `<video>` element and its `loadedmetadata` event, instead of decoding the whole file. Replace `audioFileDuration` in `audio.ts`. Files can be read one after another or in parallel; either is far cheaper than decoding.
- Fallback: if the metadata duration is missing or `Infinity` (can happen with some variable-bitrate mp3s without a length header), fall back to decoding that one file.

### 2. Layout and theme (SCR-6, SCR-7, SCR-8)

Files: `index.html`, `styles.css`, `resizing.ts`, `drag.ts`, new `theme.ts`, a bundled font

- Replace `bg-white` on `#dragcontainer` with a dark background.
- Add two layers inside it, behind `#lyricsContainer`: a video layer and a translucent filter. The video uses `object-fit: contain`.
- Give the drag markers and the exit button a `z-index` above the layers. `makeDragable` prepends and appends them, so ordering would otherwise break.
- `theme.ts` holds every look constant in one place: font family, weight, text colour, outline colour, outline width as a fraction of font size, filter opacity.
- `updateFontSizes()` in `resizing.ts` reads `theme.ts`. The font is bundled under `src/` with `@font-face`, not loaded from an online font service.
- Show the filter only while a video is present.
- Works for audio-only tracks, so the look can be reviewed straight away.

### 3. Video playback (PLY-9)

Files: new `video.ts`, `player.ts`, `playlist.ts`

- `loadVideo(file, offset)` creates the muted element, waits for metadata, seeks to `start`, and waits for `seeked`. It returns a handle, or `null` if the video cannot be decoded.
- `loadTrack` starts this alongside the audio decode.
- `playSong` waits for both, then starts audio and video together.
- Video is visual only. If it fails, the audio path is untouched.

### 4. Crossfade and cleanup (PLY-10)

Files: `video.ts`, `player.ts`

- The incoming video's opacity goes from 0 to 1 over the track's `fade`; the outgoing video's from 1 to 0. This is the same duration as the audio.
- Dispose a stopped video after its fade: pause, clear `src`, `revokeObjectURL`, remove the element.
- Handle skipping and going back mid-fade, and an audio-only track after a video track.

### 5. Sync and pause for video (PLY-8, PLY-9)

Files: `video.ts`, `player.ts`

- Every second or two, compare `video.currentTime` with the position implied by the audio clock. Correct small drift by nudging `playbackRate`. Jump only when more than about 0.3s out.
- Compensate for `AudioContext.outputLatency`.
- Pause and resume also pause and resume the video, using the pause plumbing from phase 0.

### 6. Failure handling (PLY-11)

- A video that fails to decode falls back to audio-only. An mp4 with unusable audio plays without sound.
- Both log to the console.

### 7. Wrap-up

- Add a small test mp4 and playlist rows to `tests/sampledata/`, including one playlist using the legacy `audio` header.
- Update the home-screen help text for mp4 and the `media` column.
- Remove the warning markers from the spec for completed items, and update `TODO.md`.

## Risks

- **Sync drift** is the main uncertainty. Test on a real machine, ideally with Bluetooth audio.
- **Memory:** `decodeAudioData` needs the whole file in memory, and the next track is preloaded too. Test with a large mp4.
- **Codecs:** only H.264 and AAC are reliable. Playwright's bundled Chromium may lack them, so automated checks may need a VP9/Opus mp4 as a stand-in. Confirm this early.
- **Wrapping:** a wider display font changes where long lyric lines wrap. Check the longest lyrics when choosing the font.
- **Projectors** wash out contrast. Check the white text with a dark grey outline on a real projector, with video behind it.

## Revision: play video audio through the video element

Branch: `video-element-audio` (from `video`).

Testing a 4-minute, 61MB H.264/AAC music video showed the decode-up-front approach is costly: the audio decode took 4 to 11 seconds before playback could start, and holds about 80MB of decoded audio plus a full read of the file per video track. On Windows Chrome the page's main thread also became unresponsive (lyrics stalled, keys ignored) after a few minutes, which this change aims to remove from the picture.

Change, for `.mp4` tracks only (audio files keep the decoded path):

- The video element plays unmuted, and its sound is routed through a `MediaElementAudioSourceNode` into the same gain node, so fade in and out are unchanged.
- `start` is a seek on the element (already done when the video is prepared). `end` is the existing track-end timer.
- The audio is not decoded up front. The decoded path is kept as a fallback when the video can't be played (PLY-11).
- Sound and picture come from one element, so the drift-correction loop and the output-latency compensation are removed.
- Pause and resume pause and resume the element as well as the audio context, as before.

Checks: start delay after Go, memory over a full track, long tasks on the main thread during playback, crossfade between two video tracks, and pause.

The spec is unchanged: PLY-9 to PLY-11 still describe the behaviour.
