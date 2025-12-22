$word = New-Object -ComObject Word.Application
$word.Visible = $false
$filePath = "c:\Users\nnndd\OneDrive\Desktop\proba\Этнопедагогика. Экзамен (1).docx"
$savePath = "c:\Users\nnndd\OneDrive\Desktop\proba\etnopedagogika_clean.txt"

try {
    $doc = $word.Documents.Open($filePath)
    $doc.SaveAs([ref]$savePath, [ref]2)
    $doc.Close()
    $word.Quit()
    Write-Host "Файл успешно сохранен как etnopedagogika_clean.txt"
} catch {
    Write-Host "Ошибка:" $_.Exception.Message
} finally {
    if ($doc) { $doc.Close() }
    if ($word) { $word.Quit() }
}
