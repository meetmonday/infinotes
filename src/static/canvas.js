// Добавляем подключение шрифта
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

// Определяем шрифт по умолчанию
var defaultFont = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d', { alpha: true });
// Включаем сглаживание для изображений
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';
document.body.appendChild(canvas);

canvas.style.position = 'fixed';
canvas.style.top = 0;
canvas.style.left = 0;
canvas.style.zIndex = 0;
canvas.style.background = '#FFF9E3'; // светло-желтый

let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

// Панорамирование
let offsetX = 0, offsetY = 0;
let drag = false, lastX = 0, lastY = 0;

// Добавляем переменные для рисования области
let isDrawing = false;
let drawStartX = 0;
let drawStartY = 0;
let drawEndX = 0;
let drawEndY = 0;

// Добавляем переменные для изменения размера
let resizingNote = null;
let resizeStartX = 0;
let resizeStartY = 0;
let originalWidth = 0;
let originalHeight = 0;

// Добавляем переменную для отслеживания заметки под курсором
let hoveredNote = null;

// Добавляем переменную для отслеживания перетаскивания
let wasDragged = false;

// Добавляем переменную для отслеживания заметки из хранилища
let isFromStorage = false;

// Создаем область для временного хранения заметок
const storageArea = document.createElement('canvas');
storageArea.style.position = 'fixed';
storageArea.style.bottom = '0';
storageArea.style.left = '0';
storageArea.style.width = '100%';
storageArea.style.height = '100px';
storageArea.style.background = '#E8E8E8';
storageArea.style.opacity = '0';
storageArea.style.transition = 'opacity 0.3s ease';
storageArea.style.zIndex = '1';
storageArea.style.pointerEvents = 'none';
document.body.appendChild(storageArea);

// Устанавливаем размеры canvas для области хранения
storageArea.width = window.innerWidth;
storageArea.height = 100;

// Получаем контекст для области хранения
const storageCtx = storageArea.getContext('2d');

// Добавляем переменную для отслеживания состояния хранилища
let isStorageVisible = false;

// Добавляем обработчики событий для области хранения
storageArea.addEventListener('mousedown', e => {
    if (!isStorageVisible) return;
    
    let x = e.clientX, y = e.clientY;
    let result = noteAt(x, y);
    let note = result ? result.note : null;
    let isStored = result ? result.isStored : false;

    if (note && isStored) {
        e.preventDefault();
        draggingNote = note;
        note.isDragging = true;
        note.rotation = 0;
        isFromStorage = true; // Устанавливаем флаг

        // Удаляем заметку из хранилища
        const index = storedNotes.indexOf(note);
        if (index > -1) {
            storedNotes.splice(index, 1);
            
            // Вычисляем начальную позицию заметки
            note.x = x + offsetX;
            note.y = y + offsetY;
            
            // Вычисляем смещение для перетаскивания
            dragNoteOffset.x = 0;
            dragNoteOffset.y = 0;
            
            // Добавляем заметку на канвас
            notes.push(note);
            
            // Немедленно обновляем отображение
            draw();
            saveToStorage();
        }
    }
});

storageArea.addEventListener('mousemove', e => {
    if (!isStorageVisible) return;
    
    let x = e.clientX, y = e.clientY;
    let result = noteAt(x, y);
    let note = result ? result.note : null;
    
    if (note && result.isStored) {
        storageArea.style.cursor = 'pointer';
    } else {
        storageArea.style.cursor = 'default';
    }
});

storageArea.addEventListener('mouseup', e => {
    if (draggingNote) {
        draggingNote.isDragging = false;
        draggingNote = null;
        draw();
        saveToStorage();
    }
});

// Обновляем обработчик для отображения области при наведении
document.body.addEventListener('mousemove', e => {
    const activationHeight = 20; // Область активации для показа хранилища
    if (e.clientY > window.innerHeight - activationHeight || draggingNote) {
        if (!isStorageVisible) {
            isStorageVisible = true;
            storageArea.style.opacity = '1';
            storageArea.style.pointerEvents = 'auto';
            draw(); // Перерисовываем для обновления хранилища
        }
    } else if (isStorageVisible && e.clientY > window.innerHeight - 100) {
        // Если мышь над хранилищем, оно остается видимым
        isStorageVisible = true;
        storageArea.style.opacity = '1';
        storageArea.style.pointerEvents = 'auto';
    } else if (isStorageVisible && !draggingNote) {
        isStorageVisible = false;
        storageArea.style.opacity = '0';
        storageArea.style.pointerEvents = 'none';
        draw();
    }
});

// Добавляем переменную для хранения заметок в области
let storedNotes = [];

// Точки на фоне
function drawDots() {
    const spacing = 40;
    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#FFF9E3';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#E6DFAF';
    for (let x = -offsetX % spacing; x < width; x += spacing) {
        for (let y = -offsetY % spacing; y < height; y += spacing) {
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
    ctx.restore();
}

// Добавляем поддержку изображений
let notes = [];
let editingNote = null;
let draggingNote = null;
let dragNoteOffset = {x:0, y:0};
let fontSize = 16;

// Цветовые схемы для заметок
const colorSchemes = [
    { bg: '#FFF9E3', text: '#222' }, // Светло-желтый (по умолчанию)
    { bg: '#E3F2FD', text: '#1565C0' }, // Светло-синий
    { bg: '#E8F5E9', text: '#2E7D32' }, // Светло-зеленый
    { bg: '#FCE4EC', text: '#C2185B' }, // Светло-розовый
    { bg: '#F3E5F5', text: '#7B1FA2' }, // Светло-фиолетовый
];

// Обновляем функцию проверки на URL, добавляя поддержку координат
function isUrl(text) {
    // Проверяем на URL
    const urlPattern = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?$/;
    if (urlPattern.test(text)) return true;
    
    // Проверяем на координаты в формате (x, y)
    const coordsPattern = /^\(\s*-?\d+\s*,\s*-?\d+\s*\)$/;
    return coordsPattern.test(text);
}

// Добавляем функцию для получения координат из текста
function getCoordinates(text) {
    const match = text.match(/^\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)$/);
    if (match) {
        return {
            x: parseInt(match[1]),
            y: parseInt(match[2])
        };
    }
    return null;
}

// Получение полного URL
function getFullUrl(text) {
    if (text.startsWith('http://') || text.startsWith('https://')) {
        return text;
    }
    return 'https://' + text;
}

// Обновляем функции для работы с localStorage
function saveToStorage() {
    // Сохраняем заметки
    const notesToSave = notes.map(note => {
        if (note.type === 'image') {
            return {
                type: 'image',
                x: note.x,
                y: note.y,
                width: note.width,
                height: note.height,
                rotation: note.rotation,
                caption: note.caption,
                image: note.image.src
            };
        } else {
            return {
                type: 'text',
                text: note.text || '',
                x: note.x,
                y: note.y,
                width: note.width,
                height: note.height,
                fontSize: note.fontSize,
                bgColor: note.bgColor || colorSchemes[0].bg,
                textColor: note.textColor || colorSchemes[0].text,
                rotation: note.rotation,
                isMultiLine: note.isMultiLine,
                lineHeight: note.lineHeight
            };
        }
    });

    // Сохраняем заметки в области хранения
    const storedNotesToSave = storedNotes.map(note => {
        if (note.type === 'image') {
            return {
                type: 'image',
                x: note.x,
                y: note.y,
                width: note.width,
                height: note.height,
                rotation: note.rotation,
                caption: note.caption,
                image: note.image.src
            };
        } else {
            return {
                type: 'text',
                text: note.text || '',
                x: note.x,
                y: note.y,
                width: note.width,
                height: note.height,
                fontSize: note.fontSize,
                bgColor: note.bgColor || colorSchemes[0].bg,
                textColor: note.textColor || colorSchemes[0].text,
                rotation: note.rotation,
                isMultiLine: note.isMultiLine,
                lineHeight: note.lineHeight
            };
        }
    });

    localStorage.setItem('canvasNotes', JSON.stringify(notesToSave));
    localStorage.setItem('storedNotes', JSON.stringify(storedNotesToSave));
    localStorage.setItem('canvasOffset', JSON.stringify({ x: offsetX, y: offsetY }));
}

function loadFromStorage() {
    // Загружаем заметки
    const savedNotes = localStorage.getItem('canvasNotes');
    if (savedNotes) {
        const parsedNotes = JSON.parse(savedNotes);
        parsedNotes.forEach(note => {
            if (note.type === 'image') {
                const img = new Image();
                img.onload = () => {
                    notes.push({
                        type: 'image',
                        x: note.x,
                        y: note.y,
                        width: note.width,
                        height: note.height,
                        rotation: note.rotation,
                        caption: note.caption,
                        image: img
                    });
                    draw();
                };
                img.src = note.image;
            } else {
                notes.push({
                    ...note,
                    text: note.text || '',
                    bgColor: note.bgColor || colorSchemes[0].bg,
                    textColor: note.textColor || colorSchemes[0].text
                });
            }
        });
    }

    // Загружаем заметки из области хранения
    const savedStoredNotes = localStorage.getItem('storedNotes');
    if (savedStoredNotes) {
        const parsedStoredNotes = JSON.parse(savedStoredNotes);
        parsedStoredNotes.forEach(note => {
            if (note.type === 'image') {
                const img = new Image();
                img.onload = () => {
                    storedNotes.push({
                        type: 'image',
                        x: note.x,
                        y: note.y,
                        width: note.width,
                        height: note.height,
                        rotation: note.rotation,
                        caption: note.caption,
                        image: img
                    });
                    draw();
                };
                img.src = note.image;
            } else {
                storedNotes.push({
                    ...note,
                    text: note.text || '',
                    bgColor: note.bgColor || colorSchemes[0].bg,
                    textColor: note.textColor || colorSchemes[0].text
                });
            }
        });
    }
    
    // Загружаем позицию полотна
    const savedOffset = localStorage.getItem('canvasOffset');
    if (savedOffset) {
        const { x, y } = JSON.parse(savedOffset);
        offsetX = x;
        offsetY = y;
    }
}

// Функция для создания заметки с изображением
function createImageNote(x, y, image) {
    const img = new Image();
    img.src = image;
    img.onload = () => {
        notes.push({
            type: 'image',
            x: x,
            y: y,
            image: img,
            width: img.width,
            height: img.height,
            rotation: 0,
            isDragging: false,
            caption: ''
        });
        draw();
        saveToStorage(); // Сохраняем после добавления
    };
}

// Обработка вставки из буфера обмена
document.addEventListener('paste', e => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            const reader = new FileReader();
            reader.onload = (event) => {
                createImageNote(e.clientX + offsetX, e.clientY + offsetY, event.target.result);
            };
            reader.readAsDataURL(blob);
            e.preventDefault();
        }
    }
});

// Обработка перетаскивания файлов
canvas.addEventListener('dragover', e => {
    e.preventDefault();
});

canvas.addEventListener('drop', e => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                createImageNote(e.clientX + offsetX, e.clientY + offsetY, event.target.result);
            };
            reader.readAsDataURL(files[i]);
        }
    }
});

// Создаем элемент для отображения координат
const coordsDisplay = document.createElement('div');
coordsDisplay.style.position = 'fixed';
coordsDisplay.style.bottom = '20px';
coordsDisplay.style.right = '20px';
coordsDisplay.style.background = 'rgba(255, 255, 255, 0.9)';
coordsDisplay.style.padding = '8px 12px';
coordsDisplay.style.borderRadius = '4px';
coordsDisplay.style.fontFamily = defaultFont;
coordsDisplay.style.fontSize = '14px';
coordsDisplay.style.color = '#666';
coordsDisplay.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
coordsDisplay.style.zIndex = '1000';
coordsDisplay.style.pointerEvents = 'none'; // Чтобы не мешало взаимодействию с канвасом
document.body.appendChild(coordsDisplay);

// Рисуем все
function draw() {
    drawDots();
    
    // Рисуем область выделения
    if (isDrawing) {
        ctx.save();
        ctx.strokeStyle = '#0066cc';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
            Math.min(drawStartX, drawEndX) - offsetX,
            Math.min(drawStartY, drawEndY) - offsetY,
            Math.abs(drawEndX - drawStartX),
            Math.abs(drawEndY - drawStartY)
        );
        ctx.restore();
    }
    
    // Рисуем заметки
    notes.forEach(note => {
        drawNote(note);
    });

    // Рисуем заметки в области хранения
    if (storageArea.style.opacity === '1') {
        // Очищаем область хранения
        storageCtx.clearRect(0, 0, storageArea.width, storageArea.height);
        storageCtx.fillStyle = '#E8E8E8';
        storageCtx.fillRect(0, 0, storageArea.width, storageArea.height);

        const noteSpacing = 10;
        let currentX = noteSpacing;
        let currentY = noteSpacing;

        storedNotes.forEach(note => {
            const padding = 8;
            let noteWidth, noteHeight;

            if (note.type === 'image') {
                // Вычисляем размеры изображения с сохранением пропорций
                const maxWidth = storageArea.width - noteSpacing * 2;
                const maxHeight = 80; // Максимальная высота для изображений в хранилище
                const aspectRatio = note.width / note.height;
                
                // Принудительно масштабируем изображение, чтобы оно поместилось в хранилище
                if (aspectRatio > 1) {
                    noteWidth = Math.min(note.width, maxWidth);
                    noteHeight = noteWidth / aspectRatio;
                    if (noteHeight > maxHeight) {
                        noteHeight = maxHeight;
                        noteWidth = noteHeight * aspectRatio;
                    }
                } else {
                    noteHeight = Math.min(note.height, maxHeight);
                    noteWidth = noteHeight * aspectRatio;
                    if (noteWidth > maxWidth) {
                        noteWidth = maxWidth;
                        noteHeight = noteWidth / aspectRatio;
                    }
                }
                
                // Проверяем, нужно ли перейти на новую строку
                if (currentX + noteWidth > storageArea.width - noteSpacing) {
                    currentX = noteSpacing;
                    currentY += noteHeight + noteSpacing;
                }
                
                // Проверяем, не выходит ли заметка за пределы хранилища
                if (currentY + noteHeight > storageArea.height - noteSpacing) {
                    return; // Пропускаем заметку, если она не помещается
                }
                
                // Рисуем изображение
                storageCtx.save();
                storageCtx.translate(currentX, currentY);
                
                // Рисуем фон для изображения
                storageCtx.fillStyle = '#FFFFFF';
                storageCtx.fillRect(0, 0, noteWidth, noteHeight);
                
                // Рисуем само изображение
                storageCtx.drawImage(note.image, 0, 0, noteWidth, noteHeight);
                
                // Рисуем подпись, если есть
                if (note.caption) {
                    storageCtx.font = `12px ${defaultFont}`;
                    storageCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    storageCtx.textAlign = 'center';
                    storageCtx.textBaseline = 'top';
                    storageCtx.fillText(note.caption, noteWidth / 2, noteHeight + 4);
                }
                
                storageCtx.restore();
                
                currentX += noteWidth + noteSpacing;
            } else {
                storageCtx.font = `${note.fontSize || fontSize}px ${defaultFont}`;
                const textMetrics = storageCtx.measureText(note.text);
                noteWidth = Math.min(textMetrics.width + padding * 2, storageArea.width - noteSpacing * 2);
                noteHeight = (note.fontSize || fontSize) + padding * 2;

                // Проверяем, нужно ли перейти на новую строку
                if (currentX + noteWidth > storageArea.width - noteSpacing) {
                    currentX = noteSpacing;
                    currentY += noteHeight + noteSpacing;
                }

                // Проверяем, не выходит ли заметка за пределы хранилища
                if (currentY + noteHeight > storageArea.height - noteSpacing) {
                    return; // Пропускаем заметку, если она не помещается
                }

                storageCtx.save();
                storageCtx.translate(currentX, currentY);
                
                // Рисуем фон заметки
                storageCtx.fillStyle = note.bgColor || colorSchemes[0].bg;
                storageCtx.fillRect(0, 0, noteWidth, noteHeight);
                
                // Рисуем текст с учетом границ
                storageCtx.font = `${note.fontSize || fontSize}px ${defaultFont}`;
                storageCtx.fillStyle = note.textColor || colorSchemes[0].text;
                
                // Обрезаем текст, если он не помещается
                let text = note.text;
                while (storageCtx.measureText(text).width > noteWidth - padding * 2 && text.length > 0) {
                    text = text.slice(0, -1);
                }
                storageCtx.fillText(text, padding, note.fontSize || fontSize);
                
                storageCtx.restore();

                currentX += noteWidth + noteSpacing;
            }
        });
    }
}

// Обновляем функцию drawNote для поддержки разных контекстов
function drawNote(note) {
    ctx.save();
    
    if (note.type === 'image') {
        const x = note.x - offsetX;
        const y = note.y - offsetY;
        const width = note.width;
        const height = note.height;
        const cornerRadius = 6;
        
        const scale = note.isDragging ? 1.05 : 1;
        const shadowBlur = note.isDragging ? 10 : 0;
        const shadowOffset = note.isDragging ? 5 : 0;
        
        if (note.rotation) {
            ctx.translate(x + width/2, y + height/2);
            ctx.rotate(note.rotation);
            ctx.translate(-(x + width/2), -(y + height/2));
        }
        
        if (shadowBlur > 0) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            ctx.shadowBlur = shadowBlur;
            ctx.shadowOffsetY = shadowOffset;
        }
        
        ctx.beginPath();
        ctx.moveTo(x + cornerRadius, y);
        ctx.lineTo(x + width - cornerRadius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + cornerRadius);
        ctx.lineTo(x + width, y + height - cornerRadius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - cornerRadius, y + height);
        ctx.lineTo(x + cornerRadius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - cornerRadius);
        ctx.lineTo(x, y + cornerRadius);
        ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
        ctx.closePath();
        
        if (scale !== 1) {
            ctx.translate(x + width/2, y + height/2);
            ctx.scale(scale, scale);
            ctx.translate(-(x + width/2), -(y + height/2));
        }
        
        ctx.clip();
        ctx.drawImage(note.image, x, y, width, height);
        
        if (note.caption) {
            ctx.restore();
            ctx.save();
            
            if (note.rotation) {
                ctx.translate(x + width/2, y + height/2);
                ctx.rotate(note.rotation);
                ctx.translate(-(x + width/2), -(y + height/2));
            }
            
            if (scale !== 1) {
                ctx.translate(x + width/2, y + height/2);
                ctx.scale(scale, scale);
                ctx.translate(-(x + width/2), -(y + height/2));
            }
            
            ctx.font = `14px ${defaultFont}`;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(note.caption, x + width/2, y + height + 8);
        }
    } else {
        ctx.font = `${note.fontSize || fontSize}px ${defaultFont}`;
        ctx.textBaseline = 'top';
        
        const padding = 8;
        const cornerRadius = 6;
        
        const x = note.x - offsetX;
        const y = note.y - offsetY;
        const width = note.isMultiLine ? note.width : ctx.measureText(note.text).width + padding * 2;
        const height = note.isMultiLine ? note.height : (note.fontSize || fontSize) + padding * 2;
        
        const scale = note.isDragging ? 1.05 : 1;
        const shadowBlur = note.isDragging ? 10 : 0;
        const shadowOffset = note.isDragging ? 5 : 0;
        
        if (note.rotation) {
            ctx.translate(x + width/2, y + height/2);
            ctx.rotate(note.rotation);
            ctx.translate(-(x + width/2), -(y + height/2));
        }
        
        if (shadowBlur > 0) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            ctx.shadowBlur = shadowBlur;
            ctx.shadowOffsetY = shadowOffset;
        }
        
        ctx.beginPath();
        ctx.moveTo(x + cornerRadius, y);
        ctx.lineTo(x + width - cornerRadius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + cornerRadius);
        ctx.lineTo(x + width, y + height - cornerRadius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - cornerRadius, y + height);
        ctx.lineTo(x + cornerRadius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - cornerRadius);
        ctx.lineTo(x, y + cornerRadius);
        ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
        ctx.closePath();
        
        if (scale !== 1) {
            ctx.translate(x + width/2, y + height/2);
            ctx.scale(scale, scale);
            ctx.translate(-(x + width/2), -(y + height/2));
        }
        
        ctx.fillStyle = note.bgColor || colorSchemes[0].bg;
        ctx.fill();
        
        if (note === hoveredNote) {
            ctx.strokeStyle = 'rgba(0, 102, 204, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        
        if (isUrl(note.text)) {
            if (getCoordinates(note.text)) {
                ctx.fillStyle = '#2E7D32';
            } else {
                ctx.fillStyle = '#0066cc';
            }
            ctx.fillText(note.text, x + padding, y + padding);
            ctx.beginPath();
            ctx.moveTo(x + padding, y + padding + (note.fontSize || fontSize));
            ctx.lineTo(x + padding + ctx.measureText(note.text).width, y + padding + (note.fontSize || fontSize));
            ctx.strokeStyle = ctx.fillStyle;
            ctx.stroke();
        } else {
            ctx.fillStyle = note.textColor || colorSchemes[0].text;
            if (note.isMultiLine) {
                const lines = note.text.split('\n');
                const lineHeight = (note.fontSize || fontSize) * (note.lineHeight || 1.2);
                const maxWidth = width - padding * 2;
                
                const maxLines = Math.floor((height - padding * 2) / lineHeight);
                
                lines.slice(0, maxLines).forEach((line, index) => {
                    let displayLine = line;
                    while (ctx.measureText(displayLine).width > maxWidth && displayLine.length > 0) {
                        displayLine = displayLine.slice(0, -1);
                    }
                    ctx.fillText(displayLine, x + padding, y + padding + index * lineHeight);
                });
            } else {
                ctx.fillText(note.text, x + padding, y + padding);
            }
        }

        if (note.isMultiLine) {
            ctx.beginPath();
            ctx.moveTo(x + width - 10, y + height);
            ctx.lineTo(x + width, y + height - 10);
            ctx.lineTo(x + width, y + height);
            ctx.closePath();
            ctx.fillStyle = note === hoveredNote ? 'rgba(0, 102, 204, 0.5)' : 'rgba(0, 0, 0, 0.3)';
            ctx.fill();
        }
    }
    ctx.restore();
}

// Обновляем функцию noteAt для улучшения определения заметок в хранилище
function noteAt(x, y) {
    const padding = 8;
    const hitPadding = 6;

    // Проверяем заметки в области хранения
    if (y > window.innerHeight - 100 && storageArea.style.opacity === '1') {
        const noteSpacing = 10;
        let currentX = noteSpacing;
        let currentY = window.innerHeight - 100 + noteSpacing;

        for (let i = 0; i < storedNotes.length; i++) {
            const note = storedNotes[i];
            const padding = 8;
            let noteWidth, noteHeight;

            if (note.type === 'image') {
                // Вычисляем размеры изображения с сохранением пропорций
                const maxWidth = storageArea.width - noteSpacing * 2;
                const maxHeight = 80;
                const aspectRatio = note.width / note.height;
                
                // Принудительно масштабируем изображение, чтобы оно поместилось в хранилище
                if (aspectRatio > 1) {
                    noteWidth = Math.min(note.width, maxWidth);
                    noteHeight = noteWidth / aspectRatio;
                    if (noteHeight > maxHeight) {
                        noteHeight = maxHeight;
                        noteWidth = noteHeight * aspectRatio;
                    }
                } else {
                    noteHeight = Math.min(note.height, maxHeight);
                    noteWidth = noteHeight * aspectRatio;
                    if (noteWidth > maxWidth) {
                        noteWidth = maxWidth;
                        noteHeight = noteWidth / aspectRatio;
                    }
                }
            } else {
                storageCtx.font = `${note.fontSize || fontSize}px ${defaultFont}`;
                const textMetrics = storageCtx.measureText(note.text);
                noteWidth = Math.min(textMetrics.width + padding * 2, storageArea.width - noteSpacing * 2);
                noteHeight = (note.fontSize || fontSize) + padding * 2;
            }

            // Проверяем, нужно ли перейти на новую строку
            if (currentX + noteWidth > storageArea.width - noteSpacing) {
                currentX = noteSpacing;
                currentY += noteHeight + noteSpacing;
            }

            // Проверяем попадание курсора в заметку
            if (x >= currentX && x <= currentX + noteWidth &&
                y >= currentY && y <= currentY + noteHeight) {
                return { note, isStored: true };
            }

            currentX += noteWidth + noteSpacing;
        }
    }

    // Проверяем заметки на канвасе
    for (let i = notes.length - 1; i >= 0; i--) {
        let note = notes[i];
        if (note.type === 'image') {
            const totalWidth = note.width + hitPadding * 2;
            const totalHeight = note.height + (note.caption ? 30 : 0) + hitPadding * 2;
            if (
                x >= note.x - offsetX - hitPadding && 
                x <= note.x - offsetX + totalWidth && 
                y >= note.y - offsetY - hitPadding && 
                y <= note.y - offsetY + totalHeight
            ) {
                return { note, isStored: false };
            }
        } else {
            let width, height;
            if (note.isMultiLine) {
                width = note.width;
                height = note.height;
            } else {
                ctx.font = `${note.fontSize || fontSize}px ${defaultFont}`;
                width = ctx.measureText(note.text).width + padding * 2;
                height = (note.fontSize || fontSize) + padding * 2;
            }
            let x0 = note.x - offsetX - hitPadding;
            let y0 = note.y - offsetY - hitPadding;
            let x1 = note.x - offsetX + width + hitPadding;
            let y1 = note.y - offsetY + height + hitPadding;
            if (
                x >= x0 && x <= x1 &&
                y >= y0 && y <= y1
            ) {
                return { note, isStored: false };
            }
        }
    }
    return null;
}

// Функция для проверки, находится ли курсор над углом для изменения размера
function isOverResizeHandle(x, y, note) {
    if (!note.isMultiLine) return false;
    const handleSize = 10;
    const cornerX = note.x - offsetX + note.width;
    const cornerY = note.y - offsetY + note.height;
    return (
        x >= cornerX - handleSize &&
        x <= cornerX + handleSize &&
        y >= cornerY - handleSize &&
        y <= cornerY + handleSize
    );
}

// Обновляем обработчик mousedown для canvas
canvas.addEventListener('mousedown', e => {
    let x = e.clientX, y = e.clientY;
    let result = noteAt(x, y);
    let note = result ? result.note : null;
    let isStored = result ? result.isStored : false;

    if (e.button === 1) { // Средняя кнопка мыши
        drag = true;
        lastX = x;
        lastY = y;
        e.preventDefault();
    } else if (e.button === 0) { // Левая кнопка мыши
        if (!note) {
            isDrawing = true;
            drawStartX = x + offsetX;
            drawStartY = y + offsetY;
            drawEndX = drawStartX;
            drawEndY = drawStartY;
        } else if (!isStored && isOverResizeHandle(x, y, note)) {
            resizingNote = note;
            resizeStartX = x;
            resizeStartY = y;
            originalWidth = note.width;
            originalHeight = note.height;
        } else {
        draggingNote = note;
            note.isDragging = true;
            note.rotation = 0;

            // Вычисляем смещение от точки клика до центра заметки
        dragNoteOffset.x = x + offsetX - note.x;
        dragNoteOffset.y = y + offsetY - note.y;
            
            wasDragged = false;
        }
    }
});

// Обновляем обработчик mousemove для улучшения перетаскивания
document.addEventListener('mousemove', e => {
    let x = e.clientX, y = e.clientY;
    const canvasX = Math.round(x + offsetX);
    const canvasY = Math.round(y + offsetY);
    coordsDisplay.textContent = `x: ${canvasX}, y: ${canvasY}`;
    
    if (isDrawing) {
        drawEndX = x + offsetX;
        drawEndY = y + offsetY;
        draw();
    } else if (drag) {
        offsetX -= x - lastX;
        offsetY -= y - lastY;
        lastX = x;
        lastY = y;
        draw();
        saveToStorage();
    } else if (resizingNote) {
        const newWidth = Math.max(50, originalWidth + (x - resizeStartX));
        const newHeight = Math.max(50, originalHeight + (y - resizeStartY));
        resizingNote.width = newWidth;
        resizingNote.height = newHeight;
        draw();
    } else if (draggingNote) {
        // Проверяем, находится ли заметка над областью хранения
        if (y > window.innerHeight - 100 && !isFromStorage) { // Добавляем проверку флага
            storageArea.style.background = '#D0D0D0';
            // Если заметка еще не в хранилище, перемещаем её туда
            if (!storedNotes.includes(draggingNote)) {
                const index = notes.indexOf(draggingNote);
                if (index > -1) {
                    notes.splice(index, 1);
                    storedNotes.push(draggingNote);
                    draggingNote = null;
                    draw();
                    saveToStorage();
                    return; // Прерываем обработку, так как заметка уже перемещена
                }
            }
        } else {
            storageArea.style.background = '#E8E8E8';
            // Обновляем позицию заметки с учетом смещения
        draggingNote.x = x + offsetX - dragNoteOffset.x;
        draggingNote.y = y + offsetY - dragNoteOffset.y;
            
            if (Math.abs(x - lastX) > 5 || Math.abs(y - lastY) > 5) {
                wasDragged = true;
            }
            draw();
            saveToStorage();
        }
    } else {
        let result = noteAt(x, y);
        let note = result ? result.note : null;
        if (note && !result.isStored && isOverResizeHandle(x, y, note)) {
            canvas.style.cursor = 'nwse-resize';
            hoveredNote = note;
        } else if (note && isUrl(note.text)) {
            canvas.style.cursor = 'pointer';
            hoveredNote = note;
        } else if (note && result.isStored) {
            storageArea.style.cursor = 'move';
            hoveredNote = note;
        } else {
            canvas.style.cursor = 'default';
            storageArea.style.cursor = 'default';
            hoveredNote = note;
        }
        draw();
    }
});

// Обновляем обработчик mouseup
document.addEventListener('mouseup', e => {
    if (e.button === 1) {
        drag = false;
    } else if (e.button === 0) {
        if (isDrawing) {
            isDrawing = false;
            const width = Math.abs(drawEndX - drawStartX);
            const height = Math.abs(drawEndY - drawStartY);
            if (width >= 50 && height >= 50) {
                createMultiLineInput(drawStartX, drawEndX, drawStartY, drawEndY);
            } else if (width < 10 && height < 10) {
                createSingleLineInput(drawStartX, drawStartY, null);
            }
            drawStartX = drawStartY = drawEndX = drawEndY = 0;
            draw();
        }
        if (draggingNote) {
            // Если заметка все еще перетаскивается (не была перемещена в хранилище)
            if (draggingNote.isDragging) {
                draggingNote.rotation = (Math.random() - 0.5) * 0.1;
                if (!wasDragged && isUrl(draggingNote.text)) {
                    const coords = getCoordinates(draggingNote.text);
                    if (coords) {
                        const startX = offsetX;
                        const startY = offsetY;
                        const targetX = coords.x - window.innerWidth / 2;
                        const targetY = coords.y - window.innerHeight / 2;
                        const duration = 500;
                        const startTime = performance.now();
                        function animate(currentTime) {
                            const elapsed = currentTime - startTime;
                            const progress = Math.min(elapsed / duration, 1);
                            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
                            offsetX = startX + (targetX - startX) * easeOutCubic;
                            offsetY = startY + (targetY - startY) * easeOutCubic;
                            draw();
                            if (progress < 1) {
                                requestAnimationFrame(animate);
                            }
                        }
                        requestAnimationFrame(animate);
                    }
                }
                draggingNote.isDragging = false;
                draggingNote = null;
                isFromStorage = false; // Сбрасываем флаг
                draw();
                saveToStorage();
            }
        }
        if (resizingNote) {
            resizingNote = null;
            saveToStorage();
        }
    }
});

// Обновляем обработчик dblclick
canvas.addEventListener('dblclick', e => {
    console.log('Double click event');
    let x = e.clientX, y = e.clientY;
    let result = noteAt(x, y);
    let note = result ? result.note : null;
    console.log('Note at click position:', note);

    if (note) {
        if (note.type === 'image') {
            let input = document.createElement('input');
            input.type = 'text';
            input.value = note.caption || '';
            input.style.position = 'fixed';
            input.style.left = (note.x - offsetX + note.width/2) + 'px';
            input.style.top = (note.y - offsetY + note.height + 8) + 'px';
            input.style.zIndex = '10';
            input.style.fontSize = '14px';
            input.style.fontFamily = defaultFont;
            input.style.background = 'rgba(255, 255, 255, 0.9)';
            input.style.border = '1px solid #ccc';
            input.style.padding = '4px 8px';
            input.style.borderRadius = '4px';
            input.style.transform = 'translateX(-50%)';
            document.body.appendChild(input);
            input.focus();

            input.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    note.caption = input.value;
                    input.remove();
                    draw();
                    saveToStorage();
                } else if (e.key === 'Escape') {
                    input.remove();
                    draw();
                }
            });

            input.addEventListener('blur', () => {
                if (document.body.contains(input)) {
                    note.caption = input.value;
                    input.remove();
                    draw();
                    saveToStorage();
                }
            });
        } else {
            console.log('Starting text edit for note:', note);
        editingNote = note;
            if (note.isMultiLine) {
                createMultiLineInput(note.x, note.x + note.width, note.y, note.y + note.height, note);
            } else {
                createSingleLineInput(note.x, note.y, note);
            }
        }
    }
});

// Обновляем обработчик клика
canvas.addEventListener('click', e => {
    if (editingNote) return;
    if (drag) return;
    if (isDrawing) return;
    if (draggingNote) return;
    if (wasDragged) return; // Не обрабатываем клик, если был drag
    
    let x = e.clientX, y = e.clientY;
    let note = noteAt(x, y);
    if (!note) {
        return;
    } else if (isUrl(note.text)) {
        if (e.ctrlKey) {
            if (note.text.startsWith('http://') || note.text.startsWith('https://')) {
                window.open(note.text, '_blank');
            } else {
                window.open('https://' + note.text, '_blank');
            }
        }
        // Переход по координатам теперь только в mouseup
    }
});

// Обновляем обработчик колесика мыши для изменения размера изображений
canvas.addEventListener('wheel', e => {
    if (e.ctrlKey) return;
    let x = e.clientX, y = e.clientY;
    let note = noteAt(x, y);
    if (note) {
        e.preventDefault();
        if (note.type === 'image') {
            const scale = e.deltaY < 0 ? 1.1 : 0.9;
            note.width *= scale;
            note.height *= scale;
        } else {
        note.fontSize = note.fontSize || fontSize;
        if (e.deltaY < 0) {
            note.fontSize = Math.min(note.fontSize + 2, 64);
        } else {
            note.fontSize = Math.max(note.fontSize - 2, 8);
            }
        }
        draw();
        saveToStorage(); // Сохраняем после изменения размера
    }
}, { passive: false });

// Бесконечное расширение
window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    draw();
});

// Создание контекстного меню
function createContextMenu(x, y, result) {
    console.log('Creating context menu for note:', result);
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) {
        existingMenu.remove();
    }

    const note = result.note; // Получаем саму заметку из результата
    const isStored = result.isStored;

    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.position = 'fixed';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.style.background = 'white';
    menu.style.border = '1px solid #ccc';
    menu.style.borderRadius = '4px';
    menu.style.padding = '8px';
    menu.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    menu.style.zIndex = '1000';

    if (note.type !== 'image') {
        // Создаем контейнер для цветов
        const colorContainer = document.createElement('div');
        colorContainer.style.display = 'flex';
        colorContainer.style.gap = '8px';
        colorContainer.style.marginBottom = '8px';
        
        // Добавляем опции выбора цвета
        colorSchemes.forEach(scheme => {
            const colorBox = document.createElement('div');
            colorBox.style.width = '24px';
            colorBox.style.height = '24px';
            colorBox.style.background = scheme.bg;
            colorBox.style.border = '1px solid #ccc';
            colorBox.style.borderRadius = '4px';
            colorBox.style.cursor = 'pointer';
            colorBox.style.transition = 'transform 0.1s';
            
            // Добавляем эффект при наведении
            colorBox.addEventListener('mouseover', () => {
                colorBox.style.transform = 'scale(1.1)';
            });
            colorBox.addEventListener('mouseout', () => {
                colorBox.style.transform = 'scale(1)';
            });
            
            colorBox.addEventListener('click', () => {
                console.log('Color box clicked:', scheme);
                console.log('Note before color change:', note);
                note.bgColor = scheme.bg;
                note.textColor = scheme.text;
                console.log('Note after color change:', note);
                menu.remove();
                draw();
                saveToStorage();
            });
            
            colorContainer.appendChild(colorBox);
        });
        
        menu.appendChild(colorContainer);
    }

    const deleteOption = document.createElement('div');
    deleteOption.style.padding = '8px 16px';
    deleteOption.style.cursor = 'pointer';
    deleteOption.style.color = '#d32f2f';
    deleteOption.style.borderTop = '1px solid #ccc';
    deleteOption.style.marginTop = '8px';
    deleteOption.textContent = 'Удалить';
    deleteOption.addEventListener('click', () => {
        if (isStored) {
            const index = storedNotes.indexOf(note);
            if (index > -1) {
                storedNotes.splice(index, 1);
            }
        } else {
            const index = notes.indexOf(note);
            if (index > -1) {
                notes.splice(index, 1);
            }
        }
        menu.remove();
        draw();
        saveToStorage();
    });
    menu.appendChild(deleteOption);

    document.body.appendChild(menu);

    const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    };
    document.addEventListener('click', closeMenu);
}

// Добавляем обработчик правой кнопки мыши
canvas.addEventListener('contextmenu', e => {
    e.preventDefault(); // Предотвращаем стандартное контекстное меню
    let x = e.clientX, y = e.clientY;
    let note = noteAt(x, y);
    if (note) {
        createContextMenu(x, y, note);
    }
});

// Обновляем обработчик выхода мыши за пределы канваса
canvas.addEventListener('mouseleave', () => {
    coordsDisplay.textContent = '';
    hoveredNote = null;
    draw();
});

// Обновляем обработчик входа мыши на канвас
canvas.addEventListener('mouseenter', e => {
    const x = e.clientX, y = e.clientY;
    const canvasX = Math.round(x + offsetX);
    const canvasY = Math.round(y + offsetY);
    coordsDisplay.textContent = `x: ${canvasX}, y: ${canvasY}`;
});

// Обновляем функцию createMultiLineInput
function createMultiLineInput(startX, endX, startY, endY, existingNote = null) {
    console.log('Creating multi-line input for note:', existingNote);
    const width = existingNote ? existingNote.width : Math.abs(endX - startX);
    const height = existingNote ? existingNote.height : Math.abs(endY - startY);
    if (!existingNote && (width < 50 || height < 50)) return;

    const textarea = document.createElement('textarea');
    textarea.style.position = 'fixed';
    const left = existingNote ? existingNote.x : Math.min(startX, endX);
    const top = existingNote ? existingNote.y : Math.min(startY, endY);
    textarea.style.left = (left - offsetX) + 'px';
    textarea.style.top = (top - offsetY) + 'px';
    textarea.style.width = width + 'px';
    textarea.style.height = height + 'px';
    textarea.style.zIndex = '10';
    textarea.style.fontSize = (existingNote ? existingNote.fontSize : fontSize) + 'px';
    textarea.style.fontFamily = defaultFont;
    textarea.style.background = existingNote ? (existingNote.bgColor || colorSchemes[0].bg) : colorSchemes[0].bg;
    textarea.style.border = '1px solid #E6DFAF';
    textarea.style.padding = '8px';
    textarea.style.resize = 'none';
    textarea.style.borderRadius = '4px';
    textarea.style.boxSizing = 'border-box';
    textarea.style.lineHeight = '1.2';
    textarea.style.overflow = 'auto';
    textarea.style.whiteSpace = 'pre-wrap';
    textarea.style.wordWrap = 'break-word';
    textarea.style.color = existingNote ? (existingNote.textColor || colorSchemes[0].text) : colorSchemes[0].text;
    
    if (existingNote) {
        console.log('Setting textarea value to:', existingNote.text);
        textarea.value = existingNote.text || '';
    }
    
    document.body.appendChild(textarea);
    textarea.focus();

    const handleSubmit = () => {
        console.log('Handling submit for textarea');
        if (textarea.value.trim()) {
            if (existingNote) {
                console.log('Updating existing note:', existingNote);
                existingNote.text = textarea.value;
                existingNote.bgColor = existingNote.bgColor || colorSchemes[0].bg;
                existingNote.textColor = existingNote.textColor || colorSchemes[0].text;
            } else {
                console.log('Creating new note');
                notes.push({
                    text: textarea.value,
                    x: left,
                    y: top,
                    width: width,
                    height: height,
                    fontSize: fontSize,
                    isMultiLine: true,
                    lineHeight: 1.2,
                    bgColor: colorSchemes[0].bg,
                    textColor: colorSchemes[0].text
                });
            }
        }
        textarea.remove();
        draw();
        saveToStorage();
    };

    textarea.addEventListener('keydown', e => {
        if (e.key === 'Enter' && e.ctrlKey) {
            handleSubmit();
        } else if (e.key === 'Escape') {
            textarea.remove();
        }
    });

    textarea.addEventListener('blur', () => {
        if (document.body.contains(textarea)) {
            handleSubmit();
        }
    });
}

// Обновляем функцию createSingleLineInput
function createSingleLineInput(x, y, note) {
    let input = document.createElement('input');
    input.type = 'text';
    input.value = note ? (note.text || '') : '';
    input.style.position = 'fixed';
    input.style.left = (x - offsetX) + 'px';
    input.style.top = (y - offsetY) + 'px';
    input.style.zIndex = '10';
    input.style.fontSize = (note ? (note.fontSize || fontSize) : fontSize) + 'px';
    input.style.fontFamily = defaultFont;
    input.style.background = note ? (note.bgColor || colorSchemes[0].bg) : colorSchemes[0].bg;
    input.style.border = '1px solid #E6DFAF';
    input.style.padding = '2px 4px';
    input.style.color = note ? (note.textColor || colorSchemes[0].text) : colorSchemes[0].text;
    document.body.appendChild(input);
    input.focus();

    const handleSubmit = () => {
        if (note) {
            note.text = input.value;
            note.bgColor = note.bgColor || colorSchemes[0].bg;
            note.textColor = note.textColor || colorSchemes[0].text;
        } else if (input.value.trim()) {
            notes.push({
                text: input.value,
                x: x,
                y: y,
                fontSize: fontSize,
                bgColor: colorSchemes[0].bg,
                textColor: colorSchemes[0].text
            });
        }
        input.remove();
        editingNote = null;
        draw();
        saveToStorage();
    };

    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            handleSubmit();
        } else if (e.key === 'Escape') {
            input.remove();
            editingNote = null;
            draw();
        }
    });

    input.addEventListener('blur', () => {
        if (document.body.contains(input)) {
            handleSubmit();
        }
    });
}

// Загружаем сохраненные данные при инициализации
loadFromStorage();
draw();
