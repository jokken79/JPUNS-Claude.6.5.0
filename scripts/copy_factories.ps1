# Script para copiar archivos de factories desde backup a la carpeta activa
Write-Host "📋 Copiando archivos de factories desde backup..." -ForegroundColor Yellow

$srcDir = "D:\JPUNS-CLAUDE5.0\UNS-ClaudeJP-4.2\config\factories\backup"
$dstDir = "D:\JPUNS-CLAUDE5.0\UNS-ClaudeJP-4.2\config\factories"

# Crear directorio destino si no existe
if (!(Test-Path $dstDir)) {
    New-Item -ItemType Directory -Path $dstDir | Out-Null
}

# Copiar todos los archivos JSON
Get-ChildItem -Path $srcDir -Filter "*.json" | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination "$dstDir\$($_.Name)" -Force
    Write-Host "  ✓ Copiado: $($_.Name)" -ForegroundColor Green
}

$count = (Get-ChildItem -Path $dstDir -Filter "*.json").Count
Write-Host "`n✅ Se copiaron $count archivos de factories`n" -ForegroundColor Green
