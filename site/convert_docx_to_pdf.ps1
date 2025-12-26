$ErrorActionPreference = "Stop"

$lecDir = Join-Path $PSScriptRoot "lec"
$pdfDir = Join-Path $PSScriptRoot "pdfs"

if (-not (Test-Path $pdfDir)) {
    New-Item -ItemType Directory -Path $pdfDir | Out-Null
    Write-Host "Created pdfs directory"
}

$word = New-Object -ComObject Word.Application
$word.Visible = $false

$files = Get-ChildItem -Path $lecDir -Filter "*.docx"

foreach ($file in $files) {
    $docxPath = $file.FullName
    
    # Extract number from filename
    if ($file.Name -match '[№N]?(\d+)') {
        $fileNumber = [int]$matches[1]
        
        # Skip discipline #5
        if ($fileNumber -eq 5) {
            Write-Host "Skipping discipline #5"
            continue
        }
        
        $pdfFileName = "Дисциплина №$fileNumber.pdf"
        $pdfPath = Join-Path $pdfDir $pdfFileName
        
        Write-Host "Converting: $($file.Name) -> $pdfFileName"
        
        try {
            $doc = $word.Documents.Open($docxPath)
            Start-Sleep -Milliseconds 300
            
            # Save as PDF (format 17 = wdFormatPDF)
            $doc.SaveAs($pdfPath, 17)
            $doc.Close($false)
            Start-Sleep -Milliseconds 200
            
            Write-Host "  Success: $pdfFileName"
        } catch {
            Write-Host "  Error: $($_.Exception.Message)"
        }
    }
}

$word.Quit($false)
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
[System.GC]::Collect()
[System.GC]::WaitForPendingFinalizers()

Write-Host "Done!"

