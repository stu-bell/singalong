let audioCtx = new (window.AudioContext)(); // || window.webkitAudioContext)();
let source1: AudioBufferSourceNode | null = null, 
    source2: AudioBufferSourceNode | null = null;
let gainNode1: GainNode = audioCtx.createGain();
let gainNode2: GainNode = audioCtx.createGain();
// let crossfadeControl = document.querySelector<HTMLInputElement>("#crossfadeControl");
let filesList: File[]; // populate this with your FileList from an input
let currentFileIndex = 0;

function crossfadeAudioFile(file: File) {

    if (source1) {
        // If there's a song already playing, we will crossfade it with the new one
        [source1, source2] = [source2, source1];
        [gainNode1, gainNode2] = [gainNode2, gainNode1];
    } else {
        // If there's no song playing, just setup the first source node
        source1 = audioCtx.createBufferSource();
        source1.connect(gainNode1);
        gainNode1.connect(audioCtx.destination);
    }

    let reader = new FileReader();
    reader.onload = function(e) {
        if (!e.target) {
            return;
        }
        audioCtx.decodeAudioData(e.target.result as ArrayBuffer, (buffer: AudioBuffer) => {
            source2 = audioCtx.createBufferSource();
            source2.buffer = buffer; 
            source2.connect(gainNode2);
            gainNode2.connect(audioCtx.destination); 

            source1!.start(0);
            source2.start(0);

            source2.onended = () => playNext();
        });
    };
    reader.readAsArrayBuffer(file);

    // crossfadeControl!.addEventListener("input", function(evt) {
    // TODO: what does x do?
        let x = 5 // parseFloat(this.value);
        // Use an equal-power crossfading curve:
        let gain1 = Math.cos(x * 0.5*Math.PI);
        let gain2 = Math.cos((1.0 - x) * 0.5*Math.PI);

        gainNode1.gain.value = gain1;
        gainNode2.gain.value = gain2;
    // });

}

function playNext() {
    currentFileIndex = (currentFileIndex + 1) % filesList.length;
    console.log('current: ', filesList[currentFileIndex])
    crossfadeAudioFile(filesList[currentFileIndex]);
}

function playFiles(files:File[]) {
    filesList = files;
    console.log(filesList)
    playNext();
    setTimeout(playNext, 10 * 1000);
}

export { playFiles }