let context = new AudioContext();
let gainNode = context.createGain();
let sourceNode:any;
let duration = 2; 
let fadeOutInterval:any;
let fadeInInterval:any;


audio.addEventListener('ended', function(evt){
    clearInterval(fadeOutInterval);
    gainNode.gain.cancelScheduledValues(context.currentTime);
    gainNode.gain.value = 1.0;
    currentFile++;
    if (currentFile &gt;= files.length) {
        console.log("All audio files have been played.");
    } else {
        playAudioFile();
    }
});

function playAudioFile() {
    if(sourceNode) {
        fadeOut();
        setTimeout(() => {
            sourceNode.stop();
            fadeIn();
            startNewSource();
        }, duration * 1000);
    }
    else {
        startNewSource();
    }
}

function startNewSource() {
    let fileUrl = URL.createObjectURL(files[currentFile]);
    sourceNode = context.createBufferSource();
    sourceNode.connect(gainNode);
    gainNode.connect(context.destination);
    fetch(fileUrl)
        .then(response => response.arrayBuffer())
        .then(buffer => context.decodeAudioData(buffer))
        .then(decodedData => {
            sourceNode.buffer = decodedData;
            sourceNode.start();
            fadeIn();
        });
}

function fadeOut() {
    let step = 1.0 / (duration * 60);  
    let volume = 1.0;
    fadeOutInterval = setInterval(function() {
        if(volume > 0.0) {
            volume -= step;
            gainNode.gain.value = volume;
        }
        else {
            clearInterval(fadeOutInterval);
        }
    }, 1000 / 60);
}

function fadeIn() {
    gainNode.gain.value = 0.0;
    let step = 1.0 / (duration * 60);  
    let volume = 0.0;
    fadeInInterval = setInterval(function() {
        if(volume < 1.0) {
            volume += step;
            gainNode.gain.value = volume;
        }
        else {
            clearInterval(fadeInInterval);
        }
    }, 1000 / 60);
}


export {playAudioFile}