# Guía Completa: Sincronización de Fotos Candidatos → Empleados

## 🎯 RESUMEN DEL PROBLEMA Y LA SOLUCIÓN

### Problema Identificado
Cuando importabas candidatos con fotos y los aprobabas para crear empleados, las **fotos no se sincronizaban correctamente** de candidato a empleado.

### Causa Raíz
El script `sync_candidate_employee_status.py` **solo sincronizaba el estado**, NO las fotos.

### Solución Implementada ✅
Se crearon 3 nuevos scripts de sincronización:
1. **`sync_candidate_photos.py`** - Sincronización específica de fotos
2. **`sync_candidate_employee_status.py`** (MEJORADO) - Ahora sincroniza ESTADO + FOTOS
3. **`validate_candidate_employee_photos.py`** - Validación de sincronización

---

## 📋 FLUJO CORRECTO (Paso a Paso)

### Paso 1: Importar Candidatos con Fotos
```bash
# Opción A: API Manual (Recomendado para un candidato)
POST /api/candidates/rirekisho/form
Body:
{
  "applicant_id": "CAND-001",
  "rirekisho_id": "UNS-001",
  "photo_data_url": "data:image/jpeg;base64,/9j/4AAQSkZJRgAB...",
  "form_data": {
    "nameKanji": "田中太郎",
    "nameFurigana": "たなかたろう",
    "birthday": "1990-05-15",
    ...
  }
}

# Opción B: Script de Importación (Para muchos candidatos)
docker exec -it uns-claudejp-backend python scripts/import_candidates_improved.py
```

### Paso 2: Aprobar Candidato
```bash
# API: Aprobar candidato
POST /api/candidates/{candidate_id}/evaluate?approved=true

# Base de datos: El candidato pasa a estado "approved"
```

### Paso 3: Crear Empleado desde Candidato Aprobado
```bash
# API: Crear empleado
POST /api/employees
Body:
{
  "rirekisho_id": "UNS-001",      ← CLAVE: Vincula a candidato
  "factory_id": "ABC Manufacturing",
  "hire_date": "2024-11-15",
  "jikyu": 1200,
  ...
}

# Backend automáticamente:
# ✓ Copia photo_data_url del candidato
# ✓ Copia photo_url del candidato
# ✓ Actualiza candidato.status = "hired"
```

### Paso 4: Sincronizar Estado y Fotos (CRÍTICO)
```bash
# Opción A: Sincronizar ESTADO + FOTOS (RECOMENDADO)
docker exec -it uns-claudejp-backend python scripts/sync_candidate_employee_status.py

# Opción B: Solo sincronizar FOTOS
docker exec -it uns-claudejp-backend python scripts/sync_candidate_photos.py
```

### Paso 5: Validar Sincronización
```bash
docker exec -it uns-claudejp-backend python scripts/validate_candidate_employee_photos.py

# Verifica que:
# ✓ Todas las fotos fueron copiadas
# ✓ Las fotos son idénticas entre candidato y empleado
# ✓ Reporta cualquier problema
```

---

## 🚀 FLUJO AUTOMÁTICO EN DOCKER (Startup)

### Problema Anterior
El servicio `importer` en docker-compose.yml NO ejecutaba los scripts de sincronización.

### Solución: Actualizar docker-compose.yml

Busca el servicio `importer` y actualiza el comando:

```yaml
importer:
  image: ...
  depends_on:
    - db
  command: |
    /bin/bash -c "
      cd /app &&
      echo '🔄 Aplicando migraciones de base de datos...' &&
      alembic upgrade head &&

      echo '📥 Importando datos iniciales...' &&
      python scripts/import_data.py &&

      echo '👥 Importando candidatos...' &&
      python scripts/import_candidates_improved.py &&

      echo '🏢 Importando empleados...' &&
      python scripts/import_employees_complete.py &&

      echo '📸 Sincronizando fotos candidato → empleado...' &&
      python scripts/sync_candidate_photos.py &&

      echo '🔄 Sincronizando estados y fotos...' &&
      python scripts/sync_candidate_employee_status.py &&

      echo '✅ Validando sincronización de fotos...' &&
      python scripts/validate_candidate_employee_photos.py &&

      echo '✓ IMPORTACIÓN COMPLETADA EXITOSAMENTE'
    "
  profiles:
    - dev
    - prod
```

---

## 📊 SCRIPTS NUEVOS/MEJORADOS

### 1. `sync_candidate_photos.py` (NUEVO)
**Propósito:** Sincronizar fotos de candidatos a empleados

**Características:**
- ✓ Copia `photo_data_url` (base64) y `photo_url`
- ✓ Verifica que no existan duplicados
- ✓ Reporta candidatos sin fotos
- ✓ Detallado logging de cada cambio
- ✓ Soporte para Employee, ContractWorker, Staff

**Uso:**
```bash
docker exec -it uns-claudejp-backend python scripts/sync_candidate_photos.py
```

**Salida esperada:**
```
╔════════════════════════════════════════════════════════════╗
║        SINCRONIZANDO FOTOS: CANDIDATOS → EMPLEADOS         ║
╚════════════════════════════════════════════════════════════╝
📊 Estadísticas iniciales:
   • Total de candidatos: 42
   • Candidatos CON foto: 35
   • Candidatos SIN foto: 7

🔄 Procesando candidatos CON fotos...

   ✓ Employee (ID: 1001) ← Foto de UNS-001
   ✓ Employee (ID: 1002) ← Foto de UNS-002
   ...

✓ 25 registros de empleados actualizados con fotos

📊 Resumen de empleados por tipo:
   Employee: 25/42 con foto
   ContractWorker: 10/15 con foto
   Staff: 5/8 con foto

   TOTAL: 40/65 con foto
```

### 2. `sync_candidate_employee_status.py` (MEJORADO)
**Antes:** Solo sincronizaba estado
**Ahora:** Sincroniza ESTADO + FOTOS

**Cambios:**
- ✓ Copia fotos mientras sincroniza estado
- ✓ Reporta cuántas fotos fueron sincronizadas
- ✓ Verifica ambos campos: `photo_data_url` y `photo_url`

**Uso:**
```bash
docker exec -it uns-claudejp-backend python scripts/sync_candidate_employee_status.py
```

**Salida esperada:**
```
╔════════════════════════════════════════════════════════════╗
║     SINCRONIZANDO ESTADOS Y FOTOS CANDIDATO-EMPLEADO       ║
╚════════════════════════════════════════════════════════════╝
✓ Estados actualizados: 15
✓ Fotos sincronizadas: 20
━ Sin cambios:         27

📊 Distribución de estados:
   审查中 (Pendientes): 10
   合格 (Aprobados): 5
   不合格 (Rechazados): 2
   採用 (Contratados): 35

📸 Fotos en empleados: 35/50
```

### 3. `validate_candidate_employee_photos.py` (NUEVO)
**Propósito:** Verificar que la sincronización fue correcta

**Características:**
- ✓ Verifica cada candidato vs sus empleados
- ✓ Detecta fotos faltantes
- ✓ Detecta fotos no sincronizadas
- ✓ Genera recomendaciones automáticas

**Uso:**
```bash
docker exec -it uns-claudejp-backend python scripts/validate_candidate_employee_photos.py
```

**Salida esperada (EXITOSA):**
```
✓ TODAS LAS FOTOS ESTÁN CORRECTAMENTE SINCRONIZADAS!

   Relación candidato-empleado: OK
   Sincronización de fotos: OK
   Estado de bases de datos: CONSISTENTE
```

**Salida esperada (CON ERRORES):**
```
❌ FOTOS FALTANTES: 3

   Empleados sin foto (candidato tiene foto):
   • UNS-001 (田中太郎) → Employee ID:1001
   • UNS-005 (山田花子) → ContractWorker ID:2005
   • UNS-010 (佐藤次郎) → Staff ID:3010

Para corregir:
   1. Ejecutar: python scripts/sync_candidate_photos.py
   2. Ejecutar: python scripts/sync_candidate_employee_status.py
   3. Ejecutar nuevamente: python scripts/validate_candidate_employee_photos.py
```

---

## 🔧 FLUJO DE DATOS ACTUAL (Mejorado)

```
┌─────────────────────────────────────┐
│   1. CREAR CANDIDATO + FOTO         │
│   POST /api/candidates/rirekisho/form
│   • Foto comprimida automáticamente │
│   • Guardada en candidates.photo_data_url
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│   2. APROBAR CANDIDATO              │
│   POST /api/candidates/{id}/evaluate│
│   • status: "pending" → "approved"  │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│   3. CREAR EMPLEADO                 │
│   POST /api/employees               │
│   • Copia photo_data_url automáticamente
│   • Copia photo_url automáticamente  │
│   • status candidato → "hired"      │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│   4. SINCRONIZAR FOTOS (MANUAL)     │
│   python sync_candidate_photos.py   │
│   • Verifica todas las fotos        │
│   • Copia si falta algo             │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│   5. SINCRONIZAR ESTADO + FOTOS     │
│   python sync_candidate_employee... │
│   • Actualiza estados               │
│   • Sincroniza fotos (respaldo)     │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│   6. VALIDAR SINCRONIZACIÓN         │
│   python validate_candidate_photos..│
│   • Verifica relaciones             │
│   • Reporta problemas               │
│   • Genera recomendaciones          │
└─────────────────────────────────────┘
```

---

## ❌ ERRORES COMUNES Y SOLUCIONES

### Error: "Empleado sin foto aunque candidato tiene foto"

**Causa:** El script de sincronización no se ejecutó después de crear el empleado

**Solución:**
```bash
# Ejecutar el script de sincronización
docker exec -it uns-claudejp-backend python scripts/sync_candidate_photos.py

# O ejecutar ambos scripts
docker exec -it uns-claudejp-backend python scripts/sync_candidate_employee_status.py
```

### Error: "Foto del empleado diferente de la del candidato"

**Causa:** Foto fue actualizada en candidato DESPUÉS de crear el empleado

**Solución:**
```bash
# Ejecutar sincronización nuevamente
docker exec -it uns-claudejp-backend python scripts/sync_candidate_photos.py

# El script detectará que las fotos no coinciden y las actualizará
```

### Error: "Candidato sin foto pero tengo foto en el formulario"

**Causa:** API no guardó la foto en `candidates.photo_data_url`
       (solo la guardó en `candidate_form.photo_data_url`)

**Solución:**
```bash
# Necesitas re-guardar el formulario o corregir manualmente en base de datos
# UPDATE candidates SET photo_data_url = ... WHERE rirekisho_id = 'UNS-001'
```

### Error: "Base de datos inconsistente"

**Causa:** No se ejecutaron los scripts de sincronización

**Solución (Paso a Paso):**
```bash
# 1. Sincronizar fotos
docker exec -it uns-claudejp-backend python scripts/sync_candidate_photos.py

# 2. Sincronizar estado + fotos
docker exec -it uns-claudejp-backend python scripts/sync_candidate_employee_status.py

# 3. Validar que todo está bien
docker exec -it uns-claudejp-backend python scripts/validate_candidate_employee_photos.py
```

---

## 📝 CHECKLIST: USAR CUANDO IMPORTAS CANDIDATOS Y EMPLEADOS

- [ ] Importar candidatos con `import_candidates_improved.py`
- [ ] Verificar que fotos están en `candidates.photo_data_url`
- [ ] Aprobar candidatos en API o base de datos
- [ ] Crear empleados usando `POST /api/employees`
- [ ] Ejecutar `sync_candidate_photos.py`
- [ ] Ejecutar `sync_candidate_employee_status.py`
- [ ] Ejecutar `validate_candidate_employee_photos.py`
- [ ] Confirmar: "TODAS LAS FOTOS ESTÁN CORRECTAMENTE SINCRONIZADAS"
- [ ] Listo! ✓

---

## 🗄️ CAMPOS INVOLUCRADOS

### Tabla: `candidates`
```python
rirekisho_id: str(20)          # ID del candidato (CLAVE)
photo_url: str(255)            # URL simple (legacy)
photo_data_url: TEXT           # Base64 data URL (PRIMARY)
status: str                    # pending | approved | rejected | hired
```

### Tabla: `employees`
```python
rirekisho_id: str(20)          # FK a candidates (RELACIÓN)
hakenmoto_id: int              # ID del empleado (único)
photo_url: str(255)            # Copiado de candidate
photo_data_url: TEXT           # Copiado de candidate
```

### Tabla: `candidate_form`
```python
candidate_id: int              # FK a candidates
rirekisho_id: str(20)
photo_data_url: TEXT           # Copia de la foto (respaldo)
form_data: JSON                # Formulario completo
```

---

## 🚀 REFERENCIA RÁPIDA

### Para Desarrolladores
```bash
# Sincronizar fotos ahora
docker exec -it uns-claudejp-backend python scripts/sync_candidate_photos.py

# Validar sincronización
docker exec -it uns-claudejp-backend python scripts/validate_candidate_employee_photos.py

# Ver logs de sincronización
docker compose logs importer | grep -i "photo\|sincron"
```

### Para DevOps
```bash
# Agregar estos scripts a tu pipeline de importación
# en el archivo docker-compose.yml

# Ver si fotos se sincronizaron en startup
docker compose logs importer | tail -50
```

### Para QA/Testing
```bash
# Flujo completo de prueba:
1. Crear candidato con foto: POST /api/candidates/rirekisho/form
2. Aprobar: POST /api/candidates/{id}/evaluate?approved=true
3. Crear empleado: POST /api/employees
4. Sincronizar: docker exec ... sync_candidate_photos.py
5. Validar: docker exec ... validate_candidate_employee_photos.py
6. Verificar en base de datos:
   SELECT photo_data_url FROM candidates WHERE rirekisho_id='UNS-001';
   SELECT photo_data_url FROM employees WHERE rirekisho_id='UNS-001';
   -- Deben ser IDÉNTICOS
```

---

## ✅ VERIFICACIÓN FINAL

Para confirmar que TODO está funcionando correctamente:

```sql
-- Query 1: Verificar candidato con foto
SELECT rirekisho_id, full_name_kanji,
       CASE WHEN photo_data_url IS NOT NULL THEN 'SÍ' ELSE 'NO' END as tiene_foto
FROM candidates
WHERE rirekisho_id = 'UNS-001';

-- Query 2: Verificar empleado con foto
SELECT hakenmoto_id, rirekisho_id, full_name_kanji,
       CASE WHEN photo_data_url IS NOT NULL THEN 'SÍ' ELSE 'NO' END as tiene_foto
FROM employees
WHERE rirekisho_id = 'UNS-001';

-- Query 3: Verificar que fotos son idénticas
SELECT c.rirekisho_id,
       CASE WHEN c.photo_data_url = e.photo_data_url THEN '✓ IDÉNTICAS' ELSE '✗ DIFERENTES' END as foto_sincronizada
FROM candidates c
LEFT JOIN employees e ON c.rirekisho_id = e.rirekisho_id
WHERE c.photo_data_url IS NOT NULL;

-- Query 4: Contar empleados con/sin foto
SELECT
  (SELECT COUNT(*) FROM employees WHERE photo_data_url IS NOT NULL) as con_foto,
  (SELECT COUNT(*) FROM employees) as total,
  ROUND(100.0 * (SELECT COUNT(*) FROM employees WHERE photo_data_url IS NOT NULL) /
        (SELECT COUNT(*) FROM employees), 1) as porcentaje
```

---

## 📞 SOPORTE

Si los scripts no funcionan:

1. **Verificar que la base de datos está disponible:**
   ```bash
   docker compose exec db psql -U uns_admin -d uns_claudejp -c "SELECT 1;"
   ```

2. **Ver logs de errores:**
   ```bash
   docker compose logs backend | grep -i error
   ```

3. **Ejecutar manualmente:**
   ```bash
   docker exec -it uns-claudejp-backend bash
   cd /app
   python -u scripts/sync_candidate_photos.py 2>&1 | tee sync_photos.log
   ```

4. **Revisar la documentación principal:**
   - `CANDIDATE_EMPLOYEE_ANALYSIS.md`
   - `CANDIDATE_EMPLOYEE_QUICK_REFERENCE.md`
   - `CANDIDATE_EMPLOYEE_DIAGRAMS.md`

---

**Última actualización:** 2024-11-19
**Estado:** ✅ IMPLEMENTADO Y PROBADO
