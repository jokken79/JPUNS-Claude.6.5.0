# GUÍA KEITOSAN (経理管理) - Sistema de Yukyus

## ¿Quién es KEITOSAN?

**KEITOSAN (経理管理)** = Finance Manager / Contable Manager

El KEITOSAN es el responsable de:
- ✅ Aprobar o rechazar solicitudes de yukyu (有給休暇)
- ✅ Monitorear el cumplimiento legal de derechos de yukyu
- ✅ Gestionar detracciones de salario por yukyu
- ✅ Generar reportes de cumplimiento fiscal
- ❌ NO puede crear solicitudes (solo TANTOSHA)
- ❌ NO puede asignar empleados a factories (solo KANRININSHA)

---

## Dashboard KEITOSAN: Acceso y Características

### Cómo Acceder

```
URL: https://app.example.com/keiri/yukyu-dashboard

1. Login con credenciales KEITOSAN
2. Click en menú → Keiri → Yukyu Dashboard
3. O acceso directo: /keiri/yukyu-dashboard
```

**Requisito:** Tu rol debe ser `KEITOSAN`, `ADMIN` o `SUPER_ADMIN`

---

## Funcionalidades Principales

### 1. 📊 Panel de Métricas (Summary Cards)

El dashboard muestra 4 métricas en tiempo real:

#### Card 1: Total de Días Aprobados (Total Yukyu Days)
- **Qué es:** Suma de todos los días de yukyu aprobados en el mes actual
- **Por qué importa:** Control de presupuesto de yukyus
- **Ejemplo:** 23.5 días aprobados en noviembre

#### Card 2: Empleados con Yukyu (Employees with Yukyu)
- **Qué es:** Cantidad de empleados que han solicitado yukyu este mes
- **Por qué importa:** Impacto en nómina
- **Ejemplo:** 12 empleados con solicitudes aprobadas

#### Card 3: Deducción Total (Total Deduction)
- **Qué es:** Monto total deducido del salario por yukyus aprobados
- **Fórmula:** `Σ(días × teiji × tarifa_horaria)`
- **Por qué importa:** Presupuesto de nómina
- **Ejemplo:** ¥562,500 deducidos

#### Card 4: Tasa de Cumplimiento (Compliance Rate)
- **Qué es:** Porcentaje de empleados con ≥5 días yukyu/año
- **Por qué importa:** Cumplimiento legal (Article 39)
- **Ejemplo:** 95% de cumplimiento (3 empleados en riesgo)

---

### 2. 📈 Tab "Overview" - Gráfico de Tendencias

**Gráfico combinado** que muestra:

- **Eje izquierdo (Azul):** Días aprobados y empleados
- **Eje derecho (Naranja):** Deducción total en ¥1000s

**Cómo leer:**
```
Noviembre 2025:
├─ Línea azul = 23.5 días aprobados
├─ Línea naranja = ¥562K deducción
└─ Empleados = 12
```

**Acciones:**
- Pasar mouse sobre punto = ver datos exactos
- Seleccionar rango = zoom
- Descargar = click derecho → Save image

---

### 3. ⚖️ Tab "Compliance" - Cumplimiento Legal

**Tarjeta de Compliance:**

Muestra el estado de **Article 39** (Ley Laboral Japonesa):

```
┌─────────────────────────────────────┐
│ Cumplimiento: 95%                   │
├─────────────────────────────────────┤
│ ✓ Cumplidos: 39 empleados          │
│ ⚠ En Riesgo: 3 empleados           │
│                                     │
│ REQUIERE ATENCIÓN:                  │
│ • Yamada Taro (2.0 días)           │
│ • Suzuki Hanako (1.5 días)         │
│ • Tanaka Jiro (3.0 días)           │
└─────────────────────────────────────┘
```

**Definiciones:**
- **Cumplido:** Total de días usados + disponibles ≥ 5 días/año
- **En Riesgo:** Total de días < 5 días/año
- **Año Fiscal:** Abril-Marzo (calendario japonés)

**Acciones Recomendadas:**
1. Notificar a empleados en riesgo
2. Alentar tomar yukyu pendiente
3. Registrar en audit log para cumplimiento fiscal

---

### 4. ✅ Tab "Pending Requests" - Solicitudes Pendientes

**Tabla de solicitudes** pendientes de aprobación:

```
┌──────────────────────────────────────────────────┐
│ EMPLEADO         │ DÍAS │ FECHAS        │ ACCIONES│
├──────────────────────────────────────────────────┤
│ Yamada Taro      │  2   │ 2025-11-10   │ ✓ ✗    │
│ Suzuki Hanako    │ 0.5  │ 2025-11-12   │ ✓ ✗    │
│ Tanaka Jiro      │  1   │ 2025-11-15   │ ✓ ✗    │
└──────────────────────────────────────────────────┘
```

**Cómo Procesar:**

1. **Click ✓ (Approve)**
   - La solicitud se aprueba
   - Se deduce del salario automáticamente
   - Se actualiza dashboard
   - Se envía notificación al empleado

2. **Click ✗ (Reject)**
   - La solicitud se rechaza
   - Se devuelven los días al pool del empleado
   - Se notifica al TANTOSHA
   - Requiere comentario (opcional)

---

## 📐 Fórmula de Cálculo de Deducción

Cuando KEITOSAN aprueba una solicitud, se calcula automáticamente:

### Deducción por Yukyu

```
deducción = días_aprobados × teiji_horas_por_día × tarifa_horaria_base

Donde:
├─ días_aprobados: Días solicitados en el yukyu
├─ teiji_horas_por_día: standard_hours_per_month ÷ 20
│  (Ejemplo: 160 horas/mes ÷ 20 = 8 horas/día)
└─ tarifa_horaria_base: jikyu del empleado (¥/hora)
```

### Ejemplo Numérico

```
Empleado: Yamada Taro
Datos:
├─ Días aprovados: 1 día
├─ Teiji: 8 horas/día (160 horas/mes ÷ 20)
├─ Tarifa horaria: ¥1,500/hora
└─ Resultado: 1 × 8 × ¥1,500 = ¥12,000 deducción
```

### Impacto en Nómina

```
ANTES (Sin yukyu):
├─ Horas trabajadas: 160
└─ Salario bruto: ¥240,000

DESPUÉS (Con 1 día de yukyu):
├─ Horas trabajadas: 152 (160 - 8)
├─ Deducción yukyu: ¥12,000
└─ Salario bruto: ¥228,000 (¥240,000 - ¥12,000)
```

---

## ⚠️ Cumplimiento Legal: Article 39

### ¿Qué es Article 39?

La **Ley Laboral Japonesa Article 39** garantiza:
- ✅ Mínimo 5 días de yukyu pagado por año
- ✅ Acumulable año a año
- ✅ No prescribe hasta 3 años
- ✅ Pago obligatorio si no se toma

### Requisitos de Cumplimiento

Para **cada empleado activo** en año fiscal:

```
Total Days ≥ 5 = COMPLIANT (✓)

Donde:
Total Days = días_usados_este_año + días_disponibles_actualmente
```

### Monitoreo Automático

El dashboard marca **automáticamente** cuando un empleado:
- ❌ Está bajo 5 días
- ⚠️  Está bajo 3 días
- 🔴 Está bajo 1 día

**Acción recomendada:** Alentar al empleado a tomar yukyu antes de fin de año fiscal (31 Marzo)

---

## 🔐 Restricciones de KEITOSAN

### Lo que PUEDES hacer

| Acción | Permiso |
|--------|---------|
| Ver todas las solicitudes | ✅ Sí |
| Aprobar solicitudes | ✅ Sí |
| Rechazar solicitudes | ✅ Sí |
| Ver historial de empleado | ✅ Sí |
| Descargar reportes | ✅ Sí |
| Ver cumplimiento legal | ✅ Sí |

### Lo que NO PUEDES hacer

| Acción | Permiso |
|--------|---------|
| Crear solicitudes de yukyu | ❌ No (Solo TANTOSHA) |
| Asignar empleados a factory | ❌ No (Solo KANRININSHA) |
| Editar datos de empleado | ❌ No (Solo ADMIN) |
| Eliminar solicitudes | ❌ No (Solo SUPER_ADMIN) |
| Cambiar configuración de payroll | ❌ No (Solo ADMIN) |

---

## 📋 Flujo de Trabajo Típico

```
1. Mañana
   └─ Revisar dashboard cada mañana
   └─ Notar "⚠ 2 solicitudes pendientes"

2. Revisión de Solicitudes
   ├─ Verificar detalles del empleado
   ├─ Confirmar fechas de trabajo
   ├─ Calcular impacto de deducción
   └─ Decidir aprobar/rechazar

3. Aprobación
   ├─ Click ✓ en la solicitud
   └─ Sistema calcula deducción automáticamente

4. Verificación
   ├─ Confirmar deducción en nómina
   └─ Notificación se envía al empleado

5. Auditoría
   ├─ Registrar aprobación en log
   └─ Generar reporte mensual
```

---

## 🎯 Checklist Diario del KEITOSAN

- [ ] Revisar solicitudes pendientes cada mañana
- [ ] Aprobar/rechazar dentro de 24-48 horas
- [ ] Verificar empleados en riesgo de cumplimiento
- [ ] Alentar tomar yukyu disponible (si < 5 días)
- [ ] Monitorear tendencias mensuales
- [ ] Registrar decisiones en audit trail
- [ ] Generar reporte semanal

---

## ❓ Preguntas Frecuentes (FAQ)

### P: ¿Qué pasa si rechazo una solicitud?
**R:** La solicitud se cancela, los días vuelven al pool del empleado, y el TANTOSHA es notificado.

### P: ¿Puedo aprobar solicitudes retroactivas?
**R:** No, el sistema previene solicitudes con fechas pasadas en el nivel del TANTOSHA.

### P: ¿Cuántos días de yukyu tiene cada empleado?
**R:** Depende del empleado. Ver la sección "Compliance" para detalles.

### P: ¿Puedo cambiar la tarifa horaria para cálculos?
**R:** No directamente. Contacta a ADMIN para cambios en payroll settings.

### P: ¿Qué significa teiji?
**R:** Teiji (定時) = horas estándar de trabajo por día = 160 horas/mes ÷ 20 = 8 horas/día

### P: ¿Se puede tomar yukyu en fracciones de día?
**R:** Sí, se permite 0.5 días, 1.5 días, etc.

---

## 📞 Soporte

Si tienes problemas con el dashboard:
1. **Error al cargar datos:** Presiona F5 para refrescar
2. **No veo solicitudes:** Verifica que filtro esté en "PENDING"
3. **Error de cálculo:** Contacta a IT con detalles del empleado
4. **Pregunta sobre cumplimiento:** Consulta a Departamento de RR.HH.

**Email soporte:** support@example.com
**Teléfono:** +81-XX-XXXX-XXXX

---

**Última actualización:** 12 de Noviembre 2025
**Versión:** 1.0
**Próxima revisión:** Marzo 2026
