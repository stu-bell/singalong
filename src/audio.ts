
let source1: AudioBufferSourceNode, source2: AudioBufferSourceNode;
let gainNode1: GainNode; //= acx.createGain();
let gainNode2: GainNode; //= acx.createGain();
// let crossfadeControl = document.querySelector<HTMLInputElement>("#crossfadeControl");
let filesList: File[]; // populate this with your FileList from an input
let currentFileIndex = 0;

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
    name: file.name
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
  console.log(graph.name)
  graph.source.start(when, offset, duration);
  graph.gain.gain.setValueAtTime(0, audioContext.currentTime);
  graph.gain.gain.exponentialRampToValueAtTime(
    1,
    audioContext.currentTime + fadeDuration
  );
}

function fadeOut(graph: graph, fadeDuration: number = 0) {
  const audioContext = graph.source.context;
  const endTime = audioContext.currentTime + fadeDuration;
  graph.gain.gain.linearRampToValueAtTime(0, endTime);
  graph.source.stop(endTime);
  // TODO: do we need to get rid of the source/buffer?
}

function crossFade(
  graph1: graph,
  graph2: graph,
  crossfadeDuration: number = 2,
  offset?: number,
  duration?: number
) {
  // undefined => start fadeIn at current time
  fadeIn(graph2, crossfadeDuration, undefined, offset, duration);
  fadeOut(graph1, crossfadeDuration);
}

function crossfadeAudioFile(file: File) {
  let crossfadeDuration = 2; // Crossfade duration in seconds

  if (!source1) {
    // set up source1
    source1 = acx.createBufferSource();
    source1!.connect(gainNode1);
    gainNode1!.connect(acx.destination);

    // WIP should we call crossfadeAudioFile again here?
  } else {
    // swap sources
    source1.stop(acx.currentTime + crossfadeDuration);
    source1 = source2;

    // reset source2 for new file
    source2 = acx.createBufferSource();
    source2!.connect(gainNode2);
    gainNode2!.connect(acx.destination);
  }

  let reader = new FileReader();
  reader.onload = function (e) {
    if (!e.target) {
      console.error("No event target!");
      return;
    }
    acx.decodeAudioData(
      e.target!.result as ArrayBuffer,
      (buffer: AudioBuffer) => {
        if (source2) {
          source2.buffer = buffer;
          source2!.start(0);

          gainNode1.gain.setValueAtTime(1, acx.currentTime);
          gainNode1.gain.linearRampToValueAtTime(
            0,
            acx.currentTime + crossfadeDuration
          );

          gainNode2.gain.setValueAtTime(0, acx.currentTime);
          gainNode2.gain.linearRampToValueAtTime(
            1,
            acx.currentTime + crossfadeDuration
          );

          if (timeoutId !== null) {
            clearTimeout(timeoutId); // Clear any existing timeout
          }

          let trackDuration = buffer.duration;
          timeoutId = setTimeout(
            playNext,
            (trackDuration - crossfadeDuration) * 1000
          );
        }
      }
    );
  };
  reader.readAsArrayBuffer(file);
}

function crossfadeAudioFile2(file1: File, file2: File) {
  console.log(file1.name);
  console.log(file2.name);
  let crossfadeDuration = 2; // Crossfade duration in seconds

  // Creating the first source
  source1 = acx.createBufferSource();
  source1!.connect(gainNode1);
  gainNode1!.connect(acx.destination);

  let reader1 = new FileReader();

  reader1.onload = function (e) {
    acx.decodeAudioData(
      e.target!.result as ArrayBuffer,
      (buffer: AudioBuffer) => {
        source1!.buffer = buffer;
        source1!.start(0);
        // trackDuration = buffer.duration;
      }
    );
  };
  reader1.readAsArrayBuffer(file1);

  if (timeoutId !== null) {
    clearTimeout(timeoutId);
  }

  timeoutId = setTimeout(() => {
    // Creating the second source to crossfade when the first is near the end
    source2 = acx.createBufferSource();
    source2!.connect(gainNode2);
    gainNode2!.connect(acx.destination);

    let reader2 = new FileReader();
    reader2.onload = function (e) {
      acx.decodeAudioData(
        e.target!.result as ArrayBuffer,
        (buffer: AudioBuffer) => {
          source2!.buffer = buffer;
          source2!.start(acx.currentTime);

          gainNode1.gain.setValueAtTime(1, acx.currentTime);
          gainNode1.gain.linearRampToValueAtTime(
            0,
            acx.currentTime + crossfadeDuration
          );

          gainNode2.gain.setValueAtTime(0, acx.currentTime);
          gainNode2.gain.linearRampToValueAtTime(
            1,
            acx.currentTime + crossfadeDuration
          );
        }
      );
    };
    reader2.readAsArrayBuffer(file2);
  }, 9 * 1000);
}

// error on source node: cannot call start more than once
function playOne(file: File) {
  console.log("playone", file.name);
  source2 = acx.createBufferSource();
  source2.connect(gainNode2);
  gainNode2.connect(acx.destination);
  let reader2 = new FileReader();
  reader2.onload = function (e) {
    acx.decodeAudioData(
      e.target!.result as ArrayBuffer,
      (buffer: AudioBuffer) => {
        source2!.buffer = buffer;
        source2!.start(0);
        // gainNode1.gain.setValueAtTime(1, acx.currentTime);
        // gainNode1.gain.linearRampToValueAtTime(0, acx.currentTime + crossfadeDuration);
        //
        // gainNode2.gain.setValueAtTime(0, acx.currentTime);
        // gainNode2.gain.linearRampToValueAtTime(1, acx.currentTime + crossfadeDuration);
      }
    );
  };
  reader2.readAsArrayBuffer(file);
}

function playNext() {
  currentFileIndex = (currentFileIndex + 1) % filesList.length;
  console.log("current: ", filesList[currentFileIndex].name);
  crossfadeAudioFile(filesList[currentFileIndex]);
}

function loadFiles(files: File[]) {
  filesList = files;
}

function playAll(files: File[]) {
  loadFiles(files);
  playNext();
  playNext();
}

export {
  fadeIn, fadeOut,
  loadAudioFromFile,
  crossFade,
  loadFiles,
  playAll,
  playOne,
  playNext,
  crossfadeAudioFile2,
};
