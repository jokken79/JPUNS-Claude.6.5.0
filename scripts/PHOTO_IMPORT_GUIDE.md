# Guía: Importar Fotos desde Access a PostgreSQL

## Resumen

Las fotos en el Access están guardadas como **Attachment Fields** (campos especiales de Access que almacenan archivos adentro de la base de datos).

Para importar las fotos, necesitas **2 pasos**:

1. **Extracción**: Usar `pywin32` para extraer las fotos de Access → genera JSON
2. **Importación**: Leer JSON e importar a PostgreSQL

---

## Paso 1: Instalar Requisitos

**En Windows (donde está el Access):**

```bash
pip install pywin32
```

Si tienes error "Access not found", asegúrate que Microsoft Access (o Access Database Engine) está instalado.

---

## Paso 2: Ejecutar Extracción de Fotos

**Opción 1: Usar el batch script (RECOMENDADO)**

```bash
# Doble-clic en:
scripts\EXTRACT_PHOTOS_FROM_ACCESS.bat
```

Elige opción:
- **1** = Test con primeras 5 fotos (recomendado primero)
- **2** = Extraer TODAS las fotos
- **3** = Extraer primeras 100

**Opción 2: Línea de comandos manual**

```bash
cd backend\scripts

# Test con 5 fotos
python extract_access_attachments.py --sample

# Todas las fotos
python extract_access_attachments.py --full

# Primeras 100
python extract_access_attachments.py --limit 100
```

**Resultado:**

Se genera un archivo: `access_photo_mappings.json`

```json
{
  "timestamp": "2025-10-26T14:30:00",
  "access_database": "D:\\ユニバーサル企画㈱データベースv25.3.24.accdb",
  "table": "T_履歴書",
  "photo_field": "写真",
  "statistics": {
    "total_records": 1148,
    "processed": 1148,
    "with_attachments": 1131,
    "without_attachments": 17,
    "extraction_successful": 1131,
    "extraction_failed": 0,
    "errors": 0
  },
  "mappings": {
    "RR001": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "RR002": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    ...
  }
}
```

---

## Paso 3: Importar Fotos a PostgreSQL

**Dentro del contenedor Docker (backend):**

```bash
# Acceder al contenedor
docker exec -it uns-claudejp-backend bash

# Importar fotos
python scripts/import_photos_from_json.py --photos /app/access_photo_mappings.json
```

**O en Windows (si está en host):**

```bash
cd backend\scripts

python import_photos_from_json.py --photos access_photo_mappings.json
```

**Resultado esperado:**

```
Total photos to import:    1131
Successfully updated:      1131
Candidates not found:      0
Errors:                    0
Success rate:              100%
```

---

## Estructura Técnica

```
T_履歴書 (Access)
  ├─ 履歴書ID: RR001, RR002, ...
  └─ 写真: [Attachment Field - fotos binarias]
              ↓
       extract_access_attachments.py (pywin32 COM)
              ↓
       access_photo_mappings.json
       {
         "RR001": "data:image/jpeg;base64,..."
         "RR002": "data:image/jpeg;base64,..."
       }
              ↓
       import_photos_from_json.py (SQLAlchemy)
              ↓
       PostgreSQL candidates table
       photo_data_url = "data:image/jpeg;base64,..."
```

---

## Posibles Errores

### Error: "pywin32 not installed"

**Solución:**
```bash
pip install pywin32
```

### Error: "Access database not found"

**Solución:** Verificar que la ruta es correcta en `extract_access_attachments.py`:
```python
ACCESS_DB_PATH = r"D:\ユニバーサル企画㈱データベースv25.3.24.accdb"
```

### Error: "COM Error" al abrir Access

**Soluciones:**
1. Cerrar Access si está abierto
2. Verificar que Microsoft Access está instalado
3. Verificar permisos del archivo .accdb
4. Reintentar

### Fotos no aparecen después de importar

**Checklist:**
1. ¿Se ejecutó correctamente la extracción? (revisar `extract_attachments_*.log`)
2. ¿Se generó `access_photo_mappings.json`? (verificar existe el archivo)
3. ¿Se ejecutó la importación? (revisar `import_photos_*.log`)
4. ¿Coinciden los `rirekisho_id`? (en Access vs PostgreSQL)

---

## Arquivos

| Archivo | Propósito |
|---------|-----------|
| `backend/scripts/extract_access_attachments.py` | Extrae fotos de Access → JSON |
| `backend/scripts/import_photos_from_json.py` | Importa JSON → PostgreSQL |
| `scripts/EXTRACT_PHOTOS_FROM_ACCESS.bat` | Batch script fácil para extraer |
| `access_photo_mappings.json` | Archivo generado con foto mappings |
| `extract_attachments_*.log` | Log de extracción |
| `import_photos_*.log` | Log de importación |

---

## Próximos Pasos

Una vez importadas las fotos:

1. **Verificar en PostgreSQL:**
   ```sql
   SELECT rirekisho_id,
          CASE WHEN photo_data_url IS NOT NULL THEN 'HAS_PHOTO' ELSE 'NO_PHOTO' END
   FROM candidates
   LIMIT 20;
   ```

2. **Verificar en el frontend:**
   - Ir a Candidatos
   - Ver que las fotos aparecen en los detalles del candidato

3. **Limpiar archivos:**
   - Eliminar `access_photo_mappings.json` (opcional)
   - Eliminar logs antiguos si necesitas espacio

---

## Preguntas Frecuentes

**P: ¿Puedo extraer solo un subconjunto de fotos?**
R: Sí, usa `--limit 100` para los primeros 100, `--limit 500` para 500, etc.

**P: ¿Qué pasa si una foto es demasiado grande?**
R: Se importa como base64 en PostgreSQL. El campo `photo_data_url` es TEXT, así que soporta fotos grandes.

**P: ¿Puedo re-ejecutar la importación sin perder datos?**
R: Sí, el script solo actualiza candidatos que tienen `photo_data_url IS NULL`. Fotos existentes no se sobrescriben.

**P: ¿Cuánto tarda la extracción?**
R: Aproximadamente 1-2 segundos por foto (overhead de COM). Para 1131 fotos: ~20-30 minutos.

---

**Guía actualizada**: 2025-10-26
