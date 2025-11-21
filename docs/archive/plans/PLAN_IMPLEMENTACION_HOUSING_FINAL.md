# PLAN DE IMPLEMENTACIÓN COMPLETO - SISTEMA DE 社宅
## UNS-ClaudeJP 5.4 - Software Engineering Expert

RESUMEN EJECUTIVO:
- Objetivo: Completar sistema de vivienda corporativa (社宅)
- Estado: Modelo OK, API OK, Frontend OK (parcial)
- Pendiente: Servicios, campo is_corporate_housing, payroll, tests
- Cronograma: 15 días (120 horas)
- Fecha: 10-28 Nov 2025

BACKEND (5 días):
1. Migración Alembic (is_corporate_housing, housing_subsidy)
2. Actualizar modelo Employee
3. Crear ApartmentService (CRUD + assign/unassign)
4. Actualizar API endpoints
5. Integración Payroll (deducción automática)

FRONTEND (4 días):
1. Página detalle apartamento
2. Componente AssignmentPanel
3. Páginas crear/editar
4. Integración employee
5. Dashboard widgets
6. Internacionalización (JA/EN)

BASE DATOS (2 días):
1. Ejecutar migración
2. Migrar datos existentes
3. Crear índices
4. Validar integridad

TESTING (3 días):
1. Tests unitarios backend (100% ApartmentService)
2. Tests integración API (100% endpoints)
3. Tests E2E frontend (70% coverage)
4. Tests payroll

DOCUMENTACIÓN (1 día):
1. API docs
2. User guide
3. Technical docs

ARCHIVOS CREAR:
Backend: apartment_service.py, tests, scripts migración
Frontend: páginas detalle, componentes, i18n
Docs: api, user, technical

RIESGOS:
- Migración falla → Backup + rollback
- Datos inconsistentes → Validación
- Performance → Índices

DEPLOYMENT:
1. Backup BD
2. Migración
3. Deploy backend
4. Deploy frontend
5. Verificar

MÉTRICAS:
- Uptime: 99.9%
- Response: <500ms
- Coverage: 80% BE, 70% FE
- Adoption: 90% usuarios

RESULTADO: Sistema production-ready 28 Nov 2025

Preparado por: Software Engineering Expert
Fecha: 10 Nov 2025
