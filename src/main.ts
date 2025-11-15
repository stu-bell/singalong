import { makeDragable } from "./drag";
import { assertElementById } from "./util";
import { prevSong, nextSong, handleFileInputChange, HTMLFileInputElement } from "./player";
import {
  scrollNextLine,
  scrollPreviousLine,
  weJustAutoScrolled,
  setTimeoutNextScroll,
} from "./lyrics";
import { requestFullscreenAndLandscape } from "./screen";

// drag the lyrics container 
const dragContainer = assertElementById('dragcontainer')
makeDragable(dragContainer);
function toggleDragMode() {
  assertElementById('body').classList.toggle('cursor-none')
  dragContainer.classList.toggle('dragmode')
}

const lyricsContainer = assertElementById("lyricsContainer");
const fileInput = assertElementById("fileInput")

// select folder event
assertElementById("fileInputButton").addEventListener("click", () => assertElementById("fileInput").click() );
assertElementById("fileInput").addEventListener("change", (e: any) => {
  if (e.target.files.length) {
    assertElementById("goBtn").classList.remove("disabled");
    (assertElementById("goBtn") as HTMLButtonElement).disabled = false;
    assertElementById("fileInputSuccess").classList.remove("hidden");
  }
});

assertElementById("goBtn").addEventListener("click", () => {
  // screen modifications
  requestFullscreenAndLandscape();
  dragContainer.classList.remove('hidden');
  lyricsContainer.classList.remove('hidden');
  assertElementById("home").classList.add("hidden");
  assertElementById('body').classList.add('cursor-none');
  // TODO: test wakelock from ./screen
  // requestWakeLock();

  // prevent tab (on mobile with presentation remotes, accidental tab press removes focus from the web app)
  document.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
      event.preventDefault();
    }
  });

  // main function
  handleFileInputChange(fileInput as HTMLFileInputElement, lyricsContainer);
});

// scroll events
document.addEventListener("keydown", function (event) {
  if (
    (event.key === " " ||
      event.key === "ArrowDown" ||
      event.key === "PageDown" ||
      event.key === "ArrowRight") &&
    // don't scroll next if we've just followed an auto scroll
    !weJustAutoScrolled(500)
  ) {
    scrollNextLine();
  } else if (event.key === "ArrowUp" ||
              event.key === "PageUp" ||
             event.key === "ArrowLeft") {
    scrollPreviousLine();
  } else if (event.key === "0") {
    // resset the timeout until the next autoscroll. Useful if the lyrics are going too fast
    console.log("reset");
    setTimeoutNextScroll();
  }
});

document.addEventListener("touchstart", function () {
  scrollNextLine();
});

// next prev song events
document.addEventListener("keydown", function (event) {
  if (event.key === "N") { // shift+ n
    nextSong();
  } else if (event.key === "P") { // shift + p
    prevSong();
  }
});

// drag/ resize
document.addEventListener("keydown", function (event) {
  if (event.key === "Z") { // shift+ z
    toggleDragMode();
  }
});
