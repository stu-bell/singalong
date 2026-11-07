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
  // visible line count: the current line plus the preview lines (LYR-5)
  numberOfLines: 3,
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
  advanceLine();
}

// LYR-13: lines after a break (a blank line followed by a long gap) stay hidden until this many seconds before the
// line that follows the break. A blank line with a gap of this or less is not a break.
const PREVIEW_LEAD_SECONDS = 2;
// class on a lyric line that hides it (styled in resizing.ts)
const PREVIEW_HIDDEN_CLASS = "preview-hidden";
// true while the current line is a break with hidden lines after it, so "next line" reveals them (LYR-14)
let breakAtCurrentLine = false;
// timer that reveals the lines after the next break. Pauses with the scroll timer (PLY-8)
let revealTimer: number | null = null;
let revealTimerDueAt = 0; // Date.now() at which the reveal timer fires
let revealRemainingMs: number | null = null; // time left on the reveal timer, while paused
let pendingRevealAt = 0; // song time (seconds) at which the pending reveal happens

function clearRevealTimer() {
  if (revealTimer) {
    clearTimeout(revealTimer);
    revealTimer = null;
  }
  revealRemainingMs = null;
}

function scheduleReveal(delayMs: number) {
  if (lyricsPaused) {
    // don't start the timer until resumed
    revealRemainingMs = delayMs;
  } else {
    revealTimerDueAt = Date.now() + delayMs;
    // at the reveal time, show the lines after this break, and look for a later break among the visible lines
    revealTimer = setTimeout(() => updatePreviewVisibility(pendingRevealAt), delayMs);
  }
}

// isBreak returns true if line i is blank and followed by a gap longer than the lead time (LYR-13).
// Untimed (.txt) lines have no timestamps, so they are never breaks.
function isBreak(i: number): boolean {
  const line = state.lines[i];
  const next = state.lines[i + 1];
  return !!line && !!next && line.timestamp !== null && next.timestamp !== null &&
    line.text.trim() === "" && next.timestamp - line.timestamp > PREVIEW_LEAD_SECONDS;
}

// updatePreviewVisibility hides the visible lines after the first break that is still to come, and schedules
// their reveal (LYR-13). nowSeconds is the current song time. Breaks revealing at or before revealedUpTo are
// treated as already revealed, which is how "next line" brings lyrics in early (LYR-14).
function updatePreviewVisibility(nowSeconds: number, revealedUpTo = nowSeconds) {
  clearRevealTimer();
  breakAtCurrentLine = false;
  // lines on screen, current line first. Lines on their way out (.zero) are skipped
  const visible = Array.from(lyricsListElem.querySelectorAll("li:not(.zero)"));
  let hideFromSlot = visible.length;
  for (let slot = 0; slot < visible.length - 1; slot++) {
    const i = state.currentLineIndex + slot;
    if (!isBreak(i)) continue;
    const revealAt = state.lines[i + 1].timestamp! - PREVIEW_LEAD_SECONDS;
    if (revealAt > revealedUpTo) {
      hideFromSlot = slot + 1;
      breakAtCurrentLine = slot === 0;
      pendingRevealAt = revealAt;
      scheduleReveal(Math.max(0, revealAt - nowSeconds) * 1000);
      break;
    }
  }
  visible.forEach((li, slot) => li.classList.toggle(PREVIEW_HIDDEN_CLASS, slot >= hideFromSlot));
}

// revealEarly shows the lines after the current break straight away (LYR-14)
function revealEarly() {
  // work out the song time now from the time left on the reveal timer
  const remainingMs = revealRemainingMs ?? Math.max(0, revealTimerDueAt - Date.now());
  updatePreviewVisibility(pendingRevealAt - remainingMs / 1000, pendingRevealAt);
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
  if (revealTimer) {
    revealRemainingMs = Math.max(0, revealTimerDueAt - Date.now());
    clearTimeout(revealTimer);
    revealTimer = null;
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
  if (revealRemainingMs !== null) {
    const remaining = revealRemainingMs;
    revealRemainingMs = null;
    scheduleReveal(remaining);
  }
}

function setTimeoutNextScroll(from?:number) {
  // setTimeoutNextScroll sets an auto scroll for the next line, based on timestamps
  // cancel inflight timer, since we might have skipped
  clearScrollTimer();
  // song time now: the seek offset on the first render, otherwise the current line's timestamp
  const nowSeconds = from ? from : state.lines[state.currentLineIndex]?.timestamp || 0;
  if (
    state.lines[state.currentLineIndex + 1] &&
    state.lines[state.currentLineIndex + 1].hasOwnProperty('timestamp') && 
    state.lines[state.currentLineIndex + 1].timestamp !== null && 
    // first line may have a timestamp of 0, we still want to set auto scroll
    state.lines[state.currentLineIndex + 1].timestamp! >= 0
  ) {
    const nextLineTime = state.lines[state.currentLineIndex + 1].timestamp || 0;
    const delay = nextLineTime - nowSeconds;
    if (delay >= 0) {
      scheduleScroll(delay * 1000);
    }
    // if the timestamps on current and nextlines are the same, do we just want to skip now?
  }
  // hide lines after any break among the visible lines (LYR-13). Callers update the lines on screen first.
  updatePreviewVisibility(nowSeconds);
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

// scrollNextLine handles the user's "next line" input (LYR-7). While the current line is a break with hidden lines
// after it, it shows them instead of moving forward (LYR-14); the scroll timer keeps running, so the next line still
// arrives on time.
function scrollNextLine() {
  if (breakAtCurrentLine) {
    revealEarly();
    return;
  }
  advanceLine();
}

// advanceLine moves to the next line, used by the auto scroll timer and by "next line"
function advanceLine() {
  state.currentLineIndex++;
  if (state.currentLineIndex >= state.lines.length) {
    nextSong();
  }

  // append a new line to the bottom of the visible list
  const appendLine =
    state.lines[state.currentLineIndex + state.numberOfLines - 1];
  const appendText = appendLine ? appendLine.text : "";
  forwards(lyricsListElem, appendText);
  // after updating the lines on screen, so hidden lines are worked out from the new lines (LYR-13)
  setTimeoutNextScroll();
}

let lastPrevScollTime: number;
const doubleClickDuration = 800;
function scrollPreviousLine() {
  // double scroll back command in close succession
  if ((Date.now() - lastPrevScollTime) < doubleClickDuration ) {
    state.currentLineIndex--;
    const prependLine = state.lines[state.currentLineIndex];
    const prependText = prependLine ? prependLine.text : "";
    backwards(lyricsListElem, prependText);
    // after updating the lines on screen, so hidden lines are worked out from the new lines (LYR-13)
    setTimeoutNextScroll();
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
