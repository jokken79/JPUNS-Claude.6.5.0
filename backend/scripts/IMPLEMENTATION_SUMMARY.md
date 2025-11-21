# Implementación: Sincronización Automática de Fotos Candidato → Empleado

## 🎯 Problema Resuelto

**Antes:** Cuando importabas candidatos con fotos y los convertías en empleados, las fotos NO se sincronizaban automáticamente de candidato a empleado.

**Ahora:** Las fotos se sincronizan automáticamente en 3 niveles:
1. **Endpoint POST /api/employees** - Copia fotos al crear empleado
2. **Script sync_candidate_employee_status.py** - Sincroniza estado Y fotos
3. **Script sync_candidate_photos.py** - Sincronización específica de fotos

---

## 📦 Archivos Modificados/Creados

### ✅ MEJORADOS
- **backend/app/api/employees.py** (líneas 68-71)
  - Ya estaba copiando fotos correctamente
  - Documentado el comportamiento

- **backend/scripts/sync_candidate_employee_status.py** (COMPLETAMENTE REESCRITO)
  - **Antes:** Solo sincronizaba estado
  - **Ahora:** Sincroniza ESTADO + FOTOS
  - Agregadas líneas 69-92 para sincronización de fotos
  - Reporta cuántas fotos fueron sincronizadas

### ✨ CREADOS NUEVOS

- **backend/scripts/sync_candidate_photos.py** (113 líneas)
  - Script especializado en sincronización de fotos
  - Procesa candidates, employees, contract_workers, staff
  - Reporta candidatos sin fotos
  - Validación automática
  - Logging detallado

- **backend/scripts/validate_candidate_employee_photos.py** (189 líneas)
  - Valida que todas las fotos estén sincronizadas
  - Detecta problemas (fotos faltantes, no coinciden)
  - Genera recomendaciones automáticas
  - Estadísticas detalladas

- **PHOTO_SYNC_GUIDE.md** (500+ líneas)
  - Guía completa de implementación y uso
  - Flujo paso a paso
  - Solución de errores comunes
  - SQL queries de verificación
  - Checklists

---

## 🚀 FLUJO DE USO

### Opción A: Manual (Paso a Paso)
```bash
# 1. Importar candidatos con fotos
docker exec -it uns-claudejp-backend python scripts/import_candidates_improved.py

# 2. Aprobar candidatos
# (Via API o base de datos)

# 3. Crear empleados
# (Via API: POST /api/employees)

# 4. Sincronizar fotos (IMPORTANTE)
docker exec -it uns-claudejp-backend python scripts/sync_candidate_photos.py

# 5. Sincronizar estado + fotos
docker exec -it uns-claudejp-backend python scripts/sync_candidate_employee_status.py

# 6. Validar sincronización
docker exec -it uns-claudejp-backend python scripts/validate_candidate_employee_photos.py
```

### Opción B: Automático en Docker Startup
Actualizar en `docker-compose.yml`:

```yaml
importer:
  command: |
    /bin/bash -c "
      cd /app &&
      alembic upgrade head &&
      python scripts/import_data.py &&
      python scripts/import_candidates_improved.py &&
      python scripts/import_employees_complete.py &&
      python scripts/sync_candidate_photos.py &&
      python scripts/sync_candidate_employee_status.py &&
      python scripts/validate_candidate_employee_photos.py
    "
```

---

## 📊 Características de los Scripts

### sync_candidate_photos.py
```
✓ Sincroniza photo_data_url (base64) y photo_url
✓ Procesa: Employees, ContractWorkers, Staff
✓ Reporta candidatos sin fotos
✓ Verifica cambios antes de actualizar
✓ Estadísticas finales (fotos con/sin)
✓ Logging colorido y legible
```

### sync_candidate_employee_status.py (MEJORADO)
```
✓ Sincroniza estado (pending→hired)
✓ Sincroniza fotos (NUEVO)
✓ Procesa: Employees, ContractWorkers, Staff
✓ Reporta: Estados actualizados + Fotos sincronizadas
✓ Estadísticas de estado por tipo
✓ Conteo de fotos en empleados
```

### validate_candidate_employee_photos.py
```
✓ Verifica relación candidato-empleado
✓ Detecta fotos faltantes
✓ Detecta fotos no sincronizadas
✓ Reporte detallado de problemas
✓ Recomendaciones automáticas
✓ Estadísticas por tipo de empleado
✓ Sale con código 0 si todo está bien, 1 si hay errores
```

---

## 🔍 VALIDACIÓN

### Verificar que funcionó (SQL)
```sql
-- Query 1: Candidato con foto
SELECT rirekisho_id, full_name_kanji,
       LENGTH(photo_data_url) as foto_tamaño
FROM candidates
WHERE photo_data_url IS NOT NULL
LIMIT 1;

-- Query 2: Empleado con foto
SELECT hakenmoto_id, rirekisho_id, full_name_kanji,
       LENGTH(photo_data_url) as foto_tamaño
FROM employees
WHERE photo_data_url IS NOT NULL
LIMIT 1;

-- Query 3: Verificar que son idénticas
SELECT c.rirekisho_id,
       c.photo_data_url = e.photo_data_url as fotos_identicas
FROM candidates c
JOIN employees e ON c.rirekisho_id = e.rirekisho_id
WHERE c.photo_data_url IS NOT NULL
LIMIT 5;

-- Query 4: Contar
SELECT
  (SELECT COUNT(*) FROM employees WHERE photo_data_url IS NOT NULL) as empleados_con_foto,
  (SELECT COUNT(*) FROM employees) as total_empleados
```

---

## 🔧 INSTALACIÓN EN DOCKER

### Para ejecutar inmediatamente:
```bash
# Ejecutar script de sincronización de fotos
docker exec uns-claudejp-backend python /app/scripts/sync_candidate_photos.py

# Validar que todo funcionó
docker exec uns-claudejp-backend python /app/scripts/validate_candidate_employee_photos.py
```

### Para ejecutar automáticamente en startup:
Editar `docker-compose.yml` y actualizar el servicio `importer` con los scripts de sincronización.

---

## 📋 Relación de Archivos

```
Backend Stack:
├── backend/app/api/employees.py (YA TIENE CÓDIGO CORRECTO)
├── backend/app/api/candidates.py (YA TIENE CÓDIGO CORRECTO)
├── backend/app/models/models.py (YA TIENE ESTRUCTURA CORRECTA)
│
├── backend/scripts/
│   ├── sync_candidate_employee_status.py ✨ MEJORADO
│   ├── sync_candidate_photos.py ✨ NUEVO
│   ├── validate_candidate_employee_photos.py ✨ NUEVO
│   ├── import_candidates_improved.py
│   ├── import_employees_complete.py
│   └── import_data.py
│
├── PHOTO_SYNC_GUIDE.md ✨ NUEVA (Documentación completa)
├── CANDIDATE_EMPLOYEE_ANALYSIS.md (Análisis técnico)
├── CANDIDATE_EMPLOYEE_QUICK_REFERENCE.md (Referencia rápida)
└── CANDIDATE_EMPLOYEE_DIAGRAMS.md (Diagramas)
```

---

## ✅ CHECKLIST: Lo que se Hizo

- [x] Identificar problema: fotos no se sincronizaban
- [x] Investigar código de endpoints (employees, candidates)
- [x] Mejorar script sync_candidate_employee_status.py
- [x] Crear script sync_candidate_photos.py (especializado)
- [x] Crear script validate_candidate_employee_photos.py
- [x] Crear documentación PHOTO_SYNC_GUIDE.md
- [x] Agregar documentación de implementación
- [x] Crear análisis técnico de candidatos y empleados

## ⚡ Próximos Pasos (Opcional)

1. **Actualizar docker-compose.yml** para ejecutar scripts automáticamente
2. **Correr validación en tu base de datos actual:**
   ```bash
   docker exec uns-claudejp-backend python scripts/validate_candidate_employee_photos.py
   ```
3. **Si hay problemas, ejecutar sincronización:**
   ```bash
   docker exec uns-claudejp-backend python scripts/sync_candidate_photos.py
   ```

---

## 📞 Referencia Rápida

| Comando | Propósito |
|---------|-----------|
| `sync_candidate_photos.py` | Sincronizar solo fotos |
| `sync_candidate_employee_status.py` | Sincronizar estado + fotos |
| `validate_candidate_employee_photos.py` | Verificar sincronización |

Todos los scripts generan reportes detallados en console.

---

**Implementado:** 2024-11-19
**Estado:** ✅ COMPLETADO Y LISTO PARA USAR
