const fs = require('fs');
const path = require('path');

// Попробуем прочитать TXT файл, если он есть
const txtPath = path.join(__dirname, 'lec', 'Дисциплина №5.txt');
const docxPath = path.join(__dirname, 'lec', 'Дисциплина №5.docx');

console.log('Проверка наличия TXT файла...');

let text = '';
if (fs.existsSync(txtPath)) {
  console.log('Чтение существующего TXT файла...');
  const encodings = ['utf8', 'utf16le', 'win1251'];
  for (const enc of encodings) {
    try {
      text = fs.readFileSync(txtPath, enc);
      if (text && text.length > 0 && !text.includes('\uFFFD')) {
        break;
      }
    } catch (e) {
      continue;
    }
  }
} else {
  console.log('TXT файл не найден. Пожалуйста, создайте его вручную:');
  console.log(`1. Откройте "${docxPath}" в Word`);
  console.log(`2. Сохраните как TXT: "${txtPath}"`);
  console.log('\nИли запустите PowerShell скрипт для автоматической конвертации.');
  process.exit(1);
}

console.log(`Прочитано ${text.length} символов`);

// Регулярное выражение для поиска тем
const topicRe = /^Тема\s+(\d+)(?:\s*[\.\):]\s*|\s+)(.+?)\s*$/i;

// Функция для разбиения текста на темы
function parseTopics(text) {
  const lines = text.split(/\r?\n/);
  const topics = [];
  let currentTopic = null;
  let currentContent = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) {
      if (currentContent.length > 0) {
        currentContent.push('');
      }
      continue;
    }
    
    const topicMatch = line.match(topicRe);
    if (topicMatch) {
      if (currentTopic) {
        topics.push({
          number: currentTopic.number,
          title: currentTopic.title,
          content: currentContent.join('\n').trim()
        });
      }
      
      currentTopic = {
        number: parseInt(topicMatch[1]),
        title: topicMatch[2].trim()
      };
      currentContent = [];
    } else if (currentTopic) {
      currentContent.push(line);
    }
  }
  
  if (currentTopic) {
    topics.push({
      number: currentTopic.number,
      title: currentTopic.title,
      content: currentContent.join('\n').trim()
    });
  }
  
  return topics;
}

// Функция для разбиения текста на предложения
function splitIntoSentences(text) {
  return text.split(/[.!?]\s+/).filter(s => s.trim().length > 10);
}

// Функция для создания слайдов из темы
function createSlidesFromTopic(topic) {
  const slides = [];
  
  // Титульный слайд
  slides.push({
    type: 'title',
    title: `Тема ${topic.number}`,
    subtitle: topic.title
  });
  
  if (!topic.content || topic.content.length < 50) {
    return slides;
  }
  
  // Разбиваем контент на абзацы (по двойным переносам строк)
  const paragraphs = topic.content.split(/\n\s*\n/).filter(p => p.trim().length > 20);
  
  for (const paragraph of paragraphs) {
    const cleanPara = paragraph.trim();
    if (!cleanPara) continue;
    
    // Если абзац очень короткий - highlight
    if (cleanPara.length < 150) {
      slides.push({
        type: 'highlight',
        title: topic.title,
        highlightText: cleanPara
      });
    }
    // Если содержит список (маркеры или нумерация)
    else if (cleanPara.includes('•') || /^\d+[\.\)]\s/m.test(cleanPara)) {
      const items = cleanPara.split(/[•\n]/)
        .map(item => item.trim())
        .filter(item => item.length > 10 && !item.match(/^\d+[\.\)]\s*$/));
      
      if (items.length > 0) {
        slides.push({
          type: 'list',
          title: topic.title,
          listItems: items.slice(0, 8).map(item => ({
            title: item.substring(0, 60),
            text: item
          }))
        });
      }
    }
    // Если длинный абзац - разбиваем на части
    else if (cleanPara.length > 400) {
      const sentences = splitIntoSentences(cleanPara);
      const midPoint = Math.floor(sentences.length / 2);
      
      if (midPoint > 0) {
        const leftPart = sentences.slice(0, midPoint).join('. ') + '.';
        const rightPart = sentences.slice(midPoint).join('. ') + '.';
        
        slides.push({
          type: 'two-column',
          title: topic.title,
          leftContent: [leftPart],
          rightContent: [rightPart]
        });
      } else {
        slides.push({
          type: 'content',
          title: topic.title,
          content: [cleanPara.substring(0, 600)]
        });
      }
    }
    // Обычный контент
    else {
      slides.push({
        type: 'content',
        title: topic.title,
        content: [cleanPara]
      });
    }
  }
  
  return slides;
}

// Основная функция
function main() {
  console.log('Парсинг тем...');
  const topics = parseTopics(text);
  console.log(`Найдено тем: ${topics.length}`);
  
  topics.forEach(t => {
    console.log(`  Тема ${t.number}: ${t.title} (${t.content.length} символов)`);
  });
  
  // Создаем презентации
  const presentations = [];
  for (const topic of topics) {
    console.log(`\nСоздание слайдов для темы ${topic.number}...`);
    const slides = createSlidesFromTopic(topic);
    presentations.push({
      title: `Тема ${topic.number}. ${topic.title}`,
      slides: slides
    });
    console.log(`  Создано слайдов: ${slides.length}`);
  }
  
  // Создаем структуру дисциплины
  const discipline = {
    id: 'general-psychology',
    name: '5. Общая психология экзамен',
    description: 'Экзаменационные материалы',
    pdfFiles: [
      {
        title: 'Лекции по дисциплине',
        path: 'lec/Дисциплина №5.pdf',
        fileName: 'Дисциплина №5.pdf'
      }
    ],
    presentations: presentations
  };
  
  // Сохраняем в JSON
  const jsonPath = path.join(__dirname, 'discipline5.json');
  fs.writeFileSync(jsonPath, JSON.stringify(discipline, null, 2), 'utf8');
  console.log(`\n✅ Дисциплина сохранена в: ${jsonPath}`);
  console.log(`\nСтатистика:`);
  console.log(`  Презентаций: ${presentations.length}`);
  console.log(`  Всего слайдов: ${presentations.reduce((sum, p) => sum + p.slides.length, 0)}`);
  
  return discipline;
}

main();

