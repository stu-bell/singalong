import { makeDragable } from "./drag";
import { assertElementById } from "./util";
import { prevSong, nextSong, handleFileInputChange, HTMLFileInputElement } from "./player";
import {
  scrollNextLine,
  scrollPreviousLine,
  weJustAutoScrolled,
} from "./lyrics";
import { requestFullscreen } from "./screen";
import { initResizing, startObservingResizing, stopObservingResizing, updateFontSizes } from "./resizing";

// resize the lyrics container 
const dragContainer = assertElementById('dragcontainer')
makeDragable(dragContainer, exitScreenSetup);

function toggleScreenSetup() {
  if (dragContainer.classList.contains('dragmode')) {
    exitScreenSetup();
  } else {
    enterScreenSetup();
  }
}

function enterScreenSetup() {
  requestFullscreen();
  assertElementById('body').classList.remove('cursor-none')
  // ensure container is visible
  dragContainer.classList.remove('hidden')
  dragContainer.classList.add('dragmode')
  startObservingResizing();
}

function exitScreenSetup() {
  dragContainer.classList.remove('dragmode');
  // depends if we're on the home screen or not...
  if (assertElementById("home").classList.contains("hidden")) {
    assertElementById('body').classList.add('cursor-none');
  } else {
    dragContainer.classList.add('hidden');
  }
  stopObservingResizing();
  updateFontSizes(); // Update font sizes one last time after exiting drag mode
}

// Toggle screensetup
assertElementById("screenBtn").addEventListener("click", () => enterScreenSetup());

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

// go event
assertElementById("goBtn").addEventListener("click", () => {
  // screen modifications
  requestFullscreen();
  dragContainer.classList.remove('hidden');
  dragContainer.classList.remove('dragmode');
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

  // initial font size
  updateFontSizes();

  // main function
  handleFileInputChange(fileInput as HTMLFileInputElement, lyricsContainer);
});

// scroll events
function triggerScrollNext () {
    // don't scroll next if we've just followed an auto scroll
    if (!weJustAutoScrolled(500)){
      scrollNextLine();
    }
};
function triggerScrollPrevious () {
    scrollPreviousLine();
};

let lastTouchTime: number;
document.addEventListener("touchstart", (event: TouchEvent) => {
    const touch = event.touches[0];
    // is there a double touch event - prevents accidental touching of screen
    const doubleClickDuration = 800;
    if (touch && (Date.now() - lastTouchTime) < doubleClickDuration) {
      if (touch.clientX > window.innerWidth / 2) {
        // right half of the screen
        triggerScrollNext();
      } else {
        // left half of the screen
        triggerScrollPrevious();
      }
    }
    lastTouchTime = Date.now();
});

document.addEventListener("keydown", function (event) {
  if (event.key === " " ||
      event.key === "ArrowDown" ||
      event.key === "PageDown" ||
      event.key === "ArrowRight"
  ) {
    triggerScrollNext();
  } else if (event.key === "ArrowUp" ||
             event.key === "PageUp" ||
             event.key === "ArrowLeft") {
    triggerScrollPrevious();
  }
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
    toggleScreenSetup();
  }
});


initResizing();
