
function playAudioFile(file:File|undefined) {
    if (!file){
        console.error('Audio file undefined')
        return;
    }
    let fileUrl = URL.createObjectURL(file);
    const audio = document.createElement('audio');
    audio.src = fileUrl;
    document.body.appendChild(audio);
    audio.play();
    // URL.revokeObjectURL(fileUrl)
}

export { playAudioFile }