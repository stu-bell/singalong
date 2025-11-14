import { makeDragable } from "./drag";
import { assertElementById } from "./util";
import { prevSong, nextSong, handleFileInputChange } from "./player";
import {
  scrollNextLine,
  scrollPreviousLine,
  weJustAutoScrolled,
  setTimeoutNextScroll,
} from "./lyrics";
import { requestFullScreen, requestLandscape, requestWakeLock } from "./screen";

// drag the lyrics container 
const dragContainer = assertElementById('dragcontainer')
makeDragable(dragContainer);
function toggleDragMode() {
  assertElementById('body').classList.toggle('cursor-none')
  dragContainer.classList.toggle('dragmode')
}

const lyricsContainer = assertElementById("lyricsContainer");

// select folder event
assertElementById("fileInputButton").addEventListener("click", () => {
  // request screen modifications
  try {
    requestWakeLock();
  } catch (e:any) {
    alert('request wakelock ' + e.message)
  }
  try {
    requestLandscape();
  } catch (e:any) {
    alert('request landscape' + e.message)
  }
  try {
    requestFullScreen();
  } catch (e:any) {
    alert('request full screen' + e.message)
  }

  // select files
  assertElementById("fileInput").click()
}
);

assertElementById("fileInput").addEventListener("change", (e) => {
  handleFileInputChange(e, lyricsContainer);
  // Tab hides lyrics container - we want to make sure it's initially visible
  dragContainer.classList.remove('hidden')
  lyricsContainer.classList.remove('hidden')
  assertElementById("home").classList.add("hidden");
  assertElementById('body').classList.add('cursor-none');
});

// show hide lyrics
document.addEventListener("keydown", function (event) {
  if (event.key === "S" ) {
    // shift + S 
    event.preventDefault();
    lyricsContainer.classList.toggle("hidden");
  }
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
