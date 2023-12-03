Sing-along/karaoke app for playing local mp3 files and displaying lyrics from local .txt or .lrc files

# TODO

- offline usage with service worker
- m4a and other music formats filter
- n and p keys are dangerously close to space and 0
- previous line/song should take you back to start of current line/song, then press again to move to previous line/song 
- last song plays on repeat? we probably want to stop at the end of the set? Or you could just put a .txt file thank you?
- bug when scroll backwards, list items disappear from the bottom
- resizable window for lyrics. show a preview on home screen?
- bug with lyrics offset? offset should be to align lrc file with beginning of your audio. should it just offset based on audio start?
- smooth transition of lyrics from one song to next (or just hide lyrics that are going to be skipped?)

- does it work with a slideshow remote?

# Dev

1. `npm install`
1. `npm run dev` 

# Deploy to github pages

1. Update base repository url in `vite.config.js`
1. `npm run deploy`

# Build (for running locally or deploying elsewhere)

1. `npm run build`
