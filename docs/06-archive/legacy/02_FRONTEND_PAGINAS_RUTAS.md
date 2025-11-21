# 2. PÁGINAS Y RUTAS - FRONTEND (75 PÁGINAS TOTALES)

## Distribución por Módulo Funcional

### 1. MÓDULO CANDIDATES (Candidatos / 履歴書) - 7 páginas

| Ruta | Descripción |
|------|-------------|
| `/candidates` | Listado de candidatos (grid/tabla) |
| `/candidates/new` | Crear nuevo candidato |
| `/candidates/rirekisho` | Gestión de 履歴書 (resúmenes) |
| `/candidates/[id]` | Detalle de candidato |
| `/candidates/[id]/edit` | Editar candidato |
| `/candidates/[id]/print` | Imprimir 履歴書 |

**Funcionalidades:** CRUD, OCR (Azure/EasyOCR/Tesseract), extracción de fotos, búsqueda, filtrado, impresión, validación 50+ campos.

---

### 2. MÓDULO EMPLOYEES (Empleados / 派遣社員) - 5 páginas

| Ruta | Descripción |
|------|-------------|
| `/employees` | Listado de empleados activos |
| `/employees/new` | Crear empleado |
| `/employees/excel-view` | Vista estilo Excel para edición masiva |
| `/employees/[id]` | Detalle de empleado |
| `/employees/[id]/edit` | Editar empleado |

**Funcionalidades:** CRUD, asignación a fábricas, historial, sincronización candidato-empleado, ciclo de vida.

---

### 3. MÓDULO FACTORIES (Fábricas / 派遣先) - 4 páginas

| Ruta | Descripción |
|------|-------------|
| `/factories` | Listado de fábricas/clientes |
| `/factories/new` | Crear fábrica |
| `/factories/[factory_id]` | Detalle de fábrica |
| `/factories/[factory_id]/config` | Configuración de fábrica |

**Funcionalidades:** Directorio maestro, cascada empresa → planta → sitios, factores de costo, contactos, reportes.

---

### 4. MÓDULO APARTMENTS (Apartamentos / 社宅) - 6 páginas base

| Ruta | Descripción |
|------|-------------|
| `/apartments` | Listado de apartamentos |
| `/apartments/create` | Crear apartamento |
| `/apartments/search` | Búsqueda avanzada |
| `/apartments/[id]` | Detalle de apartamento |
| `/apartments/[id]/edit` | Editar apartamento |
| `/apartments/[id]/assign` | Asignar empleado |

**Funcionalidades:** CRUD, búsqueda avanzada, asignaciones, cálculos de alquiler, reportes.

---

### 5. SUBMÓDULO APARTMENT ASSIGNMENTS (Asignaciones) - 5 páginas

| Ruta | Descripción |
|------|-------------|
| `/apartment-assignments` | Listado de asignaciones |
| `/apartment-assignments/create` | Nueva asignación |
| `/apartment-assignments/transfer` | Transferir residente |
| `/apartment-assignments/[id]` | Detalle de asignación |
| `/apartment-assignments/[id]/end` | Finalizar asignación |

---

### 6. SUBMÓDULO APARTMENT CALCULATIONS (Cálculos) - 3 páginas

| Ruta | Descripción |
|------|-------------|
| `/apartment-calculations` | Cálculos generales |
| `/apartment-calculations/prorated` | Cálculos prorrateados |
| `/apartment-calculations/total` | Cálculos totales |

---

### 7. SUBMÓDULO APARTMENT REPORTS (Reportes) - 5 páginas

| Ruta | Descripción |
|------|-------------|
| `/apartment-reports` | Centro de reportes |
| `/apartment-reports/occupancy` | Reporte de ocupación |
| `/apartment-reports/arrears` | Reporte de atrasos |
| `/apartment-reports/maintenance` | Reporte de mantenimiento |
| `/apartment-reports/costs` | Análisis de costos |

**Total Apartments: 19 páginas**

---

### 8. MÓDULO PAYROLL (Nómina / 給与) - 7 páginas

| Ruta | Descripción |
|------|-------------|
| `/payroll` | Resumen y listado |
| `/payroll/create` | Crear cálculo de nómina |
| `/payroll/calculate` | Calculadora interactiva |
| `/payroll/settings` | Configuración de nómina |
| `/payroll/timer-cards` | Control de horas integrado |
| `/payroll/yukyu-summary` | Resumen de yukyus |
| `/payroll/[id]` | Detalle de cálculo |

**Funcionalidades:** Cálculos automáticos, integración timer-cards, yukyus, reportes, exportación Excel.

---

### 9. MÓDULO SALARY (Salarios) - 3 páginas

| Ruta | Descripción |
|------|-------------|
| `/salary` | Listado de salarios |
| `/salary/[id]` | Detalle de salario |
| `/salary/reports` | Reportes de salarios |

---

### 10. MÓDULO TIMERCARDS (Control Horario / タイムカード) - 2 páginas

| Ruta | Descripción |
|------|-------------|
| `/timercards` | Listado de control horario |
| `/timercards/upload` | Cargar/importar datos |

**Funcionalidades:** Importación masiva, validación de horas, integración con nómina.

---

### 11. MÓDULO YUKYU (有給 - Vacaciones Pagadas) - 6 páginas

| Ruta | Descripción |
|------|-------------|
| `/yukyu-requests/create` | Solicitar vacaciones |
| `/yukyu-requests` | Listado de solicitudes |
| `/yukyu` | Resumen de yukyus |
| `/yukyu-history` | Historial LIFO |
| `/yukyu-reports` | Reportes de uso |
| `/keiri/yukyu-dashboard` | Dashboard contable |

**Funcionalidades:** Solicitudes, aprobaciones, lógica LIFO, reportes, integración nómina.

---

### 12. MÓDULO REQUESTS (Solicitudes / 申請) - 2 páginas

| Ruta | Descripción |
|------|-------------|
| `/requests` | Listado de solicitudes |
| `/requests/[id]` | Detalle de solicitud |

---

### 13. MÓDULO REPORTS (Reportes) - 1 página

| Ruta | Descripción |
|------|-------------|
| `/reports` | Centro de reportes |

**Funcionalidades:** Acceso a 10+ tipos de reportes, exportación, filtrado avanzado.

---

### 14. MÓDULO MONITORING (Observabilidad) - 3 páginas

| Ruta | Descripción |
|------|-------------|
| `/monitoring` | Dashboard de monitoreo |
| `/monitoring/health` | Estado del sistema |
| `/monitoring/performance` | Métricas de performance |

**Funcionalidades:** Métricas en tiempo real, health checks, traces distribuidas, alertas.

---

### 15. MÓDULO ADMIN - 3 páginas

| Ruta | Descripción |
|------|-------------|
| `/admin/control-panel` | Panel de control |
| `/admin/audit-logs` | Logs de auditoría |
| `/admin/yukyu-management` | Administración de yukyus |

---

### 16. MÓDULO SETTINGS (Configuración) - 1 página

| Ruta | Descripción |
|------|-------------|
| `/settings/appearance` | Apariencia y temas |

---

### 17. MÓDULO THEMES (Sistema de Temas) - 2 páginas

| Ruta | Descripción |
|------|-------------|
| `/themes` | Galería de 17 temas |
| `/themes/customizer` | Personalizador visual |

**Funcionalidades:** Selector de temas, editor visual, generador de paletas, validador WCAG, export/import.

---

### 18. MÓDULO UTILITIES (Otros) - 10 páginas

| Ruta | Descripción |
|------|-------------|
| `/dashboard` | Panel principal/home |
| `/design-system` | Guía de componentes |
| `/examples/forms` | Ejemplos de formularios |
| `/construction` | Página en construcción |
| `/additional-charges` | Cargos adicionales |
| `/rent-deductions/[year]/[month]` | Deducciones de alquiler |
| `/support` | Centro de soporte |
| `/help` | Centro de ayuda/FAQ |
| `/privacy` | Política de privacidad |
| `/terms` | Términos de servicio |

---

### 19. RUTAS NO-DASHBOARD - 3 páginas

| Ruta | Descripción |
|------|-------------|
| `/login` | Página de autenticación |
| `/profile` | Perfil de usuario |
| `/database-management` | Gestión de base de datos |

---

## RESUMEN DE RUTAS

```
TOTAL PÁGINAS: 75

Desglose:
- Candidates: 6
- Employees: 5
- Factories: 4
- Apartments (incl. Assignments + Calculations + Reports): 19
- Payroll: 7
- Salary: 3
- TimerCards: 2
- Yukyu: 6
- Requests: 2
- Reports: 1
- Monitoring: 3
- Admin: 3
- Settings: 1
- Themes: 2
- Utilities: 10
- Non-Dashboard: 3

MÓDULOS FUNCIONALES: 14
- Personnel Management (Candidates, Employees)
- Factory Management (Factories)
- Housing Management (Apartments, Assignments, Calculations, Reports)
- Payroll (Payroll, Salary, TimerCards)
- Leave Management (Yukyu, History, Reports)
- Administrative (Admin, Requests, Monitoring)
- Configuration (Settings, Themes)
- Other (Reports, Support, Help, etc)
```

