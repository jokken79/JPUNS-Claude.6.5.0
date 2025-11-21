# 🚀 PLAN DE EJECUCIÓN 8 SEMANAS - UNS-ClaudeJP 6.0.0

**Objetivo:** Transformar el proyecto de estado actual (6.5/10) a LISTO PRODUCCIÓN (9/10)

**Estimado:** 132 horas = 4 semanas fulltime / 8 semanas part-time
**Rama:** `claude/project-audit-cleanup-01BnhrSyZcJhG4EA3hg4tCyM`
**Fecha inicio:** 2025-11-19

---

## 📋 TABLA DE CONTENIDOS

1. [SEMANA 1: Bugs Críticos](#semana-1)
2. [SEMANA 2: Migraciones](#semana-2)
3. [SEMANA 3-4: Limpieza Código](#semana-3-4)
4. [SEMANA 5: Documentación](#semana-5)
5. [SEMANA 6: Testing](#semana-6)
6. [SEMANA 7: Performance](#semana-7)
7. [SEMANA 8: QA y Release](#semana-8)
8. [Checkpoints y Validation](#checkpoints)

---

## <a name="semana-1"></a>🔴 SEMANA 1: BUGS CRÍTICOS (Instalación)

**Objetivo:** Sistema funciona al instalar desde cero
**Estimado:** 12 horas
**Riesgo:** BAJO

### Lunes: Corregir dependencias y environment

#### Tarea 1.1: Corregir pyodbc (Windows-only)
**Ubicación:** `backend/requirements.txt:31`
**Problema:** `pyodbc==5.3.0` falla en Docker Linux
**Solución:**

```bash
# 1. Editar requirements.txt
# Cambiar línea 31 de:
pyodbc==5.3.0

# A:
pyodbc==5.3.0; sys_platform == 'win32'
```

**Validación:**
```bash
docker compose build backend  # Debe completar sin errores
```

**Tiempo:** 15 min
**Prioridad:** 🔴 CRÍTICA

---

#### Tarea 1.2: Generar SECRET_KEY único
**Ubicación:** `scripts/setup/generate_env.py`
**Problema:** SECRET_KEY no es único (seguridad comprometida)
**Solución:**

```python
# backend/.env.example línea 16
# Cambiar:
SECRET_KEY=change-me-to-a-64-byte-token

# A:
SECRET_KEY=<GENERADO_AUTOMÁTICAMENTE>

# En scripts/setup/generate_env.py, agregar:
import secrets
SECRET_KEY = secrets.token_hex(32)  # 64 caracteres aleatorios
```

**Validación:**
```bash
python scripts/setup/generate_env.py
grep "SECRET_KEY=" .env  # Debe mostrar token de 64 caracteres
```

**Tiempo:** 30 min
**Prioridad:** 🔴 CRÍTICA

---

#### Tarea 1.3: Corregir NEXT_PUBLIC_API_URL
**Ubicación:** `frontend/.env.example:189`
**Problema:** `NEXT_PUBLIC_API_URL=http://localhost:8000/api` → timeout en Docker
**Solución:**

```bash
# Cambiar:
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# A (relativo, permite nginx routing):
NEXT_PUBLIC_API_URL=/api
```

**Validación:**
```bash
# En frontend/lib/api.ts, verificar que usa NEXT_PUBLIC_API_URL correctamente
grep -n "NEXT_PUBLIC_API_URL" frontend/lib/api.ts
```

**Tiempo:** 15 min
**Prioridad:** 🔴 CRÍTICA

---

#### Tarea 1.4: Versión v6.0.0 en todo el código
**Problema:** Código menciona v5.6.0, repo es v6.0.0
**Archivos a actualizar:**

1. **backend/app/core/config.py**
```python
# Línea ~16, cambiar:
APP_VERSION: str = "5.6.0"
# A:
APP_VERSION: str = "6.0.0"
```

2. **backend/tests/conftest.py**
```python
# Línea ~17, cambiar:
"APP_VERSION", os.getenv("APP_VERSION", "5.6.0")
# A:
"APP_VERSION", os.getenv("APP_VERSION", "6.0.0")
```

3. **README.md**
```markdown
# Cambiar badges en líneas 1-10:
![Version](https://img.shields.io/badge/version-5.6.0-blue.svg)
# A:
![Version](https://img.shields.io/badge/version-6.0.0-blue.svg)
```

4. **docker-compose.yml**
```yaml
# Verificar nombre y referencias:
name: uns-claudejp-600  # OK
# Verificar todos los services usan latest compatible versions
```

**Validación:**
```bash
grep -r "5\.6\.0\|5\.4\." backend/ frontend/ README.md | grep -v archive | wc -l
# Debe mostrar 0 líneas (excepto en archive/)
```

**Tiempo:** 1 hora
**Prioridad:** 🔴 CRÍTICA

---

#### Tarea 1.5: Crear BASEDATEJP si no existe
**Ubicación:** `docker-compose.yml:112`
**Problema:** Docker compose monta BASEDATEJP pero no existe

```bash
# Crear directorio
mkdir -p ./BASEDATEJP
# Crear .gitkeep para que git lo trackee
touch ./BASEDATEJP/.gitkeep
```

**Tiempo:** 5 min
**Prioridad:** 🟠 ALTA

---

### Martes: Testing básico

#### Tarea 1.6: Instalar y ejecutar desde cero
```bash
# 1. Limpiar (si es desarrollo local)
docker compose down -v  # -v elimina volúmenes
rm .env  # Fuerza regeneración

# 2. Generar .env
python scripts/setup/generate_env.py

# 3. Iniciar servicios
docker compose up -d

# 4. Esperar 30s para que servicios levanten
sleep 30

# 5. Verificar salud
docker compose ps  # Todos deben estar en "running"
curl http://localhost:8000/api/health  # Debe responder 200
curl http://localhost:3000  # Debe servir HTML
```

**Validación Checklist:**
- [ ] `docker compose ps` muestra todos en "Up"
- [ ] `curl http://localhost:8000/api/health` → {"status": "ok"}
- [ ] Frontend carga en http://localhost:3000
- [ ] Login funciona con admin/admin123
- [ ] Puedo hacer GET /api/candidates (debe retornar 200)

**Tiempo:** 1 hora (incluyendo troubleshooting)
**Prioridad:** 🔴 CRÍTICA

---

### Miércoles-Jueves: Documentación inicial

#### Tarea 1.7: Actualizar README.md
**Ubicación:** `/README.md`

**Cambios requeridos:**
- Actualizar versión 5.6.0 → 6.0.0 (todos los badges)
- Actualizar enlace del repo (si cambió)
- Verificar URLs funcionan
- Agregar sección "CAMBIOS EN v6.0.0"

**Tiempo:** 1 hora
**Prioridad:** 🟠 ALTA

---

#### Tarea 1.8: Crear CHANGELOG_V6.0.0.md
**Ubicación:** `/CHANGELOG_V6.0.0.md`

**Contenido:**
```markdown
# Changelog v6.0.0

## 🎯 Cambios Principales

### ✅ Corregido
- Instalación desde cero ahora funciona sin errores
- pyodbc condicional (Windows-only)
- SECRET_KEY generado únicamente en cada instalación
- NEXT_PUBLIC_API_URL optimizado para nginx routing
- Versiones sincronizadas en todo el código

### 📦 Dependencias
- Backend: 94 paquetes (1 crítico corregido: pyodbc)
- Frontend: 81 paquetes (todas compatibles)

### 📝 Documentación
- README.md actualizado a v6.0.0
- Guía de instalación limpia
- Troubleshooting de bugs conocidos

### ⏱️ Timeline
- Fase 1 (SEMANA 1): Bugs críticos ✅
- Fase 2 (SEMANA 2): Migraciones 🔄
- Fase 3-4 (SEMANA 3-4): Limpieza código 📅
- Fase 5 (SEMANA 5): Documentación 📅
- Fase 6 (SEMANA 6): Testing 📅
- Fase 7 (SEMANA 7): Performance 📅
- Fase 8 (SEMANA 8): Release 📅
```

**Tiempo:** 30 min
**Prioridad:** 🟡 MEDIA

---

#### Tarea 1.9: Crear INSTALACION_RAPIDA.md
**Ubicación:** `/INSTALACION_RAPIDA.md`

```markdown
# Instalación Rápida v6.0.0

## Requisitos
- Docker Desktop (Windows/Mac) o Docker Engine (Linux)
- Python 3.11+
- 4GB RAM mínimo
- Puertos: 3000, 8000, 5432, 8080, 6379

## Pasos

### 1. Clonar y preparar
bash
git clone https://github.com/jokken79/UNS-ClaudeJP-6.0.0.git
cd UNS-ClaudeJP-6.0.0
python scripts/setup/generate_env.py


### 2. Iniciar servicios
bash
docker compose up -d
docker compose ps  # Verificar todos "Up"


### 3. Esperar y validar
bash
sleep 30
curl http://localhost:8000/api/health
# Debe responder: {"status": "ok"}


### 4. Acceder
- Frontend: http://localhost:3000
- Backend API: http://localhost/api
- Swagger docs: http://localhost:8000/api/docs
- Database UI: http://localhost:8080

### 5. Login
- Usuario: admin
- Contraseña: admin123

## Troubleshooting

### ERROR: "Could not build wheels for pyodbc"
- Significa estás en Linux. Esto está corregido en v6.0.0.
- Si aún ocurre: Actualiza requirements.txt

### ERROR: "Connection refused" en frontend
- Frontend no puede conectar a backend.
- Verificar: curl http://localhost/api/health
- Si falla: docker compose logs nginx

### ERROR: "403 Forbidden" en login
- SECRET_KEY no sincronizado entre servicios.
- Solución: docker compose restart backend frontend

## Detener servicios
bash
docker compose down

## Limpiar completamente
bash
docker compose down -v  # Elimina volúmenes de datos
rm .env
python scripts/setup/generate_env.py
docker compose up -d  # Fresh start
```

**Tiempo:** 1 hora
**Prioridad:** 🟡 MEDIA

---

### Viernes: Validación y commit

#### Tarea 1.10: Validar suite completa SEMANA 1
```bash
# Checklist final
[ ] docker compose up -d (sin errores)
[ ] docker compose ps (todos "Up")
[ ] curl http://localhost:8000/api/health (200 OK)
[ ] Acceder a http://localhost:3000 (carga)
[ ] Login admin/admin123 (funciona)
[ ] GET /api/candidates (retorna datos)
[ ] Versiones consistentes (v6.0.0)
[ ] README.md actualizado
[ ] CHANGELOG_V6.0.0.md creado
[ ] INSTALACION_RAPIDA.md creado
```

**Tiempo:** 1 hora
**Prioridad:** 🔴 CRÍTICA

---

#### Tarea 1.11: Commit SEMANA 1
```bash
git add -A
git commit -m "SEMANA 1: Corregir bugs críticos de instalación v6.0.0

- Corregir pyodbc como dependencia condicional Windows-only
- Implementar generación única de SECRET_KEY
- Cambiar NEXT_PUBLIC_API_URL a relativo para nginx routing
- Sincronizar versión a v6.0.0 en todo el código
- Crear directorio BASEDATEJP
- Agregar documentación: README.md, CHANGELOG_V6.0.0.md, INSTALACION_RAPIDA.md

Sistema ahora instala desde cero sin errores.
Validado: ✅ docker compose up, ✅ login, ✅ API calls
"

git push -u origin claude/project-audit-cleanup-01BnhrSyZcJhG4EA3hg4tCyM
```

**Tiempo:** 15 min
**Prioridad:** 🔴 CRÍTICA

---

**📊 SEMANA 1 RESUMEN:**
- ⏱️ Estimado: 12 horas
- ✅ Sistema instala desde cero
- ✅ Login funciona
- ✅ APIs responden
- 📝 Documentación inicial lista
- 🎯 Siguiente: SEMANA 2 - Migraciones

---

## <a name="semana-2"></a>🟠 SEMANA 2: MIGRACIONES (Schema consistency)

**Objetivo:** Resolver 15 migraciones deshabilitadas
**Estimado:** 16 horas
**Riesgo:** MEDIO

### Lunes: Auditar migraciones deshabilitadas

#### Tarea 2.1: Listar todas las migraciones
```bash
cd backend
ls -lah alembic/versions/ | grep -E "\.(DISABLED|disabled|py\.old)"

# Resultado esperado: 15 migraciones deshabilitadas
# Ejemplo:
# 002_add_housing_subsidy_field.py.DISABLED
# 003_add_nyuusha_renrakuhyo_fields.py.disabled
# ... (13 más)
```

**Crear archivo:** `/MIGRATIONS_AUDIT.txt`

Para cada migración deshabilitada, documentar:
1. Nombre
2. Fecha creación (estimada)
3. Campos que agrega
4. Razón por la que fue deshabilitada
5. Decisión: APLICAR / ELIMINAR

**Tiempo:** 2 horas
**Prioridad:** 🔴 CRÍTICA

---

#### Tarea 2.2: Análisis de riesgo por migración
```python
# backend/scripts/analyze_migrations.py (crear nuevo script)
import os
import re
from pathlib import Path

def analyze_disabled_migrations():
    """
    Analizar todas las migraciones deshabilitadas y listar:
    - Campos que definen
    - Si esos campos están en models.py
    - Si están en BD
    """
    disabled_migrations = Path("alembic/versions").glob("*.DISABLED")
    disabled_migrations += Path("alembic/versions").glob("*.disabled")

    for migration_file in disabled_migrations:
        with open(migration_file) as f:
            content = f.read()
            # Buscar ADD COLUMN, CREATE TABLE, etc.
            print(f"\n{migration_file.name}")
            # Extraer operaciones
            # Verificar si están en models.py
            # Reportar inconsistencias

if __name__ == "__main__":
    analyze_disabled_migrations()
```

**Ejecutar:**
```bash
cd backend
python scripts/analyze_migrations.py > /tmp/migrations_analysis.txt
```

**Tiempo:** 3 horas
**Prioridad:** 🔴 CRÍTICA

---

### Martes-Miércoles: Tomar decisiones

#### Tarea 2.3: Revisar cada migración y decidir

**Decisión para cada migración:**

**OPCIÓN A: APLICAR (si necesaria)**
- Los campos están en models.py
- Vamos a usar esa funcionalidad
- Ejemplo: `add_ai_budget_table.py` (nueva funcionalidad)

**Opción B: ELIMINAR (si obsoleta)**
- Los campos están viejos
- Ya no se usan
- Ejemplo: `add_parking_field.py` (reemplazado por v2)

**Opción C: REVISAR (si incierta)**
- Requiere análisis más profundo
- Pasar a reunión con stakeholders

**Crear archivo de decisiones:** `/MIGRATIONS_DECISIONS.md`

```markdown
# Decisiones Migraciones

## APLICAR (5 migraciones)
- [ ] 2025_11_16_add_ai_budget_table.py → APLICAR (nueva funcionalidad)
- [ ] 2025_11_16_add_ai_usage_log_table.py → APLICAR (nueva funcionalidad)
- [ ] 2025_11_12_1804_add_parking_and_plus_fields.py → APLICAR
- [ ] 2025_11_12_1900_add_tax_rates_to_payroll_settings.py → APLICAR
- [ ] 2025_11_12_1900_add_timer_cards_indexes_constraints.py → APLICAR

## ELIMINAR (7 migraciones)
- [ ] 002_add_housing_subsidy_field.py.DISABLED → ELIMINAR (duplica v2)
- [ ] 003_add_nyuusha_renrakuhyo_fields.py.disabled → ELIMINAR (viejo)
- [ ] 43b6cf501eed_add_pays_parking_field_to_apartment_assignments.py.DISABLED → ELIMINAR (consolidado)
- [ ] 5e6575b9bf1b_add_apartment_system_v2_assignments_charges_deductions.py.DISABLED → APLICAR o ELIMINAR (crítico)
- [ ] 642bced75435_add_property_type_field_to_apartments.py.DISABLED → REVISAR
- [ ] 68534af764e0_add_additional_charges_and_rent_deductions_tables.py.DISABLED → REVISAR
- [ ] 2025_11_12_2100_add_admin_audit_log_table.py.DISABLED → REVISAR

## REVISAR (3 migraciones)
- [ ] 2025_11_12_1900_add_timer_cards_indexes_constraints.py.DISABLED → Requiere análisis
- [ ] 2025_11_12_2000_remove_redundant_employee_id_from_timer_cards.py.DISABLED → Puede romper datos
- [ ] 2025_11_12_2200_add_additional_search_indexes.py.DISABLED → Performance
```

**Tiempo:** 6 horas (incluir reunión si necesario)
**Prioridad:** 🔴 CRÍTICA

---

### Jueves: Aplicar migraciones decididas

#### Tarea 2.4: Renombrar migraciones a aplicar
```bash
cd backend/alembic/versions/

# Renombrar archivos .DISABLED → .py (para aplicarlas)
for f in *.DISABLED; do mv "$f" "${f%.DISABLED}"; done
for f in *.disabled; do mv "$f" "${f%.disabled}"; done

# Eliminar las que decidimos descartar
rm -f 002_add_housing_subsidy_field.py
rm -f 003_add_nyuusha_renrakuhyo_fields.py
# ... (eliminar las 7 que decidimos)
```

**Validación:**
```bash
ls -la alembic/versions/*.py | wc -l
# Debe mostrar: número_original - 7 (eliminadas)
```

**Tiempo:** 30 min
**Prioridad:** 🔴 CRÍTICA

---

#### Tarea 2.5: Ejecutar migraciones
```bash
cd backend

# 1. Backup BD (importante!)
docker exec uns-claudejp-db pg_dump -U uns_admin uns_claudejp > \
  /tmp/backup_before_migrations_$(date +%Y%m%d_%H%M%S).sql

# 2. Aplicar migraciones
docker exec uns-claudejp-backend bash -c "cd /app && alembic upgrade head"

# 3. Verificar resultado
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "\dt" | head -20
# Debe mostrar nuevas tablas
```

**Validación:**
```bash
# Verificar migraciones aplicadas
docker exec uns-claudejp-backend bash -c "cd /app && alembic current"
docker exec uns-claudejp-backend bash -c "cd /app && alembic history | head -10"

# Verificar schema matches models.py
python backend/scripts/verify_schema_consistency.py
```

**Tiempo:** 1 hora
**Prioridad:** 🔴 CRÍTICA

---

### Viernes: Validación y commit

#### Tarea 2.6: Validar integridad de datos
```bash
# 1. Verificar no hay errores en logs
docker compose logs backend | grep -i error | head -20

# 2. Verificar API aún funciona
curl http://localhost:8000/api/health

# 3. Correr tests
docker exec uns-claudejp-backend pytest tests/test_health.py -v

# 4. Verificar datos persistieron
curl http://localhost:8000/api/candidates | jq '.count'
# Debe mostrar número > 0 (si hay datos)
```

**Checklist:**
- [ ] Migraciones aplicadas sin errores
- [ ] BD schema matches models.py
- [ ] API funciona
- [ ] Datos persistieron
- [ ] Tests pasan

**Tiempo:** 1 hora
**Prioridad:** 🔴 CRÍTICA

---

#### Tarea 2.7: Commit SEMANA 2
```bash
git add -A
git commit -m "SEMANA 2: Resolver 15 migraciones deshabilitadas

- Auditoría completa de migraciones .DISABLED
- Documento de decisiones para cada migración
- Aplicar 8 migraciones necesarias
- Eliminar 7 migraciones obsoletas
- Validar schema BD vs models.py
- Crear backup y rollback plan

Sistema ahora tiene schema consistente.
Validado: ✅ alembic upgrade head, ✅ API funciona, ✅ Datos persisten
"

git push -u origin claude/project-audit-cleanup-01BnhrSyZcJhG4EA3hg4tCyM
```

**Tiempo:** 15 min

---

**📊 SEMANA 2 RESUMEN:**
- ⏱️ Estimado: 16 horas
- ✅ 15 migraciones resueltas (8 aplicadas, 7 eliminadas)
- ✅ Schema BD consistente con models.py
- ✅ Datos validados
- 📝 Decisiones documentadas
- 🎯 Siguiente: SEMANA 3-4 - Limpieza de código

---

## <a name="semana-3-4"></a>💪 SEMANA 3-4: LIMPIEZA DE CÓDIGO (Dead code elimination)

**Objetivo:** Reducir de 305 → 220 archivos Python (28% reducción)
**Estimado:** 40 horas
**Riesgo:** MEDIO-ALTO

### Semana 3: Limpieza de directorios y scripts

#### Tarea 3.1: Eliminar 7 directorios orphaned

**Directorios a eliminar:**
1. `backend/cache/` (850 líneas, duplica cache_service.py)
2. `backend/extractors/` (800+ líneas, duplica photo_service.py)
3. `backend/processors/` (600+ líneas, duplica batch_optimizer.py)
4. `backend/validation/` (800+ líneas, nunca se usa)
5. `backend/config/` (debe estar en app/core/)
6. `backend/performance/` (nunca se usa)
7. `backend/utils/` (duplica app/core/logging.py)

**Pasos:**

```bash
cd backend

# 1. Verificar qué scripts dependen de estos directorios
grep -r "from cache import\|from extractors import\|from processors import\|from validation import\|from config import\|from performance import\|from utils import" . --include="*.py" | head -20

# 2. Buscar si algún script .py los importa
grep -r "from backend.cache\|from backend.extractors\|from backend.processors" scripts/ --include="*.py"

# 3. Si no hay dependencias, eliminar
rm -rf cache/ extractors/ processors/ validation/ config/ performance/ utils/

# 4. Verificar no rompió nada
git status | grep "deleted\|modified"
```

**Validación:**
```bash
# Tests deben pasar
pytest tests/ -v --tb=short | tail -20
# Si falla algún test, fue por dependencia no detectada
```

**Tiempo:** 4 horas
**Prioridad:** 🔴 CRÍTICA

---

#### Tarea 3.2: Consolidar scripts de foto (29 scripts → 1)

**Scripts a consolidar:**
```
backend/scripts/
├─ auto_extract_photos_from_databasejp.py
├─ auto_extract_photos_from_databasejp_v2.py
├─ extract_photos_from_access_db_v52.py
├─ extract_all_photos_urgente.py
└─ ... (25 más)
```

**Estrategia:**

```bash
cd backend/scripts

# 1. Identificar la MEJOR versión
# (normalmente la más nueva o la que más tests tiene)
ls -lt extract_photos*.py | head -3
# Ejemplo: extract_photos_v2_improved.py es la mejor

# 2. Renombrar la mejor a nombre estándar
mv extract_photos_v2_improved.py extract_photos.py

# 3. Crear alias para scripts que llamen la anterior
cat > extract_photos_legacy.py << 'EOF'
#!/usr/bin/env python3
"""Legacy alias para extract_photos.py"""
from extract_photos import main

if __name__ == "__main__":
    main()
EOF

# 4. Eliminar versiones viejas
for f in auto_extract_photos_*.py extract_photos_v1*.py extract_photos_v2*.py; do
    [ -f "$f" ] && [ "$f" != "extract_photos.py" ] && rm "$f"
done

# 5. Verificar solo quedan 1-2 versiones
ls extract_photos*.py
# Resultado esperado: extract_photos.py, extract_photos_legacy.py
```

**Crear documentación:**
```markdown
# backend/scripts/EXTRACT_PHOTOS_README.md

## Consolidación de scripts de extracción de fotos

De 29 scripts, consolidados a:
- `extract_photos.py` - VERSIÓN PRINCIPAL (reemplaza todas)
- `extract_photos_legacy.py` - ALIAS para compatibilidad

### Uso:
python extract_photos.py

### Scripts antiguos:
Todos los scripts v1, v2, v3, etc. han sido ELIMINADOS.
Si necesitas la versión anterior, usar: git log --follow scripts/extract_photos.py
```

**Tiempo:** 6 horas
**Prioridad:** 🔴 CRÍTICA

---

#### Tarea 3.3: Consolidar scripts de admin (10 scripts → 1)

**Scripts a consolidar:**
```
create_admin_user.py
reset_admin_simple.py
reset_admin_password.py
reset_admin_now.py
fix_admin_password.py
... (5 más)
```

**Estrategia:**

```bash
# 1. Identificar el mejor
ls -lt *admin*.py | head -3

# 2. Usar como principal
mv create_admin_user_best.py create_admin_user.py

# 3. Crear aliases
cat > reset_admin.py << 'EOF'
#!/usr/bin/env python3
"""Alias para create_admin_user.py"""
from create_admin_user import reset_admin

if __name__ == "__main__":
    reset_admin()
EOF

# 4. Eliminar el resto
for f in reset_admin*.py fix_admin*.py; do
    [ -f "$f" ] && [ "$f" != "create_admin_user.py" ] && rm "$f"
done
```

**Resultado:**
- `create_admin_user.py` (principal)
- `reset_admin.py` (alias)

**Tiempo:** 4 horas
**Prioridad:** 🔴 CRÍTICA

---

#### Tarea 3.4: Consolidar scripts de import (19 scripts → 3)

**Consolidación:**
```
import_candidates_simple.py      → ELIMINAR (viejo)
import_candidates_improved.py    → MANTENER (mejor)
import_candidates_robust.py      → ELIMINAR (viejo)
resilient_importer.py            → MANTENER (alternativa)
import_employees_from_excel.py   → MANTENER (especializado)
```

**Crear matriz:**
```markdown
# backend/scripts/IMPORT_SCRIPTS_MATRIX.md

## Matriz de decisiones

| Script | Propósito | Decisión | Reemplazo |
|--------|-----------|----------|-----------|
| import_candidates_simple.py | Importar básico | ELIMINAR | import_candidates_improved.py |
| import_candidates_improved.py | Mejor importador | MANTENER | - |
| import_candidates_robust.py | Viejo robusto | ELIMINAR | resilient_importer.py |
| resilient_importer.py | Importador con retry | MANTENER | - |
| import_employees_from_excel.py | Empleados | MANTENER | - |
| ... 14 más | | | |
```

**Resultado:**
- `import_candidates_improved.py` (principal)
- `resilient_importer.py` (alternativa)
- `import_employees_from_excel.py` (especializado)

**Tiempo:** 4 horas
**Prioridad:** 🟠 ALTA

---

#### Tarea 3.5: Crear manifest de scripts esenciales

**Archivo:** `backend/scripts/ESSENTIAL_SCRIPTS.md`

```markdown
# Scripts Esenciales

## Críticos (SIEMPRE ejecutar al setup)
- [ ] manage_db.py - Gestor principal de BD
- [ ] create_admin_user.py - Crear usuario admin

## Importantes (Data management)
- [ ] import_candidates_improved.py - Importar candidatos
- [ ] resilient_importer.py - Importar con retry
- [ ] import_employees_from_excel.py - Importar empleados
- [ ] extract_photos.py - Extraer fotos

## Utilitarios (Maintenance)
- [ ] verify_data.py - Verificar integridad
- [ ] sync_candidate_employee_status.py - Sincronizar datos
- [ ] export_to_json.py - Exportar datos

## Testing (Development)
- [ ] test_ocr_pipeline.py - Test OCR
- [ ] test_db_connection.py - Test BD

## Total: 12 scripts esenciales (de 96 originales)
```

**Tiempo:** 1 hora
**Prioridad:** 🟡 MEDIA

---

### Semana 4: Consolidar servicios duplicados

#### Tarea 4.1: Consolidar servicios de Payroll (7 → 1)

**Archivos duplicados:**
```
backend/app/services/
├─ payroll_service.py
├─ payroll/payroll_service.py (duplicado)
├─ payroll_integration_service.py
├─ payslip_service.py
├─ salary_service.py
├─ salary_export_service.py
└─ deduction_service.py
```

**Estrategia:**

1. **Analizar cada archivo** (línea por línea)
```bash
cd backend/app/services/

# Ver tamaño y contenido
wc -l payroll*.py salary*.py deduction*.py
cat payroll_service.py | head -50  # Ver qué hace
```

2. **Consolidar en UNO:** `payroll_service.py`
```python
# backend/app/services/payroll_service.py (nuevo, consolidado)

class PayrollService:
    """Servicio consolidado de nómina"""

    async def calculate_payroll(self, employee_id):
        """Calcula nómina (reemplaza payroll_integration_service)"""
        pass

    async def generate_payslip(self, payroll_id):
        """Genera nómina (reemplaza payslip_service)"""
        pass

    async def apply_deductions(self, payroll_id):
        """Aplica deducciones (reemplaza deduction_service)"""
        pass

    async def export_payroll(self, payroll_id, format='pdf'):
        """Exporta nómina (reemplaza salary_export_service)"""
        pass
```

3. **Eliminar archivos duplicados**
```bash
rm -f payroll/payroll_service.py
rm -f payroll_integration_service.py
rm -f payslip_service.py
rm -f salary_service.py  # O si es diferente, consolidar
rm -f salary_export_service.py
rm -f deduction_service.py
```

4. **Actualizar imports en routers**
```bash
# Buscar qué routers importan estos servicios
grep -r "from.*payroll_service\|from.*payslip_service\|from.*deduction" ../api/ --include="*.py"

# Cambiar imports a usar payroll_service.py consolidado
# Ejemplo: from payroll_service import PayrollService
```

5. **Validar tests pasan**
```bash
pytest tests/test_payroll*.py -v
```

**Tiempo:** 8 horas
**Prioridad:** 🔴 CRÍTICA

---

#### Tarea 4.2: Consolidar servicios de OCR (7 → 1)

**Archivos:**
```
backend/app/services/
├─ azure_ocr_service.py
├─ easyocr_service.py
├─ tesseract_ocr_service.py
├─ hybrid_ocr_service.py
├─ timer_card_ocr_service.py
├─ ocr_cache_service.py
└─ ocr_weighting.py
```

**Estrategia similar a payroll:**

1. `hybrid_ocr_service.py` es el "maestro" (ya combina los demás)
2. Mover todo a `hybrid_ocr_service.py`
3. Eliminar duplicados

**Tiempo:** 6 horas
**Prioridad:** 🔴 CRÍTICA

---

#### Tarea 4.3: Consolidar servicios de Caching (3 → 1)

**Archivos:**
```
cache_service.py
ocr_cache_service.py (OCR específico)
backend/cache/photo_cache.py (nunca usado)
```

**Estrategia:**
1. Mantener `cache_service.py` (general)
2. Integrar OCR caching como método
3. Eliminar `ocr_cache_service.py` y `backend/cache/`

**Tiempo:** 2 horas
**Prioridad:** 🟡 MEDIA

---

#### Tarea 4.4: Consolidar servicios de Apartments (4 → 1)

**Schemas duplicados:**
```
apartment.py (v1)
apartment_factory.py
apartment_v2.py
apartment_v2_complete.py
```

**Estrategia:**
1. Usar `apartment_v2_complete.py` como base
2. Consolidar todos los campos
3. Mantener solo UNO

**Tiempo:** 4 horas
**Prioridad:** 🟡 MEDIA

---

#### Tarea 4.5: Validación general

```bash
# 1. Contar servicios antes/después
find backend/app/services -name "*.py" | wc -l
# Antes: ~38, Después: ~20

# 2. Verificar imports
cd backend
python -m py_compile app/services/*.py  # Debe compilar sin errores

# 3. Correr tests
pytest tests/test_payroll*.py tests/test_ocr*.py tests/test_apartment*.py -v
```

**Tiempo:** 2 horas
**Prioridad:** 🔴 CRÍTICA

---

#### Tarea 4.6: Commit SEMANA 3-4

```bash
git add -A
git commit -m "SEMANA 3-4: Consolidar 96 scripts y 38 servicios

Limpieza de código muerto:
- Eliminar 7 directorios orphaned (3,500 líneas)
- Consolidar 29 scripts foto → 1
- Consolidar 10 scripts admin → 1
- Consolidar 19 scripts import → 3
- Resultado: 96 scripts → 12 esenciales

Consolidar servicios duplicados:
- Payroll: 7 → 1 (PayrollService)
- OCR: 7 → 1 (HybridOCRService)
- Caching: 3 → 1 (CacheService)
- Apartments: 4 → 1 (ApartmentService)
- Resultado: 38 servicios → ~20

Total reducción:
- De 305 archivos Python → ~210 (31% reducción)
- De 98,854 líneas → ~70,000 (29% reducción)
- Mantenibilidad mejorada: 40-50%

Validado: ✅ Tests pasan, ✅ API funciona, ✅ Imports resueltos
"

git push -u origin claude/project-audit-cleanup-01BnhrSyZcJhG4EA3hg4tCyM
```

---

**📊 SEMANA 3-4 RESUMEN:**
- ⏱️ Estimado: 40 horas
- ✅ De 305 → 210 archivos Python (31% reducción)
- ✅ De 98,854 → 70,000 líneas (29% reducción)
- ✅ Código consolidado y organizado
- 🎯 Siguiente: SEMANA 5 - Documentación

---

## <a name="semana-5"></a>📚 SEMANA 5: DOCUMENTACIÓN (Organize chaos)

**Objetivo:** De 606 → <100 archivos .md bien organizados
**Estimado:** 24 horas
**Riesgo:** BAJO

### Lunes: Auditoría completa

#### Tarea 5.1: Listar y categorizar 606 archivos .md

```bash
# 1. Contar
find /home/user/UNS-ClaudeJP-6.0.0 -name "*.md" | wc -l
# Resultado: ~606

# 2. Listar con tamaño
find /home/user/UNS-ClaudeJP-6.0.0 -name "*.md" -exec ls -lh {} \; | \
  awk '{print $5, $NF}' | sort -k2 > /tmp/md_files.txt

# 3. Agrupar por categoría
grep "raíz:" /tmp/md_files.txt | wc -l   # Archivos en raíz
grep "docs/" /tmp/md_files.txt | wc -l   # Archivos en docs/
grep "archive" /tmp/md_files.txt | wc -l # Archivos en archive
```

**Crear matriz:** `/DOCUMENTACION_AUDIT.md`

```markdown
# Auditoría de Documentación

## Resumen
- Total archivos .md: 606
- Raíz: 239 (caótico)
- docs/: 367 (mejor)
- Duplicados: ~50 (estimado)
- Obsoletos: ~40 (estimado)

## Raíz (239 archivos)
Deben quedarse (5):
- [ ] README.md
- [ ] CLAUDE.md
- [ ] CHANGELOG_V6.0.0.md
- [ ] INSTALACION_RAPIDA.md
- [ ] CURSORRULES.md

Mover a docs/ (234):
- [ ] AUDIT_*.md (5) → docs/archive/
- [ ] THEME_*.md (6) → docs/features/themes/
- [ ] GUIA_COMPLETA_ESTILOS_TEMAS_DISENO.md → docs/guides/styling.md
- [ ] MAPEO_RUTAS.md → docs/architecture/routing.md
- [ ] ... (217 más)

Eliminar (0):
- Nada, todo tiene información valiosa

## docs/ (367 archivos)
Reorganizar:
- docs/02-guides/ → docs/guides/ (eliminar número)
- docs/04-troubleshooting/ → docs/troubleshooting/ (eliminar número)
- docs/06-archive/ → docs/archive/ (eliminar número + duplica archive/)
- Crear docs/api/ si no existe
```

**Tiempo:** 3 horas
**Prioridad:** 🟡 MEDIA

---

### Martes: Reorganizar directorios

#### Tarea 5.2: Crear estructura de docs/ estándar

```bash
cd /home/user/UNS-ClaudeJP-6.0.0/docs

# Crear estructura
mkdir -p {
  guides,
  architecture,
  api,
  features,
  troubleshooting,
  archive,
  research,
  security
}

# Renombrar si existen directorios con números
[ -d "02-guides" ] && mv 02-guides/* guides/ 2>/dev/null
[ -d "04-troubleshooting" ] && mv 04-troubleshooting/* troubleshooting/ 2>/dev/null
[ -d "06-archive" ] && mv 06-archive/* archive/ 2>/dev/null && rmdir 06-archive
```

**Estructura final:**
```
docs/
├─ README.md (índice de documentación)
├─ guides/
│  ├─ instalacion.md
│  ├─ desarrollo.md
│  ├─ testing.md
│  ├─ styling.md
│  ├─ troubleshooting.md
│  └─ deployment.md
├─ architecture/
│  ├─ backend.md
│  ├─ frontend.md
│  ├─ database.md
│  └─ routing.md
├─ features/
│  ├─ candidates.md
│  ├─ employees.md
│  ├─ payroll.md
│  ├─ timercards.md
│  ├─ apartments.md
│  └─ themes.md
├─ api/
│  ├─ endpoints.md
│  └─ authentication.md
├─ security/
│  ├─ secrets.md
│  ├─ cors.md
│  └─ compliance.md
├─ troubleshooting/
│  ├─ installation.md
│  ├─ common-errors.md
│  └─ performance.md
└─ archive/ (todo lo viejo)
```

**Tiempo:** 2 horas
**Prioridad:** 🟠 ALTA

---

#### Tarea 5.3: Mover archivos de raíz a docs/

```bash
cd /home/user/UNS-ClaudeJP-6.0.0

# 1. MANTENER EN RAÍZ (5 únicos)
MANTENER="README.md|CLAUDE.md|CHANGELOG_V6.0.0.md|INSTALACION_RAPIDA.md|CURSORRULES.md"

# 2. Mover AUDIT_*.md a archive
mv AUDIT_COMPLETE_ANALYSIS_2025-11-19.md docs/archive/
mv AUDIT_BUGS_REPORT_2025_11_16.md docs/archive/
mv AUDIT_SUMMARY_QUICK_REFERENCE.md docs/archive/

# 3. Mover THEME_*.md a features/themes
mv THEME_*.md docs/features/themes/ 2>/dev/null

# 4. Mover GUIA_COMPLETA_ESTILOS a guides
mv GUIA_COMPLETA_ESTILOS_TEMAS_DISENO.md docs/guides/styling.md

# 5. Mover CLEANUP_*.md a archive
mv CLEANUP_SUMMARY_*.md docs/archive/ 2>/dev/null

# 6. Mover CANDIDATOS_*.md a features
mv CANDIDATE_*.md docs/features/ 2>/dev/null

# 7. Mover EMPLOYEE_*.md a features
mv EMPLOYEE_*.md docs/features/ 2>/dev/null

# 8. Mover análisis y reportes a archive
mv ANALYSIS_*.md docs/archive/ 2>/dev/null
mv REPORT_*.md docs/archive/ 2>/dev/null
mv DIAGNOSTIC_*.md docs/archive/ 2>/dev/null

# 9. Verificar qué quedó en raíz
ls *.md | grep -v -E "$MANTENER"
```

**Resultado esperado:**
```
/root/UNS-ClaudeJP-6.0.0/
├─ README.md
├─ CLAUDE.md
├─ CHANGELOG_V6.0.0.md
├─ INSTALACION_RAPIDA.md
├─ CURSORRULES.md
└─ docs/ (todo lo demás)
```

**Tiempo:** 2 horas
**Prioridad:** 🔴 CRÍTICA

---

### Miércoles: Crear documentos maestros

#### Tarea 5.4: Crear docs/README.md (índice)

```markdown
# Documentación UNS-ClaudeJP 6.0.0

## 📖 Guías de Inicio

- **[Instalación Rápida](../INSTALACION_RAPIDA.md)** - Instalar en 5 min
- **[Guía de Desarrollo](guides/desarrollo.md)** - Setup local
- **[Guía de Testing](guides/testing.md)** - Correr tests

## 🏗️ Arquitectura

- **[Backend](architecture/backend.md)** - FastAPI, servicios, BD
- **[Frontend](architecture/frontend.md)** - Next.js, componentes
- **[Database](architecture/database.md)** - Schema, modelos
- **[Routing](architecture/routing.md)** - API endpoints

## 🎯 Características

- **[Candidatos](features/candidates.md)** - Gestión de candidatos
- **[Empleados](features/employees.md)** - Gestión de empleados
- **[Nómina](features/payroll.md)** - Cálculo automático
- **[Asistencia](features/timercards.md)** - Control de horas
- **[Vivienda](features/apartments.md)** - Housing system
- **[Temas](features/themes.md)** - Sistema de temas

## 🔌 API

- **[Endpoints](api/endpoints.md)** - Todas las rutas
- **[Autenticación](api/authentication.md)** - JWT, roles

## 🔐 Seguridad

- **[Secrets y Configuración](security/secrets.md)**
- **[CORS y Network](security/cors.md)**
- **[Compliance](security/compliance.md)**

## 🛠️ Troubleshooting

- **[Instalación](troubleshooting/installation.md)**
- **[Errores Comunes](troubleshooting/common-errors.md)**
- **[Performance](troubleshooting/performance.md)**

## 📚 Archive (Histórico)

- [Documentos Viejos](archive/) - v5.x y anteriores
- [Reportes Antiguos](archive/) - Análisis previos

## 📋 Versiones

- **Actual:** 6.0.0
- **Changelog:** [CHANGELOG_V6.0.0.md](../CHANGELOG_V6.0.0.md)
```

**Tiempo:** 1 hora
**Prioridad:** 🟠 ALTA

---

#### Tarea 5.5: Crear guides/ principales

**Crear:** `docs/guides/desarrollo.md`
```markdown
# Guía de Desarrollo

## Setup Local

1. Generar .env: `python scripts/setup/generate_env.py`
2. Levantar servicios: `docker compose up -d`
3. Esperar 30s
4. Verificar: `curl http://localhost:8000/api/health`

## Desarrollo Backend

```bash
# Entrar al container
docker exec -it uns-claudejp-backend bash

# Modificar código
vim app/api/candidates.py

# Tests automáticos (hot reload activo)
pytest tests/ -v --tb=short
```

## Desarrollo Frontend

```bash
# Entrar al container
docker exec -it uns-claudejp-frontend bash

# Modificar código
vim app/(dashboard)/candidates/page.tsx

# TypeScript validation
npm run typecheck

# Linting
npm run lint:fix
```

## Database Migrations

```bash
# Crear nueva migración
docker exec uns-claudejp-backend bash -c "cd /app && alembic revision --autogenerate -m 'descripción'"

# Aplicar
docker exec uns-claudejp-backend bash -c "cd /app && alembic upgrade head"

# Ver histórico
docker exec uns-claudejp-backend bash -c "cd /app && alembic history"
```
```

**Crear:** `docs/guides/testing.md`
```markdown
# Guía de Testing

## Backend Tests

```bash
# Correr todos
pytest backend/tests/ -v

# Por módulo
pytest backend/tests/test_auth.py -v

# Con coverage
pytest backend/tests/ --cov=app --cov-report=html
```

## Frontend E2E Tests

```bash
# Correr todos
npm run test:e2e

# Con UI
npm run test:e2e:ui

# Specific test
npm run test:e2e:yukyu
```

## Coverage

- Backend: >70% coverage
- Frontend: E2E tests + manual
```

**Tiempo:** 3 horas
**Prioridad:** 🟡 MEDIA

---

### Jueves-Viernes: Validación y limpieza final

#### Tarea 5.6: Verificar links en documentación

```bash
# Crear script para verificar links
cat > /tmp/check_md_links.py << 'EOF'
import os
import re
from pathlib import Path

def check_links():
    """Verificar que todos los links en .md apunten a archivos reales"""
    errors = []

    for md_file in Path('/home/user/UNS-ClaudeJP-6.0.0').rglob('*.md'):
        with open(md_file) as f:
            content = f.read()

            # Buscar links [text](path)
            links = re.findall(r'\[.*?\]\((.*?)\)', content)

            for link in links:
                if link.startswith(('http://', 'https://', '#')):
                    continue  # Skip external links

                # Resolver ruta relativa
                if link.startswith('/'):
                    full_path = f"/home/user/UNS-ClaudeJP-6.0.0{link}"
                else:
                    full_path = (md_file.parent / link).resolve()

                if not full_path.exists():
                    errors.append(f"{md_file}: Link roto: {link}")

    return errors

if __name__ == "__main__":
    errors = check_links()
    if errors:
        print("ERRORES ENCONTRADOS:")
        for error in errors[:20]:  # Mostrar primeros 20
            print(f"  ❌ {error}")
    else:
        print("✅ Todos los links están bien!")
EOF

python /tmp/check_md_links.py
```

**Tiempo:** 2 horas
**Prioridad:** 🟠 ALTA

---

#### Tarea 5.7: Crear CONTRIBUTING.md

```markdown
# Contribuyendo al Proyecto

## Proceso

1. Clonar repo
2. Crear rama: `git checkout -b feature/my-feature`
3. Hacer cambios
4. Commit: `git commit -m "descripción clara"`
5. Push: `git push origin feature/my-feature`
6. Crear PR en GitHub

## Estándares de Código

### Backend
- Black para formatting: `black app/`
- Ruff para linting: `ruff check app/`
- mypy para type checking: `mypy app/ --strict`

### Frontend
- ESLint: `npm run lint:fix`
- Prettier: `npm run format`
- TypeScript: `npm run typecheck`

## Testing

### Backend
- Mínimo 70% coverage
- Tests nombrados: `test_*_test.py`
- Patrones: `test_happy_path`, `test_error_case`

### Frontend
- E2E tests: `npm run test:e2e`
- Coverage: `npm test -- --coverage`

## Documentación

- Actualizar `docs/` si cambias funcionalidad
- Actualizar CHANGELOG.md
- Escribir docstrings (backend)
- Escribir JSDoc (frontend)
```

**Tiempo:** 1 hora
**Prioridad:** 🟡 MEDIA

---

#### Tarea 5.8: Commit SEMANA 5

```bash
git add -A
git commit -m "SEMANA 5: Reorganizar 606 archivos .md

Documentación:
- Reducir raíz de 239 → 5 archivos .md
- Reorganizar docs/ en estructura clara
- Crear docs/README.md como índice
- Crear guías: desarrollo, testing
- Crear security/, troubleshooting/
- Eliminar carpeta 06-archive/ (duplicada)

Resultado:
- docs/ limpio y bien organizado
- Links verificados
- Índice claro de navegación
- Raíz limpia

Total: 606 archivos consolidados y organizados
"

git push -u origin claude/project-audit-cleanup-01BnhrSyZcJhG4EA3hg4tCyM
```

---

**📊 SEMANA 5 RESUMEN:**
- ⏱️ Estimado: 24 horas
- ✅ De 239 → 5 archivos en raíz
- ✅ docs/ reorganizado y claro
- ✅ Índice de documentación
- ✅ 606 archivos organizados
- 🎯 Siguiente: SEMANA 6 - Testing

---

## <a name="semana-6"></a>🧪 SEMANA 6: TESTING (Quality assurance)

**Objetivo:** +70% code coverage, CI/CD pipeline automatizado
**Estimado:** 32 horas
**Riesgo:** BAJO

### Lunes: Backend type checking con mypy

#### Tarea 6.1: Configurar y ejecutar mypy

```bash
# 1. Crear/actualizar mypy.ini
cat > backend/mypy.ini << 'EOF'
[mypy]
python_version = 3.11
strict = True
warn_return_any = True
warn_unused_configs = True
disallow_untyped_defs = True
disallow_any_generics = True
check_untyped_defs = True
no_implicit_optional = True
warn_redundant_casts = True
warn_unused_ignores = True
warn_no_return = True

[mypy-tests.*]
ignore_errors = True

[mypy-sqlalchemy.*]
ignore_missing_imports = True

[mypy-alembic.*]
ignore_missing_imports = True
EOF

# 2. Ejecutar mypy
cd backend
mypy app/ > /tmp/mypy_report.txt 2>&1

# 3. Ver errores
head -100 /tmp/mypy_report.txt
tail -20 /tmp/mypy_report.txt  # Resumen
```

**Encontrará errores como:**
```
error: Argument 1 to "process_data" has incompatible type "Optional[str]"; expected "str"
error: Incompatible return value type (got "None", expected "User")
```

#### Tarea 6.2: Arreglar errores de type checking

**Crear:**  `/MYPY_FIXES_LOG.md`

```markdown
# Arreglando type checking errors

## Patrón 1: Optional sin checks

ANTES:
def process(data: Optional[str]):
    return data.upper()  # ❌ Error: Optional

DESPUÉS:
def process(data: Optional[str]):
    if data is None:
        raise ValueError("data cannot be None")
    return data.upper()  # ✅ OK
```

**Arreglar todos los Optional[T] sin protección:**
```bash
# 1. Encontrar patrones
grep -r "Optional\[" backend/app/ --include="*.py" | grep -v "if.*is None\|or\|assert" > /tmp/optional_issues.txt

# 2. Para cada uno, agregar validación
# 3. Ejecutar mypy de nuevo
mypy backend/app/ | grep "Optional"
# Debe disminuir el número de errores
```

**Tiempo:** 4 horas
**Prioridad:** 🟠 ALTA

---

#### Tarea 6.3: CI/CD pipeline para mypy

**Crear:** `.github/workflows/mypy.yml`

```yaml
name: Type Checking

on: [push, pull_request]

jobs:
  mypy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: pip install -r backend/requirements.txt
      - run: cd backend && mypy app/ --strict
```

**Tiempo:** 1 hora
**Prioridad:** 🟡 MEDIA

---

### Martes-Miércoles: Frontend unit tests

#### Tarea 6.4: Crear vitest.config.ts

**Crear:** `frontend/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.stories.tsx',
      ],
      lines: 70,  // Target: 70% coverage
      functions: 70,
      branches: 65,
      statements: 70,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

**Crear:** `frontend/tests/setup.ts`

```typescript
import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})
```

**Tiempo:** 1 hora
**Prioridad:** 🔴 CRÍTICA

---

#### Tarea 6.5: Escribir 10 test files

**Crear:** `frontend/tests/components/...`

```typescript
// tests/components/header.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Header from '@/components/header'

describe('Header Component', () => {
  it('renders navigation links', () => {
    render(<Header />)
    expect(screen.getByText('Candidates')).toBeInTheDocument()
    expect(screen.getByText('Employees')).toBeInTheDocument()
  })

  it('shows user profile button when authenticated', () => {
    render(<Header />)
    expect(screen.getByRole('button', { name: /profile/i })).toBeInTheDocument()
  })
})
```

**Crear tests mínimos para:**
1. Header component
2. Login form
3. Dashboard layout
4. API client (lib/api.ts)
5. Authentication hooks
6. Form validation
7. Table component
8. Modal component
9. Theme provider
10. Router setup

**Tiempo:** 12 horas
**Prioridad:** 🔴 CRÍTICA

---

#### Tarea 6.6: Ejecutar y validar cobertura

```bash
npm test -- --coverage

# Resultado esperado:
# ✓ File            | % Stmts | % Branch | % Funcs | % Lines | Uncovered Lines
# ✓ All files       |    73.2 |     68.5 |    75.8 |    73.2 |
```

**Tiempo:** 2 horas
**Prioridad:** 🟠 ALTA

---

### Jueves: Backend pytest improvements

#### Tarea 6.7: Aumentar cobertura pytest

```bash
cd backend

# Ver cobertura actual
pytest tests/ --cov=app --cov-report=term-missing | grep "TOTAL"

# Escribir tests para archivos con baja cobertura
# Crear: tests/test_housing.py
# Crear: tests/test_apartments_v2.py
# Crear: tests/test_ai_agents.py

# Ejecutar nuevamente
pytest tests/ --cov=app --cov-report=html
# Abirir: htmlcov/index.html
```

**Target:** >70% coverage

**Tiempo:** 4 horas
**Prioridad:** 🟡 MEDIA

---

#### Tarea 6.8: CI/CD pipeline para tests

**Crear:** `.github/workflows/test.yml`

```yaml
name: Testing

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_DB: uns_claudejp_test
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: |
          pip install -r backend/requirements.txt
          cd backend && pytest tests/ -v --cov=app

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: |
          npm ci
          npm run typecheck
          npm run lint
          npm test -- --coverage

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: |
          npm ci
          npm run test:e2e
```

**Tiempo:** 2 horas
**Prioridad:** 🟡 MEDIA

---

### Viernes: Linting y validación

#### Tarea 6.9: ESLint + Prettier (Frontend)

```bash
cd frontend

# Ejecutar linting
npm run lint

# Arreglar
npm run lint:fix

# Formatting
npm run format

# Type checking
npm run typecheck
```

**Crear:** `.github/workflows/lint.yml`

```yaml
name: Linting

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci && npm run lint && npm run typecheck
```

**Tiempo:** 2 horas
**Prioridad:** 🟡 MEDIA

---

#### Tarea 6.10: Commit SEMANA 6

```bash
git add -A
git commit -m "SEMANA 6: Agregar testing y type checking

Backend:
- Configurar mypy strict mode
- Arreglar 100+ type errors
- Coverage pytest > 70%
- CI/CD pipeline mypy

Frontend:
- Crear vitest.config.ts
- Escribir 10 test files
- Unit tests para componentes críticos
- Coverage > 70%
- CI/CD pipeline tests

Quality:
- ESLint + Prettier configurados
- TypeScript strict mode
- CI/CD automático en cada push
- Coverage reports (HTML)

Validado: ✅ 70% coverage, ✅ CI/CD working, ✅ No type errors
"

git push -u origin claude/project-audit-cleanup-01BnhrSyZcJhG4EA3hg4tCyM
```

---

**📊 SEMANA 6 RESUMEN:**
- ⏱️ Estimado: 32 horas
- ✅ mypy + type checking en backend
- ✅ 10 test files frontend (70% coverage)
- ✅ pytest backend (70% coverage)
- ✅ CI/CD pipeline automatizado
- 🎯 Siguiente: SEMANA 7 - Performance

---

## <a name="semana-7"></a>⚡ SEMANA 7: PERFORMANCE (Optimization & Security)

**Objetivo:** Optimizar y asegurar sistema
**Estimado:** 24 horas
**Riesgo:** BAJO

### Lunes: Security audit

#### Tarea 7.1: Revisar secrets y credenciales

```bash
# 1. Buscar secrets en el código
cd /home/user/UNS-ClaudeJP-6.0.0
grep -r "password\|secret\|api_key\|token" . \
  --include="*.py" --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.git | \
  grep -v "^Binary" | \
  head -50

# 2. Verificar .env.example no tiene valores reales
cat backend/.env.example | grep -E "=\w+@\w+\.\w+|=\d{20,}|=sk_live_|=pk_live_"
# Debe estar vacío

# 3. Verificar .env no está en git
git status | grep ".env"
# Debe estar en .gitignore
```

**Crear:** `docs/security/secrets.md`

```markdown
# Manejo de Secrets y Credenciales

## Valores Sensibles

NUNCA commitear:
- .env (credenciales reales)
- API keys (Azure, Gemini, etc.)
- JWT secrets
- Database passwords
- Tokens

## Variables de Entorno

Usar .env.example como template:
1. Copiar: `cp .env.example .env`
2. Completar con valores reales
3. NUNCA commitear .env
4. git status debe ignorarlo

## Rotación de Secrets

Cada 30 días:
- [ ] Cambiar SECRET_KEY en backend
- [ ] Rotar API keys
- [ ] Cambiar admin password

## En Producción

- Usar CI/CD secrets
- Variables de entorno en host
- Never log sensitive data
- Use secrets vault (Vault, AWS Secrets Manager)
```

**Tiempo:** 2 horas
**Prioridad:** 🔴 CRÍTICA

---

#### Tarea 7.2: CORS y Network Security

**Revisar:** `backend/app/core/config.py`

```python
# Verificar CORS origins
BACKEND_CORS_ORIGINS = [
    "http://localhost:3000",  # Dev OK
    "http://127.0.0.1:3000",  # Dev OK
    # En producción: agregar dominio real
    # "https://app.mycompany.com"
]

# En producción, NO incluir localhost
```

**Crear:** `docs/security/cors.md`

```markdown
# CORS Configuration

## Desarrollo

Se permite localhost:3000

## Producción

Cambiar a dominio real:
```python
BACKEND_CORS_ORIGINS = [
    "https://app.mycompany.com",
]
```

NO permitir:
- http:// en producción
- localhost
- Dominios wildcard (*)
```

**Tiempo:** 1 hora
**Prioridad:** 🟡 MEDIA

---

### Martes: Performance optimization

#### Tarea 7.3: Análisis de queries lentas

```bash
# 1. Habilitar query logging
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp << 'EOF'
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_duration = 'on';
SELECT pg_reload_conf();
EOF

# 2. Ejecutar operaciones
curl http://localhost:8000/api/candidates
curl http://localhost:8000/api/employees
# ... más calls

# 3. Ver queries lentas
docker exec uns-claudejp-db tail -100 /var/log/postgresql/postgresql.log | grep "duration"

# 4. Identificar N+1 problems
# Ejemplo: 1 query para lista + 1 por item = N+1
```

**Crear índices faltantes:**

```sql
-- Conectar a BD
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_employees_factory_id ON employees(factory_id);
CREATE INDEX IF NOT EXISTS idx_timer_cards_employee_id ON timer_cards(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_employee_id ON payroll(employee_id);

-- Verificar
SELECT indexname FROM pg_indexes WHERE tablename = 'candidates';
```

**Tiempo:** 3 horas
**Prioridad:** 🟡 MEDIA

---

#### Tarea 7.4: Frontend bundle analysis

```bash
cd frontend

# Instalar webpack-bundle-analyzer
npm install --save-dev webpack-bundle-analyzer

# Analizar bundle
npm run build
npx webpack-bundle-analyzer .next/static/chunks

# Identificar dependencias grandes
# Eliminar si no se usan
```

**Crear:** `docs/guides/performance.md`

```markdown
# Performance Tuning

## Backend

- Usar query select específico (no *)
- Implementar pagination (limit 100)
- Agregar caching en endpoints frecuentes
- Connection pooling en BD

## Frontend

- Lazy load componentes
- Tree-shake dependencias no usadas
- Compress images
- Minify CSS/JS (Next.js lo hace auto)

## Cache

- Redis para sesiones
- CDN para assets estáticos
- Browser cache para imágenes
```

**Tiempo:** 2 horas
**Prioridad:** 🟡 MEDIA

---

### Miércoles-Jueves: Monitoring

#### Tarea 7.5: Agregar observabilidad

**Ya existe:** OpenTelemetry + Prometheus + Grafana

```bash
# Verificar servicios
docker compose ps | grep -E "prometheus|grafana|tempo|otel"

# Acceder a Grafana
curl http://localhost:3001  # Admin/admin

# Ver dashboards pre-configured
# - Backend metrics
# - Request latency
# - Error rates
```

**Crear:** `docs/guides/monitoring.md`

```markdown
# Monitoring & Observability

## Prometheus

Acceder a: http://localhost:9090

Queries útiles:
- `rate(http_requests_total[5m])` - Request rate
- `histogram_quantile(0.99, http_request_duration)` - P99 latency
- `increase(errors_total[1h])` - Error count

## Grafana

Acceder a: http://localhost:3001

Pre-configured dashboards:
- Backend Metrics
- Request Latency
- Error Tracking

## Alerting

Configurar alertas para:
- Error rate > 1%
- P99 latency > 1s
- Database connection errors
```

**Tiempo:** 2 horas
**Prioridad:** 🟡 MEDIA

---

#### Tarea 7.6: Health checks y readiness probes

**Verificar:** `backend/app/api/monitoring.py`

```python
@router.get("/health", tags=["monitoring"])
async def health_check():
    """Health check para load balancer"""
    return {
        "status": "healthy",
        "version": APP_VERSION,
        "timestamp": datetime.now()
    }

@router.get("/ready", tags=["monitoring"])
async def readiness_check():
    """Readiness check (puede servir requests?)"""
    # Verificar conexión a BD
    # Verificar Redis
    # Verificar dependencias
    return {"ready": True}
```

**Tiempo:** 1 hora
**Prioridad:** 🟡 MEDIA

---

### Viernes: Documentación y commit

#### Tarea 7.7: Crear runbooks

**Crear:** `docs/guides/runbooks.md`

```markdown
# Runbooks (Guías de Operación)

## Incident Response

### High Error Rate (>5%)

1. Revisar logs: `docker compose logs backend | grep ERROR`
2. Verificar BD: `docker compose logs db`
3. Revisar Prometheus: http://localhost:9090
4. Si es DB: Aumentar conexiones, reiniciar
5. Si es código: Rollback a versión anterior

### High Latency (>2s)

1. Analizar queries: Logs de PostgreSQL
2. Revisar índices: `SELECT * FROM pg_stat_user_tables`
3. Aumentar cache
4. Verificar recursos: CPU, RAM

## Maintenance Windows

Cada mes:
- [ ] Backup BD completo
- [ ] Analizar VACUUM
- [ ] Rotar logs
- [ ] Update dependencies
```

**Tiempo:** 2 horas
**Prioridad:** 🟡 MEDIA

---

#### Tarea 7.8: Commit SEMANA 7

```bash
git add -A
git commit -m "SEMANA 7: Security & Performance

Security:
- Auditoría de secrets y credenciales
- CORS configuration documentado
- .env nunca en git
- JWT rotation guide

Performance:
- Queries optimizadas (índices creados)
- Bundle size análisis
- Caching implementado
- Health checks configurados

Monitoring:
- OpenTelemetry working
- Prometheus + Grafana conectados
- Alertas configuradas
- Runbooks de operación

Documentación:
- security/secrets.md
- security/cors.md
- guides/performance.md
- guides/monitoring.md
- guides/runbooks.md

Validado: ✅ Security audit passed, ✅ Performance OK, ✅ Monitoring working
"

git push -u origin claude/project-audit-cleanup-01BnhrSyZcJhG4EA3hg4tCyM
```

---

**📊 SEMANA 7 RESUMEN:**
- ⏱️ Estimado: 24 horas
- ✅ Security audit completado
- ✅ Performance optimizado
- ✅ Monitoring configurado
- ✅ Runbooks de operación
- 🎯 Siguiente: SEMANA 8 - QA Final

---

## <a name="semana-8"></a>🎯 SEMANA 8: QA FINAL y RELEASE v6.0.0

**Objetivo:** Validar 100%, listo para producción
**Estimado:** 20 horas
**Riesgo:** BAJO

### Lunes-Martes: Testing integral

#### Tarea 8.1: Correr suite COMPLETA de tests

```bash
# 1. Backend tests
cd backend
pytest tests/ -v --tb=short --cov=app --cov-report=html

# 2. Frontend tests
cd frontend
npm test -- --coverage

# 3. E2E tests
npm run test:e2e

# 4. Type checking
npm run typecheck
mypy app/ --strict

# 5. Linting
npm run lint
cd ../backend && pylint app/ --disable=all --enable=E,F
```

**Resultado esperado:**
```
✅ Backend tests: PASSED (48/48)
✅ Frontend tests: PASSED (10/10)
✅ E2E tests: PASSED (16/16)
✅ Type checking: 0 errors
✅ Coverage: >70%
```

**Tiempo:** 4 horas
**Prioridad:** 🔴 CRÍTICA

---

#### Tarea 8.2: Manual testing de flujos críticos

**Crear:** `TESTING_CHECKLIST.md`

```markdown
# Manual Testing Checklist

## Login y Autenticación
- [ ] Admin login (admin/admin123)
- [ ] JWT token generado
- [ ] Token refresh funciona
- [ ] Logout limpia sesión
- [ ] 401 sin token
- [ ] 403 sin permisos

## Candidatos (Rirekisho)
- [ ] Crear candidato
- [ ] Subir foto/CV
- [ ] OCR procesa imagen
- [ ] Editar candidato
- [ ] Listar con filtros
- [ ] Exportar a Excel
- [ ] Eliminar (soft delete)

## Empleados
- [ ] Crear empleado
- [ ] Asignar a factory
- [ ] Editar datos
- [ ] Listar con filtros
- [ ] Desactivar empleado

## Nómina
- [ ] Crear período
- [ ] Calcular nómina
- [ ] Generar recibo
- [ ] Exportar PDF
- [ ] Historial de pagos

## Timer Cards
- [ ] Registrar entrada/salida
- [ ] Calcular horas
- [ ] Reportar por empleado
- [ ] Reportar por mes

## Vivienda
- [ ] Listar apartamentos
- [ ] Asignar empleado
- [ ] Calcular alquiler
- [ ] Reportar deudas

## Requests (Solicitudes)
- [ ] Crear request
- [ ] Workflow de aprobación
- [ ] Notificaciones

## Admin
- [ ] Crear usuario
- [ ] Cambiar rol
- [ ] Ver audit log
- [ ] Exportar datos
```

Ejecutar cada uno:
```bash
# 1. Acceder a http://localhost:3000
# 2. Seguir checklist
# 3. Documentar cualquier issue
```

**Tiempo:** 6 horas
**Prioridad:** 🔴 CRÍTICA

---

#### Tarea 8.3: Instalación limpia en ambiente nuevo

```bash
# 1. Crear VM nueva O limpiar Docker
docker compose down -v
rm .env
rm -rf postgres_data/

# 2. Clone repo fresh
cd /tmp
git clone https://github.com/jokken79/UNS-ClaudeJP-6.0.0.git
cd UNS-ClaudeJP-6.0.0

# 3. Seguir INSTALACION_RAPIDA.md
python scripts/setup/generate_env.py
docker compose up -d
sleep 30

# 4. Validar
curl http://localhost:8000/api/health
curl http://localhost:3000

# 5. Login
# Usuario: admin
# Contraseña: admin123

# 6. Verificar flujos
# - Crear candidato
# - Crear empleado
# - Ver nómina
```

**Tiempo:** 2 horas
**Prioridad:** 🔴 CRÍTICA

---

### Miércoles: Release preparation

#### Tarea 8.4: Actualizar versión en TODA documentación

```bash
# 1. Buscar referencias a v5.6.0 o v6.0.0-rc
grep -r "5\.6\|6\.0\.0-\|beta\|alpha\|rc" . \
  --include="*.md" --include="*.py" --include="*.json" \
  --exclude-dir=.git --exclude-dir=node_modules

# 2. Actualizar a v6.0.0 final
# En README.md, CLAUDE.md, package.json, pyproject.toml

# 3. Verificar badges
grep "6\.0\.0" README.md
```

**Tiempo:** 1 hora
**Prioridad:** 🟡 MEDIA

---

#### Tarea 8.5: Crear RELEASE_NOTES_V6.0.0.md

```markdown
# Release Notes v6.0.0

## 🎉 Hitos Alcanzados

### 🔧 Instalación
- ✅ Sistema instala desde cero sin errores
- ✅ Docker Compose completamente funcional
- ✅ Migraciones aplicadas correctamente
- ✅ Data seed automático

### 🧹 Limpieza de Código
- ✅ De 305 → 210 archivos Python (-31%)
- ✅ De 98,854 → 70,000 líneas (-29%)
- ✅ 96 scripts consolidados → 12 esenciales
- ✅ 38 servicios consolidados → 20
- ✅ 7 directorios orphaned eliminados

### 📚 Documentación
- ✅ 606 archivos .md organizados
- ✅ Raíz limpia (5 archivos)
- ✅ docs/ bien estructurado
- ✅ Guías de desarrollo, testing, deployment

### 🧪 Testing
- ✅ Backend: >70% coverage (pytest)
- ✅ Frontend: >70% coverage (vitest)
- ✅ E2E: 16 tests (Playwright)
- ✅ Type checking: 0 mypy errors
- ✅ CI/CD automatizado

### ⚡ Performance
- ✅ Queries optimizadas
- ✅ Índices de BD creados
- ✅ Bundle size optimizado
- ✅ Caching implementado
- ✅ Monitoring (Prometheus + Grafana)

### 🔐 Security
- ✅ Secrets audit completado
- ✅ CORS configurado correctamente
- ✅ JWT rotation documentado
- ✅ Health checks implementados

## 🚀 Cómo Actualizar

### Desde v5.6.0

```bash
git pull origin main
python scripts/setup/generate_env.py
docker compose down -v
docker compose up -d
docker compose exec backend bash -c "cd /app && alembic upgrade head"
```

## 📋 Conocido Issues

- None (v6.0.0 es stable)

## 📖 Documentación

- [Instalación Rápida](INSTALACION_RAPIDA.md)
- [Guía de Desarrollo](docs/guides/desarrollo.md)
- [Troubleshooting](docs/troubleshooting/common-errors.md)

## 🙏 Gracias

v6.0.0 incluye 8 semanas de refactoring y cleanup. El sistema ahora es:
- 30% más mantenible (menos código muerto)
- 70%+ testeado (coverage)
- 100% type-safe (mypy strict)
- Listo para producción
```

**Tiempo:** 1 hora
**Prioridad:** 🟡 MEDIA

---

#### Tarea 8.6: Crear DEPLOYMENT_CHECKLIST.md

```markdown
# Deployment Checklist v6.0.0

## Pre-deployment (24h antes)

- [ ] Backup completo de BD
- [ ] Revisar logs (últimas 24h)
- [ ] Verificar alertas en Prometheus
- [ ] Revisar PRs pendientes

## Validación Final

- [ ] Todos tests PASSING
- [ ] Coverage > 70%
- [ ] Instalación limpia funciona
- [ ] Manual testing completado
- [ ] Security audit passed
- [ ] Performance benchmarks OK

## Deployment

1. [ ] Tag git: `git tag v6.0.0`
2. [ ] Push tag: `git push origin v6.0.0`
3. [ ] Crear release en GitHub
4. [ ] Generar changelog automático
5. [ ] Notificar stakeholders

## Post-deployment (1h después)

- [ ] Verificar sistema en vivo
- [ ] Monitorear logs/errors
- [ ] Check Prometheus metrics
- [ ] Verificar que usuarios pueden loguear
- [ ] Prueba flujo crítico (crear candidato)
- [ ] Verificar notificaciones funcionan

## Rollback Plan

Si algo falla:
```bash
git revert v6.0.0
docker compose down
git checkout v5.6.0
docker compose up -d
docker compose exec backend bash -c "cd /app && alembic downgrade -1"
```

## Handoff

- [ ] Documentar cualquier issue encontrado
- [ ] Crear tickets para problemas menores
- [ ] Training a team
```

**Tiempo:** 1 hora
**Prioridad:** 🟡 MEDIA

---

### Jueves-Viernes: Final QA y commit

#### Tarea 8.7: Última validación (Final audit)

```bash
# 1. Verificar que TODO está en repo
git status
# Debe mostrar "working tree clean"

# 2. Último test run
cd backend && pytest tests/ -v
cd ../frontend && npm test -- --coverage

# 3. Último E2E
npm run test:e2e

# 4. Build
npm run build  # Frontend
# Backend ya está en Docker

# 5. Verificar archivos importantes existen
[ -f README.md ] && echo "✅ README.md"
[ -f CLAUDE.md ] && echo "✅ CLAUDE.md"
[ -f CHANGELOG_V6.0.0.md ] && echo "✅ CHANGELOG"
[ -f INSTALACION_RAPIDA.md ] && echo "✅ INSTALACION"
[ -f docs/README.md ] && echo "✅ docs/README.md"
[ -f backend/requirements.txt ] && echo "✅ requirements.txt"
[ -f frontend/package.json ] && echo "✅ package.json"
```

**Tiempo:** 2 horas
**Prioridad:** 🔴 CRÍTICA

---

#### Tarea 8.8: Commit final y tag de release

```bash
git add -A
git commit -m "SEMANA 8: QA Final y Release v6.0.0

Validación:
- ✅ Suite completa de tests PASSING
- ✅ 70%+ coverage (backend + frontend)
- ✅ Manual testing de todos flujos
- ✅ Instalación limpia funciona 100%
- ✅ Security audit completado
- ✅ Performance benchmarks OK
- ✅ Type checking: 0 errors

Documentación:
- Release notes completos
- Deployment checklist
- Runbooks de operación
- Guides de desarrollo

Sistema LISTO PARA PRODUCCIÓN.

Resultado de 8 semanas:
- 31% reducción de código (de 305 → 210 archivos)
- 29% reducción de líneas (98,854 → 70,000)
- 70%+ test coverage
- 0 type errors (mypy strict)
- Documentación organizada y clara
- CI/CD automatizado
- Security & Performance audited

v6.0.0 es STABLE y PRODUCTION-READY ✅
"

git tag -a v6.0.0 -m "Release v6.0.0 - Production Ready

8 weeks of refactoring, testing, and cleanup.
System is now maintainable, scalable, and well-documented."

git push -u origin claude/project-audit-cleanup-01BnhrSyZcJhG4EA3hg4tCyM
git push origin v6.0.0
```

**Tiempo:** 15 min
**Prioridad:** 🔴 CRÍTICA

---

#### Tarea 8.9: Crear PR final para merge a main

```bash
# En GitHub, crear PR:
# Title: "Release v6.0.0 - Production Ready"
# Description: Copiar release notes
# Base: main
# Compare: claude/project-audit-cleanup-01BnhrSyZcJhG4EA3hg4tCyM

# Pasos en GitHub:
# 1. Create Pull Request
# 2. Esperar checks pasen (CI/CD)
# 3. Review final
# 4. Merge
# 5. Crear Release desde tag v6.0.0
```

**Tiempo:** 30 min
**Prioridad:** 🟡 MEDIA

---

**📊 SEMANA 8 RESUMEN:**
- ⏱️ Estimado: 20 horas
- ✅ Suite completa tests PASSING
- ✅ 70%+ coverage
- ✅ Instalación limpia validada
- ✅ Manual testing completado
- ✅ Release notes y deployment checklist
- ✅ Tag v6.0.0 creado
- 🎉 LISTO PARA PRODUCCIÓN

---

## <a name="checkpoints"></a>✅ CHECKPOINTS DE VALIDACIÓN

### Checkpoint SEMANA 1
```
[ ] docker compose up -d → sin errores
[ ] curl http://localhost:8000/api/health → 200 OK
[ ] Login funciona
[ ] README.md v6.0.0
[ ] CHANGELOG_V6.0.0.md existe
[ ] INSTALACION_RAPIDA.md existe
```

### Checkpoint SEMANA 2
```
[ ] alembic upgrade head → success
[ ] Schema BD matches models.py
[ ] pytest tests/ → PASS
[ ] API funciona
[ ] Datos persistieron
```

### Checkpoint SEMANA 3-4
```
[ ] De 305 → 210 archivos Python
[ ] De 96 → 12 scripts
[ ] De 38 → 20 servicios
[ ] pytest tests/ → PASS
[ ] API funciona normalmente
```

### Checkpoint SEMANA 5
```
[ ] Raíz: 239 → 5 archivos .md
[ ] docs/ reorganizado
[ ] docs/README.md existe
[ ] Links verificados
[ ] 0 archivos duplicados
```

### Checkpoint SEMANA 6
```
[ ] mypy: 0 type errors
[ ] pytest: >70% coverage
[ ] npm test: >70% coverage
[ ] CI/CD pipelines activos
[ ] ESLint / Prettier configurados
```

### Checkpoint SEMANA 7
```
[ ] Security audit completado
[ ] Performance optimizado
[ ] Índices de BD creados
[ ] Monitoring funcionando
[ ] Runbooks documentados
```

### Checkpoint SEMANA 8
```
[ ] Todos tests PASSING
[ ] Instalación limpia funciona 100%
[ ] Manual testing completado
[ ] Release notes completos
[ ] Tag v6.0.0 creado
[ ] PR listofor merge
```

---

## 📊 RESUMEN FINAL: TRANSFORMACIÓN v6.0.0

```
MÉTRICA                    ANTES      DESPUÉS    MEJORA
─────────────────────────────────────────────────────────
Archivos Python            305        210        -31%
Líneas de código           98,854     70,000     -29%
Scripts                    96         12         -87%
Servicios                  38         20         -47%
Archivos .md              606         ~100       -83%
Test coverage             ~40%       >70%       +75%
Type errors               100+        0          100%
Documentación (calidad)    4/10       9/10       +125%
Mantenibilidad            5/10       8/10       +60%

ESTADO FINAL:              6.5/10     9.0/10     ✅ PRODUCCIÓN READY
```

---

## 🎯 CONCLUSIÓN

**¡Enhorabuena!** Has completado 8 semanas de transformación exhaustiva.

El sistema UNS-ClaudeJP v6.0.0 ahora es:
- ✅ **Mantenible** - 30% menos código, arquitectura clara
- ✅ **Confiable** - 70%+ tested, 0 type errors
- ✅ **Documentado** - Guías claras, ejemplos
- ✅ **Seguro** - Audit completado, secrets management
- ✅ **Performante** - Queries optimizadas, caching, índices
- ✅ **Listo para producción** - Deployment checklist, monitoring

### Próximos pasos:
1. **Deploy a producción**
2. **Monitorear por 1 semana**
3. **Documentar issues encontrados**
4. **Planificar v6.1.0** (mejoras menores)

**Estás listo. ¡A producción! 🚀**

