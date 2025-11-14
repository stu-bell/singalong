let wakeLock:any = null;
async function requestWakeLock() {
    // Request the wake lock
    wakeLock = await navigator.wakeLock.request("screen");

    // Re-activate if the tab becomes visible again
    document.addEventListener("visibilitychange", async () => {
      if (document.visibilityState === "visible" && wakeLock === null) {
        wakeLock = await navigator.wakeLock.request("screen");
        console.log("Wake lock restored");
      }
    });
}

async function requestLandscape() {
  alert('landscape requested')
    // @ts-ignore
    await screen.orientation.lock('landscape');
}

const isFullScreen = () => !!( // doesn't work if F11 is used
    // @ts-ignore
    document.fullscreenElement ||
    // @ts-ignore
    document.webkitFullscreenElement ||
    // @ts-ignore
    document.mozFullScreenElement ||
    // @ts-ignore
    document.msFullscreenElement   );

const requestFullScreen = (el: HTMLElement = document.documentElement) => {
  // will only work from a secure context, eg in a handler from a user triggered event, such as click
    // @ts-ignore
  if (el.requestFullscreen) {
    // @ts-ignore
      el.requestFullscreen();
    // @ts-ignore
  } else if (el.webkitRequestFullscreen) { // Safari
    // @ts-ignore
      el.webkitRequestFullscreen();
    // @ts-ignore
  } else if (el.msRequestFullscreen) { // old Edge
    // @ts-ignore
      el.msRequestFullscreen();
  }
}

const exitFullScreen = () => {
    // @ts-ignore
  if (document.exitFullscreen) {
    // @ts-ignore
    document.exitFullscreen();
    // @ts-ignore
  } else if (document.webkitExitFullscreen) {
    // @ts-ignore
    document.webkitExitFullscreen();
    // @ts-ignore
  } else if (document.msExitFullscreen) {
    // @ts-ignore
    document.msExitFullscreen();
  }
}

export {
  requestWakeLock,
  requestLandscape,
  isFullScreen,
  requestFullScreen,
  exitFullScreen,
}
