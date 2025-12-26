$ErrorActionPreference = "Stop"
$lecDir = Join-Path $PSScriptRoot "lec"
$txtDir = Join-Path $PSScriptRoot "lec_txt"

if (-not (Test-Path $txtDir)) {
    New-Item -ItemType Directory -Path $txtDir | Out-Null
}

$word = New-Object -ComObject Word.Application
$word.Visible = $false

$files = Get-ChildItem -Path $lecDir -Filter "*.docx"

foreach ($file in $files) {
    $docxPath = $file.FullName
    $txtFileName = [System.IO.Path]::ChangeExtension($file.Name, ".txt")
    $txtPath = Join-Path $txtDir $txtFileName
    
    Write-Host "Processing: $($file.Name)"
    
    try {
        $doc = $word.Documents.Open($docxPath, $false, $true)
        Start-Sleep -Milliseconds 300
        $saveFormat = 2  # wdFormatText
        $doc.SaveAs($txtPath, $saveFormat)
        $doc.Close($false)
        Start-Sleep -Milliseconds 200
        Write-Host "  Saved: $txtFileName"
    } catch {
        Write-Host "  Error: $($_.Exception.Message)"
    }
}

$word.Quit([ref]$false)
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
[System.GC]::Collect()
[System.GC]::WaitForPendingFinalizers()

Write-Host "Done!"

