# Инструкция по конвертации DOCX в PDF

## Автоматическая конвертация

Запустите PowerShell скрипт:

```powershell
cd C:\Users\nnndd\OneDrive\Desktop\vi\proba
powershell -ExecutionPolicy Bypass -File convert_to_pdf_simple.ps1
```

или

```powershell
cd C:\Users\nnndd\OneDrive\Desktop\vi\proba
powershell -ExecutionPolicy Bypass -File convert_docx_to_pdf.ps1
```

**Примечание:** Процесс конвертации может занять несколько минут, так как каждый файл обрабатывается через Microsoft Word. Не прерывайте выполнение скрипта.

## Ручная конвертация (альтернатива)

Если автоматическая конвертация не работает, можно сделать вручную:

1. Откройте каждый DOCX файл из папки `lec/` в Microsoft Word
2. Нажмите **Файл → Сохранить как**
3. Выберите формат **PDF**
4. Сохраните в папку `pdfs/` с именами:
   - `Дисциплина №1.pdf`
   - `Дисциплина №2.pdf`
   - `Дисциплина №3.pdf`
   - `Дисциплина №4.pdf`
   - `Дисциплина №6.pdf` (пропускаем №5)
   - `Дисциплина №7.pdf`
   - `Дисциплина №8.pdf`

## Проверка результата

После конвертации проверьте, что в папке `pdfs/` есть все необходимые файлы:

```powershell
Get-ChildItem pdfs -Filter *.pdf
```

Должно быть 7 PDF файлов (без №5).

