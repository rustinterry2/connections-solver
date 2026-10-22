# Connections Helper (Web Version 2)

A mobile-first browser version of the current **Connections Helper** Pyto app, by Rustin Terry.

## Open the web app

**https://rustinterry2.github.io/connections-solver/**

If GitHub Pages is enabled for the repository's `main` branch and root folder, the site updates automatically when `index.html`, `styles.css`, or `app.js` changes.

## Features

- Enter the final eight unsolved words in a two-column grid.
- **Generate Options** creates the 35 unique four-word pairings (4 + 4).
- Once generated, the eight input fields become tappable word tiles. Tap tiles to highlight corresponding words in solution rows.
- **Clear** removes highlights only, without changing the number of solutions.
- **⇄ Swap** toggles which complementary four-word group is displayed.
- Tap a numbered solution card to select that guess. Use **Correct**, **1 Away**, or **2 Away** to narrow possible partitions.
- **Edit** restores the original eight words for changes.
- **Undo feedback** restores the previous possibilities.
- **Upload Words** immediately opens the browser's native image picker. Screenshot recognition runs afterward.
- **Paste** reads a copied image where the browser supports image clipboard access and permission is granted.

## Screenshot recognition

The browser version uses [Tesseract.js](https://github.com/naptha/tesseract.js), which downloads its OCR library and models on first use, then recognizes the screenshot locally in the browser. OCR requires an internet connection for that download. Unlike the Pyto app, browser OCR does **not** use native Apple Vision and may be slower.

A screenshot cropped to the final eight word tiles (two rows of four) generally works best. If OCR recognizes more or fewer than eight items, the app displays a review dialog to choose the correct eight. Review spelling, especially for unfamiliar words.

On iOS, image pasting is browser- and permission-dependent. Use Upload Words if Paste is unavailable. No game progress is saved to a server.

## Repository files

- `index.html`: web app markup and mobile-friendly layout
- `styles.css`: iPhone-like card, tile and button styling
- `app.js`: solver engine, UI interactions, clipboard/file import, and OCR
- `connections_solver.py`: original Python/Pyto version, preserved

## How the solver works

There are 70 unique four-word selections from eight words. Because each group and its four-word complement represent the same partition, there are **35** possible partitions.

When a guess has an overlap of 0 or 4 with a candidate partition group, the guess is correct. Overlap of 1 or 3 gives *1 Away*. Overlap of 2 gives *2 Away*. The browser displays just one side of each partition at a time but keeps both groups for feedback calculations.

## Development

The site is plain HTML, CSS, and JavaScript: no build step is required. GitHub Pages can serve all three files directly from the root of the `main` branch.
