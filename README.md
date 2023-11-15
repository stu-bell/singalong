Sing-along/karaoke app for playing local mp3 files and displaying lyrics from local .txt or .lrc files

# TODO

- lrc offset: lrcFile.ts seekTimestamp
- last song plays on repeat? we probably want to stop at the end of the set? Or you could just put a .txt file thank you?
- offline usage with service worker
- bug when scroll backwards, list items disappear from the bottom

# Dev

1. `npm install`
1. `npm run dev` 

# Deploy to github pages

1. Update base repository url in `vite.config.js`
1. `npm run deploy`

# Build (for running locally or deploying elsewhere)

1. `npm run build`