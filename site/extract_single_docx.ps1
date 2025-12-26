param(
    [string]$DocxPath,
    [string]$TxtPath
)

$word = New-Object -ComObject Word.Application
$word.Visible = $false

try {
    $doc = $word.Documents.Open($DocxPath)
    $doc.SaveAs($TxtPath, 2)
    $doc.Close()
} finally {
    if ($doc) { $doc.Close() }
    $word.Quit()
}

