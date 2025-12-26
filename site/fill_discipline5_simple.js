const fs = require('fs');
const path = require('path');

const txtPath = path.join(__dirname, 'lec', 'Дисциплина №5.txt');

console.log('Проверка наличия TXT файла...\n');

if (!fs.existsSync(txtPath)) {
  console.error('❌ TXT файл не найден!');
  console.error('\nПожалуйста, создайте TXT файл вручную:');
  console.error(`  1. Откройте "proba/lec/Дисциплина №5.docx" в Microsoft Word`);
  console.error(`  2. Нажмите Файл -> Сохранить как`);
  console.error(`  3. Выберите формат "Обычный текст (*.txt)"`);
  console.error(`  4. Сохраните как "Дисциплина №5.txt" в папке lec`);
  console.error(`\nИли запустите PowerShell скрипт:`);
  console.error(`  cd proba`);
  console.error(`  powershell -ExecutionPolicy Bypass -File create_txt_discipline5.ps1`);
  console.error(`\nПосле создания TXT файла запустите этот скрипт снова.`);
  process.exit(1);
}

console.log('✅ TXT файл найден. Начинаю обработку...\n');

// Остальной код из extract_and_fill_discipline5.js
const { execSync } = require('child_process');

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
    
    if (!line) {
      if (currentContent.length > 0 && currentContent[currentContent.length - 1] !== '') {
        currentContent.push('');
      }
      continue;
    }
    
    line = line.replace(/\s+/g, ' ');
    
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

function splitIntoSentences(text) {
  return text.split(/[.!?]\s+/).filter(s => s.trim().length > 10);
}

function splitIntoParagraphs(text) {
  let paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 20);
  if (paragraphs.length < 3) {
    paragraphs = text.split(/\n/).filter(p => p.trim().length > 30);
  }
  return paragraphs;
}

function createSlidesFromTopic(topic) {
  const slides = [];
  
  slides.push({
    type: 'title',
    title: `Тема ${topic.number}`,
    subtitle: topic.title
  });
  
  if (!topic.content || topic.content.length < 50) {
    return slides;
  }
  
  const paragraphs = splitIntoParagraphs(topic.content);
  
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i].trim();
    if (!paragraph || paragraph.length < 20) continue;
    
    if (paragraph.length < 120) {
      slides.push({
        type: 'highlight',
        title: topic.title,
        highlightText: paragraph
      });
    }
    else if (paragraph.includes('•') || /^\d+[\.\)]\s/m.test(paragraph) || paragraph.includes('—') || paragraph.includes('- ')) {
      let items = paragraph.split(/[•\n]/)
        .map(item => item.trim())
        .filter(item => {
          if (item.length < 15) return false;
          if (/^\d+[\.\)]\s*$/.test(item)) return false;
          return true;
        });
      
      if (items.length < 2) {
        items = paragraph.split(/\n/)
          .map(item => item.trim())
          .filter(item => item.length > 15 && !/^\d+[\.\)]\s*$/.test(item));
      }
      
      if (items.length < 2) {
        items = paragraph.split(/[—\-]\s+/)
          .map(item => item.trim())
          .filter(item => item.length > 15);
      }
      
      if (items.length >= 2) {
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
        slides.push({
          type: 'content',
          title: topic.title,
          content: [paragraph.substring(0, 800)]
        });
      }
    }
    else if (paragraph.length > 500) {
      const sentences = splitIntoSentences(paragraph);
      const midPoint = Math.floor(sentences.length / 2);
      
      if (midPoint > 0 && sentences.length > 3) {
        const leftPart = sentences.slice(0, midPoint).join('. ') + '.';
        const rightPart = sentences.slice(midPoint).join('. ') + '.';
        
        if (leftPart.length < 600 && rightPart.length < 600) {
          slides.push({
            type: 'two-column',
            title: topic.title,
            leftContent: [leftPart],
            rightContent: [rightPart]
          });
        } else {
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
        slides.push({
          type: 'content',
          title: topic.title,
          content: [paragraph.substring(0, 600)]
        });
      }
    }
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
  console.log('Чтение текста...');
  const text = readTextFromTxt(txtPath);
  console.log(`Прочитано ${text.length} символов\n`);
  
  console.log('Парсинг тем...');
  const topics = parseTopics(text);
  console.log(`Найдено тем: ${topics.length}\n`);
  
  topics.forEach(t => {
    console.log(`  Тема ${t.number}: ${t.title}`);
    console.log(`    Содержимое: ${t.content.length} символов`);
  });
  console.log('');
  
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
  
  const dataJsPath = path.join(__dirname, 'data.js');
  let dataJsContent = fs.readFileSync(dataJsPath, 'utf8');
  
  const discipline5Start = dataJsContent.indexOf("id: 'general-psychology'");
  if (discipline5Start === -1) {
    console.error('Дисциплина 5 не найдена в data.js');
    process.exit(1);
  }
  
  const presentationsStart = dataJsContent.indexOf('presentations: [', discipline5Start);
  if (presentationsStart === -1) {
    console.error('Не найдено presentations в дисциплине 5');
    process.exit(1);
  }
  
  const nextDiscipline = dataJsContent.indexOf("  },\n  {\n    id: '", presentationsStart);
  const presentationsEnd = nextDiscipline !== -1 
    ? dataJsContent.lastIndexOf('    ]\n  },\n', nextDiscipline)
    : dataJsContent.lastIndexOf('    ]\n  }\n];');
  
  if (presentationsEnd === -1) {
    console.error('Не найден конец presentations');
    process.exit(1);
  }
  
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
  
  const beforePresentations = dataJsContent.substring(0, presentationsStart);
  const afterPresentations = dataJsContent.substring(presentationsEnd + 1);
  
  const newDataJsContent = beforePresentations + presentationsStr + afterPresentations;
  
  fs.writeFileSync(dataJsPath, newDataJsContent, 'utf8');
  
  console.log('✅ Презентация успешно обновлена в data.js');
  console.log(`\nСтатистика:`);
  console.log(`  Презентаций: ${presentations.length}`);
  console.log(`  Всего слайдов: ${presentations.reduce((sum, p) => sum + p.slides.length, 0)}`);
  
  const jsonPath = path.join(__dirname, 'discipline5_full.json');
  fs.writeFileSync(jsonPath, JSON.stringify({ presentations }, null, 2), 'utf8');
  console.log(`\nВременный файл сохранен: ${jsonPath}`);
}

main();

