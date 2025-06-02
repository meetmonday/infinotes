import { NoteTypes } from './notes.js';

// Storage keys
const STORAGE_KEYS = {
    NOTES: 'canvasNotes',
    STORED_NOTES: 'storedNotes',
    OFFSET: 'canvasOffset',
    THEME: 'currentTheme'
};

// Default data
const DEFAULT_DATA = {
    notes: [],
    storedNotes: [],
    offsetX: 0,
    offsetY: 0,
    currentTheme: 'light'
};

// Note serialization
function serializeNote(note) {
    if (note.type === NoteTypes.IMAGE) {
        return {
            type: NoteTypes.IMAGE,
            x: note.x,
            y: note.y,
            width: note.width,
            height: note.height,
            rotation: note.rotation,
            caption: note.caption,
            image: note.image.src
        };
    }
    
    return {
        type: NoteTypes.TEXT,
        text: note.text || '',
        x: note.x,
        y: note.y,
        width: note.width,
        height: note.height,
        fontSize: note.fontSize,
        colorIndex: note.colorIndex || 0,
        rotation: note.rotation,
        isMultiLine: note.isMultiLine,
        lineHeight: note.lineHeight,
        isChecked: note.isChecked || false
    };
}

// Note deserialization
function deserializeNote(note) {
    if (note.type === NoteTypes.IMAGE) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                resolve({
                    type: NoteTypes.IMAGE,
                    x: note.x,
                    y: note.y,
                    width: note.width,
                    height: note.height,
                    rotation: note.rotation,
                    caption: note.caption,
                    image: img
                });
            };
            img.src = note.image;
        });
    }
    
    return Promise.resolve({
        ...note,
        type: NoteTypes.TEXT,
        text: note.text || '',
        colorIndex: note.colorIndex || 0,
        isChecked: note.isChecked || false
    });
}

// Save notes to storage
export function saveToStorage(notes, storedNotes, offsetX, offsetY, currentTheme) {
    const notesToSave = notes.map(serializeNote);
    const storedNotesToSave = storedNotes.map(serializeNote);

    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notesToSave));
    localStorage.setItem(STORAGE_KEYS.STORED_NOTES, JSON.stringify(storedNotesToSave));
    localStorage.setItem(STORAGE_KEYS.OFFSET, JSON.stringify({ x: offsetX, y: offsetY }));
    localStorage.setItem(STORAGE_KEYS.THEME, currentTheme);
}

// Load notes from storage
export async function loadFromStorage() {
    const data = { ...DEFAULT_DATA };

    // Load theme
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (savedTheme) {
        data.currentTheme = savedTheme;
    }

    // Load notes
    const savedNotes = localStorage.getItem(STORAGE_KEYS.NOTES);
    if (savedNotes) {
        const parsedNotes = JSON.parse(savedNotes);
        data.notes = await Promise.all(parsedNotes.map(deserializeNote));
    }

    // Load stored notes
    const savedStoredNotes = localStorage.getItem(STORAGE_KEYS.STORED_NOTES);
    if (savedStoredNotes) {
        const parsedStoredNotes = JSON.parse(savedStoredNotes);
        data.storedNotes = await Promise.all(parsedStoredNotes.map(deserializeNote));
    }
    
    // Load canvas offset
    const savedOffset = localStorage.getItem(STORAGE_KEYS.OFFSET);
    if (savedOffset) {
        const { x, y } = JSON.parse(savedOffset);
        data.offsetX = x;
        data.offsetY = y;
    }

    return data;
}

// Clear storage
export function clearStorage() {
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
}

// Export/Import functionality
export function exportData(notes, storedNotes, offsetX, offsetY, currentTheme) {
    const data = {
        notes: notes.map(serializeNote),
        storedNotes: storedNotes.map(serializeNote),
        offset: { x: offsetX, y: offsetY },
        theme: currentTheme
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'infinotes-backup.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export async function importData(file) {
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        return {
            notes: await Promise.all(data.notes.map(deserializeNote)),
            storedNotes: await Promise.all(data.storedNotes.map(deserializeNote)),
            offsetX: data.offset.x,
            offsetY: data.offset.y,
            currentTheme: data.theme
        };
    } catch (error) {
        console.error('Error importing data:', error);
        return null;
    }
} 