// await loadPlaylist
// then use playlistNext and playlistPrev to shift the playlist position and get the current track
// current track file text and buffer must be awaited
// will start loading the buffers for next track on playlistNext

import { readFileToString, getFileExtension, parseTsv, downloadFile } from "./files";
import { loadAudioFromFile } from "./audio";
import { parseTimestampToSeconds } from "./lrcFile";

let prev: Track | null;
let curr: Track | null;
let next: Track | null;
let playlistIndex: number;
let playlist: Playlist;
const playlistFileName = "_playlist.tsv";

type Playlist = PlaylistItem[];
type PlaylistItem = {
  audio: string; // audio file name, from playlist file
  audioFile: File | null; // audio File handle, added during parsing
  audio_start: string| null; // audio start timestamp, from playlist file
  audio_end: string| null; // audio end timestamp, from playlist file
  lyrics: string; // lyrics file name, from playlist file
  lyricsFile: File; // lyrics File handle, added during parsing
  lyrics_offset:string|null; // offset for starting lyrics, from playlist file
};

type Track = {
  lyrics: {
    file: File;
    text: Promise<any>;
    offset:number
  };
  audio: {
    file: File | null;
    buffer: Promise<AudioBuffer> | null;
    offset: number; // offset to start playing track
    end: number| undefined; // time in the track we should move next. duration = end - offset
  };
};

async function loadPlaylist(folderFiles: File[]) {
  playlist = await parsePlaylistFile(folderFiles);
  if (playlist.length) {
    // initialise by queuing the next track
    playlistIndex = -1;
    next = loadTrack(playlist[0]);
  }
}

function playlistNext() {
  // bump position if there is a next track
  // if we're at the end of the playlist, null is returned
  if (next) {
    playlistIndex++;
    prev = curr;
    curr = next;
  }
  if (playlistIndex + 1 < playlist.length) {
    // load the buffers for the next track
    next = loadTrack(playlist[playlistIndex + 1]);
  } else {
    next = null;
  }
  return curr;
}

function playlistPrev() {
  if (prev) {
    // bump back if there is a previous track to bump back to
    // if we're at the beginning of the playlist, null is returned
    playlistIndex--;
    next = curr;
    curr = prev;
  }
  if (playlistIndex > 0) {
    // load the track before the current one
    prev = loadTrack(playlist[playlistIndex - 1]);
  }
  return curr;
}

function loadTrack(item: PlaylistItem): Track {
  return {
    lyrics: {
      file: item.lyricsFile,
      text: readFileToString(item.lyricsFile),
      offset: (item.lyrics_offset) ? parseFloat(item.lyrics_offset) : 0
    },
    audio: {
      file: item.audioFile,
      buffer: item.audioFile ? loadAudioFromFile(item.audioFile) : null,
      offset: (item.audio_start) ? parseTimestampToSeconds(item.audio_start) : 0,
      end: (item.audio_end) ? parseTimestampToSeconds(item.audio_end) : undefined,
    },
  };
}

async function parsePlaylistFile(folderfiles: File[]) {
  const playlistFile = folderfiles.find(
    (file: File) => file.name.toLowerCase() === playlistFileName
  );
  if (!playlistFile) {
    window.alert(`Oops! We couldn't find a ${playlistFileName} file in that folder! Save one in that folder and edit it to make your playlist.`);
    downloadExamplePlaylistFile(folderfiles);
    window.alert(`We've just downloaded a ${playlistFileName} file for you, with the tracks we could find in the folder you chose. Open it in a spreadsheet and put the lyrics and audio files in the correct order. Then refresh the sing along app and retry.`);
    // refresh the page so we don't navigate
    location.reload();
  }
  const playlistFileContents = parseTsv(
    await readFileToString(playlistFile!)
  ) as Playlist;
  const playlist = loadPlaylistFileHandles(playlistFileContents, folderfiles);
  if (!playlist.length) {
    window.alert(`Error: ${playlistFileName} empty`);
  }
  return playlist;
}

// loadPlaylistFileHandles attaches File handles to each playlist item. alerts of missing files
function loadPlaylistFileHandles(playlist: Playlist, folderfiles: File[]) {
  let missingAudioWarning: string[] = [];
  let errors: string[] = [];
  const findFile = (name: string) =>
    folderfiles.find((file) => file.name === name);
  const attachFiles = (item: PlaylistItem) => {
    if (!item.lyrics) {
      errors.push(`Each playlist row must contain a lyrics file. ${item.audio ? item.audio : ''}`);
      // remove this entry from the playlist
      return null;
    } else {
      item.lyricsFile = findFile(item.lyrics)!;
      const ext = getFileExtension(item.lyrics);
      if (!item.lyricsFile) {
        errors.push(
          `Playlist includes ${item.lyrics} but we couldn't find that in the folder.`
        );
        // remove this entry from the playlist
        return null;
      } else if (!(ext === "lrc" || ext === "txt")) {
        errors.push(
          `Only .lrc or .txt files supported, but found ${item.lyrics}`
        );
        // remove this entry from the playlist
        return null;
      }
    }
    if (!item.audio) {
      // log the name of the lyrics file without the audio
      missingAudioWarning.push(item.lyrics);
    } else {
      item.audioFile = findFile(item.audio)!;
      if (!item.audioFile) {
        errors.push(
          `Playlist includes ${item.audio} but we couldn't find that in the folder.`
        );
      }
    }
    return item;
  };
  // attach the files. remove null entries (null entries failed validation)
  const playlistWithFiles = playlist.map(attachFiles).filter((x) => x !== null) as Playlist;
  if (!playlistWithFiles.length) {
    window.alert(
      `Error: the ${playlistFileName} file contained no valid rows, or we couldn't find any corresponding files.`
    );
  }
  const validationErrors = errors.join("\n");
  if (validationErrors) {
    window.alert(`Error: ${validationErrors}`);
  }
  const validationWarnings = missingAudioWarning.join("\n");
  if (validationWarnings) {
    window.alert(
      `Warning: the following tracks don't have audio: ${validationWarnings}`
    );
  }
  return playlistWithFiles;
}

function downloadExamplePlaylistFile(files: File[]) {
  const audioFiles = files.filter((file) => getFileExtension(file.name) === 'mp3').map(file => file.name);
  const lyricsFiles = files.filter((file) => {
    const ext = getFileExtension(file.name);
    return ext === 'lrc' || ext === 'txt';
   }).map(file => file.name);

  const len = (audioFiles.length > lyricsFiles.length) ? audioFiles.length : lyricsFiles.length;
  let res = [];
  for (let i = 0; i < len; i++) {
    res.push(`${lyricsFiles[i] || ''}\t${audioFiles[i] || ''}\t`)
  }
  const exampleContent = `lyrics	audio	audio_start	audio_end	lyrics_offset\r\n` + res.join('\r\n');
  downloadFile(exampleContent, '_playlist.tsv');
}

export { loadPlaylist, playlistPrev, playlistNext, downloadExamplePlaylistFile };
export type { Track };
