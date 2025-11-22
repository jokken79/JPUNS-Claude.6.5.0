# FASE 5: Dashboard KEIRI para KEITOSAN
## Guía Completa de Uso - Panel de Control Especializado

**Versión**: 1.0
**Fecha**: 2025-11-22
**Rol Objetivo**: KEITOSAN (経理 - Contabilidad/Gerente de Finanzas)
**Otros Roles**: KANRININSHA, TANTOSHA (acceso de lectura)

---

## 📋 Tabla de Contenidos

1. [Acceso al Dashboard](#acceso-al-dashboard)
2. [Descripción General](#descripción-general)
3. [Secciones Principales](#secciones-principales)
4. [Uso Detallado](#uso-detallado)
5. [Métricas y KPIs](#métricas-y-kpis)
6. [Tareas Comunes](#tareas-comunes)
7. [Troubleshooting](#troubleshooting)
8. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## Acceso al Dashboard

### Ubicación en la Interfaz

```
Panel Principal
  ↓
Navegación Principal (menú izquierdo)
  ↓
"Dashboard KEIRI" (icono 📅 con checkmark)
  ↓
/dashboard/keiri/yukyu-dashboard
```

### Requisitos de Acceso

✅ **Roles Autorizados**:
- SUPER_ADMIN (acceso total)
- ADMIN (acceso total)
- COORDINATOR (lectura)
- KANRININSHA (lectura)
- KEITOSAN (acceso total)
- TANTOSHA (lectura)

❌ **Roles No Autorizados**:
- EMPLOYEE (denegado)
- CONTRACT_WORKER (denegado)

### Cómo Acceder

**Opción 1: Desde la Navegación**
1. Abre la aplicación
2. Haz clic en "Dashboard KEIRI" en el menú izquierdo
3. Se cargará el panel en ~2-3 segundos (con datos cacheados)

**Opción 2: URL Directa**
```
https://app.example.com/dashboard/keiri/yukyu-dashboard
```

---

## Descripción General

El Dashboard KEIRI es un panel especializado diseñado para:

### 📊 Objetivos Principales

1. **Gestión de Yukyus (有給休暇)**
   - Aprobar/rechazar solicitudes de vacaciones pagadas
   - Monitorear saldo de yukyus por empleado
   - Analizar patrones de uso

2. **Cumplimiento Legal (Compliance)**
   - Verificar conformidad con Art. 39 Ley Laboral Japonesa
   - Garantizar mínimo 5 días/año por empleado
   - Alertas de empleados no cumplientes

3. **Análisis Financiero**
   - Calcular impacto en nómina de yukyus usados
   - Desglose por mes y empleado
   - Proyecciones de costos

4. **Reporting**
   - Tendencias mensuales de uso
   - Análisis de compliance
   - Datos para auditoría legal

---

## Secciones Principales

El dashboard está dividido en **3 pestañas**:

### 📈 Pestaña 1: Overview (Resumen Ejecutivo)

**Qué ves aquí:**
- 4 tarjetas de métricas principales
- Gráfico de tendencias mensuales
- Resumen visual del status de compliance

**Métricas Clave:**
```
┌─────────────────────────────────────┐
│ Pérdida Anual Estimada              │
│ (Deducción total de yukyus en nómina)│
│ Ej: ¥12,345,600                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Cumplimiento Legal                   │
│ 45 cumplientes / 50 total = 90%      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Total Aprobado Este Mes              │
│ 127.5 días de 12 empleados           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Deducción Este Mes                   │
│ ¥1,530,000 en nómina                 │
└─────────────────────────────────────┘
```

**Gráfico de Tendencias:**
- Eje X: Últimos 6 meses
- Eje Y Izquierdo: Días aprobados
- Eje Y Derecho: Deducción en ¥
- Útil para: Identificar picos de uso

---

### 📋 Pestaña 2: Pending Requests (Solicitudes Pendientes)

**Qué ves aquí:**
- Tabla de todas las solicitudes NO APROBADAS
- Datos del empleado que solicita
- Detalles de la solicitud
- Botones de acción (Aprobar/Rechazar)

**Columnas de la Tabla:**

| Columna | Descripción | Ejemplo |
|---------|-------------|---------|
| **Empleado** | Nombre + ID | 山田太郎 (ID: 1001) |
| **Período** | Fechas solicitadas | 2025-12-15 a 2025-12-17 |
| **Días** | Cantidad de días | 2.5 días |
| **Razón** | Motivo de la solicitud | Enfermedad en familia |
| **Fecha Solicitud** | Cuándo se presentó | 2025-11-20 10:15 |
| **Acciones** | Botones de control | ✅ Aprobar / ❌ Rechazar |

**Cómo Usar:**

1. **Revisar Solicitud**
   - Lee detalles del empleado
   - Verifica fechas y cantidad de días
   - Revisa saldo disponible del empleado

2. **Aprobar Solicitud**
   - Haz clic en botón "✅ Aprobar"
   - Confirm en el popup
   - La solicitud se procesa inmediatamente
   - Se deduce automáticamente del saldo

3. **Rechazar Solicitud**
   - Haz clic en botón "❌ Rechazar"
   - (Opcional) Escribe comentario de rechazo
   - Confirm
   - El empleado recibe notificación

**Filtros Disponibles:**
- Por empleado (autocomplete)
- Por estado (Pendiente)
- Por fecha de solicitud
- Por cantidad de días

---

### ✅ Pestaña 3: Compliance Status (Estado de Compliance)

**Qué ves aquí:**
- Estado de cumplimiento legal para TODOS los empleados
- Indicador visual de compliance (✅ o ⚠️)
- Detalles de yukyus por empleado
- Avisos para no cumplientes

**Interpretación de Colores:**

```
🟢 Verde (Compliant)
   Empleado cumple con mínimo 5 días/año
   Ejemplo: 3 días usados + 2.5 días restantes = 5.5 total

🟡 Amarillo (Warning)
   Empleado muy cerca del límite
   Ejemplo: 4.5 días usados + 0.5 días restantes = 5.0 total

🔴 Rojo (Non-Compliant)
   Empleado por debajo del mínimo
   Ejemplo: 2 días usados + 1.5 días restantes = 3.5 total
   Acción requerida: Asignar yukyus manualmente
```

**Columnas de la Tabla:**

| Columna | Descripción |
|---------|-------------|
| **Empleado** | Nombre + ID |
| **Usado Este Año** | Días ya consumidos |
| **Restante** | Días disponibles |
| **Mínimo Legal** | Siempre 5.0 días |
| **Cumple** | ✅ Sí / ❌ No |
| **Aviso** | Detalle si hay incumplimiento |

**Cómo Leer:**

✅ **Ejemplo Cumpliente:**
```
Empleado: 鈴木花子
Usado: 3.0 días
Restante: 2.0 días
Total: 5.0 días
Status: ✅ Cumple
```

❌ **Ejemplo No Cumpliente:**
```
Empleado: 佐藤次郎
Usado: 2.0 días
Restante: 2.0 días
Total: 4.0 días
Status: ❌ NO CUMPLE
Aviso: 1.0 día por debajo del mínimo legal
```

**Acciones Posibles:**
1. **Para empleado no cumpliente:**
   - Contactar al empleado
   - Asignar yukyus adicionales (si aplica)
   - Documentar en auditoría
   - Crear solicitud administrativa

---

## Uso Detallado

### Tareas Paso a Paso

#### Tarea 1: Aprobar una Solicitud de Yukyu

**Escenario**: Empleado solicita 2 días de vacaciones para viaje familiar

**Pasos:**

1. **Abre la pestaña "Pending Requests"**
   ```
   Click en pestaña → "Pending Requests"
   ```

2. **Localiza la solicitud**
   ```
   Busca por nombre del empleado o fecha
   Revisa los detalles:
   - ¿Tiene saldo disponible?
   - ¿Las fechas son válidas?
   - ¿Hay conflictos de personal?
   ```

3. **Aprueba la solicitud**
   ```
   Haz clic en botón "✅ Aprobar"
   Sistema muestra confirmación:
   "¿Aprobar 2.0 días de yukyu para 山田太郎?"
   Haz clic en "Sí, Aprobar"
   ```

4. **Verifica el resultado**
   ```
   ✅ Confirmación: "Solicitud aprobada"
   La solicitud desaparece de "Pending Requests"
   El saldo del empleado se reduce automáticamente
   ```

5. **Opcional: Envía notificación**
   ```
   Sistema envía email automático al empleado
   Mensaje: "Tu solicitud fue aprobada para 2025-12-15"
   ```

---

#### Tarea 2: Rechazar una Solicitud

**Escenario**: Empleado solicita yukyu pero hay conflicto de personal

**Pasos:**

1. **Selecciona la solicitud**
   ```
   Pestaña: "Pending Requests"
   Localiza: Solicitud a rechazar
   ```

2. **Haz clic en "❌ Rechazar"**
   ```
   Sistema abre diálogo de rechazo
   Campo: "Motivo del rechazo" (opcional)
   Ejemplo: "Conflicto con proyecto crítico en esas fechas"
   ```

3. **Confirma el rechazo**
   ```
   Haz clic en "Sí, Rechazar"
   ```

4. **Verifica el resultado**
   ```
   ✅ Confirmación: "Solicitud rechazada"
   Sistema envía notificación al empleado
   Incluye motivo si fue proporcionado
   ```

---

#### Tarea 3: Verificar Compliance de un Empleado

**Escenario**: Necesitas verificar si Juan cumple con mínimo de 5 días

**Pasos:**

1. **Abre pestaña "Compliance Status"**
   ```
   Click en pestaña → "Compliance Status"
   ```

2. **Busca al empleado**
   ```
   Opción A: Scroll para encontrarlo
   Opción B: Usa búsqueda (Ctrl+F)
   ```

3. **Lee los detalles**
   ```
   Fila del empleado:
   Nombre: 佐藤太郎
   Usado: 2.5 días
   Restante: 1.5 días
   Total: 4.0 días ← PROBLEMA
   Status: 🔴 NO CUMPLE
   Aviso: "1.0 día por debajo del mínimo legal"
   ```

4. **Toma acción si es necesario**
   ```
   Si NO CUMPLE:

   a) Documentar incumplimiento
   b) Contactar empleado para asignar días
   c) Si es fin de año fiscal:
      - Esperar asignación de nuevo año
      - O asignar manualmente si aplica
   d) Mantener registro para auditoría
   ```

---

#### Tarea 4: Analizar Tendencias Mensuales

**Escenario**: Necesitas entender patrones de uso para proyectar presupuesto

**Pasos:**

1. **Abre pestaña "Overview"**
   ```
   Click en pestaña → "Overview"
   ```

2. **Revisa el gráfico de tendencias**
   ```
   Gráfico muestra últimos 6 meses

   Eje X: Meses (Junio - Noviembre)
   Eje Y Izq: Días aprobados (línea azul)
   Eje Y Der: Deducción en ¥ (línea roja)
   ```

3. **Identifica patrones**
   ```
   Preguntas a responder:
   - ¿Hay meses con picos de uso?
   - ¿Es consistente el uso?
   - ¿Hay tendencia creciente o decreciente?

   Ejemplo de análisis:
   Julio: 180 días → Vacaciones de verano
   Agosto: 150 días → Continuación vacaciones
   Septiembre: 80 días → Retorno normal
   ```

4. **Usa datos para decisiones**
   ```
   Aplicaciones:
   - Proyección de costos de nómina
   - Planificación de personal
   - Asignación de presupuesto
   - Análisis de tendencias de mercado
   ```

---

## Métricas y KPIs

### Métricas Principales

#### 1. **Pérdida Anual Estimada**
```
Qué es: Costo total en nómina de yukyus usados
Fórmula: Σ(días_usados × horas_por_día × ¥_por_hora)
Ejemplo: 100 días × 8 h/día × ¥1200/h = ¥960,000
Dónde se usa: Presupuesto de nómina, análisis de costos
```

#### 2. **Tasa de Compliance**
```
Qué es: % de empleados que cumplen con 5 días mínimo
Fórmula: (Empleados_cumplientes / Total_empleados) × 100
Ejemplo: 45 de 50 = 90%
Target: >95% (objetivo legal)
```

#### 3. **Deducción Mensual Promedio**
```
Qué es: Costo promedio de yukyus por mes
Fórmula: Total_deducción_anual / 12
Ejemplo: ¥12,000,000 / 12 = ¥1,000,000/mes
Uso: Presupuesto mensual, análisis de varianza
```

#### 4. **Días Aprobados por Empleado**
```
Qué es: Promedio de días usados por empleado
Fórmula: Total_días_aprobados / Total_empleados
Ejemplo: 450 días / 50 empleados = 9 días/empleado
Insight: ¿Usan los empleados sus días disponibles?
```

### Dashboard de Métricas

```
┌─────────────────────────┬─────────────────────────┐
│  PÉRDIDA ESTIMADA       │  COMPLIANCE             │
│  ¥12,345,600            │  45 / 50 = 90%          │
│  ▲ 8% vs mes anterior   │  ▼ 2% vs mes anterior   │
└─────────────────────────┴─────────────────────────┘

┌─────────────────────────┬─────────────────────────┐
│  APROBADO ESTE MES      │  DEDUCCIÓN ESTE MES     │
│  127.5 días de 12 empl. │  ¥1,530,000             │
│  ▲ 15% vs mes anterior  │  ▲ 12% vs mes anterior  │
└─────────────────────────┴─────────────────────────┘
```

---

## Tareas Comunes

### Flujo de Trabajo Típico Semanal

**Lunes 09:00 - Revisar Solicitudes Pendientes**
```
1. Abre Dashboard KEIRI
2. Pestaña: "Pending Requests"
3. Revisa todas las solicitudes del fin de semana
4. Aprueba/rechaza según corresponda
5. Tiempo estimado: 15-30 minutos
```

**Miércoles 14:00 - Análisis de Compliance**
```
1. Abre Dashboard KEIRI
2. Pestaña: "Compliance Status"
3. Identifica empleados con ⚠️ o 🔴
4. Contacta si es necesario
5. Documentar acciones tomadas
6. Tiempo estimado: 20-40 minutos
```

**Viernes 16:00 - Análisis Financiero**
```
1. Abre Dashboard KEIRI
2. Pestaña: "Overview"
3. Revisa tendencias del mes
4. Calcula impacto en presupuesto
5. Prepara reporte para gerencia
6. Tiempo estimado: 30-45 minutos
```

**Mensual - Cierre de Mes**
```
1. Exportar datos de compliance
2. Generar reporte de deducción
3. Verificar que todos los empleados cumplan
4. Compartir con auditoría
5. Archiva para registros
6. Tiempo estimado: 1-2 horas
```

---

## Troubleshooting

### Problemas Comunes

#### Problema 1: No veo datos en el dashboard
```
Posible causa: Los datos están siendo cargados
Solución:
1. Espera 2-3 segundos (datos están cacheados)
2. Recarga la página (F5 o Cmd+R)
3. Verifica conexión a internet
4. Contacta IT si persiste

Tiempo esperado: <3 segundos desde carga inicial
```

#### Problema 2: Las solicitudes pendientes no aparecen
```
Posible causa: Todas fueron ya aprobadas/rechazadas
Solución:
1. Revisa si hay solicitudes recientes
2. Filtra por estado "Pending"
3. Verifica que employees existan en el sistema
4. Contacta IT si las solicitudes desaparecieron

Causa probable: Ya procesadas correctamente
```

#### Problema 3: Un empleado muestra compliance incorrecto
```
Posible causa: Datos desactualizados
Solución:
1. Recarga la página
2. Verifica la asignación de yukyus
3. Revisa historial de solicitudes
4. Contacta IT para sincronizar datos

Nota: Hay retraso de ~1 minuto en actualización
```

#### Problema 4: No puedo aprobar una solicitud
```
Posible causas:
A) Rol insuficiente
   - Verifica tu rol es KEITOSAN, ADMIN o SUPER_ADMIN
   - COORDINATOR y TANTOSHA solo ven datos (read-only)

B) Sesión expirada
   - Re-inicia sesión

C) Permiso específico requerido
   - Contacta administrador
```

---

## Preguntas Frecuentes

### ¿Cuál es el año fiscal para compliance?
**Respuesta**: Abril 1 - Marzo 31 (estándar Japón)
- Ejemplo: FY 2024 = 1 Abril 2024 - 31 Marzo 2025
- Reseteo de saldo: 1 Abril cada año

---

### ¿Cómo se calcula el saldo de yukyu?
**Respuesta**:
- Asignación anual: Típicamente 20 días
- Menos: Días ya usados
- Más: Días sin usar del año anterior (máximo)
- Ejemplo: 20 - 5 = 15 días restantes

---

### ¿Qué pasa si un empleado no usa sus 5 días?
**Respuesta**: Incumplimiento legal
- Empleador debe permitir uso o pagar
- Se marca en compliance como 🔴 Non-Compliant
- Acciones: Contactar empleado, asignar dias, documentar

---

### ¿Se pueden rechazar solicitudes?
**Respuesta**: Sí, pero con limitaciones
- Solo por razones válidas (operacionales críticas)
- Documentar el motivo
- No puede rechazarse todos los pedidos de un empleado
- Recomendación: Reschedulear en lugar de rechazar

---

### ¿Cómo se calcula la deducción en nómina?
**Respuesta**:
```
Fórmula: días × (horas_estándar_mes / 20) × jikyu_por_hora

Ejemplo:
- Empleado solicita: 2 días
- Horas estándar: 160 h/mes
- Horas por día: 160 / 20 = 8 h/día
- Jikyu: ¥1,500/hora
- Deducción: 2 × 8 × ¥1,500 = ¥24,000
```

---

### ¿Qué roles pueden usar este dashboard?
**Respuesta**:
- ✅ KEITOSAN: Acceso total (aprobar/rechazar)
- ✅ ADMIN: Acceso total
- ✅ SUPER_ADMIN: Acceso total
- 👁️ KANRININSHA: Lectura (no puede aprobar)
- 👁️ TANTOSHA: Lectura (no puede aprobar)
- ❌ EMPLOYEE: Denegado
- ❌ CONTRACT_WORKER: Denegado

---

### ¿Con qué frecuencia se actualizan los datos?
**Respuesta**:
- Tiempo real: Aprobaciones/rechazos
- Cache: 5 minutos (para optimizar rendimiento)
- Puede forçarse: F5 para actualización inmediata

---

## Contacto y Soporte

**Para problemas técnicos:**
- Email: it-support@company.local
- Teléfono: ext. 5555
- Horario: Lun-Vie 9:00-17:00 JST

**Para preguntas de políticas:**
- Contacta a RH o Departamento de Nómina

**Para reportar bugs:**
- Incluye: screenshot, pasos para reproducir, navegador usado

---

**Documento versión 1.0 - Noviembre 2025**
*Última actualización: 2025-11-22*

