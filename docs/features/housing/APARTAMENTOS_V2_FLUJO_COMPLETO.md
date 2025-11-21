# 🏢 Apartamentos V2 - Flujo Completo de Implementación

**Fecha:** 2025-11-11
**Versión:** 2.0
**Sistema:** UNS-ClaudeJP 5.4.1
**Autor:** Claude Code

---

## 🎯 Índice

1. [Visión General](#visión-general)
2. [Flujo de Instalación](#flujo-de-instalación)
3. [Flujo de Datos](#flujo-de-datos)
4. [Endpoints de API](#endpoints-de-api)
5. [Verificación del Sistema](#verificación-del-sistema)
6. [Troubleshooting](#troubleshooting)
7. [Testing](#testing)

---

## 📋 Visión General

### ¿Qué es Apartamentos V2?

Sistema completo de gestión de vivienda corporativa para empleados temporales que incluye:

**4 Tablas Principales:**
1. **apartments** - Inventario de apartamentos (449 registros)
2. **apartment_assignments** - Asignaciones de empleados a apartamentos
3. **additional_charges** - Cargos adicionales (limpieza, reparaciones)
4. **rent_deductions** - Deducciones mensuales de nómina

**Capacidades:**
- ✅ Asignación automática de empleados
- ✅ Cálculo de renta prorrateada (por día)
- ✅ Transferencias entre apartamentos
- ✅ Generación automática de deducciones mensuales
- ✅ Reportes de ocupación y costos
- ✅ Sincronización bidireccional Employee ↔ ApartmentAssignment

---

## 🔄 Flujo de Instalación

### Paso 1: Migraciones (Alembic)

**Archivo:** `backend/alembic/versions/5e6575b9bf1b_add_apartment_system_v2_*.py`

**Qué hace:**
```sql
-- Crea 4 tablas:
CREATE TABLE apartments (
    id SERIAL PRIMARY KEY,
    apartment_code VARCHAR(100) UNIQUE NOT NULL,
    address TEXT,
    base_rent DECIMAL(10,2),
    capacity INTEGER,
    -- ... 20+ campos más
);

CREATE TABLE apartment_assignments (...);
CREATE TABLE additional_charges (...);
CREATE TABLE rent_deductions (...);
```

**Cuándo:** Durante `docker-compose up` → servicio `importer` → Step 1

**Verificación:**
```bash
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "\dt"
# Debe listar: apartments, apartment_assignments, additional_charges, rent_deductions
```

---

### Paso 2: Importación de Datos

**Script:** `backend/scripts/create_apartments_from_employees.py`

**Flujo:**
```
1. Lee: config/employee_master.xlsm
   ↓
2. Extrae columna: ｱﾊﾟｰﾄ (apartamento)
   ↓
3. Obtiene apartamentos únicos
   ↓
4. Cuenta empleados por apartamento
   ↓
5. Crea registros en tabla apartments
   ↓
6. Asigna capacidad = empleados + 2
```

**Ejemplo de datos creados:**
```python
Apartment(
    apartment_code="サンハイツ101",
    address="(Pendiente - actualizar dirección)",
    base_rent=45000,  # ¥45,000 default
    capacity=4,       # 2 empleados actuales + 2
    is_available=True,
    notes="Auto-creado desde importación. 2 empleado(s) actual."
)
```

**Cuándo:** Durante `docker-compose up` → servicio `importer` → Step 3

**Salida esperada:**
```
CREANDO APARTAMENTOS DESDE EXCEL
=====================================
1️⃣ Leyendo employee_master.xlsm...
2️⃣ Extrayendo apartamentos únicos...
   Encontrados: 449 apartamentos únicos
3️⃣ Creando registros de apartamentos...
   Procesados 50...
   Procesados 100...
   ...
✅ RESULTADO:
   ✓ Creados: 449 apartamentos
```

**Verificación:**
```bash
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT COUNT(*) FROM apartments;"
# Debe mostrar: 449
```

---

### Paso 3: Importación de Empleados

**Script:** `backend/scripts/import_data.py`

**Qué hace:**
1. Lee Excel con empleados
2. Para cada empleado con campo ｱﾊﾟｰﾄ:
   - Busca apartment_code en tabla apartments
   - Asigna Employee.apartment_id = apartment.id
3. Crea Employee en base de datos

**Sincronización bidireccional:**
```python
# En backend/app/services/assignment_service.py
def _sync_employee_apartment(db, employee_id, apartment_id, action):
    """
    Cuando se crea/actualiza Employee.apartment_id:
    → Automáticamente crea ApartmentAssignment

    Cuando se crea/actualiza ApartmentAssignment:
    → Automáticamente actualiza Employee.apartment_id
    """
```

**Cuándo:** Durante `docker-compose up` → servicio `importer` → Step 4

---

## 🔄 Flujo de Datos

### Flujo 1: Asignación Inicial de Empleado

```
1. Usuario abre: /apartments/[id]/assign

2. Frontend llama:
   GET /api/apartments-v2/apartments/{id}
   → Obtiene apartment con capacidad y ocupación actual

3. Usuario selecciona empleado y fecha de inicio

4. Frontend calcula renta prorrateada:
   POST /api/apartments-v2/calculate/prorated
   {
     "apartment_id": 15,
     "start_date": "2025-11-15"
   }

   → Backend responde:
   {
     "monthly_rent": 45000,
     "days_in_month": 30,
     "days_occupied": 16,
     "daily_rate": 1500,
     "prorated_rent": 24000,
     "is_prorated": true
   }

5. Frontend crea asignación:
   POST /api/apartments-v2/assignments
   {
     "apartment_id": 15,
     "employee_id": 42,
     "start_date": "2025-11-15",
     "monthly_rent": 45000,
     "prorated_rent": 24000,
     ...
   }

6. Backend (assignment_service.py):
   a. Crea ApartmentAssignment
   b. Llama _sync_employee_apartment()
   c. Actualiza Employee.apartment_id = 15
   d. Retorna AssignmentResponse

7. Frontend muestra confirmación
```

---

### Flujo 2: Transferencia Entre Apartamentos

```
1. Usuario hace clic en "Transferir" en UI

2. Frontend llama:
   POST /api/apartments-v2/assignments/transfer
   {
     "employee_id": 42,
     "current_apartment_id": 15,
     "new_apartment_id": 28,
     "transfer_date": "2025-11-20"
   }

3. Backend (assignment_service.py):
   a. Busca asignación actual (apartment 15)
   b. Calcula renta prorrateada hasta transfer_date
   c. Termina asignación actual:
      - end_date = "2025-11-20"
      - prorated_rent = ¥10,000 (20 días)
      - cleaning_fee = ¥20,000
   d. Calcula renta nueva desde transfer_date
   e. Crea nueva asignación (apartment 28):
      - start_date = "2025-11-20"
      - prorated_rent = ¥15,000 (11 días restantes)
   f. Actualiza Employee.apartment_id = 28

4. Backend responde TransferResponse:
   {
     "ended_assignment": {...},
     "new_assignment": {...},
     "total_monthly_cost": 45000,  // 10k + 20k + 15k
     "breakdown": {
       "old_apartment_prorated": 10000,
       "cleaning_fee": 20000,
       "new_apartment_prorated": 15000,
       "total": 45000
     }
   }

5. Frontend muestra breakdown de costos
```

---

### Flujo 3: Generación Mensual de Deducciones

```
1. Admin abre: /apartments/deductions/generate
   Selecciona: Mes 12, Año 2025

2. Frontend llama:
   POST /api/apartments-v2/deductions/generate
   { "year": 2025, "month": 12 }

3. Backend (deduction_service.py):
   a. Busca TODAS las asignaciones activas en diciembre 2025
   b. Para cada asignación:
      - Si tiene deducción creada → skip
      - Si no:
        i.   Suma base_rent + additional_charges
        ii.  Calcula total_deduction
        iii. Crea RentDeduction con status=PENDING

   c. Retorna:
      {
        "created": 120,
        "skipped": 5,
        "year": 2025,
        "month": 12,
        "total_amount": 5400000
      }

4. Admin exporta a CSV:
   GET /api/apartments-v2/deductions/export/2025/12

   → Backend genera CSV:
   employee_id,employee_name,apartment_code,base_rent,additional_charges,total_deduction
   42,田中太郎,サンハイツ101,45000,20000,65000
   ...

5. Admin importa CSV a sistema de nómina
```

---

## 🔌 Endpoints de API

### Base URL: `/api/apartments-v2`

#### Apartments

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/apartments` | Lista con filtros | ✅ Required |
| GET | `/apartments/{id}` | Detalle con stats | ✅ Required |
| POST | `/apartments` | Crear apartamento | ✅ Admin |
| PUT | `/apartments/{id}` | Actualizar | ✅ Admin |
| DELETE | `/apartments/{id}` | Soft delete | ✅ Admin |

**Ejemplo Request:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/apartments-v2/apartments?status=active&page=1&page_size=20"
```

**Ejemplo Response:**
```json
{
  "items": [
    {
      "id": 1,
      "apartment_code": "サンハイツ101",
      "address": "東京都新宿区...",
      "base_rent": 45000,
      "capacity": 4,
      "current_occupancy": 2,
      "occupancy_rate": 50.0,
      "is_available": true,
      "prefecture": "東京都",
      "room_type": "1DK"
    }
  ],
  "total": 449,
  "page": 1,
  "page_size": 20
}
```

---

#### Assignments

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/assignments` | Lista con filtros | ✅ Required |
| GET | `/assignments/{id}` | Detalle completo | ✅ Required |
| POST | `/assignments` | Crear asignación | ✅ Coordinator+ |
| PUT | `/assignments/{id}` | Actualizar | ✅ Coordinator+ |
| PUT | `/assignments/{id}/end` | Terminar con cargos | ✅ Coordinator+ |
| GET | `/assignments/employee/{id}/active` | Asignación activa del empleado | ✅ Required |
| GET | `/assignments/apartment/{id}/active` | Asignaciones activas del apto | ✅ Required |
| POST | `/assignments/transfer` | Transferir empleado | ✅ Coordinator+ |

---

#### Calculations

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| POST | `/calculate/prorated` | Calcular renta prorrateada | ✅ Required |
| POST | `/calculate/transfer` | Preview costo de transferencia | ✅ Required |

**Cálculo Prorrateado:**
```python
daily_rate = monthly_rent / days_in_month
prorated_rent = daily_rate * days_occupied

# Ejemplo:
# monthly_rent = 45,000
# days_in_month = 30
# days_occupied = 15 (del 16 al 30)
# daily_rate = 1,500
# prorated_rent = 22,500
```

---

#### Deductions

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/deductions` | Lista con filtros | ✅ Admin |
| GET | `/deductions/{year}/{month}` | Deducciones del período | ✅ Admin |
| POST | `/deductions/generate` | Generar para mes | ✅ Admin |
| GET | `/deductions/export/{year}/{month}` | Exportar CSV | ✅ Admin |

---

## ✅ Verificación del Sistema

### 1. Verificar Base de Datos

```bash
# Conectar a PostgreSQL
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp

# Verificar tablas
\dt

# Debe listar:
# - apartments
# - apartment_assignments
# - additional_charges
# - rent_deductions

# Contar apartamentos
SELECT COUNT(*) FROM apartments;
# Esperado: 449

# Ver muestra de datos
SELECT apartment_code, address, base_rent, capacity
FROM apartments
LIMIT 5;

# Verificar índices
\di

# Salir
\q
```

---

### 2. Verificar Backend API

```bash
# Login para obtener token
TOKEN=$(curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | python -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

# Probar endpoint de apartamentos
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/apartments-v2/apartments?page_size=5"

# Debe retornar JSON con 5 apartamentos

# Probar endpoint de cálculo
curl -X POST http://localhost:8000/api/apartments-v2/calculate/prorated \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "apartment_id": 1,
    "start_date": "2025-11-15"
  }'

# Debe retornar cálculo prorrateado
```

---

### 3. Verificar Frontend

**3.1. Lista de Apartamentos**
```
1. Abrir: http://localhost:3000/apartments
2. Verificar:
   ✅ Muestra 449 apartamentos (con paginación)
   ✅ Columnas: Código, Dirección, Renta, Capacidad
   ✅ Filtros funcionan (Estado, Prefectura)
   ✅ Click en "Ver" abre detalle
```

**3.2. Asignación de Empleado**
```
1. Abrir: http://localhost:3000/apartments/1/assign
2. Verificar:
   ✅ Selector de empleado funciona
   ✅ Selector de fecha funciona
   ✅ Cálculo automático de renta prorrateada
   ✅ Muestra breakdown: días, tarifa diaria, total
   ✅ Botón "Asignar" envía a API
```

**3.3. Generación de Deducciones**
```
1. Abrir: http://localhost:3000/apartments/deductions/generate
2. Seleccionar: Mes 12, Año 2025
3. Click: "Generar Deducciones"
4. Verificar:
   ✅ Muestra número de deducciones creadas
   ✅ Permite exportar CSV
   ✅ CSV contiene todas las columnas necesarias
```

---

## 🚨 Troubleshooting

### Problema 1: Apartamentos no se cargan (COUNT = 0)

**Síntomas:**
```bash
SELECT COUNT(*) FROM apartments;
# Muestra: 0
```

**Causa:** Script `create_apartments_from_employees.py` no ejecutó

**Solución:**
```bash
# Ver logs del importer
docker compose logs importer | grep -i apartment

# Debe mostrar:
# "--- Step 3: Creating apartments from employee data ---"
# "✅ Apartments created (449 records)"

# Si no aparece, ejecutar manualmente:
docker exec uns-claudejp-backend python scripts/create_apartments_from_employees.py

# Verificar resultado
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT COUNT(*) FROM apartments;"
```

---

### Problema 2: Error 404 en /api/apartments-v2/*

**Síntomas:**
```bash
curl http://localhost:8000/api/apartments-v2/apartments
# Retorna: 404 Not Found
```

**Causa:** Router no registrado en main.py

**Verificación:**
```bash
# Verificar que el router esté importado
docker exec uns-claudejp-backend grep -n "apartments_v2" /app/app/main.py

# Debe aparecer:
# from app.api.apartment_v2 import router as apartments_v2_router
# app.include_router(apartments_v2_router)
```

**Solución:**
```bash
# Reiniciar backend
docker compose restart backend

# Esperar 10 segundos
sleep 10

# Verificar nuevamente
curl http://localhost:8000/api/apartments-v2/apartments
```

---

### Problema 3: Frontend muestra error "Failed to fetch"

**Síntomas:**
- Página `/apartments` muestra spinner infinito
- Consola (F12) muestra: `Failed to fetch`

**Causa:** Backend no está respondiendo o CORS

**Verificación:**
```bash
# Verificar backend está corriendo
docker compose ps backend

# Debe mostrar: healthy

# Verificar logs del backend
docker compose logs -f backend

# Buscar errores
```

**Solución:**
```bash
# Reiniciar frontend y backend
docker compose restart frontend backend

# Esperar 30 segundos

# Verificar en navegador: http://localhost:3000/apartments
```

---

### Problema 4: Cálculo prorrateado incorrecto

**Síntomas:**
- Renta prorrateada no coincide con cálculo manual

**Verificación:**
```python
# Fórmula correcta:
daily_rate = monthly_rent / days_in_month
prorated_rent = daily_rate * days_occupied

# Ejemplo:
# monthly_rent = 45,000
# start_date = 2025-11-15
# days_in_month = 30 (noviembre)
# days_occupied = 16 (del 15 al 30, inclusivo)
# daily_rate = 1,500
# prorated_rent = 24,000
```

**Código a revisar:**
```bash
# Ver implementación
docker exec uns-claudejp-backend cat /app/app/services/assignment_service.py | grep -A 20 "def calculate_prorated_rent"
```

---

## 🧪 Testing

### Test 1: Flujo Completo de Asignación

```bash
#!/bin/bash
# test_apartment_assignment.sh

# 1. Login
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | python -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

echo "Token obtenido: ${TOKEN:0:20}..."

# 2. Listar apartamentos
echo "Listando apartamentos..."
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/apartments-v2/apartments?page_size=3" \
  | python -m json.tool

# 3. Obtener detalle de apartamento #1
echo "Obteniendo detalle de apartamento #1..."
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/apartments-v2/apartments/1" \
  | python -m json.tool

# 4. Calcular renta prorrateada
echo "Calculando renta prorrateada..."
curl -s -X POST http://localhost:8000/api/apartments-v2/calculate/prorated \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "apartment_id": 1,
    "start_date": "2025-11-15"
  }' \
  | python -m json.tool

# 5. Crear asignación
echo "Creando asignación..."
curl -s -X POST http://localhost:8000/api/apartments-v2/assignments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "apartment_id": 1,
    "employee_id": 1,
    "start_date": "2025-11-15",
    "monthly_rent": 45000,
    "prorated_rent": 24000,
    "status": "active"
  }' \
  | python -m json.tool

echo "✅ Test completado"
```

---

### Test 2: Generación de Deducciones

```bash
#!/bin/bash
# test_deductions.sh

TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | python -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

# Generar deducciones para diciembre 2025
echo "Generando deducciones para 2025-12..."
curl -s -X POST http://localhost:8000/api/apartments-v2/deductions/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"year": 2025, "month": 12}' \
  | python -m json.tool

# Listar deducciones
echo "Listando deducciones generadas..."
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/apartments-v2/deductions/2025/12" \
  | python -m json.tool

echo "✅ Test completado"
```

---

## 📊 Resumen de Archivos Clave

| Archivo | Propósito | Ubicación |
|---------|-----------|-----------|
| **Migration** | Crea 4 tablas | `backend/alembic/versions/5e6575b9bf1b_*.py` |
| **Import Script** | Carga 449 apartamentos | `backend/scripts/create_apartments_from_employees.py` |
| **Service** | Lógica de asignaciones | `backend/app/services/assignment_service.py` |
| **Service** | Lógica de deducciones | `backend/app/services/deduction_service.py` |
| **API Router** | Endpoints REST | `backend/app/api/apartment_v2.py` |
| **Frontend Types** | TypeScript types | `frontend/types/apartments-v2.ts` |
| **Frontend API** | Client functions | `frontend/lib/api.ts` (apartmentsV2Service) |
| **Frontend Page** | Lista apartamentos | `frontend/app/(dashboard)/apartments/page.tsx` |
| **Frontend Page** | Asignar empleado | `frontend/app/(dashboard)/apartments/[id]/assign/page.tsx` |
| **Docker Config** | Orchestration | `docker-compose.yml` (Step 3) |

---

## ✅ Checklist de Verificación Post-Instalación

- [ ] Tablas creadas (4)
- [ ] Apartamentos cargados (449)
- [ ] Backend responde a `/api/apartments-v2/apartments`
- [ ] Frontend muestra lista en `/apartments`
- [ ] Cálculo prorrateado funciona
- [ ] Asignación de empleado funciona
- [ ] Generación de deducciones funciona
- [ ] Exportación CSV funciona
- [ ] Logs del importer sin errores
- [ ] Sincronización Employee ↔ Assignment funciona

---

**Última actualización:** 2025-11-11
**Versión del sistema:** UNS-ClaudeJP 5.4.1
**Próxima revisión:** Después de instalación en producción
