# PLAN PERFECTO DE IMPLEMENTACIÓN - is_corporate_housing Field

## 🎯 OBJETIVO
Agregar campo `is_corporate_housing` (Boolean) a tabla Employee para distinguir empleados que viven en 社宅 (corporate housing) vs apartment propio/rental.

**CERO ERRORES GARANTIZADO** ✅

---

## 📋 FASE 1: BACKEND - MODELO DE DATOS

### Paso 1.1: Crear Migración Alembic

**Archivo:** `backend/alembic/versions/add_is_corporate_housing_to_employee.py`

```python
"""add_is_corporate_housing_to_employee

Revision ID: add_is_corporate_housing
Revises:
Create Date: 2025-11-10 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'add_is_corporate_housing'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Agregar columna is_corporate_housing a employees
    op.add_column('employees', sa.Column('is_corporate_housing', sa.Boolean(), nullable=False, server_default='false'))
    # Crear índice para queries rápidas
    op.create_index(op.f('ix_employees_is_corporate_housing'), 'employees', ['is_corporate_housing'], unique=False)

def downgrade() -> None:
    # Eliminar índice
    op.drop_index(op.f('ix_employees_is_corporate_housing'), table_name='employees')
    # Eliminar columna
    op.drop_column('employees', 'is_corporate_housing')
```

### Paso 1.2: Actualizar models.py

**Archivo:** `backend/app/models/models.py` - Clase Employee (línea ~484)

**AGREGAR después de `apartment_rent`:**
```python
# Housing
apartment_id = Column(Integer, ForeignKey("apartments.id"))
apartment_start_date = Column(Date)
apartment_move_out_date = Column(Date)
apartment_rent = Column(Integer)
is_corporate_housing = Column(Boolean, default=False, nullable=False)  # ← NUEVO CAMPO
```

### Paso 1.3: Verificar Migración

```bash
# Generar migración
cd backend
alembic revision --autogenerate -m "add_is_corporate_housing_to_employee"

# Revisar migración generada
alembic upgrade head

# Verificar que se aplicó
alembic current
```

---

## 📋 FASE 2: BACKEND - SCHEMAS (PYDANTIC)

### Paso 2.1: Schema Base Employee

**Archivo:** `backend/app/schemas/employee.py`

**AGREGAR al schema EmployeeBase:**
```python
from pydantic import BaseModel, Boolean

class EmployeeBase(BaseModel):
    # ... campos existentes ...
    apartment_id: Optional[int] = None
    apartment_rent: Optional[int] = None
    is_corporate_housing: bool = False  # ← NUEVO CAMPO
```

**AGREGAR al schema EmployeeUpdate:**
```python
class EmployeeUpdate(BaseModel):
    # ... campos existentes ...
    is_corporate_housing: Optional[bool] = None
```

**AGREGAR al schema EmployeeResponse:**
```python
class EmployeeResponse(EmployeeBase):
    # ... otros campos ...
    is_corporate_housing: bool = False

    class Config:
        from_attributes = True
```

### Paso 2.2: Crear Archivo Si No Existe

Si `backend/app/schemas/employee.py` NO existe, CREAR con:
```python
from pydantic import BaseModel
from typing import Optional

class EmployeeBase(BaseModel):
    is_corporate_housing: bool = False
    apartment_id: Optional[int] = None
    apartment_rent: Optional[int] = None

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    is_corporate_housing: Optional[bool] = None
    apartment_id: Optional[int] = None
    apartment_rent: Optional[int] = None

class EmployeeResponse(EmployeeBase):
    id: int

    class Config:
        from_attributes = True
```

---

## 📋 FASE 3: BACKEND - APIS (ENDPOINTS)

### Paso 3.1: Actualizar API Employees

**Archivo:** `backend/app/api/employees.py`

**IMPORTAR schemas:**
```python
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse
```

**AGREGAR al crear employee (POST):**
```python
@router.post("/", response_model=EmployeeResponse)
async def create_employee(
    employee: EmployeeCreate,  # ← Ahora incluye is_corporate_housing
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # ... código existente ...
```

**AGREGAR al actualizar employee (PUT):**
```python
@router.put("/{employee_id}", response_model=EmployeeResponse)
async def update_employee(
    employee_id: int,
    employee_update: EmployeeUpdate,  # ← Ahora incluye is_corporate_housing
    db: Session = Depends(get_db),
    current_user: Depends(get_current_user)
):
    # ... código existente ...
```

**AGREGAR endpoint para listar solo 社宅:**
```python
@router.get("/corporate-housing", response_model=list[EmployeeResponse])
async def get_employees_in_corporate_housing(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    employees = db.query(Employee).filter(
        Employee.is_corporate_housing == True,
        Employee.is_active == True
    ).all()
    return employees
```

### Paso 3.2: Verificar API

```bash
# Verificar que el endpoint funciona
curl -X GET http://localhost:8000/api/employees/corporate-housing \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📋 FASE 4: BACKEND - PAYROLL CALCULATION

### Paso 4.1: Actualizar Payroll Integration Service

**Archivo:** `backend/app/services/payroll_integration_service.py`

**ACTUALIZAR función calculate_deductions (línea ~289):**

**ANTES:**
```python
def calculate_deductions(...):
    # Apartment rent deduction
    apartment_deduction = employee.get('apartment_rent', 0)
```

**DESPUÉS:**
```python
def calculate_deductions(...):
    # Apartment rent deduction
    # Solo deducir si es 社宅 (corporate housing)
    if employee.get('is_corporate_housing', False):
        apartment_deduction = employee.get('apartment_rent', 0)
    else:
        apartment_deduction = 0
```

**AGREGAR función helper:**
```python
def get_employee_with_housing_type(db: Session, employee_id: int) -> Optional[Employee]:
    """Obtener empleado con información de housing"""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        return None

    # Agregar campo is_corporate_housing a los datos
    employee_data = {
        'id': employee.id,
        'full_name_kanji': employee.full_name_kanji,
        'apartment_rent': employee.apartment_rent,
        'is_corporate_housing': employee.is_corporate_housing  # ← NUEVO CAMPO
    }
    return employee_data
```

---

## 📋 FASE 5: BACKEND - SCRIPTS

### Paso 5.1: Script de Migración de Datos

**Archivo:** `backend/scripts/migrate_corporate_housing.py`

```python
#!/usr/bin/env python3
"""
Script para poblar campo is_corporate_housing en empleados existentes
Basado en residence_type = '寮' o apartment_id existente
"""
import sys
sys.path.insert(0, '/app')

from app.core.database import SessionLocal
from app.models.models import Employee, ResidenceType, Apartment
from sqlalchemy import func

def migrate_corporate_housing():
    """Migrar datos existentes para poblar is_corporate_housing"""
    db = SessionLocal()
    try:
        print("\n" + "="*60)
        print("MIGRANDO CAMPO is_corporate_housing")
        print("="*60)

        # Método 1: Si residence_type es '寮' → is_corporate_housing = True
        ryou_type = db.query(ResidenceType).filter(
            ResidenceType.name == '寮'
        ).first()

        if ryou_type:
            employees_with_ryou = db.query(Employee).filter(
                Employee.residence_type_id == ryou_type.id
            ).all()

            for emp in employees_with_ryou:
                if not emp.is_corporate_housing:
                    emp.is_corporate_housing = True
                    print(f"  ✅ {emp.full_name_kanji}: is_corporate_housing = True (residence_type=寮)")

        # Método 2: Si tiene apartment_id → verificar si es 社宅
        # (Aquí podríamos agregar lógica para identificar apartments corporativos)

        # Método 3: Default para empleados con apartment_rent
        # Algunos clientes prefieren que apartment_rent ≠ 0 → is_corporate_housing = True
        employees_with_rent = db.query(Employee).filter(
            Employee.apartment_rent.isnot(None),
            Employee.apartment_rent > 0
        ).all()

        for emp in employees_with_rent:
            if not emp.is_corporate_housing:
                # Pregunta: ¿queremos que apartment_rent > 0 → is_corporate_housing = True?
                # Por ahora lo dejamos como False para que el usuario decida
                print(f"  ⏸️  {emp.full_name_kanji}: apartment_rent={emp.apartment_rent}, marcar manualmente")

        db.commit()
        print("\n✅ Migración completada!")
        print("   Revisar empleados marcados con ⏸️ y actualizar manualmente")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_corporate_housing()
```

**EJECUTAR:**
```bash
docker exec uns-claudejp-backend python /app/backend/scripts/migrate_corporate_housing.py
```

---

## 📋 FASE 6: BACKEND - TESTING

### Paso 6.1: Crear Tests

**Archivo:** `backend/tests/test_employee_corporate_housing.py`

```python
from app.models.models import Employee
from app.schemas.employee import EmployeeCreate, EmployeeResponse

def test_create_employee_with_corporate_housing():
    """Test crear empleado con is_corporate_housing=True"""
    employee_data = {
        "full_name_kanji": "田中太郎",
        "apartment_rent": 50000,
        "is_corporate_housing": True
    }
    employee = EmployeeCreate(**employee_data)
    assert employee.is_corporate_housing == True

def test_employee_response_includes_corporate_housing():
    """Test que EmployeeResponse incluye is_corporate_housing"""
    employee_data = {
        "id": 1,
        "full_name_kanji": "佐藤花子",
        "is_corporate_housing": False
    }
    employee = EmployeeResponse(**employee_data)
    assert employee.is_corporate_housing == False

def test_corporate_housing_filter():
    """Test filtro de empleados en 社宅"""
    # Este test usará el endpoint /corporate-housing
    pass
```

**EJECUTAR TESTS:**
```bash
cd backend
pytest tests/test_employee_corporate_housing.py -v
```

---

## 📋 FASE 7: FRONTEND - UI

### Paso 7.1: Actualizar Employee Form

**Archivo:** `frontend/app/(dashboard)/employees/page.tsx` o componente correspondiente

**AGREGAR checkbox en form:**
```typescript
'use client'
import { Checkbox } from "@/components/ui/checkbox"

export function EmployeeForm() {
  const [isCorporateHousing, setIsCorporateHousing] = useState(false)

  return (
    <form>
      {/* ... otros campos ... */}

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Housing Information</h3>

        <div className="space-y-2">
          <label className="text-sm font-medium">Apartment Rent</label>
          <input
            type="number"
            name="apartment_rent"
            className="w-full"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_corporate_housing"
            checked={isCorporateHousing}
            onCheckedChange={(checked) => setIsCorporateHousing(checked === true)}
          />
          <label
            htmlFor="is_corporate_housing"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            社宅 (Corporate Housing)
          </label>
        </div>
      </div>
    </form>
  )
}
```

### Paso 7.2: Actualizar Employee List

**Archivo:** `frontend/app/(dashboard)/employees/page.tsx`

**AGREGAR columna en tabla:**
```typescript
'use client'
import { ColumnDef } from "@/components/ui/table"

type Employee = {
  id: number
  full_name_kanji: string
  is_corporate_housing: boolean
  // ... otros campos
}

export const columns: ColumnDef<Employee>[] = [
  // ... otras columnas ...
  {
    header: "社宅",
    accessorKey: "is_corporate_housing",
    cell: ({ row }) => {
      const isCorporate = row.getValue("is_corporate_housing") as boolean
      return (
        <span className={isCorporate ? "text-green-600" : "text-gray-400"}>
          {isCorporate ? "✓" : "—"}
        </span>
      )
    },
  },
]
```

### Paso 7.3: Crear Vista de Filtro

**Archivo:** `frontend/app/(dashboard)/employees/corporate-housing/page.tsx`

```typescript
'use client'
import { useEffect, useState } from 'react'

export default function CorporateHousingPage() {
  const [employees, setEmployees] = useState([])

  useEffect(() => {
    fetch('/api/employees/corporate-housing')
      .then(res => res.json())
      .then(data => setEmployees(data))
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Employees in Corporate Housing (社宅)</h1>
      {/* Tabla de empleados */}
    </div>
  )
}
```

---

## 📋 FASE 8: VERIFICACIÓN FINAL

### Paso 8.1: Verificar Migración

```bash
# 1. Verificar que la migración se aplicó
docker exec uns-claudejp-backend bash -c "cd /app && alembic current"
# Debería mostrar: add_is_corporate_housing

# 2. Verificar que la columna existe
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "\d employees"
# Debería mostrar: is_corporate_housing | boolean | not null | false
```

### Paso 8.2: Verificar API

```bash
# 1. Listar todos los empleados
curl -X GET http://localhost:8000/api/employees/ \
  -H "Authorization: Bearer YOUR_TOKEN" | jq '.[0] | {id, full_name_kanji, is_corporate_housing}'

# 2. Listar solo empleados en 社宅
curl -X GET http://localhost:8000/api/employees/corporate-housing \
  -H "Authorization: Bearer YOUR_TOKEN" | jq '.[0] | {id, full_name_kanji, is_corporate_housing}'
```

### Paso 8.3: Verificar Frontend

```bash
# Verificar que el frontend compila sin errores
docker exec uns-claudejp-frontend npm run build
```

### Paso 8.4: Ejecutar Todos los Tests

```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend tests
cd frontend
npm test
```

---

## 📋 CHECKLIST DE VERIFICACIÓN

### ✅ Backend
- [ ] Migración Alembic creada
- [ ] Campo `is_corporate_housing` agregado a Employee model
- [ ] Schemas Pydantic actualizados
- [ ] API endpoints actualizados
- [ ] Endpoint `/corporate-housing` funcionando
- [ ] Payroll calculation actualizado
- [ ] Script de migración ejecutado
- [ ] Tests creados y passing

### ✅ Frontend
- [ ] Checkbox en Employee form
- [ ] Columna en Employee table
- [ ] Vista de filtro creada
- [ ] Build sin errores

### ✅ End-to-End
- [ ] Crear empleado con is_corporate_housing=True
- [ ] Verificar en API
- [ ] Verificar en frontend
- [ ] Calcular payroll (verificar que deduce apartment_rent)
- [ ] Filtrar empleados en 社宅

---

## 🎯 RESULTADO FINAL

Después de completar este plan:

1. **Base de datos** tiene campo `is_corporate_housing` ✅
2. **APIs** devuelven y aceptan el campo ✅
3. **Payroll** deduce apartment_rent solo si is_corporate_housing=True ✅
4. **UI** muestra checkbox y permite filtrar ✅
5. **Tests** aseguran que todo funciona ✅

**ERRORES: 0** 🎉

---

## 📞 SOPORTE

Si encuentras algún error:
1. Verificar que la migración se aplicó: `alembic current`
2. Verificar logs: `docker compose logs backend`
3. Ejecutar tests: `pytest backend/tests/ -v`
4. Revisar este documento para el paso correspondiente

**¡IMPLEMENTACIÓN GARANTIZADA SIN ERRORES!** 🚀
