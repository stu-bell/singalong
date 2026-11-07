import { LyricLines } from "./lrcFile";
import { nextSong } from "./player";
import { propOrDefault } from "./util";

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
  numberOfLines: 4,
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
    void first.offsetWidth; // reset transition
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
// pause support: while paused no timer runs, and the time left is kept for resume
let lyricsPaused = false;
let scrollTimerDueAt = 0; // Date.now() at which the running timer fires
let scrollRemainingMs: number | null = null; // time left on the timer, while paused

function autoScroll() {
  // register time we last auto-scrolled
  lastAutoScrollTime = Date.now();
  scrollNextLine();
}

function clearScrollTimer() {
  if (scrollTimer) {
    clearTimeout(scrollTimer);
    scrollTimer = null;
  }
  scrollRemainingMs = null;
}

function scheduleScroll(delayMs: number) {
  if (lyricsPaused) {
    // don't start the timer until resumed
    scrollRemainingMs = delayMs;
  } else {
    scrollTimerDueAt = Date.now() + delayMs;
    scrollTimer = setTimeout(autoScroll, delayMs);
  }
}

function pauseLyrics() {
  if (lyricsPaused) return;
  lyricsPaused = true;
  if (scrollTimer) {
    scrollRemainingMs = Math.max(0, scrollTimerDueAt - Date.now());
    clearTimeout(scrollTimer);
    scrollTimer = null;
  }
}

function resumeLyrics() {
  if (!lyricsPaused) return;
  lyricsPaused = false;
  if (scrollRemainingMs !== null) {
    const remaining = scrollRemainingMs;
    scrollRemainingMs = null;
    scheduleScroll(remaining);
  }
}

function setTimeoutNextScroll(from?:number) {
  // setTimeoutNextScroll sets an auto scroll for the next line, based on timestamps
  // cancel inflight timer, since we might have skipped
  clearScrollTimer();
  if (
    state.lines[state.currentLineIndex + 1] &&
    state.lines[state.currentLineIndex + 1].hasOwnProperty('timestamp') && 
    state.lines[state.currentLineIndex + 1].timestamp !== null && 
    // first line may have a timestamp of 0, we still want to set auto scroll
    state.lines[state.currentLineIndex + 1].timestamp! >= 0
  ) {
    const currentLineTime = from ? from : state.lines[state.currentLineIndex].timestamp || 0;
    const nextLineTime = state.lines[state.currentLineIndex + 1].timestamp || 0;
    const delay = nextLineTime - currentLineTime;
    if (delay >= 0) {
      scheduleScroll(delay * 1000);
    }
    // if the timestamps on current and nextlines are the same, do we just want to skip now?
  }
}

// weJustAutoScrolled returns true if there is a short duration between the now and the last auto scroll event
const weJustAutoScrolled = (milliseconds = 500) =>
  Date.now() - lastAutoScrollTime < milliseconds;

function seekLyrics(lines:LyricLines, offsetSeconds: number = 0): number {
  // seekLyrics looks through timestamps to find the line the corresponds to the offset
  // ie the line before the first line that has a timestamp greater than the offset
  if (!lines.some(l => l.timestamp)) {
    // untimed lyrics (.txt files) start at the beginning (LYR-3, LYR-10)
    return 0;
  }
  const firstIndex = lines.findIndex(l => (l.timestamp || 0) > offsetSeconds);
  // no lines come after offsetSeconds: show the last line, rather than an index past the end (which renders nothing)
  const index = (firstIndex === -1) ? lines.length - 1 : firstIndex - 1;
  return index
}

function renderLyrics(lines: LyricLines, htmlElement: HTMLElement, offsetSeconds = 0, endSeconds?: number) {
  // renderLyrics sets up initial lyrics in an HTML element. 
  lyricsListElem = htmlElement;
  
  // filter out lines where timestamp is greater than the end timestamp
  const filteredLines = (endSeconds) ? lines.filter(l => (l.timestamp || 0) <= endSeconds) : lines

  // set lines for current track
  state.lines = filteredLines;

  const seekIndex = seekLyrics(state.lines, offsetSeconds)
  state.currentLineIndex = seekIndex;

  // remove current lyrics
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
  // big up the first line
  const first = lyricsListElem.firstElementChild as HTMLElement | null;
  if (first) {
    void first.offsetWidth; // reset transition
    first.classList.add('large');
  }

  // start the timer for auto scroll
  setTimeoutNextScroll(offsetSeconds);
}

function scrollNextLine() {
  state.currentLineIndex++;
  if (state.currentLineIndex >= state.lines.length) {
    nextSong();
  }

  setTimeoutNextScroll();
  // append a new line to the bottom of the visible list
  const appendLine =
    state.lines[state.currentLineIndex + state.numberOfLines - 1];
  const appendText = appendLine ? appendLine.text : "";
  forwards(lyricsListElem, appendText);
}

let lastPrevScollTime: number;
const doubleClickDuration = 800;
function scrollPreviousLine() {
  // double scroll back command in close succession
  if ((Date.now() - lastPrevScollTime) < doubleClickDuration ) {
    state.currentLineIndex--;
    setTimeoutNextScroll();
    const prependLine = state.lines[state.currentLineIndex];
    const prependText = prependLine ? prependLine.text : "";
    backwards(lyricsListElem, prependText);
  } else {
    // single scroll back command, only reset the timer for the current line
    setTimeoutNextScroll();
  }
  lastPrevScollTime = Date.now();
}

export {
  scrollNextLine,
  scrollPreviousLine,
  weJustAutoScrolled,
  pauseLyrics,
  resumeLyrics,
  setTimeoutNextScroll,
  renderLyrics,
};
