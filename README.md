Sing-along/karaoke app for playing local mp3 files and displaying lyrics from local .txt or .lrc files

# TODO

- offline usage with service worker
- empty lines at the top of the screen should be large height
- resizable window for lyrics - see drag.html - show and enable drag/resize on keyboard shortcut? 
- sync the start and end of lrc files with the start and end of the audio (ie remove lines before the audio start time, and after the audio end time)
- in the sample _playlist.tsv downloaded, add 0 as the start time and the end as the duration of the track

- background gif on loop. Lyrics should have a fading border around them in case they overlap the background?
- sample playlist.tsv downloaded, try fuzzy matching lyrics and audio names?
- search feature for searching lyrics in a folder, when accompanying live music on request
- background gif. If lyrics are wide, they might overlay a background and not be clearly visible - put a translucent background over lyrics? _background.gif in the playlist folder? Should stay within the container, if resized - resizing is for aligning on a projector
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
