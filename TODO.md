
# TODO

## Next
1. video support
2. resize screen - all four corners of the resize area should be draggable, so that as well as resizing, we can use with a projector, we can project at a non-perpendicular angle if necessary.
3. don't show text on screen until next timestamp is only a 2 seconds away (so no text shown during instrumentals). Blank lines already move highlight off the current line. Multiple consecutive timestamps with blank lines display the next line, but also control when preview lines come on screen.  
  - This is confusing - preview lines should be shown all together, or none at all? Test by playing with timestamps with no lyrics in an lrc file. 5x lines with no text but the same timestamp can give you the desired result. How does the user choose how far in advance preview lines should be shown if there's a long instrumental gap, if you bake this functionality in? Could build it so that user press next line to display the preview lines, if none are visible?
  - to achieve this you'd need to calculate the time to the next line to add to the preview, and if greater than a threshold, set a timeout for when it should be added to preview
  - if user presses next and no preview lines are visible, cancel the timeout and display the preview line


## bugs
- home scroll broken (make modal)?
- media controls play/resume broken
- svg arrows for resize
- .txt files not rendering? do they require audio?
- bug when scroll backwards, list items disappear from the bottom. lyrics.ts forwards/backwards?
- empty lines at the top of the screen should be large height - what about replacing with a space?
- playlist validation errors (missing/duplicate/unsupported files, see MED-1, MED-6) only go to the console. Implement an on-screen message toast. Be careful not to disrupt the show: show messages before play starts, or discreetly on screen during play (no alerts/modals mid-show)

## Later
- touch controls - double tap for touch activation should be longer
- request screen wake lock https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API
- black background for area outside of resize container? 


- album cover. Column for album cover art. Column for time to display album in song, and duration (default to 2s?)
- background gif on loop. Lyrics should have a fading border around them in case they overlap the background?
- background gif. If lyrics are wide, they might overlay a background and not be clearly visible - put a translucent background over lyrics? _background.gif in the playlist folder? Should stay within the container, if resized - resizing is for aligning on a projector
- offline usage with service worker
- separate fade out and fade in durations? You want an overlap, but sometimes you want to fade out a song slowly, then bring the next one in with a steeper ramp? Ie fade out duration, time from end to start next track, fade in duration (fade in duration will be associated with the next track)? eg fade out 2s from end, start next track 1s from end, with a fade in of 0.5s?
- plane rotation for scenarios where projector isn't in line with projector screen? toggle a slider on the X and Y axis to tilt the plan of the lyrics container?? Could show the sliders when in resize mode
- pause audio/lrc?
- reading track lengths when creating initial playlist file requires loading audio buffers and happens in sequence (?), so takes ages
- touch controls? single tap moves forwards. What about double tap to move back? Or swipe? Or maybe just tap left / right halves of the screen to go back /forwards (probably easiest to implement)? although a usb presentation is a work around
- prevent accidental touches if using a touch screen (some kind of tap/long press to enable touch controls, subtle visual cue needed to show touch controls active...)?
- search feature for searching lyrics in a folder, when accompanying live music on request
- Wouldn't work as static pwa, but could you serve lyrics over a local network hotspot, for use at festivals where people bring their own phones? Need to figure out hotspot limits, and how to sync lyrics timing. Useful if you have no projector/screen
- split long ?
  - but then the user won't know until runtime that lines are being split?
  - is there a way to detect this and split into multiple lines, timestamps spread evenly between now and the next line?
  - could start just based on average character length? split at the last space before the character limit, then check the next line's length
  - https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript



