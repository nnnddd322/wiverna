# Simple PDF conversion script
$lecDir = "lec"
$pdfDir = "pdfs"

# Create pdfs directory
if (-not (Test-Path $pdfDir)) {
    New-Item -ItemType Directory -Path $pdfDir | Out-Null
}

# Initialize Word
$word = New-Object -ComObject Word.Application
$word.Visible = $false

# Get all DOCX files
$files = Get-ChildItem -Path $lecDir -Filter "*.docx"

Write-Host "Found $($files.Count) DOCX files"
Write-Host ""

foreach ($file in $files) {
    # Extract number from filename
    if ($file.Name -match '[№N]?(\d+)') {
        $fileNumber = [int]$matches[1]
        
        # Skip discipline #5
        if ($fileNumber -eq 5) {
            Write-Host "Skipping: $($file.Name) (discipline #5)"
            continue
        }
        
        $pdfFileName = "Дисциплина №$fileNumber.pdf"
        $pdfPath = Join-Path $pdfDir $pdfFileName
        
        # Check if PDF already exists
        if (Test-Path $pdfPath) {
            Write-Host "Exists: $pdfFileName"
            continue
        }
        
        Write-Host "Converting: $($file.Name) -> $pdfFileName"
        
        try {
            $doc = $word.Documents.Open($file.FullName, $false, $true)
            $doc.SaveAs([ref]$pdfPath, [ref]17)
            $doc.Close($false)
            Write-Host "  Success!"
        }
        catch {
            Write-Host "  Error: $($_.Exception.Message)"
        }
    }
}

# Cleanup
$word.Quit($false)
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
[System.GC]::Collect()
[System.GC]::WaitForPendingFinalizers()

Write-Host ""
Write-Host "Conversion complete!"

