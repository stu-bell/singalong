import { parseLyricsFile } from "./lrcFile";
import { renderLyrics } from "./lyrics";
import { loadPlaylist, playlistNext, playlistPrev } from "./playlist";
import { connectAudioGraph, crossFade, fadeIn, getCurrentlyPlaying } from "./audio";

let lyricsListElem: HTMLElement;

async function handleFileInputChange(event: Event, listElem: HTMLElement) {
  // set global lyrcsListElem
  lyricsListElem = listElem;
  const target = event.target as HTMLInputElement & { files: FileList };
  const files: FileList = target.files;
  const folderFiles = Array.from(files);

  await loadPlaylist(folderFiles);
  // start playing the first song
  nextSong();
}

async function nextSong() {
  // new current track
  const track = playlistNext();
  if (track) {
    const newAudio = track.audio.buffer
      ? connectAudioGraph(await track.audio.buffer)
      : null;
    const lines = parseLyricsFile(await track.lyrics.text, track.lyrics.file);
    crossFade(getCurrentlyPlaying(), newAudio);
    renderLyrics(lines, lyricsListElem);
  } else {
    // TODO handle no track (end of playlist)
  }
}

async function prevSong() {
  const track = playlistPrev();
  if (track) {
    const newAudio = track.audio.buffer
      ? connectAudioGraph(await track.audio.buffer)
      : null;
    const lines = parseLyricsFile(await track.lyrics.text, track.lyrics.file);
    crossFade(getCurrentlyPlaying(), newAudio);
    renderLyrics(lines, lyricsListElem);
  } else {
    //TODO handle no previous track (start of playlist)
  }
}

export { prevSong, nextSong, handleFileInputChange };
