@echo off
chcp 65001 >nul
echo Converting DOCX files to PDF...
echo.

cd /d "%~dp0"

if not exist "pdfs" mkdir pdfs

powershell -ExecutionPolicy Bypass -File "convert_one_pdf.ps1" -DocxFile "lec\дисциплина №1.docx" -PdfFile "pdfs\Дисциплина №1.pdf"
powershell -ExecutionPolicy Bypass -File "convert_one_pdf.ps1" -DocxFile "lec\Дисциплина №2.docx" -PdfFile "pdfs\Дисциплина №2.pdf"
powershell -ExecutionPolicy Bypass -File "convert_one_pdf.ps1" -DocxFile "lec\Дисциплина №3.docx" -PdfFile "pdfs\Дисциплина №3.pdf"
powershell -ExecutionPolicy Bypass -File "convert_one_pdf.ps1" -DocxFile "lec\Дисциплина №4.docx" -PdfFile "pdfs\Дисциплина №4.pdf"
REM Пропускаем №5
powershell -ExecutionPolicy Bypass -File "convert_one_pdf.ps1" -DocxFile "lec\Дисциплина №6.docx" -PdfFile "pdfs\Дисциплина №6.pdf"
powershell -ExecutionPolicy Bypass -File "convert_one_pdf.ps1" -DocxFile "lec\Дисциплина №7.docx" -PdfFile "pdfs\Дисциплина №7.pdf"
powershell -ExecutionPolicy Bypass -File "convert_one_pdf.ps1" -DocxFile "lec\Дисциплина  №8.docx" -PdfFile "pdfs\Дисциплина №8.pdf"

echo.
echo Done!

