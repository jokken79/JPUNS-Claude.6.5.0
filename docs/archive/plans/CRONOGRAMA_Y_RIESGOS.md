# CRONOGRAMA Y MATRIZ DE RIESGOS - SISTEMA 社宅

## CRONOGRAMA DETALLADO (15 días)

### SEMANA 1 (Días 1-5): BACKEND

Día 1: Migración y Modelo
- [ ] Crear migración Alembic
- [ ] Aplicar migración
- [ ] Actualizar modelo Employee
- [ ] Verificar BD

Día 2: ApartmentService
- [ ] Crear servicio completo
- [ ] Implementar CRUD
- [ ] Implementar assign/unassign
- [ ] Tests unitarios básicos

Día 3: API Endpoints
- [ ] Modificar API existente
- [ ] Agregar dependency injection
- [ ] Crear endpoints stats/assign/unassign
- [ ] Tests integración

Día 4: Integración Payroll
- [ ] Modificar PayrollService
- [ ] Calcular deducciones
- [ ] Aplicar subsidios
- [ ] Tests payroll

Día 5: Validación Backend
- [ ] Tests completos
- [ ] Coverage 80%
- [ ] Validación API
- [ ] Sign-off backend

### SEMANA 2 (Días 6-9): FRONTEND

Día 6: Páginas Principales
- [ ] Página detalle apartamento
- [ ] Formulario asignación
- [ ] Lista empleados

Día 7: Componentes y CRUD
- [ ] Componente AssignmentPanel
- [ ] Páginas crear/editar
- [ ] Validaciones

Día 8: Integración y Dashboard
- [ ] Integración employee
- [ ] Dashboard widgets
- [ ] Tests E2E básicos

Día 9: Internacionalización
- [ ] Archivos i18n (JA/EN)
- [ ] Traducciones
- [ ] Tests localización

### SEMANA 3 (Días 10-12): TESTING

Día 10: Base de Datos
- [ ] Migrar datos existentes
- [ ] Crear índices
- [ ] Validar integridad
- [ ] Scripts automáticos

Día 11: Tests Completos
- [ ] Tests E2E completos
- [ ] Tests integración
- [ ] Coverage frontend

Día 12: Validación Final
- [ ] Coverage >80% BE, >70% FE
- [ ] Tests de performance
- [ ] Sign-off QA

### SEMANA 3 (Día 13-14): DOCUMENTACIÓN Y DEPLOYMENT

Día 13: Documentación
- [ ] API docs
- [ ] User guide
- [ ] Technical docs
- [ ] Changelog

Día 14: Deployment
- [ ] Backup BD
- [ ] Deploy staging
- [ ] Smoke tests
- [ ] Performance tests

### SEMANA 3 (Día 15): PRODUCCIÓN

Día 15: Go-Live
- [ ] Deploy producción
- [ ] Verificación final
- [ ] Training usuarios
- [ ] Monitoreo
- [ ] Sign-off final

---

## MATRIZ DE RIESGOS

### RIESGOS TÉCNICOS

| ID | Riesgo | Prob. | Impacto | Mitigación | Plan Contingencia |
|----|--------|-------|---------|------------|-------------------|
| T1 | Migración BD falla | Media | Alto | Backup completo | alembic downgrade -1 |
| T2 | Datos inconsistentes | Media | Alto | Validación exhaustiva | Script limpieza |
| T3 | Performance degrade | Baja | Medio | Índices + paginación | Cache Redis |
| T4 | Tests fallan | Media | Medio | Coverage progressivo | Priorizar críticos |
| T5 | Integración payroll rompe | Baja | Alto | Test específico | Feature flag disable |

### RIESGOS DE NEGOCIO

| ID | Riesgo | Prob. | Impacto | Mitigación | Plan Contingencia |
|----|--------|-------|---------|------------|-------------------|
| B1 | Resistencia usuarios | Media | Medio | Training + docs | Champions departamentales |
| B2 | Datos incorrectos | Alta | Alto | Validación UI/BD | Reportes calidad |
| B3 | Capacidad insuficiente | Media | Medio | Monitoreo proactivo | Política waitlist |
| B4 | Proceso no seguido | Alta | Alto | Workflow guiado | Auditoría periódica |

### RIESGOS DE PROYECTO

| ID | Riesgo | Prob. | Impacto | Mitigación | Plan Contingencia |
|----|--------|-------|---------|------------|-------------------|
| P1 | Retraso cronograma | Media | Alto | Buffer 20% | Reducir scope |
| P2 | Recursos insuficientes | Baja | Alto | Plan detallado | Extender timeline |
| P3 | Cambios de scope | Alta | Medio | Sign-off reqs | Documentar v2 |
| P4 | Dependencias externas | Media | Medio | No dependencies críticas | Stubs desarrollo |

---

## PLANES DE CONTINGENCIA DETALLADOS

### T1: Migración BD Falla

**Síntomas:**
- Error al ejecutar alembic upgrade
- Campos no se crean
- Índices fallan

**Acciones:**
1. DETENER inmediatamente
2. `alembic downgrade -1`
3. Verificar integridad: `psql -c "SELECT * FROM employees LIMIT 1;"`
4. Si datos corruptos: `cat backup.sql | psql`
5. Analizar logs: `alembic current && alembic history`
6. Corregir migración
7. Re-ejecutar: `alembic upgrade head`
8. Validar: `python scripts/validate_housing_data.py`

**Tiempo estimado:** 2-4 horas
**Responsable:** Backend Lead

### T2: Datos Inconsistentes

**Síntomas:**
- Validación falla
- Empleados con datos erróneos
- Violación constraints

**Acciones:**
1. Ejecutar: `python scripts/validate_housing_data.py`
2. Identificar registros problemáticos
3. Generar reporte: `errors.log`
4. Ejecutar corrección automática
5. Verificar consistencia
6. Si falla: Corrección manual
7. Sign-off QA

**Tiempo estimado:** 4-6 horas
**Responsable:** DB Admin

### T3: Performance Degrade

**Síntomas:**
- Queries > 1 segundo
- CPU > 80%
- Timeouts

**Acciones:**
1. Profiling: `EXPLAIN ANALYZE query`
2. Identificar bottleneck
3. Agregar índice: `CREATE INDEX ...`
4. Optimizar query
5. Cache Redis: `redis-cli set key value`
6. Test performance
7. Deploy optimizado

**Tiempo estimado:** 1-2 horas
**Responsable:** Performance Engineer

### T4: Tests Fallan

**Síntomas:**
- CI pipeline rojo
- Coverage < objetivo
- Tests flaky

**Acciones:**
1. Ejecutar: `pytest -v --tb=short`
2. Identificar tests fallidos
3. Analizar logs
4. Priorizar tests críticos
5. Arreglar bugs
6. Re-ejecutar full suite
7. Coverage report

**Tiempo estimado:** 3-4 horas
**Responsable:** QA Lead

### B1: Resistencia Usuarios

**Síntomas:**
- Baja adopción (<50%)
- Pocas cuentas activas
- Feedback negativo

**Acciones:**
1. Survey satisfacción
2. Identificar pain points
3. Sesiones Q&A adicionales
4. Documentación mejorada
5. Champions en cada dept
6. Incentivos adopción

**Tiempo estimado:** 1-2 semanas
**Responsable:** Product Owner

---

## MONITOREO Y ALERTAS

### Métricas Clave
- Tiempo respuesta API: <500ms
- Error rate: <0.1%
- Uptime: >99.9%
- Tests passing: 100%
- Coverage: BE>80%, FE>70%

### Alertas Configurar
- Ocupación apartamentos >90%
- Apartamentos llenos
- Errores asignación
- Migración fallida
- Performance degrade

### Health Checks
- API health: `/api/health`
- DB connectivity: `pg_isready`
- Frontend: HTTP 200
- Tests: CI passing
- Coverage: Report generado

---

## CRITERIOS GO/NO-GO

### GO (Proceder con deploy)
- [ ] Tests 100% passing
- [ ] Coverage >80% BE, >70% FE
- [ ] Validación datos: 0 errores
- [ ] Performance tests: OK
- [ ] Security scan: Passed
- [ ] Code review: Approved
- [ ] Docs: 100% complete
- [ ] Training: >80% users trained
- [ ] Stakeholder sign-off

### NO-GO (No deployar)
- [ ] Tests fallando
- [ ] Coverage <objetivo
- [ ] Errores de validación
- [ ] Performance unacceptable
- [ ] Vulnerabilidades seguridad
- [ ] Docs incompletas
- [ ] Resistencia usuarios
- [ ] Bugs críticos
- [ ] Rollback plan no probado

---

## COMUNICACIÓN

### Stakeholders
- Daily standup (15 min)
- Weekly review (1 hora)
- Risk register actualizado
- Escalation path definido

### Usuarios
- Email announcement
- Training sessions
- Documentation portal
- Support channel

### Team
- Slack channel #housing-project
- Jira board tracking
- GitHub project
- Confluence wiki

