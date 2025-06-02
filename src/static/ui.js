import { createElement, appendToBody, removeFromBody, addEventListeners, commonStyles, animate } from './utils.js';
import { colorSchemes } from './notes.js';
import { getCurrentTheme } from './commands.js';

// UI Components

// Default font
export const defaultFont = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

// Toast styles
const toastStyles = {
    ...commonStyles.fixed,
    top: '20px',
    right: '20px',
    padding: '12px 24px',
    background: 'rgba(0, 0, 0, 0.8)',
    color: '#fff',
    borderRadius: '4px',
    fontFamily: defaultFont,
    fontSize: '14px',
    opacity: '0',
    transform: 'translateY(-20px)',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
    pointerEvents: 'none'
};

// Show toast message
export async function showToast(message, duration = 3000) {
    const toast = createElement('div', toastStyles);
    toast.textContent = message;
    appendToBody(toast);

    await animate(toast, { opacity: 1, transform: 'translateY(0)' });
    
    await new Promise(resolve => setTimeout(resolve, duration));
    
    await animate(toast, { opacity: 0, transform: 'translateY(-20px)' });
    removeFromBody(toast);
}

// Create color box
function createColorBox(color, index, onColorChange) {
    const colorBox = createElement('div', {
        width: '24px',
        height: '24px',
        background: color,
        border: '1px solid #ccc',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'transform 0.1s'
    });

    addEventListeners(colorBox, {
        mouseover: () => colorBox.style.transform = 'scale(1.1)',
        mouseout: () => colorBox.style.transform = 'scale(1)',
        click: () => onColorChange(index)
    });

    return colorBox;
}

// Create context menu
export function createContextMenu(x, y, result, onColorChange, onDelete) {
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) {
        removeFromBody(existingMenu);
    }

    const { note, isStored } = result;
    const theme = getCurrentTheme();

    const menu = createElement('div', {
        ...commonStyles.fixed,
        left: `${x}px`,
        top: `${y}px`,
        background: 'white',
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '8px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
    }, { className: 'context-menu' });

    if (note.type !== 'image') {
        const colorContainer = createElement('div', commonStyles.flex);
        colorSchemes[theme].forEach((scheme, index) => {
            colorContainer.appendChild(createColorBox(scheme.bg, index, () => {
                onColorChange(note, index);
                removeFromBody(menu);
            }));
        });
        menu.appendChild(colorContainer);
    }

    const deleteOption = createElement('div', {
        padding: '8px 16px',
        cursor: 'pointer',
        color: '#d32f2f',
        borderTop: '1px solid #ccc',
        marginTop: '8px'
    });
    deleteOption.textContent = 'Удалить';
    
    addEventListeners(deleteOption, {
        click: () => {
            onDelete(note, isStored);
            removeFromBody(menu);
        }
    });
    
    menu.appendChild(deleteOption);
    appendToBody(menu);

    const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
            removeFromBody(menu);
            document.removeEventListener('click', closeMenu);
        }
    };
    document.addEventListener('click', closeMenu);
}

// Create coordinates display
export function createCoordsDisplay() {
    return createElement('div', {
        ...commonStyles.fixed,
        bottom: '20px',
        right: '20px',
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '8px 12px',
        borderRadius: '4px',
        fontFamily: defaultFont,
        fontSize: '14px',
        color: '#666',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        pointerEvents: 'none'
    });
} 