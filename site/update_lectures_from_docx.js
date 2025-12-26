const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Маппинг номеров файлов к ID дисциплин (пропускаем №5)
const disciplineMapping = {
  1: 'pedagogy',  // Общие основы педагогики
  2: 'learning-theory',  // Теория обучения
  3: 'educational-methodology',  // Методика воспитательной работы
  4: 'correctional-pedagogy',  // Коррекционная педагогика
  // 5 пропускаем
  6: 'developmental-psychology',  // Возрастная психология
  7: 'special-psychology',  // Специальная психология
  8: 'educational-psychology',  // Педагогическая психология
  // Далее нужно будет добавить остальные, но пока работаем с теми, что есть в папке lec
};

// Функция для экранирования HTML
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Функция для очистки строки
function cleanLine(rawLine) {
  let s = String(rawLine ?? '');
  s = s.replace(/\uFFFD/g, '');
  s = s.replace(/^[\s\u00A0]*\?[\s\u00A0]*/u, '- ');
  if (/^[ \t]*патч[ \t]*$/iu.test(s)) return '';
  return s;
}

// Регулярное выражение для поиска тем
const topicRe = /^Тема\s+(\d+)(?:\s*[\.\):]\s*|\s+)(.+?)\s*$/i;

// Функция для создания ID лекции
function makeLectureId(baseId, usedIds) {
  if (!usedIds.has(baseId)) {
    usedIds.add(baseId);
    return baseId;
  }
  let i = 2;
  while (usedIds.has(`${baseId}-${i}`)) i += 1;
  const id = `${baseId}-${i}`;
  usedIds.add(id);
  return id;
}

// Функция для конвертации одного DOCX файла в TXT
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

// Создаем TXT файлы для каждого DOCX (если их еще нет)
function ensureTxtFileExists(docxFile, txtFile) {
  const txtPath = path.join(__dirname, 'lec_txt', txtFile);
  const docxPath = path.join(__dirname, 'lec', docxFile);
  
  if (fs.existsSync(txtPath)) {
    return true; // Файл уже существует
  }
  
  // Создаем папку если нужно
  const txtDir = path.join(__dirname, 'lec_txt');
  if (!fs.existsSync(txtDir)) {
    fs.mkdirSync(txtDir, { recursive: true });
  }
  
  console.log(`  Конвертирую ${docxFile} в TXT...`);
  return convertDocxToTxt(docxPath, txtPath);
}

// Функция для чтения текста из TXT файла
function readTextFromTxt(txtPath) {
  try {
    // Пробуем разные кодировки
    let text = null;
    const encodings = ['utf8', 'utf16le', 'win1251'];
    
    for (const enc of encodings) {
      try {
        text = fs.readFileSync(txtPath, enc);
        // Проверяем, что текст читаемый (содержит кириллицу или хотя бы нормальные символы)
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

// Загружаем текущие данные о дисциплинах
const dataJs = fs.readFileSync('data.js', 'utf8');
const dataContext = {};
const vm = require('vm');
vm.createContext(dataContext);
vm.runInContext(dataJs, dataContext);
const disciplines = dataContext.disciplines || [];

// Создаем маппинг ID дисциплин к их данным
const disciplinesById = new Map();
disciplines.forEach(d => {
  disciplinesById.set(d.id, d);
});

// Загружаем существующие лекции или создаем новый объект
let lecturesData = {};
if (fs.existsSync('lectures.js')) {
  const lecturesJs = fs.readFileSync('lectures.js', 'utf8');
  const lecturesContext = {};
  vm.createContext(lecturesContext);
  try {
    vm.runInContext(lecturesJs, lecturesContext);
    lecturesData = lecturesContext.lecturesData || {};
  } catch (e) {
    console.log('Создаю новый объект лекций');
    lecturesData = {};
  }
}

// Обрабатываем каждый файл в папке lec
const lecDir = path.join(__dirname, 'lec');
const files = fs.readdirSync(lecDir).filter(f => f.endsWith('.docx'));

console.log('Найдены DOCX файлы:', files);

for (const file of files) {
  // Извлекаем номер из имени файла
  const match = file.match(/[№N]?(\d+)/i);
  if (!match) {
    console.log(`Пропускаем файл ${file} - не удалось извлечь номер`);
    continue;
  }
  
  const fileNumber = parseInt(match[1], 10);
  
  // Пропускаем дисциплину №5
  if (fileNumber === 5) {
    console.log(`Пропускаем дисциплину №5`);
    continue;
  }
  
  const disciplineId = disciplineMapping[fileNumber];
  if (!disciplineId) {
    console.log(`Не найден маппинг для дисциплины №${fileNumber}`);
    continue;
  }
  
  const discipline = disciplinesById.get(disciplineId);
  if (!discipline) {
    console.log(`Дисциплина с ID ${disciplineId} не найдена`);
    continue;
  }
  
  console.log(`Обрабатываем файл ${file} -> дисциплина ${discipline.name}`);
  
  // Создаем TXT файл если нужно
  const txtFile = file.replace(/\.docx$/i, '.txt');
  if (!ensureTxtFileExists(file, txtFile)) {
    console.log(`  Пропускаем ${file} - не удалось создать TXT файл`);
    continue;
  }
  
  const txtPath = path.join(__dirname, 'lec_txt', txtFile);
  
  try {
    // Читаем текст из TXT файла
    const text = readTextFromTxt(txtPath);
    const lines = text.split(/\r?\n/);
    const lines = text.split(/\r?\n/);
    
    // Инициализируем дисциплину в lecturesData если нужно
    if (!lecturesData[disciplineId]) {
      lecturesData[disciplineId] = {
        id: disciplineId,
        name: discipline.name,
        description: discipline.description || '',
        lectures: []
      };
    }
    
    // Очищаем старые лекции для этой дисциплины
    lecturesData[disciplineId].lectures = [];
    const usedLectureIds = new Set();
    
    let currentLecture = null;
    let currentLectureLines = [];
    
    // Парсим текст на темы
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const line = (raw || '').trim();
      
      const tm = line.match(topicRe);
      if (tm) {
        // Сохраняем предыдущую лекцию
        if (currentLecture) {
          const lectureText = currentLectureLines.join('\n').trim();
          const html = `<pre style="white-space: pre-wrap;">${escapeHtml(lectureText)}</pre>`;
          
          lecturesData[disciplineId].lectures.push({
            id: currentLecture.id,
            title: currentLecture.title,
            content: html
          });
        }
        
        // Начинаем новую лекцию
        const topicNum = tm[1];
        const topicTitle = tm[2];
        const baseId = `tema-${topicNum}`;
        const lectureId = makeLectureId(baseId, usedLectureIds);
        
        currentLecture = {
          id: lectureId,
          title: `Тема ${topicNum}. ${topicTitle}`
        };
        currentLectureLines = [];
        continue;
      }
      
      // Добавляем строку к текущей лекции
      if (currentLecture) {
        const cleaned = cleanLine(raw);
        if (cleaned !== '') {
          currentLectureLines.push(cleaned);
        }
      }
    }
    
    // Сохраняем последнюю лекцию
    if (currentLecture) {
      const lectureText = currentLectureLines.join('\n').trim();
      const html = `<pre style="white-space: pre-wrap;">${escapeHtml(lectureText)}</pre>`;
      
      lecturesData[disciplineId].lectures.push({
        id: currentLecture.id,
        title: currentLecture.title,
        content: html
      });
    }
    
    console.log(`  Извлечено ${lecturesData[disciplineId].lectures.length} лекций`);
    
  } catch (error) {
    console.error(`Ошибка при обработке файла ${file}:`, error.message);
  }
}

// Создаем резервную копию
if (fs.existsSync('lectures.js')) {
  fs.copyFileSync('lectures.js', 'lectures.js.backup');
  console.log('Создана резервная копия: lectures.js.backup');
}

// Сохраняем обновленные лекции
const output = `var lecturesData = ${JSON.stringify(lecturesData, null, 2)};\n`;
fs.writeFileSync('lectures.js', output, 'utf8');

console.log('\nЛекции успешно обновлены!');
console.log('\nСтатистика:');
for (const [id, data] of Object.entries(lecturesData)) {
  console.log(`- ${data.name}: ${data.lectures.length} лекций`);
}

