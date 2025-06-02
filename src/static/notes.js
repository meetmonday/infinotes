// Notes functionality

import { defaultFont } from './ui.js';
import { getCurrentTheme, themes } from './commands.js';
import { createElement, appendToBody, removeFromBody, addEventListeners, commonStyles } from './utils.js';

// Color schemes for notes
export const colorSchemes = {
    light: [
        { bg: '#FFF9E3', text: '#222' }, // Light yellow (default)
        { bg: '#E3F2FD', text: '#1565C0' }, // Light blue
        { bg: '#E8F5E9', text: '#2E7D32' }, // Light green
        { bg: '#FCE4EC', text: '#C2185B' }, // Light pink
        { bg: '#F3E5F5', text: '#7B1FA2' }, // Light purple
    ],
    dark: [
        { bg: '#2D2D2D', text: '#E0E0E0' }, // Dark gray (default)
        { bg: '#1A237E', text: '#E3F2FD' }, // Dark blue
        { bg: '#1B5E20', text: '#E8F5E9' }, // Dark green
        { bg: '#880E4F', text: '#FCE4EC' }, // Dark pink
        { bg: '#4A148C', text: '#F3E5F5' }, // Dark purple
    ]
};

// Note type definitions
export const NoteTypes = {
    TEXT: 'text',
    IMAGE: 'image'
};

// Get note color based on theme
export function getNoteColor(note, theme) {
    return colorSchemes[theme][note.colorIndex || 0];
}

// URL and coordinate validation
export const validators = {
    isUrl: (text) => {
        const urlPattern = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?$/;
        return urlPattern.test(text);
    },
    
    isCoordinates: (text) => {
        const coordsPattern = /^\(\s*-?\d+\s*,\s*-?\d+\s*\)$/;
        return coordsPattern.test(text);
    },
    
    isValid: (text) => {
        return validators.isUrl(text) || validators.isCoordinates(text);
    }
};

// Coordinate parsing
export function getCoordinates(text) {
    const match = text.match(/^\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)$/);
    return match ? {
        x: parseInt(match[1]),
        y: parseInt(match[2])
    } : null;
}

// URL formatting
export function getFullUrl(text) {
    return text.startsWith('http://') || text.startsWith('https://') 
        ? text 
        : 'https://' + text;
}

// Note creation
export function createImageNote(x, y, image, notes, onUpdate) {
    const img = new Image();
    img.src = image;
    img.onload = () => {
        notes.push({
            type: NoteTypes.IMAGE,
            x, y,
            image: img,
            width: img.width,
            height: img.height,
            rotation: 0,
            isDragging: false,
            caption: ''
        });
        onUpdate();
    };
}

// Input creation
function createInputElement(type, styles, value = '') {
    const input = createElement(type, {
        ...commonStyles.fixed,
        ...commonStyles.input,
        ...styles
    });
    
    if (value) {
        input.value = value;
    }
    
    return input;
}

function setupInputHandlers(input, onSubmit, onCancel) {
    const handlers = {
        keydown: (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || input.tagName === 'INPUT')) {
                onSubmit();
            } else if (e.key === 'Escape') {
                onCancel();
            }
        },
        blur: () => {
            if (document.body.contains(input)) {
                onSubmit();
            }
        }
    };

    addEventListeners(input, handlers);
    return () => removeEventListeners(input, handlers);
}

export function createMultiLineInput(startX, endX, startY, endY, existingNote, notes, fontSize, onUpdate) {
    const width = existingNote ? existingNote.width : Math.abs(endX - startX);
    const height = existingNote ? existingNote.height : Math.abs(endY - startY);
    if (!existingNote && (width < 50 || height < 50)) return;

    const left = existingNote ? existingNote.x : Math.min(startX, endX);
    const top = existingNote ? existingNote.y : Math.min(startY, endY);
    const theme = getCurrentTheme();
    const noteColors = getNoteColor(existingNote || {}, theme);

    const textarea = createInputElement('textarea', {
        left: `${left - offsetX}px`,
        top: `${top - offsetY}px`,
        width: `${width}px`,
        height: `${height}px`,
        fontSize: `${existingNote ? existingNote.fontSize : fontSize}px`,
        fontFamily: defaultFont,
        background: noteColors.bg,
        color: noteColors.text,
        lineHeight: '1.2',
        overflow: 'auto',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        resize: 'none'
    }, existingNote?.text);

    appendToBody(textarea);
    textarea.focus();

    const cleanup = setupInputHandlers(
        textarea,
        () => {
            if (textarea.value.trim()) {
                if (existingNote) {
                    existingNote.text = textarea.value;
                    existingNote.colorIndex = existingNote.colorIndex || 0;
                } else {
                    notes.push({
                        type: NoteTypes.TEXT,
                        text: textarea.value,
                        x: left,
                        y: top,
                        width,
                        height,
                        fontSize,
                        colorIndex: 0,
                        isMultiLine: true,
                        lineHeight: 1.2
                    });
                }
            }
            cleanup();
            removeFromBody(textarea);
            onUpdate();
        },
        () => {
            cleanup();
            removeFromBody(textarea);
        }
    );
}

export function createSingleLineInput(x, y, note, notes, fontSize, onUpdate) {
    const theme = getCurrentTheme();
    const noteColors = getNoteColor(note || {}, theme);

    const input = createInputElement('input', {
        left: `${x - offsetX}px`,
        top: `${y - offsetY}px`,
        fontSize: `${note ? (note.fontSize || fontSize) : fontSize}px`,
        fontFamily: defaultFont,
        background: noteColors.bg,
        color: noteColors.text
    }, note?.text);

    appendToBody(input);
    input.focus();

    const cleanup = setupInputHandlers(
        input,
        () => {
            if (note) {
                note.text = input.value;
                note.colorIndex = note.colorIndex || 0;
            } else if (input.value.trim()) {
                notes.push({
                    type: NoteTypes.TEXT,
                    text: input.value,
                    x,
                    y,
                    fontSize,
                    colorIndex: 0
                });
            }
            cleanup();
            removeFromBody(input);
            onUpdate();
        },
        () => {
            cleanup();
            removeFromBody(input);
        }
    );
} 