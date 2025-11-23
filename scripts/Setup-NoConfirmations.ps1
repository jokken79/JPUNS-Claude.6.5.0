# ============================================================================
# SCRIPT: Setup-NoConfirmations.ps1
# Propósito: Crear automáticamente archivos de configuración para 8 herramientas
# Uso: PowerShell -ExecutionPolicy Bypass -File Setup-NoConfirmations.ps1
# ============================================================================

param(
    [switch]$Interactive = $true,
    [switch]$BackupExisting = $true
)

# Colores para terminal
$Colors = @{
    Success = "Green"
    Error   = "Red"
    Warning = "Yellow"
    Info    = "Cyan"
}

function Write-Status {
    param([string]$Message, [string]$Status = "Info")
    $Color = $Colors[$Status]
    Write-Host "[$Status] " -ForegroundColor $Color -NoNewline
    Write-Host $Message
}

function Create-DirectoryIfNotExists {
    param([string]$Path)
    if (-not (Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
        Write-Status "Directorio creado: $Path" "Success"
    }
}

function Backup-ExistingFile {
    param([string]$FilePath)
    if ((Test-Path $FilePath) -and $BackupExisting) {
        $Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $BackupPath = "$FilePath.backup.$Timestamp"
        Copy-Item -Path $FilePath -Destination $BackupPath
        Write-Status "Backup creado: $BackupPath" "Warning"
        return $BackupPath
    }
}

# Variables
$ProjectRoot = Get-Location
$VsCodeDir = "$ProjectRoot\.vscode"
$FilesCreated = 0
$FilesFailed = 0

Write-Host ""
Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host "  SETUP: Skip Bash Confirmations para 8 herramientas IA" -ForegroundColor Cyan
Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# 1. .vscode/settings.json
# ============================================================================
Write-Status "Creando .vscode\settings.json..." "Info"
Create-DirectoryIfNotExists $VsCodeDir
Backup-ExistingFile "$VsCodeDir\settings.json"

$VsCodeSettings = @{
    "github.copilot.runCommandsWithoutConfirmation" = $true
    "github.copilot.advanced"                        = @{
        "trust"                 = "always"
        "terminalTrustLevel"    = "always"
        "commandExecutionLevel" = "always"
    }
    "powershell.executionPolicy"                    = "Bypass"
    "terminal.integrated.shellArgs.windows"         = @("-NoExit")
}

try {
    $VsCodeSettings | ConvertTo-Json | Set-Content "$VsCodeDir\settings.json" -Encoding UTF8
    Write-Status ".vscode\settings.json creado" "Success"
    $FilesCreated++
} catch {
    Write-Status "Error: $_" "Error"
    $FilesFailed++
}

# ============================================================================
# 2. .cursorrules
# ============================================================================
Write-Status "Creando .cursorrules..." "Info"
Backup-ExistingFile "$ProjectRoot\.cursorrules"

$CursorRules = @"
# .cursorrules - Development Configuration

## Terminal Execution
- Skip terminal confirmation prompts in development
- Execute bash/powershell commands without approval
- Trust local development environment (localhost, 127.0.0.1)
- Auto-execute commands when safe

## Configuration
- Cursor config: terminalTrustLevel = "always"
- Skip permission checks for development workflow
- Commands allowed: git, npm, docker, python, bash, powershell

## Important
- This is for DEVELOPMENT ONLY
- Disable before production deployments
- Review commands before execution in automated workflows
"@

try {
    Set-Content -Path "$ProjectRoot\.cursorrules" -Value $CursorRules -Encoding UTF8
    Write-Status ".cursorrules creado" "Success"
    $FilesCreated++
} catch {
    Write-Status "Error: $_" "Error"
    $FilesFailed++
}

# ============================================================================
# 3. .windsurfrules
# ============================================================================
Write-Status "Creando .windsurfrules..." "Info"
Backup-ExistingFile "$ProjectRoot\.windsurfrules"

$WindsurfRules = @"
# .windsurfrules - Windsurf Configuration

## Terminal Execution
- Skip confirmation prompts for CLI commands
- Treat local development environment as trusted
- Execute bash/powershell without approval
- Allow Docker, git, npm, python commands automatically

## Security
- Skip confirmations only for development branches
- Skip only for localhost or 127.0.0.1 commands
- Re-enable before production deployment

## Allowed Commands
- docker compose
- npm install/run
- git operations
- python scripts
- bash scripts
"@

try {
    Set-Content -Path "$ProjectRoot\.windsurfrules" -Value $WindsurfRules -Encoding UTF8
    Write-Status ".windsurfrules creado" "Success"
    $FilesCreated++
} catch {
    Write-Status "Error: $_" "Error"
    $FilesFailed++
}

# ============================================================================
# 4. kilo.config.yaml
# ============================================================================
Write-Status "Creando kilo.config.yaml..." "Info"
Backup-ExistingFile "$ProjectRoot\kilo.config.yaml"

$KiloConfig = @"
# Kilo Code Configuration

[terminal]
skip_confirmations = true
trust_level = always
auto_execute = true

[bash]
require_confirmation = false
sandbox_mode = false

[powershell]
execution_policy = bypass
require_confirmation = false

[development]
environment = local
auto_update_deps = false
run_tests_on_save = false
"@

try {
    Set-Content -Path "$ProjectRoot\kilo.config.yaml" -Value $KiloConfig -Encoding UTF8
    Write-Status "kilo.config.yaml creado" "Success"
    $FilesCreated++
} catch {
    Write-Status "Error: $_" "Error"
    $FilesFailed++
}

# ============================================================================
# 5. gemini.config.json
# ============================================================================
Write-Status "Creando gemini.config.json..." "Info"
Backup-ExistingFile "$ProjectRoot\gemini.config.json"

$GeminiConfig = @{
    "terminal" = @{
        "skipPrompts"          = $true
        "trustLocalEnvironment" = $true
        "autoExecuteCommands"   = $true
    }
    "security" = @{
        "sandboxMode"       = $false
        "requireApprovalFor" = @()
    }
} | ConvertTo-Json

try {
    Set-Content -Path "$ProjectRoot\gemini.config.json" -Value $GeminiConfig -Encoding UTF8
    Write-Status "gemini.config.json creado" "Success"
    $FilesCreated++
} catch {
    Write-Status "Error: $_" "Error"
    $FilesFailed++
}

# ============================================================================
# 6. copilot.config.json
# ============================================================================
Write-Status "Creando copilot.config.json..." "Info"
Backup-ExistingFile "$ProjectRoot\copilot.config.json"

$CopilotConfig = @{
    "terminal" = @{
        "skipConfirmations" = $true
        "trustLevel"        = "always"
        "autoExecute"       = $true
    }
    "commands" = @{
        "sandbox"          = $false
        "requireApproval"  = $false
    }
} | ConvertTo-Json

try {
    Set-Content -Path "$ProjectRoot\copilot.config.json" -Value $CopilotConfig -Encoding UTF8
    Write-Status "copilot.config.json creado" "Success"
    $FilesCreated++
} catch {
    Write-Status "Error: $_" "Error"
    $FilesFailed++
}

# ============================================================================
# 7. .claude/mcp_config.json
# ============================================================================
Write-Status "Creando .claude\mcp_config.json..." "Info"
Create-DirectoryIfNotExists "$ProjectRoot\.claude"
Backup-ExistingFile "$ProjectRoot\.claude\mcp_config.json"

$ClaudeConfig = @{
    "mcpServers" = @{
        "bash" = @{
            "command" = "bash"
            "env"     = @{
                "CLAUDE_SKIP_CONFIRMATIONS" = "true"
                "CLAUDE_TRUST_LEVEL"        = "always"
                "CLAUDE_AUTO_EXECUTE"       = "true"
            }
        }
        "powershell" = @{
            "command" = "powershell"
            "args"    = @("-ExecutionPolicy", "Bypass")
            "env"     = @{
                "CLAUDE_SKIP_CONFIRMATIONS" = "true"
            }
        }
    }
    "security" = @{
        "sandboxMode"       = $false
        "requireApprovalFor" = @()
        "trustLocalhost"     = $true
    }
} | ConvertTo-Json -Depth 3

try {
    Set-Content -Path "$ProjectRoot\.claude\mcp_config.json" -Value $ClaudeConfig -Encoding UTF8
    Write-Status ".claude\mcp_config.json creado" "Success"
    $FilesCreated++
} catch {
    Write-Status "Error: $_" "Error"
    $FilesFailed++
}

# ============================================================================
# 8. .env.local
# ============================================================================
Write-Status "Creando .env.local..." "Info"
Backup-ExistingFile "$ProjectRoot\.env.local"

$EnvLocal = @"
# Environment variables - Skip CLI confirmations
CLAUDE_SKIP_CONFIRMATIONS=true
CLAUDE_TRUST_LEVEL=always
CLAUDE_AUTO_EXECUTE=true
CLAUDE_SANDBOX_MODE=false

GEMINI_SKIP_PROMPTS=true
GEMINI_TRUST_LOCAL=true
GEMINI_AUTO_EXECUTE=true

KILO_SKIP_CONFIRMATIONS=true
KILO_TRUST_LEVEL=always

GITHUB_COPILOT_SKIP_CONFIRMATIONS=true
GITHUB_COPILOT_TRUST_LEVEL=always

# Windsurf
WINDSURF_SKIP_CONFIRMATIONS=true
WINDSURF_TRUST_LEVEL=always

# Cursor
CURSOR_SKIP_CONFIRMATIONS=true
CURSOR_TRUST_LEVEL=always
"@

try {
    Set-Content -Path "$ProjectRoot\.env.local" -Value $EnvLocal -Encoding UTF8
    Write-Status ".env.local creado" "Success"
    $FilesCreated++
} catch {
    Write-Status "Error: $_" "Error"
    $FilesFailed++
}

# ============================================================================
# RESUMEN Y PRÓXIMOS PASOS
# ============================================================================
Write-Host ""
Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host "  RESULTADO" -ForegroundColor Cyan
Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host "Archivos creados: $FilesCreated/8" -ForegroundColor Green
Write-Host "Errores: $FilesFailed/8" -ForegroundColor $(if ($FilesFailed -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($FilesFailed -eq 0) {
    Write-Status "¡ÉXITO! Todos los archivos fueron creados" "Success"
    Write-Host ""
    Write-Host "📋 Próximas acciones:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Agregar a .gitignore:" -ForegroundColor Yellow
    Write-Host "   .env.local"
    Write-Host "   copilot.config.json"
    Write-Host "   gemini.config.json"
    Write-Host "   kilo.config.yaml"
    Write-Host ""
    Write-Host "2. Archivos para el repositorio (públicos):" -ForegroundColor Yellow
    Write-Host "   .cursorrules"
    Write-Host "   .windsurfrules"
    Write-Host "   .vscode/settings.json (opcional)"
    Write-Host ""
    Write-Host "3. Aplicar cambios:" -ForegroundColor Yellow
    Write-Host "   - Reinicia tu editor"
    Write-Host "   - Recarga las extensiones"
    Write-Host "   - Las IAs no pedirán confirmación"
    Write-Host ""
    Write-Host "4. Verificar funcionamiento:" -ForegroundColor Yellow
    Write-Host "   - Ejecuta: docker compose up -d"
    Write-Host "   - Debe ejecutarse sin pedir confirmación"
    Write-Host ""
} else {
    Write-Status "Algunos archivos no se crearon correctamente" "Error"
    Write-Host "Verifica permisos en: $ProjectRoot" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📁 Ubicación: $ProjectRoot" -ForegroundColor Cyan
Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host ""
