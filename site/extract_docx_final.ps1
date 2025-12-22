$word = New-Object -ComObject Word.Application
$word.Visible = $false

try {
    $doc = $word.Documents.Open("c:\Users\nnndd\OneDrive\Desktop\proba\etnopedagogika.docx")
    $doc.SaveAs("c:\Users\nnndd\OneDrive\Desktop\proba\etnopedagogika_clean.txt", 2)
    $doc.Close()
    echo "File saved successfully as etnopedagogika_clean.txt"
} catch {
    echo "Error: " $_.Exception.Message
} finally {
    if ($doc) { $doc.Close() }
    if ($word) { $word.Quit() }
}
