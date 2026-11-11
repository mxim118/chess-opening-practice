[🇷🇺 Русский](README.md) | [🇬🇧 English](README.en.md)

# Chess Opening Trainer

A small browser-based application: choose an opening, play as one side, and your opponent responds according to opening theory. Each move comes with a short comment. Works offline and requires no installation.

## Launch

Open `index.html` by double-clicking it (any modern browser will work). All files must be in the same folder.

```
chess-trainer/
├── index.html    — page
├── style.css     — styling
├── openings.js   — opening database (add new openings here)
├── app.js        — trainer logic
├── check.js      — opening database validation: format and move geometry (optional)
├── check.py      — strict move legality and SAN validation (optional)
└── sounds/
    ├── Move.mp3     — move sound
    └── Capture.mp3  — capture sound
```

Fonts are loaded from the internet. If there is no connection, standard fonts will be used instead; this does not affect functionality.

## How to Use

1. Select an opening on the main screen.
2. Choose a variation (or “Random Variation”) and click “Start”.
3. Make moves for your side. The opponent responds automatically and randomly chooses a line at each branch.
4. If a move is incorrect, the square flashes red, and you can try again.
5. When the variation is complete, the message “Variation completed!” appears, along with the general idea behind the variation.

**Controls**
- Move a piece by dragging it with your mouse or finger, or click the piece and then the destination square.
- **Hint** highlights the piece you need to move.
- **Training mode** (checkbox) continuously highlights the correct move. For testing your knowledge, it is better to turn it off.
- **Arrows and circles**: use the right mouse button. Drag from one square to another to draw an arrow, or click a square to draw a circle. Repeat the action to remove the marking. Hold Shift for red, Ctrl for blue, or Alt for yellow. Left-click the board to clear all markings.
- **← All Openings** returns to the opening selection screen.

## Progress

The number of completed variations and mistakes is stored in your browser (localStorage). If you clear the site's data or open the trainer in another browser, the counters will reset.

## Sounds

Sounds are located in the `sounds/` folder. To replace them, put your own files there with the same names (`Move.mp3`, `Capture.mp3`). Incorrect moves do not produce a sound.

## How to Add a New Opening

1. Make a copy of `openings.js`.
2. Add a new block to the `OPENINGS` array. The format is described in detail in the comment at the beginning of this file. You can conveniently create new openings with AI: provide it with the contents of `openings.js`, the opening name, and the side you play as, and ask it to add a block in the same format.
3. Validate the database using `node check.js` (Node.js must be installed). If it prints “✓ All good”, everything is ready. If errors are found, they will indicate the opening, variation, and move where the problem occurred.
   For strict validation of move legality and SAN accuracy, there is also `check.py`: first run `pip install chess`, then `python3 check.py`. It catches moves that are impossible due to pins or check, as well as incorrect notation such as `Nd2` instead of `Nbd2`.
4. Refresh the page in your browser.

You do not need to modify `app.js`, `style.css`, or `index.html` for this.

## If Something Doesn't Work

- **The page is blank or no opening cards appear.** Most likely, `openings.js` contains a syntax error (usually a missing comma or quote). Restore a copy of the file or run `node check.js`.
- **There is no sound.** Make sure `Move.mp3` and `Capture.mp3` are in the `sounds/` folder with the exact names, and that you have clicked the page at least once (browsers do not enable audio until the first user interaction).
- **The appearance is outdated after edits.** Refresh the page while clearing the cache (Ctrl+F5).
