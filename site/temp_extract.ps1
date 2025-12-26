
$ErrorActionPreference = "Stop"
$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
    $doc = $word.Documents.Open("C:\\Users\\nnndd\\OneDrive\\Desktop\\vi\\proba\\lec\\Дисциплина №7.docx", $false, $true)
    $text = $doc.Content.Text
    $doc.Close($false)
    $text | Out-File -FilePath "C:\\Users\\nnndd\\OneDrive\\Desktop\\vi\\proba\\temp_lecture_extract.txt" -Encoding UTF8
} finally {
    if ($doc) { $doc.Close($false) }
    $word.Quit($false)
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}
