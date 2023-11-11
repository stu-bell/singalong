Display lyrics for songs so you can sing along

Lyrics must be saved in a local folder as plain text files

# TODO

- load mp3 - look for the same filename as the lyrics file
- prev/curr/next buffer
- next song loads and quick fades mp3 into next. update prev/curr/next
- prev song loads and quick fades mp3 to previous. update prev/curr/next
- playlist.json file that matches mp3 to play with lyrics (and download sample playlist.csv)
- playlist.forEach(findFile(fileslist)). alert missing files in playlist. Ignore pfiles not there
- playlist file to include times for auto start/end

- zoom in/out events scale width and size of text
- offline usage with service worker
- playlist.csv instead of json

# Dev

1. `npm install`
1. `npm run dev`

# Deploy to github pages

1. Update base repository url in `vite.config.js`
1. `npm run deploy`