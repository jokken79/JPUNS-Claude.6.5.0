# CHECKLIST DE IMPLEMENTACIÓN - SISTEMA 社宅

## BACKEND (5 días)

### Migración Alembic
- [ ] Crear: backend/alembic/versions/add_is_corporate_housing_to_employee.py
- [ ] Aplicar: alembic upgrade head
- [ ] Verificar: Campos en BD
- [ ] Crear: Índices

### Modelo Employee
- [ ] Modificar: backend/app/models/models.py
- [ ] Agregar: apartment_id
- [ ] Agregar: apartment_start_date
- [ ] Agregar: apartment_move_out_date
- [ ] Agregar: apartment_rent
- [ ] Agregar: is_corporate_housing
- [ ] Agregar: housing_subsidy
- [ ] Verificar: Relaciones

### ApartmentService
- [ ] Crear: backend/app/services/apartment_service.py
- [ ] Implementar: create_apartment()
- [ ] Implementar: get_apartment()
- [ ] Implementar: get_apartments()
- [ ] Implementar: update_apartment()
- [ ] Implementar: delete_apartment()
- [ ] Implementar: assign_employee() [CON VALIDACIÓN CAPACIDAD]
- [ ] Implementar: unassign_employee()
- [ ] Implementar: get_apartment_stats()
- [ ] Test: 100% coverage

### API Endpoints
- [ ] Modificar: backend/app/api/apartments.py
- [ ] Agregar: Dependency injection
- [ ] Agregar: GET /apartments/stats
- [ ] Agregar: POST /apartments/{id}/assign-employee
- [ ] Agregar: DELETE /apartments/unassign-employee/{id}
- [ ] Test: 100% endpoints

### Integración Payroll
- [ ] Modificar: backend/app/services/payroll_service.py
- [ ] Agregar: Deducción apartment_rent
- [ ] Agregar: Subsidio housing (negativo)
- [ ] Agregar: housing_info en response
- [ ] Test: Integración completa

## FRONTEND (4 días)

### Páginas
- [ ] Crear: frontend/app/(dashboard)/apartments/[id]/page.tsx
- [ ] Crear: frontend/app/(dashboard)/apartments/new/page.tsx
- [ ] Crear: frontend/app/(dashboard)/apartments/[id]/edit/page.tsx
- [ ] Modificar: frontend/app/(dashboard)/apartments/page.tsx
- [ ] Modificar: frontend/app/(dashboard)/employees/[id]/page.tsx
- [ ] Modificar: frontend/app/(dashboard)/page.tsx

### Componentes
- [ ] Crear: frontend/components/apartments/assignment-panel.tsx
- [ ] Crear: frontend/components/apartments/apartment-stats.tsx
- [ ] Crear: frontend/components/apartments/occupancy-chart.tsx

### Hooks
- [ ] Crear: frontend/hooks/useHousingNotifications.ts

### Internacionalización
- [ ] Crear: frontend/locales/ja/apartments.json
- [ ] Crear: frontend/locales/en/apartments.json

### Testing
- [ ] Crear: frontend/tests/e2e/apartments.spec.ts
- [ ] Test: 70% coverage

## BASE DE DATOS (2 días)

### Scripts
- [ ] Crear: backend/scripts/migrate_housing.py
- [ ] Crear: backend/scripts/migrate_existing_housing_data.py
- [ ] Crear: backend/scripts/validate_housing_data.py
- [ ] Crear: backend/scripts/create_housing_indexes.sql

### Ejecución
- [ ] Ejecutar: migrate_housing.py
- [ ] Ejecutar: migrate_existing_housing_data.py
- [ ] Ejecutar: create_housing_indexes.sql
- [ ] Ejecutar: validate_housing_data.py
- [ ] Verificar: 0 errores

## TESTING (3 días)

### Backend Tests
- [ ] Crear: backend/tests/test_apartment_service.py
- [ ] Crear: backend/tests/test_apartment_api.py
- [ ] Crear: backend/tests/test_payroll_housing_integration.py
- [ ] Ejecutar: pytest --cov=app
- [ ] Verificar: 80% coverage BE

### Frontend Tests
- [ ] Crear: frontend/tests/e2e/apartments.spec.ts
- [ ] Ejecutar: npm test
- [ ] Verificar: 70% coverage FE

## DOCUMENTACIÓN (1 día)

### Docs
- [ ] Crear: docs/api/apartments-api.md
- [ ] Crear: docs/user-guide/housing-management-guide.md
- [ ] Crear: docs/technical/housing-architecture.md
- [ ] Actualizar: CHANGELOG

## DEPLOYMENT

### Pre-Deploy
- [ ] Backup BD
- [ ] Tests pasando
- [ ] Coverage OK
- [ ] Docs completas
- [ ] Training done

### Deploy
- [ ] Ejecutar migración
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Verificar health

### Post-Deploy
- [ ] Smoke tests
- [ ] Monitor métricas
- [ ] User feedback

TOTAL CHECKS: ~85 tareas
ESTADO: PENDIENTE
