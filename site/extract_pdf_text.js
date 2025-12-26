const fs = require('fs');
const path = require('path');

// Попробуем использовать pdf-parse, если установлен
let pdfParse;
try {
  pdfParse = require('pdf-parse');
} catch (e) {
  console.log('pdf-parse не установлен. Установите: npm install pdf-parse');
  process.exit(1);
}

async function extractTextFromPDF(pdfPath) {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('Ошибка при чтении PDF:', error);
    throw error;
  }
}

async function main() {
  const pdfPath = path.join(__dirname, 'lec', 'Дисциплина №5.pdf');
  
  if (!fs.existsSync(pdfPath)) {
    console.error('Файл не найден:', pdfPath);
    process.exit(1);
  }
  
  console.log('Извлечение текста из PDF...');
  const text = await extractTextFromPDF(pdfPath);
  
  const outputPath = path.join(__dirname, 'lec', 'Дисциплина №5.txt');
  fs.writeFileSync(outputPath, text, 'utf8');
  console.log('Текст сохранен в:', outputPath);
  console.log('\nПервые 500 символов:');
  console.log(text.substring(0, 500));
}

main().catch(console.error);

