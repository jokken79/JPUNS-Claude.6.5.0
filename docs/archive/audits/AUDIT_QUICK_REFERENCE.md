# AUDITORÍA RÁPIDA - Quick Reference

Fecha: 2025-11-10  
Archivo completo: `AUDIT_EXHAUSTIVO_COMPLETO.md`

---

## 28 ARCHIVOS SEGUROS PARA ELIMINAR INMEDIATAMENTE

### Grupo 1: .github/prompts (12 archivos - duplicados exactos)
```
.github/copilot-instructions.md
.github/prompts/speckit.analyze.prompt.md
.github/prompts/speckit.checklist.prompt.md
.github/prompts/speckit.clarify.prompt.md
.github/prompts/speckit.constitution.prompt.md
.github/prompts/speckit.implement.prompt.md
.github/prompts/speckit.plan.prompt.md
.github/prompts/speckit.specify.prompt.md
.github/prompts/speckit.tasks.prompt.md
.github/prompts/openspec-apply.prompt.md
.github/prompts/openspec-archive.prompt.md
.github/prompts/openspec-proposal.prompt.md
```
**Razón:** Copias byte-for-byte de docs/github/prompts/

---

### Grupo 2: BASEDATEJP Documentation (7 archivos - legacy)
```
BASEDATEJP/CLAUDE_BACKEND.md
BASEDATEJP/CLAUDE_FRONTEND.md
BASEDATEJP/CLAUDE_INDEX.md
BASEDATEJP/CLAUDE_QUICK.md
BASEDATEJP/CLAUDE_RULES.md
BASEDATEJP/DOCUMENTACION_FOTOS_INDICE.md
BASEDATEJP/extract_photos_direct_access.py
```
**Razón:** Duplicados en carpeta LEGACY - mantener solo en root

---

### Grupo 3: Root Documentation Duplicates (3 archivos)
```
CHANGELOG_V5.2_TO_V5.4.md
MIGRATION_V5.4_README.md
TIMER_CARD_PAYROLL_INTEGRATION.md
```
**Razón:** También existen en /docs/ - consolidar

---

### Grupo 4: Empty/Useless Files (1 archivo)
```
BASEDATEJP/Configuracion de Max2.txt (0 bytes)
```

---

## 10 SCRIPTS ANTIGUOS A ELIMINAR (Backend Photo Extraction)

```
backend/scripts/extract_photos_pyodbc.py
backend/scripts/extract_photos_simple.py
backend/scripts/extract_photos_automatic.py
backend/scripts/extract_photos_from_access_dao.py
backend/scripts/extract_photos_from_access_windows.py
backend/scripts/extract_photos_from_access_db.py
backend/scripts/extract_photos_from_ole.py
backend/scripts/extract_photos_pandas.py
backend/scripts/extract_ole_photos.py
backend/scripts/debug_extract_photos.py
```
**Razón:** Versiones antiguas del mismo script - solo mantener extract_photos_fixed.py

---

## 20-30 SCRIPTS A REVISAR (Más información en reporte completo)

### Scripts Admin/Reset
- ensure_admin_user.py (duplicado)
- reset_admin_simple.py (versión simplificada)
- fix_admin_password.py

### Scripts de Importación
- import_candidates_simple.py
- import_candidates_from_json.py
- import_demo_candidates.py
- import_photos_from_json_simple.py

### Scripts de Verificación
- Múltiples versiones de verify_*.py
- Múltiples versiones de validate_*.py

### Scripts de Análisis/Debug
- analyze_excel_structure.py
- analyze_old_photos.py
- analyze_table_structure.py
- check_* scripts (varios)
- diagnostico_ocr.py

---

## DIRECTORIO VACÍO

```
LIXO/ (trash directory - vacío)
```

---

## POSIBLES PROBLEMAS CON ASSETS

### Logo Duplicados (Verificar uso)
```
frontend/public/JPUNSLOGO.png
frontend/public/JPUNSLOGO (2).png
```
**Acción:** Verificar cuál se usa - eliminar versión antigua

---

## ESTADÍSTICAS

| Categoría | Cantidad | Tamaño Aprox |
|-----------|----------|-------------|
| Documentación duplicada | 15 archivos | 80 KB |
| Scripts de fotos antiguos | 11 archivos | 62 KB |
| Scripts de desarrollo | 20-30 scripts | 150 KB |
| Archivos vacíos/trash | 2 items | 1 KB |
| **TOTAL** | **~50 archivos** | **~293 KB** |

---

## PLAN DE ACCIÓN

### PASO 1: Ahora (Eliminar seguros)
- [ ] Eliminar .github/prompts/ (12 archivos)
- [ ] Eliminar documentación en BASEDATEJP (7 archivos)
- [ ] Eliminar documentación duplicada en root (3 archivos)
- [ ] Eliminar archivo vacío (1 archivo)

**Total:** 28 archivos, 0 riesgos

### PASO 2: Esta semana (Scripts antiguos)
- [ ] Eliminar extract_photos_*.py antiguos (10 archivos)
- [ ] Crear git commit documentando por qué

**Total:** 10 archivos, bajo riesgo

### PASO 3: Este mes (Review y consolidar)
- [ ] Revisar y consolidar scripts admin
- [ ] Revisar y consolidar scripts de importación
- [ ] Revisar scripts de verificación
- [ ] Documentar qué script es "el correcto" para cada tarea

---

## IMPORTANTE

**NO ELIMINAR:**
- ✅ `.claude/` (protegido - sistema de orquestación)
- ✅ `docs/` subdirectories (documentación válida)
- ✅ `/uploads/photos/` (fotos de candidatos)
- ✅ `backend/scripts/extract_photos_fixed.py` (versión actual)
- ✅ `BASEDATEJP/README.md` (marcador de carpeta legacy)

---

Para detalles completos, ver: `AUDIT_EXHAUSTIVO_COMPLETO.md`
