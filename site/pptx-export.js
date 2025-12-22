// ===== ЭКСПОРТ ПРЕЗЕНТАЦИЙ В PPTX =====

// Маппинг градиентов из CSS в PPTX формат
const gradientColors = {
    'gradient-1': { colors: ['667eea', '764ba2'], angle: 135 },
    'gradient-2': { colors: ['f093fb', 'f5576c'], angle: 135 },
    'gradient-3': { colors: ['4facfe', '00f2fe'], angle: 135 },
    'gradient-4': { colors: ['43e97b', '38f9d7'], angle: 135 },
    'gradient-5': { colors: ['fa709a', 'fee140'], angle: 135 },
    'gradient-6': { colors: ['a18cd1', 'fbc2eb'], angle: 135 },
    'gradient-7': { colors: ['ff9a9e', 'fecfef'], angle: 135 },
    'gradient-8': { colors: ['667eea', '764ba2'], angle: 135 }
};

function exportToPPTX() {
    if (!currentPresentation) {
        alert('Нет открытой презентации для экспорта');
        return;
    }

    // Загружаем библиотеку PptxGenJS динамически
    if (typeof PptxGenJS === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js';
        script.onload = () => performExport();
        script.onerror = () => alert('Ошибка загрузки библиотеки экспорта. Проверьте подключение к интернету.');
        document.head.appendChild(script);
    } else {
        performExport();
    }
}

function performExport() {
    const pptx = new PptxGenJS();
    
    // Настройки презентации
    pptx.layout = 'LAYOUT_16x9';
    pptx.author = 'EduPortal';
    pptx.title = currentPresentation.title || 'Презентация';
    pptx.subject = currentDiscipline ? currentDiscipline.name : 'Образовательный материал';
    
    const gradients = ['gradient-1', 'gradient-2', 'gradient-3', 'gradient-4', 'gradient-5', 'gradient-6', 'gradient-7', 'gradient-8'];
    
    // Экспортируем каждый слайд
    currentPresentation.slides.forEach((slideData, index) => {
        const slide = pptx.addSlide();
        const gradientClass = gradients[index % gradients.length];
        const gradient = gradientColors[gradientClass];
        
        // Устанавливаем фон слайда (градиент)
        if (gradient) {
            slide.background = {
                fill: gradient.colors[0]
            };
        }
        
        // Добавляем декоративные элементы (круги)
        addDecorativeElements(slide, gradient);
        
        // Рендерим контент в зависимости от типа слайда
        switch (slideData.type) {
            case 'title':
                exportTitleSlide(slide, slideData);
                break;
            case 'content':
                exportContentSlide(slide, slideData);
                break;
            case 'two-column':
                exportTwoColumnSlide(slide, slideData);
                break;
            case 'comparison':
                exportComparisonSlide(slide, slideData);
                break;
            case 'highlight':
                exportHighlightSlide(slide, slideData);
                break;
            case 'quote':
                exportQuoteSlide(slide, slideData);
                break;
            case 'grid':
                exportGridSlide(slide, slideData);
                break;
            case 'list':
                exportListSlide(slide, slideData);
                break;
            default:
                exportContentSlide(slide, slideData);
        }
    });
    
    // Сохраняем файл
    const fileName = `${currentPresentation.title || 'presentation'}.pptx`;
    pptx.writeFile({ fileName: fileName });
}

function addDecorativeElements(slide, gradient) {
    if (!gradient) return;
    
    // Добавляем 3 декоративных круга с прозрачностью
    const circles = [
        { x: '85%', y: '10%', w: 1.5, h: 1.5 },
        { x: '5%', y: '70%', w: 2, h: 2 },
        { x: '75%', y: '75%', w: 1.2, h: 1.2 }
    ];
    
    circles.forEach(circle => {
        slide.addShape('ellipse', {
            x: circle.x,
            y: circle.y,
            w: circle.w,
            h: circle.h,
            fill: { color: 'FFFFFF', transparency: 90 }
        });
    });
}

function normalizeText(text) {
    if (!text) return '';
    return String(text).replace(/^[\s\u00A0]*\?[\s\u00A0]*/u, '• ');
}

function exportTitleSlide(slide, slideData) {
    // Главный заголовок по центру
    slide.addText(slideData.title || '', {
        x: '10%',
        y: '35%',
        w: '80%',
        h: 2,
        fontSize: 48,
        bold: true,
        color: 'FFFFFF',
        align: 'center',
        valign: 'middle',
        fontFace: 'Arial'
    });
    
    // Подзаголовок
    if (slideData.subtitle) {
        slide.addText(slideData.subtitle, {
            x: '10%',
            y: '55%',
            w: '80%',
            h: 1,
            fontSize: 24,
            color: 'FFFFFF',
            align: 'center',
            valign: 'middle',
            fontFace: 'Arial',
            transparency: 20
        });
    }
}

function exportContentSlide(slide, slideData) {
    let yPos = 0.4;
    
    // Заголовок
    if (slideData.title) {
        slide.addText(slideData.title, {
            x: 0.4,
            y: yPos,
            w: 9.2,
            fontSize: 22,
            bold: true,
            color: 'FFFFFF',
            fontFace: 'Arial'
        });
        yPos += 1.5;
    }
    
    // Контент
    if (slideData.content && Array.isArray(slideData.content)) {
        const maxItems = Math.min(slideData.content.length, 5);
        slideData.content.slice(0, maxItems).forEach(text => {
            const normalizedText = normalizeText(text);
            slide.addText(normalizedText, {
                x: 0.4,
                y: yPos,
                w: 9.2,
                fontSize: 14,
                color: 'FFFFFF',
                fontFace: 'Arial',
                lineSpacing: 20
            });
            yPos += 0.8;
        });
    }
}

function exportTwoColumnSlide(slide, slideData) {
    let yPos = 0.4;
    
    // Заголовок
    if (slideData.title) {
        slide.addText(slideData.title, {
            x: 0.4,
            y: yPos,
            w: 9.2,
            fontSize: 22,
            bold: true,
            color: 'FFFFFF',
            fontFace: 'Arial'
        });
        yPos += 1.5;
    }
    
    // Левая колонка
    if (slideData.leftContent) {
        let leftY = yPos;
        const maxItems = Math.min(slideData.leftContent.length, 4);
        slideData.leftContent.slice(0, maxItems).forEach(text => {
            const normalizedText = normalizeText(text);
            slide.addText(normalizedText, {
                x: 0.4,
                y: leftY,
                w: 4.6,
                fontSize: 12,
                color: 'FFFFFF',
                fontFace: 'Arial',
                lineSpacing: 18
            });
            leftY += 0.75;
        });
    }
    
    // Правая колонка
    if (slideData.rightContent) {
        let rightY = yPos;
        const maxItems = Math.min(slideData.rightContent.length, 4);
        slideData.rightContent.slice(0, maxItems).forEach(text => {
            const normalizedText = normalizeText(text);
            slide.addText(normalizedText, {
                x: 5.2,
                y: rightY,
                w: 4.6,
                fontSize: 12,
                color: 'FFFFFF',
                fontFace: 'Arial',
                lineSpacing: 18
            });
            rightY += 0.75;
        });
    }
}

function exportComparisonSlide(slide, slideData) {
    let yPos = 0.4;
    
    // Заголовок
    if (slideData.title) {
        slide.addText(slideData.title, {
            x: 0.4,
            y: yPos,
            w: 9.2,
            fontSize: 22,
            bold: true,
            color: 'FFFFFF',
            fontFace: 'Arial'
        });
        yPos += 1.5;
    }
    
    // Левая колонка
    if (slideData.leftColumn) {
        slide.addText(slideData.leftColumn.title, {
            x: 0.5,
            y: yPos,
            w: 4.25,
            h: 0.6,
            fontSize: 24,
            bold: true,
            color: 'FFFFFF',
            fontFace: 'Arial'
        });
        
        let leftY = yPos + 0.8;
        slideData.leftColumn.items.forEach(item => {
            const normalizedText = normalizeText(item);
            slide.addText('✓ ' + normalizedText, {
                x: 0.5,
                y: leftY,
                w: 4.25,
                h: 'auto',
                fontSize: 14,
                color: 'FFFFFF',
                fontFace: 'Arial',
                lineSpacing: 22
            });
            leftY += 0.5;
        });
    }
    
    // Правая колонка
    if (slideData.rightColumn) {
        slide.addText(slideData.rightColumn.title, {
            x: 5.25,
            y: yPos,
            w: 4.25,
            h: 0.6,
            fontSize: 24,
            bold: true,
            color: 'FFFFFF',
            fontFace: 'Arial'
        });
        
        let rightY = yPos + 0.8;
        slideData.rightColumn.items.forEach(item => {
            const normalizedText = normalizeText(item);
            slide.addText('✓ ' + normalizedText, {
                x: 5.25,
                y: rightY,
                w: 4.25,
                h: 'auto',
                fontSize: 14,
                color: 'FFFFFF',
                fontFace: 'Arial',
                lineSpacing: 22
            });
            rightY += 0.5;
        });
    }
}

function exportHighlightSlide(slide, slideData) {
    let yPos = 0.4;
    
    // Заголовок
    if (slideData.title) {
        slide.addText(slideData.title, {
            x: 0.4,
            y: yPos,
            w: 9.2,
            fontSize: 22,
            bold: true,
            color: 'FFFFFF',
            fontFace: 'Arial'
        });
        yPos += 1.5;
    }
    
    // Блок с выделенным текстом
    if (slideData.highlightText) {
        const normalizedText = normalizeText(slideData.highlightText);
        
        // Фоновый прямоугольник (полупрозрачный)
        slide.addShape('rect', {
            x: 1.2,
            y: yPos,
            w: 7.6,
            h: 2.5,
            fill: { color: 'FFFFFF', transparency: 85 },
            line: { type: 'none' }
        });
        
        // Текст (обрезаем если слишком длинный)
        const shortText = normalizedText.length > 180 ? normalizedText.substring(0, 180) + '...' : normalizedText;
        slide.addText(shortText, {
            x: 1.4,
            y: yPos + 0.4,
            w: 7.2,
            h: 1.7,
            fontSize: 16,
            color: 'FFFFFF',
            fontFace: 'Arial',
            align: 'center',
            valign: 'middle',
            italic: true,
            lineSpacing: 24
        });
    }
}

function exportQuoteSlide(slide, slideData) {
    let yPos = 0.4;
    
    // Заголовок
    if (slideData.title) {
        slide.addText(slideData.title, {
            x: 0.4,
            y: yPos,
            w: 9.2,
            fontSize: 22,
            bold: true,
            color: 'FFFFFF',
            fontFace: 'Arial'
        });
        yPos += 1.5;
    }
    
    // Цитата
    if (slideData.quote) {
        const normalizedText = normalizeText(slideData.quote);
        const shortQuote = normalizedText.length > 220 ? normalizedText.substring(0, 220) + '...' : normalizedText;
        slide.addText('"' + shortQuote + '"', {
            x: 1.2,
            y: yPos,
            w: 7.6,
            fontSize: 18,
            color: 'FFFFFF',
            fontFace: 'Arial',
            align: 'center',
            valign: 'middle',
            italic: true,
            lineSpacing: 28
        });
        yPos += 3.0;
    }
    
    // Автор
    if (slideData.author) {
        slide.addText('— ' + slideData.author, {
            x: 1.2,
            y: yPos,
            w: 7.6,
            fontSize: 16,
            color: 'FFFFFF',
            fontFace: 'Arial',
            align: 'right',
            transparency: 20
        });
    }
}

function exportGridSlide(slide, slideData) {
    let yPos = 0.5;
    
    // Заголовок
    if (slideData.title) {
        slide.addText(slideData.title, {
            x: 0.4,
            y: yPos,
            w: 9.2,
            h: 0.6,
            fontSize: 24,
            bold: true,
            color: 'FFFFFF',
            fontFace: 'Arial'
        });
        yPos += 0.8;
    }
    
    // Сетка элементов (4 колонки для полноэкранного режима)
    if (slideData.gridItems) {
        const itemsPerRow = 4;
        const itemWidth = 2.3;
        const itemHeight = 2.2;
        const gapX = 0.15;
        const gapY = 0.2;
        const startX = 0.4;
        
        // Ограничиваем до 8 элементов (2 ряда по 4)
        const maxItems = Math.min(slideData.gridItems.length, 8);
        
        for (let index = 0; index < maxItems; index++) {
            const item = slideData.gridItems[index];
            const col = index % itemsPerRow;
            const row = Math.floor(index / itemsPerRow);
            const x = startX + col * (itemWidth + gapX);
            const y = yPos + row * (itemHeight + gapY);
            
            // Фон элемента (полупрозрачный, как на сайте)
            slide.addShape('rect', {
                x: x,
                y: y,
                w: itemWidth,
                h: itemHeight,
                fill: { color: 'FFFFFF', transparency: 85 },
                line: { type: 'none' }
            });
            
            // Иконка
            if (item.icon) {
                slide.addText(item.icon, {
                    x: x + 0.15,
                    y: y + 0.15,
                    w: 0.5,
                    h: 0.5,
                    fontSize: 24,
                    color: 'FFFFFF',
                    fontFace: 'Arial',
                    align: 'center',
                    valign: 'middle'
                });
            }
            
            // Заголовок элемента
            slide.addText(item.title, {
                x: x + 0.1,
                y: y + 0.7,
                w: itemWidth - 0.2,
                fontSize: 11,
                bold: true,
                color: 'FFFFFF',
                fontFace: 'Arial',
                align: 'center'
            });
            
            // Текст элемента (обрезаем длинный текст)
            const normalizedText = normalizeText(item.text);
            const shortText = normalizedText.length > 120 ? normalizedText.substring(0, 120) + '...' : normalizedText;
            slide.addText(shortText, {
                x: x + 0.1,
                y: y + 1.1,
                w: itemWidth - 0.2,
                h: 1.0,
                fontSize: 8,
                color: 'FFFFFF',
                fontFace: 'Arial',
                align: 'center',
                valign: 'top',
                lineSpacing: 14
            });
        }
    }
}

function exportListSlide(slide, slideData) {
    let yPos = 0.5;
    
    // Заголовок
    if (slideData.title) {
        slide.addText(slideData.title, {
            x: 0.4,
            y: yPos,
            w: 9.2,
            h: 0.6,
            fontSize: 22,
            bold: true,
            color: 'FFFFFF',
            fontFace: 'Arial'
        });
        yPos += 0.8;
    }
    
    // Элементы списка (ограничиваем до 4 элементов)
    if (slideData.listItems) {
        const maxItems = Math.min(slideData.listItems.length, 4);
        
        for (let i = 0; i < maxItems; i++) {
            const item = slideData.listItems[i];
            
            // Фон элемента (полупрозрачный)
            slide.addShape('rect', {
                x: 0.4,
                y: yPos,
                w: 9.2,
                h: 1.0,
                fill: { color: 'FFFFFF', transparency: 85 },
                line: { type: 'none' }
            });
            
            // Заголовок элемента
            slide.addText(item.title, {
                x: 0.6,
                y: yPos + 0.1,
                w: 8.8,
                fontSize: 13,
                bold: true,
                color: 'FFFFFF',
                fontFace: 'Arial'
            });
            
            // Текст элемента (обрезаем если слишком длинный)
            const normalizedText = normalizeText(item.text);
            const shortText = normalizedText.length > 100 ? normalizedText.substring(0, 100) + '...' : normalizedText;
            slide.addText(shortText, {
                x: 0.6,
                y: yPos + 0.45,
                w: 8.8,
                fontSize: 10,
                color: 'FFFFFF',
                fontFace: 'Arial',
                lineSpacing: 16
            });
            
            yPos += 1.15;
        }
    }
}
