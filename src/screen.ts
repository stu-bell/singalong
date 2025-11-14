/**
 * Initiates full-screen mode and attempts to lock the screen orientation to landscape.
 * * IMPORTANT: This function must be called synchronously inside a user gesture handler.
 * Since the caller does NOT use 'await', all error handling is done internally.
 * * @param el The HTMLElement to make full-screen (defaults to the document element).
 */
async function requestFullscreenAndLandscape(el: HTMLElement = document.documentElement): Promise<void> {
    
    //  handle all rejections (synchronous and asynchronous) internally 
    // because the calling code will not be awaiting this Promise.
    try {
        // 1. Request Fullscreen
        const request = el.requestFullscreen || (el as any).webkitRequestFullscreen || (el as any).msRequestFullscreen;
        
        if (request) {
            // Await the full-screen request. This line pauses only this async function,
            // but the calling code in main.ts has already moved on.
            await request.call(el); 
        } else {
            throw new Error("Fullscreen API not supported by this browser.");
        }

        // 2. Lock Orientation (Executes only if full-screen was successful)
        await screen.orientation.lock('landscape'); 
        
    } catch (e) {
        // Log all failures (User denied, API not supported, gesture missing, etc.)
        console.error('Fullscreen and orientation lock setup sequence failed:', (e as Error).message);
    }
}

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
  requestFullscreenAndLandscape,
  requestLandscape,
  isFullScreen,
  requestFullScreen,
  exitFullScreen,
}
