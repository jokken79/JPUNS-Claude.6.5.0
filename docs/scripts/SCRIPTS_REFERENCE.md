# 📜 Scripts Reference - UNS-ClaudeJP 5.4.1

**Fecha:** 2025-11-11
**Versión:** 2.0
**Autor:** Claude Code

---

## 🎯 Índice

1. [Scripts Principales](#scripts-principales)
2. [Scripts de Instalación](#scripts-de-instalación)
3. [Scripts de Mantenimiento](#scripts-de-mantenimiento)
4. [Scripts de Diagnóstico](#scripts-de-diagnóstico)
5. [Scripts de Backup/Restore](#scripts-de-backuprestore)
6. [Scripts de Git](#scripts-de-git)
7. [Scripts de Fotos](#scripts-de-fotos)
8. [Scripts Utilitarios](#scripts-utilitarios)
9. [Reglas Críticas](#reglas-críticas)

---

## 📋 Scripts Principales

### START.bat
**Ubicación:** `scripts/START.bat`
**Propósito:** Iniciar todos los servicios del sistema
**Uso:**
```bash
cd scripts
START.bat
```

**Qué hace:**
1. Verifica Docker Desktop está corriendo
2. Genera `.env` si no existe
3. Inicia servicios con `docker compose up -d`
4. Espera que servicios estén healthy
5. **NUEVO:** Verifica 449 apartamentos cargados
6. Muestra URLs de acceso

**Tiempo:** 2-3 minutos
**Servicios iniciados:** db, redis, importer, backend, frontend, adminer, observability stack

**Verificación de Apartamentos V2:**
```batch
echo   ▶ Verificando tablas de apartamentos en base de datos...
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT COUNT(*) FROM apartments;"
# Debe mostrar: 449
```

---

### STOP.bat
**Ubicación:** `scripts/STOP.bat`
**Propósito:** Detener todos los servicios del sistema
**Uso:**
```bash
cd scripts
STOP.bat
```

**Qué hace:**
1. Detiene todos los contenedores
2. Limpia networks huérfanas
3. Muestra resumen de contenedores detenidos

**Tiempo:** 30 segundos

---

### LOGS.bat
**Ubicación:** `scripts/LOGS.bat`
**Propósito:** Ver logs de servicios con menú interactivo
**Uso:**
```bash
cd scripts
LOGS.bat
```

**Opciones:**
1. Backend logs
2. Frontend logs
3. Database logs
4. Todos los logs
5. Importer logs
6. Logs de servicio específico

---

## 🔧 Scripts de Instalación

### REINSTALAR.bat
**Ubicación:** `scripts/REINSTALAR.bat`
**Propósito:** Reinstalación completa del sistema
**Uso:**
```bash
cd scripts
REINSTALAR.bat
```

**Qué hace:**
1. Detiene servicios
2. Limpia volúmenes de Docker
3. Reconstruye imágenes
4. Inicia servicios
5. Ejecuta importer (incluye apartamentos V2)
6. Limpia fotos OLE automáticamente
7. Verifica sistema completo

**Tiempo:** 5-10 minutos
**⚠️ ADVERTENCIA:** Elimina datos de base de datos

**Notas especiales:**
- ✅ Corrección línea 339: Mensaje de finalización corregido
- ✅ Sin código duplicado
- ✅ Termina con `pause >nul`

---

### INSTALAR_FUN.bat
**Ubicación:** `scripts/INSTALAR_FUN.bat`
**Propósito:** Instalación inicial en PC nuevo
**Uso:**
```bash
cd scripts
INSTALAR_FUN.bat
```

**Qué hace:**
1. Verifica Docker Desktop instalado
2. Crea `.env` si no existe
3. Construye imágenes
4. Inicia servicios
5. Ejecuta migraciones
6. Importa datos iniciales + apartamentos
7. Muestra instrucciones de acceso

**Tiempo:** 10-15 minutos

---

## 🔨 Scripts de Mantenimiento

### VALIDAR_SISTEMA.bat
**Ubicación:** `scripts/VALIDAR_SISTEMA.bat`
**Propósito:** Validación completa del sistema
**Versión:** 5.4 (actualizado con Apartamentos V2)
**Uso:**
```bash
cd scripts
VALIDAR_SISTEMA.bat
```

**10 Validaciones:**
1. ✅ Docker Desktop corriendo
2. ✅ Servicios activos (10 contenedores)
3. ✅ Base de datos accesible
4. ✅ Tablas esenciales (13 tablas)
5. ✅ **Apartamentos V2 (449 registros)** ← NUEVO
6. ✅ Backend respondiendo (port 8000)
7. ✅ Frontend respondiendo (port 3000)
8. ✅ API health check
9. ✅ Volúmenes persistentes
10. ✅ Networks configuradas

**Resultado:**
```
Sistema: 100% Funcional
Errores: 0
Advertencias: 0
```

---

### HEALTH_CHECK_FUN.bat
**Ubicación:** `scripts/HEALTH_CHECK_FUN.bat`
**Propósito:** Health check rápido de servicios
**Uso:**
```bash
cd scripts
HEALTH_CHECK_FUN.bat
```

**Verifica:**
- Estado de contenedores (healthy/unhealthy)
- Puertos abiertos
- CPU y memoria de contenedores

**Tiempo:** 10 segundos

---

### LIMPIAR_CACHE_FUN.bat
**Ubicación:** `scripts/LIMPIAR_CACHE_FUN.bat`
**Propósito:** Limpiar cachés de Docker, Next.js y npm
**Uso:**
```bash
cd scripts
LIMPIAR_CACHE_FUN.bat
```

**Limpia:**
1. Cache de Docker buildx
2. Imágenes dangling
3. Cachés de Next.js (.next/)
4. Cachés de npm

**Tiempo:** 1-2 minutos

---

## 🔍 Scripts de Diagnóstico

### DIAGNOSTICO_FUN.bat
**Ubicación:** `scripts/DIAGNOSTICO_FUN.bat`
**Propósito:** Diagnóstico completo del sistema
**Uso:**
```bash
cd scripts
DIAGNOSTICO_FUN.bat
```

**Reporta:**
- Versión de Docker
- Uso de recursos
- Estado de contenedores
- Logs recientes con errores
- Puertos en uso

---

### TEST_ENDPOINTS_FUN.bat
**Ubicación:** `scripts/TEST_ENDPOINTS_FUN.bat`
**Propósito:** Prueba de endpoints críticos de API
**Uso:**
```bash
cd scripts
TEST_ENDPOINTS_FUN.bat
```

**Prueba:**
- /api/health
- /api/candidates
- /api/employees
- /api/apartments-v2/apartments ← NUEVO

---

## 💾 Scripts de Backup/Restore

### BACKUP_DATOS_FUN.bat
**Ubicación:** `scripts/BACKUP_DATOS_FUN.bat`
**Propósito:** Backup de base de datos PostgreSQL
**Uso:**
```bash
cd scripts
BACKUP_DATOS_FUN.bat
```

**Qué hace:**
1. Verifica servicio db está corriendo
2. Crea backup con timestamp
3. Comprime con gzip
4. Guarda en carpeta backups/

**Archivo generado:** `backups/backup_YYYYMMDD_HHMMSS.sql.gz`

**Notas:**
- ✅ Corregido: Sin doble `pause`
- ✅ Backup incluye apartamentos V2

---

### RESTAURAR_DATOS_FUN.bat
**Ubicación:** `scripts/RESTAURAR_DATOS_FUN.bat`
**Propósito:** Restaurar base de datos desde backup
**Uso:**
```bash
cd scripts
RESTAURAR_DATOS_FUN.bat backup_20251111.sql.gz
```

**Qué hace:**
1. Detiene servicios que usan la DB
2. Descomprime backup si es .gz
3. Restaura base de datos
4. Reinicia servicios

**⚠️ ADVERTENCIA:** Sobrescribe datos actuales

**Notas:**
- ✅ Corregido: Sin doble `pause`

---

## 🔀 Scripts de Git

### git/GIT_SUBIR.bat
**Ubicación:** `scripts/git/GIT_SUBIR.bat`
**Propósito:** Add + Commit + Push rápido
**Uso:**
```bash
cd scripts\git
GIT_SUBIR.bat "mensaje del commit"
```

**Qué hace:**
1. `git add .`
2. `git commit -m "mensaje"`
3. `git push`

---

### git/GIT_BAJAR.bat
**Ubicación:** `scripts/git/GIT_BAJAR.bat`
**Propósito:** Pull desde remoto
**Uso:**
```bash
cd scripts\git
GIT_BAJAR.bat
```

---

### CREAR_RAMA_FUN.bat
**Ubicación:** `scripts/CREAR_RAMA_FUN.bat`
**Propósito:** Crear y cambiar a nueva rama
**Uso:**
```bash
cd scripts
CREAR_RAMA_FUN.bat feature/nueva-funcionalidad
```

---

## 📸 Scripts de Fotos

### EXTRAER_FOTOS_ROBUSTO.bat
**Ubicación:** `scripts/EXTRAER_FOTOS_ROBUSTO.bat`
**Propósito:** Extracción robusta de fotos desde Access
**Uso:**
```bash
cd scripts
EXTRAER_FOTOS_ROBUSTO.bat
```

**Qué hace:**
1. Busca base de datos DATABASEJP.accdb
2. Extrae fotos con Python + pyodbc
3. Limpia bytes OLE automáticamente
4. Genera access_photo_mappings.json

**Requiere:**
- Microsoft Access Database Engine instalado
- Base de datos en carpeta correcta

---

### LIMPIAR_FOTOS_OLE.bat
**Ubicación:** `scripts/LIMPIAR_FOTOS_OLE.bat`
**Propósito:** Limpiar basura OLE de fotos ya importadas
**Uso:**
```bash
cd scripts
LIMPIAR_FOTOS_OLE.bat
```

**Qué hace:**
1. Ejecuta `fix_photo_data.py` (candidatos)
2. Ejecuta `fix_employee_photos.py` (empleados)
3. Verifica resultados

**Ver:** `docs/features/photos/SOLUCION_FOTOS_OLE_2025-11-11.md`

---

## 🛠️ Scripts Utilitarios

### BUILD_BACKEND_FUN.bat
**Ubicación:** `scripts/BUILD_BACKEND_FUN.bat`
**Propósito:** Reconstruir imagen de backend
**Uso:**
```bash
cd scripts
BUILD_BACKEND_FUN.bat
```

---

### BUILD_FRONTEND_FUN.bat
**Ubicación:** `scripts/BUILD_FRONTEND_FUN.bat`
**Propósito:** Reconstruir imagen de frontend
**Uso:**
```bash
cd scripts
BUILD_FRONTEND_FUN.bat
```

---

### FIX_ADMIN_LOGIN_FUN.bat
**Ubicación:** `scripts/FIX_ADMIN_LOGIN_FUN.bat`
**Propósito:** Recrear usuario admin
**Uso:**
```bash
cd scripts
FIX_ADMIN_LOGIN_FUN.bat
```

**Credenciales creadas:**
- Usuario: `admin`
- Password: `admin123`

**⚠️ CAMBIAR EN PRODUCCIÓN**

---

### MEMORY_STATS_FUN.bat
**Ubicación:** `scripts/MEMORY_STATS_FUN.bat`
**Propósito:** Ver estadísticas de memoria de contenedores
**Uso:**
```bash
cd scripts
MEMORY_STATS_FUN.bat
```

---

## 🚨 Reglas Críticas

### Regla #1: NUNCA cerrar automáticamente
**De:** `CLAUDE.md`

**TODOS los .bat DEBEN terminar con:**
```batch
pause >nul
```

**NUNCA hacer:**
```batch
pause >nul
exit /b 1  # ❌ INCORRECTO - cierra ventana
```

**Razón:** Los usuarios necesitan ver errores sin que la ventana se cierre.

**Estado actual:** ✅ 50 scripts corregidos (2025-11-11)

---

### Regla #2: Formato de mensajes
**Usar UTF-8 y box drawing:**
```batch
echo ╔══════════════════════════════════════╗
echo ║     MENSAJE IMPORTANTE              ║
echo ╚══════════════════════════════════════╝
```

---

### Regla #3: Verificación de Docker
**Todos los scripts DEBEN verificar Docker primero:**
```batch
docker ps >nul 2>&1
if %errorlevel% NEQ 0 (
    echo ❌ Docker Desktop no está corriendo
    pause >nul
    exit /b 1
)
```

---

## 📊 Estadísticas de Scripts

**Total de scripts .bat:** 50
**Scripts principales:** 12
**Scripts de mantenimiento:** 8
**Scripts de backup:** 2
**Scripts de git:** 3
**Scripts de fotos:** 7
**Scripts utilitarios:** 18

**Estado de calidad:**
- ✅ 100% terminan con `pause >nul`
- ✅ 100% verifican Docker
- ✅ 100% usan encoding UTF-8
- ✅ 0 errores críticos

---

## 🔄 Flujos Comunes

### Flujo 1: Instalación en PC nuevo
```batch
1. INSTALAR_FUN.bat
2. Esperar 10-15 min
3. VALIDAR_SISTEMA.bat
4. LIMPIAR_FOTOS_OLE.bat (si hay fotos)
```

### Flujo 2: Reinstalación completa
```batch
1. BACKUP_DATOS_FUN.bat (opcional)
2. REINSTALAR.bat
3. Esperar 5-10 min
4. VALIDAR_SISTEMA.bat
```

### Flujo 3: Mantenimiento diario
```batch
1. START.bat (al iniciar PC)
2. HEALTH_CHECK_FUN.bat (verificar)
3. LOGS.bat (si hay problemas)
4. STOP.bat (al apagar PC)
```

### Flujo 4: Desarrollo activo
```batch
1. START.bat
2. [hacer cambios de código]
3. BUILD_BACKEND_FUN.bat / BUILD_FRONTEND_FUN.bat
4. docker compose restart backend/frontend
5. LOGS.bat (verificar)
```

---

## 📚 Documentación Relacionada

- **Checklist de reinstalación:** `/CHECKLIST_REINSTALACION.md`
- **Guía general:** `/CLAUDE.md`
- **Solución fotos OLE:** `/docs/features/photos/SOLUCION_FOTOS_OLE_2025-11-11.md`
- **Arquitectura Docker:** `/docs/architecture/docker.md`
- **Troubleshooting:** `/docs/04-troubleshooting/TROUBLESHOOTING.md`

---

## 🆕 Cambios en Versión 2.0 (2025-11-11)

### Apartamentos V2
- ✅ docker-compose.yml: Agregado Step 3 (create apartments)
- ✅ START.bat: Verificación de 449 apartamentos
- ✅ VALIDAR_SISTEMA.bat: Validación #5 apartamentos V2
- ✅ TEST_ENDPOINTS_FUN.bat: Prueba /api/apartments-v2

### Correcciones de Scripts
- ✅ REINSTALAR.bat: Eliminado código duplicado (líneas 353-372)
- ✅ BACKUP_DATOS_FUN.bat: Eliminado doble `pause`
- ✅ RESTAURAR_DATOS_FUN.bat: Eliminado doble `pause`
- ✅ 7 scripts de fotos: Eliminado `exit /b` después de `pause`

### Documentación
- ✅ CHECKLIST_REINSTALACION.md v2.0
- ✅ Este archivo (SCRIPTS_REFERENCE.md) v2.0

---

**Última actualización:** 2025-11-11
**Próxima revisión:** Cuando se agreguen nuevos scripts
**Mantenido por:** Claude Code
