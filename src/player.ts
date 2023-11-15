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

let nextSongTimeout: number | null = null;
async function playSong(track:Track|null) {
  if (track) {
    const buffer = await track.audio.buffer
    const newAudio = buffer ? connectAudioGraph(buffer) : null;
    const lines = parseLyricsFile(await track.lyrics.text, track.lyrics.file);
    console.log(lines)
    const crossFadeDuration = 1;
    crossFade(getCurrentlyPlaying(), newAudio, crossFadeDuration, track.audio.offset);
    renderLyrics(lines, lyricsListElem);
    const endpoint = (track.audio.end) ? track.audio.end : buffer?.duration
    // console.log('offset', track.audio.offset)
    // console.log('end', track.audio.end)
    // console.log('end or duration', endpoint)
    if (endpoint){
      // play the next song after this one finishes
      if (nextSongTimeout) {
        // cancel inflight timer, since we might have skipped
        clearTimeout(nextSongTimeout);
      }
      nextSongTimeout = setTimeout(nextSong, (endpoint - track.audio.offset - crossFadeDuration) * 1000 );
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
