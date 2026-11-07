import { formatSecondsToTimestamp } from "./lrcFile";
import { getFileExtension } from "./files";

let acx: AudioContext;
let currentlyPlaying: Graph;

function getCurrentlyPlaying() {
  return currentlyPlaying
}

function getAudioContext() {
  if (!acx) {
    acx = new window.AudioContext(); // || window.webkitAudioContext)();
  }
  return acx;
}

function pauseAudioContext() {
  getAudioContext().suspend();
}

function resumeAudioContext() {
  getAudioContext().resume();
}

// Graph is one playing source (a decoded buffer, or a media element) with its own gain, used for fading
type Graph = {
  gain: GainNode;
  start: (offset?: number) => void; // begin playback, from `offset` seconds
  stop: (when: number) => void; // stop playback at audio context time `when`
};

async function loadAudioFromFile(file: File): Promise<AudioBuffer> {
  const audioContext = getAudioContext();
  const arrayBuffer = await file.arrayBuffer();
  return new Promise<AudioBuffer>((resolve, reject) => {
    audioContext.decodeAudioData(arrayBuffer, resolve, reject);
  });
}

function connectGain(source: AudioNode) {
  const audioContext = source.context;
  const gain = audioContext.createGain();
  source.connect(gain);
  gain.connect(audioContext.destination);
  return gain;
}

// connectAudioGraph plays a decoded audio buffer
function connectAudioGraph(buffer:AudioBuffer):Graph {
  const source = getAudioContext().createBufferSource();
  source.buffer = buffer;
  const gain = connectGain(source);
  // release the nodes once playback has stopped
  source.onended = () => {
    source.disconnect();
    gain.disconnect();
  };
  return {
    gain,
    start: (offset) => source.start(undefined, offset),
    stop: (when) => source.stop(when),
  };
}

// connectMediaElementGraph routes a media element's sound through a gain node.
// The element's own play/pause and position are controlled by its owner (see video.ts), so start does nothing here,
// and stop only releases the nodes once the fade out is over.
function connectMediaElementGraph(element: HTMLMediaElement): Graph {
  const audioContext = getAudioContext();
  const source = audioContext.createMediaElementSource(element);
  const gain = connectGain(source);
  return {
    gain,
    start: () => {},
    stop: (when) => {
      setTimeout(() => {
        source.disconnect();
        gain.disconnect();
      }, Math.max(0, when - audioContext.currentTime) * 1000 + 100);
    },
  };
}

function fadeIn(graph: Graph, fadeDuration: number = 0, offset?: number) {
  const audioContext = graph.gain.context;
  graph.start(offset);
  graph.gain.gain.setValueAtTime(0, audioContext.currentTime);
  graph.gain.gain.linearRampToValueAtTime(
    1,
    audioContext.currentTime + fadeDuration
  );
  // this feels dodge, but we really only want one track playing at a time, other than fades
  currentlyPlaying = graph;
}

function fadeOut(graph: Graph, fadeDuration: number = 0) {
  const audioContext = graph.gain.context;
  const endTime = audioContext.currentTime + fadeDuration;
  graph.gain.gain.setValueAtTime(1, audioContext.currentTime);
  graph.gain.gain.linearRampToValueAtTime(0, endTime);
  graph.stop(endTime);
}

function crossFade(
  graphCurrent: Graph | null,
  graphNext: Graph | null,
  crossfadeDuration: number = 0,
  offset?: number,
) {
  if (graphNext) {
    fadeIn(graphNext, crossfadeDuration, offset);
  } else {
    console.log('crossFade called but graphNext is null');
  }
  if (graphCurrent) {
    fadeOut(graphCurrent, crossfadeDuration);
  }
}

// readDurationFromMetadata reads a media file's duration from its metadata, without decoding the whole file.
// Resolves NaN if the duration can't be read.
function readDurationFromMetadata(file: File): Promise<number> {
  return new Promise<number>((resolve) => {
    const el = document.createElement(
      getFileExtension(file.name) === "mp4" ? "video" : "audio"
    );
    const url = URL.createObjectURL(file);
    const done = (duration: number) => {
      el.removeAttribute("src");
      el.load();
      URL.revokeObjectURL(url);
      resolve(duration);
    };
    el.preload = "metadata";
    el.onloadedmetadata = () => done(el.duration);
    el.onerror = () => done(NaN);
    el.src = url;
  });
}

// mediaFileDuration returns the duration of an audio or video file as a timestamp string.
async function mediaFileDuration(file: File): Promise<string> {
  if (!file) {
    throw new Error('file not provided')
  }
  let seconds = await readDurationFromMetadata(file);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    // some files (eg variable bitrate mp3s without a length header) have no usable metadata duration
    seconds = (await loadAudioFromFile(file)).duration;
  }
  return formatSecondsToTimestamp(seconds);
}

// function playNext() {
//   // currentFileIndex is null first time round as there is nothing to crossfade from
//   if (currentFileIndex === null) {
//     currentFileIndex = 0;
//     fadeIn(filesList[currentFileIndex], 0);
//   } else {
//     const prevFileIndex = currentFileIndex;
//     currentFileIndex = (currentFileIndex + 1) % filesList.length;
//     crossFade(filesList[prevFileIndex], filesList[currentFileIndex]);
//   }
// }

// function loadFiles(files: File[]) {
//   filesList = files.map(loadAudioFromFileAndConnectSourceNode);
// }
//
// function playAll(files: File[]) {
//   loadFiles(files);
//   console.log(filesList.map(x=>x.name))
//   playNext();
//   setTimeout(playNext, 3000);
// }
//
export {
  getAudioContext,
  fadeIn,
  fadeOut,
  loadAudioFromFile,
  crossFade,
  connectAudioGraph,
  connectMediaElementGraph,
  getCurrentlyPlaying,
  mediaFileDuration,
  pauseAudioContext,
  resumeAudioContext,
};
