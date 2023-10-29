import { assertElementById } from "./util";
import { scrollNextLine, scrollPreviousLine, prevSong, nextSong,handleFileInputChange } from "./lyrics"

// const songTitle = assertElementById("songTitle"); // FIXME: add songTitle when loading lyrics from a file
const fileInput = assertElementById("fileInput");
const lyricsContainer = assertElementById("lyricsContainer");
const songTitle = assertElementById("songTitle");

// select folder event
fileInput.addEventListener("change", (e) => handleFileInputChange(e, lyricsContainer, songTitle));

// show hide lyrics
document.addEventListener("keydown", function (event) {
  if (event.code === "KeyH") {
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
