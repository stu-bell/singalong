let source1: AudioBufferSourceNode, source2: AudioBufferSourceNode;
let gainNode1: GainNode; //= acx.createGain();
let gainNode2: GainNode; //= acx.createGain();
// let crossfadeControl = document.querySelector<HTMLInputElement>("#crossfadeControl");
let filesList: graph[]; // populate this with your FileList from an input
let currentFileIndex: number | null = null;

let timeoutId: number | null = null;

type graph = {
  source: AudioBufferSourceNode;
  gain: GainNode;
  name: string;
};

let acx: AudioContext;
function getAudioContext() {
  if (!acx) {
    acx = new window.AudioContext(); // || window.webkitAudioContext)();
  }
  return acx;
}

function loadAudioFromFile(file: File) {
  const audioContext = getAudioContext();
  const sourceNode = audioContext.createBufferSource();
  const reader = new FileReader();
  reader.onload = function (event) {
    audioContext.decodeAudioData(
      event.target!.result as ArrayBuffer,
      (buffer) => {
        sourceNode.buffer = buffer as AudioBuffer;
      }
    );
  };
  reader.onerror = (event) => {
    "Error reading file: " + event.target!.error?.message;
  };
  reader.readAsArrayBuffer(file);
  return {
    source: sourceNode,
    gain: connectGain(sourceNode),
    name: file.name,
  } as graph;
}

function connectGain(source: AudioBufferSourceNode) {
  const audioContext = source.context;
  const gain = audioContext.createGain();
  source.connect(gain);
  gain.connect(audioContext.destination);
  return gain;
}

function fadeIn(
  graph: graph,
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
}

function fadeOut(graph: graph, fadeDuration: number = 0) {
  const audioContext = graph.source.context;
  const endTime = audioContext.currentTime + fadeDuration;
  graph.gain.gain.setValueAtTime(1, audioContext.currentTime);
  graph.gain.gain.linearRampToValueAtTime(0, endTime);
  graph.source.stop(endTime);
  // TODO: do we need to get rid of the source/buffer?
}

function crossFade(
  graphCurrent: graph,
  graphNext: graph,
  crossfadeDuration: number = 1,
  offset?: number,
  duration?: number
) {
  // undefined => start fadeIn at current time
  fadeIn(graphNext, crossfadeDuration, undefined, offset, duration);
  fadeOut(graphCurrent, crossfadeDuration);
}

function playNext() {
  // currentFileIndex is null first time round as there is nothing to crossfade from
  if (currentFileIndex === null) {
    currentFileIndex = 0;
    fadeIn(filesList[currentFileIndex], 0);
  } else {
    const prevFileIndex = currentFileIndex;
    currentFileIndex = (currentFileIndex + 1) % filesList.length;
    crossFade(filesList[prevFileIndex], filesList[currentFileIndex]);
  }
}

function loadFiles(files: File[]) {
  filesList = files.map(loadAudioFromFile);
}

function playAll(files: File[]) {
  loadFiles(files);
  console.log(filesList.map(x=>x.name))
  playNext();
  setTimeout(playNext, 3000);
}

export {
  fadeIn,
  fadeOut,
  loadAudioFromFile,
  crossFade,
  loadFiles,
  playAll,
  playNext,
};
