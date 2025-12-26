$ErrorActionPreference = "Stop"

$docxPath = Join-Path $PSScriptRoot "lec\Дисциплина №5.docx"
$txtPath = Join-Path $PSScriptRoot "lec\Дисциплина №5.txt"

if (-not (Test-Path $docxPath)) {
    Write-Host "Файл не найден: $docxPath"
    exit 1
}

$word = $null
$doc = $null

try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    Start-Sleep -Milliseconds 500
    
    $doc = $word.Documents.Open($docxPath, $false, $true)
    Start-Sleep -Milliseconds 500
    
    $doc.SaveAs($txtPath, 2)
    $doc.Close([ref]$false)
    Start-Sleep -Milliseconds 200
    
    Write-Host "TXT файл создан: $txtPath"
} catch {
    Write-Host "Ошибка: $($_.Exception.Message)"
    exit 1
} finally {
    if ($doc) {
        try { $doc.Close([ref]$false) } catch {}
    }
    if ($word) {
        try { $word.Quit([ref]$false) } catch {}
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
    }
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
    Start-Sleep -Milliseconds 500
}

