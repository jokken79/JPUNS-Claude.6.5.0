# 🛠️ Scripts de Administración - UNS-ClaudeJP 4.2

Esta carpeta contiene scripts batch para Windows. Cada sección incluye comandos equivalentes para Linux/macOS.

---

## 🚀 Scripts Principales

### START.bat
**Iniciar el sistema completo (Windows)**

```batch
scripts\START.bat
```

**Equivalente Linux/macOS**

```bash
python generate_env.py
docker compose up -d
```

### STOP.bat
**Detener todos los servicios**

```batch
scripts\STOP.bat
```

**Equivalente Linux/macOS**

```bash
docker compose down
```

### LOGS.bat
**Ver logs de los servicios**

```batch
scripts\LOGS.bat
```

**Equivalente Linux/macOS**

```bash
docker compose logs -f <servicio>
```

---

## 🔧 Scripts de Mantenimiento

### BACKUP_DATOS.bat ⭐ NUEVO
**Crear backup de toda la base de datos**

```batch
scripts\BACKUP_DATOS.bat
```

Crea dos archivos:
- `backend/backups/backup_YYYYMMDD_HHMMSS.sql` - Backup con fecha
- `backend/backups/production_backup.sql` - Usado automáticamente por REINSTALAR.bat

**Equivalente Linux/macOS**

```bash
mkdir -p backend/backups
docker exec uns-claudejp-db pg_dump -U uns_admin uns_claudejp > backend/backups/production_backup.sql
```

### RESTAURAR_DATOS.bat ⭐ NUEVO
**Restaurar datos desde backup (sin reinstalar)**

```batch
scripts\RESTAURAR_DATOS.bat
```

**Equivalente Linux/macOS**

```bash
docker exec -i uns-claudejp-db psql -U uns_admin uns_claudejp < backend/backups/production_backup.sql
```

### REINSTALAR.bat
**Reinstalación completa del sistema**

```batch
scripts\REINSTALAR.bat
```

**⚠️ Ahora con restauración automática:**
- Si existe `backend/backups/production_backup.sql`, pregunta si restaurar
- Si dices SÍ → Restaura tus datos guardados
- Si dices NO → Usa datos demo por defecto

**Equivalente Linux/macOS**

```bash
docker compose down -v
docker compose up --build -d
# Si quieres restaurar backup:
docker exec -i uns-claudejp-db psql -U uns_admin uns_claudejp < backend/backups/production_backup.sql
```

### REINSTALAR_MEJORADO.bat
**Reinstalación guiada con restauración automática de backups**

```batch
scripts\REINSTALAR_MEJORADO.bat
```

Incluye validaciones adicionales, crea un respaldo previo y automatiza la restauración del último
backup disponible. Úsalo cuando necesites reinstalar sin perder cambios recientes.

### REINSTALAR_MEJORADO_DEBUG.bat
**Versión detallada para depuración**

```batch
scripts\REINSTALAR_MEJORADO_DEBUG.bat
```

Muestra cada comando ejecutado, conserva trazas en `logs/reinstalar_debug.log` y permite revisar
paso a paso dónde ocurre cualquier error.

### DEBUG_REINSTALAR.bat
**Analiza fallos durante la reinstalación**

```batch
scripts\DEBUG_REINSTALAR.bat
```

Recopila información de contenedores, verifica backups y sugiere acciones correctivas antes de
volver a ejecutar el proceso de reinstalación.

### CLEAN.bat
**Limpieza profunda del sistema (⚠️ borra datos y cachés)**

```batch
scripts\CLEAN.bat
```

**Equivalente Linux/macOS**

```bash
docker compose down -v
docker system prune -f
rm -rf backend/__pycache__ frontend/.next logs/*
docker compose up --build -d
```

### LIMPIAR_CACHE.bat
**Limpiar caché de Docker (sin borrar volúmenes)**

```batch
scripts\LIMPIAR_CACHE.bat
```

**Equivalente Linux/macOS**

```bash
docker system prune -f
docker builder prune -f
```

### DIAGNOSTICO.bat
**Diagnóstico completo del sistema**

```batch
scripts\DIAGNOSTICO.bat
```

**Equivalente Linux/macOS**

```bash
docker compose ps
docker compose logs --tail 50
```

### INSTALAR.bat
**Instalación inicial del sistema**

```batch
scripts\INSTALAR.bat
```

**Equivalente Linux/macOS**

```bash
cp .env.example .env
python generate_env.py
docker compose build
```

---

## 🤖 Scripts de Gestión de Agentes

### INSTALL_007_AGENTS.bat ⭐ NUEVO
**Instalador interactivo de Claude 007 Agent System (88 agentes)**

```batch
scripts\INSTALL_007_AGENTS.bat
```

**Opciones disponibles:**
1. Instalar a proyecto UNS-ClaudeJP (recomendado)
2. Instalar globalmente (sistema completo)
3. Crear backup de agentes existentes
4. Ver lista completa de agentes
5. Verificar instalación

**¿Qué incluye?**
- 88 agentes especializados en 18 categorías
- Context Orchestrators (@vibe-coding-coordinator, @exponential-planner)
- Safety Specialists (@leaf-node-detector, @verification-specialist)
- Performance Optimizers (@parallel-coordinator, @session-optimizer)
- Backend experts (Rails, Django, Laravel, Node.js, Go)
- Frontend experts (React, Vue, Next.js)
- Y muchos más...

**Equivalente Linux/macOS**

```bash
# Instalar a proyecto
cp -r claude-007-agents/.claude/agents/* .claude/agents/
cp claude-007-agents/agents.json ./agents.json

# Instalar globalmente
cp -r claude-007-agents/.claude/agents/* ~/.claude/agents/
cp claude-007-agents/agents.json ~/.claude/agents.json
```

---

## 🧪 Scripts relacionados con QA

| Acción | Windows | Linux/macOS |
|--------|---------|-------------|
| Ejecutar pruebas backend | `pytest backend\tests` | `pytest backend/tests` |
| Revisar healthcheck | `curl http://localhost:8000/api/health` | igual |

---

## 📚 Recursos adicionales

- [README.md](../README.md) para flujo completo
- [DOCS.md](../DOCS.md) índice general
- [docs/issues/AUTH_ERROR_401.md](../docs/issues/AUTH_ERROR_401.md) para entender errores 401

---

**Última actualización:** 2025-02-10
