let fileType = "txt";
const numberOfLines = 10;
let currentLineIndex = 0;
let currentFileIndex = 0;
let filesList: any[] = [];
let lines: any[] = [];
let lastTransitionEvent = ""; // auto or manual

const getElementByIdThrowIfNone = (elementId: string): HTMLElement => {
  const el = document.getElementById(elementId);
  if (el === null) {
    throw new Error(`Cannot find element ${elementId}.`);
  }
  return el;
};

const songTitle = getElementByIdThrowIfNone("songTitle");
const fileInput = getElementByIdThrowIfNone("fileInput");
const lyricsContainer = getElementByIdThrowIfNone("lyricsContainer");

// setTimeout allowing us to adjust the timer
let scrollTimer: number | null | undefined = null;

function setTimeoutNextScroll() {
  // TODO:register timeout so we can detect if we've slow reactions! also need to clear the timout...
  if (scrollTimer) {
    // cancel inflight timer, since we've skipped
    clearTimeout(scrollTimer);
  }
  if (
    fileType === "lrc" &&
    lines[currentLineIndex] &&
    lines[currentLineIndex + 1]
  ) {
    const currentLineTime = lines[currentLineIndex].timestamp;
    const nextLineTime = lines[currentLineIndex + 1].timestamp;
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

const propOrDefault =
  (propName: string, defVal: string | null = null) =>
  (obj: { [x: string]: any; hasOwnProperty: (arg0: any) => any }) =>
    obj.hasOwnProperty(propName) ? obj[propName] : defVal;

function backwards() {
  var list = getElementByIdThrowIfNone("lyricsContainer") as HTMLElement;

  // prepend line
  const newLi = document.createElement("li");
  newLi.textContent = lines[currentLineIndex].text || "";
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

function forwards() {
  var list = document.getElementById("lyricsContainer") as HTMLElement;

  // remove any nodes on their way out
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
  newLi.textContent = lines[currentLineIndex + numberOfLines - 1].text || "";
  list.appendChild(newLi);
}

function renderLyrics() {
  setTimeoutNextScroll();

  while (lyricsContainer.firstChild) {
    lyricsContainer.firstChild.remove();
  }

  const currentLines = lines
    .slice(currentLineIndex, currentLineIndex + numberOfLines)
    .map(propOrDefault("text", ""));

  for (let line of currentLines) {
    const el = document.createElement("li");
    el.textContent = currentLines[line];
    const lyricsContainer = document.getElementById(
      "lyricsContainer"
    ) as HTMLElement;
    lyricsContainer.appendChild(el);
  }
}

function parseTimestamp(timestamp: string) {
  if (timestamp) {
    const clean = timestamp.replace(/[[\]]/g, "");
    const parts = clean.split(":");
    const minutes = parseInt(parts[0]);
    const seconds = parseFloat(parts[1]);
    return minutes * 60 + seconds;
  }
}

function sortLrcFile(lrcFile: string) {
  // some lrc files have repeated lyrics on one line with multiple timetamps. This splits into multiple lines and sorts the result lines
  // split file by newline and filter out blank lines
  const lines = lrcFile
    .split("\n")
    .filter((line: string) => line.trim() !== "");
  let result: string[] = [];
  lines.forEach((line: string) => {
    const trimmedLine = line.trim();
    const timestampPattern = /\[\d{2}:\d{2}\.\d{2}\]/g;
    const matches = trimmedLine.match(timestampPattern);
    if (matches && matches.length > 1) {
      const lyric = trimmedLine.replace(timestampPattern, "").trim();
      matches.forEach((timestamp: any) => {
        result.push(`${timestamp}${lyric}`);
      });
    } else {
      result.push(trimmedLine);
    }
  });
  result.sort();
  return result;
}

function parseLrcLines(fileContents: string) {
  const lines = sortLrcFile(fileContents);
  const removeTags = lines.filter(
    (l) => !(l.startsWith("[") && l.endsWith("]"))
  );
  const splitLeadingTimeStamps = removeTags.map((s) => {
    const matchTimestamp = s.match(/^\[\d\d?:\d\d?\.\d\d?\]/);
    let splitIndex = 0;
    if (matchTimestamp) {
      splitIndex = matchTimestamp[0].length;
    }
    return {
      timestamp: parseTimestamp(s.substring(0, splitIndex)),
      text: s.substring(splitIndex),
    };
  });
  return [{ timestamp: 0, text: "" }, ...splitLeadingTimeStamps];
}

function parseTxtLines(fileContents: string) {
  const lines = fileContents.split("\n");
  const mapped = lines.map((l: any) => ({ text: l }));
  return mapped;
}

function removeFileExtension(filename: string) {
  var lastDotIndex = filename.lastIndexOf(".");
  if (lastDotIndex === -1) {
    // No file extension found
    return filename;
  } else {
    return filename.substring(0, lastDotIndex);
  }
}

function loadLyricsFromFile(fileBlob: any) {
  let reader = new FileReader();
  reader.onload = function (event) {
    const fileContents = (event.target as FileReader).result as string;
    if (fileBlob.name.toLowerCase().endsWith(".lrc")) {
      fileType = "lrc";
      lines = parseLrcLines(fileContents);
    } else if (fileBlob.name.toLowerCase().endsWith(".txt")) {
      fileType = "txt";
      lines = parseTxtLines(fileContents);
    }
    currentLineIndex = 0;
    songTitle.textContent = removeFileExtension(fileBlob.name);
    renderLyrics();
  };
  reader.onerror = function (event) {
    console.error("Error reading file:", (event.target as FileReader).error);
  };
  reader.readAsText(fileBlob);
}

function nextSong() {
  if (currentFileIndex < filesList.length) {
    currentFileIndex++;
    loadLyricsFromFile(filesList[currentFileIndex]);
  }
}

function prevSong() {
  if (currentLineIndex > 2) {
    // go back to start of current song
    currentLineIndex = 0;
    renderLyrics();
  } else if (currentFileIndex > 0) {
    // go back to previous song
    currentFileIndex--;
    loadLyricsFromFile(filesList[currentFileIndex]);
  }
}

function handleFileInputChange(event:any) {
  const folderFiles = Array.from(event.target.files);
  filesList = folderFiles.filter(
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
        const filesListOrdered = filesList.sort((fileA, fileB) => {
          const indexA = playlistOrder.indexOf(fileA.name);
          const indexB = playlistOrder.indexOf(fileB.name);
          return indexA - indexB;
        });
        filesList = filesListOrdered;
        currentFileIndex = -1;
        nextSong();
      }
    };
    reader.onerror = function (event) {
      console.error("Error reading file:", (event.target as FileReader).error);
    };
    reader.readAsText(playlistFile as Blob);
  } else {
    // don't order the folder, just play in what ever order they come
    currentFileIndex = -1;
    nextSong();
  }
  fileInput.classList.add("hidden");
  lyricsContainer.classList.remove("hidden");
}

function scrollNextLine() {
  currentLineIndex++;

  if (currentLineIndex >= lines.length) {
    nextSong();
  }

  setTimeoutNextScroll();
  forwards();
}

function scrollPreviousLine() {
  currentLineIndex--;
  setTimeoutNextScroll();
  backwards();
}

// select folder event
getElementByIdThrowIfNone("fileInput").addEventListener("change", handleFileInputChange);

// show hide
document.addEventListener("keydown", function (event) {
  if (event.code === "Enter") {
    lyricsContainer.classList.toggle("hidden");
  }
});

// scroll events
document.addEventListener("keydown", function (event) {
  if (
    event.code === "Space" ||
    event.code === "ArrowDown" ||
    event.code === "ArrowRight"
  ) {
    scrollNextLine();
  } else if (event.code === "ArrowUp" || event.code === "ArrowLeft") {
    scrollPreviousLine();
  }
});

document.addEventListener("touchstart", function () {
  scrollNextLine();
});

// next prev events
document.addEventListener("keydown", function (event) {
  if (event.code === "KeyN") {
    nextSong();
  } else if (event.code === "KeyP") {
    prevSong();
  }
});

// Check compatibility with required APIs
if (!window.FileReader || !window.FileList || !window.File || !window.Blob) {
  alert(
    "Your browser does not support the required APIs. Please use a modern browser."
  );
}
