# 📋 PLAN DE IMPLEMENTACIÓN COMPLETO
## Sistema UNS-ClaudeJP 5.4.1 - Completar Features Faltantes

**Fecha:** 2025-11-11
**Estado actual:** 84% implementado
**Items totales encontrados:** 89
**Items críticos:** 17
**Items alta prioridad:** 8
**Objetivo:** Alcanzar 95% implementación

---

## 🎯 RESUMEN EJECUTIVO

### Análisis Completado
- ✅ Todos los .md analizados (316+ archivos)
- ✅ TODOs encontrados (43 items)
- ✅ Pass statements identificados (37 items)
- ✅ Funciones incompletas (6 items)
- ✅ Endpoints verificados (30/30 OK)
- ✅ Páginas frontend verificadas (57/57 OK)

### Hallazgos Principales
**LO BUENO:**
- Endpoints API: 100% implementados (30/30)
- Páginas frontend: 100% creadas (57/57)
- Documentación: Exhaustiva y completa
- Arquitectura: Sólida y bien estructurada

**LO QUE FALTA:**
- Assignment Service: 7 métodos críticos sin implementar
- Payroll API: 7 endpoints retornan mocks
- Frontend forms: No guardan datos realmente
- Tests: 0% coverage

---

## 🔴 FASE 1: CRÍTICO (3-5 días) - IMPLEMENTAR PRIMERO

### 1.1 Assignment Service - Apartamentos V2 (2 días)

**Archivo:** `backend/app/services/assignment_service.py`

**Métodos a implementar:**

#### M1: `transfer_employee()` - Línea 377
```python
Status: HTTPException 501 "Funcionalidad en desarrollo"
Requiere:
  - Finalizar asignación actual
  - Calcular renta prorrateada de ambos períodos
  - Crear nueva asignación
  - Actualizar Employee.apartment_id
  - Agregar cargos de limpieza si aplica
Prioridad: CRÍTICA
Tiempo: 4h
```

#### M2: `list_assignments()` - Línea 410
```python
Status: Retorna []
Requiere:
  - Query a apartment_assignments
  - Joins con apartments, employees
  - Aplicar filtros (status, apartment_id, employee_id, dates)
  - Paginación
  - Sorting
Prioridad: CRÍTICA
Tiempo: 3h
```

#### M3: `get_assignment()` - Línea 432
```python
Status: HTTPException 501
Requiere:
  - Query con id
  - Joins con apartment, employee, additional_charges
  - Calcular estadísticas (días transcurridos, monto pagado)
  - Formatear response completo
Prioridad: CRÍTICA
Tiempo: 2h
```

#### M4: `get_active_assignments()` - Línea 445
```python
Status: Retorna []
Requiere:
  - Query filtrada por status='active'
  - Joins necesarios
  - Retornar lista completa
Prioridad: CRÍTICA
Tiempo: 1h
```

#### M5: Crear deducción de renta - Línea 190
```python
Status: pass statement
Requiere:
  - Verificar si es mes completo (!is_prorated)
  - Crear registro en rent_deductions
  - Calcular monto = base_rent + additional_charges
  - Status inicial = 'PENDING'
Prioridad: CRÍTICA
Tiempo: 2h
```

#### M6: `get_assignment_statistics()` - Línea 584
```python
Status: Retorna datos fake
Requiere:
  - Query real con aggregations
  - Calcular: total_assignments, active, completed, cancelled
  - Calcular: total_rent_collected, avg_occupancy_rate
  - Por período de tiempo
Prioridad: ALTA
Tiempo: 2h
```

#### M7: Validaciones antes de asignar - Línea 461 (apartment_service.py)
```python
Status: TODO comment
Requiere:
  - Verificar capacidad disponible
  - Verificar no hay overlap de fechas
  - Verificar apartamento está disponible
  - Validar empleado no tiene asignación activa
Prioridad: ALTA
Tiempo: 2h
```

**Total Assignment Service: 16 horas (2 días)**

---

### 1.2 Payroll API - Sistema de Nómina (2 días)

**Archivo:** `backend/app/api/payroll.py`

**Endpoints a implementar:**

#### E1: `create_payroll_run()` - Línea 83
```python
Status: Retorna mock
Requiere:
  - Crear PayrollRun en DB
  - Validar período
  - Calcular totales preliminares
  - Retornar objeto real con ID
Prioridad: CRÍTICA
Tiempo: 3h
```

#### E2: `list_payroll_runs()` - Línea 135
```python
Status: Retorna []
Requiere:
  - Query a payroll_runs table
  - Filtros: status, period, factory
  - Paginación
  - Incluir estadísticas
Prioridad: CRÍTICA
Tiempo: 2h
```

#### E3: `get_payroll_run()` - Línea 171
```python
Status: HTTPException 404
Requiere:
  - Query con id
  - Joins con employees, deductions
  - Calcular totales
  - Formatear response completo
Prioridad: CRÍTICA
Tiempo: 2h
```

#### E4: `list_employees_in_payroll()` - Línea 259
```python
Status: Retorna []
Requiere:
  - Query empleados en payroll run específico
  - Incluir cálculos individuales
  - Incluir deducciones
  - Filtros y paginación
Prioridad: CRÍTICA
Tiempo: 2h
```

#### E5: `approve_payroll()` - Línea 297
```python
Status: Retorna mock
Requiere:
  - Validar estado actual
  - Actualizar status a 'APPROVED'
  - Registrar audit log (user, timestamp)
  - Notificar si configurado
  - Retornar confirmación real
Prioridad: CRÍTICA
Tiempo: 2h
```

#### E6: `generate_payslip()` - Línea 456
```python
Status: Usa datos fake
Requiere:
  - Query payroll data real de DB
  - Obtener employee details
  - Obtener deductions y bonuses
  - Generar PDF con datos reales
  - Retornar file response
Prioridad: CRÍTICA
Tiempo: 3h
```

#### E7: `payroll_summary()` - Línea 675
```python
Status: Retorna []
Requiere:
  - Query a vista vw_payroll_summary
  - Crear vista si no existe
  - Aplicar filtros
  - Retornar resumen
Prioridad: ALTA
Tiempo: 2h
```

**Total Payroll API: 16 horas (2 días)**

---

### 1.3 Frontend - Forms y CRUD (1 día)

**Prioridad CRÍTICA:**

#### F1: CandidateForm save (2h)
**Archivo:** `frontend/components/CandidateForm.tsx` línea 155
```typescript
Requiere:
  - Llamar candidatesService.createCandidate(data)
  - Manejo de errores
  - Mostrar toast de éxito
  - Redirect a lista o detalle
```

#### F2: Apartment Calculations save (2h)
**Archivo:** `frontend/app/(dashboard)/apartment-calculations/prorated/page.tsx` línea 355
```typescript
Requiere:
  - Guardar cálculo en local storage o DB
  - Permitir recuperar cálculos previos
  - Export a PDF/Excel opcional
```

**Total Frontend crítico: 4 horas**

---

### 1.4 Database - Validaciones críticas (0.5 días)

#### D1: Apartment soft delete validation
**Archivo:** `backend/app/services/apartment_service.py` líneas 345-346
```python
Requiere:
  - Verificar no tiene asignaciones activas
  - Verificar no tiene deducciones pendientes
  - Retornar error descriptivo si no puede borrar
  - Realizar soft delete solo si pasa validaciones
```

**Total Database: 2 horas**

---

## 🟡 FASE 2: ALTA PRIORIDAD (2-3 días) - DESPUÉS DE CRÍTICO

### 2.1 Frontend - CRUD Operations Completos (1 día)

#### F3: Rent Deductions export (1h)
**Archivos:**
- `frontend/app/(dashboard)/rent-deductions/page.tsx` línea 96
- `frontend/app/(dashboard)/rent-deductions/[year]/[month]/page.tsx` línea 100

```typescript
Requiere:
  - Llamar deductionService.exportToExcel(year, month)
  - Descargar archivo Excel generado
  - Manejo de errores
  - Loading state
```

#### F4: Additional Charges CRUD (2h)
**Archivo:** `frontend/app/(dashboard)/additional-charges/page.tsx` líneas 453, 462

```typescript
Requiere:
  - Edit: Modal con formulario pre-poblado
  - Delete: Confirmación y llamada a API
  - Refresh list después de operación
  - Toast de confirmación
```

#### F5: Yukyu Reports calculations (1h)
**Archivo:** `frontend/app/(dashboard)/yukyu-reports/page.tsx` línea 105

```typescript
Requiere:
  - Calcular totalUsed desde requests
  - Calcular totalExpired desde balances
  - Mostrar en UI con formato correcto
```

**Total Frontend alta: 4 horas**

---

### 2.2 Backend - Servicios Auxiliares (1 día)

#### B1: Payroll Service - Períodos reales (2h)
**Archivo:** `backend/app/services/payroll/payroll_service.py` líneas 404, 409

```python
Requiere:
  - Leer período de payroll_run en DB
  - Usar fechas reales en cálculos
  - Validar períodos no se solapen
```

#### B2: Timer Card OCR - Fuzzy matching (3h)
**Archivo:** `backend/app/services/timer_card_ocr_service.py` línea 506

```python
Requiere:
  - Integrar EmployeeMatchingService
  - Aplicar fuzzy matching en nombres
  - Filtrar por factory_id
  - Retornar confidence score
```

#### B3: Yukyu - Tracking 5 días (2h)
**Archivo:** `backend/app/services/yukyu_service.py` línea 286

```python
Requiere:
  - Trackear uso por año fiscal
  - Verificar cumple mínimo de 5 días
  - Warning si no cumple
```

**Total Backend alta: 7 horas**

---

### 2.3 Code Quality - Exception Handling (1 día)

#### Q1: Revisar try-except con pass desnudo (6h)
**15+ archivos afectados**

```python
Requiere:
  - Identificar CADA try-except pass
  - Determinar excepciones específicas esperadas
  - Reemplazar "except: pass" con "except SpecificError: pass"
  - Agregar logging cuando sea apropiado
  - Documentar por qué se silencia
```

**Archivos a revisar:**
- `deduction_service.py:501`
- `easyocr_service.py:337, 398`
- `candidates.py:98`
- `employees.py:161, 222, 400`
- `import_export.py:148, 194`
- `timer_cards.py:233`
- `salary.py:327`
- `payroll_validator.py:326, 378`
- Y otros...

**Total Code Quality: 6 horas**

---

## 🟢 FASE 3: MEJORAS Y COMPLETITUD (1-2 semanas) - OPCIONAL

### 3.1 Tests Automatizados (1 semana)

#### T1: Tests Unitarios Backend
```python
Crear:
  - backend/tests/test_assignment_service.py
  - backend/tests/test_deduction_service.py
  - backend/tests/test_payroll_service.py
  - backend/tests/test_apartment_calculations.py

Coverage objetivo: 80%
Tiempo: 20 horas
```

#### T2: Tests E2E Frontend
```typescript
Crear:
  - frontend/tests/e2e/apartments.spec.ts
  - frontend/tests/e2e/assignments.spec.ts
  - frontend/tests/e2e/payroll.spec.ts

Coverage objetivo: 70%
Tiempo: 15 horas
```

**Total Tests: 35 horas (5 días)**

---

### 3.2 Componentes Reutilizables (0.5 semanas)

```typescript
Crear:
  - frontend/components/apartments/assignment-panel.tsx
  - frontend/components/apartments/apartment-stats.tsx
  - frontend/components/apartments/occupancy-chart.tsx

Refactorizar páginas para usar componentes
Tiempo: 12 horas
```

---

### 3.3 Internacionalización (0.5 semanas)

```json
Crear:
  - frontend/locales/ja/apartments.json
  - frontend/locales/en/apartments.json
  - Traducir 200+ strings

Integrar con sistema i18n existente
Tiempo: 12 horas
```

---

### 3.4 Features Opcionales (días variables)

- Hook `useHousingNotifications` (4h)
- Scripts de validación adicionales (8h)
- Scheduler - cleanup logs (2h)
- Sistema de permisos RBAC completo (16h)

---

## 📊 RESUMEN DE ESFUERZO

| Fase | Días | Items | Status |
|------|------|-------|--------|
| **FASE 1: Crítico** | 3-5 | 17 | ⚠️ Requerido |
| **FASE 2: Alta** | 2-3 | 8 | 🟡 Recomendado |
| **FASE 3: Mejoras** | 7-10 | 60+ | 🟢 Opcional |
| **TOTAL MÍNIMO** | **5-8** | **25** | Para 95% |
| **TOTAL COMPLETO** | **12-18** | **85+** | Para 100% |

---

## 🎯 CRITERIOS DE ÉXITO

### Mínimo Viable (FASE 1 + 2)
- ✅ Assignment Service 100% funcional
- ✅ Payroll API 100% funcional
- ✅ Formularios guardan datos realmente
- ✅ Exportaciones funcionan
- ✅ Validaciones críticas implementadas
- ✅ Exception handling mejorado
- ✅ 0 bloqueadores funcionales

**Score objetivo:** 95% implementado

### Completitud Ideal (FASE 1 + 2 + 3)
- ✅ Todo lo anterior
- ✅ Tests 75%+ coverage
- ✅ Componentes reutilizables
- ✅ i18n completo
- ✅ Features opcionales
- ✅ 0 TODOs críticos

**Score objetivo:** 98% implementado

---

## 🚀 ESTRATEGIA DE IMPLEMENTACIÓN

### Orden de Ejecución

**Semana 1: Crítico**
1. Día 1-2: Assignment Service (7 métodos)
2. Día 3-4: Payroll API (7 endpoints)
3. Día 5: Frontend forms + validaciones

**Semana 2: Alta Prioridad**
1. Día 1: Frontend CRUD completo
2. Día 2: Backend servicios auxiliares
3. Día 3: Exception handling

**Semana 3+: Mejoras (opcional)**
1. Tests backend (3 días)
2. Tests E2E (2 días)
3. Componentes + i18n (2 días)

---

## 🔧 HERRAMIENTAS Y RECURSOS

### Para Implementación
- **Backend:** SQLAlchemy ORM, Pydantic validation
- **Frontend:** React Query, Zod validation, Shadcn/ui
- **Testing:** pytest (backend), Playwright (E2E)
- **Docs:** Especificaciones en `docs/features/housing/`

### Referencias Clave
- `APARTAMENTOS_SISTEMA_COMPLETO_V2.md` - Especificación completa
- `APARTAMENTOS_API_V2_DISEÑO_COMPLETO.md` - API specs
- `APARTAMENTOS_EJEMPLOS_USO.md` - Ejemplos de código

---

## 📝 NOTAS IMPORTANTES

### Dependencias
- Assignment Service debe completarse ANTES de tests
- Payroll API debe completarse ANTES de E2E tests
- Exception handling puede hacerse en paralelo

### Riesgos
- **Alto:** Assignment Service afecta todo Apartamentos V2
- **Medio:** Payroll API afecta funcionalidad de nómina
- **Bajo:** Frontend forms (workarounds posibles)

### Recomendaciones
1. **Priorizar FASE 1 completamente** antes de empezar FASE 2
2. **Probar cada implementación** inmediatamente
3. **Commit incremental** después de cada módulo
4. **Documentar decisiones** de implementación
5. **Revisar code review** antes de merge final

---

**Última actualización:** 2025-11-11
**Mantenido por:** Claude Code
**Próxima revisión:** Al completar FASE 1
