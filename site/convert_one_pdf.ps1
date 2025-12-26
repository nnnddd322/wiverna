# Конвертация одного DOCX файла в PDF
param(
    [Parameter(Mandatory=$true)]
    [string]$DocxFile,
    
    [Parameter(Mandatory=$true)]
    [string]$PdfFile
)

$word = $null
$doc = $null

try {
    Write-Host "Opening: $DocxFile"
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    
    $doc = $word.Documents.Open($DocxFile, $false, $true)
    Start-Sleep -Seconds 2
    
    Write-Host "Saving as PDF: $PdfFile"
    $doc.SaveAs([ref]$PdfFile, [ref]17)
    
    $doc.Close($false)
    Write-Host "Success!"
}
catch {
    Write-Host "Error: $($_.Exception.Message)"
    exit 1
}
finally {
    if ($doc) {
        try { $doc.Close($false) } catch {}
    }
    if ($word) {
        try { $word.Quit($false) } catch {}
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
    }
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
    Start-Sleep -Seconds 1
}

