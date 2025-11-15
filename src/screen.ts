async function requestFullscreen(el: HTMLElement = document.documentElement): Promise<void> {
    const request = el.requestFullscreen || (el as any).webkitRequestFullscreen || (el as any).msRequestFullscreen;
    if (request) {
        // Await the full-screen request. This line pauses only this async function,
        // but the calling code in main.ts has already moved on.
        await request.call(el); 
    } else {
        console.warn("Fullscreen API not supported by this browser.");
    }
}


/**
 * Initiates full-screen mode and attempts to lock the screen orientation to landscape.
 * * IMPORTANT: This function must be called synchronously inside a user gesture handler.
 * Events such as window.alert and file input changes remove full screen
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
        // @ts-ignore orientation.lock
        await screen.orientation.lock('landscape'); 
    } catch (e) {
        console.error('requestFullscreenAndLandscape error: ', (e as Error).message);
    }
}


let wakeLock:any = null;
async function requestWakeLock() {
    // Request the wake lock to keep screen from sleeping
    // TODO: test this
    console.log('requesting wakelock')
    wakeLock = await navigator.wakeLock.request("screen");
    console.log('wakelock complete')
    // Re-activate if the tab becomes visible again
    document.addEventListener("visibilitychange", async () => {
      if (document.visibilityState === "visible" && wakeLock === null) {
        wakeLock = await navigator.wakeLock.request("screen");
        console.log("Wake lock restored");
      }
    });
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
  isFullScreen,
  requestFullscreen,
  exitFullScreen,
}
