let audioCtx: AudioContext = new window.AudioContext(); // || window.webkitAudioContext)();
let source1: AudioBufferSourceNode | null = null,
  source2: AudioBufferSourceNode | null = null;
let gainNode1: GainNode = audioCtx.createGain();
let gainNode2: GainNode = audioCtx.createGain();
// let crossfadeControl = document.querySelector<HTMLInputElement>("#crossfadeControl");
let filesList: File[]; // populate this with your FileList from an input
let currentFileIndex = 0;

let timeoutId: number | null = null;

function crossfadeAudioFile(file: File) {
  let crossfadeDuration = 5; // Crossfade duration in seconds

  if (source1) {
    source1.stop(audioCtx.currentTime + crossfadeDuration);
    source1 = source2;

    source2 = audioCtx.createBufferSource();
    source2!.connect(gainNode2);
    gainNode2!.connect(audioCtx.destination);
  } else {
    source1 = audioCtx.createBufferSource();
    source1!.connect(gainNode1);
    gainNode1!.connect(audioCtx.destination);
  }

  let reader = new FileReader();
  reader.onload = function (e) {
    if (!e.target) {
      console.error("No event target!");
      return;
    }
    audioCtx.decodeAudioData(
      e.target!.result as ArrayBuffer,
      (buffer: AudioBuffer) => {
        if (source2) {
          source2.buffer = buffer;
          source2!.start(0);

          gainNode1.gain.setValueAtTime(1, audioCtx.currentTime);
          gainNode1.gain.linearRampToValueAtTime(
            0,
            audioCtx.currentTime + crossfadeDuration
          );

          gainNode2.gain.setValueAtTime(0, audioCtx.currentTime);
          gainNode2.gain.linearRampToValueAtTime(
            1,
            audioCtx.currentTime + crossfadeDuration
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
  let crossfadeDuration = 5; // Crossfade duration in seconds

  // Creating the first source
  source1 = audioCtx.createBufferSource();
  source1!.connect(gainNode1);
  gainNode1!.connect(audioCtx.destination);

  let reader1 = new FileReader();
  reader1.onload = function (e) {
    audioCtx.decodeAudioData(
      e.target!.result as ArrayBuffer,
      (buffer: AudioBuffer) => {
        source1!.buffer = buffer;
        source1!.start(0);

        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }

        let trackDuration = buffer.duration;
        timeoutId = setTimeout(() => {
          // Creating the second source to crossfade when the first is near the end
          source2 = audioCtx.createBufferSource();
          source2!.connect(gainNode2);
          gainNode2!.connect(audioCtx.destination);

          let reader2 = new FileReader();
          reader2.onload = function (e) {
            audioCtx.decodeAudioData(
              e.target!.result as ArrayBuffer,
              (buffer: AudioBuffer) => {
                source2!.buffer = buffer;
                source2!.start(audioCtx.currentTime);

                gainNode1.gain.setValueAtTime(1, audioCtx.currentTime);
                gainNode1.gain.linearRampToValueAtTime(
                  0,
                  audioCtx.currentTime + crossfadeDuration
                );

                gainNode2.gain.setValueAtTime(0, audioCtx.currentTime);
                gainNode2.gain.linearRampToValueAtTime(
                  1,
                  audioCtx.currentTime + crossfadeDuration
                );
              }
            );
          };
          reader2.readAsArrayBuffer(file2);
        }, (trackDuration - crossfadeDuration) * 1000);
      }
    );
  };
  reader1.readAsArrayBuffer(file1);
}

function playOne(file: File) {
  console.log("playone", file.name);
  let audioCtx = new AudioContext();
  source2 = audioCtx.createBufferSource();
  let reader2 = new FileReader();
  reader2.onload = function (e) {
    audioCtx.decodeAudioData(
      e.target!.result as ArrayBuffer,
      (buffer: AudioBuffer) => {
        source2!.buffer = buffer;
        source2!.start(audioCtx.currentTime);

        // gainNode1.gain.setValueAtTime(1, audioCtx.currentTime);
        // gainNode1.gain.linearRampToValueAtTime(0, audioCtx.currentTime + crossfadeDuration);
        //
        // gainNode2.gain.setValueAtTime(0, audioCtx.currentTime);
        // gainNode2.gain.linearRampToValueAtTime(1, audioCtx.currentTime + crossfadeDuration);
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

export { loadFiles, playAll, playOne, playNext, crossfadeAudioFile2 };
