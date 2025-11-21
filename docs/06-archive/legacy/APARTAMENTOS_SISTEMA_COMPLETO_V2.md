# 🏢 SISTEMA COMPLETO DE GESTIÓN DE APARTAMENTOS V2.0

**Fecha**: 2025-11-09
**Analista**: Claude
**Estado**: Especificación Final
**Objetivo**: Sistema completo con cálculos prorrateados, cargos personalizables y transferencias

---

## 📋 REGLAS DE NEGOCIO DEFINITIVAS

### 1. MODELO DE PAGO

**REGLA PRINCIPAL**: La empresa paga el precio REAL al propietario/inmobiliaria, pero descuenta TODO el monto al empleado.

```
Ejemplo:
- Renta real del apartamento: ¥50,000/mes
- La empresa paga a la inmobiliaria: ¥50,000
- El empleado paga a la empresa (vía descuento nómina): ¥50,000
- Beneficio empresa: ¥0 (pass-through puro)
```

**CAMBIO VS VERSIÓN ANTERIOR**:
- ❌ ANTES: Empresa pagaba % (ej: 67%), empleado pagaba % (ej: 33%)
- ✅ AHORA: Empresa paga 100% al propietario, descuenta 100% al empleado

---

### 2. CÁLCULO DE RENTA PRORRATEADA

#### Escenario 1: Entrada a mitad de mes

**Pregunta**: Empleado entra hoy (9 de noviembre) y se queda solo 2 semanas

**Cálculo diario**:
```
Días en el mes: 30 días (noviembre)
Renta mensual: ¥50,000
Renta diaria: ¥50,000 ÷ 30 = ¥1,666.67

Empleado se queda del 9 al 23 (14 días):
Renta prorrateada = ¥1,666.67 × 14 días = ¥23,333.38
```

**Redondeo**: Siempre redondear al yen más cercano (no decimales)
- ¥23,333.38 → ¥23,333

#### Escenario 2: Salida a mitad de mes

**Ejemplo**: Empleado sale el día 15
```
Días ocupados: 1 al 15 = 15 días
Renta prorrateada = (¥50,000 ÷ 30) × 15 = ¥25,000
```

#### Escenario 3: Mes completo
```
Renta = ¥50,000 (sin prorrateo)
```

**FÓRMULA UNIVERSAL**:
```
Renta Prorrateada = (Renta Mensual ÷ Días en el Mes) × Días Ocupados
```

**NOTA IMPORTANTE**: Usar días reales del mes (28, 29, 30, 31)

---

### 3. CARGO DE LIMPIEZA AL SALIR

**REGLA**: Cada vez que un empleado deja un apartamento, se le cobra ¥20,000 por limpieza.

```
Ejemplo de cálculo al salir (día 15 del mes):
- Renta prorrateada (15 días): ¥25,000
- Cargo de limpieza: ¥20,000
- TOTAL a descontar: ¥45,000
```

**OPCIONES**:
1. **Automático**: Cargo fijo de ¥20,000 siempre
2. **Opcional**: Campo editable por si en algunos casos es diferente
3. **Por apartamento**: Algunos apartamentos pueden tener cargo diferente

**RECOMENDACIÓN**: Campo editable con default ¥20,000, por si algún caso requiere ajuste.

---

### 4. CARGOS ADICIONALES PERSONALIZABLES

**REGLA**: "Cada caso es un caso" - Sistema flexible para agregar cargos

**Tipos de cargos comunes**:
```
1. Limpieza al salir: ¥20,000
2. Reparaciones: ¥5,000 - ¥50,000
3. Reemplazo de llaves: ¥5,000
4. Depósito de seguridad: ¥30,000
5. Multa por daños: variable
6. Gastos de mudanza: variable
7. Otros: campo libre
```

**ESTRUCTURA DE CARGOS**:
```typescript
interface AdditionalCharge {
  id: number
  assignment_id: number
  charge_type: 'cleaning' | 'repair' | 'deposit' | 'penalty' | 'other'
  description: string
  amount: number
  date: Date
  status: 'pending' | 'approved' | 'cancelled'
  notes: string
}
```

**CASOS DE USO**:
- Al registrar salida → agregar cargo de limpieza ¥20,000
- Si hay daños → agregar cargo de reparación ¥15,000
- Si perdió llave → agregar cargo ¥5,000
- Total a descontar = renta prorrateada + suma de todos los cargos

---

### 5. TRANSFERENCIA ENTRE APARTAMENTOS

**ESCENARIO**: Empleado se muda del Apartamento A al Apartamento B

**FLUJO**:
```
1. Finalizar asignación en Apartamento A
   - Fecha fin = fecha de mudanza
   - Calcular renta prorrateada hasta ese día
   - Agregar cargo de limpieza ¥20,000
   - Generar deducción final

2. Crear nueva asignación en Apartamento B
   - Fecha inicio = fecha de mudanza
   - Calcular renta prorrateada desde ese día
   - Sin cargo de limpieza (es entrada, no salida)

3. Actualizar empleado
   - apartment_id = nuevo apartamento
```

**EJEMPLO PRÁCTICO**:
```
Empleado: Juan Pérez
Apartamento A: ¥50,000/mes
Apartamento B: ¥60,000/mes
Fecha de mudanza: 15 de noviembre (mes de 30 días)

CÁLCULO APARTAMENTO A (salida):
- Días ocupados: 1 al 15 = 15 días
- Renta prorrateada: (¥50,000 ÷ 30) × 15 = ¥25,000
- Cargo limpieza: ¥20,000
- TOTAL: ¥45,000

CÁLCULO APARTAMENTO B (entrada):
- Días ocupados: 16 al 30 = 15 días
- Renta prorrateada: (¥60,000 ÷ 30) × 15 = ¥30,000
- Sin cargo limpieza (es entrada)
- TOTAL: ¥30,000

DEDUCCIÓN TOTAL DEL MES: ¥45,000 + ¥30,000 = ¥75,000
```

---

## 💾 DISEÑO DE BASE DE DATOS

### Tabla: `apartments` (modificada)

```sql
CREATE TABLE apartments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    building_name VARCHAR(200),
    room_number VARCHAR(20),
    floor_number INTEGER,
    postal_code VARCHAR(10),
    prefecture VARCHAR(50),
    city VARCHAR(100),
    address_line1 VARCHAR(200),
    address_line2 VARCHAR(200),
    room_type VARCHAR(20),
    size_sqm DECIMAL(6,2),

    -- PRECIOS
    base_rent INTEGER NOT NULL,              -- Renta base mensual
    management_fee INTEGER DEFAULT 0,        -- Gastos de administración
    deposit INTEGER DEFAULT 0,               -- Depósito (敷金)
    key_money INTEGER DEFAULT 0,             -- Key money (礼金)

    -- CARGOS CONFIGURABLES
    default_cleaning_fee INTEGER DEFAULT 20000,  -- Cargo limpieza default

    -- CONTRATO CON PROPIETARIO
    contract_start_date DATE,
    contract_end_date DATE,
    landlord_name VARCHAR(200),
    landlord_contact VARCHAR(200),
    real_estate_agency VARCHAR(200),
    emergency_contact VARCHAR(200),

    notes TEXT,
    status VARCHAR(20) DEFAULT 'active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
```

### Tabla: `apartment_assignments` (modificada)

```sql
CREATE TABLE apartment_assignments (
    id SERIAL PRIMARY KEY,
    apartment_id INTEGER REFERENCES apartments(id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,

    -- FECHAS
    start_date DATE NOT NULL,
    end_date DATE,                           -- NULL = aún activo

    -- CÁLCULOS DE RENTA
    monthly_rent INTEGER NOT NULL,           -- Renta mensual del apartamento
    days_in_month INTEGER,                   -- Días en el mes (28-31)
    days_occupied INTEGER,                   -- Días ocupados
    prorated_rent INTEGER,                   -- Renta prorrateada calculada
    is_prorated BOOLEAN DEFAULT FALSE,       -- ¿Es prorrateo o mes completo?

    -- DEDUCCIÓN TOTAL (renta + cargos)
    total_deduction INTEGER NOT NULL,        -- Total a descontar de nómina

    -- METADATA
    contract_type VARCHAR(50),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'active',     -- active/ended/cancelled

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,

    -- VALIDACIONES
    CONSTRAINT check_dates CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT check_days CHECK (days_occupied > 0 AND days_occupied <= 31)
);
```

### Tabla: `additional_charges` (NUEVA)

```sql
CREATE TABLE additional_charges (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER REFERENCES apartment_assignments(id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES employees(id),
    apartment_id INTEGER REFERENCES apartments(id),

    -- TIPO DE CARGO
    charge_type VARCHAR(50) NOT NULL,        -- cleaning, repair, deposit, penalty, other
    description VARCHAR(500) NOT NULL,       -- Descripción del cargo
    amount INTEGER NOT NULL,                 -- Monto del cargo

    -- FECHA Y ESTADO
    charge_date DATE NOT NULL,               -- Fecha del cargo
    status VARCHAR(20) DEFAULT 'pending',    -- pending/approved/cancelled/paid

    -- METADATA
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
```

### Tabla: `rent_deductions` (modificada)

```sql
CREATE TABLE rent_deductions (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER REFERENCES apartment_assignments(id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES employees(id),
    apartment_id INTEGER REFERENCES apartments(id),

    -- PERIODO
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),

    -- CÁLCULOS
    base_rent INTEGER NOT NULL,              -- Renta base o prorrateada
    additional_charges INTEGER DEFAULT 0,    -- Suma de cargos adicionales
    total_deduction INTEGER NOT NULL,        -- Total a descontar

    -- ESTADO
    status VARCHAR(20) DEFAULT 'pending',    -- pending/processed/paid/cancelled
    processed_date DATE,
    paid_date DATE,

    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,

    UNIQUE(assignment_id, year, month)
);
```

---

## 🎯 CASOS DE USO COMPLETOS

### CASO 1: Entrada de empleado a mitad de mes

```
DATOS:
- Empleado: María González (ID: 123)
- Apartamento: サンシティ A-301 (ID: 45, Renta: ¥50,000)
- Fecha entrada: 9 de noviembre de 2025
- Días en noviembre: 30

CÁLCULOS:
1. Días ocupados = 30 - 9 + 1 = 22 días
2. Renta diaria = ¥50,000 ÷ 30 = ¥1,666.67
3. Renta prorrateada = ¥1,666.67 × 22 = ¥36,667 (redondeado)
4. Sin cargos adicionales (es entrada)
5. Total deducción = ¥36,667

REGISTRO EN BD:
INSERT INTO apartment_assignments (
    apartment_id, employee_id, start_date, end_date,
    monthly_rent, days_in_month, days_occupied,
    prorated_rent, is_prorated, total_deduction, status
) VALUES (
    45, 123, '2025-11-09', NULL,
    50000, 30, 22,
    36667, TRUE, 36667, 'active'
);

INSERT INTO rent_deductions (
    assignment_id, employee_id, apartment_id,
    year, month, base_rent, additional_charges, total_deduction, status
) VALUES (
    [assignment_id], 123, 45,
    2025, 11, 36667, 0, 36667, 'pending'
);
```

### CASO 2: Salida de empleado a mitad de mes

```
DATOS:
- Empleado: Juan Pérez (ID: 456)
- Apartamento actual: レジェンド 203 (ID: 78, Renta: ¥60,000)
- Fecha salida: 15 de diciembre de 2025
- Días en diciembre: 31

CÁLCULOS:
1. Días ocupados = 15 días
2. Renta diaria = ¥60,000 ÷ 31 = ¥1,935.48
3. Renta prorrateada = ¥1,935.48 × 15 = ¥29,032 (redondeado)
4. Cargo limpieza = ¥20,000
5. Total deducción = ¥29,032 + ¥20,000 = ¥49,032

ACTUALIZAR ASIGNACIÓN:
UPDATE apartment_assignments
SET
    end_date = '2025-12-15',
    days_occupied = 15,
    prorated_rent = 29032,
    is_prorated = TRUE,
    total_deduction = 49032,
    status = 'ended'
WHERE id = [assignment_id];

AGREGAR CARGO DE LIMPIEZA:
INSERT INTO additional_charges (
    assignment_id, employee_id, apartment_id,
    charge_type, description, amount, charge_date, status
) VALUES (
    [assignment_id], 456, 78,
    'cleaning', 'Cargo de limpieza al salir del apartamento', 20000, '2025-12-15', 'approved'
);

GENERAR DEDUCCIÓN:
INSERT INTO rent_deductions (
    assignment_id, employee_id, apartment_id,
    year, month, base_rent, additional_charges, total_deduction, status
) VALUES (
    [assignment_id], 456, 78,
    2025, 12, 29032, 20000, 49032, 'pending'
);

ACTUALIZAR EMPLEADO:
UPDATE employees SET apartment_id = NULL WHERE id = 456;
```

### CASO 3: Transferencia entre apartamentos

```
DATOS:
- Empleado: Ana López (ID: 789)
- Apartamento A: グリーンハイツ 101 (ID: 12, Renta: ¥45,000)
- Apartamento B: サンライズ 305 (ID: 34, Renta: ¥55,000)
- Fecha mudanza: 20 de enero de 2026
- Días en enero: 31

PASO 1 - FINALIZAR APARTAMENTO A:
1. Días ocupados = 20 días (del 1 al 20)
2. Renta diaria = ¥45,000 ÷ 31 = ¥1,451.61
3. Renta prorrateada = ¥1,451.61 × 20 = ¥29,032
4. Cargo limpieza = ¥20,000
5. Total = ¥49,032

UPDATE apartment_assignments
SET
    end_date = '2026-01-20',
    days_occupied = 20,
    prorated_rent = 29032,
    is_prorated = TRUE,
    total_deduction = 49032,
    status = 'ended'
WHERE id = [assignment_a_id];

INSERT INTO additional_charges VALUES (
    [assignment_a_id], 789, 12,
    'cleaning', 'Limpieza al transferir a nuevo apartamento', 20000, '2026-01-20', 'approved'
);

PASO 2 - INICIAR APARTAMENTO B:
1. Días ocupados = 11 días (del 21 al 31)
2. Renta diaria = ¥55,000 ÷ 31 = ¥1,774.19
3. Renta prorrateada = ¥1,774.19 × 11 = ¥19,516
4. Sin cargo limpieza (es entrada)
5. Total = ¥19,516

INSERT INTO apartment_assignments VALUES (
    34, 789, '2026-01-21', NULL,
    55000, 31, 11,
    19516, TRUE, 19516, 'active'
);

PASO 3 - GENERAR DEDUCCIONES DEL MES:
-- Deducción Apartamento A
INSERT INTO rent_deductions VALUES (
    [assignment_a_id], 789, 12,
    2026, 1, 29032, 20000, 49032, 'pending'
);

-- Deducción Apartamento B
INSERT INTO rent_deductions VALUES (
    [assignment_b_id], 789, 34,
    2026, 1, 19516, 0, 19516, 'pending'
);

TOTAL A DESCONTAR EN ENERO: ¥49,032 + ¥19,516 = ¥68,548

PASO 4 - ACTUALIZAR EMPLEADO:
UPDATE employees SET apartment_id = 34 WHERE id = 789;
```

### CASO 4: Cargo adicional por daños

```
DATOS:
- Empleado: Carlos Ruiz (ID: 321)
- Apartamento: ビューハイツ 202 (ID: 56)
- Asignación actual (activa)
- Daño: Reparación de pared ¥15,000

AGREGAR CARGO:
INSERT INTO additional_charges (
    assignment_id, employee_id, apartment_id,
    charge_type, description, amount, charge_date, status, notes
) VALUES (
    [assignment_id], 321, 56,
    'repair', 'Reparación de pared dañada', 15000, '2025-11-09', 'pending',
    'Daño reportado por gerente de propiedad. Pendiente aprobación.'
);

CUANDO SE APRUEBE:
UPDATE additional_charges
SET
    status = 'approved',
    approved_by = [user_id],
    approved_at = NOW()
WHERE id = [charge_id];

EN LA SIGUIENTE DEDUCCIÓN MENSUAL:
- Renta normal: ¥50,000
- Cargo reparación: ¥15,000
- Total deducción: ¥65,000
```

---

## 🔧 API ENDPOINTS NECESARIOS

### Apartamentos
```
GET    /api/apartments                   # Lista con filtros
GET    /api/apartments/{id}              # Detalle
POST   /api/apartments                   # Crear
PUT    /api/apartments/{id}              # Actualizar
DELETE /api/apartments/{id}              # Eliminar (soft)
```

### Asignaciones
```
POST   /api/apartments/assignments                    # Asignar empleado
GET    /api/apartments/assignments                    # Lista de asignaciones
GET    /api/apartments/assignments/{id}               # Detalle
PUT    /api/apartments/assignments/{id}/end           # Finalizar asignación
POST   /api/apartments/assignments/transfer           # Transferir entre apartamentos
```

### Cargos Adicionales
```
POST   /api/apartments/charges                        # Agregar cargo
GET    /api/apartments/charges?assignment_id={id}     # Cargos de una asignación
PUT    /api/apartments/charges/{id}/approve           # Aprobar cargo
DELETE /api/apartments/charges/{id}                   # Cancelar cargo
```

### Deducciones
```
GET    /api/apartments/deductions/{year}/{month}      # Deducciones del mes
POST   /api/apartments/deductions/generate            # Generar deducciones automáticas
GET    /api/apartments/deductions/export/{year}/{month}  # Exportar Excel
PUT    /api/apartments/deductions/{id}/status         # Marcar como procesado/pagado
```

### Cálculos
```
POST   /api/apartments/calculate-prorated             # Calcular renta prorrateada
       Body: { monthly_rent, start_date, end_date }
       Response: { days_in_month, days_occupied, daily_rate, prorated_rent }
```

---

## 🎨 INTERFAZ DE USUARIO

### Página: Crear/Editar Asignación

```
┌─────────────────────────────────────────────────────────────┐
│ 🏠 Asignar Empleado a Apartamento                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Empleado: [Seleccionar empleado ▼]                          │
│           → Juan Pérez (ID: 456)                             │
│                                                              │
│ Apartamento: [Seleccionar apartamento ▼]                    │
│              → サンシティ A-301 (Renta: ¥50,000)           │
│                                                              │
│ Fecha de Inicio: [📅 2025-11-09]                            │
│ Fecha de Fin:    [📅 __________ ] (dejar vacío si indefinido)│
│                                                              │
│ ─────────────────────────────────────────────────────────── │
│ 💰 CÁLCULO AUTOMÁTICO                                        │
│                                                              │
│ Renta mensual del apartamento:         ¥50,000              │
│ Días en noviembre:                      30 días              │
│ Días a ocupar:                          22 días (9-30 nov)   │
│ Renta diaria:                           ¥1,667               │
│                                                              │
│ 🧮 Renta prorrateada:                   ¥36,674             │
│                                                              │
│ ─────────────────────────────────────────────────────────── │
│ 📝 Cargos Adicionales (opcional)                             │
│                                                              │
│ [No hay cargos para entrada inicial]                        │
│                                                              │
│ ─────────────────────────────────────────────────────────── │
│ 💵 TOTAL A DESCONTAR DE NÓMINA:         ¥36,674             │
│                                                              │
│ Notas: [_____________________________________________]       │
│                                                              │
│ [Cancelar]                              [Guardar Asignación]│
└─────────────────────────────────────────────────────────────┘
```

### Página: Finalizar Asignación (Salida)

```
┌─────────────────────────────────────────────────────────────┐
│ 🚪 Finalizar Asignación - Salida de Empleado                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Empleado:    Juan Pérez (ID: 456)                           │
│ Apartamento: レジェンド 203                                 │
│ Fecha inicio: 2024-01-01                                     │
│                                                              │
│ Fecha de Salida: [📅 2025-12-15]                            │
│                                                              │
│ ─────────────────────────────────────────────────────────── │
│ 💰 CÁLCULO AUTOMÁTICO                                        │
│                                                              │
│ Renta mensual:                          ¥60,000              │
│ Días en diciembre:                      31 días              │
│ Días ocupados:                          15 días (1-15 dic)   │
│ Renta diaria:                           ¥1,935               │
│                                                              │
│ 🧮 Renta prorrateada:                   ¥29,032             │
│                                                              │
│ ─────────────────────────────────────────────────────────── │
│ 🧹 CARGO DE LIMPIEZA                                         │
│                                                              │
│ ☑ Aplicar cargo de limpieza                                 │
│ Monto: [¥20,000] (editable)                                  │
│                                                              │
│ ─────────────────────────────────────────────────────────── │
│ 📝 Cargos Adicionales                                        │
│                                                              │
│ [+ Agregar cargo]                                            │
│                                                              │
│ Tipo:        [Reparación ▼]                                  │
│ Descripción: [Reparación de pared]                          │
│ Monto:       [¥15,000]                                       │
│                                                              │
│ ─────────────────────────────────────────────────────────── │
│ 💵 RESUMEN DE DEDUCCIÓN FINAL                                │
│                                                              │
│ Renta prorrateada:                      ¥29,032              │
│ Cargo limpieza:                         ¥20,000              │
│ Otros cargos:                           ¥15,000              │
│                                                              │
│ TOTAL A DESCONTAR:                      ¥64,032             │
│                                                              │
│ Notas: [_____________________________________________]       │
│                                                              │
│ [Cancelar]                         [Finalizar Asignación]   │
└─────────────────────────────────────────────────────────────┘
```

### Página: Transferencia entre Apartamentos

```
┌─────────────────────────────────────────────────────────────┐
│ 🔄 Transferir Empleado a Nuevo Apartamento                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Empleado:    Ana López (ID: 789)                            │
│                                                              │
│ 📍 APARTAMENTO ACTUAL                                        │
│    グリーンハイツ 101 (¥45,000/mes)                         │
│    Inicio: 2024-06-01                                        │
│                                                              │
│ 📍 NUEVO APARTAMENTO                                         │
│    [Seleccionar apartamento ▼]                               │
│    → サンライズ 305 (¥55,000/mes)                           │
│                                                              │
│ Fecha de Mudanza: [📅 2026-01-20]                           │
│                                                              │
│ ─────────────────────────────────────────────────────────── │
│ 💰 CÁLCULO AUTOMÁTICO - APARTAMENTO ACTUAL                   │
│                                                              │
│ Renta mensual:                          ¥45,000              │
│ Días ocupados:                          20 días (1-20 ene)   │
│ Renta prorrateada:                      ¥29,032              │
│                                                              │
│ 🧹 Cargo limpieza:                      ¥20,000              │
│                                                              │
│ Subtotal apartamento actual:            ¥49,032              │
│                                                              │
│ ─────────────────────────────────────────────────────────── │
│ 💰 CÁLCULO AUTOMÁTICO - NUEVO APARTAMENTO                    │
│                                                              │
│ Renta mensual:                          ¥55,000              │
│ Días a ocupar:                          11 días (21-31 ene)  │
│ Renta prorrateada:                      ¥19,516              │
│                                                              │
│ Subtotal nuevo apartamento:             ¥19,516              │
│                                                              │
│ ─────────────────────────────────────────────────────────── │
│ 💵 TOTAL A DESCONTAR EN ENERO:          ¥68,548             │
│                                                              │
│ Notas: [Transferencia aprobada por gerente]                 │
│                                                              │
│ [Cancelar]                           [Confirmar Transferencia]│
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Backend
- [ ] Modificar modelos SQLAlchemy (Apartment, Assignment, Charges)
- [ ] Crear migración de base de datos
- [ ] Crear schemas Pydantic actualizados
- [ ] Implementar función de cálculo prorrateado
- [ ] Implementar endpoints de asignaciones
- [ ] Implementar endpoints de cargos adicionales
- [ ] Implementar endpoint de transferencia
- [ ] Implementar endpoint de generación de deducciones
- [ ] Implementar exportación a Excel
- [ ] Tests unitarios de cálculos

### Frontend
- [ ] Crear tipos TypeScript
- [ ] Formulario de asignación con cálculo automático
- [ ] Formulario de finalización con cargos
- [ ] Formulario de transferencia
- [ ] Vista de deducciones mensuales
- [ ] Exportar a Excel desde UI
- [ ] Validaciones en formularios
- [ ] Tests E2E

### Documentación
- [ ] Guía de usuario
- [ ] Ejemplos de cálculos
- [ ] FAQ de casos especiales
- [ ] Manual de operación

---

## 🚀 PRÓXIMOS PASOS

1. **Revisar y aprobar esta especificación**
2. **Empezar con backend** (modelos + migración)
3. **Implementar cálculos** (función prorrateada)
4. **Crear API endpoints**
5. **Implementar frontend**
6. **Probar todos los escenarios**
7. **Migrar datos existentes**
8. **Capacitar usuarios**

---

**¿APROBADO PARA IMPLEMENTACIÓN?** ✅
