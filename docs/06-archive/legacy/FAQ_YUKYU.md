# 📋 Preguntas Frecuentes (FAQ) - Sistema Yukyu

## Para KEITOSAN (Finance Manager)

### Aprobación y Rechazo

**P: ¿Cuál es el plazo para aprobar o rechazar una solicitud?**
```
R: Idealmente 24-48 horas hábiles.
   Si tarda más de 3 días, notifica al empleado.
   Excepción: Fines de semana no cuentan.
```

**P: ¿Puedo cambiar mi decisión después de aprobar?**
```
R: NO. Una aprobación es final y se deduce automáticamente del salario.
   Si hay error, contacta a IT para revertir (requiere SUPER_ADMIN).
```

**P: ¿Qué información debo considerar al aprobar?**
```
R: Considerar:
   ✓ Saldo disponible del empleado
   ✓ Impacto en nómina
   ✓ Fecha válida
   ✓ Factory correcta
   ✓ Detalles de negocio (si aplica)
```

**P: ¿Puedo rechazar sin dar razón?**
```
R: Técnicamente sí, pero mejor práctica es documentar:
   - Conflicto operacional
   - Solicitud inválida
   - Falta de saldo
   - Otra razón
```

### Cálculos y Deducción

**P: ¿Cómo se calcula la deducción exactamente?**
```
R: Fórmula:
   deducción = días × teiji_horas_por_día × tarifa_horaria

   Donde:
   ├─ días = días_aprobados (ej: 1)
   ├─ teiji = 160 horas/mes ÷ 20 = 8 horas/día
   └─ tarifa = jikyu del empleado

   Ejemplo:
   1 día × 8 horas × ¥1,500 = ¥12,000
```

**P: ¿Se puede cambiar el teiji?**
```
R: No directamente. El teiji se calcula de standard_hours_per_month.
   Para cambiar, ADMIN debe actualizar payroll_settings.
```

**P: ¿Se pueden hacer descuentos al salario base?**
```
R: NO. Yukyu siempre se paga al 100%.
   Las detracciones son por cambio de horas trabajadas, no reducción de paga.
```

### Cumplimiento Legal

**P: ¿Cuándo debo alerta sobre empleado bajo 5 días?**
```
R: Dashboard indica automáticamente:
   ⚠ < 5 días: Alerta
   🔴 < 3 días: Alerta alta
   🔴🔴 < 1 día: Alerta crítica

   Acción: Notificar al empleado para que tome yukyu restante
```

**P: ¿Qué pasa si un empleado tiene 0 días?**
```
R: Cumplimiento legal violado.
   Acciones:
   1. Contactar a empleado inmediatamente
   2. Documentar en audit log
   3. Reportar a Legal/HR
   4. Posible compensación requerida
```

**P: ¿Se acumula yukyu más allá de 3 años?**
```
R: Legalmente, máximo 3 años.
   Sistema: Automáticamente caduca después de 3 años
   (2022 + 2023 + 2024 acumulan = máx 60 días)
```

---

## Para TANTOSHA (HR Representative)

### Crear Solicitud

**P: ¿Qué datos son obligatorios?**
```
R: Campos requeridos:
   [*] Empleado
   [*] Factory ID
   [*] Fecha Inicio (YYYY-MM-DD)
   [*] Fecha Fin (YYYY-MM-DD)

   Opcional:
   [ ] Razón
   [ ] Notas
```

**P: ¿Puedo crear solicitud para empleados de otra factory?**
```
R: NO. El sistema valida factory en el nivel de aplicación.
   Solo puedes crear para empleados de tu factory asignada.
   Seguridad: Previene asignación cruzada no autorizada.
```

**P: ¿Puedo crear solicitud retroactiva?**
```
R: NO. El sistema rechaza fechas pasadas.
   Si es necesario, contacta a SUPER_ADMIN para excepción manual.
```

**P: ¿Cuál es el máximo de días que puedo solicitar?**
```
R: Depende del saldo del empleado.
   El sistema valida automáticamente y muestra:
   "Empleado tiene 12.5 días disponibles"
```

**P: ¿Puedo crear solicitud para una fecha futura lejana?**
```
R: Sí, técnicamente puedes.
   Pero mejor práctica: 30-60 días anticipación.
   Razón: Cambios en la empresa pueden afectar disponibilidad.
```

### Modificar Solicitud

**P: ¿Puedo editar una solicitud después de crearla?**
```
R: Sí, si está PENDING (no aprobada/rechazada).

   Opciones:
   ├─ Editar fechas
   ├─ Cambiar días
   ├─ Editar razón
   └─ O cancelar y recrear
```

**P: ¿Puedo cambiar un empleado en la solicitud?**
```
R: NO. Una vez creada, no se puede cambiar el empleado.
   Solución: Cancelar y crear nueva solicitud.
```

**P: ¿Qué pasa si me equivoco con las fechas?**
```
R: Si está PENDING:
   1. Editar fechas en la solicitud
   2. KEITOSAN aprobará fechas corregidas

   Si está APPROVED:
   1. Contactar a KEITOSAN
   2. Solicitar anulación
   3. Crear nueva solicitud
```

### Rechazo y Problemas

**P: ¿Qué significa "solicitud solapada"?**
```
R: Ya existe otra solicitud para el mismo empleado en esas fechas.

   Ejemplo:
   ├─ Solicitud 1: 2025-11-10 a 2025-11-12 (aprobada)
   ├─ Solicitud 2: 2025-11-11 a 2025-11-13 (rechazada: solapada)
   └─ Solución: Elegir fechas diferentes

   Razón: Un empleado no puede tomar yukyu dos veces en mismo período
```

**P: ¿Qué hago si KEITOSAN rechaza?**
```
R: 3 opciones:

   1. Crear nueva solicitud con fechas distintas
   2. Contactar a KEITOSAN para preguntar por qué
   3. Contactar al empleado para explicar rechazo

   Si rechazo es error:
   └─ Coordinar con KEITOSAN para aprobación manual
```

**P: ¿Cuánto tiempo espero antes de insistir?**
```
R: Timeline recomendado:
   Day 1-2: Crear solicitud
   Day 2-3: Esperar aprobación
   Day 3+: Enviar recordatorio a KEITOSAN
   Day 5+: Escalar a supervisor de KEITOSAN
```

---

## Para Todos (Preguntas Generales)

### Conceptos

**P: ¿Qué es yukyu?**
```
R: Yukyu (有給休暇) = Descanso remunerado anual

   Características:
   ├─ Derecho legal (Article 39, Ley Laboral Japón)
   ├─ Pagado al 100% (no hay descuento)
   ├─ Mínimo 5 días/año
   └─ Acumula hasta 3 años
```

**P: ¿Cuál es la diferencia entre yukyu y baja médica?**
```
R: Diferencias:

   YUKYU                      BAJA MÉDICA
   ├─ Descanso voluntario     ├─ Por enfermedad
   ├─ Requiere aprobación     ├─ Requiere certificado
   ├─ Pagado al 100%          ├─ Puede ser parcial
   └─ Acumula                 └─ No acumula formalmente
```

**P: ¿Cuál es la diferencia entre 0.5 días y half-day?**
```
R: Son lo mismo:
   0.5 días = half-day = 4 horas

   Ejemplos de half-day:
   ├─ Mañana: 09:00-13:00 (4 horas)
   └─ Tarde: 13:00-17:00 (4 horas)

   Sistema registra como: 0.5
```

### Derechos y Obligaciones

**P: ¿Qué pasa si el empleador no me da yukyu?**
```
R: Violación de ley. Acciones:

   Paso 1: Solicitar por escrito
   Paso 2: Documentar negativa
   Paso 3: Reportar a:
           - Oficina Laboral Local
           - Teléfono: 0120-55-4995
   Paso 4: Abogado laboral (si necesario)

   Derecho: Recibir pago retroactivo + intereses (14.6% anual)
```

**P: ¿Puedo trabajar mientras estoy de yukyu?**
```
R: NO. Yukyu es descanso obligatorio.
   Trabajar anula el protección legal.

   Si fuerzas a trabajar:
   └─ Empleador viola ley
   └─ Puedes reclamar compensación
```

**P: ¿Se caduca el yukyu no tomado?**
```
R: Legalmente: Máximo 3 años de acumulación
   Después de 3 años: Se pierde

   Ejemplo:
   ├─ Año 1: 10 días (+ 10 del anterior = 20 total)
   ├─ Año 2: 10 días (+ 20 = 30 máx, pero caduca +10 más antiguo)
   └─ Resultado: 20 días disponibles
```

### Pago y Deducción

**P: ¿Se deduce impuesto de yukyu?**
```
R: NO. Yukyu es parte del salario regular.

   Deducción = Cambio de horas trabajadas (teiji aplicado)
   Ejemplo:
   ├─ Horas normales: 160
   ├─ Yukyu: 8 (1 día)
   ├─ Horas actuales: 152 (160 - 8)
   └─ Pago: Basado en 152 horas
```

**P: ¿Me pagan más por yukyu?**
```
R: NO. Yukyu se paga al salario regular.
   No hay bonificación.

   Es un "cambio" de horas, no un aumento.
```

**P: ¿Qué pasa si tomo yukyu durante bonificación?**
```
R: Depende de la política:

   Opción A: Se incluye (común)
      └─ Yukyu = Salario regular + parte bonificación

   Opción B: Se excluye
      └─ Yukyu = Solo salario regular

   Verificar con RR.HH. tu política específica.
```

### Impacto en Nómina

**P: ¿Cuándo se aplica la deducción?**
```
R: Timeline:
   Day 1-5: TANTOSHA crea solicitud
   Day 2-5: KEITOSAN aprueba
   Day 5-15: Sistema calcula deducción
   Day 20-30: Se aplica en nómina del mes

   Ejemplo: Aprobación Nov 15 → Se deduce nómina Diciembre
```

**P: ¿Se refleja en recibo de pago?**
```
R: Sí. El recibo mostrará:

   INGRESOS:
   ├─ Salario base: ¥240,000
   ├─ Ajuste yukyu: -¥12,000 (deducción)
   └─ Total: ¥228,000

   Se especifica "Yukyu deduction" claramente.
```

**P: ¿Puedo reclamar si la deducción es incorrecta?**
```
R: Sí. Proceso:
   1. Notificar a Nómina inmediatamente
   2. Proporcionar detalles (fecha, días)
   3. Solicitar recalculo
   4. Esperar corrección en próxima nómina
   5. Si persiste, escalar a KEITOSAN
```

---

## Soporte Técnico

**P: ¿Qué pasa si el dashboard no carga?**
```
R: Soluciones:
   1. Presiona F5 (refresh)
   2. Limpia cache: Ctrl+Shift+Del (Chrome)
   3. Intenta en navegador diferente
   4. Contacta a IT: support@example.com
```

**P: ¿Por qué no veo mi solicitud en el dashboard?**
```
R: Razones posibles:
   ├─ Filtro activo (cambiar a "All")
   ├─ Solicitud no guardada (crear de nuevo)
   ├─ Permiso insuficiente (verificar rol)
   └─ Delay en sistema (esperar 5 minutos)
```

**P: ¿Qué navegadores son soportados?**
```
R: Soportados:
   ✓ Chrome 90+
   ✓ Firefox 88+
   ✓ Safari 14+
   ✓ Edge 90+

   No soportado:
   ✗ Internet Explorer (demasiado antiguo)
```

---

## Cumplimiento y Seguridad

**P: ¿Quién puede ver mis solicitudes de yukyu?**
```
R: Acceso basado en rol:

   TANTOSHA: Ve sus propias solicitudes + de su factory
   KEITOSAN: Ve todas las solicitudes
   ADMIN: Ve todo

   Empleado: Solo ve sus propias solicitudes (en portal)
```

**P: ¿Es confidencial mi información?**
```
R: Sí. GDPR/Privacy compliant:

   ├─ Solo personal autorizado ve datos
   ├─ Datos encriptados en tránsito
   ├─ Audited log de acceso
   └─ Retenidos 3 años (por ley)
```

**P: ¿Se puede auditar quién aprobó mi solicitud?**
```
R: Sí. Historial completo disponible:

   Detalles registrados:
   ├─ Quién creó (TANTOSHA)
   ├─ Quién aprobó (KEITOSAN)
   ├─ Fecha y hora exacta
   ├─ IP address (seguridad)
   └─ Cambios posteriores

   Requerimiento: Contactar a Compliance/IT
```

---

## Reportes y Documentación

**P: ¿Puedo descargar mi historial de yukyu?**
```
R: Sí. Opciones:

   1. Portal de Empleado → Reportes → Yukyu History
   2. PDF generado automáticamente
   3. Excel con formato
   4. Contactar a RR.HH. para reporte personalizado
```

**P: ¿Quién genera reportes de cumplimiento?**
```
R: Automáticamente por sistema:

   Frecuencia:
   ├─ Mensual: Dashboard automático
   ├─ Trimestral: Reporte email a KEITOSAN
   └─ Anual: Auditoría completa

   Manual: KEITOSAN puede exportar en cualquier momento
```

---

## 📞 Contacto y Escalamiento

### Urgencia: Baja

```
Asunto: Pregunta sobre política
Contactar: support@example.com
Respuesta: 24-48 horas
```

### Urgencia: Media

```
Asunto: Rechazo de solicitud
Contactar: KEITOSAN directo o supervisor
Respuesta: 2-3 horas
```

### Urgencia: Alta

```
Asunto: Violación de derechos legales
Contactar: SUPER_ADMIN o Legal
Respuesta: Inmediata
Escalamiento: Posible procesamiento legal
```

---

## 📚 Recursos Adicionales

- **GUÍA KEITOSAN:** docs/GUIA_KEITOSAN.md
- **GUÍA TANTOSHA:** docs/GUIA_TANTOSHA.md
- **REGULACIONES:** docs/REGULACIONES_LABORALES.md
- **DASHBOARD:** https://app.example.com/keiri/yukyu-dashboard
- **API DOCS:** https://app.example.com/api/docs

---

**Última actualización:** 12 de Noviembre 2025
**Versión:** 1.0
**Próxima revisión:** Marzo 2026
**Idiomas:** Español (principal) | Japonés (en preparación) | Inglés (en preparación)
