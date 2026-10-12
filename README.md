# Connections Solver

A mobile-friendly **web version** of the [original Python Connections Solver](./connections_solver.py), designed to narrow down the final eight unsolved words in a Connections-style word-grouping puzzle.

## Play online

After GitHub Pages has been enabled for this repository, open:

**https://rustinterry2.github.io/connections-solver/**

Or open `index.html` in any modern browser to use the grouping and feedback features without a server.

## How to play

1. Enter the eight remaining unsolved words, or choose **Upload words** and select a screenshot.
2. Tap **Generate options**. The solver lists all **35 unique partitions** of eight words into two sets of four.
3. Tap *either* group in a pair to select that four-word guess. (This website lets you select all 70 possible four-word groups; the original Pyto interface displayed only one group per pair.)
4. Try the words in your puzzle and choose **Correct**, **1 Away**, or **2 Away**.
5. The solver removes impossible partitions. Continue using feedback until you find a correct group, which also reveals its complementary group.
6. If you make a mistake when reporting feedback, choose **Undo last feedback**. Use **New puzzle** to start over.

## Screenshot import

Click **Upload words** to choose an image. The page lazily loads [Tesseract.js](https://github.com/naptha/tesseract.js) and English language data to recognize text **in your browser**, without uploading the screenshot to a custom app server.

- OCR requires an internet connection to load its libraries and models.
- Best results come from a cropped screenshot showing **only the eight remaining tiles** in two rows of four.
- When OCR finds exactly eight items, it populates the fields and generates the options automatically.
- When OCR sees a different count, the page lets you select exactly eight recognized items manually.
- OCR is imperfect: review/correct the recognized words before using the results.
- The grouping and feedback features do **not** require OCR or an external API.

## Files

- `index.html`: complete static website (HTML, CSS, and JavaScript in one file; no build step).
- `connections_solver.py`: original Pyto iPhone app, preserved for existing users.
- `README.md`: these instructions.

## Mathematics

There are `C(8,4) = 70` four-word subsets. Each subset's complement represents the same 4+4 partition, so there are `70 / 2 = 35` unique partitions. For each proposed four-word guess, the solver considers how many of the four words fall into a proposed actual group (0 or 4 = Correct, 1 or 3 = 1 Away, 2 = 2 Away). A correct guess against any candidate automatically identifies the other four words.

No answers are fetched from NYT or another puzzle provider; this helper reasons only from the words and feedback you enter. No puzzle progress is saved after the browser tab closes.

## Publishing via GitHub Pages

To make the link above work in a newly created repository:

1. Open **Settings → Pages** in the repository.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Choose branch **main**, folder **/(root)**, then **Save**.
4. Wait a few minutes for GitHub Pages to publish, and refresh the URL above.

Further updates to `main/index.html` will automatically trigger another deployment.