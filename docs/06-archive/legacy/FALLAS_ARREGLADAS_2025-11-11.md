# Fallas Arregladas - 11 de Noviembre 2025

## Contexto
Durante la ejecución de `reinstalar.bat`, el sistema falló al intentar iniciar los contenedores Docker. Este documento registra los problemas encontrados y sus soluciones.

---

## ❌ Problema 1: Migraciones Alembic Duplicadas

### Descripción del Error
```
service "importer" didn't complete successfully: exit 1

sqlalchemy.exc.ProgrammingError: (psycopg2.errors.DuplicateColumn) 
column "name" of relation "apartments" already exists
[SQL: ALTER TABLE apartments ADD COLUMN name VARCHAR(200)]
```

### Causa Raíz
Las migraciones `5e6575b9bf1b_add_apartment_system_v2_assignments_charges_deductions.py` y `68534af764e0_add_additional_charges_and_rent_deductions_tables.py` intentaban agregar columnas que ya existían.

La migración base `001_create_all_tables.py` utiliza `Base.metadata.create_all()`, lo que crea **todas las tablas con todas sus columnas actuales** desde los modelos de SQLAlchemy. Por lo tanto, cualquier migración posterior que intente agregar esas mismas columnas causará un error de duplicación.

### Archivos Afectados
- `backend/alembic/versions/5e6575b9bf1b_add_apartment_system_v2_assignments_charges_deductions.py`
- `backend/alembic/versions/68534af764e0_add_additional_charges_and_rent_deductions_tables.py`

### Solución Aplicada
**Eliminación de migraciones redundantes:**
```bash
rm backend/alembic/versions/5e6575b9bf1b_add_apartment_system_v2_assignments_charges_deductions.py
rm backend/alembic/versions/68534af764e0_add_additional_charges_and_rent_deductions_tables.py
```

### Migraciones Actuales
Después de la corrección, solo queda la migración base:
- `001_create_all_tables.py` - Crea todas las tablas desde los modelos

---

## ❌ Problema 2: Importación Faltante en yukyu.py

### Descripción del Error
```
NameError: name 'get_current_user' is not defined
  File "/app/app/api/yukyu.py", line 268, in <module>
    current_user: dict = Depends(get_current_user)
```

### Causa Raíz
El archivo `backend/app/api/yukyu.py` utilizaba la función `get_current_user` como dependencia en el endpoint `/maintenance/scheduler-status` (línea 268), pero no había sido importada.

### Archivo Afectado
- `backend/app/api/yukyu.py`

### Solución Aplicada
**Agregada la importación faltante:**
```python
from app.api.deps import get_current_user
```

### Cambio Completo
```diff
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

+ from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.models import User, UserRole
```

---

## ✅ Proceso de Corrección Completo

### 1. Diagnóstico
```bash
docker logs uns-claudejp-importer  # Identificó error de migración
docker logs uns-claudejp-backend   # Identificó error de importación
```

### 2. Limpieza de Base de Datos
```bash
docker stop uns-claudejp-db uns-claudejp-redis uns-claudejp-backend uns-claudejp-importer
docker rm uns-claudejp-db uns-claudejp-redis uns-claudejp-backend uns-claudejp-importer
docker volume rm uns-claudejp-541_postgres_data uns-claudejp-541_redis_data
```

### 3. Corrección de Código
- Eliminación de migraciones duplicadas
- Agregada importación faltante en `yukyu.py`

### 4. Reinicio de Servicios
```bash
cd d:/UNS-ClaudeJP-5.4.1
docker compose --profile dev up -d --build
docker compose --profile dev restart backend
docker start uns-claudejp-frontend
```

---

## 🎉 Resultado Final - Todos los Servicios Operativos

### Servicios Principales
| Servicio | Estado | Puerto | URL |
|----------|--------|--------|-----|
| Frontend (Next.js) | ✅ Healthy | 3000 | http://localhost:3000 |
| Backend (FastAPI) | ✅ Healthy | 8000 | http://localhost:8000 |
| Database (PostgreSQL) | ✅ Healthy | 5432 | localhost:5432 |
| Redis | ✅ Healthy | 6379 | localhost:6379 |

### Servicios de Monitoreo
| Servicio | Estado | Puerto | URL |
|----------|--------|--------|-----|
| Adminer | ✅ Running | 8080 | http://localhost:8080 |
| Grafana | ✅ Running | 3001 | http://localhost:3001 |
| Prometheus | ✅ Healthy | 9090 | http://localhost:9090 |
| Tempo | ✅ Healthy | 3200 | http://localhost:3200 |
| OpenTelemetry | ✅ Running | 4317-4318 | localhost:4317-4318 |

### Datos Importados Exitosamente
El servicio `importer` completó correctamente:

- ✅ **1,148 candidatos** con cobertura de campos al 100%
  - Información básica, contacto, dirección
  - Pasaporte, visa, licencia
  - 5 miembros de familia con todos los campos
  - 15 tipos de experiencias laborales
  - Habilidades de japonés con soporte de PORCENTAJES (0%-100%)
  - Información física (altura, peso, talla, cintura, zapatos)
  - Contacto de emergencia
  - Preferencias de bento
  - Información de transporte
  - Estado de vacuna COVID
  - Zapatos de seguridad

- ✅ **1,116 fotos** (97.2% de cobertura)

- ✅ **24 fábricas** importadas desde archivos JSON

---

## 📋 Lecciones Aprendidas

### Para Desarrolladores

1. **Migraciones de Alembic:**
   - Si se usa `Base.metadata.create_all()` en la migración inicial, **no** se deben crear migraciones adicionales para agregar columnas que ya están en los modelos
   - Opción A: Usar migraciones incrementales desde el principio (sin `create_all`)
   - Opción B: Actualizar solo la migración base cuando se agregan columnas a los modelos

2. **Importaciones:**
   - Siempre verificar que todas las dependencias estén importadas
   - Ejecutar linting antes de commit para detectar estos errores temprano

3. **Debugging Docker:**
   - `docker logs <container>` es esencial para diagnosticar fallos
   - Limpiar volúmenes (`-v`) cuando hay problemas de estado de base de datos
   - Usar `--build` para asegurar que los cambios de código se reflejen

### Para Operaciones

1. **Proceso de Reinstalación:**
   - Siempre revisar logs del `importer` primero
   - Si falla el importer, verificar migraciones de Alembic
   - Si falla el backend, revisar logs para errores de importación/sintaxis

2. **Verificación de Estado:**
   - Usar `docker ps` para verificar que todos los servicios estén `healthy`
   - Servicios frontend y backend deben mostrar estado `(healthy)` no solo `Up`

---

## 🔗 Referencias

### Archivos Modificados
- `backend/alembic/versions/5e6575b9bf1b_*.py` - **ELIMINADO**
- `backend/alembic/versions/68534af764e0_*.py` - **ELIMINADO**
- `backend/app/api/yukyu.py` - **Agregada importación**

### Comandos Útiles
```bash
# Ver logs de un servicio
docker logs uns-claudejp-<service>

# Verificar estado de servicios
docker ps --filter "name=uns-claudejp"

# Limpiar completamente y reiniciar
docker compose down -v
docker compose --profile dev up -d --build

# Reiniciar un servicio específico
docker compose --profile dev restart <service>
```

### Documentación Relacionada
- `docs/changelogs/CHANGELOG_REINSTALAR.md` - Proceso de reinstalación
- `AGENTS.md` - Directrices del proyecto
- `docs/database/` - Documentación de esquema y migraciones

---

**Fecha:** 11 de Noviembre 2025  
**Tiempo de Resolución:** ~15 minutos  
**Impacto:** Sistema completamente restaurado y funcional
