# FASE 5: Dashboard KEIRI para TANTOSHA
## Guía de Consulta - Acceso de Lectura

**Versión**: 1.0
**Fecha**: 2025-11-22
**Rol Objetivo**: TANTOSHA (担当者 - Persona Encargada)
**Otros Roles**: Consulta también si eres KANRININSHA o COORDINATOR

---

## 📋 Descripción Rápida

El Dashboard KEIRI es un **panel de información de solo lectura** que te permite:

✅ Ver solicitudes de yukyus pendientes
✅ Monitorear compliance legal de empleados
✅ Analizar tendencias de uso
✅ Generar reportes

❌ No puedes: Aprobar, rechazar, o modificar datos

---

## 🚀 Acceso Rápido

### Ubicación
```
Menú Principal (izq) → "Dashboard KEIRI" → /dashboard/keiri/yukyu-dashboard
```

### Requisitos
- ✅ Rol: TANTOSHA, KANRININSHA, COORDINATOR (lectura)
- ✅ Rol: ADMIN, SUPER_ADMIN (control total)
- ❌ No disponible para: EMPLOYEE, CONTRACT_WORKER

---

## 📊 Qué Ver en Cada Pestaña

### Pestaña 1: Overview (Resumen)

**4 Tarjetas Principales:**

```
┌────────────────────────┐
│ Pérdida Estimada       │  Costo total de yukyus en nómina
│ ¥12,345,600            │
└────────────────────────┘

┌────────────────────────┐
│ Compliance              │  % de empleados que cumplen 5 días mín
│ 45/50 = 90%            │
└────────────────────────┘

┌────────────────────────┐
│ Aprobado Este Mes      │  Total de días aprobados
│ 127.5 días             │
└────────────────────────┘

┌────────────────────────┐
│ Deducción Este Mes     │  Impacto en nómina
│ ¥1,530,000             │
└────────────────────────┘
```

**Gráfico de Tendencias (6 meses):**
- Línea azul: Días aprobados por mes
- Línea roja: Costo en ¥

**Qué hacer aquí:**
- Revisar status general
- Identificar meses con picos de uso
- Compartir datos con gerencia

---

### Pestaña 2: Pending Requests (Solicitudes Pendientes)

**Tabla de Solicitudes No Procesadas:**

| Columna | Qué significa | Ejemplo |
|---------|---------------|---------|
| Empleado | Quién solicita | 山田太郎 |
| Período | Fechas solicitadas | 2025-12-15 a 2025-12-17 |
| Días | Cantidad | 2.5 días |
| Razón | Motivo | Asuntos familiares |
| Fecha Solicitud | Cuándo se pidió | 2025-11-20 |

**Qué hacer aquí:**
- Revisar solicitudes pendientes
- Comunicar estado a empleados
- Pasar información a KEITOSAN para aprobación
- Generar reportes

**Acciones disponibles:**
- ✅ Ver detalles
- ✅ Exportar a Excel
- ✅ Filtrar por empleado
- ❌ No puedes aprobar/rechazar (KEITOSAN lo hace)

---

### Pestaña 3: Compliance Status (Estado de Cumplimiento)

**Estado Legal de Todos los Empleados:**

**Indicadores:**
```
✅ Verde = Cumple (5+ días totales)
🟡 Amarillo = Cerca del límite (4.5-4.99 días)
🔴 Rojo = NO CUMPLE (<4.99 días)
```

**Información por empleado:**

| Campo | Significa |
|-------|-----------|
| Usado | Días ya consumidos |
| Restante | Días disponibles |
| Total | Usado + Restante |
| Mínimo | Siempre 5.0 (por ley) |
| Cumple | ✅ o ❌ |

**Qué hacer aquí:**
- Identificar empleados en rojo 🔴
- Alertar a KEITOSAN sobre incumplimiento
- Ayudar a empleados a entender su status
- Documentar para auditoría

**Ejemplo Práctico:**

```
Empleado: 鈴木花子
├─ Usado: 3.0 días
├─ Restante: 2.0 días
├─ Total: 5.0 días
├─ Cumple: ✅ Sí
└─ Status: Dentro de los límites legales

Empleado: 佐藤次郎
├─ Usado: 2.0 días
├─ Restante: 1.5 días
├─ Total: 3.5 días
├─ Cumple: ❌ No
└─ Acción: ALERTA - Por debajo del mínimo
   Contactar KEITOSAN para resolver
```

---

## 🎯 Tareas Comunes

### Tarea 1: Revisar Solicitudes Diarias

**Tiempo:** 10 minutos

```
1. Abre Dashboard KEIRI
2. Pestaña: "Pending Requests"
3. Revisa cuáles son nuevas
4. Nota qué empleados están esperando
5. Comunica status si se te pregunta
6. Pasa información a KEITOSAN si es necesario
```

---

### Tarea 2: Reportar Empleados No Cumplientes

**Tiempo:** 15 minutos

```
1. Abre Dashboard KEIRI
2. Pestaña: "Compliance Status"
3. Busca empleados con 🔴 rojo
4. Cuenta cuántos hay:
   - Este mes
   - Este trimestre
   - Este año
5. Crea reporte:
   Nombre | Deficiencia | Acción
   ─────────────────────────
   ...
6. Envía a KEITOSAN
```

**Ejemplo de Reporte:**

```
Empleados No Cumplientes (Noviembre 2025)

Total de empleados: 50
Cumplientes: 45 (90%)
NO CUMPLIENTES: 5 (10%)

Detalle:
1. Yamada Hanako (ID: 1001) - 1.0 día corto
2. Suzuki Jiro (ID: 1002) - 0.5 días corto
3. Tanaka Sayuri (ID: 1003) - 2.0 días corto
4. Nakamura Ken (ID: 1004) - 1.5 días corto
5. Kobayashi Yuki (ID: 1005) - 0.5 días corto

Recomendación:
- Contactar antes de fin de mes
- Permitir uso de días para cumplir
- Documentar para auditoría anual
```

---

### Tarea 3: Generar Reporte Mensual

**Tiempo:** 30 minutos

```
1. Abre Dashboard KEIRI
2. Pestaña: "Overview"
3. Anota las 4 métricas principales
4. Captura el gráfico de tendencias
5. Ve a "Compliance Status"
6. Cuenta empleados por status
7. Crea reporte:

   ┌─ REPORTE MENSUAL DE YUKYUS ─┐
   │ Mes: Noviembre 2025          │
   │                              │
   │ Deducción Total: ¥1,530,000  │
   │ Días Aprobados: 127.5        │
   │ Compliance: 90% (45/50)       │
   │                              │
   │ Tendencia: ▲ +15% vs Oct     │
   │ Riesgo Legal: Bajo           │
   └──────────────────────────────┘

8. Envía a gerencia
```

---

### Tarea 4: Ayudar Empleado a Entender su Status

**Escenario:** Empleado pregunta "¿Cuántos días de yukyu tengo?"

```
1. Abre Dashboard KEIRI
2. Pestaña: "Compliance Status"
3. Busca nombre del empleado
4. Lee sus datos:
   ├─ Usado este año: X días
   ├─ Restante: Y días
   ├─ Mínimo legal: 5 días
   └─ Status: ✅ o ❌

5. Comunica claramente:

   RESPUESTA A EMPLEADO:
   "Tienes 15 días de yukyu asignados.
    Has usado 5 días hasta ahora.
    Te quedan 10 días disponibles.

    ✅ Estás cómodo - cumples con
       el mínimo legal de 5 días."

6. Si tienen preguntas de aprobación:
   "Eso lo maneja KEITOSAN (contabilidad)"
```

---

## 📈 Cómo Leer las Métricas

### Métrica 1: Pérdida Estimada

```
Qué es: Dinero gastado en nómina por yukyus
Ejemplo: ¥12,345,600 en el año

Si ves ▲ +8% vs mes anterior:
→ Significa más yukyus fueron aprobados
→ Impacto en presupuesto aumentó

Si ves ▼ -5% vs mes anterior:
→ Menos yukyus usados
→ Oportunidad de ahorro
```

---

### Métrica 2: Compliance

```
Qué es: % de empleados que cumplen ley
Ejemplo: 45/50 = 90%

90% es BUENO (meta: >95%)

Si ves 85% y baja:
→ Más empleados en riesgo
→ Acción requerida antes de fin de año

Si ves 98% y sube:
→ Excelente cumplimiento
→ Bajo riesgo legal
```

---

### Métrica 3: Aprobado Este Mes

```
Qué es: Total de días usados este mes
Ejemplo: 127.5 días

Si es alto (>150 días):
→ Mes con muchas vacaciones
→ Típico: Julio, Agosto, Año Nuevo

Si es bajo (<80 días):
→ Mes normal de trabajo
→ Típico: Enero, Marzo, Octubre
```

---

### Métrica 4: Deducción Este Mes

```
Qué es: Costo en dinero para nómina
Ejemplo: ¥1,530,000

Se calcula como:
días × (160h/mes ÷ 20 días) × ¥/hora

Más días = Mayor deducción = Presupuesto impactado
```

---

## 🔍 Interpretación de Datos

### Cuándo Alertar a KEITOSAN

**🔴 URGENTE:**
```
- Más de 10% de empleados no cumplientes
- Deducción mensual 20%+ sobre presupuesto
- Solicitud de rechazo de un mismo empleado 3 veces
```

**🟠 IMPORTANTE:**
```
- 5-10% de empleados en riesgo (amarillo)
- Deducción creciendo semana a semana
- Solicitud sin procesar >3 días
```

**🟢 NORMAL:**
```
- <5% no cumplientes
- Deducción dentro de presupuesto
- Solicitudes procesadas dentro de 2 días
```

---

## 💡 Tips y Trucos

### Cómo Usar Filtros

```
1. Click en campo de búsqueda
2. Escribe nombre parcial o ID
3. Los resultados se filtran automáticamente
4. Ejemplo: Escribe "Yamada" → Muestra todos los Yamada
```

### Exportar Datos

```
Botón "Exportar a Excel" en cada tabla
Formatos soportados:
├─ Excel (.xlsx)
├─ CSV (.csv)
└─ PDF (.pdf)

Uso: Reportes, análisis, auditoría
```

### Actualizar Datos

```
Datos se actualizan automáticamente cada 5 minutos
Para actualización inmediata:
├─ F5 en Windows/Linux
├─ Cmd+R en Mac
└─ O haz click en ⟳ (refresh)
```

---

## ❓ Preguntas Frecuentes

**P: ¿Puedo aprobar una solicitud?**
A: No, ese es trabajo de KEITOSAN (contabilidad). Puedes verlas pero no modificarlas.

---

**P: ¿Cuál es el empleado con más días restantes?**
A: Puedes ordenar la tabla por columna "Restante" (ascendente/descendente).

---

**P: ¿Cómo exporto un reporte completo?**
A: Click en botón "Exportar" al pie de cada tabla. Puedes elegir formato Excel, CSV o PDF.

---

**P: ¿Por qué un empleado muestra rojo aunque pidió yukyu?**
A: Porque la solicitud sigue PENDIENTE. No cuenta hasta que KEITOSAN la APRUEBA.

---

**P: ¿Qué significa "Mínimo Legal: 5.0"?**
A: Por ley japonesa, todo empleado debe tener mínimo 5 días de yukyu sin usar por año fiscal.

---

**P: ¿Se puede cambiar el orden de las columnas?**
A: En esta versión no, pero puedes copiar datos a Excel y reorganizar allá.

---

**P: ¿A quién contacto si hay un error en los datos?**
A: KEITOSAN (contabilidad) - Ellos son dueños de los datos.

---

**P: ¿Con qué frecuencia se actualizan los datos?**
A: Automáticamente cada 5 minutos. Puedes refrescar manualmente con F5.

---

## 📞 Soporte

**Problemas con el Dashboard:**
- IT Support: it-support@company.local

**Preguntas sobre yukyus o compliance:**
- KEITOSAN (Contabilidad)
- RH (Recursos Humanos)

**Reportes o análisis especial:**
- KEITOSAN (Contabilidad)

---

**Documento versión 1.0 - Noviembre 2025**
*Última actualización: 2025-11-22*

