---
status: done
---
background: preview lyrics allow the audience to read the upcoming lyrics ahead of time. the next lyrics are loaded as preview lines irrespective of how far in the future they come. during long instrumental sections, this is odd. 

Change: don't add new lines to the preview list until the next timestamp is less than 2 seconds away. If the subsequent preview lines are less than 2 seconds away, add all preview lines together (so that a group of preview lines appear together, rather than staggered). 

If user presses next and no preview lines are visible, cancel the timeout and display the preview line. 

