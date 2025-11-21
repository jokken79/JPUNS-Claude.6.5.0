# 🔧 SOLUCIÓN COMPLETA: FOTOS NO VISIBLES (OLE Garbage Bytes)

**Fecha:** 2025-11-11
**Versión:** UNS-ClaudeJP 5.4.1
**Estado:** ✅ RESUELTO COMPLETAMENTE
**Criticidad:** 🔴 CRÍTICA - Afecta visualización de 1,931 fotos

---

## 📋 ÍNDICE RÁPIDO

- [Problema](#problema)
- [Causa Raíz](#causa-raíz)
- [Solución Completa](#solución-completa)
- [Scripts de Reparación](#scripts-de-reparación)
- [Prevención en Reinstalaciones](#prevención-en-reinstalaciones)
- [Verificación](#verificación)
- [Archivos Modificados](#archivos-modificados)

---

## 🚨 PROBLEMA

### Síntomas

1. **Candidatos (http://localhost:3000/candidates):**
   - ❌ 12 fotos no se mostraban
   - ❌ Solo iconos de placeholder visibles
   - ❌ Console errors: "Image load error"

2. **Empleados (http://localhost:3000/employees):**
   - ❌ 0 fotos visibles (debían ser 815)
   - ❌ Columna de fotos vacía
   - ❌ Base de datos tenía fotos pero no se mostraban

### Impacto

- **1,931 fotos corruptas** en la base de datos
- **Candidatos:** 1,116 de 1,148 (97.2%) afectados
- **Empleados:** 815 de 945 (85.8%) afectados

---

## 🔍 CAUSA RAÍZ

### Problema Principal: OLE Garbage Bytes

Las fotos en la base de datos contenían **bytes basura de OLE** antes de los marcadores reales de imagen JPEG/PNG.

#### Datos Corruptos vs. Datos Limpios

**❌ CORRUPTO (en base de datos):**
\`\`\`
data:image/jpeg;base64,FgAAAAEAAAAFAAAAagBwAGUAZwAAAP/Y/+AAE...
                       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                       16-22 bytes de metadata OLE (basura)
\`\`\`

**✅ LIMPIO (después del fix):**
\`\`\`
data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgG...
                       ^^^^
                       FF D8 = Marcador JPEG válido
\`\`\`

### Origen del Problema

1. **Microsoft Access OLE Objects:**
   - Las fotos originales estaban en base de datos Access (.accdb)
   - Almacenadas como "OLE Objects" en Access
   - Al extraer, Access añade metadata OLE (16-231KB de bytes extra)

2. **Extracción Original:**
   - Script \`EXTRAER_FOTOS_ROBUSTO.bat\` extrajo fotos de Access
   - Preservó metadata OLE en lugar de solo la imagen
   - Datos guardados en \`photo_data_url\` con bytes basura

---

## 🛠️ SOLUCIÓN COMPLETA

### Paso 1: Fix Frontend TypeScript

**Archivo:** \`frontend/app/(dashboard)/employees/page.tsx\`

**Cambio 1: Agregar campo al interface (línea 31)**
\`\`\`typescript
interface Employee {
  hakensaki_shain_id: string | null;
  photo_url: string | null;
  photo_data_url: string | null;  // ✅ AGREGADO
  full_name_kanji: string;
}
\`\`\`

**Cambio 2: Modificar lógica de renderizado**
\`\`\`typescript
// ✅ SOLUCIÓN
render: (emp) => {
  const photoSrc = emp.photo_url || emp.photo_data_url;
  return photoSrc ? (
    <img src={photoSrc} alt={emp.full_name_kanji} />
  ) : (
    <div><UserCircleIcon /></div>
  );
}
\`\`\`

### Paso 2: Limpiar Datos de Candidatos

\`\`\`bash
docker exec uns-claudejp-backend bash -c "cd /app && python scripts/fix_photo_data.py"
\`\`\`

**Resultado:** ✅ Fixed 1,116 photos

### Paso 3: Limpiar Datos de Empleados

\`\`\`bash
docker exec uns-claudejp-backend bash -c "cd /app && python scripts/fix_employee_photos.py"
\`\`\`

**Resultado:** ✅ Fixed 815 photos

---

## 📜 SCRIPTS DE REPARACIÓN

### fix_photo_data.py (Candidatos)

**Ubicación:** \`backend/scripts/fix_photo_data.py\`

**Función:**
1. Lee candidatos con photo_data_url
2. Decodifica base64 a bytes
3. Busca marcador JPEG (\`\xff\xd8\`) o PNG (\`\x89PNG\`)
4. Extrae imagen limpia desde el marcador
5. Re-codifica y actualiza base de datos

### fix_employee_photos.py (Empleados)

**Ubicación:** \`backend/scripts/fix_employee_photos.py\`

**Función:** Idéntica a fix_photo_data.py pero para tabla employees

---

## 🔄 PREVENCIÓN EN REINSTALACIONES

### ⚠️ CRÍTICO: Ejecutar SIEMPRE después de importar fotos

\`\`\`bash
# 1. Verificar servicios
docker compose ps

# 2. Importar datos (si nueva instalación)
docker exec uns-claudejp-backend python scripts/import_data.py

# 3. 🔴 OBLIGATORIO: Limpiar fotos candidatos
docker exec uns-claudejp-backend bash -c "cd /app && python scripts/fix_photo_data.py"

# 4. 🔴 OBLIGATORIO: Limpiar fotos empleados
docker exec uns-claudejp-backend bash -c "cd /app && python scripts/fix_employee_photos.py"

# 5. Verificar en navegador
# - Candidatos: http://localhost:3000/candidates
# - Empleados: http://localhost:3000/employees
\`\`\`

---

## ✅ VERIFICACIÓN

### Verificación Base de Datos

\`\`\`bash
# Candidatos con fotos
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT COUNT(*) as total, COUNT(photo_data_url) as con_fotos FROM candidates WHERE deleted_at IS NULL;"

# Resultado esperado: total=1148, con_fotos=1116

# Empleados con fotos
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT COUNT(*) as total, COUNT(photo_data_url) as con_fotos FROM employees WHERE deleted_at IS NULL;"

# Resultado esperado: total=945, con_fotos=815
\`\`\`

### Verificación Visual

1. **Candidatos:** http://localhost:3000/candidates
   - ✅ 12 fotos en primera página
   - ✅ Sin errores en consola

2. **Empleados:** http://localhost:3000/employees
   - ✅ Columna "写真" con fotos
   - ✅ Virtual scrolling funcional

---

## 📁 ARCHIVOS MODIFICADOS

1. **frontend/app/(dashboard)/employees/page.tsx**
   - Línea 31: Interface Employee
   - Líneas 563-576: Renderizado tabla
   - Líneas 1411-1425: Renderizado modal

2. **backend/scripts/fix_photo_data.py** ✨ NUEVO

3. **backend/scripts/fix_employee_photos.py** ✨ NUEVO

4. **docs/features/photos/SOLUCION_FOTOS_OLE_2025-11-11.md** ✨ ESTE ARCHIVO

---

## 📊 RESULTADOS FINALES

| Tabla | Registros | Con Fotos | Limpiadas | % Éxito |
|-------|-----------|-----------|-----------|---------|
| candidates | 1,148 | 1,116 | 1,116 ✅ | 97.2% |
| employees | 945 | 815 | 815 ✅ | 85.8% |
| **TOTAL** | 2,093 | 1,931 | **1,931** ✅ | **92.3%** |

---

## 🎯 RESUMEN PARA TI

### Si cambias de PC o haces reinstalación:

1. **Copia estos archivos al nuevo PC:**
   - \`backend/scripts/fix_photo_data.py\`
   - \`backend/scripts/fix_employee_photos.py\`
   - Este documento

2. **Después de reinstalar y antes de usar:**
   \`\`\`bash
   docker exec uns-claudejp-backend bash -c "cd /app && python scripts/fix_photo_data.py"
   docker exec uns-claudejp-backend bash -c "cd /app && python scripts/fix_employee_photos.py"
   \`\`\`

3. **Verificar que funcionó:**
   - Abrir http://localhost:3000/candidates
   - Abrir http://localhost:3000/employees
   - Ver que las fotos aparecen

### ¿Por qué pasó esto?

Microsoft Access guarda las fotos con "basura" extra. Los scripts las limpian automáticamente.

### ¿Se va a romper de nuevo?

**NO**, si sigues estos pasos:
- ✅ Siempre ejecuta los 2 scripts después de importar datos
- ✅ Los scripts ya están creados y listos
- ✅ La base de datos actual ya está limpia

---

**Documentado por:** Claude Code  
**Fecha:** 2025-11-11  
**Versión:** UNS-ClaudeJP 5.4.1  
**Estado:** ✅ PROBLEMA RESUELTO PERMANENTEMENTE
