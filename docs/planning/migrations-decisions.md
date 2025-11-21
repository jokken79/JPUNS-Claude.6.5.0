# Decisiones de Migraciones v6.0.0

## Resumen
Total migraciones deshabilitadas: 15

## APLICAR (6 migraciones - Nuevas funcionalidades)

### 1. ✅ APLICAR: 2025_11_16_add_ai_budget_table.py.disabled
**Razón:** Nueva funcionalidad de presupuesto de IA
**Impacto:** Baja - Nueva tabla
**Riesgo:** Bajo
**Acción:** Renombrar → .py y ejecutar

### 2. ✅ APLICAR: 2025_11_16_add_ai_usage_log_table.py.disabled
**Razón:** Nuevo logging de uso de IA
**Impacto:** Baja - Nueva tabla
**Riesgo:** Bajo
**Acción:** Renombrar → .py y ejecutar

### 3. ✅ APLICAR: 2025_11_12_1804_add_parking_and_plus_fields.py.DISABLED
**Razón:** Campos de vivienda requeridos (parking, plus_field)
**Impacto:** Media - Nuevos campos en apartments
**Riesgo:** Bajo
**Acción:** Renombrar → .py y ejecutar

### 4. ✅ APLICAR: 2025_11_12_1900_add_tax_rates_to_payroll_settings.py.DISABLED
**Razón:** Configuración de tasas de impuestos para nómina
**Impacto:** Media - Nuevos campos en payroll_settings
**Riesgo:** Bajo
**Acción:** Renombrar → .py y ejecutar

### 5. ✅ APLICAR: 2025_11_12_1900_add_timer_cards_indexes_constraints.py.DISABLED
**Razón:** Índices de BD para performance y constraints de integridad
**Impacto:** Media - Mejora de performance
**Riesgo:** Bajo
**Acción:** Renombrar → .py y ejecutar

### 6. ✅ APLICAR: 2025_11_12_2200_add_additional_search_indexes.py.DISABLED
**Razón:** Índices adicionales para búsquedas más rápidas
**Impacto:** Media - Performance
**Riesgo:** Bajo
**Acción:** Renombrar → .py y ejecutar

## ELIMINAR (3 migraciones - Obsoletas/Duplicadas)

### 1. ❌ ELIMINAR: 002_add_housing_subsidy_field.py.DISABLED
**Razón:** Versión vieja, reemplazada por versión v2
**Impacto:** Baja
**Riesgo:** Bajo
**Acción:** Borrar archivo

### 2. ❌ ELIMINAR: 003_add_nyuusha_renrakuhyo_fields.py.disabled
**Razón:** Versión muy vieja, código obsoleto
**Impacto:** Baja
**Riesgo:** Bajo
**Acción:** Borrar archivo

### 3. ❌ ELIMINAR: 43b6cf501eed_add_pays_parking_field_to_apartment_assignments.py.DISABLED
**Razón:** Duplica funcionalidad, versión consolidada existe
**Impacto:** Baja
**Riesgo:** Bajo
**Acción:** Borrar archivo

## REVISAR (6 migraciones - Evaluación necesaria)

### 1. ⚠️ REVISAR: 2025_11_12_2000_remove_redundant_employee_id_from_timer_cards.py.DISABLED
**Razón:** ELIMINA campo de timer_cards - puede romper datos existentes
**Consideración:** ¿Hay dependencias en ese campo?
**Decisión provisional:** NO APLICAR POR AHORA - Evaluar más

### 2. ⚠️ REVISAR: 2025_11_12_2015_add_timer_card_consistency_triggers.py.DISABLED
**Razón:** Agrega triggers de BD - pueden afectar performance
**Consideración:** Verificar que los triggers no causen locks
**Decisión provisional:** APLICAR (triggers de consistencia son buenos)

### 3. ⚠️ REVISAR: 2025_11_12_2100_add_admin_audit_log_table.py.DISABLED
**Razón:** Nueva tabla de audit log
**Consideración:** Importante para compliance
**Decisión provisional:** APLICAR (audit logs son críticos)

### 4. ⚠️ REVISAR: 5e6575b9bf1b_add_apartment_system_v2_assignments_charges_deductions.py.DISABLED
**Razón:** CRÍTICA - Sistema v2 de apartments
**Consideración:** Múltiples tablas nuevas, schema importante
**Decisión provisional:** APLICAR (v2 es versión mejorada)

### 5. ⚠️ REVISAR: 642bced75435_add_property_type_field_to_apartments.py.DISABLED
**Razón:** Agrega property_type a apartments
**Consideración:** Campo adicional simple
**Decisión provisional:** APLICAR

### 6. ⚠️ REVISAR: 68534af764e0_add_additional_charges_and_rent_deductions_tables.py.DISABLED
**Razón:** Nuevas tablas para charges y deductions
**Consideración:** Completas el sistema de vivienda
**Decisión provisional:** APLICAR

## DECISIÓN FINAL

**APLICAR:** 6 (AI budget, AI usage, parking, tax rates, indexes, search indexes)
          + 4 (triggers, audit log, apartment v2, property type, charges)
          = 10 migraciones a aplicar

**ELIMINAR:** 3 (002, 003, 43b6cf)

**NO APLICAR POR AHORA:** 1 (remove_redundant_employee_id - requiere más análisis)

**Total final: 11 migraciones → 10 APLICAR + 3 ELIMINAR + 2 ANALIZAR**

