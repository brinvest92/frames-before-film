# Frames Before Film: the website

A course, a prompt library and a showcase in one static site.

- **Learn:** six lessons with quizzes, a brief builder, and progress saved in the visitor's browser.
- **Library:** 42 prompt cards. Each prompt has blanks to fill in and a copy button, and shows the output it produced.
- **Showcase:** every film, still, loop and live demo, each linked to the prompt that made it.
- **Credits:** who made the sounds, and what is invented.

There is nothing to install. The site is plain HTML, CSS and JavaScript, built by one script with no dependencies.

## Preview it on your computer

You need Node.js 18 or newer.

```
cd website
npm run dev
```

Then open http://localhost:4173. Run the command again after any change.

## Put it on GitHub

Create an empty repository on github.com first (do not add a README there). Then, inside this `website` folder:

```
git init
git add .
git commit -m "Frames Before Film site"
git branch -M main
git remote add origin https://github.com/YOUR-NAME/YOUR-REPO.git
git push -u origin main
```

The whole repository is about 60 MB. The largest single file is about 4 MB, far under GitHub's 100 MB limit per file, so
Git LFS is not needed.

## Deploy it on Vercel

1. On vercel.com choose **Add New > Project** and import the repository.
2. Change nothing. `vercel.json` already tells Vercel to run `node build.mjs` and serve the `dist` folder.
3. Press **Deploy**.

Every later `git push` redeploys the site.

After the first deploy, put the site's address in `site.config.mjs` (`url`), then commit and push. That switches on the
link-preview image and the sitemap.

## Change things

| To change | Edit |
|---|---|
| Name, tagline, links, the footer note | `site.config.mjs` |
| Whether prompts are shown in full | `promptMode` in `site.config.mjs` (see below) |
| Lesson titles and quiz questions | `content/course.mjs` |
| Colours, type, layout | `src/styles.css` |
| Behaviour (filters, blanks, quizzes) | `src/app.js` |
| Page structure and wording | `build.mjs` |

### Show every prompt, or only a taste

`promptMode: 'full'` publishes every prompt. `promptMode: 'teaser'` shows only the opening of each prompt, with a button
that leads to `buyUrl`. Cards listed in `freeCards` stay open as free samples.

On Vercel you can also switch without editing a file: add an environment variable `PROMPT_MODE` with the value `teaser`.

**Keep the repository private if you use teaser mode.** `content/manual.json` holds every prompt in full, whatever the
site shows.

## Refresh the content

The site does not read the studio workspace. It reads two snapshots that are stored in this repository:

- `content/manual.json`: the manual's cards, levels, looks and lines
- `content/media.json`: which films, images and files belong to which card

To refresh them after the manual or the projects change, on the computer that has the workspace:

```
node ../playbook/pro/build-pro.mjs
npm run sync
npm run build
```

`npm run sync` needs FFmpeg. It re-encodes the films small for the web (720 pixels on the short side), strips their
metadata, and writes everything under `static/media/`.

## What is published, and what is not

- **Films are small copies**, not the delivered masters.
- **Some films are shown without their music, or silent.** Their tunes came from a catalogue that gives no licence text.
  Each of those films says so under its player, and `tools/sync.mjs` lists them.
- **The routine film is a 68-second cut.** The parts of the full film that show children's names are left out. To change
  the cut, edit the `cuts` of `routine` in `tools/sync.mjs`.
- **Sound credits** are on the Credits page, from `content/credits.json`.
- **Nothing is tracked.** There are no cookies, no analytics and no outside requests. What a visitor types or ticks stays
  in their own browser.

## Folders

```
site.config.mjs     settings
build.mjs           builds dist/ from the folders below
content/            manual.json, media.json, course.mjs, credits.json
src/                styles.css, app.js
static/             fonts, films, images, downloads, live demos (copied to dist/ as they are)
tools/              sync.mjs (refresh content), serve.mjs (local preview), capture-before.mjs (one-off)
vercel.json         build settings for Vercel
dist/               the built site (not stored in Git)
```
