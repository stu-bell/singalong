import { formatSecondsToTimestamp } from "./lrcFile";

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

async function audioFileDuration(file: File): Promise<string> {
  if (file) {
    return formatSecondsToTimestamp((await loadAudioFromFile(file)).duration)
  } else {
    throw new Error('file not provided')
  }
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
  audioFileDuration,
  pauseAudioContext,
  resumeAudioContext,
};
