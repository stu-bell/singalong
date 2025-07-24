Sing-along/karaoke app for playing local mp3 files and displaying lyrics from local .txt or .lrc files

# TODO

## Next
- don't show text on screen until next timestamp is only a few seconds away (so no text shown during instrumentals)
- plane rotation for scenarios where projector isn't in line with projector screen? toggle a slider on the X and Y axis to tilt the plan of the lyrics container?? Could show the sliders when in resize mode
- offline usage with service worker

## bugs
- first line being promoted too soon? Maybe add a blank line 0 timestamp to teh beginning of each lines array?`
- next/prev song commands jump to the start of the song - not the offset time??
- bug when scroll backwards, list items disappear from the bottom. lyrics.ts forwards/backwards?
- empty lines at the top of the screen should be large height - what about replacing with a space?

## Later
- album cover. Column for album cover art. Column for time to display album in song, and duration (default to 2s?)
- background gif on loop. Lyrics should have a fading border around them in case they overlap the background?
- search feature for searching lyrics in a folder, when accompanying live music on request
- background gif. If lyrics are wide, they might overlay a background and not be clearly visible - put a translucent background over lyrics? _background.gif in the playlist folder? Should stay within the container, if resized - resizing is for aligning on a projector
- pause audio/lrc?
- touch controls? single tap moves forwards. What about double tap to move back? Or swipe? Or maybe just tap left / right halves of the screen to go back /forwards (probably easiest to implement)? What about preventing accidental touches if using the device wirelessly (some kind of tap/long press to enable touch controls, subtle visual cue needed to show touch controls active...)?
- Wouldn't work as static pwa, but could you serve lyrics over a local network hotspot, for use at festivals where people bring their own phones? Need to figure out hotspot limits, and how to sync lyrics timing. Useful if you have no projector/screen
- reading track lengths when creating initial playlist file requires loading audio buffers and happens in sequence (?), so takes ages 

# Dev

Requires [node.js](https://nodejs.org)

1. `npm install`
1. `npm run dev` 

# Deploy to github pages

1. Update base repository url in `vite.config.js`
1. `npm run deploy`

Project will be built, the dist folder renamed as `singalong`, which is deployed to Github pages.
If you encounter a permission denied error during the mv step, check you're not running any dev servers that are locking that folder.

# Build (for running locally or deploying elsewhere)

1. `npm run build`

Build is output to the `singalong` folder. If using a local server, run from the parent folder of the singalong folder and navigate to the path `/singalong` in the browser.
