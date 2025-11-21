# ✅ CHECKLIST REINSTALACIÓN / CAMBIO DE PC

**Para:** Reinstalar sistema o mover a nuevo PC sin perder funcionalidad
**Fecha:** 2025-11-11
**Criticidad:** 🔴 CRÍTICO - No saltar ningún paso

---

## 🎯 RESUMEN RÁPIDO

**Si vas a reinstalar o cambiar de PC, DEBES:**

1. ✅ Ejecutar scripts de limpieza de fotos
2. ✅ Verificar que las fotos se muestran
3. ✅ Verificar base de datos

**Tiempo total:** 5-10 minutos
**Dificultad:** Fácil (solo copiar-pegar comandos)

---

## 📋 CHECKLIST PASO A PASO

### Paso 1: Verificar Servicios (1 min)

```bash
# Ir a carpeta del proyecto
cd D:\UNS-ClaudeJP-5.4.1

# Verificar servicios corriendo
docker compose ps

# Deberías ver:
# - uns-claudejp-db (healthy)
# - uns-claudejp-backend (healthy)
# - uns-claudejp-frontend (healthy)
```

**✅ Completado cuando:** Todos los servicios muestran "healthy"

---

### Paso 2: 🔴 CRÍTICO - Limpiar Fotos de Candidatos (2 min)

```bash
# Ejecutar script de limpieza
docker exec uns-claudejp-backend bash -c "cd /app && python scripts/fix_photo_data.py"

# Deberías ver:
# Found 1116 candidates with photos
# Candidate 1: Removing 22 garbage bytes
# ...
# ✅ Fixed 1116 photos
```

**✅ Completado cuando:** Ves "Fixed 1116 photos" o similar

**⚠️ Si falla:** Ver docs/features/photos/SOLUCION_FOTOS_OLE_2025-11-11.md

---

### Paso 3: 🔴 CRÍTICO - Limpiar Fotos de Empleados (2 min)

```bash
# Ejecutar script de limpieza
docker exec uns-claudejp-backend bash -c "cd /app && python scripts/fix_employee_photos.py"

# Deberías ver:
# Found 815 employees with photos
# Employee 1: Removing 108662 garbage bytes
# ...
# ✅ Fixed 815 photos
```

**✅ Completado cuando:** Ves "Fixed 815 photos" o similar

**⚠️ Si falla:** Ver docs/features/photos/SOLUCION_FOTOS_OLE_2025-11-11.md

---

### Paso 4: Verificar Base de Datos (1 min)

```bash
# Verificar candidatos
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT COUNT(*) as total, COUNT(photo_data_url) as con_fotos FROM candidates WHERE deleted_at IS NULL;"

# Resultado esperado:
#  total | con_fotos
# -------+-----------
#   1148 |      1116

# Verificar empleados
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT COUNT(*) as total, COUNT(photo_data_url) as con_fotos FROM employees WHERE deleted_at IS NULL;"

# Resultado esperado:
#  total | con_fotos
# -------+-----------
#    945 |       815
```

**✅ Completado cuando:** Los números coinciden con lo esperado

---

### Paso 4b: Verificar Apartamentos V2 (1 min)

```bash
# Verificar apartamentos cargados
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT COUNT(*) as total_apartamentos FROM apartments WHERE deleted_at IS NULL;"

# Resultado esperado:
#  total_apartamentos
# --------------------
#                 449

# Verificar tablas relacionadas
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT 'apartments' as tabla, COUNT(*) as registros FROM apartments UNION ALL SELECT 'apartment_assignments', COUNT(*) FROM apartment_assignments UNION ALL SELECT 'additional_charges', COUNT(*) FROM additional_charges UNION ALL SELECT 'rent_deductions', COUNT(*) FROM rent_deductions ORDER BY tabla;"

# Resultado esperado:
#        tabla         | registros
# ---------------------+-----------
#  additional_charges  |         0
#  apartment_assignments |       0
#  apartments          |       449
#  rent_deductions     |         0
```

**✅ Completado cuando:**
- 449 apartamentos en la tabla `apartments`
- 4 tablas del sistema V2 existen y son consultables

**⚠️ Si falla:**
- Verifica que el importer corrió correctamente: `docker compose logs importer | grep apartments`
- Debería mostrar: "✅ Apartments created (449 records)"

---

### Paso 5: Verificar en Navegador (2 min)

#### 5a. Verificar Candidatos

1. Abrir: http://localhost:3000/candidates
2. ✅ Deberías ver 12 fotos en la primera página
3. ✅ Fotos circulares de 64x64px
4. ✅ Sin errores en consola del navegador (F12)

#### 5b. Verificar Empleados

1. Abrir: http://localhost:3000/employees
2. ✅ Deberías ver columna "写真" con fotos
3. ✅ Fotos aparecen al hacer scroll (virtual scrolling)
4. ✅ Sin errores en consola del navegador (F12)

#### 5c. Verificar Apartamentos V2 (NUEVO)

1. Abrir: http://localhost:3000/apartments
2. ✅ Deberías ver lista de apartamentos (449 total)
3. ✅ Columnas: Código, Dirección, Renta, Capacidad, Estado
4. ✅ Filtros funcionando (Estado, Prefectura, Tipo de habitación)
5. ✅ Paginación funcional
6. ✅ Sin errores en consola del navegador (F12)

**✅ Completado cuando:** Las tres páginas (candidatos, empleados, apartamentos) muestran datos correctamente

---

## 🚨 SI ALGO FALLA

### Problema: Scripts no ejecutan

**Solución:**
```bash
# Verificar que los scripts existen
docker exec uns-claudejp-backend ls -la /app/scripts/fix_photo_data.py
docker exec uns-claudejp-backend ls -la /app/scripts/fix_employee_photos.py

# Si no existen, copiarlos de este repositorio
```

### Problema: Fotos no se muestran después de ejecutar scripts

**Solución:**
1. Lee: `docs/features/photos/SOLUCION_FOTOS_OLE_2025-11-11.md`
2. Verifica que ejecutaste AMBOS scripts (candidatos + empleados)
3. Limpia caché del navegador (Ctrl+Shift+R)
4. Reinicia servicios: `docker compose restart`

### Problema: Base de datos no tiene registros

**Solución:**
```bash
# Importar datos
docker exec uns-claudejp-backend python scripts/import_data.py

# Después ejecutar los 2 scripts de limpieza (Paso 2 y 3)
```

---

## 📁 ARCHIVOS CRÍTICOS PARA REINSTALACIÓN

**DEBES copiar estos archivos al nuevo PC:**

```
D:\UNS-ClaudeJP-5.4.1\
├── backend\scripts\
│   ├── fix_photo_data.py          ← CRÍTICO
│   └── fix_employee_photos.py     ← CRÍTICO
│
├── docs\features\photos\
│   └── SOLUCION_FOTOS_OLE_2025-11-11.md  ← Documentación completa
│
└── CHECKLIST_REINSTALACION.md    ← Este archivo
```

**Además:**
- Toda la carpeta `backend\` (código backend)
- Toda la carpeta `frontend\` (código frontend)
- Archivo `.env` (configuración)
- Archivo `docker-compose.yml`

---

## ⚙️ REINSTALACIÓN DESDE CERO

Si estás haciendo reinstalación completa:

```bash
# 1. Clonar o copiar proyecto
cd D:\
# (copiar archivos)

# 2. Iniciar servicios
cd UNS-ClaudeJP-5.4.1\scripts
START.bat

# 3. Esperar que servicios estén healthy (2-3 min)
docker compose ps

# 4. 🔴 EJECUTAR ESTE CHECKLIST COMPLETO (Paso 2-5)
```

---

## 🎯 RESUMEN FINAL

**Lo que DEBES hacer SIEMPRE después de reinstalar:**

```bash
# Comando 1 (candidatos)
docker exec uns-claudejp-backend bash -c "cd /app && python scripts/fix_photo_data.py"

# Comando 2 (empleados)
docker exec uns-claudejp-backend bash -c "cd /app && python scripts/fix_employee_photos.py"

# Comando 3 (verificar apartamentos V2 - NUEVO)
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT COUNT(*) FROM apartments;"
# Debe mostrar: 449

# Verificar en navegador
# - http://localhost:3000/candidates
# - http://localhost:3000/employees
# - http://localhost:3000/apartments (NUEVO)
```

**Si sigues estos 3 comandos, NUNCA tendrás problemas con fotos ni apartamentos.**

---

## 📚 DOCUMENTACIÓN COMPLETA

**Para más detalles:**
- `docs/features/photos/SOLUCION_FOTOS_OLE_2025-11-11.md` - Solución completa
- `docs/features/photos/DOCUMENTACION_FOTOS_INDICE.md` - Índice maestro
- `CLAUDE.md` - Guía general del proyecto

---

**✅ CHECKLIST COMPLETADO**

**Si completaste todos los pasos:**
- ✅ Sistema reinstalado correctamente
- ✅ 1,931 fotos funcionando
- ✅ 449 apartamentos cargados (Sistema V2)
- ✅ 4 tablas de apartamentos operativas
- ✅ Listo para usar

**¡Felicidades! Sistema operativo al 100% incluyendo Apartamentos V2**

---

**Última actualización:** 2025-11-11 (Apartamentos V2 agregados)
**Versión:** 2.0
**Autor:** Claude Code
