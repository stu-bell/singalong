// video.ts shows a muted video behind the lyrics, following the audio clock.
// The audio of the file is played separately through the audio graph (see audio.ts), so the audio's start, end and fade
// behave exactly as for audio files. The video is only the picture.
import { assertElementById } from "./util";
import { getAudioContext } from "./audio";
import { getFileExtension } from "./files";

export type VideoHandle = {
  element: HTMLVideoElement;
  url: string;
  offset: number; // position in the video, in seconds, that corresponds to the start of playback
  startedAt: number; // audio context time at which playback started
  syncTimer: number | null;
  disposeTimer: number | null;
};

const MAX_LOAD_WAIT_MS = 10000;
// how often to compare the video with the audio clock
const SYNC_INTERVAL_MS = 1000;
const FIRST_SYNC_DELAY_MS = 300;
// beyond this much drift (seconds), jump to the right position. Below it, nudge the playback rate
const JUMP_DRIFT = 0.3;
// below this much drift (seconds), leave the video alone
const IGNORE_DRIFT = 0.04;
const NUDGE_RATE = 0.05;

// videos currently showing (not fading out)
const live = new Set<VideoHandle>();
// videos fading out, which still need disposing
const fadingOut = new Set<VideoHandle>();

const isVideoFile = (file: File | null): file is File =>
  !!file && getFileExtension(file.name) === "mp4";

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
// Resolves null (and logs to the console) if the file has no playable video, in which case the track plays audio only (PLY-11).
async function prepareVideo(file: File | null, offset: number): Promise<VideoHandle | null> {
  if (!isVideoFile(file)) {
    return null;
  }
  const element = document.createElement("video");
  const url = URL.createObjectURL(file);
  const handle: VideoHandle = { element, url, offset, startedAt: 0, syncTimer: null, disposeTimer: null };
  try {
    element.muted = true;
    element.defaultMuted = true;
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

// startVideo shows a prepared video and plays it from its offset, fading it in over `fadeSeconds`.
// Call this at the same moment the audio starts.
function startVideo(handle: VideoHandle, fadeSeconds: number) {
  const { element } = handle;
  handle.startedAt = getAudioContext().currentTime;
  element.style.transition = `opacity ${fadeSeconds}s linear`;
  assertElementById("videoLayer").appendChild(element);
  void element.offsetWidth; // reset transition
  element.style.opacity = "1";
  element.play().catch((e) => console.error("video play failed", e));
  live.add(handle);
  updateFilter(fadeSeconds);
  handle.syncTimer = setTimeout(() => syncVideo(handle), FIRST_SYNC_DELAY_MS);
}

// stopVideo fades a video out over `fadeSeconds`, then releases it.
function stopVideo(handle: VideoHandle | null, fadeSeconds: number) {
  if (!handle || fadingOut.has(handle) || !live.has(handle)) {
    return;
  }
  live.delete(handle);
  updateFilter(fadeSeconds);
  if (handle.syncTimer) {
    clearTimeout(handle.syncTimer);
    handle.syncTimer = null;
  }
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
  if (handle.syncTimer) {
    clearTimeout(handle.syncTimer);
  }
  if (handle.disposeTimer) {
    clearTimeout(handle.disposeTimer);
  }
  handle.element.pause();
  handle.element.removeAttribute("src");
  handle.element.load();
  handle.element.remove();
  URL.revokeObjectURL(handle.url);
}

// expectedPosition is where the video should be, given the audio clock. The audio clock stops while the audio context is
// suspended (paused), so this stays correct across pause and resume. Audio is heard outputLatency after the clock reaches it.
function expectedPosition(handle: VideoHandle): number {
  const acx = getAudioContext();
  const latency = (acx as any).outputLatency || acx.baseLatency || 0;
  return handle.offset + (acx.currentTime - handle.startedAt) - latency;
}

// syncVideo keeps the video in step with the audio, which is on a different clock
function syncVideo(handle: VideoHandle) {
  const { element } = handle;
  const acx = getAudioContext();
  if (acx.state === "running" && !element.paused && element.readyState >= 2) {
    const drift = element.currentTime - expectedPosition(handle);
    const target = expectedPosition(handle);
    if (Math.abs(drift) > JUMP_DRIFT && target >= 0 && target < element.duration) {
      element.currentTime = target;
      element.playbackRate = 1;
    } else if (Math.abs(drift) > IGNORE_DRIFT) {
      // ahead of the audio: slow down. behind: speed up
      element.playbackRate = drift > 0 ? 1 - NUDGE_RATE : 1 + NUDGE_RATE;
    } else {
      element.playbackRate = 1;
    }
  }
  handle.syncTimer = setTimeout(() => syncVideo(handle), SYNC_INTERVAL_MS);
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
