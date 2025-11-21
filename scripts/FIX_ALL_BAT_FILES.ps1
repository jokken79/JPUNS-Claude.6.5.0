# ========================================
# FIX_ALL_BAT_FILES.ps1
# Actualiza nombres de contenedores Docker en todos los archivos .bat
# UNS-ClaudeJP 6.0.0
# ========================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ACTUALIZADOR DE NOMBRES DE CONTENEDORES" -ForegroundColor Cyan
Write-Host "  UNS-ClaudeJP 6.0.0" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Definir los reemplazos necesarios
$replacements = @{
    "uns-claudejp-backend"   = "uns-claudejp-600-backend-1"
    "uns-claudejp-db"        = "uns-claudejp-600-db"
    "uns-claudejp-frontend"  = "uns-claudejp-600-frontend"
    "uns-claudejp-redis"     = "uns-claudejp-600-redis"
    "uns-claudejp-adminer"   = "uns-claudejp-600-adminer"
    "uns-claudejp-nginx"     = "uns-claudejp-600-nginx"
    "uns-claudejp-importer"  = "uns-claudejp-600-importer"
}

# Buscar todos los archivos .bat en scripts/ y subdirectorios
$scriptsDir = Split-Path -Parent $PSCommandPath

Write-Host "[*] Buscando archivos .bat..." -ForegroundColor Yellow
$batFiles = Get-ChildItem -Path $scriptsDir -Filter "*.bat" -Recurse
Write-Host "  ✓ Encontrados $($batFiles.Count) archivos .bat" -ForegroundColor Green
Write-Host ""

$filesModified = 0
$totalReplacements = 0

foreach ($file in $batFiles) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    $fileReplacements = 0

    # Aplicar reemplazos de nombres de contenedores
    foreach ($old in $replacements.Keys) {
        $new = $replacements[$old]
        if ($content -match [regex]::Escape($old)) {
            $content = $content -replace [regex]::Escape($old), $new
            $count = ([regex]::Matches($originalContent, [regex]::Escape($old))).Count
            $fileReplacements += $count
        }
    }

    # Solo escribir si hubo cambios
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $filesModified++
        $totalReplacements += $fileReplacements
        Write-Host "  ✓ $($file.Name) - $fileReplacements reemplazos" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✓ ACTUALIZACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  • Archivos .bat modificados: $filesModified" -ForegroundColor Cyan
Write-Host "  • Total de reemplazos: $totalReplacements" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona cualquier tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
