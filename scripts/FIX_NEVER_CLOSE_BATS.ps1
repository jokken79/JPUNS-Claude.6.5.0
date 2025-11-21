# ========================================================
# FIX: Asegurar que NINGUN .bat se cierre automáticamente
# ========================================================
# Este script reemplaza todas las líneas "exit /b 1" después
# de "pause" para que las ventanas NUNCA se cierren solas
# ========================================================

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  FIX: Archivos .bat para que NUNCA se cierren" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$batFiles = Get-ChildItem -Path $scriptPath -Filter "*.bat"

$fixedCount = 0
$totalFiles = $batFiles.Count

foreach ($file in $batFiles) {
    Write-Host "[Processing] $($file.Name)..." -ForegroundColor Yellow

    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content

    # Reemplazar: pause >nul SEGUIDO de exit /b 1
    # Por: pause >nul solamente (sin exit)
    $content = $content -replace '(pause\s+>nul)\s*[\r\n]+\s*exit\s+/b\s+1', '$1'

    # Asegurar que TODO .bat termine con pause >nul
    if ($content -notmatch 'pause\s+>nul\s*$') {
        $content += "`r`npause >nul`r`n"
    }

    # Solo guardar si hubo cambios
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "  [FIXED] $($file.Name)" -ForegroundColor Green
        $fixedCount++
    } else {
        Write-Host "  [OK] $($file.Name) ya estaba correcto" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Archivos procesados: $totalFiles" -ForegroundColor White
Write-Host "  Archivos modificados: $fixedCount" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[INFO] Ahora NINGUN .bat se cerrara automaticamente" -ForegroundColor Yellow
Write-Host ""
Write-Host "Presiona cualquier tecla para salir..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
