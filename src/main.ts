import { assertElementById } from "./util";
import {
  prevSong,
  nextSong,
  handleFileInputChange,
} from "./player";
import {
  scrollNextLine,
  scrollPreviousLine,
  weJustAutoScrolled,
  setTimeoutNextScroll,
} from "./lyrics"

const lyricsContainer = assertElementById("lyricsContainer");

// select folder event
assertElementById("fileInput").addEventListener("change", (e) =>{
  handleFileInputChange(e, lyricsContainer);
  assertElementById('home').classList.add('hidden');  
});

// show hide lyrics
document.addEventListener("keydown", function (event) {
  if (event.key === "s") {
    lyricsContainer.classList.toggle("hidden");
  }
});

// scroll events
document.addEventListener("keydown", function (event) {
  if (
    (event.key === " " ||
      event.key === "ArrowDown" ||
      event.key === "ArrowRight") 
    // don't scroll next if we've just followed an auto scroll
    && !weJustAutoScrolled(500)
  ) {
    scrollNextLine();
  } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
    scrollPreviousLine();
  } else if (event.key === "0") {
    // resset the timeout until the next autoscroll. Useful if the lyrics are going too fast
    console.log('reset')
    setTimeoutNextScroll();
  }
});

document.addEventListener("touchstart", function () {
  scrollNextLine();
});


// next prev events
document.addEventListener("keydown", function (event) {
  if (event.key === "n") {
    nextSong();
  } else if (event.key === "p") {
    prevSong();
  }
});

// Check compatibility with required APIs
if (!window.FileReader || !window.FileList || !window.File || !window.Blob) {
  alert(
    "Your browser does not support the required APIs. Please use a modern browser."
  );
}
