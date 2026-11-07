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

type Graph = {
  source: AudioBufferSourceNode;
  gain: GainNode;
};

async function loadAudioFromFile(file: File): Promise<AudioBuffer> {
  const audioContext = getAudioContext();
  const arrayBuffer = await file.arrayBuffer();
  return new Promise<AudioBuffer>((resolve, reject) => {
    audioContext.decodeAudioData(arrayBuffer, resolve, reject);
  });
}

function connectSource(buffer:AudioBuffer):AudioBufferSourceNode{
  const audioContext = getAudioContext();
  const sourceNode = audioContext.createBufferSource();
  sourceNode.buffer = buffer;
  return sourceNode
}

function connectGain(source: AudioBufferSourceNode) {
  const audioContext = source.context;
  const gain = audioContext.createGain();
  source.connect(gain);
  gain.connect(audioContext.destination);
  return gain;
}

function connectAudioGraph(buffer:AudioBuffer):Graph {
  const source = connectSource(buffer);
  return {
    source,
    gain: connectGain(source)
  }
}

function fadeIn(
  graph: Graph,
  fadeDuration: number = 0,
  when?: number | undefined,
  offset?: number | undefined,
  duration?: number | undefined
) {
  const audioContext = graph.source.context;
  graph.source.start(when, offset, duration);
  graph.gain.gain.setValueAtTime(0, audioContext.currentTime);
  graph.gain.gain.linearRampToValueAtTime(
    1,
    audioContext.currentTime + fadeDuration
  );
  // this feels dodge, but we really only want one track playing at a time, other than fades
  currentlyPlaying = graph;
}

function fadeOut(graph: Graph, fadeDuration: number = 0) {
  const audioContext = graph.source.context;
  const endTime = audioContext.currentTime + fadeDuration;
  graph.gain.gain.setValueAtTime(1, audioContext.currentTime);
  graph.gain.gain.linearRampToValueAtTime(0, endTime);
  graph.source.stop(endTime);
  // TODO: do we need to get rid of the source/buffer?
}

function crossFade(
  graphCurrent: Graph | null,
  graphNext: Graph | null,
  crossfadeDuration: number = 0,
  offset?: number,
  duration?: number // duration for starting the next track
) {
  if (graphNext) { 
    // undefined => start fadeIn at current time
    fadeIn(graphNext, crossfadeDuration, undefined, offset, duration);
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
  fadeIn,
  fadeOut,
  loadAudioFromFile,
  crossFade,
  connectAudioGraph,
  getCurrentlyPlaying,
  mediaFileDuration,
  pauseAudioContext,
  resumeAudioContext,
};
