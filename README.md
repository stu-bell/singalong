Sing-along/karaoke app for playing local mp3 files and displaying lyrics from local .txt or .lrc files

# TODO

- offline usage with service worker
- resizable window for lyrics. show  preview on home screen? - see drag.html
- bug when scroll backwards, list items disappear from the bottom
- offset should be to align lrc file with beginning of your audio. should it just offset based on audio start?

# Dev

1. `npm install`
1. `npm run dev` 

# Deploy to github pages

1. Update base repository url in `vite.config.js`
1. `npm run deploy`

# Build (for running locally or deploying elsewhere)

1. `npm run build`
