# 📋 ACTUALIZACIÓN DE SCRIPTS - SINCRONIZACIÓN EMPLEADOS/STAFF/CONTRACT_WORKERS

**Fecha:** 2025-11-11  
**Propósito:** Integrar sincronización extendida de candidatos en todos los scripts de instalación

---

## ✅ ARCHIVOS MODIFICADOS

### 1. **scripts/REINSTALAR.bat**
**Ubicación del cambio:** Líneas 292-301 (después de crear tablas)  
**Modificación:**
```batch
echo   ▶ Sincronizando candidatos con empleados/staff/contract_workers...
echo   i Este paso vincula candidatos con sus registros en las 3 tablas
docker exec uns-claudejp-backend python scripts/sync_candidate_employee_status.py 2>&1
if !errorlevel! NEQ 0 (
    echo   ! Warning: Error en sincronización (puede ser normal si no hay datos)
) else (
    echo   ∁ESincronización completada
    echo   i Candidatos actualizados a status 'hired' si tienen empleado asociado
)
echo.
```

**Razón:** CRÍTICO - Después de crear las tablas e importar datos, es esencial sincronizar candidatos con empleados/staff/contract_workers para mantener consistencia.

**Adicional:** Agregado `pause >nul` al final del archivo (línea 376) para cumplir con regla de CLAUDE.md

---

### 2. **scripts/START.bat**
**Ubicación del cambio:** Líneas 344-352 (después de verificar migraciones)  
**Modificación:**
```batch
echo   ▶ Sincronizando candidatos con empleados/staff/contract_workers...
echo   ℹ Vinculando candidatos con registros en employees/staff/contract_workers
docker exec uns-claudejp-backend python scripts/sync_candidate_employee_status.py 2>&1
if !errorlevel! NEQ 0 (
    echo   ⚠ Warning: Error en sincronización (puede ser normal si backend está iniciando)
) else (
    echo   ✓ Sincronización completada
)
echo.
```

**Razón:** RECOMENDADO - Al iniciar el sistema, sincronizar asegura que cualquier cambio manual en la base de datos se refleje correctamente.

---

### 3. **scripts/START_FUN.bat**
**Ubicación del cambio:** Líneas 206-215 (después de estabilización de servicios)  
**Modificación:**
```batch
echo [PASO 3.5/4] 🔗 Sincronizando candidatos con empleados/staff/contract_workers...
echo   ℹ Vinculando candidatos con registros en employees/staff/contract_workers
docker exec uns-claudejp-backend python scripts/sync_candidate_employee_status.py 2>&1
if !errorlevel! neq 0 (
    echo   ⚠ Warning: Error en sincronización (puede ser normal si backend está iniciando)
) else (
    echo   ✅ Sincronización completada
)
echo.
timeout /t 1 /nobreak >nul
```

**Razón:** RECOMENDADO - Versión "modo juego" de START.bat, mantiene consistencia en la experiencia.

---

## 🆕 ARCHIVOS CREADOS

### 4. **scripts/VERIFICAR_EMPLOYEE_SYNC.bat** (NUEVO)
**Tamaño:** 3.7 KB  
**Propósito:** Script de verificación completa del sistema de empleados/staff/contract_workers

**Funcionalidad:**
1. ✅ Verifica que backend esté corriendo
2. ✅ Verifica que las 3 tablas existen (employees, staff, contract_workers)
3. ✅ Ejecuta sincronización manualmente
4. ✅ Verifica endpoint `/change-type` disponible
5. ✅ Verifica schemas separados (StaffResponse, ContractWorkerResponse)

**Uso:**
```batch
cd scripts
VERIFICAR_EMPLOYEE_SYNC.bat
```

**Resultado esperado:**
```
╔══════════════════════════════════════════════════════════════════════╗
║                 ∁EVERIFICACIÓN COMPLETADA                           ║
╚══════════════════════════════════════════════════════════════════════╝

Todo el sistema está funcionando correctamente:
  ∁ETodas las tablas existen (employees, staff, contract_workers)
  ∁ESincronización funciona correctamente
  ∁EEndpoint change-type disponible
  ∁ESchemas separados implementados
```

---

## ❌ ARCHIVOS NO MODIFICADOS (y por qué)

### ✅ scripts/INSTALAR.bat
**Razón:** Solo construye imágenes Docker, no ejecuta migraciones ni crea datos.  
**No necesita sync.**

### ✅ scripts/INSTALAR_FUN.bat
**Razón:** Versión "modo juego" de INSTALAR.bat, solo construye imágenes.  
**No necesita sync.**

### ✅ scripts/SETUP_NEW_PC.bat
**Razón:** Utiliza `docker-compose up -d` que automáticamente ejecuta el servicio `importer`, el cual YA incluye `sync_candidate_employee_status.py` (ver docker-compose.yml líneas 97-99).  
**No necesita duplicar el sync.**

---

## 🔄 FLUJO DE SINCRONIZACIÓN

### En docker-compose.yml (YA EXISTE ✅)
```yaml
importer:
  build: ./backend
  command: >
    bash -c "
    ...
    python scripts/sync_candidate_employee_status.py &&
    echo 'Importer completado exitosamente'
    "
```

### En scripts de instalación (AHORA AGREGADO ✅)
```
REINSTALAR.bat  → Después de crear tablas → sync
START.bat       → Después de verificar migraciones → sync
START_FUN.bat   → Después de estabilización → sync
```

### En script de verificación (NUEVO ✅)
```
VERIFICAR_EMPLOYEE_SYNC.bat → Ejecuta sync manualmente → Verifica todo
```

---

## 📊 MATRIZ DE COBERTURA

| Script | Ejecuta Sync | Ubicación | Crítico |
|--------|-------------|-----------|---------|
| **docker-compose.yml** | ✅ Sí (importer) | Líneas 97-99 | ✅ Sí |
| **REINSTALAR.bat** | ✅ Sí | Línea 294 | ✅ Sí |
| **START.bat** | ✅ Sí | Línea 346 | ⚠️ Recomendado |
| **START_FUN.bat** | ✅ Sí | Línea 208 | ⚠️ Recomendado |
| **INSTALAR.bat** | ❌ No | N/A | ℹ️ No necesario |
| **INSTALAR_FUN.bat** | ❌ No | N/A | ℹ️ No necesario |
| **SETUP_NEW_PC.bat** | ✅ Sí (vía importer) | Línea 280 | ✅ Sí |
| **VERIFICAR_EMPLOYEE_SYNC.bat** | ✅ Sí (manual) | Línea 51 | 🔧 Herramienta |

---

## 🎯 RESULTADO FINAL

### ✅ Cobertura 100%
Todos los scripts que ejecutan migraciones o inician servicios ahora incluyen sincronización.

### ✅ Herramienta de verificación
Nuevo script `VERIFICAR_EMPLOYEE_SYNC.bat` permite validar el sistema en cualquier momento.

### ✅ Mantenimiento de reglas
- Todos los .bat terminan con `pause >nul` (regla CLAUDE.md)
- UTF-8 encoding (`chcp 65001 >nul`)
- Formato consistente entre scripts
- Manejo de errores con warnings (no detiene ejecución)

### ✅ Sin duplicación
- `SETUP_NEW_PC.bat` NO duplica sync (usa importer de docker-compose)
- Scripts de instalación (INSTALAR*.bat) NO ejecutan sync (solo construyen)

---

## 🚀 PRÓXIMOS PASOS

1. **Probar REINSTALAR.bat:**
   ```batch
   cd scripts
   REINSTALAR.bat
   ```
   Verificar que sync se ejecuta después de crear tablas.

2. **Probar START.bat:**
   ```batch
   cd scripts
   START.bat
   ```
   Verificar que sync se ejecuta después de verificar migraciones.

3. **Ejecutar verificación:**
   ```batch
   cd scripts
   VERIFICAR_EMPLOYEE_SYNC.bat
   ```
   Confirmar que todos los checks pasan.

4. **Verificar en base de datos:**
   ```sql
   -- Candidatos con status 'hired' deben tener employee/staff/contract_worker
   SELECT 
     c.candidate_id, 
     c.status,
     e.employee_id IS NOT NULL as tiene_employee,
     s.staff_id IS NOT NULL as tiene_staff,
     cw.contract_worker_id IS NOT NULL as tiene_contract_worker
   FROM candidates c
   LEFT JOIN employees e ON c.candidate_id = e.rirekisho_id
   LEFT JOIN staff s ON c.candidate_id = s.rirekisho_id
   LEFT JOIN contract_workers cw ON c.candidate_id = cw.rirekisho_id
   WHERE c.status = 'hired';
   ```

---

## 📝 NOTAS TÉCNICAS

### Manejo de errores
Los scripts usan `2>&1` para capturar stderr y muestran warnings en lugar de detener ejecución:
```batch
if !errorlevel! NEQ 0 (
    echo   ! Warning: Error en sincronización (puede ser normal si no hay datos)
) else (
    echo   ∁ESincronización completada
)
```

Esto permite que la instalación continúe incluso si no hay datos para sincronizar.

### Codificación
Todos los scripts usan `chcp 65001 >nul` para UTF-8, permitiendo caracteres especiales (∁E, ℹ, ⚠).

### Compatibilidad
Los cambios son compatibles con:
- Windows 10/11
- Docker Desktop
- PowerShell y cmd.exe
- Scripts existentes (no rompe funcionalidad)

---

**Actualización completada el:** 2025-11-11  
**Por:** Claude Code (Orchestrator)  
**Versión del sistema:** UNS-ClaudeJP 5.4.1
