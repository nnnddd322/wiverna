const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Функция для конвертации DOCX в TXT
function convertDocxToTxt(docxPath, txtPath) {
  const psScriptPath = path.resolve(__dirname, 'extract_single_docx.ps1');
  const command = `powershell -ExecutionPolicy Bypass -File "${psScriptPath}" -DocxPath "${docxPath}" -TxtPath "${txtPath}"`;
  
  try {
    execSync(command, {
      encoding: 'utf8',
      cwd: __dirname,
      timeout: 60000,
      stdio: 'pipe'
    });
    return true;
  } catch (error) {
    console.error(`Ошибка при конвертации ${docxPath}:`, error.message);
    return false;
  }
}

// Функция для чтения текста из TXT файла
function readTextFromTxt(txtPath) {
  try {
    let text = null;
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
    
    if (!text) {
      text = fs.readFileSync(txtPath, 'utf8');
    }
    
    return text;
  } catch (error) {
    console.error(`Ошибка при чтении TXT файла ${txtPath}:`, error.message);
    throw error;
  }
}

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
      // Сохраняем предыдущую тему
      if (currentTopic) {
        topics.push({
          number: currentTopic.number,
          title: currentTopic.title,
          content: currentContent.join('\n').trim()
        });
      }
      
      // Начинаем новую тему
      currentTopic = {
        number: parseInt(topicMatch[1]),
        title: topicMatch[2].trim()
      };
      currentContent = [];
    } else if (currentTopic) {
      currentContent.push(line);
    }
  }
  
  // Сохраняем последнюю тему
  if (currentTopic) {
    topics.push({
      number: currentTopic.number,
      title: currentTopic.title,
      content: currentContent.join('\n').trim()
    });
  }
  
  return topics;
}

// Функция для разбиения текста на абзацы
function splitIntoParagraphs(text, maxLength = 500) {
  const sentences = text.split(/[.!?]\s+/).filter(s => s.trim().length > 0);
  const paragraphs = [];
  let currentParagraph = [];
  let currentLength = 0;
  
  for (const sentence of sentences) {
    const sentenceLength = sentence.length;
    
    if (currentLength + sentenceLength > maxLength && currentParagraph.length > 0) {
      paragraphs.push(currentParagraph.join('. ') + '.');
      currentParagraph = [sentence];
      currentLength = sentenceLength;
    } else {
      currentParagraph.push(sentence);
      currentLength += sentenceLength + 2; // +2 for ". "
    }
  }
  
  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph.join('. ') + '.');
  }
  
  return paragraphs;
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
  
  // Разбиваем контент на абзацы
  const paragraphs = splitIntoParagraphs(topic.content, 400);
  
  // Создаем слайды из абзацев
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i].trim();
    if (!paragraph) continue;
    
    // Если абзац короткий, используем highlight
    if (paragraph.length < 200) {
      slides.push({
        type: 'highlight',
        title: topic.title,
        highlightText: paragraph
      });
    } 
    // Если абзац содержит список, используем list
    else if (paragraph.includes('•') || paragraph.match(/^\d+[\.\)]/m)) {
      const items = paragraph.split(/[•\n]/).filter(item => item.trim().length > 0);
      slides.push({
        type: 'list',
        title: topic.title,
        listItems: items.map(item => ({
          title: item.trim().substring(0, 50),
          text: item.trim()
        }))
      });
    }
    // Если абзац длинный, разбиваем на две колонки
    else if (paragraph.length > 300 && i < paragraphs.length - 1) {
      const midPoint = Math.floor(paragraph.length / 2);
      const splitPoint = paragraph.lastIndexOf('.', midPoint);
      if (splitPoint > 0) {
        slides.push({
          type: 'two-column',
          title: topic.title,
          leftContent: [paragraph.substring(0, splitPoint + 1)],
          rightContent: [paragraph.substring(splitPoint + 1).trim()]
        });
        i++; // Пропускаем следующий абзац, так как мы его использовали
        continue;
      }
    }
    // Обычный контентный слайд
    else {
      slides.push({
        type: 'content',
        title: topic.title,
        content: [paragraph]
      });
    }
  }
  
  return slides;
}

// Основная функция
async function main() {
  console.log('Создание презентации для дисциплины 5...');
  
  const docxPath = path.join(__dirname, 'lec', 'Дисциплина №5.docx');
  const txtPath = path.join(__dirname, 'lec', 'Дисциплина №5.txt');
  
  // Конвертируем DOCX в TXT
  if (!fs.existsSync(txtPath)) {
    console.log('Конвертация DOCX в TXT...');
    if (!convertDocxToTxt(docxPath, txtPath)) {
      console.error('Не удалось конвертировать DOCX в TXT');
      process.exit(1);
    }
  }
  
  // Читаем текст
  console.log('Чтение текста...');
  const text = readTextFromTxt(txtPath);
  console.log(`Прочитано ${text.length} символов`);
  
  // Парсим темы
  console.log('Парсинг тем...');
  const topics = parseTopics(text);
  console.log(`Найдено тем: ${topics.length}`);
  
  // Создаем презентации
  const presentations = [];
  for (const topic of topics) {
    console.log(`Создание слайдов для темы ${topic.number}: ${topic.title}`);
    const slides = createSlidesFromTopic(topic);
    presentations.push({
      title: `Тема ${topic.number}. ${topic.title}`,
      slides: slides
    });
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
  
  // Сохраняем в JSON для проверки
  const jsonPath = path.join(__dirname, 'discipline5_temp.json');
  fs.writeFileSync(jsonPath, JSON.stringify(discipline, null, 2), 'utf8');
  console.log(`\nВременный файл сохранен: ${jsonPath}`);
  console.log(`\nСоздано презентаций: ${presentations.length}`);
  console.log(`Всего слайдов: ${presentations.reduce((sum, p) => sum + p.slides.length, 0)}`);
  
  return discipline;
}

main().catch(console.error);

