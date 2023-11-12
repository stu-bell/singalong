import { parseLyricsFile } from "./lrcFile";
import { renderLyrics } from "./lyrics";
import { loadPlaylist, playlistNext, playlistPrev, Track } from "./playlist";
import { connectAudioGraph, crossFade, getCurrentlyPlaying } from "./audio";

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

async function playSong(track:Track|null) {
  if (track) {
    const buffer = await track.audio.buffer
    const newAudio = buffer ? connectAudioGraph(buffer) : null;
    const lines = parseLyricsFile(await track.lyrics.text, track.lyrics.file);
    const crossFadeDuration = 1;
    crossFade(getCurrentlyPlaying(), newAudio, crossFadeDuration);
    renderLyrics(lines, lyricsListElem);
    if (buffer?.duration){
      // play the next song after this one finishes
      setTimeout(nextSong, (buffer?.duration - crossFadeDuration) * 1000 );
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
