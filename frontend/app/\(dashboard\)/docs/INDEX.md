# 📚 Documentación - Sistema de Yukyus (有給休暇)

Bienvenido a la documentación del Sistema de Gestión de Yukyus. Aquí encontrarás todo lo que necesitas saber sobre cómo usar, administrar y comprender el sistema de yukyus en el JPUNS.

---

## 🎯 Guías por Rol

### 👨‍💼 KEITOSAN (Finance Manager)
**Documento Completo**: [`FASE5_USER_GUIDE_KEITOSAN.md`](../../../../../../FASE5_USER_GUIDE_KEITOSAN.md)

Responsabilidades:
- ✓ Revisar y aprobar solicitudes de yukyu
- ✓ Monitorear conformidad legal (mínimo 5 días/año)
- ✓ Analizar impacto financiero
- ✓ Generar reportes de nómina
- ✓ Forzar días si empleado tiene <5 días al final de año fiscal

**Inicio Rápido:**
1. Acceder a `/dashboard/keiri/yukyu-dashboard`
2. Ver 4 métricas principales (Pérdida Estimada, Compliance %, etc.)
3. Revisar solicitudes pendientes en tabla
4. Aprobar ✓ o Rechazar ✗

**Fórmula de Deducción:**
```
Deducción = Días × 8 horas/día × ¥/hora
Ejemplo: 1 día × 8 × ¥1,500 = ¥12,000
```

**Alertas de Compliance:**
- 🟢 Verde: ≥5 días (cumple ley)
- 🟡 Amarillo: 3-4 días (warning)
- 🔴 Rojo: <3 días (no cumple)

---

### 📋 TANTOSHA (HR Representative)
**Documento Completo**: [`FASE5_USER_GUIDE_TANTOSHA.md`](../../../../../../FASE5_USER_GUIDE_TANTOSHA.md)

Responsabilidades:
- ✓ Crear solicitudes de yukyu para empleados
- ✓ Asegurar que datos sean correctos
- ✓ Seguimiento de solicitudes
- ✓ Informar al empleado sobre estado

**Inicio Rápido:**
1. Ir a `/yukyu-requests/create`
2. Completar formulario:
   - Empleado (búsqueda)
   - Período (fecha inicio - fin)
   - Días solicitados (1.0, 0.5, etc.)
3. Sistema valida automáticamente
4. Enviar para aprobación de KEITOSAN

**Validaciones Automáticas:**
- ✓ Fecha no puede ser en el pasado
- ✓ Fecha inicio ≤ fecha fin
- ✓ Sin overlap con solicitud anterior
- ✓ TANTOSHA pertenece a esa fábrica
- ✓ Empleado existe en sistema

**Estados de Solicitud:**
- PENDING: En espera de revisión
- APPROVED: ✓ Aprobada
- REJECTED: ✗ Rechazada

---

## ⚖️ Regulaciones Laborales Japonesas

**Documento Completo**: [`FASE5_EDGE_CASES_GUIDE.md`](../../../../../../FASE5_EDGE_CASES_GUIDE.md) (Sección "Regulaciones Laborales")

### Ley Laboral (労働基準法) - Artículo 39

**Derechos de Yukyu:**
- **Mínimo:** 5 días de yukyu pagado al año
- **Máximo:** Hasta 20 días por año (según contrato)
- **Período:** Año fiscal (Abril - Marzo) o año calendario

**Cálculo de Pago:**
- Se paga salario completo como si trabajara
- NO hay descuento
- Fórmula: `días × teiji (定時) × tasa_base`

**Teiji (定時 - Horario Estándar):**
- Típicamente 8 horas/día
- Según contrato del empleado
- Se calcula: horas_estándar_mes ÷ 20 días = 8 horas/día

**Casos Especiales:**
1. **Yukyu No Usados:** Si empleado no usa 5+ días = VIOLACIÓN DE LEY
   - KEITOSAN debe forzar días al final período
   - Alternativa: Pagar en dinero (compensación)

2. **Renuncia del Empleado:** Días no usados deben ser pagados
   - Pago = días_restantes × teiji × tasa_base

3. **Enfermedad o Accidente:** No cuenta como yukyu
   - Se paga como "incapacidad laboral"
   - Separado del sistema de yukyu

**Auditoría y Compliance:**
- Empresa debe mantener registro obligatorio de días aprobados
- Autoridades pueden inspeccionar registros
- Penalidades por incumplimiento: ¥300,000 - ¥600,000 + responsabilidad criminal

---

## ❓ FAQ - Preguntas Frecuentes

### KEITOSAN

**P: ¿Qué hago si un empleado no tiene días disponibles?**
R: Sistema rechazará automáticamente. Contacta al empleado para reducir los días solicitados.

**P: ¿Puedo ver el historial de un empleado?**
R: Sí, en `/yukyu-history` busca por employee_id y verás todo su historial.

**P: ¿Cuál es la fórmula exacta de deducción?**
R: `días × 8 horas × tasa_horaria_base`. Ejemplo: 1 × 8 × ¥1,500 = ¥12,000

**P: ¿Qué pasa si rechazo una solicitud?**
R: Empleado recibe notificación con motivo del rechazo. Puede crear nueva solicitud.

**P: ¿Puedo forzar yukyu si empleado tiene <5 días al final del año?**
R: Sí. Contacta al gerente del sistema para función de "fuerza de yukyu".

---

### TANTOSHA

**P: ¿Puedo crear solicitud para empleado de otra fábrica?**
R: No. Sistema solo permite fábricas asignadas a ti. Contacta admin si necesitas acceso.

**P: ¿Qué hago si la fecha está en el pasado?**
R: Usa una fecha futura. Yukyus solo pueden ser prospectivos.

**P: ¿Puedo crear solicitud si hay overlap?**
R: No. Sistema rechazará si hay solicitud anterior en ese período.

**P: ¿Cuánto tiempo demora la aprobación?**
R: Típicamente 1-3 días. Si >7 días, contacta a KEITOSAN.

**P: ¿Puedo modificar solicitud después de enviar?**
R: No. Debes rechazarla y crear una nueva.

---

### GENERAL

**P: ¿Qué es teiji (定時)?**
R: Horario estándar del empleado. Típicamente 160 horas/mes = 8 horas/día.

**P: ¿Se paga durante yukyu?**
R: Sí, se paga el salario completo como si trabajara.

**P: ¿Qué pasa si renuncio?**
R: Días no usados deben ser pagados en efectivo.

**P: ¿Puedo tomar media día?**
R: Sí, ingresa 0.5 en lugar de 1.0. Media día = 4 horas.

**P: ¿Hay límite de días por mes?**
R: No límite por mes. Límite es anual (mínimo 5, máximo 20).

---

## 📊 Documentación Técnica

Para información técnica detallada, ver:

- **Performance Report**: [`FASE5_PERFORMANCE_REPORT.md`](../../../../../../FASE5_PERFORMANCE_REPORT.md)
  - Baselines de performance
  - Estrategia de cache
  - Recomendaciones de optimización
  - SLA definitions

- **Edge Cases & Error Handling**: [`FASE5_EDGE_CASES_GUIDE.md`](../../../../../../FASE5_EDGE_CASES_GUIDE.md)
  - 26+ edge cases probados
  - Manejo de errores
  - Precisión en cálculos
  - Guía de operaciones

- **Deployment Guide**: [`FASE5_DEPLOYMENT_GUIDE.md`](../../../../../../FASE5_DEPLOYMENT_GUIDE.md)
  - Procedimiento de deployment paso a paso
  - Rollback procedures
  - Estrategia de monitoreo
  - Troubleshooting

---

## 🚀 Inicio Rápido por Rol

### Si eres KEITOSAN 👨‍💼
1. Lee: [`FASE5_USER_GUIDE_KEITOSAN.md`](../../../../../../FASE5_USER_GUIDE_KEITOSAN.md)
2. Accede a: `http://localhost:3000/dashboard/keiri/yukyu-dashboard`
3. Comienza a revisar solicitudes pendientes

### Si eres TANTOSHA 📋
1. Lee: [`FASE5_USER_GUIDE_TANTOSHA.md`](../../../../../../FASE5_USER_GUIDE_TANTOSHA.md)
2. Accede a: `http://localhost:3000/yukyu-requests/create`
3. Crea tu primera solicitud

### Si eres Administrador 🔧
1. Lee: [`FASE5_DEPLOYMENT_GUIDE.md`](../../../../../../FASE5_DEPLOYMENT_GUIDE.md)
2. Lee: [`FASE5_EDGE_CASES_GUIDE.md`](../../../../../../FASE5_EDGE_CASES_GUIDE.md)
3. Configura monitoreo según guía

---

## 📞 Soporte

| Rol | Contacto | Problema |
|-----|----------|----------|
| Técnico | admin@company.com | Sistema no funciona |
| KEITOSAN Manager | keiri@company.com | Solicitud rechazada |
| TANTOSHA Manager | hr@company.com | Acceso a fábrica |
| Legal | legal@company.com | Conformidad laboral |

---

## 📚 Estructura de Documentación

```
Raíz del Proyecto:
├── FASE5_USER_GUIDE_KEITOSAN.md (1500+ líneas)
├── FASE5_USER_GUIDE_TANTOSHA.md (700+ líneas)
├── FASE5_PERFORMANCE_REPORT.md (500+ líneas)
├── FASE5_EDGE_CASES_GUIDE.md (600+ líneas)
├── FASE5_DEPLOYMENT_GUIDE.md (400+ líneas)
└── FASE5_COMPLETION_SUMMARY.md (final summary)

Documentación en UI:
└── frontend/app/(dashboard)/docs/
    └── INDEX.md (este archivo)
```

---

## ✨ Resumen

El Sistema de Gestión de Yukyus es una solución completa para:
- ✅ Cumplir con ley laboral japonesa (mínimo 5 días/año)
- ✅ Gestionar aprobaciones de yukyu
- ✅ Calcular impacto financiero automáticamente
- ✅ Generar reportes de conformidad
- ✅ Mantener auditoría completa

**Toda la documentación que necesitas está aquí. ¡Comienza con la guía de tu rol!**

---

**Última Actualización**: 2025-11-22
**FASE 5**: Dashboard KEIRI Especializado - ✅ COMPLETO
**FASE 6**: Documentación & Training - ✅ COMPLETO
