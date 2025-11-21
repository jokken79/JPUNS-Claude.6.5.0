# 📸 Guía: Importar Fotos de Candidatos desde Access

**Fecha**: 2025-11-10
**Estado**: Esperando extracción manual de fotos

---

## 🎯 Objetivo

Extraer las fotos de empleados desde la base de datos Microsoft Access e importarlas a PostgreSQL para que aparezcan en la aplicación web.

---

## ✅ Estado Actual

Después de ejecutar `REINSTALAR.bat`:

- ✅ Servicios Docker corriendo
- ✅ Candidatos importados (1148 registros)
- ✅ Empleados importados
- ❌ **Fotos NO importadas** (archivo `access_photo_mappings.json` no existe)

Mensaje que viste durante REINSTALAR.bat (línea 352):
```
⚠ Archivo access_photo_mappings.json no encontrado
ℹ Las fotos NO fueron extraídas, pero el sistema funciona normal
ℹ Para extraer fotos, ejecuta: scripts\BUSCAR_FOTOS_AUTO.bat
```

---

## 📋 Pasos para Importar Fotos

### Paso 1: Verificar Ubicación de Base de Datos Access

La base de datos Access con las fotos debe estar en **UNA** de estas ubicaciones:

```
✓ Opción A: UNS-ClaudeJP-5.4.1\BASEDATEJP\*.accdb
✓ Opción B: D:\BASEDATEJP\*.accdb
✓ Opción C: %USERPROFILE%\BASEDATEJP\*.accdb
```

**Nombre esperado**: `ユニバーサル企画㈱データベースv25.3.24.accdb`

**¿No tienes el archivo?** Descárgalo desde:
https://drive.google.com/drive/folders/17LucJZatnR6BFOt7DYsHWtFyltd4CoGb

---

### Paso 2: Ejecutar Script de Extracción

Desde **Windows** (NO desde Docker), abre **PowerShell o CMD** como Administrador:

```bash
# Ir a la carpeta del proyecto
cd D:\tu-ruta-al-proyecto\UNS-ClaudeJP-5.4.1

# Ejecutar script de búsqueda y extracción automática
scripts\BUSCAR_FOTOS_AUTO.bat
```

**¿Qué hace este script?**

1. **Busca** la base de datos Access en las ubicaciones predefinidas
2. **Verifica** que Python esté instalado
3. **Copia** la BD Access a `BASEDATEJP\` (si no está ahí)
4. **Ejecuta** `auto_extract_photos_from_databasejp.py` para extraer fotos
5. **Genera** el archivo `access_photo_mappings.json` con fotos en base64

**Tiempo estimado**: 15-30 minutos (para ~1,148 fotos)

---

### Paso 3: Verificar Archivo Generado

Después de la extracción, verifica que se creó el archivo:

```bash
dir access_photo_mappings.json
```

**Debe mostrar**:
```
access_photo_mappings.json    [tamaño ~50-150 MB]
```

Este archivo contiene:
```json
{
  "R-001": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "R-002": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  ...
}
```

---

### Paso 4: Importar Fotos a PostgreSQL

**Opción A: Reiniciar Servicios (Automático)**

El archivo se importará automáticamente al reiniciar:

```bash
cd scripts
STOP.bat
START.bat
```

Durante el inicio, verás:
```
✓ Archivo encontrado: access_photo_mappings.json (XX MB)
ℹ Copiando al contenedor...
ℹ Importando fotos a base de datos...
✓ Fotos importadas correctamente (XX MB procesados)
```

**Opción B: Importación Manual (Sin Reiniciar)**

Si los servicios ya están corriendo y no quieres reiniciar:

```bash
# Copiar archivo al contenedor
docker cp access_photo_mappings.json uns-claudejp-backend:/app/

# Importar fotos manualmente
docker exec uns-claudejp-backend python scripts/import_photos_from_json.py
```

---

### Paso 5: Verificar Importación

**Verificar con script unificado:**

```bash
docker exec uns-claudejp-backend python scripts/unified_photo_import.py verify
```

**Verificar con SQL:**

```bash
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT COUNT(*) AS total_candidatos, COUNT(photo_data_url) AS con_fotos, COUNT(*) - COUNT(photo_data_url) AS sin_fotos FROM candidates WHERE deleted_at IS NULL;"
```

**Resultado esperado:**
```
 total_candidatos | con_fotos | sin_fotos
------------------+-----------+-----------
             1148 |       856 |       292
```

---

## 🔧 Solución de Problemas

### Error: Python no encontrado

**Problema**: El script dice "Python NO encontrado"

**Solución**:
```bash
# Verificar Python instalado
python --version

# Si no está instalado:
# 1. Descargar desde https://www.python.org/downloads/
# 2. Durante instalación, marcar "Add Python to PATH"
# 3. Reiniciar terminal y ejecutar BUSCAR_FOTOS_AUTO.bat nuevamente
```

---

### Error: Base de datos Access no encontrada

**Problema**: El script dice "BASE DE DATOS ACCESS NO ENCONTRADA"

**Solución**:
```bash
# 1. Descargar .accdb desde Google Drive
# 2. Colocar en: D:\BASEDATEJP\
# 3. Crear carpeta si no existe:
mkdir D:\BASEDATEJP
# 4. Copiar archivo .accdb a esa carpeta
# 5. Ejecutar BUSCAR_FOTOS_AUTO.bat nuevamente
```

---

### Error: pyodbc o pywin32 no instalado

**Problema**: El script falla con "pyodbc not found" o "pywin32 not found"

**Solución**:
```bash
# Instalar dependencias
pip install pyodbc
pip install pywin32

# O si usas py:
py -m pip install pyodbc pywin32

# Ejecutar BUSCAR_FOTOS_AUTO.bat nuevamente
```

---

### Error: Microsoft Access Database Engine no instalado

**Problema**: El script falla con "ODBC Driver not found"

**Solución**:
```bash
# Descargar e instalar Microsoft Access Database Engine 2016 (64-bit):
# https://www.microsoft.com/download/details.aspx?id=54920

# IMPORTANTE:
# - Si tu Python es 64-bit, instala la versión 64-bit
# - Si tu Python es 32-bit, instala la versión 32-bit

# Verificar versión de Python:
python -c "import struct; print(struct.calcsize('P') * 8, 'bits')"
```

---

### Error: Archivo se generó pero está vacío

**Problema**: `access_photo_mappings.json` existe pero tiene 0 bytes o muy pequeño

**Solución**:
```bash
# 1. Verificar que la base de datos Access tenga fotos:
#    - Abrir el archivo .accdb en Microsoft Access
#    - Ir a tabla T_履歴書
#    - Verificar campo 写真 (debe tener adjuntos)

# 2. Cerrar Microsoft Access completamente

# 3. Ejecutar extracción con --force:
python backend\scripts\auto_extract_photos_from_databasejp.py --force

# 4. Verificar tamaño del archivo generado:
dir access_photo_mappings.json
```

---

## 📊 Formato del Archivo de Fotos

El archivo `access_photo_mappings.json` tiene este formato:

```json
{
  "R-001": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBD...",
  "R-002": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBD...",
  "R-003": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBD...",
  ...
}
```

**Donde**:
- **Key**: `rirekisho_id` (履歴書ID) del candidato
- **Value**: Data URI de la foto en formato base64
- **Tamaño**: ~50-150 MB para ~1,000 fotos

---

## ✅ Checklist Final

Usa esta lista para verificar que todo está correcto:

- [ ] Base de datos Access ubicada en carpeta correcta
- [ ] Python instalado y accesible desde terminal
- [ ] pyodbc y pywin32 instalados
- [ ] Microsoft Access Database Engine instalado (si es necesario)
- [ ] Script `BUSCAR_FOTOS_AUTO.bat` ejecutado exitosamente
- [ ] Archivo `access_photo_mappings.json` generado (50-150 MB)
- [ ] Fotos importadas a PostgreSQL
- [ ] Verificación SQL muestra candidatos con fotos
- [ ] Fotos visibles en http://localhost:3000/candidates

---

## 🚀 Comandos Rápidos (Resumen)

```bash
# 1. Extraer fotos desde Access
cd D:\tu-proyecto\UNS-ClaudeJP-5.4.1
scripts\BUSCAR_FOTOS_AUTO.bat

# 2. Verificar archivo generado
dir access_photo_mappings.json

# 3a. Opción: Reiniciar para importación automática
cd scripts
STOP.bat
START.bat

# 3b. Opción: Importación manual sin reiniciar
docker cp access_photo_mappings.json uns-claudejp-backend:/app/
docker exec uns-claudejp-backend python scripts/import_photos_from_json.py

# 4. Verificar importación
docker exec uns-claudejp-backend python scripts/unified_photo_import.py verify

# 5. Ver estadísticas
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT COUNT(*) AS total, COUNT(photo_data_url) AS con_fotos FROM candidates WHERE deleted_at IS NULL;"
```

---

## 📞 Soporte

Si sigues teniendo problemas:

1. **Ver logs del script**:
   ```bash
   # El script genera un log con timestamp
   dir unified_photo_import_*.log
   type unified_photo_import_<timestamp>.log
   ```

2. **Ejecutar extracción manualmente para ver errores**:
   ```bash
   python backend\scripts\auto_extract_photos_from_databasejp.py
   ```

3. **Verificar servicios Docker**:
   ```bash
   docker compose ps
   docker logs uns-claudejp-backend --tail 50
   ```

---

## 🎯 Próximos Pasos

Una vez que hayas completado la importación de fotos:

1. ✅ Abre http://localhost:3000/candidates
2. ✅ Verifica que las fotos aparecen en las tarjetas de candidatos
3. ✅ Click en un candidato para ver su detalle con foto
4. ✅ Las fotos también aparecerán en empleados (si están vinculados a candidatos)

---

**¿Todo listo?** Ejecuta `scripts\BUSCAR_FOTOS_AUTO.bat` y avísame cuando termine para verificar la importación.
