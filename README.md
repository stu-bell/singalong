Karoake/Singalong app for playing local mp3 files and displaying lyrics from local .txt or .lrc files

# TODO

- Not auto starting scrolling, or auto fading to next song
- update home page html instructions
- _playlist.tsv instead of json, and sample download
- zoom in/out events scale width and size of text
- playlist file to include times for auto start/end
- up/left Resets auto scroll timer for current line. Pressing twice moves to the previous line
- offline usage with service worker

# Dev

1. `npm install`
1. `npm run dev` 

# Deploy to github pages

1. Update base repository url in `vite.config.js`
1. `npm run deploy`

# Build (for running locally or deploying elsewhere)

1. `npm run build`