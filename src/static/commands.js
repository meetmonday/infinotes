// Command system

// Theme definitions
export const themes = {
    light: {
        background: '#FFF9E3',
        dots: '#E6DFAF',
        storage: '#FFFFFF'
    },
    dark: {
        background: '#1A1A1A',
        dots: '#333333',
        storage: '#2D2D2D'
    }
};

let currentTheme = 'light';

// Command system
export const commands = {
    'тема': () => {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        return `Тема переключена на ${currentTheme === 'light' ? 'светлую' : 'тёмную'}`;
    },
    'помощь': () => {
        return 'Список команд: !тема, !помощь';
    }
};

// Check if text is a command
export function isCommand(text) {
    return text.startsWith('!') && commands[text.slice(1)];
}

// Execute command
export function executeCommand(text) {
    const command = text.slice(1); // Remove "!" from start
    if (commands[command]) {
        return commands[command]();
    }
    return null;
}

// Get current theme
export function getCurrentTheme() {
    return currentTheme;
}

// Set theme
export function setTheme(theme) {
    currentTheme = theme;
} 