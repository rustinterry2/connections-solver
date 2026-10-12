# Connections Solver (Pyto)

A Python helper for solving the **final eight words** of a Connections-style word-grouping puzzle on an iPhone using Pyto.

## Features

- Enter eight remaining words manually, or choose a screenshot using **Upload Words**.
- Use Apple's Vision text recognition to extract word tiles from the selected image.
- Automatically fill the word fields and generate all **35 possible two-group partitions** when exactly eight words are detected.
- Select a proposed group and record **Correct**, **1 Away**, or **2 Away** feedback.
- Filter remaining partitions based on feedback and reveal the complementary group when a guess is correct.

## Requirements

- **Pyto** on an iPhone or iPad.
- Pyto's `pyto_ui` and `photos` modules.
- Pillow (PIL) and Apple's Vision framework as accessible from Pyto.

This is a native Pyto app, **not** a browser game or desktop Python program.

## Running the program

1. Save [`connections_solver.py`](./connections_solver.py) to your device and open it in **Pyto**.
2. Run the Python script.
3. Enter the eight remaining words and choose **Generate Options**. Alternatively, choose **Upload Words**, select a screenshot of the eight word tiles, and allow the app to recognize and populate the words.
4. Tap a candidate grouping, then enter the game's feedback: **Correct**, **1 Away**, or **2 Away**.
5. Repeat until you have identified the groups.

For better OCR results, crop screenshots to the eight word tiles. When fewer than eight words are recognized, correct the fields manually.

## How the 35 possibilities are calculated

There are 70 ways to choose four of eight words, but each choice has a complementary group of four. Counting each unordered pair only once leaves **35 unique partitions**.

## Notes

- Intended for the final eight words, not the initial sixteen.
- Requires no web server or API keys.
- This repository contains the Pyto source code. GitHub Pages is not needed to use it.
