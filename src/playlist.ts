// await loadPlaylist
// then use playlistNext and playlistPrev to shift the playlist position and get the current track
// current track file text and buffer must be awaited 
// will start loading the buffers for next track on playlistNext 

import { readFileToString, getFileExtension } from "./util";

let prev: Track | null;
let curr: Track | null;
let next: Track | null;
let playlistIndex: number;
let playlist: Playlist;
const playlistFileName = "_playlist.json";

type Playlist = PlaylistItem[];
type PlaylistItem = {
  audio: string;
  audioFile: File | null;
  lyrics: string;
  lyricsFile: File;
};

type Track = {
  lyrics: {
    file: File;
    text: Promise<any>;
  };
  audio: {
    file: File | null;
    buffer: Promise<AudioBuffer> | null;
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
      buffer: null, // TODO
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
  const playlistFileContents = JSON.parse(
    await readFileToString(playlistFile!)
  ) as Playlist;
  const playlist = loadPlaylistFileHandles(playlistFileContents, folderfiles);
  return playlist;
}

// loadPlaylistFileHandles attaches File handles to each playlist item. alerts of missing files
function loadPlaylistFileHandles(playlist: Playlist, folderfiles: File[]) {
  let warnings: string[] = [];
  let errors: string[] = [];
  const findFile = (name: string) =>
    folderfiles.find((file) => file.name === name);
  const attachFiles = (item: PlaylistItem) => {
    if (!item.lyrics) {
      errors.push("Each playlist entry must contain a lyrics file.");
    } else {
      item.lyricsFile = findFile(item.lyrics)!;
      const ext = getFileExtension(item.lyrics);
      if (!item.lyricsFile) {
        errors.push(
          `Playlist includes ${item.lyrics} but we couldn't find that in the folder.`
        );
      } else if (!(ext === "lrc" || ext === "txt")) {
        errors.push(`Only .lrc or .txt files supported, but found ${ext}`);
      }
    }
    if (!item.audio) {
      warnings.push(`No audio file listed for ${item.lyrics}`);
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
  const playlistWithFiles = playlist.map(attachFiles);
  const validationErrors = errors.join("\n");
  if (validationErrors) {
    window.alert(`Error: ${validationErrors}`);
  }
  const validationWarnings = warnings.join("\n");
  if (validationWarnings) {
    window.alert(`Warning: ${validationWarnings}`);
  }
  return playlistWithFiles;
}

export { loadPlaylist, playlistPrev, playlistNext };
