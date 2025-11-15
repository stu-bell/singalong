import { nextSong, prevSong, pauseSong, resumeSong } from "./player";

let audio: HTMLAudioElement;

export function initMediaSession() {
    audio = document.createElement('audio');
    audio.src = 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA==';
    audio.loop = true;
    audio.volume = 0;
    document.body.appendChild(audio);


    navigator.mediaSession.setActionHandler('play', () => {
        console.log('> User clicked "Play"');
        resumeSong();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
        console.log('> User clicked "Pause"');
        pauseSong();
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
        console.log('> User clicked "Previous Track"');
        prevSong();
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
        console.log('> User clicked "Next Track"');
        nextSong();
    });

    audio.controls = false;
}

export function playSilentAudio() {
    audio.play().catch(error => console.error("playSilentAudio failed", error));
}

export function pauseSilentAudio() {
    audio.pause();
}

export function updateMediaSession() {
    if (!navigator.mediaSession) {
        console.warn("MediaSession API not supported.");
        return;
    }

    const metadata: MediaMetadataInit = {
        title: 'Singalong',
        artist: 'You!',
        album: 'siiiiiinnnng',
    };

    navigator.mediaSession.metadata = new MediaMetadata(metadata);
}
