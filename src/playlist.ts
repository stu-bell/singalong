import { readFileToString } from "./util";
// let prev, curr, next: ;
const playlistFileName = "_playlist.json";
const playlistIndex = -1;

type Playlist = PlaylistItem[];
type PlaylistItem = {
    audio: string,
    audioFile: File | null,
    lyrics: string,
    lyricsFile: File
};

async function loadPlaylist(folderFiles:File[]) {
    const playlist = await parsePlaylistFile(folderFiles);
    window.alert(`Found ${playlist.length} tracks`)
    console.log(playlist)
}

async function parsePlaylistFile(folderfiles: File[]) {
  const playlistFile = folderfiles.find(
    (file: File) => file.name.toLowerCase() === playlistFileName
  );
  if (!playlistFile) {
    window.alert(`Error: no ${playlistFileName} file found!`);
  }
  const playlistFileContents = JSON.parse(await readFileToString(playlistFile!)) as Playlist;
  const playlist = loadPlaylistFileHandles(playlistFileContents, folderfiles);
  
  return playlist;
}

// loadPlaylistFileHandles attaches File handles to each playlist item. alerts of missing files
function loadPlaylistFileHandles(playlist: Playlist, folderfiles: File[]) {
    let warnings: string[] = [];
    let errors: string[] = [];
    const findFile = (name: string) => folderfiles.find(file => file.name === name);
    const attachFiles = (item: PlaylistItem) => {
        if (!item.lyrics) {
            errors.push('Each playlist entry must contain a lyrics file.');
        } else {
            item.lyricsFile = findFile(item.lyrics)!;
            if (!item.lyricsFile) {
                errors.push(`Playlist includes ${item.lyrics} but we couldn't find that in the folder.`)
            }
        }
        if (!item.audio) {
            warnings.push(`No audio file listed for ${item.lyrics}`)
        } else {
            item.audioFile = findFile(item.audio)!;
            if (item.audioFile) {
                errors.push(`Playlist includes ${item.audio} but we couldn't find that in the folder.`)
            }
        }
        return item;
    }
    const playlistWithFiles = playlist.map(attachFiles);
    const validationErrors = errors.join('\n');
    if (validationErrors) {
      window.alert(`Playlist file error: ${validationErrors}`);
    }
    const validationWarnings = warnings.join('\n');
    if (validationWarnings) {
      window.alert(`Playlist file error: ${validationWarnings}`);
    }
    return playlistWithFiles;
}

export { loadPlaylist };
