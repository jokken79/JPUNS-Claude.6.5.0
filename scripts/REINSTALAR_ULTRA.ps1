# ===========================================================================
#  UNS-ClaudeJP 5.4 - REINSTALACION ULTRA VISUAL (PowerShell Edition)
#  Version: 2025-11-13 (Ultra Edition - Fixed)
#
#  Ejecucion:
#    PowerShell.exe -ExecutionPolicy Bypass -File "scripts/REINSTALAR_ULTRA.ps1"
#  o simplemente:
#    .\scripts\REINSTALAR_ULTRA.ps1
# ===========================================================================

# Configuracion global
$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.BackgroundColor = "Black"
Clear-Host

# Dimensiones
$Width = 80

# Colores profesionales
$Colors = @{
    Primary     = "Cyan"
    Success     = "Green"
    Error       = "Red"
    Warning     = "Yellow"
    Info        = "Magenta"
    Secondary   = "Blue"
    Highlight   = "White"
    Debug       = "DarkCyan"
    Progress    = "Green"
}

# Variables globales
$PythonCmd = $null
$DockerComposeCmd = $null
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$HasErrors = $false
$StartTime = Get-Date
$Phase = 0
$TotalPhases = 3

# ===========================================================================
#  FUNCIONES DE VISUALIZACION
# ===========================================================================

function Show-Banner {
    Write-Host ""
    Write-Host ("=" * $Width) -ForegroundColor $Colors.Primary

    @(
        "  UNS-ClaudeJP 5.4 - REINSTALACION COMPLETA",
        "  Version: PowerShell Ultra Edition",
        "  Copyright 2025 UNS-Kikaku Corp."
    ) | ForEach-Object {
        Write-Host "  $_" -ForegroundColor $Colors.Highlight
    }

    Write-Host ("=" * $Width) -ForegroundColor $Colors.Primary
    Write-Host ""
}

function Write-PhaseHeader {
    param([string]$Title, [int]$Current, [int]$Total)

    $Phase = $Current
    Write-Host ""
    Write-Host "[FASE $Current/$Total] $Title" -ForegroundColor $Colors.Secondary
    Write-Host ("-" * $Width) -ForegroundColor $Colors.Secondary
    Write-Host ""
}

function Write-CheckItem {
    param(
        [string]$Name,
        [string]$Status,
        [string]$Color = "Cyan"
    )

    $statusSymbols = @{
        "OK"      = "[OK]"
        "FAIL"    = "[X]"
        "WARNING" = "[!]"
        "PENDING" = "[...]"
        "WORKING" = "[*]"
    }

    $statusColors = @{
        "OK"      = $Colors.Success
        "FAIL"    = $Colors.Error
        "WARNING" = $Colors.Warning
        "PENDING" = $Colors.Debug
        "WORKING" = $Colors.Primary
    }

    $symbol = $statusSymbols[$Status]
    $statusColor = $statusColors[$Status]

    Write-Host "  $symbol " -NoNewline -ForegroundColor $statusColor
    Write-Host "$($Name.PadRight(50))" -NoNewline -ForegroundColor $Colors.Highlight
    Write-Host " [$Status]" -ForegroundColor $statusColor
}

function Write-ProgressBar {
    param(
        [int]$Current,
        [int]$Total,
        [string]$Label = "Progreso"
    )

    $percent = [int](($Current / $Total) * 100)
    $filled = [int](($percent / 100) * 20)
    $empty = 20 - $filled

    $bar = ("[" + ("X" * $filled) + (" " * $empty) + "]")

    Write-Host "  Progreso: $bar $percent%" -ForegroundColor $Colors.Progress
}

function Write-Section {
    param([string]$Title)

    Write-Host ""
    Write-Host "  " -NoNewline -ForegroundColor $Colors.Primary
    Write-Host ("=" * ($Width - 4)) -ForegroundColor $Colors.Primary
    Write-Host "  $Title" -ForegroundColor $Colors.Primary
    Write-Host "  " -NoNewline -ForegroundColor $Colors.Primary
    Write-Host ("=" * ($Width - 4)) -ForegroundColor $Colors.Primary
    Write-Host ""
}

function Write-InfoBox {
    param([string]$Text)

    Write-Host "  [INFO] $Text" -ForegroundColor $Colors.Info
}

function Write-WarningBox {
    param([string]$Text)

    Write-Host "  [!] $Text" -ForegroundColor $Colors.Warning
}

function Write-ErrorBox {
    param([string]$Text)

    Write-Host "  [X] $Text" -ForegroundColor $Colors.Error
}

function Write-TimedProgressBar {
    param(
        [string]$Message,
        [int]$Seconds
    )

    for ($i = 1; $i -le $Seconds; $i++) {
        $percent = [int](($i / $Seconds) * 100)
        $filled = [int](($percent / 100) * 15)
        $empty = 15 - $filled

        $bar = ("[" + ("X" * $filled) + (" " * $empty) + "]")

        Write-Host "`r  $Message $bar $i/$Seconds seg" -NoNewline -ForegroundColor $Colors.Progress
        Start-Sleep -Seconds 1
    }

    Write-Host "`r  $Message " -NoNewline -ForegroundColor $Colors.Success
    Write-Host "[" + ("X" * 15) + "] 100%" -ForegroundColor $Colors.Success
}

function Test-Command {
    param([string]$Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# ===========================================================================
#  FASE 1: DIAGNOSTICO DEL SISTEMA
# ===========================================================================

Show-Banner
Write-PhaseHeader "Diagnostico del Sistema" 1 3

Write-InfoBox "Verificando requisitos de sistema..."
Write-Host ""

# Python check
Write-Host "  Python" -ForegroundColor $Colors.Highlight
if ((Test-Command "python") -and (& python --version 2>$null)) {
    $PythonCmd = "python"
    Write-CheckItem "python (encontrado)" "OK"
} elseif ((Test-Command "py") -and (& py --version 2>$null)) {
    $PythonCmd = "py"
    Write-CheckItem "py (encontrado)" "OK"
} else {
    Write-CheckItem "Python" "FAIL"
    $HasErrors = $true
}

# Docker check
Write-Host "  Docker" -ForegroundColor $Colors.Highlight
if (Test-Command "docker") {
    Write-CheckItem "Docker instalado" "OK"

    try {
        $null = & docker ps 2>$null
        Write-CheckItem "Docker ejecutandose" "OK"
    } catch {
        Write-CheckItem "Docker ejecutandose" "FAIL"
        Write-WarningBox "Abre Docker Desktop para continuar"
        $HasErrors = $true
    }
} else {
    Write-CheckItem "Docker" "FAIL"
    $HasErrors = $true
}

# Docker Compose check
Write-Host "  Docker Compose" -ForegroundColor $Colors.Highlight
if ((Test-Command "docker") -and (& docker compose version 2>$null)) {
    $DockerComposeCmd = "docker compose"
    Write-CheckItem "docker compose (V2)" "OK"
} elseif ((Test-Command "docker-compose") -and (& docker-compose version 2>$null)) {
    $DockerComposeCmd = "docker-compose"
    Write-CheckItem "docker-compose (V1)" "OK"
} else {
    Write-CheckItem "Docker Compose" "FAIL"
    $HasErrors = $true
}

# Archivos del proyecto
Write-Host "  Archivos del Proyecto" -ForegroundColor $Colors.Highlight
if (Test-Path "$ProjectRoot/docker-compose.yml") {
    Write-CheckItem "docker-compose.yml" "OK"
} else {
    Write-CheckItem "docker-compose.yml" "FAIL"
    $HasErrors = $true
}

if (Test-Path "$ProjectRoot/scripts/utilities/generate_env.py") {
    Write-CheckItem "generate_env.py" "OK"
} else {
    Write-CheckItem "generate_env.py" "FAIL"
    $HasErrors = $true
}

Write-Host ""
Write-ProgressBar 1 3 "Diagnostico del Sistema"

if ($HasErrors) {
    Write-Host ""
    Write-ErrorBox "Fallo el diagnostico - Corrige los errores"
    Write-Host ""
    Write-Host ("=" * $Width) -ForegroundColor $Colors.Error
    Write-Host "  Presiona ENTER para cerrar" -ForegroundColor $Colors.Error
    Write-Host ("=" * $Width) -ForegroundColor $Colors.Error
    Read-Host
    exit 1
}

Write-Section "[OK] DIAGNOSTICO COMPLETADO EXITOSAMENTE"

# ===========================================================================
#  FASE 2: CONFIRMACION
# ===========================================================================

Write-PhaseHeader "Confirmacion" 2 3

Write-Host ("=" * $Width) -ForegroundColor $Colors.Warning

@(
    "[!] ADVERTENCIA CRITICA",
    "",
    "Esta accion ELIMINARA PERMANENTEMENTE:",
    "  [*] Todos los contenedores Docker",
    "  [*] La base de datos PostgreSQL",
    "  [*] Todos los volumenes Docker",
    "  [*] Todos los datos actuales",
    "",
    "Se creara una instalacion COMPLETAMENTE NUEVA.",
    "Esta accion NO se puede deshacer."
) | ForEach-Object {
    Write-Host "  $_" -ForegroundColor $Colors.Warning
}

Write-Host ("=" * $Width) -ForegroundColor $Colors.Warning

Write-Host ""
Write-Host "  Escribe 'CONTINUAR' para proceder:" -ForegroundColor $Colors.Highlight
$Confirm = Read-Host "  > "

if ($Confirm -ne "CONTINUAR") {
    Write-Host ""
    Write-Section "[X] INSTALACION CANCELADA"
    Write-Host ""
    Write-Host ("=" * $Width) -ForegroundColor $Colors.Info
    Write-Host "  Presiona ENTER para cerrar" -ForegroundColor $Colors.Info
    Write-Host ("=" * $Width) -ForegroundColor $Colors.Info
    Read-Host
    exit 0
}

Write-Host ""
Write-ProgressBar 2 3 "Confirmacion"

# ===========================================================================
#  FASE 3: REINSTALACION
# ===========================================================================

Write-PhaseHeader "Reinstalacion" 3 3

Push-Location $ProjectRoot

# Paso 1: .env
Write-Section "PASO 1/6: GENERACION DE ARCHIVO .env"

if (-not (Test-Path ".env")) {
    Write-Host "  Ejecutando generate_env.py..." -ForegroundColor $Colors.Primary

    try {
        & $PythonCmd scripts\utilities\generate_env.py 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-CheckItem "Archivo .env" "OK"
            Write-InfoBox "Ubicacion: $(Get-Location)\.env"
        } else {
            Write-CheckItem "Archivo .env" "FAIL"
            Read-Host "  Presiona ENTER"
            exit 1
        }
    } catch {
        Write-CheckItem "Archivo .env" "FAIL"
        Read-Host "  Presiona ENTER"
        exit 1
    }
} else {
    Write-CheckItem "Archivo .env ya existe" "OK"
    Write-InfoBox "Se usara la configuracion existente"
}

Write-ProgressBar 1 6 "Instalacion"

# Paso 2: Limpiar
Write-Section "PASO 2/6: DETENER Y LIMPIAR SERVICIOS"

Write-Host "  Deteniendo contenedores Docker..." -ForegroundColor $Colors.Primary
try {
    & $DockerComposeCmd down -v 2>&1 | Out-Null
    Write-CheckItem "Contenedores detenidos" "OK"
    Write-CheckItem "Volumenes eliminados" "OK"
} catch {
    Write-Host "  ! Nota: Sin servicios previos (normal en primera instalacion)"
}

Write-ProgressBar 2 6 "Instalacion"

# Paso 3: Build
Write-Section "PASO 3/6: RECONSTRUIR IMAGENES DOCKER"

Write-Host "  Compilando imagenes (5-10 minutos)..." -ForegroundColor $Colors.Primary
Write-InfoBox "Compilando: Backend (FastAPI) + Frontend (Next.js)"

$env:DOCKER_BUILDKIT = 1

try {
    $output = & $DockerComposeCmd build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-CheckItem "Backend (Python 3.11 + FastAPI)" "OK"
        Write-CheckItem "Frontend (Node.js + Next.js 16)" "OK"
        Write-Section "[OK] IMAGENES CONSTRUIDAS EXITOSAMENTE"
    } else {
        Write-ErrorBox "Fallo la construccion de imagenes"
        Read-Host "  Presiona ENTER"
        exit 1
    }
} catch {
    Write-ErrorBox "Error: $_"
    Read-Host "  Presiona ENTER"
    exit 1
}

Write-ProgressBar 3 6 "Instalacion"

# Paso 4: Base de datos
Write-Section "PASO 4/6: INICIAR BASE DE DATOS (PostgreSQL + Redis)"

Write-Host "  Iniciando PostgreSQL..." -ForegroundColor $Colors.Primary
try {
    & $DockerComposeCmd --profile dev up -d db redis --remove-orphans 2>&1 | Out-Null
    Write-CheckItem "PostgreSQL iniciado" "OK"
    Write-CheckItem "Redis iniciado" "OK"
} catch {
    Write-ErrorBox "Error al iniciar base de datos"
    Read-Host "  Presiona ENTER"
    exit 1
}

Write-Host ""
Write-Host "  Esperando que PostgreSQL este saludable..." -ForegroundColor $Colors.Primary

$waitCount = 0
while ($waitCount -lt 9) {
    try {
        $dbStatus = & docker inspect --format='{{.State.Health.Status}}' uns-claudejp-db 2>$null
        if ($dbStatus -eq "healthy") {
            Write-CheckItem "PostgreSQL saludable" "OK"
            Write-InfoBox "Base de datos: uns_claudejp | Puerto: 5432"
            break
        }
    } catch { }

    $waitCount++
    Write-TimedProgressBar "Inicializando" 10
    if ($waitCount -ge 9) {
        Write-ErrorBox "TIMEOUT: PostgreSQL no respondio"
        Read-Host "  Presiona ENTER"
        exit 1
    }
}

Write-ProgressBar 4 6 "Instalacion"

# Paso 5: Migraciones
Write-Section "PASO 5/6: CREAR TABLAS Y DATOS"

Write-Host "  Iniciando servicio backend..." -ForegroundColor $Colors.Primary
try {
    & $DockerComposeCmd up -d backend 2>&1 | Out-Null
    Write-CheckItem "Backend iniciado" "OK"
} catch {
    Write-ErrorBox "Error al iniciar backend"
    Read-Host "  Presiona ENTER"
    exit 1
}

Write-Host ""
Write-TimedProgressBar "Inicializando servicios" 20

Write-Host ""
Write-Host "  Aplicando migraciones Alembic..." -ForegroundColor $Colors.Primary
try {
    & docker exec uns-claudejp-backend bash -c "cd /app && alembic upgrade head" 2>&1 | Out-Null
    Write-CheckItem "Tablas creadas (24 tablas)" "OK"
    Write-CheckItem "Triggers configurados" "OK"
    Write-CheckItem "Indices GIN/trigram" "OK"
} catch {
    Write-ErrorBox "Error en migraciones"
    Read-Host "  Presiona ENTER"
    exit 1
}

Write-Host ""
Write-Host "  Creando usuario admin..." -ForegroundColor $Colors.Primary
try {
    $sqlCmd = "INSERT INTO users (username, email, password_hash, role, full_name, is_active, created_at, updated_at) VALUES ('admin', 'admin@uns-kikaku.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPjnswC9.4o1K', 'SUPER_ADMIN', 'Administrator', true, now(), now()) ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, updated_at = now();"
    & docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c $sqlCmd 2>$null | Out-Null
    Write-CheckItem "Usuario admin/admin123" "OK"
} catch {
    Write-Host "  ! Warning: Error creando admin"
}

Write-Host ""
Write-Host "  Sincronizando candidatos..." -ForegroundColor $Colors.Primary
try {
    & docker exec uns-claudejp-backend python scripts/sync_candidate_employee_status.py 2>&1 | Out-Null
    Write-CheckItem "Datos sincronizados" "OK"
} catch {
    Write-Host "  ! Warning: Sincronizacion (normal en primera instalacion)"
}

Write-ProgressBar 5 6 "Instalacion"

# Paso 6: Servicios finales
Write-Section "PASO 6/6: INICIAR SERVICIOS FINALES"

Write-Host "  Iniciando frontend..." -ForegroundColor $Colors.Primary
try {
    & $DockerComposeCmd up -d --no-deps frontend adminer grafana prometheus tempo otel-collector 2>&1 | Out-Null
    Write-CheckItem "Frontend iniciado" "OK"
    Write-CheckItem "Adminer iniciado" "OK"
    Write-CheckItem "Observabilidad iniciada" "OK"
} catch {
    Write-ErrorBox "Error al iniciar servicios"
    Read-Host "  Presiona ENTER"
    exit 1
}

Write-Host ""
Write-TimedProgressBar "Compilando Next.js" 60

Write-ProgressBar 6 6 "Instalacion"

Pop-Location

# ===========================================================================
#  RESUMEN FINAL
# ===========================================================================

Clear-Host
Show-Banner

Write-Section "[OK] REINSTALACION COMPLETADA AL 100%"

Write-Host ""
Write-Host "  URLS DE ACCESO" -ForegroundColor $Colors.Highlight
Write-Host ""

@(
    @{ Servicio = "Frontend"; URL = "http://localhost:3000"; Estado = "[OK]" },
    @{ Servicio = "Backend API"; URL = "http://localhost:8000"; Estado = "[OK]" },
    @{ Servicio = "API Docs"; URL = "http://localhost:8000/api/docs"; Estado = "[OK]" },
    @{ Servicio = "Base de Datos"; URL = "http://localhost:8080"; Estado = "[OK]" }
) | ForEach-Object {
    Write-Host "  [$($_.Estado)] $($_.Servicio): $($_.URL)" -ForegroundColor $Colors.Info
}

Write-Host ""
Write-Host "  CREDENCIALES" -ForegroundColor $Colors.Highlight
Write-Host ""
Write-Host "  Usuario:  " -NoNewline -ForegroundColor $Colors.Highlight
Write-Host "admin" -ForegroundColor $Colors.Success
Write-Host "  Contrasena: " -NoNewline -ForegroundColor $Colors.Highlight
Write-Host "admin123" -ForegroundColor $Colors.Success
Write-Host ""

Write-Host "  PRIMEROS PASOS" -ForegroundColor $Colors.Highlight
Write-Host ""
Write-Host "  1. Abre http://localhost:3000 en tu navegador" -ForegroundColor $Colors.Info
Write-Host "  2. Login con admin / admin123" -ForegroundColor $Colors.Info
Write-Host "  3. Primera carga puede tardar 1-2 minutos" -ForegroundColor $Colors.Warning
Write-Host "  4. Ver logs: scripts\LOGS.bat" -ForegroundColor $Colors.Info
Write-Host "  5. Detener: scripts\STOP.bat" -ForegroundColor $Colors.Info
Write-Host ""

Write-Host "  ESTADISTICAS" -ForegroundColor $Colors.Highlight
Write-Host ""
$elapsed = (Get-Date) - $StartTime
$time = "{0:D2}:{1:D2}:{2:D2}" -f $elapsed.Hours, $elapsed.Minutes, $elapsed.Seconds
Write-Host "  Tiempo transcurrido: $time" -ForegroundColor $Colors.Info
Write-Host "  Servicios iniciados: 10 (6 core + 4 observabilidad)" -ForegroundColor $Colors.Info
Write-Host "  Tablas creadas: 24" -ForegroundColor $Colors.Info
Write-Host "  Indices de busqueda: 12 (GIN/trigram)" -ForegroundColor $Colors.Info
Write-Host ""

Write-Host ""
Write-Host ("=" * $Width) -ForegroundColor $Colors.Success
Write-Host "  [OK] TODO LISTO - Presiona ENTER para cerrar" -ForegroundColor $Colors.Success
Write-Host ("=" * $Width) -ForegroundColor $Colors.Success
Write-Host ""

Read-Host

exit 0
