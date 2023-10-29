import { assertElementById } from "./util";
import { scrollNextLine, scrollPreviousLine, prevSong, nextSong,handleFileInputChange } from "./lyrics"

// const songTitle = assertElementById("songTitle"); // FIXME: add songTitle when loading lyrics from a file
const fileInput = assertElementById("fileInput");
const lyricsContainer = assertElementById("lyricsContainer");

// select folder event
fileInput.addEventListener("change", (e) => handleFileInputChange(e, lyricsContainer));

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
    scrollNextLine(lyricsContainer);
  } else if (event.code === "ArrowUp" || event.code === "ArrowLeft") {
    scrollPreviousLine(lyricsContainer);
  }
});

document.addEventListener("touchstart", function () {
  scrollNextLine(lyricsContainer);
});

// next prev events
document.addEventListener("keydown", function (event) {
  if (event.code === "KeyN") {
    nextSong(lyricsContainer);
  } else if (event.code === "KeyP") {
    prevSong(lyricsContainer);
  }
});

// Check compatibility with required APIs
if (!window.FileReader || !window.FileList || !window.File || !window.Blob) {
  alert(
    "Your browser does not support the required APIs. Please use a modern browser."
  );
}
