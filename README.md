Sing-along/karaoke app for playing local mp3 files and displaying lyrics from local .txt or .lrc files

Specification: ./spec/_spec.md

high level feature/bugs list: ./TODO.md

# Dev

Install [mise](https://mise.jdx.dev/). 

`mise run dev`

See ./mise.toml for tasks

# Deploy to github pages

1. Update base repository url in `vite.config.js`
1. `npm run deploy`

Project will be built, the dist folder renamed as `singalong`, which is deployed to Github pages.
If you encounter a permission denied error during the mv step, check you're not running any dev servers that are locking that folder.

# Build (for running locally or deploying elsewhere)

1. `npm run build`

Build is output to the `singalong` folder. If using a local server, run from the parent folder of the singalong folder and navigate to the path `/singalong` in the browser.
