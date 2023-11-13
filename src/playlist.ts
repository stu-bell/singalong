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
};

type Track = {
  lyrics: {
    file: File;
    text: Promise<any>;
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
  if (!playlist.length) {
    window.alert(`Error: ${playlistFileName} empty`);
  }
  // initialise by queuing the next track
  playlistIndex = -1;
  next = loadTrack(playlist[0]);
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
    window.alert(`Error: no ${playlistFileName} file found!`);
  }
  const playlistFileContents = parseTsv(
    await readFileToString(playlistFile!)
  ) as Playlist;
  const playlist = loadPlaylistFileHandles(playlistFileContents, folderfiles);
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
      errors.push("Each playlist entry must contain a lyrics file.");
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

function downloadExamplePlaylistFile() {
  const exampleContent = `lyrics	audio	audio_start	audio_end
First lyrics.txt	First.mp3	2
Second lyrics.lrc	second.mp3
Third.lrc	third.mp3	0	1:10.5`
  downloadFile(exampleContent, '_playlist.tsv');
}

export { loadPlaylist, playlistPrev, playlistNext, downloadExamplePlaylistFile };
export type { Track };