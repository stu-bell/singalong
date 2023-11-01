import { parseLrcLines, parseTxtLines } from "./lrcFile";
import { propOrDefault, removeFileExtension, readFileToString } from "./util";
import { playAll } from "./audio";

let lyricsListElem: HTMLElement;
let songTitleElem: HTMLElement;

let state: {
  fileType: string;
  numberOfLines: number;
  currentLineIndex: number;
  currentFileIndex: number;
  filesList: any[];
  lines: any[];
} = {
  lines: [],
  filesList: [],
  fileType: "txt",
  numberOfLines: 10,
  currentLineIndex: 0,
  currentFileIndex: 0,
};

async function handleFileInputChange(
  event: Event,
  listElem: HTMLElement,
  titleElem: HTMLElement
) {
  // set global lyrcsListElem
  lyricsListElem = listElem;
  songTitleElem = titleElem;
  if (!event.target) {
    console.error("Null input target");
    return;
  }
  const target = event.target as HTMLInputElement & { files: FileList };
  const files: FileList = target.files;
  const folderFiles = Array.from(files);
  state.filesList = folderFiles.filter(
    (file: any) =>
      file.webkitRelativePath.toLowerCase().endsWith(".txt") ||
      file.webkitRelativePath.toLowerCase().endsWith(".lrc")
  );

  // find an mp3 file and start playing it
  const mp3Files = folderFiles.filter(
    (file) => file.name.toLowerCase().endsWith('.mp3')
  );
  playAll(mp3Files);

  // check for presence of a file named _lyrics.playlist.txt, with lines of file names in the order they should be displayed
  const playlistFile = folderFiles.find(
    (file: any) => file.name.toLowerCase() === "_lyrics.playlist.txt"
  );
  if (playlistFile) {
    const playlistContents = await readFileToString(playlistFile);
    const playlistOrder = playlistContents
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line !== "");
    const filesListOrdered = state.filesList.sort((fileA: any, fileB: any) => {
      const indexA = playlistOrder.indexOf(fileA.name);
      const indexB = playlistOrder.indexOf(fileB.name);
      return indexA - indexB;
    });
    state.filesList = filesListOrdered;
    state.currentFileIndex = -1;
    nextSong();
  } else {
    // don't order the folder, just play in what ever order they come
    state.currentFileIndex = -1;
    nextSong();
  }
}

function backwards(list: HTMLElement, text: string = "") {
  // backwards prepends to `list` a new element with `text`, and removes the last element
  // prepend line
  const newLi = document.createElement("li");
  newLi.textContent = text;
  newLi.classList.add("zero");
  list.prepend(newLi);
  if (list.lastElementChild) {
    list.lastElementChild.remove();
  }

  const first = list.firstElementChild as HTMLElement;
  if (first) {
    void first.offsetWidth;
    first.classList.remove("zero");
    first.classList.add("large");
    const second = list.getElementsByTagName("li")[1];
    if (second) {
      second.classList.remove("large");
    }
  }
}

function forwards(list: HTMLElement, text: string = "") {
  // forwards appends to `list` a new element with `text`, and removes the first element
  // remove any nodes already on their way out
  list.querySelectorAll(".zero").forEach((x) => x.remove());

  const first = list.firstElementChild;

  if (first) {
    first.classList.remove("large");
    first.classList.add("zero");

    const second = list.getElementsByTagName("li")[1];
    if (second) {
      second.classList.add("large");
    }

    first.addEventListener("transitionend", (e) =>
      (e.target as HTMLElement).remove()
    );
  }

  // Append the new line at the end
  const newLi = document.createElement("li");
  newLi.textContent = text;
  list.appendChild(newLi);
}

// setTimeout allowing us to adjust the timer
let scrollTimer: number | null = null;
let lastAutoScrollTime: number;
function setTimeoutNextScroll() {
  // setTimeoutNextScroll sets an auto scroll for the next line, based on timestamps
  if (scrollTimer) {
    // cancel inflight timer, since we might have skipped
    clearTimeout(scrollTimer);
  }
  if (
    state.fileType === "lrc" &&
    state.lines[state.currentLineIndex] &&
    state.lines[state.currentLineIndex + 1]
  ) {
    const currentLineTime = state.lines[state.currentLineIndex].timestamp;
    const nextLineTime = state.lines[state.currentLineIndex + 1].timestamp;
    const delay = nextLineTime - currentLineTime;
    if (delay > 0) {
      scrollTimer = setTimeout(() => {
        // register time we last auto-scrolled
        lastAutoScrollTime = Date.now();
        scrollNextLine();
      }, delay * 1000);
    }
    // if the timestamps on current and nextlines are the same, do we just want to skip now?
  }
}

// weJustAutoScrolled returns true if there is a short duration between the now and the last auto scroll event
const weJustAutoScrolled = (milliseconds=500) => ((Date.now() - lastAutoScrollTime) < milliseconds) 

function renderLyrics() {
  // renderLyrics replaces the current contents of `list` with state.lines
  setTimeoutNextScroll();

  while (lyricsListElem.firstChild) {
    lyricsListElem.firstChild.remove();
  }

  const currentLines = state.lines
    .slice(state.currentLineIndex, state.currentLineIndex + state.numberOfLines)
    .map(propOrDefault("text", ""));

  for (let line of currentLines) {
    const el = document.createElement("li");
    el.textContent = line;
    lyricsListElem.appendChild(el);
  }
}

async function loadLyricsFromFile(fileBlob: File) {
  const fileContents = await readFileToString(fileBlob);

  if (fileBlob.name.toLowerCase().endsWith(".lrc")) {
    state.fileType = "lrc";
    state.lines = parseLrcLines(fileContents);
  } else if (fileBlob.name.toLowerCase().endsWith(".txt")) {
    state.fileType = "txt";
    state.lines = parseTxtLines(fileContents);
  }

  state.currentLineIndex = 0;
  songTitleElem.textContent = removeFileExtension(fileBlob.name);

  renderLyrics();
}

function nextSong() {
  if (state.currentFileIndex < state.filesList.length) {
    state.currentFileIndex++;
    loadLyricsFromFile(state.filesList[state.currentFileIndex]);
  }
}

function prevSong() {
  if (state.currentLineIndex > 2) {
    // go back to start of current song
    state.currentLineIndex = 0;
    renderLyrics();
  } else if (state.currentFileIndex > 0) {
    // go back to previous song
    state.currentFileIndex--;
    loadLyricsFromFile(state.filesList[state.currentFileIndex]);
  }
}

function scrollNextLine() {
  state.currentLineIndex++;
  if (state.currentLineIndex >= state.lines.length) {
    nextSong();
  }

  setTimeoutNextScroll();
  const appendLine =
    state.lines[state.currentLineIndex + state.numberOfLines - 1];
  const appendText = appendLine ? appendLine.text : "";
  forwards(lyricsListElem, appendText);
}

function scrollPreviousLine() {
  state.currentLineIndex--;
  setTimeoutNextScroll();
  const prependLine = state.lines[state.currentLineIndex];
  const prependText = prependLine ? prependLine.text : "";
  backwards(lyricsListElem, prependText);
}

export {
  scrollNextLine,
  scrollPreviousLine,
  prevSong,
  nextSong,
  handleFileInputChange,
  weJustAutoScrolled,
  setTimeoutNextScroll
};
