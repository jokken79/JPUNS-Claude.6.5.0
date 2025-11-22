# ❓ FAQ - Preguntas Frecuentes sobre Yukyus

---

## 👨‍💼 KEITOSAN (Finance Manager)

### P: ¿Qué hago si un empleado no tiene días disponibles?

**R:** Sistema rechazará automáticamente la solicitud.

**Procedimiento:**
1. Empleado verá error: "Días insuficientes"
2. Contactar empleado para reducir días solicitados
3. Empleado puede reenviar solicitud con menor cantidad
4. Si legítimamente no tiene días, rechazar

---

### P: ¿Puedo ver el historial de un empleado?

**R:** Sí. En `/yukyu-history` busca por `employee_id` y verás:
- Todas sus solicitudes (pasadas y presentes)
- Estados (PENDING, APPROVED, REJECTED)
- Detalles: fechas, días, montos deducidos
- Auditoría de aprobaciones

---

### P: ¿Cuál es la fórmula exacta de deducción?

**R:**
```
Deducción = Días × Teiji (定時) × Tasa Horaria Base

Ejemplo:
├─ Empleado: Yamada Taro
├─ Días: 1.0
├─ Teiji: 8 horas/día (estándar)
├─ Tasa horaria: ¥1,500/hora
└─ Deducción: 1 × 8 × ¥1,500 = ¥12,000
```

**Precisión**: Sistema usa `Decimal` (no float) para exactitud financiera

---

### P: ¿Qué pasa si rechazo una solicitud?

**R:** Cuando rechazas:
1. Debes proporcionar motivo del rechazo
2. Sistema notifica al empleado
3. Empleado recibe motivo en su cuenta
4. Empleado puede crear nueva solicitud

---

### P: ¿Puedo forzar yukyu si empleado tiene <5 días al final del año?

**R:** Sí, es obligatorio según ley laboral.

**Proceso:**
1. Identificar empleado con <5 días antes Marzo 31
2. Dashboard muestra esos empleados (🔴 rojo)
3. Click: "Forzar Yukyu"
4. Sistema:
   - Crea solicitud automática
   - Deduce días necesarios para llegar a 5
   - Registra en auditoría
   - Notifica empleado

**Ejemplo:**
```
Empleado: Suzuki Hanako
FY actual usado: 3 días
Mínimo requerido: 5 días
Acción: Forzar 2 días antes Marzo 31
```

---

### P: ¿Cómo se calcula el Teiji (定時)?

**R:**
```
Teiji = Horas Estándar Mensuales ÷ Días Laborales por Mes
      = 160 horas/mes ÷ 20 días
      = 8 horas/día (típico)
```

**Variables por Empleado:**
- Full-time: 160 horas/mes = 8 h/día
- Part-time: 120 horas/mes = 6 h/día
- Shift worker: Varía según contrato

Ver contrato del empleado en sistema

---

### P: ¿Puedo aprobar yukyu en el pasado?

**R:** No. Sistema rechaza fechas pasadas.

**Razones:**
- Conflicto con nómina ya procesada
- Dificultad de auditoría
- Cambio de histórico salarial

**Alternativa:** Si empleado tomó días sin registrar, crear "corrección" con fecha actual pero anotando "Retrospectivo para X"

---

### P: ¿Se puede tomar yukyu de semana?

**R:** Sí, pero depende del horario de trabajo del empleado.

**Ejemplos:**
```
Empleado con horario normal (Lun-Vie):
└─ No puede solicitar sábado como yukyu completo
   (No es día laboral)

Empleado con horario semanal 7 días:
└─ Puede solicitar cualquier día (incluyendo sábado)
```

**Sistema valida automáticamente** según calendario laboral del empleado

---

### P: ¿Qué pasa si empleado renuncia con yukyu pendiente?

**R:** Debe ser pagado en dinero (finiquito).

**Proceso:**
1. Sistema calcula días restantes en FY
2. Calcula monto: días × teiji × tasa_base
3. Incluye en finiquito del empleado
4. Se paga al momento de renuncia

**Ejemplo:**
```
Renuncia: Enero 15, 2025
FY 2024-2025: Usó 3 días (resta 2)
Compensación: 2 × 8 × ¥1,875 = ¥30,000
```

---

### P: ¿Cómo manejar conflicto de yukyu?

**R:** Si dos KEITOSAN aprueban simultáneamente:
1. Primer aprobador gana (primera transacción)
2. Segundo ve error: "Ya fue aprobado"
3. Sistema es **idempotente** (seguro)

---

### P: ¿Puedo modificar un yukyu ya aprobado?

**R:** No. Sistema no permite modificaciones.

**Alternativa:**
1. Contactar empleado
2. Empleado solicita nueva solicitud (corregida)
3. Rechazar la antigua (si necesario)
4. Aprobar la nueva

---

## 📋 TANTOSHA (HR Representative)

### P: ¿Puedo crear solicitud para empleado de otra fábrica?

**R:** No. Sistema solo permite fábricas asignadas a ti.

**Si necesitas acceso:**
1. Contactar administrador: `admin@company.com`
2. Solicitar acceso a esa fábrica
3. Administrador actualiza permisos en sistema

---

### P: ¿Qué hago si la fecha está en el pasado?

**R:** Sistema rechaza automáticamente fechas pasadas.

**Solución:** Usa una fecha futura. Yukyus solo pueden ser prospectivos (planeados hacia adelante)

---

### P: ¿Puedo crear solicitud si hay overlap?

**R:** No. Sistema rechaza si hay solicitud anterior en ese período.

**Error:**
```
"Ya existe solicitud para este empleado en
periodo 2025-10-18 a 2025-10-20"
```

**Solución:**
1. Usar período diferente
2. O contactar KEITOSAN para rechazar antigua

---

### P: ¿Cuánto tiempo demora la aprobación?

**R:** Tiempo típico: 1-3 días

**Timeline:**
- Día 1: TANTOSHA crea solicitud
- Día 1-2: KEITOSAN revisa en dashboard
- Día 2: KEITOSAN aprueba ✓ o rechaza ✗
- Día 2-3: TANTOSHA informa al empleado

**Si >7 días sin respuesta:**
- Contactar KEITOSAN: `keiri@company.com`
- Proporcionar ID de solicitud

---

### P: ¿Puedo modificar solicitud después de enviar?

**R:** No. Sistema no permite modificaciones.

**Proceso:**
1. Identificar error en solicitud
2. Contactar KEITOSAN para rechazarla
3. Crear nueva solicitud (corregida)
4. Reenviar para aprobación

---

### P: ¿Qué validaciones hace el sistema automáticamente?

**R:** Antes de permitir envio:

```
✓ Fecha no puede ser en el pasado
✓ Fecha inicio ≤ fecha fin
✓ No hay overlap con solicitud anterior
✓ TANTOSHA pertenece a esa fábrica
✓ Empleado existe en sistema
✓ Días es número válido (>0)
✓ Período es racional (<30 días)
```

Si falla cualquiera, sistema muestra error y NO permite enviar

---

### P: ¿Puedo crear solicitud si empleado está en vacaciones?

**R:** Depende del tipo:

**Yukyu (有給休暇) - Sí**
- Empleado elige las fechas
- Se puede solicitar en cualquier momento

**Vacaciones forzadas por empresa - No**
- Empresa decide fechas
- Sistema separado (no en yukyu)

---

### P: ¿Qué pasa si empleado está enfermo?

**R:** No se solicita como yukyu, es sistema separado.

**Diferencia:**
- **Enfermedad**: Empleado no elige, se paga aparte
- **Yukyu**: Empleado elige, se deduce de asignación

Si empleado está enfermo por 5 días:
- NO deduce de los 5 días yukyu anuales
- Se paga por sistema de enfermedad

---

### P: ¿Puedo ver el estado de mis solicitudes?

**R:** Sí. En `/yukyu-history`:
1. Ir a URL
2. Ver todas tus solicitudes
3. Filtrar por estado (PENDING, APPROVED, REJECTED)
4. Click en solicitud para detalles

---

### P: ¿Qué significa cada estado?

**R:**

| Estado | Significado | Acción |
|--------|-------------|--------|
| PENDING | En espera de KEITOSAN | Seguimiento si >7 días |
| APPROVED | ✓ Aprobada | Informar al empleado |
| REJECTED | ✗ Rechazada | Contactar KEITOSAN, crear nueva |

---

### P: ¿Cómo informar al empleado sobre la decisión?

**R:** Responsabilidad de TANTOSHA:

1. **Si APPROVED ✓:**
   ```
   - Informar aprobación
   - Confirmar fechas finales
   - Mencionar deducción salarial
   - Actualizar registros internos
   ```

2. **Si REJECTED ✗:**
   ```
   - Informar rechazo
   - Explicar motivo (ver en sistema)
   - Sugerir alternativas (diferentes fechas, menos días)
   - Ofrecer crear nueva solicitud
   ```

---

## 🌐 GENERAL

### P: ¿Qué es teiji (定時)?

**R:** Teiji (定時) = Horario Estándar

Horas de trabajo establecidas en el contrato del empleado:
- **Full-time típico**: 8 horas/día (160 horas/mes)
- **Part-time**: Menos de 8 horas/día
- **Shift worker**: Variable según turno

Se usa para calcular:
```
Deducción = Días × Teiji × Tasa Horaria
```

---

### P: ¿Se paga durante yukyu?

**R:** Sí, completamente.

**Detalles:**
- Se paga el salario completo como si trabajara
- NO hay descuento
- El sistema calcula automáticamente
- Se ve en nómina del mes

---

### P: ¿Qué pasa si renuncio?

**R:** Días no usados deben ser pagados en dinero.

**Proceso:**
1. Empleador calcula días restantes en FY
2. Calcula monto: días × teiji × tasa_base
3. Incluye en finiquito (ultima nómina)
4. Se paga al momento de renuncia

**Ejemplo:**
```
Renuncia: Enero 15, 2025
FY 2024-2025: Ha usado 3 días (resta 2)
Teiji: 8 horas/día
Tasa: ¥1,875/hora
Compensación: 2 × 8 × ¥1,875 = ¥30,000
```

---

### P: ¿Puedo tomar media día?

**R:** Sí.

**Ejemplos:**
- 1.0 = día completo (8 horas)
- 0.5 = medio día (4 horas)
- 1.5 = día + medio (12 horas)
- 0.25 = cuarto de día (2 horas)

Ingresa número decimal en formulario

---

### P: ¿Hay límite de días por mes?

**R:** No hay límite por mes.

**Límites aplicables:**
- **Anual**: Mínimo 5 días, máximo 20 días (según contrato)
- **Acumulación**: Típicamente máximo 40 días (2 años)
- **Por solicitud**: Sin límite (puedes solicitar 5 días de una vez)

---

### P: ¿Año fiscal = año calendario?

**R:** Depende de la empresa.

**JPUNS usa:**
```
Año Fiscal: Abril 1 - Marzo 31
(Estándar en Japón)

Pero: Empresa puede elegir año calendario (Enero - Diciembre)
```

---

### P: ¿Cómo se calcula el complimiento de 5 días?

**R:**
```
Compliance = (Días Aprobados) ≥ 5.0

Verde (✅):   ≥ 5.0 días
Amarillo (🟡): 3.0 - 4.9 días
Rojo (🔴):    < 3.0 días
```

Si rojo al final de FY = VIOLACIÓN DE LEY

---

### P: ¿Puedo forzar a un empleado a tomar yukyu?

**R:** En Japón, sí (bajo ley laboral).

**Detalles:**
- Empresa DEBE garantizar 5+ días/año
- Si empleado no los usa, empresa "fuerza" días
- Típicamente: Finales de FY
- Registrar en sistema para auditoría

---

### P: ¿Cómo se manejan enfermedades?

**R:** Separado del sistema yukyu.

**Diferencia:**
```
YUKYU (有給休暇):
├─ Empleado elige fechas
├─ Se deduce de asignación
└─ Se planifica

ENFERMEDAD:
├─ No elige empleado
├─ Sistema separado
├─ NO deduce de yukyu
└─ Se prueba con certificado médico
```

Si empleado está enfermo 3 días:
- NO deduce de los 5 yukyu anuales
- Se paga por sistema de enfermedad

---

### P: ¿Qué documentación se requiere?

**R:** Depende del tipo:

**Yukyu normal**: Sin documento requerido (planeado)
**Enfermedad**: Certificado médico requerido
**Accidente**: Reporte de incidente + evidencia
**Renuncia**: Carta de renuncia + cálculo de finiquito

---

## 📞 CONTACTOS DE SOPORTE

| Rol | Tema | Contacto | Email |
|-----|------|----------|-------|
| Técnico | Sistema no funciona | Admin | admin@company.com |
| KEITOSAN | Solicitud rechazada | Finance | keiri@company.com |
| TANTOSHA | Acceso a fábrica | HR | hr@company.com |
| Legal | Conformidad | Legal | legal@company.com |

---

**Última Actualización**: 2025-11-22
**Estado**: ✅ COMPLETO
**Documento**: FAQ YUKYU - Preguntas Frecuentes
