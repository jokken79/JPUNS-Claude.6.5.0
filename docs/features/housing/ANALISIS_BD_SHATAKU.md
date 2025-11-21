# ANÁLISIS DE BASE DE DATOS - SISTEMA DE 社宅 (Shataku/Apartamentos)
**Versión:** 5.4.1 | **Fecha:** 2025-11-10 | **Database Architect:** Claude Code

## 📋 RESUMEN EJECUTIVO

Este análisis presenta un diseño world-class para la gestión de 社宅 (corporate housing) en el sistema UNS-ClaudeJP, optimizando la estructura actual de base de datos para soportar operaciones de gestión de apartamentos en Japón.

### Objetivos del Modelo Optimizado
- **Normalización completa**: Eliminar redundancias en el modelo actual
- **Trazabilidad histórica**: Mantener historial completo de asignaciones
- **Flexibilidad**: Soporte para múltiples tipos de cargo y deducción
- **Performance**: Índices optimizados para consultas frecuentes
- **Escalabilidad**: Diseño preparado para crecimiento

---

## 🔍 ANÁLISIS DEL MODELO ACTUAL

### Tabla: apartments (ACTUAL)
```sql
CREATE TABLE apartments (
    id INTEGER PRIMARY KEY,
    apartment_code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    monthly_rent INTEGER NOT NULL,
    capacity INTEGER,
    is_available BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Problemas Identificados:**
1. ❌ Falta metadatos del apartamento (tipo, tamaño, amenities)
2. ❌ No hay información de contacto del propietario
3. ❌ Falta información de depósitos (敷金, 礼金)
4. ❌ No hay trazabilidad de cambios históricos
5. ❌ Un apartamento puede tener múltiples asignaciones - no hay relación N:M
6. ❌ No hay gestión de fechas de contrato

### Tabla: employees (Campos APARTMENT)
```sql
-- Campos actuales en employees relacionados con apartment:
apartment_id INTEGER REFERENCES apartments(id)
apartment_start_date DATE
apartment_move_out_date DATE
apartment_rent INTEGER
is_corporate_housing BOOLEAN DEFAULT false
```

**Problemas Identificados:**
1. ❌ **Deductions hardcodeadas**: Solo `apartment_deduction` (default 0) - inflexible
2. ❌ **No historial**: Un empleado solo puede tener una asignación activa
3. ❌ **No información de cargo**: ¿Qué cargos adicionales tiene? (electricidad, gas, internet, etc.)
4. ❌ **No separación de datos**: Mezcla datos del apartamento con datos del empleado
5. ❌ **No validaciones**: No hay constraints de fechas (start < end)
6. ❌ **No tracking de cambios**: ¿Quién modificó? ¿Cuándo?

### Tabla: contract_workers (Similares a employees)
- Mismos problemas que `employees`

---

## 🎯 DISEÑO DEL MODELO OPTIMIZADO

### 1. Tabla: apartments (MEJORADA)

```sql
CREATE TABLE apartments (
    id SERIAL PRIMARY KEY,
    apartment_code VARCHAR(50) UNIQUE NOT NULL,
    
    -- Información básica
    name VARCHAR(100), -- 物件名 (Nombre del edificio)
    building_type VARCHAR(30), -- 種類 (tipo: アパート, マンション, 社宅)
    address TEXT NOT NULL,
    postal_code VARCHAR(10),
    prefecture VARCHAR(20), -- 都道府県
    city VARCHAR(50), -- 市区町村
    district VARCHAR(50), -- 丁目番地
    
    -- Detalles del apartamento
    unit_number VARCHAR(20), -- 部屋番号
    floor_number INTEGER,
    total_floors INTEGER,
    room_type VARCHAR(30), -- 1R, 1K, 1DK, 1LDK, 2K, 2DK, 2LDK, etc.
    size_sqm DECIMAL(5,2), -- 面積 (m²)
    bedroom_count INTEGER DEFAULT 0,
    bathroom_count INTEGER DEFAULT 1,
    
    -- Metadatos
    capacity INTEGER NOT NULL, -- 最大入住人数
    furnished_level VARCHAR(20), -- 家具付き程度 (empty, partially, fully)
    amenities JSONB, -- 設備 (electricity, gas, water, internet, parking, etc.)
    restrictions TEXT, -- 制限 (pets, smoking, etc.)
    
    -- Información de contrato
    landlord_name VARCHAR(100), -- 家主名
    landlord_contact VARCHAR(100), -- 家主連絡先
    management_company VARCHAR(100), -- 管理会社名
    management_contact VARCHAR(100), -- 管理会社連絡先
    
    -- Costos base
    monthly_rent INTEGER NOT NULL, -- 家賃
    security_deposit INTEGER, -- 敷金 (meses de depósito)
    key_money INTEGER, -- 礼金 (meses de key money)
    cleaning_fee INTEGER, -- 清掃費
    
    -- Fechas importantes
    contract_start_date DATE,
    contract_end_date DATE,
    contract_renewal_date DATE,
    
    -- Estado
    is_available BOOLEAN DEFAULT true,
    is_corporate_housing BOOLEAN DEFAULT false,
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id),
    notes TEXT
);
```

### 2. Tabla: apartment_assignments (NUEVA - N:M)

**Propósito:** Gestionar asignaciones N:M entre empleados y apartamentos con historial completo

```sql
CREATE TABLE apartment_assignments (
    id SERIAL PRIMARY KEY,
    
    -- Relaciones
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    apartment_id INTEGER REFERENCES apartments(id) ON DELETE CASCADE,
    
    -- Información de la asignación
    assignment_type VARCHAR(20) NOT NULL, -- 'PRIMARY', 'SECONDARY', 'TEMPORARY'
    status VARCHAR(20) NOT NULL, -- 'ACTIVE', 'PENDING', 'TERMINATED', 'CANCELLED'
    
    -- Fechas
    assignment_date DATE NOT NULL, -- 入住日
    start_date DATE NOT NULL, -- 契約開始日
    end_date DATE, -- 契約終了日
    move_in_date DATE, -- 実際入住日
    move_out_date DATE, -- 実際退去日
    
    -- Costos específicos de la asignación
    monthly_rent INTEGER NOT NULL, -- 家賃 (puede diferir del base)
    rent_currency VARCHAR(3) DEFAULT 'JPY',
    payment_method VARCHAR(30), -- 'SALARY_DEDUCTION', 'DIRECT_PAYMENT', 'COMPANY_PAYMENT'
    
    -- Descuentos y beneficios
    company_subsidy INTEGER DEFAULT 0, -- 会社補助
    employee_contribution INTEGER, -- 社員負担額
    
    -- Documentación
    contract_signed BOOLEAN DEFAULT false,
    contract_signed_date DATE,
    contract_document_path VARCHAR(500),
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT valid_assignment_dates CHECK (start_date <= end_date OR end_date IS NULL),
    CONSTRAINT valid_payment CHECK (employee_contribution >= 0 AND company_subsidy >= 0)
);
```

### 3. Tabla: additional_charges (NUEVA)

**Propósito:** Gestionar cargos adicionales (光熱費, 管理費, etc.)

```sql
CREATE TABLE additional_charges (
    id SERIAL PRIMARY KEY,
    
    -- Información del cargo
    charge_name VARCHAR(100) NOT NULL, -- 'Electricidad', 'Gas', 'Internet', etc.
    charge_name_en VARCHAR(100), -- 'Electricity', 'Gas', 'Internet'
    charge_type VARCHAR(30) NOT NULL, -- 'UTILITY', 'SERVICE', 'FEE', 'MAINTENANCE', 'TAX'
    description TEXT,
    
    -- Información de cálculo
    calculation_type VARCHAR(20) NOT NULL, -- 'FIXED', 'VOLUME_BASED', 'PERCENTAGE'
    unit_type VARCHAR(20), -- 'MONTH', 'KWH', 'CUBIC_METER', 'PERCENT', etc.
    
    -- Costos
    base_amount INTEGER, -- Monto base (si calculation_type = 'FIXED')
    min_amount INTEGER, -- Monto mínimo
    max_amount INTEGER, -- Monto máximo
    
    -- Vencimiento
    due_day_of_month INTEGER DEFAULT 25, -- 支払日 (día del mes)
    is_mandatory BOOLEAN DEFAULT true,
    
    -- Estado
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. Tabla: rent_deductions (MEJORADA)

**Propósito:** Gestionar deducciones específicas por empleado-apartamento-cargo adicional

```sql
CREATE TABLE rent_deductions (
    id SERIAL PRIMARY KEY,
    
    -- Relaciones principales
    assignment_id INTEGER NOT NULL REFERENCES apartment_assignments(id) ON DELETE CASCADE,
    charge_id INTEGER NOT NULL REFERENCES additional_charges(id),
    
    -- Período de aplicación
    effective_date DATE NOT NULL, -- 適用開始日
    end_date DATE, -- 適用終了日
    
    -- Información de deducción
    amount INTEGER NOT NULL, -- 控除額
    amount_type VARCHAR(20) NOT NULL, -- 'FIXED', 'VARIABLE'
    deduction_type VARCHAR(20) NOT NULL, -- 'SALARY_DEDUCTION', 'DIRECT_PAYMENT', 'COMPANY_PAYMENT'
    
    -- Para cargos variables
    last_reading_date DATE, -- 最后的検針日
    last_reading_value DECIMAL(10,2), -- 最后的検針値
    rate_per_unit DECIMAL(8,2), -- 単価
    
    -- Estado y auditoría
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id)
);
```
