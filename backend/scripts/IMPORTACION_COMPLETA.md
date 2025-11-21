# 📦 GUÍA COMPLETA DE IMPORTACIÓN DE DATOS
**UNS-ClaudeJP 5.2 - Sistema de Importación Desde DATABASEJP**

---

## 🎯 **RESUMEN EJECUTIVO**

Este sistema importa **TODOS los datos** desde tu base de datos Access (DATABASEJP) y archivos Excel:

- ✅ **Candidatos** (履歴書) desde Access database con **fotos**
- ✅ **Fábricas** desde JSON
- ✅ **派遣社員** (Dispatch employees) con **TODOS los campos**
- ✅ **請負社員** (Contract workers) → **TODOS asignados a 高雄工業 岡山工場**
- ✅ **スタッフ** (Staff) con campos completos
- ✅ **Sincronización automática** de fotos entre candidatos y empleados

---

## 📁 **ESTRUCTURA DE ARCHIVOS REQUERIDA**

```
UNS-ClaudeJP-5.0/
├── DATABASEJP/                              # Carpeta con Access database
│   └── ユニバーサル企画㈱データベースv25.3.24.accdb
│
├── backend/config/
│   ├── employee_master.xlsm                  # Excel con empleados
│   ├── factories_index.json                  # Índice de fábricas
│   └── factories/                            # JSONs de cada fábrica
│       ├── 高雄工業株式会社__本社工場.json
│       ├── 高雄工業株式会社__岡山工場.json
│       └── ... (más fábricas)
│
└── backend/scripts/
    ├── import_all_from_databasejp.py        # ⭐ SCRIPT MAESTRO
    ├── auto_extract_photos_from_databasejp.py
    ├── import_access_candidates.py
    └── import_data.py
```

---

## 🚀 **MÉTODO 1: IMPORTACIÓN COMPLETA (RECOMENDADO)**

### **Paso único - Importa TODO automáticamente**

```bash
# Desde Windows (host):
docker exec -it uns-claudejp-backend python scripts/import_all_from_databasejp.py
```

**¿Qué hace este comando?**

1. ✅ Busca carpeta DATABASEJP automáticamente
2. ✅ Extrae **1,100+ fotos** desde Access (si no existen)
3. ✅ Importa **1,040+ candidatos** desde T_履歴書
4. ✅ Importa **fábricas** desde JSON
5. ✅ Importa **派遣社員** con todos los campos
6. ✅ Importa **請負社員** → **TODOS a 高雄工業 岡山工場** ⭐
7. ✅ Importa **スタッフ** con campos completos
8. ✅ Actualiza **退社社員** (resigned)
9. ✅ Sincroniza fotos automáticamente
10. ✅ Genera reporte completo JSON + log

**Tiempo estimado**: 15-30 minutos (dependiendo del tamaño de datos)

---

## 🔧 **MÉTODO 2: IMPORTACIÓN PASO A PASO**

### **Paso 1: Extraer Fotos (Solo en Windows)**

```bash
# En Windows (host) - NO en Docker:
python backend\scripts\auto_extract_photos_from_databasejp.py

# Resultado:
# ✓ Genera: access_photo_mappings.json (487 MB con 1,116 fotos)
```

**IMPORTANTE**:
- ⚠️ Requiere **pywin32**: `pip install pywin32`
- ⚠️ Requiere **Microsoft Access** o Access Database Engine
- ⚠️ Solo funciona en **Windows** (COM automation)
- ✅ Busca DATABASEJP automáticamente en varias ubicaciones

---

### **Paso 2: Copiar Fotos al Docker**

```bash
# Copiar JSON al container
docker cp access_photo_mappings.json uns-claudejp-backend:/app/
```

---

### **Paso 3: Importar Candidatos**

```bash
# Importar candidatos con fotos
docker exec -it uns-claudejp-backend python scripts/import_access_candidates.py --full --photos /app/access_photo_mappings.json

# O probar primero con sample:
docker exec -it uns-claudejp-backend python scripts/import_access_candidates.py --sample
```

**Mapea 172 columnas** desde Access → PostgreSQL:
- Información básica (氏名, フリガナ, ローマ字, 生年月日)
- Dirección completa (郵便番号, 現住所, 番地, 物件名)
- Visa/residencia (在留資格, 在留期限, 在留カード)
- Licencias (運転免許, パスポート)
- Familia (5 miembros completos)
- Experiencia laboral (14 tipos)
- Habilidades japonés (読む, 書く, 話す, 聞く)
- **Y 100+ campos más**

---

### **Paso 4: Importar Fábricas y Empleados**

```bash
# Ejecutar script de importación de datos
docker exec -it uns-claudejp-backend python scripts/import_data.py
```

**Importa:**
- ✅ Fábricas desde JSON
- ✅ 派遣社員 con **45 campos** completos
- ✅ 請負社員 con **factory_id fijo** = `高雄工業株式会社__岡山工場`
- ✅ スタッフ con **25 campos** completos
- ✅ Actualiza estados de empleados renunciados

---

## 📊 **RESULTADO ESPERADO**

### **Después de importación exitosa:**

```
ESTADÍSTICAS FINALES:
================================================================================
  📋 Candidatos en BD:          1,041
     └─ Con fotos:              1,041

  👷 派遣社員:                   245
     └─ Con fotos:              230

  🔧 請負社員:                    15
     └─ Todos en: 高雄工業株式会社__岡山工場

  👔 スタッフ:                     8

  🏭 Fábricas:                   43
================================================================================
✅ IMPORTACIÓN COMPLETADA SIN ERRORES
```

---

## 🎯 **CARACTERÍSTICAS ESPECIALES**

### **1. 請負社員 - Factory Assignment Automático**

**TODOS** los empleados 請負 se asignan automáticamente a:
- **factory_id**: `高雄工業株式会社__岡山工場`
- **company_name**: `高雄工業株式会社`
- **plant_name**: `岡山工場`

**Razón**: Según especificación del usuario, todos los 請負 trabajan en esta fábrica.

---

### **2. Campos Completos para 請負社員**

Ahora se importan **38 campos** (antes solo 8):

**Nuevos campos agregados**:
- ✅ `factory_id`, `company_name`, `plant_name` (FIJOS)
- ✅ `date_of_birth`, `zairyu_card_number`, `zairyu_expire_date`
- ✅ `address`, `phone`, `email`, `postal_code`
- ✅ `emergency_contact_*` (3 campos)
- ✅ `current_hire_date`, `jikyu_revision_date`
- ✅ `assignment_location`, `assignment_line`, `job_description`
- ✅ `hourly_rate_charged`, `billing_revision_date`, `profit_difference`
- ✅ `standard_compensation`, `health_insurance`, `nursing_insurance`, `pension_insurance`
- ✅ `visa_type`, `license_type`, `license_expire_date`
- ✅ `japanese_level`, `career_up_5years`, `commute_method`
- ✅ `yukyu_total`, `yukyu_used`, `yukyu_remaining`

---

### **3. Campos Completos para スタッフ**

Ahora se importan **26 campos** (antes solo 6):

**Nuevos campos agregados**:
- ✅ `date_of_birth`, `gender`, `nationality`
- ✅ `postal_code`, `address`, `phone`, `email`
- ✅ `emergency_contact_*` (3 campos)
- ✅ `hire_date`, `position`, `department`
- ✅ `termination_date`, `termination_reason`, `notes`
- ✅ `health_insurance`, `nursing_insurance`, `pension_insurance`
- ✅ `social_insurance_date`
- ✅ `yukyu_total`, `yukyu_used`, `yukyu_remaining`

---

### **4. Sincronización de Fotos Automática**

El sistema busca candidatos por nombre y sincroniza:
- ✅ `rirekisho_id` → Link al candidato original
- ✅ `photo_url` → Ruta del archivo (si existe)
- ✅ `photo_data_url` → Base64 data URL de la foto

**Matching inteligente** (3 estrategias):
1. Match exacto por `rirekisho_id`
2. Match por `full_name_kanji` + `date_of_birth`
3. Match fuzzy si nombre cambió

---

## ⚙️ **OPCIONES AVANZADAS**

### **Importar solo candidatos (sin empleados)**

```bash
docker exec -it uns-claudejp-backend python scripts/import_all_from_databasejp.py --factories-only
```

### **Saltar extracción de fotos**

```bash
docker exec -it uns-claudejp-backend python scripts/import_all_from_databasejp.py --skip-photos
```

### **Saltar candidatos (solo empleados)**

```bash
docker exec -it uns-claudejp-backend python scripts/import_all_from_databasejp.py --skip-candidates
```

---

## 🐛 **TROUBLESHOOTING**

### **Problema 1: "DATABASEJP not found"**

**Solución**:
```bash
# Opción A: Crear carpeta en proyecto
mkdir DATABASEJP
# Copiar Access database a DATABASEJP/

# Opción B: Mount en Docker Compose
# Editar docker-compose.yml:
volumes:
  - D:/DATABASEJP:/app/DATABASEJP
```

---

### **Problema 2: "pywin32 not installed"**

**Solución** (solo en Windows host):
```bash
pip install pywin32
```

---

### **Problema 3: "Access database locked"**

**Solución**:
- Cerrar Microsoft Access si está abierto
- Verificar que nadie esté usando el archivo
- Reiniciar Windows si persiste

---

### **Problema 4: "Candidate not found for employee"**

**Esto es NORMAL**. Significa:
- El empleado no tiene candidato previo registrado
- Se importa el empleado sin foto
- No es un error, solo advertencia informativa

---

### **Problema 5: "Factory not found for employee"**

**Para 派遣社員**: Verificar que el nombre de la fábrica en Excel coincida con factories_index.json

**Para 請負社員**: **NO APLICA** - Todos van a 高雄工業 岡山工場 automáticamente

---

## 📝 **LOGS Y REPORTES**

### **Ubicación de logs**

```
/app/import_all_YYYYMMDD_HHMMSS.log          # Log completo
/app/import_all_report_YYYYMMDD_HHMMSS.json  # Reporte JSON
/app/import_candidates_YYYYMMDD_HHMMSS.log   # Log de candidatos
/app/access_photo_mappings.json               # Mappings de fotos
```

### **Ver logs en tiempo real**

```bash
# Desde otro terminal mientras importa:
docker exec -it uns-claudejp-backend tail -f import_all_*.log
```

---

## 🔄 **REINICIAR IMPORTACIÓN (desde cero)**

### **Si necesitas volver a importar:**

```bash
# 1. Limpiar base de datos
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "TRUNCATE candidates, employees, contract_workers, staff, factories CASCADE;"

# 2. Borrar fotos extraídas (para re-extraer)
docker exec -it uns-claudejp-backend rm -f /app/access_photo_mappings.json

# 3. Re-ejecutar importación completa
docker exec -it uns-claudejp-backend python scripts/import_all_from_databasejp.py
```

---

## 📊 **VALIDACIÓN POST-IMPORTACIÓN**

### **Verificar en base de datos**

```bash
# Conectar a PostgreSQL
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp

# Verificar conteos
SELECT COUNT(*) as candidatos FROM candidates;
SELECT COUNT(*) as con_fotos FROM candidates WHERE photo_data_url IS NOT NULL;
SELECT COUNT(*) as empleados FROM employees;
SELECT COUNT(*) as ukeoi FROM contract_workers;
SELECT COUNT(*) as staff FROM staff;
SELECT COUNT(*) as fabricas FROM factories;

# Verificar 請負 en fábrica correcta
SELECT hakenmoto_id, full_name_kanji, factory_id
FROM contract_workers
WHERE factory_id = '高雄工業株式会社__岡山工場';
```

---

## ✅ **CHECKLIST DE IMPORTACIÓN**

Antes de ejecutar, verifica:

- [ ] Carpeta DATABASEJP existe con Access database
- [ ] Archivo employee_master.xlsm en backend/config/
- [ ] Archivo factories_index.json en backend/config/
- [ ] Carpeta factories/ con JSONs de fábricas
- [ ] Docker containers corriendo (backend + db)
- [ ] Suficiente espacio en disco (~500MB para fotos)
- [ ] pywin32 instalado (solo si extraes fotos en Windows)

Durante importación:

- [ ] No cerrar terminal hasta que termine
- [ ] Monitorear logs para detectar errores
- [ ] Verificar que no haya errores críticos

Después de importación:

- [ ] Verificar conteos en base de datos
- [ ] Comprobar que 請負 tienen factory_id correcto
- [ ] Verificar que fotos se importaron
- [ ] Revisar reporte JSON generado
- [ ] Hacer backup de la base de datos

---

## 🎓 **PREGUNTAS FRECUENTES**

### **P: ¿Cuánto tiempo toma la importación completa?**
**R**: 15-30 minutos dependiendo de:
- Cantidad de registros (1,000+ candidatos)
- Tamaño de fotos (487 MB)
- Velocidad del disco

### **P: ¿Puedo importar solo candidatos sin empleados?**
**R**: Sí, usa `--factories-only` o ejecuta `import_access_candidates.py` directamente

### **P: ¿Qué pasa si ya tengo datos en la BD?**
**R**: El script detecta duplicados y los salta automáticamente. No crea duplicados.

### **P: ¿Puedo cambiar la fábrica de los 請負?**
**R**: Sí, edita `UKEOI_FACTORY_ID` en `import_data.py` línea 412

### **P: ¿Las fotos se guardan en disco o en BD?**
**R**: En BD como Base64 data URLs en campo `photo_data_url`

### **P: ¿Cómo sé si la importación fue exitosa?**
**R**: Verifica el reporte final + conteos en BD + revisa log de errores

---

## 📚 **ARCHIVOS DE REFERENCIA**

- **SESION_IMPORTACION_COMPLETA_2025-10-26.md** - Sesión completa anterior
- **PHOTO_IMPORT_GUIDE.md** - Guía específica de fotos
- **CLAUDE.md** - Instrucciones generales del proyecto

---

## 🆘 **SOPORTE**

Si encuentras problemas:

1. **Revisa los logs** en `/app/import_all_*.log`
2. **Verifica los requisitos** (checklist arriba)
3. **Consulta troubleshooting** en esta guía
4. **Revisa la documentación** de sesiones anteriores

---

**✅ ¡LISTO! Sistema de importación completo configurado y documentado.**

**Última actualización**: 2025-10-28
**Versión**: 1.0
**Autor**: Claude Code
