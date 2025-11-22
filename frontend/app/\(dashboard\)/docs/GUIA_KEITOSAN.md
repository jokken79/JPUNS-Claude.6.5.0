# 👨‍💼 Guía KEITOSAN - Rápido Acceso

> **Documento Completo**: Ver [`FASE5_USER_GUIDE_KEITOSAN.md`](../../../../../../FASE5_USER_GUIDE_KEITOSAN.md) en la raíz del proyecto

---

## 🎯 Tu Rol

**KEITOSAN** (経理管理 - Finance Manager)

Responsabilidades:
- ✓ Revisar y aprobar solicitudes de yukyu
- ✓ Rechazar solicitudes inválidas
- ✓ Monitorear conformidad legal (mínimo 5 días/año)
- ✓ Analizar impacto financiero de yukyus
- ✓ Generar reportes de nómina

---

## 🚀 Acceso Rápido

### Dashboard Principal
```
URL: http://localhost:3000/dashboard/keiri/yukyu-dashboard
Acceso: Solo KEITOSAN
Permisos: Lectura + Escritura (Aprobar/Rechazar)
```

### Métricas en Dashboard

| Métrica | Significado | Acción |
|---------|-------------|--------|
| Pérdida Estimada | Total ¥ deducido este mes | Monitorear presupuesto |
| Compliance % | Empleados con ≥5 días | Alertar si <100% |
| Aprobado Este Mes | Días aprobados (mes actual) | Tendencia |
| Deducción Este Mes | ¥ deducido (mes actual) | Nómina |

### Gráfico de Tendencias
- Últimos 6 meses
- Línea azul: Días aprobados
- Línea roja: Costo en ¥

---

## ✅ Procedimiento de Aprobación

### 1. Revisar Solicitud
```
Panel: Solicitudes Pendientes
Información visible:
├─ Nombre del empleado
├─ Número de días solicitados
├─ Período (fechas inicio-fin)
└─ Historial de yukyu del empleado
```

### 2. Validar
```
Checklist:
□ ¿Tiene días disponibles?
□ ¿No hay conflicto con otros períodos?
□ ¿Es date válido (no pasado)?
□ ¿La solicitud está completa?
```

### 3. Decidir

**APROBAR ✓**
```
Click: Botón ✓ Aprobar
Sistema:
├─ Deduce días automáticamente
├─ Calcula: días × 8 × ¥/hora
├─ Afecta nómina del mes
└─ Notifica empleado
```

**RECHAZAR ✗**
```
Click: Botón ✗ Rechazar
Sistema:
├─ Solicita motivo del rechazo
├─ Notifica empleado
└─ Permite crear nueva solicitud
```

---

## 💰 Fórmula de Deducción

```
DEDUCCIÓN = Días × Teiji (定時) × Tasa Horaria Base

Ejemplo:
├─ Empleado: Yamada Taro
├─ Días yukyu: 1 día
├─ Teiji: 8 horas/día (estándar)
├─ Tasa horaria: ¥1,500/hora
└─ Deducción: 1 × 8 × ¥1,500 = ¥12,000
```

**Variables:**
- **Teiji (定時)**: Horario estándar = 160 horas/mes ÷ 20 días = 8 horas/día
- **Tasa Horaria**: Varía por empleado (base + ajustes)
- **Precisión**: Usar Decimal (no float)

---

## 🚨 Alertas de Conformidad

### Sistema de Colores

| Color | Significado | Acción |
|-------|-------------|--------|
| 🟢 Verde | ≥5 días | CUMPLE ley |
| 🟡 Amarillo | 3-4 días | ⚠️ WARNING |
| 🔴 Rojo | <3 días | ❌ NO CUMPLE |

### Ley Laboral Japonesa

```
Mínimo: 5.0 días/año fiscal (OBLIGATORIO)
Año fiscal: Abril 1 - Marzo 31
Penalidad: ¥300,000-600,000 + responsabilidad criminal
```

### Acciones al Final de Año Fiscal

Si empleado tiene <5 días:
1. Identificar en reporte de compliance
2. Contactar empleado/manager
3. **Forzar yukyu** (función especial)
   - Registrar en sistema para auditoría
   - Documentar motivo

---

## 📊 Reportes Disponibles

```
Endpoint: GET /api/payroll/yukyu-summary
Frecuencia: Diario
Contiene:
├─ Total días aprobados (mes/año)
├─ Total impacto financiero (¥)
├─ Detalle por empleado
└─ Cumplimiento regulatorio
```

**Exportar Reporte:**
- Dashboard → "Descargar Reporte"
- Formatos: Excel, PDF, CSV

---

## 🐛 Troubleshooting

| Problema | Solución |
|----------|----------|
| No veo solicitudes pendientes | Refrescar (F5) o esperar 30s |
| Error al aprobar | Verificar que empleado tenga días disponibles |
| No puedo acceder al dashboard | Verificar que tu rol sea KEITOSAN |
| Sistema lento | Reducir período de búsqueda |
| Solicitud desapareció | Posible aprobación simultanea (refresh) |

---

## 📞 Soporte

| Tema | Contacto |
|------|----------|
| Problemas técnicos | admin@company.com |
| Preguntas de nómina | keiri@company.com |
| Conformidad laboral | legal@company.com |

---

## 📖 Documentación Completa

Para información más detallada, consulta:
**[`FASE5_USER_GUIDE_KEITOSAN.md`](../../../../../../FASE5_USER_GUIDE_KEITOSAN.md)**

Contiene:
- 1500+ líneas de guía completa
- Step-by-step con ejemplos reales
- FAQ comprensiva
- Workflows semanales/mensuales
- Integración con nómina

---

**Última Actualización**: 2025-11-22
**Estado**: ✅ FASE 5 & 6 COMPLETO
