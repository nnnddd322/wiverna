# Перемещение и переименование PDF файлов из lec в pdfs

$lecDir = "lec"
$pdfDir = "pdfs"

# Create pdfs directory
if (-not (Test-Path $pdfDir)) {
    New-Item -ItemType Directory -Path $pdfDir | Out-Null
    Write-Host "Created pdfs directory"
}

# Mapping: source filename -> target filename
$fileMapping = @{
    "дисциплина №1.pdf" = "Дисциплина №1.pdf"
    "Дисциплина №2.pdf" = "Дисциплина №2.pdf"
    "Дисциплина №3.pdf" = "Дисциплина №3.pdf"
    "Дисциплина №4.pdf" = "Дисциплина №4.pdf"
    # Skip #5
    "Дисциплина №6.pdf" = "Дисциплина №6.pdf"
    "Дисциплина №7.pdf" = "Дисциплина №7.pdf"
    "Дисциплина  №8.pdf" = "Дисциплина №8.pdf"  # Note: two spaces in source
}

Write-Host "Moving PDF files from lec to pdfs..."
Write-Host ""

foreach ($sourceFile in $fileMapping.Keys) {
    $sourcePath = Join-Path $lecDir $sourceFile
    $targetFile = $fileMapping[$sourceFile]
    $targetPath = Join-Path $pdfDir $targetFile
    
    if (Test-Path $sourcePath) {
        Copy-Item $sourcePath $targetPath -Force
        Write-Host "Copied: $sourceFile -> $targetFile"
    } else {
        Write-Host "Not found: $sourceFile"
    }
}

Write-Host ""
Write-Host "Done! PDF files are now in pdfs/ folder"

