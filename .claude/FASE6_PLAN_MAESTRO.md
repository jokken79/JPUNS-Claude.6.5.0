# 📚 FASE 6: DOCUMENTACIÓN & TRAINING - PLAN MAESTRO

**Objetivo:** Crear documentación completa y guías de capacitación para KEITOSAN (Finance Manager) y TANTOSHA (HR Representative) sobre el sistema de yukyus.

**Tiempo Estimado:** 1 hora
**Riesgo:** BAJO (tareas de documentación)
**Estado:** 📋 PLANIFICADO

---

## 📋 DOCUMENTOS A CREAR

### 1. GUÍA KEITOSAN (Finance Manager)

**Archivo:** `/frontend/app/(dashboard)/docs/GUIA_KEITOSAN.md`

**Contenido:**

```markdown
# 📊 Guía para KEITOSAN - Sistema de Yukyus (有給休暇)

## 🎯 Rol y Responsabilidades

KEITOSAN (経理管理/Finance Manager) es responsable de:
- ✓ Revisar y aprobar solicitudes de yukyu
- ✓ Rechazar solicitudes inválidas
- ✓ Monitorear conformidad legal (mínimo 5 días/año)
- ✓ Analizar impacto financiero de yukyus
- ✓ Generar reportes de nómina

## 🚀 Cómo Usar el Dashboard

### Acceso
1. Ir a: http://localhost:3000/keiri/yukyu-dashboard
2. Solo KEITOSAN puede acceder (protegido por rol)

### Panel de Control

**Métricas Principales:**
- Solicitudes Pendientes: Número de solicitudes que requieren acción
- Impacto Financiero: Total de ¥ que será deducido este mes
- Empleados con Yukyu: Cuántos empleados tomaron yukyu
- Conformidad Legal: Porcentaje de empleados con mínimo 5 días/año

**Solicitudes Pendientes (Tabla):**
- Mostrada en tiempo real
- Se auto-actualiza cada 30 segundos
- Acciones disponibles: Aprobar (✓) o Rechazar (✗)

### Procedimiento de Aprobación

1. **Revisar Solicitud:**
   - Nombre del empleado
   - Número de días solicitados
   - Período (fechas inicio-fin)
   - Historial de yukyu del empleado

2. **Validar:**
   - ✓ ¿Tiene días disponibles?
   - ✓ ¿No hay conflicto con otros períodos?
   - ✓ ¿Es date válido (no pasado)?

3. **Decisión:**
   - APROBAR: Hace clic en botón ✓
     - Sistema deduce días automáticamente (LIFO)
     - Cálculo: días × teiji (定時) × tasa_base
     - Se afecta el salario del mes

   - RECHAZAR: Hace clic en botón ✗
     - Ingresa motivo del rechazo (ej: "Conflicto con período anterior")
     - Empleado recibe notificación

### Fórmula de Deducción

```
Deducción Salarial = Días Yukyu × Teiji (定時) × Tasa Horaria Base

Ejemplo:
- Empleado: Yamada Taro
- Días yukyu: 1 día
- Teiji (horario estándar): 160 horas/mes ÷ 20 días = 8 horas/día
- Tasa horaria base: ¥1,500/hora
- Deducción: 1 × 8 × ¥1,500 = ¥12,000
```

### Alertas y Conformidad Legal

**Ley Laboral Japonesa (労働基準法):**
- Todo empleado tiene derecho a MÍNIMO 5 días de yukyu/año fiscal
- Año fiscal en Japón: Abril-Marzo
- No usar 5 días es **violación de ley**

**Alert System:**
- 🟢 Verde: Empleado con 5+ días
- 🟡 Amarillo: Empleado con 3-4 días
- 🔴 Rojo: Empleado con <3 días

**Acción Requerida:**
- Si empleado tiene <5 días al final del año fiscal: KEITOSAN debe forzar días
- Registrar en sistema para auditoria

### Reportes

Disponibles en endpoint: `GET /api/payroll/yukyu-summary`

Contiene:
- Total de días aprobados
- Total impacto financiero (¥)
- Detalle por empleado
- Cumplimiento de regulación

### Troubleshooting

| Problema | Solución |
|----------|----------|
| No veo solicitudes pendientes | Refrescar página (F5) o esperar 30s |
| Error al aprobar | Verificar que empleado tenga días disponibles |
| No puedo acceder al dashboard | Verificar que tu rol sea KEITOSAN |
| Sistema lento | Reducir período de búsqueda, usar filtros |

## 📞 Soporte

- Sistema tiene logs: /var/log/app.log
- Error 403: Falta permiso (rol incorrecto)
- Error 404: Solicitud no encontrada (posible doble-clic)
```

---

### 2. GUÍA TANTOSHA (HR Representative)

**Archivo:** `/frontend/app/(dashboard)/docs/GUIA_TANTOSHA.md`

**Contenido:**

```markdown
# 📋 Guía para TANTOSHA - Solicitar Yukyus

## 🎯 Rol y Responsabilidades

TANTOSHA (担当者/HR Representative) es responsable de:
- ✓ Crear solicitudes de yukyu para empleados
- ✓ Asegurar que datos sean correctos
- ✓ Seguimiento de solicitudes en proceso
- ✓ Informar al empleado sobre estado

## 🚀 Cómo Crear una Solicitud

### Acceso
1. Ir a: http://localhost:3000/yukyu-requests/create
2. Solo TANTOSHA puede acceder (protegido por rol)

### Formulario de Solicitud

**Campos Requeridos:**

1. **Empleado:**
   - Buscar por nombre o ID (社員№)
   - Sistema autocomplete
   - IMPORTANTE: Verificar que sea el empleado correcto

2. **Fábrica:**
   - TANTOSHA solo puede crear para fábricas asignadas a sí mismo
   - Si no ves una fábrica: Contactar a administrador

3. **Período:**
   - Fecha inicio (YYYY-MM-DD)
   - Fecha fin (YYYY-MM-DD)
   - ⚠️ NO PUEDE SER EN EL PASADO
   - No puede tener overlap con solicitud anterior

4. **Días Solicitados:**
   - Número decimal (ej: 1.0, 0.5)
   - 1.0 = día completo (8 horas)
   - 0.5 = medio día (4 horas)

5. **Notas (Opcional):**
   - Motivo de la solicitud
   - Información adicional para KEITOSAN

### Validaciones Automáticas

Sistema valida automáticamente:
- ✓ Fecha no puede ser en el pasado
- ✓ Fecha inicio <= fecha fin
- ✓ No hay overlap con solicitud anterior
- ✓ TANTOSHA pertenece a esa fábrica
- ✓ Empleado existe en sistema

Si hay error:
- Se muestra mensaje claro
- Sistema sugiere corrección
- Empleado NO puede enviar

### Flujo de Aprobación

1. **TANTOSHA:** Crea solicitud
2. **Sistema:** Valida datos (validaciones FASE 3)
3. **KEITOSAN:** Recibe notificación
4. **KEITOSAN:** Revisa en dashboard (FASE 5)
5. **KEITOSAN:** Aprueba (✓) o Rechaza (✗)
6. **TANTOSHA:** Informar al empleado

### Estados de Solicitud

| Estado | Significado | Acción |
|--------|-------------|--------|
| PENDING | En espera de revisión | Contactar KEITOSAN si >5 días |
| APPROVED | Aprobada ✓ | Informar al empleado |
| REJECTED | Rechazada ✗ | Seguimiento con KEITOSAN |

### Ejemplo de Solicitud Correcta

```
Empleado: Yamada Taro (ID: 123)
Fábrica: Yokohama Plant
Período: 2025-10-18 a 2025-10-19
Días: 1.0 (día completo sábado)
Notas: Cliente importante en fin de semana
Resultado: ✓ Solicitud válida
```

### Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| "Fecha en el pasado" | Intentaste fecha anterior a hoy | Usa fecha futura |
| "No perteneces a esa fábrica" | TANTOSHA asignado a otra fábrica | Contactar admin |
| "Ya existe solicitud" | Mismo empleado, período overlap | Usar período diferente |
| "Empleado no existe" | Búsqueda incorrecta | Buscar por nombre correcto |

## 📊 Seguimiento

### Ver Mis Solicitudes
1. Ir a: http://localhost:3000/yukyu-history
2. Ver todas las solicitudes que creaste
3. Filtrar por estado (PENDING, APPROVED, REJECTED)

### Contacto
- Si solicitud tarda >7 días: Contactar a KEITOSAN
- Si rechazo sin motivo: Pedir aclaración
```

---

### 3. GUÍA GENERAL - REGULACIONES LABORALES JAPONESAS

**Archivo:** `/frontend/app/(dashboard)/docs/REGULACIONES_LABORALES.md`

**Contenido:**

```markdown
# ⚖️ Regulaciones Laborales Japonesas - Yukyus (有給休暇)

## Ley Laboral (労働基準法)

### Derechos de Yukyu

**Artículo 39:** Todo empleado tiene derecho a:
- **Mínimo:** 5 días de yukyu pagado al año
- **Máximo:** Hasta 20 días por año (según tipo de contrato)
- **Período:** Año fiscal (Abril - Marzo) o año calendario

### Cálculo de Pago

Cuando un empleado toma yukyu:
- Se paga el salario completo como si trabajara
- NO hay descuento
- Se cálcula como: `días_yukyu × teiji (定時) × tasa_base`

**Teiji (定時/Horario Estándar):**
- En Japón, típicamente 8 horas/día
- O según contrato del empleado
- Se calcula: horas_estándar_mes ÷ 20 días

### Casos Especiales

**1. Yukyu No Usados:**
- Si empleado no usa 5+ días = **VIOLACIÓN DE LEY**
- KEITOSAN debe forzar días al final del período
- Alternativa: Pagar en dinero (compensación)

**2. Renuncia del Empleado:**
- Días no usados deben ser pagados
- Pago = días_restantes × teiji × tasa_base

**3. Enfermedad o Accidente:**
- No cuenta como yukyu
- Se paga como "incapacidad laboral"
- Separado del sistema de yukyu

## 📅 Ejemplo Práctico

### Caso: Yamada Taro

**Año Fiscal 2024-2025 (Abril 2024 - Marzo 2025):**

| Mes | Días Solicitados | Estado | Deducción |
|-----|------------------|--------|-----------|
| Jun | 2 días | ✓ Aprobado | ¥24,000 |
| Aug | 1 día | ✓ Aprobado | ¥12,000 |
| Oct | 1 día | ✓ Aprobado | ¥12,000 |
| Total | 4 días | | ¥48,000 |

**Problema:** Solo 4 días usados, mínimo es 5
**Solución:** KEITOSAN fuerza 1 día en Marzo 2025

---

## 🔍 Auditoría y Compliance

### Registro Obligatorio

Empresa debe mantener registro de:
- ✓ Días aprobados por empleado
- ✓ Fechas de disfrute
- ✓ Dinero pagado
- ✓ Aceptación del empleado

### Inspección Laboral

Autoridades pueden inspeccionar:
- Sistema de yukyus
- Registros de aprobación
- Nómina vs horas trabajadas
- Conformidad con mínimo de 5 días

### Penalidades por Incumplimiento

- Multa: ¥300,000 - ¥600,000
- Responsabilidad criminal para el empleador
- Demanda de empleados
- Reputación dañada

## 📞 Referencia Rápida

| Concepto | Valor | Nota |
|----------|-------|------|
| Mínimo anual | 5 días | Ley laboral |
| Máximo anual | 20 días | Según contrato |
| Teiji típico | 8 h/día | Variable por empleado |
| Año fiscal | Abr-Mar | O calendario |
| Pago | Salario completo | Como día trabajado |
| Registro | Obligatorio | Para auditoría |

## 📚 Referencias

- 労働基準法 (Ley Laboral de Japón) - Artículo 39
- 有給休暇制度解説 (Explicación Sistema Yukyu)
- Ministerio de Trabajo - Japón
```

---

### 4. FAQ - Preguntas Frecuentes

**Archivo:** `/frontend/app/(dashboard)/docs/FAQ_YUKYU.md`

**Contenido:**

```markdown
# ❓ FAQ - Preguntas Frecuentes sobre Yukyus

## KEITOSAN

### P: ¿Qué hago si un empleado no tiene días disponibles?
**R:** Sistema rechazará automáticamente. Contacta al empleado para reducir los días solicitados.

### P: ¿Puedo ver el historial de un empleado?
**R:** Sí, en `/yukyu-history` busca por employee_id y verás todo su historial.

### P: ¿Cuál es la fórmula exacta de deducción?
**R:** `días × 8 horas × tasa_horaria_base`. Por ejemplo: 1 × 8 × ¥1,500 = ¥12,000

### P: ¿Qué pasa si rechazo una solicitud?
**R:** Empleado recibe notificación con motivo del rechazo. Puede crear nueva solicitud.

### P: ¿Puedo forzar yukyu si empleado tiene <5 días al final del año?
**R:** Sí. Contacta al gerente del sistema para función de "fuerza de yukyu".

---

## TANTOSHA

### P: ¿Puedo crear solicitud para empleado de otra fábrica?
**R:** No. Sistema solo permite fábricas asignadas a ti. Contacta admin si necesitas acceso.

### P: ¿Qué hago si la fecha está en el pasado?
**R:** Usa una fecha futura. Yukyus solo pueden ser prospectivos.

### P: ¿Puedo crear solicitud si hay overlap?
**R:** No. Sistema rechazará si hay solicitud anterior en ese período.

### P: ¿Cuánto tiempo demora la aprobación?
**R:** Típicamente 1-3 días. Si >7 días, contacta a KEITOSAN.

### P: ¿Puedo modificar solicitud después de enviar?
**R:** No. Debes rechazarla y crear una nueva.

---

## GENERAL

### P: ¿Qué es teiji (定時)?
**R:** Horario estándar del empleado. Típicamente 160 horas/mes = 8 horas/día.

### P: ¿Se paga durante yukyu?
**R:** Sí, se paga el salario completo como si trabajara.

### P: ¿Qué pasa si renuncio?
**R:** Días no usados deben ser pagados en efectivo.

### P: ¿Puedo tomar media día?
**R:** Sí, ingresa 0.5 en lugar de 1.0. Media día = 4 horas.

### P: ¿Hay límite de días por mes?
**R:** No límite por mes. Límite es anual (mínimo 5, máximo 20).

---

### Contactos de Soporte

| Rol | Contacto | Problema |
|-----|----------|----------|
| Técnico | admin@company.com | Sistema no funciona |
| KEITOSAN Manager | keiri@company.com | Solicitud rechazada |
| TANTOSHA Manager | hr@company.com | Acceso a fábrica |
| Legal | legal@company.com | Conformidad laboral |
```

---

## 📁 ESTRUCTURA DE CARPETAS

```
docs/
├── GUIA_KEITOSAN.md              # Guía para Finance Manager
├── GUIA_TANTOSHA.md              # Guía para HR Representative
├── REGULACIONES_LABORALES.md     # Leyes de Japón
└── FAQ_YUKYU.md                  # Preguntas frecuentes
```

---

## 🎓 CONTENIDO Y COBERTURA

### GUÍA KEITOSAN
- ✓ Responsabilidades del rol
- ✓ Cómo usar el dashboard
- ✓ Procedimiento de aprobación
- ✓ Fórmula de deducción
- ✓ Alertas de conformidad
- ✓ Reportes disponibles
- ✓ Troubleshooting

### GUÍA TANTOSHA
- ✓ Responsabilidades del rol
- ✓ Cómo crear solicitud
- ✓ Validaciones del sistema
- ✓ Flujo de aprobación
- ✓ Estados de solicitud
- ✓ Ejemplo correcto
- ✓ Errores comunes

### REGULACIONES LABORALES
- ✓ Ley de yukyu (Art. 39)
- ✓ Derechos del empleado (5+ días/año)
- ✓ Cálculo de pago
- ✓ Casos especiales
- ✓ Auditoría y compliance
- ✓ Penalidades

### FAQ
- ✓ Preguntas KEITOSAN (5)
- ✓ Preguntas TANTOSHA (5)
- ✓ Preguntas generales (7)
- ✓ Contactos de soporte

**Total:** ~3,000 palabras de documentación

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Crear `/frontend/app/(dashboard)/docs/` directorio
- [ ] Crear `GUIA_KEITOSAN.md`
- [ ] Crear `GUIA_TANTOSHA.md`
- [ ] Crear `REGULACIONES_LABORALES.md`
- [ ] Crear `FAQ_YUKYU.md`
- [ ] Validar markdown syntax (sin errores)
- [ ] Agregar links en página principal de docs
- [ ] Hacer commit con mensaje semántico
- [ ] Push a rama remote

---

## 📊 ESTIMADO DE LÍNEAS

- GUÍA KEITOSAN: ~200 líneas
- GUÍA TANTOSHA: ~180 líneas
- REGULACIONES LABORALES: ~150 líneas
- FAQ: ~100 líneas
- **Total:** ~630 líneas de documentación

---

## 🚀 PRÓXIMOS PASOS DESPUÉS DE FASE 6

1. FASE 7: Testing (tests E2E + unitarios)
2. FASE 8: Validación final (testing en staging)
3. FASE 9: Reporte final (resumen ejecutivo completo)

---

**Rama:** `claude/analyze-yukyus-structure-011CV3zF69mdcFr3HmQBNJZp`
**Estado:** 📋 PLANIFICADO
**Próximo:** Implementación de FASE 6
