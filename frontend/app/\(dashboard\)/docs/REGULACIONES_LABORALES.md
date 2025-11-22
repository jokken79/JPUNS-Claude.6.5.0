# ⚖️ Regulaciones Laborales Japonesas - Yukyus (有給休暇)

> **Documentación Detallada**: Ver [`FASE5_EDGE_CASES_GUIDE.md`](../../../../../../FASE5_EDGE_CASES_GUIDE.md) en la raíz del proyecto

---

## 📜 Ley Laboral (労働基準法)

### Artículo 39 - Derechos de Yukyu

**Definición**: Yukyu (有給休暇) = Paid Vacation / Paid Time Off (PTO)

**Derechos del Empleado:**
- ✅ **Mínimo**: 5.0 días de yukyu pagado al año
- ✅ **Máximo**: Hasta 20 días por año (según tipo de contrato)
- ✅ **Período**: Año fiscal (Abril 1 - Marzo 31) o año calendario
- ✅ **Pago**: Salario completo (como si trabajara)
- ✅ **Acumulación**: Años anteriores (hasta cierto límite)

---

## 💰 Cálculo de Pago

### Fórmula Básica

```
PAGO YUKYU = Días × Teiji (定時) × Tasa Horaria Base

Componentes:
├─ Días: Número de días solicitados (1.0, 0.5, etc.)
├─ Teiji: Horario estándar (definido en contrato)
└─ Tasa Horaria Base: Salario base/hora
```

### Teiji (定時 - Horario Estándar)

**Definición**: Horas de trabajo estándar por día

**Cálculo Típico:**
```
Teiji = Horas Estándar Mensuales ÷ 20 días
      = 160 horas/mes ÷ 20 días
      = 8 horas/día
```

**Variable por Empleado:**
```
Ejemplo 1: Empleado full-time
├─ Horas/mes: 160 horas
├─ Teiji: 160 ÷ 20 = 8 horas/día
└─ Standard en Japón

Ejemplo 2: Empleado part-time
├─ Horas/mes: 120 horas
├─ Teiji: 120 ÷ 20 = 6 horas/día
└─ Menos que full-time

Ejemplo 3: Empleado shift
├─ Horas/mes: Variable
├─ Teiji: Según contrato
└─ Puede ser 7.5 u 8.5 horas/día
```

### Tasa Horaria Base

**Fuente**: Salario base del empleado
```
Tasa Horaria = Salario Mensual ÷ Teiji Total Mensual
             = Salario Mensual ÷ 160

Ejemplo:
├─ Salario: ¥300,000/mes
├─ Tasa Horaria: ¥300,000 ÷ 160 horas = ¥1,875/hora
└─ Yukyu 1 día: 1 × 8 × ¥1,875 = ¥15,000
```

---

## ⚡ Año Fiscal Japonés

### Período

```
Año Fiscal:
├─ Inicio: Abril 1
├─ Fin: Marzo 31
└─ Duración: 12 meses

Ejemplo FY 2024-2025:
├─ Inicio: Abril 1, 2024
└─ Fin: Marzo 31, 2025
```

### Por Qué Abril 1?

Razones históricas y administrativas en Japón:
- Coincide con ciclo académico
- Alineado con ciclo fiscal corporativo
- Facilitador para nómina y presupuestos

### Cálculo Fiscal

Para cualquier fecha en el sistema:
```python
fiscal_year = date.year if date.month >= 4 else date.year - 1

Ejemplos:
├─ Enero 2025 → FY 2024
├─ Marzo 31, 2025 → FY 2024
├─ Abril 1, 2025 → FY 2025
└─ Diciembre 2025 → FY 2025
```

---

## 📋 Casos Especiales

### 1. Yukyu No Usados - ⚠️ CRÍTICO

**Problema Legal:**
```
Si empleado NO usa 5+ días = VIOLACIÓN DE LEY

Penalidades:
├─ Multa: ¥300,000 - ¥600,000
├─ Responsabilidad criminal (empleador)
├─ Demanda de empleados
└─ Daño a reputación
```

**Solución Requerida:**
```
Opción 1: Forzar Yukyu
├─ KEITOSAN fuerza días antes fin de FY
├─ Registrar en sistema para auditoría
└─ Documentar motivo

Opción 2: Pagar en Dinero
├─ Compensación en efectivo
├─ Cálculo: días_restantes × teiji × tasa_base
└─ Requiere acuerdo del empleado
```

**Ejemplo:**
```
Empleado: Yamada Taro
FY 2024-2025: Usa 4 días
Mínimo requerido: 5 días
Falta: 1 día

Antes Marzo 31, 2025:
└─ KEITOSAN fuerza 1 día de yukyu
   ├─ Paga: 1 × 8 × ¥1,875 = ¥15,000
   └─ Registra en auditoría
```

---

### 2. Renuncia del Empleado

**Derechos:**
```
Días no usados = DEBEN SER PAGADOS en efectivo

Cálculo:
├─ Días restantes en FY
├─ Tasa: días × teiji × tasa_base
└─ Incluido en finiquito
```

**Ejemplo:**
```
Empleado: Suzuki Hanako
Renuncia: Enero 15, 2025
FY 2024-2025: Ha usado 3 días (resta 2)
Teiji: 8 horas/día
Tasa: ¥1,875/hora

Finiquito incluye:
└─ Compensación yukyu: 2 × 8 × ¥1,875 = ¥30,000
```

---

### 3. Enfermedad o Accidente

**Diferencia Importante:**
```
Yukyu (有給休暇)
├─ Empleado elige fechas
├─ Se deduce de asignación
└─ Pago normal

Enfermedad/Accidente
├─ NO elige fechas
├─ NO se deduce de yukyu
├─ Se paga como "incapacidad laboral"
└─ Sistema separado del yukyu
```

**Implicación:**
```
Si empleado tiene gripe 3 días:
├─ NO cuenta como yukyu
├─ Yukyu sigue siendo 5 días disponibles
└─ Se paga por enfermedad (sistema separado)
```

---

### 4. Empleado Recientemente Contratado

**Cálculo Proporcional:**
```
Si empleado contratado en año fiscal:
├─ Calcular proporción de año trabajado
├─ Entitlement proporcional
└─ Redondeado hacia arriba

Ejemplo:
├─ Contratado: Octubre 15, 2024
├─ FY: Abril 1, 2024 - Marzo 31, 2025
├─ Días trabajados en FY: ~169 días
├─ Entitlement: 5 × (169/365) = 2.3 → 2.5 días
└─ Mínimo aplicable: 2.5 días
```

---

## 🔍 Auditoría y Compliance

### Registro Obligatorio

**Empresa debe mantener:**
```
□ Registro de días aprobados por empleado
□ Fechas específicas de disfrute
□ Dinero pagado por yukyu
□ Documentación de aceptación del empleado
□ Motivo de rechazos (si aplica)
```

**Duración**: Mínimo 3 años

---

### Inspección Laboral

**Autoridades pueden inspeccionar:**
```
Labor Bureau (労働基準監督署) puede revisar:
├─ Sistema de gestión de yukyu
├─ Registros de aprobaciones
├─ Nómina vs horas trabajadas
├─ Conformidad con mínimo de 5 días
├─ Procedimientos de cálculo
└─ Documentación de empleados
```

**Frecuencia**: No programada (random)

---

## 🚨 Penalidades por Incumplimiento

### Multas

```
Rango: ¥300,000 - ¥600,000
Caso típico: No forzar 5 días mínimos
Aplicable a: Empleador (empresa)
```

### Responsabilidad Criminal

```
Posible en casos graves:
├─ Patrón sistemático
├─ Múltiples empleados afectados
└─ Daño significativo

Responsable: Empleador/KEITOSAN
```

### Demandas de Empleados

```
Empleados pueden demandar por:
├─ Compensación de días no pagados
├─ Daños y perjuicios
├─ Estrés emocional
└─ Punitive damages (casos graves)
```

### Daño a Reputación

```
Consecuencias no legales:
├─ Pérdida de confianza de empleados
├─ Dificultad para contratar
├─ Cobertura negativa en medios
└─ Relaciones con sindicatos dañadas
```

---

## 📊 Tabla de Referencia Rápida

| Concepto | Valor | Nota |
|----------|-------|------|
| Mínimo anual | 5.0 días | Ley laboral - OBLIGATORIO |
| Máximo anual | 20 días | Según contrato |
| Teiji típico | 8 h/día | Variable por empleado |
| Año fiscal | Abr-Mar | O año calendario (empresa) |
| Pago | Salario completo | Como día trabajado |
| Registro | Obligatorio | Para auditoría (3 años min) |
| Penalidad | ¥300k-600k | + responsabilidad criminal |
| Renuncia | Pagado en dinero | Finiquito |
| Enfermedad | Separado | No deduce yukyu |

---

## 💻 Implementación en Sistema

### En JPUNS

```
Backend:
├─ Validar mínimo 5 días por FY
├─ Calcular FY automáticamente
├─ Aplicar fórmula de deducción correcta
├─ Registrar para auditoría
└─ Alertar si <5 días antes fin FY

Frontend:
├─ Mostrar días disponibles
├─ Alertas de cumplimiento (🟢🟡🔴)
├─ Facilitar fuerza de yukyu
└─ Generar reportes de compliance
```

---

## 📞 Referencias Legales

- **Ley Laboral de Japón**: 労働基準法
- **Artículo específico**: Artículo 39
- **Autoridad**: Ministerio de Trabajo - Japón
- **Más información**: Sitio oficial del gobierno

---

## ❓ Preguntas Comunes

**P: ¿Pueden las empresas rechazar yukyu?**
R: No legalmente. Mínimo 5 días debe ser aprobado. KEITOSAN puede rechazar solicitudes específicas pero debe asegurar que se usen 5+ días al año.

**P: ¿Se puede negar yukyu por "necesidad empresarial"?**
R: No. Empleado tiene derecho. Empresa debe planificar cobertura.

**P: ¿Qué pasa si empleado está enfermo?**
R: No se deduce de yukyu. Sistema separado.

**P: ¿Se puede acumular yukyu de años anteriores?**
R: Sí, con límites. Típicamente máximo 40 días acumulados (2 años).

---

**Última Actualización**: 2025-11-22
**Estado**: ✅ COMPLETO
**Cumplimiento**: Alineado con ley laboral japonesa actual
