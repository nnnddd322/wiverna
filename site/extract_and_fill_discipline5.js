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
      timeout: 120000,
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
    let line = lines[i].trim();
    
    // Пропускаем пустые строки, но сохраняем их для структуры
    if (!line) {
      if (currentContent.length > 0 && currentContent[currentContent.length - 1] !== '') {
        currentContent.push('');
      }
      continue;
    }
    
    // Убираем лишние пробелы
    line = line.replace(/\s+/g, ' ');
    
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

// Функция для разбиения текста на предложения
function splitIntoSentences(text) {
  return text.split(/[.!?]\s+/).filter(s => s.trim().length > 10);
}

// Функция для разбиения на абзацы
function splitIntoParagraphs(text) {
  // Разбиваем по двойным переносам строк
  let paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 20);
  
  // Если абзацев мало, разбиваем по одиночным переносам
  if (paragraphs.length < 3) {
    paragraphs = text.split(/\n/).filter(p => p.trim().length > 30);
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
  
  if (!topic.content || topic.content.length < 50) {
    return slides;
  }
  
  // Разбиваем контент на абзацы
  const paragraphs = splitIntoParagraphs(topic.content);
  
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i].trim();
    if (!paragraph || paragraph.length < 20) continue;
    
    // Если абзац очень короткий - highlight
    if (paragraph.length < 120) {
      slides.push({
        type: 'highlight',
        title: topic.title,
        highlightText: paragraph
      });
    }
    // Если содержит список (маркеры или нумерация)
    else if (paragraph.includes('•') || /^\d+[\.\)]\s/m.test(paragraph) || paragraph.includes('—') || paragraph.includes('- ')) {
      // Разбиваем на элементы списка
      let items = paragraph.split(/[•\n]/)
        .map(item => item.trim())
        .filter(item => {
          // Фильтруем слишком короткие или пустые элементы
          if (item.length < 15) return false;
          // Убираем элементы, которые являются только нумерацией
          if (/^\d+[\.\)]\s*$/.test(item)) return false;
          return true;
        });
      
      // Если не получилось разбить по •, пробуем по переносам строк
      if (items.length < 2) {
        items = paragraph.split(/\n/)
          .map(item => item.trim())
          .filter(item => item.length > 15 && !/^\d+[\.\)]\s*$/.test(item));
      }
      
      // Если все еще мало элементов, пробуем по тире
      if (items.length < 2) {
        items = paragraph.split(/[—\-]\s+/)
          .map(item => item.trim())
          .filter(item => item.length > 15);
      }
      
      if (items.length >= 2) {
        // Ограничиваем количество элементов
        const limitedItems = items.slice(0, 10);
        slides.push({
          type: 'list',
          title: topic.title,
          listItems: limitedItems.map(item => ({
            title: item.substring(0, 80),
            text: item
          }))
        });
      } else {
        // Если не список, делаем обычный контент
        slides.push({
          type: 'content',
          title: topic.title,
          content: [paragraph.substring(0, 800)]
        });
      }
    }
    // Если длинный абзац - разбиваем на две колонки или несколько слайдов
    else if (paragraph.length > 500) {
      const sentences = splitIntoSentences(paragraph);
      const midPoint = Math.floor(sentences.length / 2);
      
      if (midPoint > 0 && sentences.length > 3) {
        const leftPart = sentences.slice(0, midPoint).join('. ') + '.';
        const rightPart = sentences.slice(midPoint).join('. ') + '.';
        
        // Проверяем, что части не слишком длинные
        if (leftPart.length < 600 && rightPart.length < 600) {
          slides.push({
            type: 'two-column',
            title: topic.title,
            leftContent: [leftPart],
            rightContent: [rightPart]
          });
        } else {
          // Если слишком длинные, разбиваем на несколько слайдов
          const chunkSize = Math.ceil(sentences.length / 3);
          for (let j = 0; j < sentences.length; j += chunkSize) {
            const chunk = sentences.slice(j, j + chunkSize).join('. ') + '.';
            slides.push({
              type: 'content',
              title: topic.title,
              content: [chunk]
            });
          }
        }
      } else {
        // Если предложений мало, просто обрезаем
        slides.push({
          type: 'content',
          title: topic.title,
          content: [paragraph.substring(0, 600)]
        });
      }
    }
    // Обычный контент
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
function main() {
  console.log('Извлечение текста и создание презентации для дисциплины 5...\n');
  
  const docxPath = path.join(__dirname, 'lec', 'Дисциплина №5.docx');
  const txtPath = path.join(__dirname, 'lec', 'Дисциплина №5.txt');
  
  // Конвертируем DOCX в TXT, если нужно
  if (!fs.existsSync(txtPath)) {
    console.log('TXT файл не найден. Попытка конвертации DOCX в TXT...');
    console.log('Это может занять некоторое время...\n');
    
    if (!convertDocxToTxt(docxPath, txtPath)) {
      console.error('\n❌ Не удалось автоматически конвертировать DOCX в TXT.');
      console.error('Пожалуйста, создайте TXT файл вручную:');
      console.error(`  1. Откройте "${docxPath}" в Microsoft Word`);
      console.error(`  2. Сохраните как TXT: "${txtPath}"`);
      console.error('\nПосле создания TXT файла запустите этот скрипт снова.');
      process.exit(1);
    }
    console.log('✅ Конвертация завершена.\n');
  } else {
    console.log('✅ TXT файл уже существует, используем его.\n');
  }
  
  // Читаем текст
  console.log('Чтение текста...');
  const text = readTextFromTxt(txtPath);
  console.log(`Прочитано ${text.length} символов\n`);
  
  // Парсим темы
  console.log('Парсинг тем...');
  const topics = parseTopics(text);
  console.log(`Найдено тем: ${topics.length}\n`);
  
  topics.forEach(t => {
    console.log(`  Тема ${t.number}: ${t.title}`);
    console.log(`    Содержимое: ${t.content.length} символов`);
  });
  console.log('');
  
  // Создаем презентации
  const presentations = [];
  for (const topic of topics) {
    console.log(`Создание слайдов для темы ${topic.number}...`);
    const slides = createSlidesFromTopic(topic);
    presentations.push({
      title: `Тема ${topic.number}. ${topic.title}`,
      slides: slides
    });
    console.log(`  Создано слайдов: ${slides.length}\n`);
  }
  
  // Читаем текущий data.js
  const dataJsPath = path.join(__dirname, 'data.js');
  let dataJsContent = fs.readFileSync(dataJsPath, 'utf8');
  
  // Находим дисциплину 5
  const discipline5Start = dataJsContent.indexOf("id: 'general-psychology'");
  if (discipline5Start === -1) {
    console.error('Дисциплина 5 не найдена в data.js');
    process.exit(1);
  }
  
  // Находим начало presentations
  const presentationsStart = dataJsContent.indexOf('presentations: [', discipline5Start);
  if (presentationsStart === -1) {
    console.error('Не найдено presentations в дисциплине 5');
    process.exit(1);
  }
  
  // Находим конец presentations (следующая дисциплина или конец массива)
  const nextDiscipline = dataJsContent.indexOf("  },\n  {\n    id: '", presentationsStart);
  const presentationsEnd = nextDiscipline !== -1 
    ? dataJsContent.lastIndexOf('    ]\n  },\n', nextDiscipline)
    : dataJsContent.lastIndexOf('    ]\n  }\n];');
  
  if (presentationsEnd === -1) {
    console.error('Не найден конец presentations');
    process.exit(1);
  }
  
  // Форматируем презентации
  let presentationsStr = '    presentations: [\n';
  for (const pres of presentations) {
    presentationsStr += '      {\n';
    presentationsStr += `        title: '${pres.title.replace(/'/g, "\\'")}',\n`;
    presentationsStr += '        slides: [\n';
    
    for (const slide of pres.slides) {
      presentationsStr += '          {\n';
      presentationsStr += `            type: '${slide.type}',\n`;
      
      if (slide.title) {
        presentationsStr += `            title: '${slide.title.replace(/'/g, "\\'")}',\n`;
      }
      if (slide.subtitle) {
        presentationsStr += `            subtitle: '${slide.subtitle.replace(/'/g, "\\'")}',\n`;
      }
      if (slide.highlightText) {
        presentationsStr += `            highlightText: '${slide.highlightText.replace(/'/g, "\\'")}',\n`;
      }
      
      if (slide.content) {
        presentationsStr += '            content: [\n';
        for (const item of slide.content) {
          presentationsStr += `              '${item.replace(/'/g, "\\'")}',\n`;
        }
        presentationsStr += '            ]\n';
      }
      
      if (slide.leftContent) {
        presentationsStr += '            leftContent: [\n';
        for (const item of slide.leftContent) {
          presentationsStr += `              '${item.replace(/'/g, "\\'")}',\n`;
        }
        presentationsStr += '            ],\n';
      }
      
      if (slide.rightContent) {
        presentationsStr += '            rightContent: [\n';
        for (const item of slide.rightContent) {
          presentationsStr += `              '${item.replace(/'/g, "\\'")}',\n`;
        }
        presentationsStr += '            ]\n';
      }
      
      if (slide.listItems) {
        presentationsStr += '            listItems: [\n';
        for (const item of slide.listItems) {
          presentationsStr += '              {\n';
          if (item.title) {
            presentationsStr += `                title: '${item.title.replace(/'/g, "\\'")}',\n`;
          }
          if (item.text) {
            presentationsStr += `                text: '${item.text.replace(/'/g, "\\'")}'\n`;
          }
          presentationsStr += '              },\n';
        }
        presentationsStr += '            ]\n';
      }
      
      presentationsStr += '          },\n';
    }
    
    presentationsStr += '        ]\n';
    presentationsStr += '      },\n';
  }
  presentationsStr += '    ]\n';
  
  // Заменяем presentations в data.js
  const beforePresentations = dataJsContent.substring(0, presentationsStart);
  const afterPresentations = dataJsContent.substring(presentationsEnd + 1);
  
  const newDataJsContent = beforePresentations + presentationsStr + afterPresentations;
  
  // Сохраняем
  fs.writeFileSync(dataJsPath, newDataJsContent, 'utf8');
  
  console.log('✅ Презентация успешно обновлена в data.js');
  console.log(`\nСтатистика:`);
  console.log(`  Презентаций: ${presentations.length}`);
  console.log(`  Всего слайдов: ${presentations.reduce((sum, p) => sum + p.slides.length, 0)}`);
  
  // Сохраняем также в JSON для проверки
  const jsonPath = path.join(__dirname, 'discipline5_full.json');
  fs.writeFileSync(jsonPath, JSON.stringify({ presentations }, null, 2), 'utf8');
  console.log(`\nВременный файл сохранен: ${jsonPath}`);
}

main();

