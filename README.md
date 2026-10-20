# Gu Fangzhou — Digital Exhibit

A two-page scroll-driven exhibit (title page → timeline) with a browser-based editor. No build step.

## Run locally
```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Edit content
1. Open `admin.html` (e.g. http://localhost:8000/admin.html).
2. Edit title-page text, add/reorder/delete timeline cards, set images (paths in `assets/` or upload).
3. **Preview** buttons show your unsaved draft. When happy, **Download content.js** and replace `js/content.js`.
4. Commit and push; GitHub Pages redeploys automatically.

You can also edit `js/content.js` by hand. Card images go in `assets/` (square-ish images look best).
Cards with an empty `source` show an "Unverified draft" tag; fill in the Source field and the tag disappears. Draft copy is placeholder text — verify and cite.

`js/data.js` just picks between the published content and the editor's `?draft` preview.

## Controls
Scroll / swipe / arrow keys advance the timeline; scrolling back from card 1 returns to the title page.
