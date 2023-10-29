Display lyrics for songs so you can sing along. 

Lyrics must be saved in a local folder as plain text files

# Usage

Choose a folder of .txt files and .lrc files.

.lrc files with timestamps will play automatically, otherwise use arrow keys. 

Optionally save a file in the same folder named `_lyrics.playlist.txt`. This file should contain the file names of the other files in the folder (one filename per row), in the sequence you want them to be displayed. The playlist will be displayed first. 

Keyboard commands:

- Down/Right/Space: Next Line
- Up/Left: Previous Line
- N: Next Song
- P: Previous Song
- H: Hide/show lyrics
- 0: Reset the auto scroll timer for the current line back to 0

# TODO

- instructions to home page (hide after file load)
- load mp3
- playlist.csv file that matches mp3 to play with lyrics (and download sample playlist.csv)
- next song quick fades mp3 into next
- prev song quick fades mp3 to previous
- playlist file to include times for auto start/end

# Dev

1. `npm install`
1. `npm run dev`

# Deploy to github pages

1. Update base repository url in `vite.config.js`
1. `npm run deploy`