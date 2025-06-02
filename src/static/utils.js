// DOM utilities
export function createElement(tag, styles = {}, attributes = {}) {
    const element = document.createElement(tag);
    if (Object.keys(styles).length) {
        Object.assign(element.style, styles);
    }
    if (Object.keys(attributes).length) {
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
    }
    return element;
}

export function appendToBody(element) {
    document.body.appendChild(element);
    return element;
}

export function removeFromBody(element) {
    if (document.body.contains(element)) {
        document.body.removeChild(element);
    }
}

export function addEventListeners(element, listeners) {
    Object.entries(listeners).forEach(([event, handler]) => {
        element.addEventListener(event, handler);
    });
}

export function removeEventListeners(element, listeners) {
    Object.entries(listeners).forEach(([event, handler]) => {
        element.removeEventListener(event, handler);
    });
}

// Style utilities
export const commonStyles = {
    fixed: {
        position: 'fixed',
        zIndex: '1000'
    },
    flex: {
        display: 'flex',
        gap: '8px'
    },
    input: {
        border: '1px solid #E6DFAF',
        borderRadius: '4px',
        padding: '8px',
        boxSizing: 'border-box'
    }
};

// Animation utilities
export function animate(element, properties, duration = 300) {
    return new Promise(resolve => {
        const startTime = performance.now();
        const startValues = {};
        const endValues = {};
        const units = {};
        
        // Pre-calculate values and units
        Object.entries(properties).forEach(([prop, value]) => {
            const computed = getComputedStyle(element)[prop];
            startValues[prop] = parseFloat(computed);
            endValues[prop] = parseFloat(value);
            units[prop] = typeof value === 'string' ? value.replace(/[\d.]/g, '') : 'px';
        });

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            Object.entries(properties).forEach(([prop]) => {
                const start = startValues[prop];
                const end = endValues[prop];
                const current = start + (end - start) * progress;
                element.style[prop] = `${current}${units[prop]}`;
            });

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                resolve();
            }
        }

        requestAnimationFrame(update);
    });
} 