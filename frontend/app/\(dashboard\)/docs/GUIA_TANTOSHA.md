# 📋 Guía TANTOSHA - Rápido Acceso

> **Documento Completo**: Ver [`FASE5_USER_GUIDE_TANTOSHA.md`](../../../../../../FASE5_USER_GUIDE_TANTOSHA.md) en la raíz del proyecto

---

## 🎯 Tu Rol

**TANTOSHA** (担当者 - HR Representative / Person in Charge)

Responsabilidades:
- ✓ Crear solicitudes de yukyu para empleados
- ✓ Asegurar que datos sean correctos
- ✓ Seguimiento de solicitudes en proceso
- ✓ Informar al empleado sobre estado
- ✓ Actualizar historial de empleados

---

## 🚀 Acceso Rápido

### Crear Solicitud
```
URL: http://localhost:3000/yukyu-requests/create
Acceso: Solo TANTOSHA
Permisos: Crear nuevas solicitudes
```

### Ver Solicitudes Creadas
```
URL: http://localhost:3000/yukyu-history
Acceso: Ver todas tus solicitudes
Filtros: Estado (PENDING, APPROVED, REJECTED)
```

---

## 📝 Formulario de Solicitud

### Campos Requeridos

#### 1. Empleado
```
Campo: Búsqueda (autocomplete)
├─ Buscar por nombre o ID (社員№)
├─ Sistema completa automáticamente
└─ Verificar: Empleado correcto
```

#### 2. Fábrica
```
Campo: Dropdown
├─ TANTOSHA solo ve fábricas asignadas
├─ Si no ves tu fábrica → Contactar admin
└─ Seleccionar fábrica correcta
```

#### 3. Período
```
Campos:
├─ Fecha inicio (YYYY-MM-DD)
├─ Fecha fin (YYYY-MM-DD)
├─ ⚠️ NO PUEDE SER EN EL PASADO
└─ No puede tener overlap con solicitud anterior
```

**Ejemplo:**
```
Inicio: 2025-10-18
Fin:    2025-10-20
Duración: 3 días
```

#### 4. Días Solicitados
```
Formato: Número decimal
├─ 1.0 = día completo (8 horas)
├─ 0.5 = medio día (4 horas)
├─ 1.5 = día + medio (12 horas)
└─ 0.25 = cuarto de día (2 horas)
```

**Ejemplos válidos:**
- 1.0 (día completo)
- 0.5 (medio día)
- 2.5 (2 días + medio)
- 3.0 (3 días)

#### 5. Notas (Opcional)
```
Campo: Texto libre
├─ Motivo de la solicitud
├─ Información adicional para KEITOSAN
└─ Ej: "Cliente importante en fin de semana"
```

---

## ✅ Validaciones Automáticas

Sistema valida automáticamente ANTES de enviar:

```
□ Fecha no puede ser en el pasado
□ Fecha inicio ≤ fecha fin
□ No hay overlap con solicitud anterior
□ TANTOSHA pertenece a esa fábrica
□ Empleado existe en sistema
□ Días es número válido (>0)
□ Período es racional (<30 días)
```

Si hay error:
- ❌ Se muestra mensaje claro
- 💡 Sistema sugiere corrección
- 🚫 Empleado NO puede enviar

---

## 🔄 Flujo de Aprobación

```
1. TANTOSHA
   └─ Crea solicitud con datos válidos

2. Sistema
   └─ Valida datos (validaciones FASE 3)

3. KEITOSAN
   └─ Recibe notificación en dashboard

4. KEITOSAN
   └─ Revisa en /dashboard/keiri/yukyu-dashboard

5. KEITOSAN
   └─ Aprueba ✓ o Rechaza ✗

6. TANTOSHA
   └─ Informar al empleado
```

**Tiempo típico**: 1-3 días

---

## 📊 Estados de Solicitud

| Estado | Significado | Acción |
|--------|-------------|--------|
| PENDING | En espera de revisión | Contactar KEITOSAN si >5 días |
| APPROVED | Aprobada ✓ | Informar al empleado |
| REJECTED | Rechazada ✗ | Seguimiento con KEITOSAN |

---

## ✨ Ejemplo de Solicitud Correcta

```
Empleado: Yamada Taro (ID: 123)
Fábrica: Yokohama Plant
Período: 2025-10-18 a 2025-10-19
Días: 1.0 (un día completo)
Notas: Cliente importante
Resultado: ✓ VÁLIDA
```

---

## ❌ Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| "Fecha en el pasado" | Intentaste fecha anterior a hoy | Usa fecha futura |
| "No perteneces a esa fábrica" | TANTOSHA asignado a otra fábrica | Contactar admin |
| "Ya existe solicitud" | Mismo empleado, período overlap | Usar período diferente |
| "Empleado no existe" | Búsqueda incorrecta | Buscar por nombre correcto |
| "Fecha fin antes que inicio" | Fin < Inicio | Invertir fechas |
| "Días no válido" | Número negativo o 0 | Ingresar >0 |

---

## 📈 Seguimiento de Solicitudes

### Ver Estado
```
URL: http://localhost:3000/yukyu-history
Opciones:
├─ Filtrar por estado (PENDING, APPROVED, REJECTED)
├─ Buscar por empleado
├─ Ordenar por fecha
└─ Ver detalles de solicitud
```

### Si Solicitud Está PENDING
```
Espera típica: 1-3 días
Si >7 días: Contactar a KEITOSAN

KEITOSAN contacto: keiri@company.com
```

### Si Solicitud Está REJECTED
```
1. Ver motivo del rechazo
2. Contactar a KEITOSAN para aclaración
3. Crear nueva solicitud con cambios
4. Informar al empleado
```

### Si Solicitud Está APPROVED
```
1. ✓ FELICIDADES
2. Informar al empleado:
   ├─ Solicitud aprobada
   ├─ Fechas finales
   └─ Deducción salarial
3. Actualizar registros internos
```

---

## 💡 Tips y Mejores Prácticas

### Validar Datos
```
Antes de crear solicitud:
□ Empleado nombre correcto? (Sin typos)
□ Fábrica es la correcta?
□ Fechas son futuras?
□ Días es número válido?
□ No hay overlap anterior?
```

### Comunicación
```
Con Empleado:
├─ Confirmar en persona
├─ Mostrar solicitud antes de enviar
└─ Informar estado después de aprobación

Con KEITOSAN:
├─ Follow-up si >5 días
├─ Proporcionar contexto si es especial
└─ Respetar sus decisiones
```

### Documentación
```
Mantener registro:
├─ Solicitudes creadas
├─ Aprobaciones recibidas
├─ Rechazos y motivos
└─ Comunicación con empleados
```

---

## 📞 Soporte

| Tema | Contacto |
|------|----------|
| Acceso a fábrica | admin@company.com |
| Preguntas de HR | hr@company.com |
| Solicitud rechazada | keiri@company.com |

---

## ❓ FAQ Rápido

**P: ¿Puedo crear solicitud para empleado de otra fábrica?**
R: No. Sistema solo permite fábricas asignadas a ti.

**P: ¿Qué hago si la fecha está en el pasado?**
R: Usa una fecha futura. Yukyus solo pueden ser prospectivos.

**P: ¿Puedo crear solicitud si hay overlap?**
R: No. Sistema rechazará si hay solicitud anterior en ese período.

**P: ¿Cuánto tiempo demora la aprobación?**
R: Típicamente 1-3 días. Si >7 días, contacta a KEITOSAN.

**P: ¿Puedo modificar solicitud después de enviar?**
R: No. Debes rechazarla y crear una nueva.

**P: ¿Puedo tomar media día?**
R: Sí, ingresa 0.5 en lugar de 1.0.

---

## 📖 Documentación Completa

Para información más detallada, consulta:
**[`FASE5_USER_GUIDE_TANTOSHA.md`](../../../../../../FASE5_USER_GUIDE_TANTOSHA.md)**

Contiene:
- 700+ líneas de guía completa
- Step-by-step con ejemplos
- Workflows especiales
- Troubleshooting
- Escalación de problemas

---

**Última Actualización**: 2025-11-22
**Estado**: ✅ FASE 5 & 6 COMPLETO
