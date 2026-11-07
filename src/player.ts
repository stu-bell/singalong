import { parseLyricsFile } from "./lrcFile";
import { renderLyrics, pauseLyrics, resumeLyrics } from "./lyrics";
import { loadPlaylist, playlistNext, playlistPrev, Track } from "./playlist";
import { connectAudioGraph, crossFade, getCurrentlyPlaying, pauseAudioContext, resumeAudioContext } from "./audio";
import { initMediaSession, updateMediaSession, setMediaSessionPlaying, playSilentAudio, pauseSilentAudio } from "./mediaSession";

export type HTMLFileInputElement = HTMLInputElement & {files: FileList};

let lyricsListElem: HTMLElement;
let currentTrack: Track | null = null;

async function handleFileInputChange(filesInputElem: HTMLFileInputElement, listElem: HTMLElement) {

  // set global lyrcsListElem
  lyricsListElem = listElem;
  const folderFiles = Array.from(filesInputElem.files);

  initMediaSession();
  await loadPlaylist(folderFiles);
  // start playing the first song
  nextSong();
}

// timer that moves to the next song when this one ends. Can be paused (see pauseSong)
let nextSongTimeout: number | null = null;
let nextSongDueAt = 0; // Date.now() at which the timer fires
let nextSongRemainingMs: number | null = null; // time left, while paused
let paused = false;

function scheduleNextSong(delayMs: number) {
  if (nextSongTimeout) {
    // cancel inflight timer, since we might have skipped
    clearTimeout(nextSongTimeout);
    nextSongTimeout = null;
  }
  nextSongRemainingMs = null;
  if (paused) {
    nextSongRemainingMs = delayMs;
  } else {
    nextSongDueAt = Date.now() + delayMs;
    nextSongTimeout = setTimeout(nextSong, delayMs);
  }
}

async function playSong(track:Track|null) {
  if (track) {
    updateMediaSession();
    playSilentAudio();

    const buffer = await track.audio.buffer
    const lines = parseLyricsFile(await track.lyrics.text, track.lyrics.file);

    const newAudio = buffer ? connectAudioGraph(buffer) : null;
    // use the audio fade duration on the same playlist line as the currently playing track
    const fadeDuration = currentTrack ? currentTrack.audio.fade : 0
    crossFade(getCurrentlyPlaying(), newAudio, fadeDuration, track.audio.offset);
    currentTrack = track;

    // wait until finished fading before rendering the new lyrics
    // transition lyrics part of the way through the fade, otherwise it sounds like the audio has moved on but the lyrics haven't (for long fadeDurations)
    const lyricsTransitionDelay = fadeDuration * 2/3;
    setTimeout(() => renderLyrics(lines, lyricsListElem, track.audio.offset + lyricsTransitionDelay, track.audio.end), lyricsTransitionDelay * 1000 );

    const endpoint = (track.audio.end) ? track.audio.end : buffer?.duration
    if (endpoint){
      // play the next song after this one finishes
      scheduleNextSong((endpoint - track.audio.offset - track.audio.fade) * 1000);
    }
  } else {
    // TODO handle no track (when navigating off start or end of playlist)
  }
}

async function nextSong() {
  playSong(playlistNext())
}

async function prevSong() {
    playSong(playlistPrev())
}

function pauseSong() {
  if (paused) return;
  paused = true;
  pauseAudioContext();
  pauseSilentAudio();
  pauseLyrics();
  if (nextSongTimeout) {
    nextSongRemainingMs = Math.max(0, nextSongDueAt - Date.now());
    clearTimeout(nextSongTimeout);
    nextSongTimeout = null;
  }
  setMediaSessionPlaying(false);
}

function resumeSong() {
  if (!paused) return;
  paused = false;
  resumeAudioContext();
  playSilentAudio();
  resumeLyrics();
  if (nextSongRemainingMs !== null) {
    scheduleNextSong(nextSongRemainingMs);
  }
  setMediaSessionPlaying(true);
}

export { prevSong, nextSong, handleFileInputChange, pauseSong, resumeSong };
