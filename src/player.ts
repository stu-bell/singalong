import { parseLyricsFile } from "./lrcFile";
import { renderLyrics, pauseLyrics, resumeLyrics } from "./lyrics";
import { loadPlaylist, playlistNext, playlistPrev, playlistPeekNext, Track } from "./playlist";
import { prepareVideo, startVideo, stopVideo, disposeVideo, pauseVideos, resumeVideos, VideoHandle } from "./video";
import { connectAudioGraph, connectMediaElementGraph, crossFade, getCurrentlyPlaying, loadAudioFromFile, pauseAudioContext, resumeAudioContext } from "./audio";
import { isVideoFile } from "./files";
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

// the video of the playing track, if it has one
let currentVideo: VideoHandle | null = null;
// video prepared ahead for the upcoming track, so that it can start instantly
let prepared: { track: Track; video: Promise<VideoHandle | null> } | null = null;
// identifies the latest playSong call, so a call that has been skipped past can bail out
let playToken = 0;

function discardPreparedVideo() {
  if (prepared) {
    prepared.video.then(disposeVideo);
    prepared = null;
  }
}

function prepareUpcomingVideo(track: Track | null) {
  if (prepared && prepared.track === track) return;
  discardPreparedVideo();
  if (track) {
    prepared = { track, video: prepareVideo(track.audio.file, track.audio.offset) };
  }
}

function takeVideo(track: Track): Promise<VideoHandle | null> {
  if (prepared && prepared.track === track) {
    const video = prepared.video;
    prepared = null;
    return video;
  }
  discardPreparedVideo();
  return prepareVideo(track.audio.file, track.audio.offset);
}

async function playSong(track:Track|null) {
  if (track) {
    const token = ++playToken;
    updateMediaSession();
    playSilentAudio();

    const videoPromise = takeVideo(track);
    const lines = parseLyricsFile(await track.lyrics.text, track.lyrics.file);
    const video = await videoPromise;
    // audio files are decoded up front. A video file plays its sound through its video element, unless the video
    // can't be played, in which case its audio is decoded instead (PLY-11)
    const file = track.audio.file;
    const bufferPromise = track.audio.buffer ??
      (file && !video && isVideoFile(file.name) ? loadAudioFromFile(file) : null);
    // a media file whose audio can't be decoded plays without sound
    const buffer = await bufferPromise?.catch((e) => {
      console.error(`Can't decode the audio in ${file?.name}, playing without sound:`, e);
      return null;
    });
    if (token !== playToken) {
      // the user skipped to another song while this one was loading
      disposeVideo(video);
      return;
    }

    const newAudio = video ? connectMediaElementGraph(video.element) : buffer ? connectAudioGraph(buffer) : null;
    // use the audio fade duration on the same playlist line as the currently playing track
    const fadeDuration = currentTrack ? currentTrack.audio.fade : 0
    crossFade(getCurrentlyPlaying(), newAudio, fadeDuration, track.audio.offset);
    // the video crossfades over the same duration as the audio
    stopVideo(currentVideo, fadeDuration);
    if (video) {
      startVideo(video, fadeDuration);
      if (paused) pauseVideos();
    }
    currentVideo = video;
    currentTrack = track;

    // wait until finished fading before rendering the new lyrics
    // transition lyrics part of the way through the fade, otherwise it sounds like the audio has moved on but the lyrics haven't (for long fadeDurations)
    const lyricsTransitionDelay = fadeDuration * 2/3;
    setTimeout(() => renderLyrics(lines, lyricsListElem, track.audio.offset + lyricsTransitionDelay, track.audio.end), lyricsTransitionDelay * 1000 );

    const videoDuration = video && Number.isFinite(video.element.duration) ? video.element.duration : undefined;
    const endpoint = (track.audio.end) ? track.audio.end : (buffer?.duration ?? videoDuration)
    if (endpoint){
      // play the next song after this one finishes
      scheduleNextSong((endpoint - track.audio.offset - track.audio.fade) * 1000);
    }

    // get the next track's video ready while this one plays
    prepareUpcomingVideo(playlistPeekNext());
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
  pauseVideos();
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
  resumeVideos();
  if (nextSongRemainingMs !== null) {
    scheduleNextSong(nextSongRemainingMs);
  }
  setMediaSessionPlaying(true);
}

export { prevSong, nextSong, handleFileInputChange, pauseSong, resumeSong };
