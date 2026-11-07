// video.ts shows a video behind the lyrics.
// The element plays its own sound, which the player routes through the audio graph's gain node (see audio.ts
// connectMediaElementGraph), so fades behave as for audio files. Sound and picture come from the same element, so they stay in sync.
import { assertElementById } from "./util";
import { isVideoFile as isVideoFileName } from "./files";

export type VideoHandle = {
  element: HTMLVideoElement;
  url: string;
  offset: number; // position in the video, in seconds, that playback starts from
  disposeTimer: number | null;
};

// MAX_LOAD_WAIT_MS caps how long prepareVideo waits for each loading step: the file's metadata, then the first frame
// (or the seek to the track's start). Some files never raise these events, for example a broken file or an unsupported
// codec that gives no error, and without a cap the track would never start.
// If a step takes longer, prepareVideo gives up: the error goes to the console, the element is released, and it resolves
// null. The player then decodes the file's audio instead, so the track plays audio only, with no picture (PLY-11).
// Because the player waits for the video before starting a track, a slow video delays that track's start by up to this
// long per step (so up to twice this in total), plus the time to decode the audio. A video prepared ahead for the
// upcoming track times out in the background, so its track falls back to audio only when it starts.
const MAX_LOAD_WAIT_MS = 10000;

// videos currently showing (not fading out)
const live = new Set<VideoHandle>();
// videos fading out, which still need disposing
const fadingOut = new Set<VideoHandle>();

const isVideoFile = (file: File | null): file is File =>
  !!file && isVideoFileName(file.name);

function waitForEvent(el: HTMLMediaElement, event: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => finish(new Error(`timed out waiting for ${event}`)), MAX_LOAD_WAIT_MS);
    const onEvent = () => finish();
    const onError = () => finish(new Error(el.error?.message || "video error"));
    function finish(error?: Error) {
      clearTimeout(timeout);
      el.removeEventListener(event, onEvent);
      el.removeEventListener("error", onError);
      error ? reject(error) : resolve();
    }
    el.addEventListener(event, onEvent);
    el.addEventListener("error", onError);
  });
}

// prepareVideo loads a video file and seeks it to `offset`, ready to start instantly.
// Resolves null (and logs to the console) if the file has no playable video. The player then falls back to decoding the
// file's audio, so the track plays audio only (PLY-11).
async function prepareVideo(file: File | null, offset: number): Promise<VideoHandle | null> {
  if (!isVideoFile(file)) {
    return null;
  }
  const element = document.createElement("video");
  const url = URL.createObjectURL(file);
  const handle: VideoHandle = { element, url, offset, disposeTimer: null };
  try {
    element.playsInline = true;
    element.preload = "auto";
    element.style.opacity = "0";
    const metadata = waitForEvent(element, "loadedmetadata");
    element.src = url;
    await metadata;
    if (!element.videoWidth) {
      throw new Error("no video track");
    }
    const ready = waitForEvent(element, offset > 0 ? "seeked" : "loadeddata");
    if (offset > 0) {
      element.currentTime = offset;
    }
    await ready;
    return handle;
  } catch (e) {
    console.error(`Can't play the video in ${file.name}, playing audio only:`, e);
    disposeVideo(handle);
    return null;
  }
}

function updateFilter(fadeSeconds: number) {
  const filter = assertElementById("videoFilter");
  filter.style.transitionDuration = `${fadeSeconds}s`;
  filter.classList.toggle("active", live.size > 0);
}

// startVideo shows a prepared video and plays it from its offset, fading the picture in over `fadeSeconds`.
// Route its sound through the audio graph before calling this.
function startVideo(handle: VideoHandle, fadeSeconds: number) {
  const { element } = handle;
  element.style.transition = `opacity ${fadeSeconds}s linear`;
  assertElementById("videoLayer").appendChild(element);
  void element.offsetWidth; // reset transition
  element.style.opacity = "1";
  element.play().catch((e) => console.error("video play failed", e));
  live.add(handle);
  updateFilter(fadeSeconds);
}

// stopVideo fades a video out over `fadeSeconds`, then releases it.
function stopVideo(handle: VideoHandle | null, fadeSeconds: number) {
  if (!handle || fadingOut.has(handle) || !live.has(handle)) {
    return;
  }
  live.delete(handle);
  updateFilter(fadeSeconds);
  if (fadeSeconds <= 0) {
    disposeVideo(handle);
    return;
  }
  fadingOut.add(handle);
  handle.element.style.transition = `opacity ${fadeSeconds}s linear`;
  handle.element.style.opacity = "0";
  handle.disposeTimer = setTimeout(() => disposeVideo(handle), fadeSeconds * 1000 + 100);
}

// disposeVideo stops a video and releases its memory
function disposeVideo(handle: VideoHandle | null) {
  if (!handle) {
    return;
  }
  live.delete(handle);
  fadingOut.delete(handle);
  if (handle.disposeTimer) {
    clearTimeout(handle.disposeTimer);
  }
  handle.element.pause();
  handle.element.removeAttribute("src");
  handle.element.load();
  handle.element.remove();
  URL.revokeObjectURL(handle.url);
}

function pauseVideos() {
  for (const handle of [...live, ...fadingOut]) {
    handle.element.pause();
  }
}

function resumeVideos() {
  for (const handle of [...live, ...fadingOut]) {
    handle.element.play().catch((e) => console.error("video resume failed", e));
  }
}

export {
  prepareVideo,
  startVideo,
  stopVideo,
  disposeVideo,
  pauseVideos,
  resumeVideos,
};
