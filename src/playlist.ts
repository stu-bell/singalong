// await loadPlaylist
// then use playlistNext and playlistPrev to shift the playlist position and get the current track
// current track file text and buffer must be awaited
// will start loading the buffers for next track on playlistNext

import {
  readFileToString,
  getFileExtension,
  parseTsv,
  downloadFile,
} from "./files";
import { loadAudioFromFile, audioFileDuration } from "./audio";
import { parseTimestampToSeconds } from "./lrcFile";
import { ratio } from "fuzzball";

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
  start: string | null; // start timestamp, from playlist file
  end: string | null; // end timestamp, from playlist file
  fade: string | null; // fade duration between two tracks, ie duration of overlap while fading from one to the next
  lyrics: string; // lyrics file name, from playlist file
  lyricsFile: File; // lyrics File handle, added during parsing
  // lyrics_offset:string|null; // offset for starting lyrics, from playlist file
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
    end: number | undefined; // time in the track we should move next. duration = end - offset
    fade: number; // fade duration
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
    },
    audio: {
      file: item.audioFile,
      buffer: item.audioFile ? loadAudioFromFile(item.audioFile) : null,
      offset: item.start ? parseTimestampToSeconds(item.start) : 0,
      end: item.end ? parseTimestampToSeconds(item.end) : undefined,
      fade: item.fade ? parseTimestampToSeconds(item.fade) : 0,
    },
  };
}

async function parsePlaylistFile(folderfiles: File[]) {
  const playlistFile = folderfiles.find(
    (file: File) => file.name.toLowerCase() === playlistFileName
  );
  if (!playlistFile) {
    console.error(
      `Oops! We couldn't find a ${playlistFileName} file in that folder! Save one in that folder and edit it to make your playlist. It may take a few seconds to check through your music files`
    );
    const userwait = document.createElement('p');
      // TODO: busy spinner!
    userwait.textContent = `One sec, we're preparing your playlist file. This may take a few seconds depending how many audio tracks you have... When it downloads, save it to the folder with your lyrics and music. Edit it to reorder your playlist then click Choose Folder again`;
    document.body.prepend(userwait);
    await downloadExamplePlaylistFile(folderfiles);
    userwait.remove();
    console.warn(
      `We've just downloaded a ${playlistFileName} file for you, with the tracks we could find in the folder you chose. Open it in a spreadsheet and put the lyrics and audio files in the correct order. Then refresh the sing along app and retry.`
    );
    // refresh the page so we don't navigate
    location.reload();
  }
  const playlistFileContents = parseTsv(
    await readFileToString(playlistFile!)
  ) as Playlist;
  const playlist = loadPlaylistFileHandles(playlistFileContents, folderfiles);
  if (!playlist.length) {
    console.error(`Error: ${playlistFileName} empty`);
  }
  return playlist;
}

// loadPlaylistFileHandles attaches File handles to each playlist item. warns of missing files
function loadPlaylistFileHandles(playlist: Playlist, folderfiles: File[]) {
  let missingAudioWarning: string[] = [];
  let errors: string[] = [];
  const findFile = (name: string) =>
    folderfiles.find((file) => file.name === name);
  const attachFiles = (item: PlaylistItem) => {
    if (!item.lyrics) {
      errors.push(
        `Each playlist row must contain a lyrics file. ${
          item.audio ? item.audio : ""
        }`
      );
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
  const playlistWithFiles = playlist
    .map(attachFiles)
    .filter((x) => x !== null) as Playlist;
  if (!playlistWithFiles.length) {
    console.error(
      `Error: the ${playlistFileName} file contained no valid rows, or we couldn't find any corresponding files.`
    );
  }
  const validationErrors = errors.join("\n");
  if (validationErrors) {
    console.error(`Error: ${validationErrors}`);
  }
  const validationWarnings = missingAudioWarning.join("\n");
  if (validationWarnings) {
    console.error(
      `Warning: the following tracks don't have audio: ${validationWarnings}`
    );
  }
  return playlistWithFiles;
}

async function downloadExamplePlaylistFile(files: File[] | any[]) {
  // grab relevant files
  const audioFiles = await Promise.all(
    files
      .filter((file) => {
        const ext = getFileExtension(file.name);
        return ext === "mp3" || ext === "m4a";
      })
      .map(async (f) => {
        // add audio file duration
        f.duration = await audioFileDuration(f);
        return f;
      })
  );
  const lyricsFiles = files.filter((file) => {
    const ext = getFileExtension(file.name);
    return ext === "lrc" || ext === "txt";
  });

  let res = [];
  let matchIndex: number = 0;
  // assume that the audio files list is shorter (or equal)
  for (let i = 0; i < audioFiles.length; i++) {
    let highest = 0;
    // find the lyircs file name that most closely mathches
    for (let j = 0; j < lyricsFiles.length; j++) {
      let score = ratio(audioFiles[i].name, lyricsFiles[j].name);
      if (score > highest) {
        highest = score;
        matchIndex = j;
      }
    }

    // add the row to the result playlist, format as .TSV
    res.push(
      [
        lyricsFiles[matchIndex] ? lyricsFiles[matchIndex].name : "",
        audioFiles[i] ? audioFiles[i].name : "",
        audioFiles[i] ? "0" : "",
        audioFiles[i] ? audioFiles[i].duration : "",
        audioFiles[i] ? "1" : ""
      ].join("\t")
    );

    // remove the matched element from the list of available options
    lyricsFiles.splice(matchIndex, 1);
  }
  for (let k = 0; k < lyricsFiles.length; k++) {
    // add remaining lyrics files
    res.push(lyricsFiles[k].name);
  }
  const exampleContent =
    // header row, plus data
    `lyrics	audio	start	end	fade\r\n` + res.join("\r\n");
  downloadFile(exampleContent, "_playlist.tsv");
}

export {
  loadPlaylist,
  playlistPrev,
  playlistNext,
  downloadExamplePlaylistFile,
};
export type { Track };
