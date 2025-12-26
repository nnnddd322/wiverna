// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
var currentCategory = null;
var currentDiscipline = null;
var currentPresentation = null;
var currentSlideIndex = 0;

// Категории дисциплин
var categories = [
    {
        id: 'code-presentations',
        name: 'Презентации через код',
        description: 'Дисциплины с презентациями, созданными через код',
        icon: 'fa-code'
    },
    {
        id: 'pptx-presentations',
        name: 'Презентации из PPTX',
        description: 'Дисциплины с загруженными PPTX презентациями',
        icon: 'fa-file-powerpoint'
    }
];

function normalizeSlideText(text) {
    if (text === null || text === undefined) return '';
    const s = String(text);
    return s.replace(/^[\s\u00A0]*\?[\s\u00A0]*/u, '• ');
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    renderDisciplines();
    setupKeyboardNavigation();
    setupScrollAnimations();
    
    document.getElementById('back-to-categories').addEventListener('click', () => {
        showSection('disciplines');
    });
    
    document.getElementById('back-to-disciplines').addEventListener('click', () => {
        showSection('category-disciplines');
    });
    
    document.getElementById('back-to-presentations').addEventListener('click', () => {
        showSection('presentations');
    });
});

// ===== НАВИГАЦИЯ ПО СЕКЦИЯМ =====
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
    }
    
    const navLink = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
    if (navLink) {
        navLink.classList.add('active');
    }
    
    window.scrollTo(0, 0);
    document.body.classList.remove('fullscreen');
}

// ===== РЕНДЕР КАТЕГОРИЙ =====
function renderDisciplines() {
    const grid = document.getElementById('disciplines-grid');
    grid.innerHTML = '';
    
    categories.forEach((category, index) => {
        const card = document.createElement('div');
        card.className = 'discipline-card';
        card.style.animationDelay = `${index * 0.1}s`;
        card.innerHTML = `
            <div class="card-icon">
                <i class="fas ${category.icon}"></i>
            </div>
            <h3 class="card-title">${category.name}</h3>
            <p class="card-subtitle">${category.description}</p>
        `;
        card.addEventListener('click', () => openCategory(category.id));
        grid.appendChild(card);
    });
}

// ===== ОТКРЫТИЕ КАТЕГОРИИ =====
function openCategory(categoryId) {
    currentCategory = categories.find(c => c.id === categoryId);
    if (!currentCategory) return;
    
    document.getElementById('category-title').textContent = currentCategory.name;
    
    const grid = document.getElementById('category-disciplines-grid');
    grid.innerHTML = '';
    
    const icons = ['fa-book', 'fa-chalkboard-teacher', 'fa-brain', 'fa-users', 'fa-child', 'fa-heart', 'fa-lightbulb', 'fa-globe', 'fa-hands-helping', 'fa-star', 'fa-user-friends', 'fa-chart-bar', 'fa-clipboard-check', 'fa-project-diagram', 'fa-comments', 'fa-graduation-cap'];
    
    // Показываем дисциплины только из категории "Презентации через код"
    if (categoryId === 'code-presentations') {
        disciplines.forEach((discipline, index) => {
            if (discipline.hidden) return;
            
            const card = document.createElement('div');
            card.className = 'discipline-card';
            card.style.animationDelay = `${index * 0.1}s`;
            card.innerHTML = `
                <div class="card-icon">
                    <i class="fas ${icons[index % icons.length]}"></i>
                </div>
                <h3 class="card-title">${discipline.name}</h3>
                <p class="card-subtitle">${discipline.description}</p>
                <div class="card-meta">
                    <span class="meta-item">
                        <i class="fas fa-file-powerpoint"></i>
                        ${discipline.presentations.filter(p => !p.hidden).length} презентаций
                    </span>
                </div>
            `;
            card.addEventListener('click', () => openDiscipline(discipline.id));
            grid.appendChild(card);
        });
    } else {
        // Для категории PPTX пока показываем заглушку
        const placeholder = document.createElement('div');
        placeholder.className = 'under-development';
        placeholder.innerHTML = `
            <div class="dev-badge">Скоро</div>
            <i class="fas fa-tools" style="font-size: 4rem; color: var(--primary); margin-bottom: 20px;"></i>
            <h3>Раздел в разработке</h3>
            <p>Функционал загрузки PPTX презентаций будет доступен в ближайшее время</p>
        `;
        grid.appendChild(placeholder);
    }
    
    showSection('category-disciplines');
}

// ===== ОТКРЫТИЕ ДИСЦИПЛИНЫ =====
function openDiscipline(disciplineId) {
    currentDiscipline = disciplines.find(d => d.id === disciplineId);
    if (!currentDiscipline) return;
    
    document.getElementById('presentations-title').textContent = currentDiscipline.name;
    
    // Показываем/скрываем переключатель в зависимости от наличия лекций или PDF
    const toggle = document.getElementById('view-toggle');
    const toggleLectures = document.getElementById('toggle-lectures');
    const togglePdfs = document.getElementById('toggle-pdfs');
    const hasLectures = lecturesData && lecturesData[currentDiscipline.id] && lecturesData[currentDiscipline.id].lectures;
    const hasPdfs = currentDiscipline.pdfFiles && currentDiscipline.pdfFiles.length > 0;
    
    // ID дисциплин 1-8 (для которых нужно скрыть кнопку "Лекции" и показать "PDF" как "Лекции")
    const disciplines1to8 = ['pedagogy', 'learning-theory', 'educational-methodology', 'correctional-pedagogy', 
                            'developmental-psychology', 'special-psychology', 'educational-psychology'];
    const isDiscipline1to8 = disciplines1to8.includes(currentDiscipline.id);
    
    // Для дисциплин 1-8 скрываем кнопку "Лекции" (текстовые лекции) и показываем кнопку PDF как "Лекции"
    if (toggleLectures) {
        if (isDiscipline1to8) {
            toggleLectures.style.display = 'none'; // Скрываем кнопку текстовых лекций
        } else {
            toggleLectures.style.display = hasLectures ? 'inline-flex' : 'none';
        }
    }
    
    // Показываем/скрываем кнопку PDF в зависимости от наличия PDF файлов
    if (togglePdfs) {
        if (hasPdfs) {
            togglePdfs.style.display = 'inline-flex';
        } else {
            togglePdfs.style.display = 'none';
        }
    }
    
    if (hasLectures || hasPdfs) {
        toggle.style.display = 'flex';
        // По умолчанию показываем презентации
        document.getElementById('toggle-presentations').classList.add('active');
        if (toggleLectures && !isDiscipline1to8) {
            toggleLectures.classList.remove('active');
        }
        if (togglePdfs) {
            togglePdfs.classList.remove('active');
        }
    } else {
        toggle.style.display = 'none';
    }
    
    renderPresentationsOnly();
    showSection('presentations');
}

// ===== ПОКАЗАТЬ ПРЕЗЕНТАЦИИ =====
function showPresentationsView() {
    document.getElementById('toggle-presentations').classList.add('active');
    const toggleLectures = document.getElementById('toggle-lectures');
    if (toggleLectures && toggleLectures.style.display !== 'none') {
        toggleLectures.classList.remove('active');
    }
    const togglePdfs = document.getElementById('toggle-pdfs');
    if (togglePdfs) {
        togglePdfs.classList.remove('active');
    }
    renderPresentationsOnly();
}

// ===== ПОКАЗАТЬ ЛЕКЦИИ =====
function showLecturesView() {
    document.getElementById('toggle-presentations').classList.remove('active');
    const toggleLectures = document.getElementById('toggle-lectures');
    if (toggleLectures && toggleLectures.style.display !== 'none') {
        toggleLectures.classList.add('active');
    }
    const togglePdfs = document.getElementById('toggle-pdfs');
    if (togglePdfs) {
        togglePdfs.classList.remove('active');
    }
    renderLecturesOnly();
}

// ===== ПОКАЗАТЬ PDF (переименовано в "Лекции" для дисциплин 1-8) =====
function showPdfsView() {
    document.getElementById('toggle-presentations').classList.remove('active');
    const toggleLectures = document.getElementById('toggle-lectures');
    if (toggleLectures && toggleLectures.style.display !== 'none') {
        toggleLectures.classList.remove('active');
    }
    document.getElementById('toggle-pdfs').classList.add('active');
    renderPdfsOnly();
}

// ===== РЕНДЕР ТОЛЬКО ПРЕЗЕНТАЦИЙ =====
function renderPresentationsOnly() {
    const grid = document.getElementById('presentations-grid');
    grid.innerHTML = '';
    
    currentDiscipline.presentations.forEach((presentation, index) => {
        if (presentation.hidden) return;
        
        const card = document.createElement('div');
        card.className = 'presentation-card';
        card.style.animationDelay = `${index * 0.1}s`;
        card.innerHTML = `
            <div class="card-icon">
                <i class="fas fa-play-circle"></i>
            </div>
            <h3 class="card-title">${presentation.title}</h3>
            <div class="card-meta">
                <span class="meta-item">
                    <i class="fas fa-images"></i>
                    ${presentation.slides.length} слайдов
                </span>
            </div>
        `;
        card.addEventListener('click', function() { openPresentation(index); });
        grid.appendChild(card);
    });
}

// ===== РЕНДЕР ТОЛЬКО ЛЕКЦИЙ =====
function renderLecturesOnly() {
    const grid = document.getElementById('presentations-grid');
    grid.innerHTML = '';
    
    if (!lecturesData || !lecturesData[currentDiscipline.id]) return;
    
    lecturesData[currentDiscipline.id].lectures.forEach((lecture, index) => {
        const card = document.createElement('div');
        card.className = 'presentation-card lecture-card';
        card.style.animationDelay = `${index * 0.1}s`;
        card.innerHTML = `
            <div class="card-icon">
                <i class="fas fa-book-open"></i>
            </div>
            <h3 class="card-title">${lecture.title}</h3>
            <div class="card-meta">
                <span class="meta-item">
                    <i class="fas fa-file-alt"></i>
                    Полный текст лекции
                </span>
            </div>
        `;
        card.addEventListener('click', function() { openLecture(lecture.id); });
        grid.appendChild(card);
    });
}

// ===== РЕНДЕР ТОЛЬКО PDF =====
function renderPdfsOnly() {
    const grid = document.getElementById('presentations-grid');
    grid.innerHTML = '';
    
    if (!currentDiscipline.pdfFiles || currentDiscipline.pdfFiles.length === 0) {
        grid.innerHTML = '<div class="empty-state"><p>PDF файлы для этой дисциплины пока не добавлены</p></div>';
        return;
    }
    
    currentDiscipline.pdfFiles.forEach((pdf, index) => {
        const card = document.createElement('div');
        card.className = 'presentation-card pdf-card';
        card.style.animationDelay = `${index * 0.1}s`;
        card.innerHTML = `
            <div class="card-icon">
                <i class="fas fa-file-pdf"></i>
            </div>
            <h3 class="card-title">${pdf.title || pdf.fileName}</h3>
            <div class="card-meta">
                <span class="meta-item">
                    <i class="fas fa-file-pdf"></i>
                    PDF документ
                </span>
            </div>
        `;
        card.addEventListener('click', function() { openPdf(pdf.path, pdf.fileName); });
        grid.appendChild(card);
    });
}

// ===== ОТКРЫТИЕ PDF =====
function openPdf(pdfPath, fileName) {
    // Открываем PDF в новой вкладке
    window.open(pdfPath, '_blank');
}

// ===== ОТКРЫТИЕ ПРЕЗЕНТАЦИИ =====
function openPresentation(presentationIndex) {
    currentPresentation = currentDiscipline.presentations[presentationIndex];
    if (!currentPresentation) return;
    
    currentSlideIndex = 0;
    document.getElementById('viewer-title').textContent = currentPresentation.title;
    document.getElementById('total-slides').textContent = currentPresentation.slides.length;
    
    // Показываем элементы управления слайдами
    const slideCounter = document.getElementById('slide-counter');
    const thumbnailsContainer = document.getElementById('thumbnails-container');
    
    if (slideCounter) slideCounter.style.display = 'flex';
    if (thumbnailsContainer) thumbnailsContainer.style.display = 'block';
    
    renderSlides();
    renderThumbnails();
    updateSlideCounter();
    showSection('viewer');
}

// ===== РЕНДЕР СЛАЙДОВ =====
function renderSlides() {
    const container = document.getElementById('slides-container');
    container.innerHTML = '';
    
    const gradients = ['gradient-1', 'gradient-2', 'gradient-3', 'gradient-4', 'gradient-5', 'gradient-6', 'gradient-7', 'gradient-8'];
    
    currentPresentation.slides.forEach((slide, index) => {
        const gradient = gradients[index % gradients.length];
        const slideEl = createSlideElement(slide, index, gradient);
        container.appendChild(slideEl);
    });
    
    updateActiveSlide();
}

function createSlideElement(slide, index, gradient) {
    const slideEl = document.createElement('div');
    slideEl.className = `slide ${gradient}`;
    slideEl.dataset.index = index;
    
    // Декоративные элементы
    slideEl.innerHTML = `
        <div class="slide-decoration decoration-1"></div>
        <div class="slide-decoration decoration-2"></div>
        <div class="slide-decoration decoration-3"></div>
    `;
    
    switch (slide.type) {
        case 'title':
            slideEl.innerHTML += createTitleSlide(slide);
            break;
        case 'content':
            slideEl.innerHTML += createContentSlide(slide);
            break;
        case 'two-column':
            slideEl.innerHTML += createTwoColumnSlide(slide);
            break;
        case 'comparison':
            slideEl.innerHTML += createComparisonSlide(slide);
            break;
        case 'highlight':
            slideEl.innerHTML += createHighlightSlide(slide);
            break;
        case 'quote':
            slideEl.innerHTML += createQuoteSlide(slide);
            break;
        case 'grid':
            slideEl.innerHTML += createGridSlide(slide);
            break;
        case 'list':
            slideEl.innerHTML += createListSlide(slide);
            break;
        default:
            slideEl.innerHTML += createContentSlide(slide);
    }
    
    return slideEl;
}

function createTitleSlide(slide) {
    return `
        <div class="slide-center">
            <h1 class="slide-main-title">${slide.title || ''}</h1>
            ${slide.subtitle ? `<p class="slide-main-subtitle">${slide.subtitle}</p>` : ''}
        </div>
    `;
}

function createContentSlide(slide) {
    let wrapperClass = 'slide-content-wrapper';
    
    if (slide.content && Array.isArray(slide.content)) {
        if (slide.content.length === 1) {
            wrapperClass += ' single-text';
        } else if (slide.content.length === 2) {
            wrapperClass += ' double-text';
        }
    }
    
    let html = `<div class="${wrapperClass}">`;
    
    if (slide.title) {
        html += `<h2 class="slide-title">${slide.title}</h2>`;
    }
    
    if (slide.content && Array.isArray(slide.content)) {
        html += `<div class="slide-text-content">`;
        slide.content.forEach(text => {
            html += `<p class="slide-paragraph">${normalizeSlideText(text)}</p>`;
        });
        html += `</div>`;
    }
    
    html += `</div>`;
    return html;
}

function createTwoColumnSlide(slide) {
    let html = `<div class="slide-two-column-wrapper">`;
    
    if (slide.title) {
        html += `<h2 class="slide-title">${slide.title}</h2>`;
    }
    
    html += `<div class="slide-columns">`;
    
    if (slide.leftContent) {
        html += `<div class="slide-column">`;
        slide.leftContent.forEach(text => {
            html += `<p class="slide-paragraph">${normalizeSlideText(text)}</p>`;
        });
        html += `</div>`;
    }
    
    if (slide.rightContent) {
        html += `<div class="slide-column">`;
        slide.rightContent.forEach(text => {
            html += `<p class="slide-paragraph">${normalizeSlideText(text)}</p>`;
        });
        html += `</div>`;
    }
    
    html += `</div></div>`;
    return html;
}

function createComparisonSlide(slide) {
    let html = `<div class="slide-comparison-wrapper">`;
    
    if (slide.title) {
        html += `<h2 class="slide-title">${slide.title}</h2>`;
    }
    
    html += `<div class="slide-comparison">`;
    
    if (slide.leftColumn) {
        html += `
            <div class="comparison-column">
                <h3 class="comparison-title">${slide.leftColumn.title}</h3>
                <ul class="comparison-list">
                    ${slide.leftColumn.items.map(item => `<li><i class="fas fa-check-circle"></i><span>${normalizeSlideText(item)}</span></li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    if (slide.rightColumn) {
        html += `
            <div class="comparison-column">
                <h3 class="comparison-title">${slide.rightColumn.title}</h3>
                <ul class="comparison-list">
                    ${slide.rightColumn.items.map(item => `<li><i class="fas fa-check-circle"></i><span>${normalizeSlideText(item)}</span></li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    html += `</div></div>`;
    return html;
}

function createHighlightSlide(slide) {
    return `
        <div class="slide-highlight-wrapper">
            ${slide.title ? `<h2 class="slide-title">${slide.title}</h2>` : ''}
            <div class="highlight-box">
                <i class="fas fa-quote-left highlight-icon"></i>
                <p class="highlight-text">${normalizeSlideText(slide.highlightText || '')}</p>
            </div>
        </div>
    `;
}

function createQuoteSlide(slide) {
    return `
        <div class="slide-quote-wrapper">
            ${slide.title ? `<h2 class="slide-title">${slide.title}</h2>` : ''}
            <blockquote class="slide-quote">
                <i class="fas fa-quote-left quote-icon"></i>
                <p class="quote-text">${normalizeSlideText(slide.quote || '')}</p>
                ${slide.author ? `<footer class="quote-author">— ${slide.author}</footer>` : ''}
            </blockquote>
        </div>
    `;
}

function createGridSlide(slide) {
    let html = `<div class="slide-grid-wrapper">`;
    
    if (slide.title) {
        html += `<h2 class="slide-title">${slide.title}</h2>`;
    }
    
    if (slide.gridItems) {
        html += `<div class="slide-grid">`;
        slide.gridItems.forEach(item => {
            html += `
                <div class="grid-item">
                    ${item.icon ? `<span class="grid-icon">${item.icon}</span>` : ''}
                    <h4 class="grid-item-title">${item.title}</h4>
                    <p class="grid-item-text">${normalizeSlideText(item.text)}</p>
                </div>
            `;
        });
        html += `</div>`;
    }
    
    html += `</div>`;
    return html;
}

function createListSlide(slide) {
    let html = `<div class="slide-list-wrapper">`;
    
    if (slide.title) {
        html += `<h2 class="slide-title">${slide.title}</h2>`;
    }
    
    if (slide.listItems) {
        html += `<div class="slide-list-items">`;
        slide.listItems.forEach(item => {
            const colorClass = item.color ? `list-item-${item.color}` : '';
            html += `
                <div class="list-item ${colorClass} ${item.highlight ? 'highlighted' : ''}">
                    <h4 class="list-item-title">${item.title}</h4>
                    <p class="list-item-text">${normalizeSlideText(item.text)}</p>
                </div>
            `;
        });
        html += `</div>`;
    }
    
    html += `</div>`;
    return html;
}

// ===== РЕНДЕР МИНИАТЮР =====
function renderThumbnails() {
    const container = document.getElementById('slide-thumbnails');
    container.innerHTML = '';
    
    const gradients = ['gradient-1', 'gradient-2', 'gradient-3', 'gradient-4', 'gradient-5', 'gradient-6', 'gradient-7', 'gradient-8'];
    
    currentPresentation.slides.forEach((slide, index) => {
        const gradient = gradients[index % gradients.length];
        const thumb = document.createElement('div');
        thumb.className = `thumbnail ${gradient}`;
        thumb.textContent = index + 1;
        thumb.addEventListener('click', () => goToSlide(index));
        container.appendChild(thumb);
    });
    
    updateActiveThumbnail();
}

// ===== НАВИГАЦИЯ ПО СЛАЙДАМ =====
function nextSlide() {
    if (currentSlideIndex < currentPresentation.slides.length - 1) {
        currentSlideIndex++;
        updateActiveSlide();
        updateSlideCounter();
        updateActiveThumbnail();
    }
}

function prevSlide() {
    if (currentSlideIndex > 0) {
        currentSlideIndex--;
        updateActiveSlide();
        updateSlideCounter();
        updateActiveThumbnail();
    }
}

function goToSlide(index) {
    currentSlideIndex = index;
    updateActiveSlide();
    updateSlideCounter();
    updateActiveThumbnail();
}

function updateActiveSlide() {
    const slides = document.querySelectorAll('.slide');
    slides.forEach((slide, index) => {
        slide.classList.remove('active', 'prev');
        if (index === currentSlideIndex) {
            slide.classList.add('active');
        } else if (index < currentSlideIndex) {
            slide.classList.add('prev');
        }
    });
}

function updateSlideCounter() {
    document.getElementById('current-slide').textContent = currentSlideIndex + 1;
}

function updateActiveThumbnail() {
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach((thumb, index) => {
        thumb.classList.toggle('active', index === currentSlideIndex);
    });
    
    // Скролл к активной миниатюре
    const activeThumb = document.querySelector('.thumbnail.active');
    if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
}

// ===== ПОЛНОЭКРАННЫЙ РЕЖИМ =====
function toggleFullscreen() {
    if (document.fullscreenElement) {
        document.exitFullscreen();
        document.body.classList.remove('fullscreen');
    } else {
        document.documentElement.requestFullscreen();
        document.body.classList.add('fullscreen');
    }
}

// ===== КЛАВИАТУРНАЯ НАВИГАЦИЯ =====
function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        if (!currentPresentation) return;
        
        const viewerSection = document.getElementById('viewer');
        if (!viewerSection.classList.contains('active')) return;
        
        switch (e.key) {
            case 'ArrowRight':
            case 'Space':
            case 'Enter':
                e.preventDefault();
                nextSlide();
                break;
            case 'ArrowLeft':
            case 'Backspace':
                e.preventDefault();
                prevSlide();
                break;
            case 'Escape':
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                    document.body.classList.remove('fullscreen');
                }
                break;
            case 'f':
            case 'F':
                toggleFullscreen();
                break;
            case 'Home':
                goToSlide(0);
                break;
            case 'End':
                goToSlide(currentPresentation.slides.length - 1);
                break;
        }
    });
}

// ===== АНИМАЦИИ ПРИ СКРОЛЛЕ =====
function setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

// ===== СВАЙП ДЛЯ МОБИЛЬНЫХ =====
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const viewerSection = document.getElementById('viewer');
    if (!viewerSection || !viewerSection.classList.contains('active')) return;
    
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            nextSlide();
        } else {
            prevSlide();
        }
    }
}

// ===== ПРОСМОТР ЛЕКЦИЙ =====
function openLecture(lectureId) {
    if (!lecturesData || !lecturesData[currentDiscipline.id]) {
        console.error('Лекции не найдены для дисциплины:', currentDiscipline.id);
        return;
    }
    
    const lecture = lecturesData[currentDiscipline.id].lectures.find(l => l.id === lectureId);
    if (!lecture) {
        console.error('Лекция не найдена:', lectureId);
        return;
    }
    
    document.getElementById('viewer-title').textContent = lecture.title;
    
    // Создаем контейнер для лекции
    const container = document.getElementById('slides-container');
    container.innerHTML = `
        <div class="lecture-container">
            <div class="lecture-content">
                ${lecture.content}
            </div>
        </div>
    `;
    
    // Скрываем элементы управления слайдами
    const slideCounter = document.getElementById('slide-counter');
    const thumbnailsContainer = document.getElementById('thumbnails-container');
    
    if (slideCounter) slideCounter.style.display = 'none';
    if (thumbnailsContainer) thumbnailsContainer.style.display = 'none';
    
    showSection('viewer');
}
