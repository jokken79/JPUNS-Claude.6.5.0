# GUÍA TANTOSHA (担当者) - Sistema de Yukyus

## ¿Quién es TANTOSHA?

**TANTOSHA (担当者)** = HR Representative / Coordinador de Recursos Humanos

El TANTOSHA es el responsable de:
- ✅ Crear solicitudes de yukyu (有給休暇) en nombre de empleados
- ✅ Gestionar solicitudes pendientes
- ✅ Comunicar decisiones de aprobación/rechazo a empleados
- ✅ Mantener historial de solicitudes
- ❌ NO puede aprobar (solo KEITOSAN)
- ❌ NO puede crear solicitudes para otras factories
- ❌ NO puede cambiar decisiones de aprobación

---

## 🚀 Cómo Crear una Solicitud de Yukyu

### Step 1: Acceder a la Página de Creación

```
URL: https://app.example.com/yukyu-requests/create

Menú alternativo:
1. Login como TANTOSHA
2. Sidebar → Solicitudes → Nuevo Yukyu
3. O directo: /yukyu-requests/create
```

### Step 2: Completar Formulario

```
FORMA DE SOLICITUD:
┌─────────────────────────────────────┐
│ Crear Nueva Solicitud de Yukyu      │
├─────────────────────────────────────┤
│ [*] Empleado (buscar por nombre/ID) │
│ [*] Factory ID (tu factory)         │
│ [*] Fecha Inicio (YYYY-MM-DD)       │
│ [*] Fecha Fin (YYYY-MM-DD)          │
│ [ ] Razón (opcional)                │
│ [ ] Notas (opcional)                │
│                                     │
│      [Crear]  [Cancelar]            │
└─────────────────────────────────────┘
```

**[*] = Campo obligatorio**

### Step 3: Llenar Campos

#### Empleado
- **Buscar por:** Nombre kanji, nombre romano, o ID de empleado
- **Validación:** Solo empleados activos de tu factory
- **Ejemplo:** "Yamada Taro" o "山田太郎"

#### Factory ID
- **Auto-completado:** Se llena con tu factory asignada
- **No editable:** Protege contra asignación cruzada
- **Ejemplo:** "FAC001" (Factory 1)

#### Fecha Inicio
- **Formato:** YYYY-MM-DD (2025-11-10)
- **Validación:**
  - ❌ No puede ser en el pasado
  - ❌ No puede ser después de Fecha Fin
  - ✅ Puede ser hoy
  - ✅ Puede ser futuro

#### Fecha Fin
- **Formato:** YYYY-MM-DD (2025-11-12)
- **Validación:**
  - ❌ No puede ser antes de Fecha Inicio
  - ✅ Puede ser mismo día que inicio (0.5 día)
  - ✅ Puede ser rango múltiple días

#### Razón (Opcional)
- **Propósito:** Documentar motivo (vacaciones, cita médica, etc.)
- **Ejemplo:** "Vacaciones familiares"
- **Auditoría:** Se registra en historial

#### Notas (Opcional)
- **Propósito:** Comentarios adicionales para KEITOSAN
- **Ejemplo:** "Empleado con 5 años de servicio - aproba

r por favor"

### Step 4: Validaciones Automáticas

Cuando intentas crear la solicitud, el sistema valida:

```
✓ ¿El empleado pertenece a tu factory?
✓ ¿Las fechas son válidas (no pasadas)?
✓ ¿No hay solicitud solapada?
✓ ¿El empleado tiene saldo de yukyu?
```

**Si falla alguna:**
```
Error Message Example:
┌──────────────────────────────────────┐
│ ⚠ Error: Solicitud solapada         │
│                                      │
│ Ya existe una solicitud aprobada     │
│ para Yamada Taro del 2025-11-10 al   │
│ 2025-11-12                           │
│                                      │
│ Acción: Elegir fechas diferentes     │
│         o contactar KEITOSAN          │
└──────────────────────────────────────┘
```

### Step 5: Confirmar y Crear

```
1. Revisar todos los datos
2. Click [Crear]
3. Confirmación:
   "✓ Solicitud creada exitosamente (ID: 12345)"
4. Esperar aprobación de KEITOSAN
```

---

## 📊 Panel de Solicitudes

### Acceder

```
URL: https://app.example.com/yukyu-requests

Menú:
1. Sidebar → Solicitudes
2. O directo: /yukyu-requests
```

### Vistas Disponibles

#### Vista 1: Mis Solicitudes
- Todas las solicitudes que TÚ creaste
- Filtros: Pendiente, Aprobado, Rechazado

#### Vista 2: Solicitudes de Mi Factory
- Todas las solicitudes de tu factory
- Muestra empleados y estados

#### Vista 3: Historial
- Historial completo de cambios
- Quién aprobó, quién rechazó, cuándo

---

## 🔍 Flujo de Estados de Solicitud

```
CREACIÓN (TANTOSHA)
     │
     ├─→ VALIDACIONES
     │   ├─ Fechas OK?
     │   ├─ Sin solapas?
     │   └─ Factory correcta?
     │
     ├─→ Si FALLA
     │   └─ Error mostrado a TANTOSHA
     │
     ├─→ Si PASA
     │   └─ CREADA (Status: PENDING)
     │
APROBACIÓN (KEITOSAN)
     │
     ├─→ APPROVED
     │   ├─ Salario deducido
     │   └─ Notificación al empleado
     │
     └─→ REJECTED
         ├─ Días devueltos
         └─ Notificación a TANTOSHA
```

---

## ⚠️ Restricciones y Validaciones

### NO Puedes Crear Solicitud Si:

| Condición | Razón |
|-----------|-------|
| Empleado no es de tu factory | Seguridad: previene asignación cruzada |
| Fecha inicio en el pasado | Cumplimiento: no se permite retroactivo |
| Fecha inicio > fecha fin | Lógica: rango inválido |
| Solicitud solapada existe | Integridad: un empleado no puede tomar yukyu dos veces |
| Empleado no es activo | Validación: solo empleados en nómina |

### Mensajes de Error Comunes

#### Error: "Fecha no puede ser en el pasado"
```
Causa: Intentaste crear solicitud para fecha pasada
Solución: Usar fecha de hoy o futuro
Ejemplo:
  ❌ 2025-11-01 (ya pasó)
  ✅ 2025-11-12 (hoy)
  ✅ 2025-11-15 (futuro)
```

#### Error: "Empleado no pertenece a tu factory"
```
Causa: Trataste de asignar empleado de otra factory
Solución: Seleccionar empleado de tu factory
Seguridad: Esto protege contra asignación no autorizada
```

#### Error: "Solicitud solapada"
```
Causa: Ya existe solicitud para estas fechas
Solución: Elegir fechas diferentes o verificar solicitud existente
```

---

## 📋 Gestión de Solicitudes Rechazadas

### Cuando una Solicitud es Rechazada

```
Timeline:
1. TANTOSHA crea solicitud
2. KEITOSAN rechaza (¿por qué?)
3. TANTOSHA recibe notificación
4. Días vuelven al pool del empleado
```

### Acciones Después del Rechazo

#### Opción A: Crear Nueva Solicitud
```
Si KEITOSAN rechazó por fechas inválidas:
1. Seleccionar fechas alternas
2. Crear nueva solicitud
3. Enviar a KEITOSAN nuevamente
```

#### Opción B: Contactar a KEITOSAN
```
Si necesitas aprobación especial:
1. Llamar a KEITOSAN directamente
2. Explicar razón de yukyu
3. Solicitar aprobación manual
```

#### Opción C: Cambiar Empleado
```
Si empleado tiene conflicto de yukyus:
1. Consultar con empleado
2. Seleccionar fechas diferentes
3. Resubmitir solicitud
```

---

## 📊 Cálculo de Días de Yukyu

### ¿Cuántos Días Tiene un Empleado?

```
Días Disponibles = Base Legal - Días Usados + Acumulados

Donde:
├─ Base Legal: Mínimo 5 días/año (Japanese Labor Law Article 39)
├─ Días Usados: Dias ya aprobados y tomados en el año
├─ Acumulados: Días no usados del año anterior
└─ Resultado: Días disponibles para solicitar ahora
```

### Ejemplo

```
Empleado: Yamada Taro
Datos:
├─ Base Legal: 20 días/año
├─ Usado este año: 8 días
├─ Acumulado de año anterior: 3 días
├─ Cálculo: 20 - 8 + 3 = 15 días disponibles
└─ Conclusión: Puede solicitar hasta 15 días más
```

---

## 🔐 Restricciones de TANTOSHA

### Lo que PUEDES hacer

| Acción | Permiso |
|--------|---------|
| Crear solicitudes | ✅ Sí |
| Crear para tu factory | ✅ Sí |
| Ver estado de solicitud | ✅ Sí |
| Editar solicitud PENDIENTE | ✅ Sí |
| Cancelar solicitud PENDIENTE | ✅ Sí |
| Ver historial | ✅ Sí |

### Lo que NO PUEDES hacer

| Acción | Permiso |
|--------|---------|
| Crear para otra factory | ❌ No |
| Aprobar solicitudes | ❌ No (solo KEITOSAN) |
| Rechazar solicitudes | ❌ No (solo KEITOSAN) |
| Editar solicitud APROBADA | ❌ No |
| Cambiar datos de empleado | ❌ No |
| Borrar solicitudes | ❌ No |

---

## 💬 Comunicación con Empleados

### Después de Crear Solicitud

```
1. Notificar al empleado:
   "Hemos creado tu solicitud de yukyu para
    el 10-12 de Noviembre.
    Esperando aprobación de Finanzas."

2. Dar seguimiento:
   - Día 1: "Solicitud recibida"
   - Día 2-3: "En proceso de aprobación"
   - Día 3+: "Contacting KEITOSAN si retraso"
```

### Después de Aprobación

```
Notificar:
"✓ Tu solicitud de yukyu fue APROBADA

 Fecha: 10-12 Noviembre 2025
 Días: 2.5 días
 Deducción: ¥12,000

 Se reflejará en nómina del mes."
```

### Después de Rechazo

```
Notificar:
"⚠ Tu solicitud de yukyu fue RECHAZADA

 Razón: Conflicto con otro yukyu aprobado
 Fechas alternativas: Nov 15-17

 Contacta RR.HH. si tienes preguntas"
```

---

## 🎯 Checklist para TANTOSHA

### Antes de Crear Solicitud
- [ ] Empleado pertenece a tu factory
- [ ] Fechas son válidas (no pasadas)
- [ ] Fechas no solapan con otro yukyu
- [ ] Empleado tiene saldo de yukyu
- [ ] Razón documentada (si aplica)

### Después de Crear
- [ ] Notificación enviada a empleado
- [ ] Solicitud visible en panel de estado
- [ ] Expectativa comunicada (3-5 días de aprobación)

### Seguimiento
- [ ] Revisión diaria de solicitudes pendientes
- [ ] Recordatorio a KEITOSAN si > 3 días
- [ ] Notificación a empleado de resultado

---

## ❓ Preguntas Frecuentes

### P: ¿Puedo crear solicitud para un empleado de otra factory?
**R:** No. El sistema valida que pertenezca a tu factory. Esto protege contra asignación errónea.

### P: ¿Puedo crear solicitud para una fecha pasada?
**R:** No. El sistema rechaza fechas en el pasado. Si necesitas retroactivo, contacta a ADMIN.

### P: ¿Cuál es el máximo de días que puedo solicitar?
**R:** Depende del saldo del empleado. El sistema muestra días disponibles al seleccionar al empleado.

### P: ¿Cuánto tiempo tarda la aprobación?
**R:** Típicamente 1-2 días hábiles. Si > 3 días, contacta a KEITOSAN.

### P: ¿Puedo editar una solicitud después de crearla?
**R:** Sí, si está en estado PENDIENTE. Una vez aprobada o rechazada, es de solo-lectura.

### P: ¿Qué pasa si el empleado se enferma durante yukyu?
**R:** Contacta a KEITOSAN para cambiar a baja médica. Diferentes procesos aplican.

---

## 📞 Soporte

### Problemas Técnicos
- **No puedo acceder:** Verifica rol = TANTOSHA
- **Error al crear:** Lee mensaje de error detallado
- **No veo empleado:** Verifica que esté activo en tu factory

### Preguntas de Negocio
- **Aprobación lenta:** Contacta a KEITOSAN
- **Días incorrectos:** Verifica con Nómina
- **Validaciones estrictas:** Por diseño (seguridad)

**Email:** support@example.com
**Teléfono:** +81-XX-XXXX-XXXX

---

**Última actualización:** 12 de Noviembre 2025
**Versión:** 1.0
**Próxima revisión:** Marzo 2026
