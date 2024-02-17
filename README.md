Sing-along/karaoke app for playing local mp3 files and displaying lyrics from local .txt or .lrc files

# TODO

- offline usage with service worker
- resizable window for lyrics - see drag.html - show and enable drag/resize on keyboard shortcut? 
- sync the start and end of lrc files with the start and end of the audio (ie remove lines before the audio start time, and after the audio end time)
- in the sample _playlist.tsv downloaded, add 0 as the start time and the end as the duration of the track
- pause audio/lrc?
- bug when scroll backwards, list items disappear from the bottom

# Dev

Requires [node.js](https://nodejs.org)

1. `npm install`
1. `npm run dev` 

# Deploy to github pages

1. Update base repository url in `vite.config.js`
1. `npm run deploy`

# Build (for running locally or deploying elsewhere)

1. `npm run build`
