import { parseLyricsFile } from "./lrcFile";
import { renderLyrics } from "./lyrics";
import { loadPlaylist, playlistNext, playlistPrev, Track } from "./playlist";
import { connectAudioGraph, crossFade, getCurrentlyPlaying } from "./audio";
import { requestFullScreen, requestLandscape, requestWakeLock } from "./screen";

let lyricsListElem: HTMLElement;
let currentTrack: Track | null = null;

async function handleFileInputChange(event: Event, listElem: HTMLElement) {

  requestWakeLock();
  requestLandscape();
  requestFullScreen();

  // set global lyrcsListElem
  lyricsListElem = listElem;
  const target = event.target as HTMLInputElement & { files: FileList };
  const files: FileList = target.files;
  const folderFiles = Array.from(files);

  await loadPlaylist(folderFiles);
  // start playing the first song
  nextSong();
}

let nextSongTimeout: number | null = null;
async function playSong(track:Track|null) {
  if (track) {
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
      if (nextSongTimeout) {
        // cancel inflight timer, since we might have skipped
        clearTimeout(nextSongTimeout);
      }
      nextSongTimeout = setTimeout(nextSong, (endpoint - track.audio.offset - track.audio.fade) * 1000 );
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

export { prevSong, nextSong, handleFileInputChange };
