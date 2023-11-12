import { LyricLines } from "./lrcFile";
import { propOrDefault } from "./util";
import { nextSong } from "./player";

let lyricsListElem: HTMLElement;

let state: {
  fileType: string;
  numberOfLines: number;
  currentLineIndex: number;
  currentFileIndex: number;
  filesList: any[];
  lines: LyricLines;
} = {
  lines: [],
  filesList: [],
  fileType: "txt",
  numberOfLines: 10,
  currentLineIndex: 0,
  currentFileIndex: 0,
};

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
    state.lines[state.currentLineIndex + 1] &&
    state.lines[state.currentLineIndex + 1].timestamp
  ) {
    const currentLineTime = state.lines[state.currentLineIndex].timestamp || 0;
    const nextLineTime = state.lines[state.currentLineIndex + 1].timestamp || 0;
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
const weJustAutoScrolled = (milliseconds = 500) =>
  Date.now() - lastAutoScrollTime < milliseconds;

function renderLyrics(lines: LyricLines, htmlElement: HTMLElement) {
  lyricsListElem = htmlElement;
  // set lines for current track
  state.lines = lines;
  // calling renderLyrics goes back to the start of the song
  state.currentLineIndex = 0;

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

  // start the timer for auto scroll
  setTimeoutNextScroll();
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
  weJustAutoScrolled,
  setTimeoutNextScroll,
  renderLyrics,
};
