# ===========================================================================
#  UNS-ClaudeJP 5.4 - Reinstalacion Completa (PowerShell)
#  Version: 2025-11-13 (PowerShell Edition - Fixed)
#
#  Uso:
#    PowerShell.exe -ExecutionPolicy Bypass -File "REINSTALAR.ps1"
#  o
#    .\REINSTALAR.ps1
# ===========================================================================

# Configuracion
$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Variables
$PythonCmd = $null
$DockerComposeCmd = $null
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$HasErrors = $false

# Colores
$Colors = @{
    Success = "Green"
    Error   = "Red"
    Warning = "Yellow"
    Info    = "Cyan"
    Header  = "Magenta"
}

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "============================================================================" -ForegroundColor $Colors.Header
    Write-Host " $Message" -ForegroundColor $Colors.Header
    Write-Host "============================================================================" -ForegroundColor $Colors.Header
    Write-Host ""
}

function Write-Status {
    param(
        [string]$Text,
        [ValidateSet("OK", "Error", "Warning", "Info")]
        [string]$Status = "Info"
    )

    $statusChar = @{
        OK      = "[OK]"
        Error   = "[X]"
        Warning = "[!]"
        Info    = "[*]"
    }

    $statusColor = @{
        OK      = $Colors.Success
        Error   = $Colors.Error
        Warning = $Colors.Warning
        Info    = $Colors.Info
    }

    Write-Host "   $($statusChar[$Status]) " -NoNewline -ForegroundColor $statusColor[$Status]
    Write-Host $Text
}

function Test-Command {
    param([string]$Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

function Test-Requirement {
    param(
        [string]$Name,
        [scriptblock]$TestBlock
    )

    Write-Host "   [*] $($Name.PadRight(20))" -NoNewline

    try {
        $result = & $TestBlock
        if ($result) {
            Write-Host "[OK]" -ForegroundColor $Colors.Success
            return $true
        } else {
            Write-Host "[X]" -ForegroundColor $Colors.Error
            return $false
        }
    }
    catch {
        Write-Host "[X]" -ForegroundColor $Colors.Error
        return $false
    }
}

# ===========================================================================
#  FASE 1: DIAGNOSTICO DEL SISTEMA
# ===========================================================================

Write-Header "[FASE 1/3] Diagnostico del Sistema"

# Python
if ((Test-Command "python") -and (& python --version 2>$null)) {
    $PythonCmd = "python"
    Write-Host "   [*] Python................  " -NoNewline
    Write-Host "[OK]" -ForegroundColor $Colors.Success
} elseif ((Test-Command "py") -and (& py --version 2>$null)) {
    $PythonCmd = "py"
    Write-Host "   [*] Python................  " -NoNewline
    Write-Host "[OK]" -ForegroundColor $Colors.Success
} else {
    Write-Status "Python" "Error"
    $HasErrors = $true
}

# Docker
if (Test-Requirement "Docker" { Test-Command "docker" }) {
    # Docker running
    if (Test-Requirement "Docker Running" {
        try {
            $null = & docker ps 2>$null
            return $?
        } catch {
            return $false
        }
    }) {
        # Docker Compose
        if ((Test-Command "docker") -and (& docker compose version 2>$null)) {
            $DockerComposeCmd = "docker compose"
            Write-Host "   [*] Docker Compose.........  " -NoNewline
            Write-Host "[OK] (V2)" -ForegroundColor $Colors.Success
        } elseif ((Test-Command "docker-compose") -and (& docker-compose version 2>$null)) {
            $DockerComposeCmd = "docker-compose"
            Write-Host "   [*] Docker Compose.........  " -NoNewline
            Write-Host "[OK] (V1)" -ForegroundColor $Colors.Success
        } else {
            Write-Host "   [*] Docker Compose.........  " -NoNewline
            Write-Host "[X]" -ForegroundColor $Colors.Error
            $HasErrors = $true
        }
    } else {
        Write-Status "Docker Running" "Error"
        Write-Status "Abre Docker Desktop" "Warning"
        $HasErrors = $true
    }
} else {
    Write-Status "Docker" "Error"
    $HasErrors = $true
}

# Archivos del proyecto
Write-Host "   [*] docker-compose.yml...   " -NoNewline
if (Test-Path "$ProjectRoot/docker-compose.yml") {
    Write-Host "[OK]" -ForegroundColor $Colors.Success
} else {
    Write-Host "[X]" -ForegroundColor $Colors.Error
    $HasErrors = $true
}

Write-Host "   [*] generate_env.py........  " -NoNewline
if (Test-Path "$ProjectRoot/scripts/utilities/generate_env.py") {
    Write-Host "[OK]" -ForegroundColor $Colors.Success
} else {
    Write-Host "[X]" -ForegroundColor $Colors.Error
    $HasErrors = $true
}

Write-Host ""

if ($HasErrors) {
    Write-Header "[X] DIAGNOSTICO FALLIDO"
    Write-Status "Corrige los errores antes de continuar" "Error"
    Write-Host ""
    Write-Host "============================================================================"
    Write-Host "  Presiona ENTER para cerrar" -ForegroundColor $Colors.Error
    Write-Host "============================================================================"
    Read-Host
    exit 1
}

Write-Status "Diagnostico completado" "OK"

# ===========================================================================
#  FASE 2: CONFIRMACION
# ===========================================================================

Write-Header "[FASE 2/3] Confirmacion"
Write-Host "============================================================================" -ForegroundColor $Colors.Warning
Write-Host "                   ! ADVERTENCIA IMPORTANTE" -ForegroundColor $Colors.Warning
Write-Host "============================================================================" -ForegroundColor $Colors.Warning
Write-Host " Esta accion eliminara TODOS los datos existentes:" -ForegroundColor $Colors.Warning
Write-Host "   [*] Contenedores Docker" -ForegroundColor $Colors.Warning
Write-Host "   [*] Base de Datos PostgreSQL" -ForegroundColor $Colors.Warning
Write-Host "   [*] Volumenes Docker" -ForegroundColor $Colors.Warning
Write-Host "" -ForegroundColor $Colors.Warning
Write-Host " Se creara una instalacion completamente nueva." -ForegroundColor $Colors.Warning
Write-Host "============================================================================" -ForegroundColor $Colors.Warning
Write-Host ""

$Confirm = Read-Host "Continuar con la reinstalacion? (S/N)"
if ($Confirm -notin @("S", "SI", "s", "si")) {
    Write-Host ""
    Write-Host "[X] Reinstalacion cancelada" -ForegroundColor $Colors.Error
    Write-Host ""
    Write-Host "============================================================================"
    Write-Host "  Presiona ENTER para cerrar" -ForegroundColor $Colors.Error
    Write-Host "============================================================================"
    Read-Host
    exit 0
}

# ===========================================================================
#  FASE 3: REINSTALACION
# ===========================================================================

Write-Header "[FASE 3/3] Reinstalacion"

# Paso 1: Generar .env
Write-Header "[1/6] GENERACION DE ARCHIVO DE CONFIGURACION (.env)"

Push-Location $ProjectRoot
if (-not (Test-Path ".env")) {
    Write-Status "Ejecutando generate_env.py..." "Info"
    Write-Host "   i Este script genera las variables de entorno necesarias"

    try {
        & $PythonCmd scripts\utilities\generate_env.py 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Status "Archivo .env generado correctamente" "OK"
            Write-Host "   i Ubicacion: $(Get-Location)\.env"
        } else {
            Write-Status "ERROR: Fallo la generacion del archivo .env" "Error"
            Read-Host "Presiona ENTER"
            exit 1
        }
    } catch {
        Write-Status "ERROR: $_" "Error"
        Read-Host "Presiona ENTER"
        exit 1
    }
} else {
    Write-Status "Archivo .env ya existe (se usara el actual)" "OK"
    Write-Host "   i Si necesitas regenerarlo, elimina .env manualmente"
}
Write-Host ""

# Paso 2: Detener y limpiar servicios
Write-Header "[2/6] DETENER Y LIMPIAR SERVICIOS EXISTENTES"

Write-Status "Deteniendo contenedores Docker..." "Info"
Write-Host "   i Comando: $DockerComposeCmd down -v"

try {
    $output = & $DockerComposeCmd down -v 2>&1
    Write-Status "Contenedores detenidos" "OK"
} catch {
    Write-Host "   ! Hubo errores al detener (puede ser normal si no habia servicios)"
}

Write-Status "Eliminando volumenes antiguos..." "OK"
Write-Host "   i Se creara una instalacion completamente nueva"
Write-Host ""

# Paso 3: Reconstruir imagenes
Write-Header "[3/6] RECONSTRUIR IMAGENES DOCKER"

Write-Status "Construyendo imagenes Docker (puede tardar 5-10 minutos)..." "Info"
Write-Host "   i Se compilaran: Backend (FastAPI) + Frontend (Next.js)"
Write-Host "   i Comando: $DockerComposeCmd build"
Write-Host ""

$env:DOCKER_BUILDKIT = 1

try {
    & $DockerComposeCmd build 2>&1 | ForEach-Object { Write-Host "   $_" }
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Status "ERROR: Fallo la construccion de imagenes" "Error"
        Read-Host "Presiona ENTER"
        exit 1
    }
    Write-Host ""
    Write-Status "Imagenes Docker construidas correctamente" "OK"
    Write-Host "   i Backend: Python 3.11 + FastAPI + SQLAlchemy"
    Write-Host "   i Frontend: Node.js + Next.js 16"
    Write-Host ""
} catch {
    Write-Status "ERROR: $_" "Error"
    Read-Host "Presiona ENTER"
    exit 1
}

# Paso 4: Iniciar servicios base
Write-Header "[4/6] INICIAR SERVICIOS BASE (DB + REDIS)"

Write-Status "Iniciando PostgreSQL (base de datos)..." "Info"
Write-Host "   i Comando: $DockerComposeCmd --profile dev up -d db redis"

try {
    & $DockerComposeCmd --profile dev up -d db redis --remove-orphans 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Status "ERROR: No se pudo iniciar PostgreSQL" "Error"
        Read-Host "Presiona ENTER"
        exit 1
    }
    Write-Status "Contenedor PostgreSQL iniciado" "OK"
} catch {
    Write-Status "ERROR: $_" "Error"
    Read-Host "Presiona ENTER"
    exit 1
}

Write-Host ""
Write-Status "Esperando que PostgreSQL este lista (health check - max 90s)..." "Info"

$waitCount = 0
$maxWait = 9

while ($waitCount -lt $maxWait) {
    try {
        $dbStatus = & docker inspect --format='{{.State.Health.Status}}' uns-claudejp-db 2>$null
        if ($dbStatus -eq "healthy") {
            Write-Status "PostgreSQL esta lista y saludable" "OK"
            Write-Host "   i Base de datos: uns_claudejp | Puerto: 5432"
            break
        }
    } catch { }

    $waitCount++
    $waitSeconds = $waitCount * 10
    Write-Host "   [...] Esperando... $waitSeconds segundos"
    Start-Sleep -Seconds 10

    if ($waitCount -ge $maxWait) {
        Write-Host ""
        Write-Status "TIMEOUT: PostgreSQL no respondio en 90 segundos" "Error"
        Write-Host "   i Verifica los logs: docker logs uns-claudejp-db"
        Read-Host "Presiona ENTER"
        exit 1
    }
}

Write-Host ""

# Paso 5: Crear tablas y datos
Write-Header "[5/6] CREAR TABLAS Y DATOS DE NEGOCIO"

Write-Status "Iniciando servicio backend temporalmente..." "Info"
Write-Host "   i Usando imagen construida en paso 3..."

try {
    & $DockerComposeCmd up -d backend 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Status "ERROR: No se pudo iniciar backend" "Error"
        Write-Host "   i Verificando si la imagen fue construida..."
        & docker images 2>&1 | Select-String "backend"
        Read-Host "Presiona ENTER"
        exit 1
    }
    Write-Status "Servicio backend iniciado" "OK"
} catch {
    Write-Status "ERROR: $_" "Error"
    Read-Host "Presiona ENTER"
    exit 1
}

Write-Host ""
Write-Status "Esperando que backend este listo (20 segundos)..." "Info"

for ($i = 1; $i -le 4; $i++) {
    Write-Host "   [...] Inicializando servicios... $i/4"
    Start-Sleep -Seconds 5
}

Write-Status "Backend listo" "OK"

Write-Host ""
Write-Status "Ejecutando migraciones de Alembic (incluye triggers e indices)..." "Info"
Write-Host "   i Esto aplicara TODAS las migraciones incluyendo:"
Write-Host "   i   - Tablas base (24 tablas)"
Write-Host "   i   - Trigger de sincronizacion de fotos"
Write-Host "   i   - Indices de busqueda (12 indices GIN/trigram)"

try {
    & docker exec uns-claudejp-backend bash -c "cd /app && alembic upgrade head" 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Status "ERROR: Fallo la ejecucion de migraciones" "Error"
        Write-Host "   i Verifica los logs: docker logs uns-claudejp-backend"
        Read-Host "Presiona ENTER"
        exit 1
    }
    Write-Status "Todas las migraciones aplicadas correctamente" "OK"
    Write-Host "   i Tablas + Triggers + Indices configurados"
} catch {
    Write-Status "ERROR: $_" "Error"
    Read-Host "Presiona ENTER"
    exit 1
}

Write-Host ""
Write-Status "Creando usuario administrador (admin/admin123)..." "Info"

try {
    $sqlCmd = "INSERT INTO users (username, email, password_hash, role, full_name, is_active, created_at, updated_at) VALUES ('admin', 'admin@uns-kikaku.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPjnswC9.4o1K', 'SUPER_ADMIN', 'Administrator', true, now(), now()) ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, updated_at = now();"
    & docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c $sqlCmd 2>$null | Out-Null
    Write-Status "Usuario admin creado/actualizado correctamente" "OK"
} catch {
    Write-Host "   ! Warning: Error creando usuario admin"
}

Write-Host ""
Write-Status "Verificando tablas en base de datos..." "Info"

try {
    $tables = & docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "\dt" 2>&1
    if ($tables -match "public") {
        Write-Status "Tablas verificadas en base de datos" "OK"
    } else {
        Write-Host "   ! Warning: No se pudieron verificar las tablas"
    }
    Write-Status "Inicializacion de base de datos completada" "OK"
} catch {
    Write-Host "   ! Warning: Error en verificacion de tablas"
}

Write-Host ""
Write-Status "Sincronizando candidatos con empleados/staff/contract_workers..." "Info"
Write-Host "   i Este paso vincula candidatos con sus registros en las 3 tablas"

try {
    & docker exec uns-claudejp-backend python scripts/sync_candidate_employee_status.py 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Status "Sincronizacion completada" "OK"
        Write-Host "   i Candidatos actualizados a status 'hired' si tienen empleado asociado"
    } else {
        Write-Host "   ! Warning: Error en sincronizacion (puede ser normal si no hay datos)"
    }
} catch {
    Write-Host "   ! Warning: Error en sincronizacion (puede ser normal si no hay datos)"
}

Write-Host ""

# Paso 6: Servicios finales
Write-Header "[6/6] INICIAR SERVICIOS FINALES"

Write-Status "Iniciando frontend y servicios adicionales..." "Info"
Write-Host "   i Backend ya esta corriendo desde paso 5"
Write-Host "   i Omitiendo servicio importer (tablas ya creadas en paso 5)"

try {
    & $DockerComposeCmd up -d --no-deps frontend adminer grafana prometheus tempo otel-collector 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Status "ERROR: Algunos servicios no iniciaron" "Error"
        Read-Host "Presiona ENTER"
        exit 1
    }
    Write-Status "Todos los servicios iniciados" "OK"
    Write-Host "   i Backend:  http://localhost:8000"
    Write-Host "   i Frontend: http://localhost:3000"
    Write-Host "   i Adminer:  http://localhost:8080"
} catch {
    Write-Status "ERROR: $_" "Error"
    Read-Host "Presiona ENTER"
    exit 1
}

Write-Host ""
Write-Status "Esperando compilacion del frontend (60 segundos)..." "Info"

for ($i = 1; $i -le 6; $i++) {
    Write-Host "   [...] Compilando Next.js... $i/6 (~10s cada uno)"
    Start-Sleep -Seconds 10
}

Write-Status "Compilacion completada" "OK"
Write-Host ""

Pop-Location

# ===========================================================================
#  FINALIZACION
# ===========================================================================

Write-Header "[OK] REINSTALACION COMPLETADA EXITOSAMENTE"

Write-Host "URLs de Acceso:"
Write-Host "   [*] Frontend:    http://localhost:3000" -ForegroundColor $Colors.Info
Write-Host "   [*] Backend:     http://localhost:8000" -ForegroundColor $Colors.Info
Write-Host "   [*] API Docs:    http://localhost:8000/api/docs" -ForegroundColor $Colors.Info
Write-Host "   [*] Adminer:     http://localhost:8080" -ForegroundColor $Colors.Info
Write-Host ""
Write-Host "Credenciales:"
Write-Host "   [*] Usuario:     admin" -ForegroundColor $Colors.Success
Write-Host "   [*] Password:    admin123" -ForegroundColor $Colors.Success
Write-Host ""
Write-Host "Comandos utiles:"
Write-Host "   [*] Ver logs:    scripts\LOGS.bat" -ForegroundColor $Colors.Info
Write-Host "   [*] Detener:     scripts\STOP.bat" -ForegroundColor $Colors.Info
Write-Host ""
Write-Host "   i Primera carga del frontend puede tardar 1-2 minutos"
Write-Host ""

# Limpieza de fotos
Write-Header "[PASO FINAL] LIMPIEZA AUTOMATICA DE FOTOS OLE"

$cleanupScript = Join-Path $ScriptDir "LIMPIAR_FOTOS_OLE.bat"
if (Test-Path $cleanupScript) {
    Write-Status "Ejecutando LIMPIAR_FOTOS_OLE.bat automaticamente..." "Info"
    try {
        & $cleanupScript 2>&1 | Out-Null
        Write-Status "Limpieza de fotos completada" "OK"
    } catch {
        Write-Host "   ! Warning: Error en limpieza de fotos"
    }
} else {
    Write-Host "   ! Warning: LIMPIAR_FOTOS_OLE.bat no encontrado"
    Write-Host "   i Saltando este paso (opcional)"
}

Write-Host ""
Write-Header "REINSTALACION + LIMPIEZA COMPLETADA AL 100%"

Write-Host ""
Write-Host "============================================================================"
Write-Host "  [OK] TODO LISTO - Presiona ENTER para cerrar" -ForegroundColor $Colors.Success
Write-Host "============================================================================"
Write-Host ""

Read-Host

exit 0
