import { parseLrcLines, parseTxtLines } from "./lrcFile";
import { propOrDefault } from "./util";

let lyricsListElem: HTMLElement;

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

// setTimeout allowing us to adjust the timer
let scrollTimer: number | null = null;

function handleFileInputChange(event: any, list: HTMLElement) {
  // set global lyrcsListElem
  lyricsListElem = list;
  const folderFiles = Array.from(event.target.files);
  state.filesList = folderFiles.filter(
    (file: any) =>
      file.webkitRelativePath.toLowerCase().endsWith(".txt") ||
      file.webkitRelativePath.toLowerCase().endsWith(".lrc")
  );

  // check for presence of a file named _lyrics.playlist.txt, with lines of file names in the order they should be displayed
  const playlistFile = folderFiles.find(
    (file: any) => file.name.toLowerCase() === "_lyrics.playlist.txt"
  );
  if (playlistFile) {
    const reader = new FileReader();
    reader.onload = function (event) {
      const fileContents = (event.target as FileReader).result as string;
      if (fileContents) {
        const playlistOrder = fileContents
          .split("\n")
          .map((line: string) => line.trim())
          .filter((line: string) => line !== "");
        const filesListOrdered = state.filesList.sort(
          (fileA: any, fileB: any) => {
            const indexA = playlistOrder.indexOf(fileA.name);
            const indexB = playlistOrder.indexOf(fileB.name);
            return indexA - indexB;
          }
        );
        state.filesList = filesListOrdered;
        state.currentFileIndex = -1;
        nextSong();
      }
    };
    reader.onerror = function (event) {
      console.error("Error reading file:", (event.target as FileReader).error);
    };
    reader.readAsText(playlistFile as Blob);
  } else {
    // don't order the folder, just play in what ever order they come
    state.currentFileIndex = -1;
    nextSong();
  }
  event.target.classList.add("hidden");
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

function setTimeoutNextScroll() {
  // setTimeoutNextScroll sets an auto scroll for the next line, based on timestamps
  // TODO:register timeout so we can detect if we've slow reactions! also need to clear the timout...
  if (scrollTimer) {
    // cancel inflight timer, since we've skipped
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
      scrollTimer = setTimeout(scrollNextLine, delay * 1000);
    }
    // else {
    //   // if the timestamps on current and nextlines are the same, do we just want to skip now?
    //   scrollNextLine();
    // }
  }
}

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

function loadLyricsFromFile(fileBlob: any) {
  let reader = new FileReader();
  reader.onload = function (event) {
    const fileContents = (event.target as FileReader).result as string;
    if (fileBlob.name.toLowerCase().endsWith(".lrc")) {
      state.fileType = "lrc";
      state.lines = parseLrcLines(fileContents);
    } else if (fileBlob.name.toLowerCase().endsWith(".txt")) {
      state.fileType = "txt";
      state.lines = parseTxtLines(fileContents);
    }
    state.currentLineIndex = 0;
    // songTitle.textContent = removeFileExtension(fileBlob.name);
    renderLyrics();
  };
  reader.onerror = function (event) {
    console.error("Error reading file:", (event.target as FileReader).error);
  };
  reader.readAsText(fileBlob);
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
  const appendLine = state.lines[state.currentLineIndex + state.numberOfLines - 1];
  const appendText = appendLine ? appendLine.text : '';
  forwards(lyricsListElem, appendText);
}

function scrollPreviousLine() {
  state.currentLineIndex--;
  setTimeoutNextScroll();
  const prependLine = state.lines[state.currentLineIndex];
    const prependText = prependLine ? prependLine.text : '';
  backwards(lyricsListElem, prependText);
}

export {
  scrollNextLine,
  scrollPreviousLine,
  prevSong,
  nextSong,
  handleFileInputChange,
};
