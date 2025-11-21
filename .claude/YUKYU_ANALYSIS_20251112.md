# 📊 ANÁLISIS INTEGRAL DEL SISTEMA DE YUKYUS (給与)
## UNS-ClaudeJP 5.4.1 - 12 de Noviembre 2025

---

## 📋 EJECUTIVO

El sistema de yukyus (有給休暇 - Paid Vacation) está **funcional pero con brechas críticas de seguridad** en la capa de acceso por roles. El sistema actual:

✅ **Implementado correctamente:**
- Modelos de BD con 13 tablas completas
- 14 endpoints API bien documentados
- Flujo de solicitud-aprobación funcional
- Cálculo LIFO para deducción de días
- Reportes y auditoría detallada

❌ **Brechas críticas:**
- Sin protección de rutas por rol en frontend
- Componentes sin validación de permisos
- Acceso al panel de aprobación sin restricción
- Comentarios desactualizados
- Inconsistencia en nomenclatura de roles (KEIRI vs KEITOSAN)

---

## 🏗️ ARQUITECTURA ACTUAL

### 1. MODELO DE DATOS (13 TABLAS RELACIONADAS)

#### Tabla 1: `yukyu_balances` - Saldo de Vacaciones
```
Campos clave:
├─ id (PK)
├─ employee_id (FK)
├─ fiscal_year (2023, 2024, etc.)
├─ assigned_date (Fecha de asignación)
├─ days_assigned (Días asignados ese año)
├─ days_carried_over (Días trasladados del año anterior)
├─ days_total (Días disponibles totales)
├─ days_used (Días consumidos)
├─ days_remaining (Saldo al final)
├─ days_expired (Días que expiraron)
├─ expires_on (assigned_date + 2 años, conforme ley japonesa)
└─ status (ACTIVE | EXPIRED)
```

#### Tabla 2: `yukyu_requests` - Solicitudes de Vacaciones
```
Campos clave:
├─ id (PK)
├─ employee_id (FK → empleado solicitante)
├─ requested_by_user_id (FK → TANTOSHA que crea)
├─ factory_id (FK → fábrica donde trabaja)
├─ request_type (yukyu|hankyu|ikkikokoku|taisha)
├─ start_date (Fecha inicio)
├─ end_date (Fecha fin)
├─ days_requested (Días solicitados: 0.5-40.0)
├─ yukyu_available_at_request (Snapshot: cuántos tenía en ese momento)
├─ request_date (Cuándo se creó la solicitud)
├─ status (PENDING | APPROVED | REJECTED | COMPLETED)
├─ approved_by_user_id (FK → KEIRI/KEITOSAN que aprueba)
├─ approval_date (Cuándo se aprobó)
└─ rejection_reason (Motivo del rechazo si aplica)
```

**Nota importante:** La solicitud guarda QUIÉN la creó (TANTOSHA) y QUIÉN la aprobó (KEIRI)

#### Tabla 3: `yukyu_usage_details` - Detalle de Uso LIFO
```
Campos clave:
├─ id (PK)
├─ request_id (FK → solicitud)
├─ balance_id (FK → balance específico de ese año)
├─ usage_date (Fecha en que se usó)
└─ days_deducted (Cuántos días se dedujeron: 0.5 o 1.0)
```

**Implementación LIFO:** Los balances más nuevos se usan primero
- Ejemplo: Tiene 8 días de 2023 + 11 días de 2024 → Usa 5 días → Se deducen 5 de 2024 (primero el más nuevo)

---

### 2. MATRIZ DE ROLES Y PERMISOS

#### Jerarquía de Roles (en sistema):
```
SUPER_ADMIN (Control total)
    ↓
ADMIN (Administrador)
    ↓
KEITOSAN (経理管理 - Finance Manager) ← Especial para yukyus
    ↓
TANTOSHA (担当者 - HR Representative) ← Especial para yukyus
    ↓
COORDINATOR (Coordinador)
    ↓
KANRININSHA (管理人者 - Office Manager)
    ↓
EMPLOYEE (Empleado)
    ↓
CONTRACT_WORKER (Trabajador por contrato)
```

#### Permisos por Rol (ACTUAL)

| Funcionalidad | SUPER_ADMIN | ADMIN | KEITOSAN | TANTOSHA | EMPLOYEE | CONTRACT_WORKER |
|---|---|---|---|---|---|---|
| Ver su balance | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver balance de otros | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Crear solicitud | ✅ | ✅ | ✅ | ✅ | ✅¹ | ❌ |
| Aprobar solicitud | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Rechazar solicitud | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ver historial | ✅ | ✅ | ✅ | ✅ | ✅² | ✅² |
| Exportar reportes | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Configurar parámetros | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

¹ EMPLOYEE puede crear mediante `require_role("employee")` en backend
² Solo pueden ver su propio historial

---

### 3. ENDPOINTS API (14 ENDPOINTS TOTALES)

#### Grupo 1: Administración de Balances
```
POST   /api/yukyu/balances/calculate
       Permiso: require_role("admin") [ADMIN, SUPER_ADMIN]
       Descripción: Calcula y crea balances para un empleado

GET    /api/yukyu/balances
       Permiso: Any user authenticated
       Descripción: Resumen de yukyu (personal o global si admin)

GET    /api/yukyu/balances/{employee_id}
       Permiso: require_role("employee")
       Descripción: Balance específico de un empleado
```

#### Grupo 2: Gestión de Solicitudes (CRÍTICO)
```
POST   /api/yukyu/requests/
       Permiso: require_role("employee") ← Cualquiera autenticado
       Descripción: Crear solicitud (TANTOSHA la crea)
       Nota: Sin validación de que sea realmente TANTOSHA

GET    /api/yukyu/requests/
       Permiso: Any user authenticated
       Descripción: Lista solicitudes (filtrado por rol internamente)

PUT    /api/yukyu/requests/{id}/approve
       Permiso: require_role("admin") [ADMIN, KEITOSAN]
       Descripción: Aprueba y deduce yukyus (KEIRI/KEITOSAN)

PUT    /api/yukyu/requests/{id}/reject
       Permiso: require_role("admin")
       Descripción: Rechaza solicitud
```

#### Grupo 3: Soporte
```
GET    /api/yukyu/employees/by-factory/{factory_id}
       Permiso: require_role("employee")
       Descripción: Empleados de una fábrica

GET    /api/yukyu/usage-history/{employee_id}
       Permiso: Any user
       Descripción: Historial con LIFO (muy importante)

GET    /api/yukyu/requests/{id}/pdf
       Permiso: Any user
       Descripción: Descarga PDF de solicitud

GET    /api/yukyu/reports/export-excel
       Permiso: require_role("admin")
       Descripción: Exporta reporte a Excel

POST   /api/yukyu/maintenance/expire-old-yukyus
       Permiso: require_role("admin")
       Descripción: Cron para expirar yukyus después de 2 años

GET    /api/yukyu/maintenance/scheduler-status
       Permiso: require_role("admin")
       Descripción: Estado del scheduler

GET    /api/yukyu/payroll/summary
       Permiso: require_role("admin")
       Descripción: Integración con payroll
```

---

### 4. COMPONENTES FRONTEND (6 PÁGINAS PRINCIPALES)

#### Página 1: `/yukyu` - Dashboard Personal
**Archivo:** `frontend/app/(dashboard)/yukyu/page.tsx` (254 líneas)
- Cards: Días disponibles | Días usados | Días expirados
- Tabla: Solicitudes recientes (status color-coded)
- Acceso: ✅ Todos los usuarios autenticados
- **Problema:** Sin validación de rol

#### Página 2: `/yukyu-requests/create` - Crear Solicitud
**Archivo:** `frontend/app/(dashboard)/yukyu-requests/create/page.tsx` (378 líneas)
- Flujo: Selecciona fábrica → Empleado → Datos de solicitud
- Valida: días_solicitados ≤ días_disponibles
- Acceso: ✅ Todos (aunque idealmente TANTOSHA)
- **Problema:** Sin validación de que sea TANTOSHA

#### Página 3: `/yukyu-requests` - Panel de Aprobación **[CRÍTICO]**
**Archivo:** `frontend/app/(dashboard)/yukyu-requests/page.tsx` (488 líneas)
- Cards: Solicitudes pendientes | Aprobadas | Rechazadas
- Acciones: Botones [Aprobar] [Rechazar] [Descargar PDF]
- Diálogos: Aprobar requiere notas | Rechazar requiere motivo
- Acceso: ✅ Todos (aunque idealmente KEITOSAN/ADMIN)
- **Problema CRÍTICO:** Cualquier usuario puede ver/actuar en aprobaciones

#### Página 4: `/yukyu-history` - Historial de Uso LIFO
**Archivo:** `frontend/app/(dashboard)/yukyu-history/page.tsx` (386 líneas)
- Búsqueda: por 社員№ (número empleado)
- Tabla: Fecha | Tipo | Días | Año Fiscal | Estado | Notas
- Colores por año fiscal (color-coded)
- Explicación LIFO clara
- Acceso: ✅ Todos (pero debería poder ver solo su historial)
- **Problema:** EMPLOYEE podría ver historial de otros

#### Página 5: `/yukyu-reports` - Reportes Administrativos
**Archivo:** `frontend/app/(dashboard)/yukyu-reports/page.tsx` (396 líneas)
- Cards: Total empleados | Total días | Promedio | % uso
- Gráfico: Distribución por rango de días
- Alertas: Sin yukyu | Poco yukyu (1-3) | Mucho yukyu (15+)
- Exportación: Excel con estadísticas
- Acceso: ✅ Todos (aunque idealmente ADMIN/KEITOSAN)
- **Problema:** Información sensible visible para todos

#### Página 6: `/admin/yukyu-management` - Administración
**Archivo:** `frontend/app/(dashboard)/admin/yukyu-management/page.tsx`
- Gestión avanzada de yukyus
- Cálculo manual de balances
- Acceso: Debería ser ADMIN only
- **Problema:** Sin protección

---

### 5. PROBLEMAS IDENTIFICADOS

#### 🔴 CRÍTICOS

**#1 - Sin Protección de Rutas por Rol**
- Todas las páginas de yukyu son accesibles por cualquier usuario autenticado
- No hay redirección a AccessDenied o similar
- Solución: Añadir check de rol en cada página

**#2 - Panel de Aprobación Expuesto**
- `/yukyu-requests` (aprobación) es público
- Cualquiera puede teóricamente aprobar/rechazar solicitudes
- El backend lo previene pero UI es confusa

**Ejemplo de riesgo:**
```
EMPLOYEE abre devtools
→ Navega a /yukyu-requests
→ Ve todas las solicitudes pendientes
→ Aunque no puede hacer clic (deshabilitado en UI)
→ Pero podría llamar API directamente si tuviera token
```

#### 🟡 MODERADOS

**#3 - Comentario Desactualizado**
- `/yukyu/page.tsx` línea 151 dice "（担当者用）" (para TANTOSHA)
- Pero la página es para TODOS los usuarios

**#4 - Inconsistencia de Nomenclatura**
- Backend usa "KEITOSAN" (経理管理)
- Pero también menciona "KEIRI" (経理) informalmente
- Frontend no tiene rol específico, solo valida "admin"

**#5 - Hook usePagePermission No Usado**
- Existe `frontend/hooks/use-page-permission.ts`
- Pero ninguna página de yukyu lo utiliza

**#6 - Exposición de Datos Sensibles**
- `/yukyu-reports` muestra información de TODOS los empleados
- Un EMPLOYEE podría ver quién tiene más/menos yukyus
- Debería estar restringido a ADMIN/KEITOSAN

#### 🟢 MENORES

**#7 - Sin Validación de Fábrica**
- TANTOSHA de fábrica A no puede crear solicitudes para fábrica B
- Validación está en backend pero no en UI

**#8 - Sin Feedback Visual**
- Si la API rechaza una solicitud, mensaje no es claro
- Usuario no sabe por qué falló

---

## 🎯 MATRIZ PROPUESTA DE ACCESO (RECOMENDADO)

| Página/Funcionalidad | SUPER_ADMIN | ADMIN | KEITOSAN | TANTOSHA | EMPLOYEE | CONTRACT_WORKER |
|---|---|---|---|---|---|---|
| `/yukyu` (personal) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/yukyu-requests/create` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `/yukyu-requests` (aprobar) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `/yukyu-history` | ✅ | ✅ | ✅ | ✅ | ✅¹ | ✅¹ |
| `/yukyu-reports` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `/admin/yukyu-management` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

¹ Solo pueden ver su propio historial

---

## 📝 PLAN DE ACCIÓN DETALLADO

### FASE 1: PROTECCIONES DE FRONTEND (2 horas)

#### 1.1 Crear Componente ProtectedRoute para Yukyus
**Acción:** Crear archivo `frontend/components/yukyu/yukyu-role-protector.tsx`
```typescript
export function YukyuRoleProtector({
  children,
  allowedRoles: string[]
}) {
  const user = useAuthStore(state => state.user);

  if (!user || !allowedRoles.includes(user.role)) {
    return <AccessDenied message="No tienes permisos para esta página" />;
  }

  return children;
}
```

#### 1.2 Proteger `/yukyu-requests` (Panel de Aprobación)
**Acción:** Modificar `frontend/app/(dashboard)/yukyu-requests/page.tsx`
```typescript
// Agregar al inicio del componente
const { user } = useAuthStore();
if (!['ADMIN', 'SUPER_ADMIN', 'KEITOSAN'].includes(user?.role)) {
  return <AccessDenied />;
}
```
**Impacto:** Solo ADMIN/KEITOSAN (KEIRI) pueden ver/actuar en aprobaciones

#### 1.3 Proteger `/yukyu-requests/create`
**Acción:** Modificar `frontend/app/(dashboard)/yukyu-requests/create/page.tsx`
```typescript
const { user } = useAuthStore();
if (!['ADMIN', 'SUPER_ADMIN', 'TANTOSHA', 'COORDINATOR'].includes(user?.role)) {
  return <AccessDenied />;
}
```
**Impacto:** Solo HR/TANTOSHA puede crear solicitudes

#### 1.4 Proteger `/yukyu-reports`
**Acción:** Modificar `frontend/app/(dashboard)/yukyu-reports/page.tsx`
```typescript
const { user } = useAuthStore();
if (!['ADMIN', 'SUPER_ADMIN', 'KEITOSAN'].includes(user?.role)) {
  return <AccessDenied />;
}
```
**Impacto:** Reportes confidenciales solo para ADMIN/KEIRI

#### 1.5 Proteger `/yukyu-history` (Filtrado)
**Acción:** Modificar `frontend/app/(dashboard)/yukyu-history/page.tsx`
```typescript
const { user } = useAuthStore();

// Si es EMPLOYEE/CONTRACT_WORKER, solo ve su propio historial
if (['EMPLOYEE', 'CONTRACT_WORKER'].includes(user?.role)) {
  // Fuerza búsqueda por su propio ID
  // Deshabilita búsqueda de otros empleados
}
```
**Impacto:** Privacidad de historial individual

#### 1.6 Corregir Comentario en `/yukyu/page.tsx`
**Acción:** Cambiar línea 151
```typescript
// Antes
<p>従業員の有給休暇を申請します（担当者用）</p>

// Después
<p>あなたの有給休暇の残高と申請履歴を確認できます</p>
// "Puedes ver tu saldo de vacaciones e historial de solicitudes"
```

---

### FASE 2: ESTANDARIZACIÓN DE ROLES (1 hora)

#### 2.1 Actualizar Roles en Backend
**Acción:** Verificar en `backend/app/models/models.py` línea 21
```python
# Asegurar consistencia
# KEITOSAN = 経理管理 (usar este, no KEIRI)
# TANTOSHA = 担当者 (usar este)

class UserRole(str, enum.Enum):
    KEITOSAN = "KEITOSAN"    # 経理管理 - Finance Manager
    TANTOSHA = "TANTOSHA"    # 担当者 - HR Representative
```

#### 2.2 Actualizar Comentarios en API
**Acción:** Buscar "keiri" en `backend/app/api/yukyu.py`
```python
# Cambiar toda referencia de "keiri" → "KEITOSAN"
# Ejemplo en línea 243
async def approve_yukyu_request(
    ...
):
    """
    Approve yukyu request (by KEITOSAN - Finance Manager).

    **Permissions:** KEITOSAN, ADMIN, SUPER_ADMIN
    """
```

#### 2.3 Crear Constante de Roles en Frontend
**Acción:** Crear `frontend/lib/yukyu-roles.ts`
```typescript
export const YUKYU_ROLES = {
  ADMIN: ['SUPER_ADMIN', 'ADMIN'],
  KEIRI: ['KEITOSAN', 'ADMIN', 'SUPER_ADMIN'],
  TANTOSHA: ['TANTOSHA', 'ADMIN', 'SUPER_ADMIN'],
  COORDINATOR: ['COORDINATOR', 'ADMIN', 'SUPER_ADMIN'],
};

export function canApproveYukyu(role?: string): boolean {
  return YUKYU_ROLES.KEIRI.includes(role || '');
}

export function canCreateYukyuRequest(role?: string): boolean {
  return YUKYU_ROLES.TANTOSHA.includes(role || '');
}

export function canViewReports(role?: string): boolean {
  return YUKYU_ROLES.KEIRI.includes(role || '');
}
```

---

### FASE 3: MEJORAR VALIDACIÓN EN BACKEND (1.5 horas)

#### 3.1 Validar TANTOSHA en POST /yukyu/requests/
**Acción:** Modificar `backend/app/api/yukyu.py` línea 179
```python
@router.post("/requests/", ...)
async def create_yukyu_request(
    request_data: YukyuRequestCreate,
    current_user: User = Depends(auth_service.require_role("employee")),
    db: Session = Depends(get_db)
):
    """
    Create yukyu request (by TANTOSHA - HR Representative).

    **Permissions:** TANTOSHA, ADMIN, SUPER_ADMIN

    **Validation:**
    - Only TANTOSHA can create on behalf of employees
    - Must be from same factory
    - Days must be ≤ available
    """

    # Agregar validación de factory
    if current_user.role == "TANTOSHA":
        # Verificar que TANTOSHA está en la fábrica correcta
        # Prevenir crear solicitudes fuera de su fábrica
        pass
```

#### 3.2 Validar KEITOSAN en PUT /yukyu/requests/{id}/approve
**Acción:** Modificar línea 243
```python
@router.put("/requests/{request_id}/approve", ...)
async def approve_yukyu_request(
    request_id: int,
    approval_data: YukyuRequestApprove,
    current_user: User = Depends(auth_service.require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Approve yukyu request (by KEITOSAN - Finance Manager).

    **Permissions:** KEITOSAN, ADMIN, SUPER_ADMIN

    **Process:**
    1. Validate request exists and status == PENDING
    2. Deduct days using LIFO algorithm
    3. Create YukyuUsageDetail records
    4. Update request status to APPROVED
    5. Record who approved and when
    6. Send notification to employee
    """

    # Asegurar que solo KEITOSAN/ADMIN aprueban
    if current_user.role not in ["ADMIN", "SUPER_ADMIN", "KEITOSAN"]:
        raise HTTPException(status_code=403, detail="Only KEITOSAN can approve")
```

#### 3.3 Añadir Validación de Historial Filtrado
**Acción:** Modificar línea 486 (usage-history endpoint)
```python
@router.get("/usage-history/{employee_id}", ...)
async def get_usage_history(
    employee_id: int,
    fiscal_year: Optional[int] = None,
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get yukyu usage history (with LIFO details).

    **Access Control:**
    - ADMIN/SUPER_ADMIN: Can view any employee's history
    - KEITOSAN: Can view any employee's history
    - EMPLOYEE: Can only view their own history
    """

    # Verificar acceso
    if current_user.role not in ["ADMIN", "SUPER_ADMIN", "KEITOSAN"]:
        if current_user.employee_id != employee_id:
            raise HTTPException(status_code=403,
                detail="Can only view your own history")
```

---

### FASE 4: MEJORAR INTEGRACIÓN PAYROLL (1 hora)

#### 4.1 Vincular Yukyus a Cálculo de Payroll
**Acción:** Verificar `backend/app/services/payroll_service.py`
```python
# Al calcular salario, descontar días de yukyu
# Fórmula:
# horas_trabajadas = (días_período - días_yukyu_aprobados) * 8

def calculate_employee_payroll(employee_id, start_date, end_date):
    # 1. Obtener días de yukyu aprobados en el período
    approved_yukyus = db.query(YukyuRequest).filter(
        YukyuRequest.employee_id == employee_id,
        YukyuRequest.status == "APPROVED",
        YukyuRequest.start_date >= start_date,
        YukyuRequest.end_date <= end_date
    ).all()

    yukyu_days = sum(r.days_requested for r in approved_yukyus)

    # 2. Calcular horas trabajadas
    # horas = (días_período - días_yukyu) * 8 horas/día

    # 3. Aplicar tasas según tipo de día
    # ...
```

#### 4.2 Crear Reporte Integrado
**Acción:** Crear endpoint `/api/payroll/yukyu-summary`
```python
@router.get("/api/payroll/yukyu-summary")
async def get_payroll_yukyu_summary(
    start_date: date,
    end_date: date,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Get summary of yukyu usage for payroll period.

    Retorna:
    {
        "period": "2025-01",
        "total_employees": 42,
        "employees_with_yukyu": 28,
        "total_yukyu_days": 45.5,
        "total_yukyu_value_jpy": 562500,  # 45.5 * 12348 yen/day avg
        "details": [
            {
                "employee_id": 1,
                "employee_name": "田中太郎",
                "yukyu_days": 2.0,
                "yukyu_value": 24696,
                "requests": [...]
            }
        ]
    }
    """
```

---

### FASE 5: CREAR DASHBOARD DE KEIRI (1.5 horas)

#### 5.1 Crear Página `/keiri/yukyu-dashboard`
**Acción:** Crear `frontend/app/(dashboard)/keiri/yukyu-dashboard/page.tsx`
```typescript
// Página específica para KEITOSAN (Finance Manager)
// Muestra:
// 1. Solicitudes pendientes por revisar
// 2. Solicitudes aprobadas recientemente
// 3. Estadísticas de usage
// 4. Alertas legales (5 días mínimos)
// 5. Botones para bulk approve/reject

export default function KeiriYukyuDashboard() {
  const { user } = useAuthStore();

  // Solo KEITOSAN/ADMIN
  if (!['KEITOSAN', 'ADMIN', 'SUPER_ADMIN'].includes(user?.role)) {
    return <AccessDenied />;
  }

  return (
    <div>
      <h1>有給休暇管理 (Finance Manager Dashboard)</h1>

      {/* 1. Solicitudes pendientes */}
      <PendingRequests />

      {/* 2. Stats */}
      <Stats />

      {/* 3. Alertas legales */}
      <LegalAlerts />
    </div>
  );
}
```

---

### FASE 6: DOCUMENTACIÓN Y TRAINING (1 hora)

#### 6.1 Crear Guía de Yukyus
**Archivo:** `docs/guides/yukyu-management-guide.md`
```
# Guía de Gestión de Yukyus (有給休暇)

## Para TANTOSHA (担当者 - HR)
1. Acceder a `/yukyu-requests/create`
2. Seleccionar fábrica donde trabaja el empleado
3. Seleccionar empleado
4. Ingresar fechas y días solicitados
5. Enviar solicitud

## Para KEITOSAN (経理 - Finance)
1. Acceder a `/yukyu-requests`
2. Revisar solicitudes pendientes
3. Verificar días disponibles
4. Aprobar o rechazar con motivo
5. Generar reportes mensuales

## Reglas Legales (Japan Labor Law)
- 6 meses: 10 días
- 18 meses: 11 días
- Expiración: 2 años (時効)
- Mínimo a usar: 5 días/año
```

#### 6.2 Crear Documento de Flujo
**Archivo:** `docs/guides/yukyu-workflow.md`
```
# Flujo de Solicitud de Yukyus

PASO 1: TANTOSHA crea solicitud
PASO 2: Envía a API con datos de empleado + período
PASO 3: KEITOSAN recibe notificación
PASO 4: KEITOSAN revisa y aprueba
PASO 5: Sistema deduce días (LIFO)
PASO 6: Empleado recibe confirmación
```

---

## 📊 RESUMEN DE CAMBIOS PROPUESTOS

### Frontend Changes (5 páginas)
| Archivo | Cambio | Líneas | Riesgo |
|---------|--------|--------|--------|
| `/yukyu-requests/page.tsx` | Agregar check de KEITOSAN | ~5 | Bajo |
| `/yukyu-requests/create/page.tsx` | Agregar check de TANTOSHA | ~5 | Bajo |
| `/yukyu-reports/page.tsx` | Agregar check de ADMIN/KEIRI | ~5 | Bajo |
| `/yukyu-history/page.tsx` | Filtrar por rol (privacidad) | ~10 | Bajo |
| `/yukyu/page.tsx` | Corregir comentario | ~1 | Nulo |

### Backend Changes (3 endpoints)
| Endpoint | Cambio | Riesgo |
|----------|--------|--------|
| `POST /yukyu/requests/` | Validar TANTOSHA + factory | Bajo |
| `PUT /yukyu/requests/{id}/approve` | Validar KEITOSAN | Bajo |
| `GET /yukyu/usage-history/{id}` | Validar acceso por rol | Bajo |

### Nuevos Archivos (2)
| Ruta | Descripción |
|------|-------------|
| `frontend/lib/yukyu-roles.ts` | Constantes de roles y funciones |
| `frontend/app/(dashboard)/keiri/yukyu-dashboard/page.tsx` | Dashboard específico para KEIRI |

---

## ⏰ CRONOGRAMA ESTIMADO

| Fase | Descripción | Duración | Inicio | Fin |
|------|-------------|----------|--------|-----|
| 1 | Protecciones Frontend | 2h | 14:00 | 16:00 |
| 2 | Estandarización de Roles | 1h | 16:00 | 17:00 |
| 3 | Validación Backend | 1.5h | 17:00 | 18:30 |
| 4 | Integración Payroll | 1h | 18:30 | 19:30 |
| 5 | Dashboard KEIRI | 1.5h | 19:30 | 21:00 |
| 6 | Documentación | 1h | 21:00 | 22:00 |
| **TOTAL** | | **7.5h** | | |

---

## ✅ CHECKLIST DE VALIDACIÓN

- [ ] Todas las páginas de yukyu validan rol del usuario
- [ ] KEITOSAN solo ve panel de aprobación
- [ ] TANTOSHA solo ve panel de creación
- [ ] EMPLOYEE solo ve su propio historial
- [ ] Roles están estandarizados (KEITOSAN, TANTOSHA)
- [ ] Backend valida permisos correctamente
- [ ] Sin exposición de datos sensibles
- [ ] Documentación actualizada
- [ ] Tests passed

---

## 🚀 PRÓXIMOS PASOS

1. Aprobación de plan
2. Implementación en branch `claude/analyze-yukyus-structure-011CV3zF69mdcFr3HmQBNJZp`
3. Testing completo
4. Merge a main
5. Despliegue a producción

