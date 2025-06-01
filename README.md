# Canvas Notes Application

A simple web-based application for creating and managing notes on a canvas.

## Features

- Create single-line text notes on a canvas
- Edit existing notes
- Automatic saving of notes to local storage
- Customizable font size
- Responsive canvas with pan and zoom capabilities

## Usage

1. Click anywhere on the canvas to create a new note
2. Type your text and press Enter to save
3. Click on existing notes to edit them
4. Press Escape to cancel editing

## Technical Details

The application uses vanilla JavaScript and HTML5 Canvas for rendering. Notes are stored in the browser's local storage for persistence.

### Key Functions

- `createSingleLineInput(x, y, note)`: Creates a single-line input field for adding or editing notes
- `draw()`: Renders the canvas and all notes
- `saveToStorage()`: Saves notes to local storage
- `loadFromStorage()`: Loads notes from local storage

## Styling

Notes are styled with:
- Light yellow background (#FFFBEA)
- Light border (#E6DFAF)
- Customizable font size
- Default system font

## Browser Support

Works in all modern browsers that support HTML5 Canvas and Local Storage.
