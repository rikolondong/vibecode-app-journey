$ws = New-Object -ComObject WScript.Shell
$desktop = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop "Jalan Tol Kelam.lnk"
$shortcut = $ws.CreateShortcut($shortcutPath)
$shortcut.TargetPath = Join-Path $PSScriptRoot "JALAN_TOL_KELAM.bat"
$shortcut.WorkingDirectory = $PSScriptRoot
$shortcut.Description = "Game 3D Jalan Tol Malam Hari Berkabut (Windows Edition)"
$shortcut.Save()

Write-Host "Shortcut created at: $shortcutPath"
Test-Path $shortcutPath
