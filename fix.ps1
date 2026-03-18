$content = Get-Content -Path "c:\Users\kofiw\Desktop\cove\src\screens\AddTransactionPanel.jsx" -Encoding UTF8
$content = $content -replace [char]0x201C, '"'
$content = $content -replace [char]0x201D, '"'
$content = $content -replace [char]0x2026, '...'
Set-Content -Path "c:\Users\kofiw\Desktop\cove\src\screens\AddTransactionPanel.jsx" -Value $content -Encoding UTF8