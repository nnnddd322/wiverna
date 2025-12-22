# Устанавливаем кодировку UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$word = New-Object -ComObject Word.Application
$word.Visible = $false

# Используем относительный путь
$filePath = Join-Path $PSScriptRoot "Этнопедагогика. Экзамен (1).docx"
$savePath = Join-Path $PSScriptRoot "etnopedagogika_clean.txt"

Write-Host "Путь к файлу: $filePath"

try {
    if (Test-Path $filePath) {
        $doc = $word.Documents.Open($filePath)
        $doc.SaveAs([ref]$savePath, [ref]2)
        $doc.Close()
        Write-Host "Файл успешно сохранен как etnopedagogika_clean.txt"
    } else {
        Write-Host "Файл не найден: $filePath"
    }
} catch {
    Write-Host "Ошибка:" $_.Exception.Message
} finally {
    if ($doc) { $doc.Close() }
    if ($word) { $word.Quit() }
}
