param(
    [Parameter(Mandatory=$true)]
    [string]$DocxPath,
    
    [Parameter(Mandatory=$true)]
    [string]$OutputPath
)

$ErrorActionPreference = "Stop"

$word = $null
$doc = $null

try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    Start-Sleep -Milliseconds 500
    
    $fullPath = (Resolve-Path $DocxPath).Path
    $doc = $word.Documents.Open($fullPath, $false, $true)
    Start-Sleep -Milliseconds 500
    
    $text = $doc.Content.Text
    $doc.Close([ref]$false)
    Start-Sleep -Milliseconds 200
    
    $text | Out-File -FilePath $OutputPath -Encoding UTF8 -NoNewline
} catch {
    Write-Error $_.Exception.Message
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

