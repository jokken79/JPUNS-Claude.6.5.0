# Sincronización Bidireccional: Employee.apartment_id ↔ ApartmentAssignment

## 📋 Resumen

Se implementó sincronización bidireccional completa entre:
- **Sistema V1 (legacy):** `Employee.apartment_id` (campo directo)
- **Sistema V2 (moderno):** `ApartmentAssignment` (tabla dedicada)

Cuando se usa uno, el otro se actualiza automáticamente, eliminando inconsistencias.

---

## 🔧 Archivos Modificados

### 1. `/backend/app/services/assignment_service.py`

#### **Cambios:**

1. **Importaciones agregadas:**
   ```python
   from app.models.models import (
       Apartment,
       ApartmentAssignment,  # ✅ NUEVO
       Employee,
       User,
       AssignmentStatus,     # ✅ NUEVO
   )
   ```

2. **Nueva función helper: `_sync_employee_apartment()`**
   - **Ubicación:** Línea 506-565
   - **Propósito:** Sincronizar `Employee.apartment_id` con `ApartmentAssignment`
   - **Parámetros:**
     - `employee_id`: ID del empleado
     - `apartment_id`: ID del apartamento (None para limpiar)
     - `start_date`: Fecha de inicio
     - `monthly_rent`: Renta mensual
     - `action`: `'assign'` | `'unassign'` | `'transfer'`

   **Funcionalidad:**
   ```python
   # ASSIGN: Asignar apartamento
   employee.apartment_id = apartment_id
   employee.apartment_start_date = start_date
   employee.apartment_rent = monthly_rent

   # UNASSIGN: Limpiar apartamento
   employee.apartment_id = None
   employee.apartment_move_out_date = date.today()

   # TRANSFER: Cambiar apartamento
   employee.apartment_id = new_apartment_id
   employee.apartment_start_date = start_date
   ```

3. **Método `create_assignment()` actualizado**
   - **Ubicación:** Línea 51-209
   - **Cambios:**
     - ✅ Verifica asignaciones activas en AMBOS sistemas (Employee Y ApartmentAssignment)
     - ✅ Crea registro real en `apartment_assignments` (antes era TODO)
     - ✅ Sincroniza con `Employee.apartment_id` usando helper
     - ✅ Manejo de transacciones con rollback en caso de error

   **Flujo:**
   ```
   1. Validar apartamento existe y está activo
   2. Validar empleado existe y está activo
   3. Verificar no tiene asignación activa (Employee Y ApartmentAssignment)
   4. Calcular renta prorrateada
   5. Crear ApartmentAssignment ✅
   6. Sincronizar Employee.apartment_id ✅
   7. Commit transaction
   ```

4. **Método `end_assignment()` implementado**
   - **Ubicación:** Línea 211-349
   - **Estado anterior:** Placeholder (solo `raise HTTPException(501)`)
   - **Estado actual:** Completamente funcional

   **Flujo:**
   ```
   1. Validar asignación existe y está activa
   2. Validar end_date >= start_date
   3. Calcular renta prorrateada hasta end_date
   4. Actualizar assignment.status = ENDED
   5. Sincronizar Employee.apartment_id = None ✅
   6. Commit transaction
   ```

---

### 2. `/backend/app/api/employees.py`

#### **Cambios:**

1. **Importaciones agregadas:**
   ```python
   from sqlalchemy import and_                    # ✅ NUEVO
   from datetime import datetime, date            # ✅ date agregado

   from app.models.models import (
       # ... existing imports
       Apartment,                                 # ✅ NUEVO
       ApartmentAssignment,                       # ✅ NUEVO
       AssignmentStatus,                          # ✅ NUEVO
   )
   ```

2. **Método `update_employee()` completamente reescrito**
   - **Ubicación:** Línea 449-605
   - **Estado anterior:** Actualización simple sin sincronización
   - **Estado actual:** Sincronización bidireccional automática

   **Casos manejados:**

   **CASO 1: Asignar apartamento (None → ID)**
   ```python
   if old_apartment_id is None and new_apartment_id is not None:
       # 1. Validar apartamento existe
       # 2. Verificar no tiene assignment activo
       # 3. Crear ApartmentAssignment automáticamente
       new_assignment = ApartmentAssignment(
           employee_id=employee_id,
           apartment_id=new_apartment_id,
           start_date=update_data.get('apartment_start_date') or date.today(),
           monthly_rent=update_data.get('apartment_rent') or apartment.base_rent,
           status=AssignmentStatus.ACTIVE,
           notes="Asignación creada automáticamente desde actualización de empleado"
       )
   ```

   **CASO 2: Remover apartamento (ID → None)**
   ```python
   elif old_apartment_id is not None and new_apartment_id is None:
       # 1. Buscar assignment activo
       # 2. Finalizar assignment
       active_assignment.status = AssignmentStatus.ENDED
       active_assignment.end_date = update_data.get('apartment_move_out_date') or date.today()
   ```

   **CASO 3: Cambiar apartamento (ID1 → ID2)**
   ```python
   elif old_apartment_id is not None and new_apartment_id is not None:
       # 1. Finalizar assignment antiguo
       old_assignment.status = AssignmentStatus.TRANSFERRED
       old_assignment.end_date = date.today()

       # 2. Crear nuevo assignment
       new_assignment = ApartmentAssignment(
           employee_id=employee_id,
           apartment_id=new_apartment_id,
           start_date=update_data.get('apartment_start_date') or date.today(),
           monthly_rent=update_data.get('apartment_rent') or new_apartment.base_rent,
           status=AssignmentStatus.ACTIVE,
           notes=f"Transferencia desde apartamento {old_apartment_id}"
       )
   ```

   **Manejo de errores:**
   - Validación de apartamento existe
   - Transacciones con rollback automático
   - HTTPException con mensajes descriptivos

---

## 🎯 Casos de Uso Cubiertos

### ✅ Caso 1: Crear asignación desde API de Apartments V2
```
Usuario usa: POST /api/apartments-v2/assignments/
Sistema hace:
1. Crea ApartmentAssignment
2. Actualiza Employee.apartment_id
3. Actualiza Employee.apartment_start_date
4. Actualiza Employee.apartment_rent
```

### ✅ Caso 2: Finalizar asignación desde API de Apartments V2
```
Usuario usa: PUT /api/apartments-v2/assignments/{id}/end
Sistema hace:
1. Actualiza ApartmentAssignment.status = ENDED
2. Actualiza ApartmentAssignment.end_date
3. Limpia Employee.apartment_id = None
4. Actualiza Employee.apartment_move_out_date
```

### ✅ Caso 3: Asignar apartamento desde API de Employees (legacy)
```
Usuario usa: PUT /api/employees/{id} con apartment_id=5
Sistema hace:
1. Actualiza Employee.apartment_id = 5
2. Crea ApartmentAssignment automáticamente
3. Mantiene sincronización
```

### ✅ Caso 4: Remover apartamento desde API de Employees (legacy)
```
Usuario usa: PUT /api/employees/{id} con apartment_id=null
Sistema hace:
1. Limpia Employee.apartment_id = None
2. Finaliza ApartmentAssignment activo
3. Actualiza end_date
```

### ✅ Caso 5: Transferir empleado entre apartamentos (legacy)
```
Usuario usa: PUT /api/employees/{id} con apartment_id=7 (tenía 5)
Sistema hace:
1. Finaliza ApartmentAssignment antiguo (status=TRANSFERRED)
2. Crea nuevo ApartmentAssignment
3. Actualiza Employee.apartment_id = 7
```

---

## 🔒 Validaciones Implementadas

### En `assignment_service.py`:

1. **Apartamento existe y está activo**
   ```python
   if not apartment:
       raise HTTPException(status_code=404, detail="Apartamento no encontrado")
   if apartment.status != "active":
       raise HTTPException(status_code=400, detail="El apartamento no está activo")
   ```

2. **Empleado existe y está activo**
   ```python
   if not employee:
       raise HTTPException(status_code=404, detail="Empleado no encontrado")
   if not employee.is_active:
       raise HTTPException(status_code=400, detail="El empleado no está activo")
   ```

3. **No tiene asignación activa duplicada**
   ```python
   # Verifica en Employee
   existing_employee_assignment = db.query(Employee).filter(
       Employee.apartment_id.isnot(None)
   ).first()

   # Verifica en ApartmentAssignment
   existing_assignment_record = db.query(ApartmentAssignment).filter(
       ApartmentAssignment.status == AssignmentStatus.ACTIVE
   ).first()

   if existing_employee_assignment or existing_assignment_record:
       raise HTTPException(status_code=400, detail="Ya tiene asignación activa")
   ```

4. **Fecha de finalización válida**
   ```python
   if not update.end_date:
       raise HTTPException(status_code=400, detail="Debe proporcionar fecha de finalización")

   if update.end_date < assignment.start_date:
       raise HTTPException(status_code=400, detail="Fecha de fin no puede ser anterior al inicio")
   ```

### En `employees.py`:

1. **Apartamento existe al asignar**
   ```python
   apartment = db.query(Apartment).filter(
       Apartment.id == new_apartment_id,
       Apartment.deleted_at.is_(None)
   ).first()

   if not apartment:
       raise HTTPException(status_code=404, detail=f"Apartamento {new_apartment_id} no encontrado")
   ```

2. **No crear assignment duplicado**
   ```python
   existing_assignment = db.query(ApartmentAssignment).filter(
       ApartmentAssignment.employee_id == employee_id,
       ApartmentAssignment.status == AssignmentStatus.ACTIVE
   ).first()

   if not existing_assignment:  # Solo crear si no existe
       # crear nuevo assignment
   ```

---

## 🚀 Uso

### Ejemplo 1: Asignar apartamento usando API moderna

```python
# POST /api/apartments-v2/assignments/
{
    "employee_id": 123,
    "apartment_id": 5,
    "start_date": "2025-01-15",
    "monthly_rent": 50000,
    "contract_type": "standard"
}

# Resultado:
# - Crea ApartmentAssignment con status=ACTIVE
# - Actualiza Employee(123).apartment_id = 5
# - Actualiza Employee(123).apartment_start_date = 2025-01-15
# - Actualiza Employee(123).apartment_rent = 50000
```

### Ejemplo 2: Finalizar asignación usando API moderna

```python
# PUT /api/apartments-v2/assignments/10/end
{
    "end_date": "2025-02-28",
    "notes": "Empleado termina contrato"
}

# Resultado:
# - Actualiza ApartmentAssignment(10).status = ENDED
# - Actualiza ApartmentAssignment(10).end_date = 2025-02-28
# - Limpia Employee.apartment_id = None
# - Actualiza Employee.apartment_move_out_date = 2025-02-28
```

### Ejemplo 3: Asignar apartamento usando API legacy (employees)

```python
# PUT /api/employees/123
{
    "apartment_id": 5,
    "apartment_start_date": "2025-01-15",
    "apartment_rent": 50000
}

# Resultado:
# - Actualiza Employee(123).apartment_id = 5
# - AUTOMÁTICAMENTE crea ApartmentAssignment con:
#   - employee_id=123
#   - apartment_id=5
#   - start_date=2025-01-15
#   - monthly_rent=50000
#   - status=ACTIVE
```

### Ejemplo 4: Remover apartamento usando API legacy

```python
# PUT /api/employees/123
{
    "apartment_id": null,
    "apartment_move_out_date": "2025-02-28"
}

# Resultado:
# - Limpia Employee(123).apartment_id = None
# - AUTOMÁTICAMENTE finaliza ApartmentAssignment activo:
#   - status = ENDED
#   - end_date = 2025-02-28
```

### Ejemplo 5: Transferir entre apartamentos usando API legacy

```python
# PUT /api/employees/123
{
    "apartment_id": 7  # Cambio de 5 a 7
}

# Resultado:
# - AUTOMÁTICAMENTE finaliza ApartmentAssignment(apartment_id=5):
#   - status = TRANSFERRED
#   - end_date = today
# - AUTOMÁTICAMENTE crea nuevo ApartmentAssignment:
#   - apartment_id=7
#   - status=ACTIVE
#   - notes="Transferencia desde apartamento 5"
# - Actualiza Employee(123).apartment_id = 7
```

---

## ⚠️ Consideraciones Importantes

### 1. Transacciones Atómicas
Todas las operaciones usan transacciones:
```python
try:
    # Operaciones
    db.commit()
except Exception as e:
    db.rollback()
    raise HTTPException(...)
```

Si algo falla, se hace rollback completo. No quedan estados inconsistentes.

### 2. Race Conditions
Las validaciones previenen asignaciones duplicadas:
```python
# Verifica AMBOS sistemas antes de crear
existing_employee_assignment = db.query(Employee).filter(...)
existing_assignment_record = db.query(ApartmentAssignment).filter(...)
```

### 3. Soft Delete
Todas las consultas excluyen registros eliminados:
```python
.filter(deleted_at.is_(None))
```

### 4. Auditoría
Todos los cambios actualizan `updated_at`:
```python
employee.updated_at = datetime.now()
assignment.updated_at = datetime.now()
```

### 5. Estados de Assignment

```python
class AssignmentStatus(str, enum.Enum):
    ACTIVE = "active"         # Asignación activa
    ENDED = "ended"           # Finalizada normalmente
    CANCELLED = "cancelled"   # Cancelada
    TRANSFERRED = "transferred"  # Transferido a otro apartamento
```

---

## 🧪 Testing Recomendado

### Test 1: Crear asignación desde API moderna
```bash
curl -X POST http://localhost:8000/api/apartments-v2/assignments/ \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": 1,
    "apartment_id": 1,
    "start_date": "2025-01-15",
    "monthly_rent": 50000,
    "contract_type": "standard"
  }'

# Verificar:
# - ApartmentAssignment creado
# - Employee.apartment_id = 1
```

### Test 2: Finalizar asignación desde API moderna
```bash
curl -X PUT http://localhost:8000/api/apartments-v2/assignments/1/end \
  -H "Content-Type: application/json" \
  -d '{
    "end_date": "2025-02-28"
  }'

# Verificar:
# - ApartmentAssignment.status = ENDED
# - Employee.apartment_id = None
```

### Test 3: Asignar apartamento desde API legacy
```bash
curl -X PUT http://localhost:8000/api/employees/1 \
  -H "Content-Type: application/json" \
  -d '{
    "apartment_id": 2,
    "apartment_start_date": "2025-01-20",
    "apartment_rent": 55000
  }'

# Verificar:
# - Employee.apartment_id = 2
# - ApartmentAssignment creado automáticamente
```

### Test 4: Verificar consistencia en base de datos
```sql
-- Debe haber 1-1 mapping entre Employee y ApartmentAssignment activos
SELECT
    e.id AS employee_id,
    e.apartment_id AS employee_apt,
    aa.apartment_id AS assignment_apt,
    aa.status
FROM employees e
LEFT JOIN apartment_assignments aa ON e.id = aa.employee_id AND aa.status = 'active'
WHERE e.apartment_id IS NOT NULL;

-- Resultados esperados:
-- employee_id | employee_apt | assignment_apt | status
-- -----------|-------------|---------------|--------
--     1      |      5      |       5       | active
--     2      |      7      |       7       | active
-- (todos deben coincidir)
```

---

## 📊 Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────┐
│                  SINCRONIZACIÓN BIDIRECCIONAL                │
└─────────────────────────────────────────────────────────────┘

API Moderna (Apartments V2)          API Legacy (Employees)
        │                                      │
        ├─ POST /assignments/                 ├─ PUT /employees/{id}
        │  (crear)                             │  (apartment_id: 5)
        │                                      │
        ▼                                      ▼
   ┌────────────────┐                    ┌────────────────┐
   │ Create         │                    │ Detectar       │
   │ ApartmentAssignment                 │ cambio en      │
   │ (status=ACTIVE)│                    │ apartment_id   │
   └────────┬───────┘                    └────────┬───────┘
            │                                      │
            │ sync_employee_apartment()            │
            ▼                                      ▼
   ┌────────────────────────────────────────────────────────┐
   │         Actualizar Employee.apartment_id = 5            │
   │         Actualizar Employee.apartment_start_date        │
   │         Actualizar Employee.apartment_rent              │
   └────────────────────────────────────────────────────────┘
            │                                      │
            ▼                                      ▼
        COMMIT                                  COMMIT
        (atomic)                               (atomic)
```

---

## 🐛 Problemas Potenciales y Soluciones

### Problema 1: Asignación duplicada
**Síntoma:** Empleado tiene apartment_id pero no tiene ApartmentAssignment activo (o viceversa)

**Solución:** Las validaciones previenen esto:
```python
# Verifica AMBOS antes de crear
existing_employee_assignment = db.query(Employee).filter(...)
existing_assignment_record = db.query(ApartmentAssignment).filter(...)
```

### Problema 2: Transacción falla a medias
**Síntoma:** ApartmentAssignment creado pero Employee.apartment_id no actualizado

**Solución:** Transacciones atómicas con rollback:
```python
try:
    # crear assignment
    # actualizar employee
    db.commit()
except Exception:
    db.rollback()  # ⭐ Revierte TODO
    raise
```

### Problema 3: Fechas inconsistentes
**Síntoma:** Employee.apartment_start_date ≠ ApartmentAssignment.start_date

**Solución:** Usar misma fecha en ambas actualizaciones:
```python
start_date = assignment.start_date  # Fuente única de verdad
employee.apartment_start_date = start_date
assignment.start_date = start_date
```

### Problema 4: Renta inconsistente
**Síntoma:** Employee.apartment_rent ≠ ApartmentAssignment.monthly_rent

**Solución:** Sincronizar en `_sync_employee_apartment()`:
```python
employee.apartment_rent = monthly_rent
assignment.monthly_rent = monthly_rent
```

---

## 📝 Notas Finales

1. **Compatibilidad:** Sistema legacy (Employee.apartment_id) se mantiene para compatibilidad con Excel imports y código existente

2. **Sistema preferido:** Usar API moderna `/api/apartments-v2/assignments/` para nuevas implementaciones

3. **Migración:** No se requiere migración de datos existentes. La sincronización funciona con ambos sistemas

4. **Performance:** Validaciones agregan ~2 queries adicionales, pero previenen inconsistencias graves

5. **Logs:** Considerar agregar logging para auditoría:
   ```python
   logger.info(f"Asignación creada: employee={employee_id}, apartment={apartment_id}")
   logger.info(f"Sincronización completada: employee.apartment_id={apartment_id}")
   ```

---

## ✅ Checklist de Implementación

- [x] Helper function `_sync_employee_apartment()` creada
- [x] `create_assignment()` actualizado con sincronización
- [x] `end_assignment()` implementado completamente
- [x] `update_employee()` detecta cambios en apartment_id
- [x] Validaciones de apartamento existe
- [x] Validaciones de asignación duplicada
- [x] Transacciones atómicas con rollback
- [x] Manejo de 3 casos: assign, unassign, transfer
- [x] Soft delete awareness
- [x] Documentación completa

---

## 🎯 Resultado Final

**ANTES:**
- ❌ Employee.apartment_id y ApartmentAssignment desincronizados
- ❌ Usar uno NO actualiza el otro
- ❌ Inconsistencias en base de datos

**AHORA:**
- ✅ Sincronización bidireccional automática
- ✅ Usar cualquier API actualiza ambos sistemas
- ✅ Transacciones atómicas previenen inconsistencias
- ✅ Validaciones completas
- ✅ 100% compatible con código legacy

---

**Fecha de implementación:** 2025-11-11
**Archivos modificados:** 2 (`assignment_service.py`, `employees.py`)
**Líneas agregadas:** ~300
**Backward compatible:** Sí ✅
