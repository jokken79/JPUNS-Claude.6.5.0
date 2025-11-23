# 🤝 PROTOCOLO DE COORDINACIÓN DE AGENTES
## UNS-ClaudeJP 6.0.0

---

## 📋 ÍNDICE

1. [Estructura Jerárquica](#estructura-jerárquica)
2. [Protocolos de Comunicación](#protocolos-de-comunicación)
3. [Handoff Procedures](#handoff-procedures)
4. [Resolución de Conflictos](#resolución-de-conflictos)
5. [Health Checks](#health-checks)
6. [Escalation Procedures](#escalation-procedures)
7. [Ejemplos Reales](#ejemplos-reales)

---

## 🏛️ ESTRUCTURA JERÁRQUICA

```
┌─────────────────────────────────────────────────────┐
│         ORCHESTRATOR (You - Master)                 │
│  Responsable: Visión completa, coordinación         │
│  Context: 200k tokens                               │
│  Duración: Toda la sesión                           │
└──────────────────────────────────────────────────────┘
    │
    ├─→ Tier 1: DOMAIN LEADS (5 especialistas)
    │   ├─ Frontend Lead (react19-component-architect)
    │   ├─ Backend Lead (fastapi-router-architect)
    │   ├─ Database Lead (postgresql-query-optimizer)
    │   ├─ DevOps Lead (github-actions-pipeline-builder)
    │   └─ Security Lead (security-vulnerability-hunter)
    │
    ├─→ Tier 2: SPECIALISTS (35 especialistas)
    │   ├─ Frontend Team (10 agents)
    │   ├─ Backend Team (13 agents)
    │   ├─ Database Team (3 agents)
    │   ├─ DevOps Team (3 agents)
    │   ├─ Security Team (3 agents)
    │   ├─ Performance Team (3 agents)
    │   └─ Business Logic Team (5 agents)
    │
    └─→ Tier 3: SUPPORT (auxiliary)
        ├─ Documentation Team (3 agents)
        └─ Testing Team (3 agents)
```

---

## 🔄 PROTOCOLOS DE COMUNICACIÓN

### 1. INICIACIÓN DE TAREA

**Flujo de comunicación**:

```
ORCHESTRATOR → DOMAIN_LEAD → SPECIALIST
```

**Formato de solicitud**:

```
FROM: orchestrator
TO: [agent-name]
PRIORITY: [CRITICAL/HIGH/MEDIUM/LOW]
TASK_ID: [auto-generated]
CONTEXT:
  - Feature: [descripción]
  - Dependencias: [lista de agentes que deben completar primero]
  - Recursos: [archivos, documentación, research]
  - Deadline: [opcional]
REQUIREMENTS:
  - [Req 1]
  - [Req 2]
  - [Req 3]
SUCCESS_CRITERIA:
  - [Métrica 1]
  - [Métrica 2]
BLOCKERS: [None/Descripción]
```

**Ejemplo**:

```
FROM: orchestrator
TO: react19-component-architect
PRIORITY: CRITICAL
TASK_ID: FEAT_2025_111_SALARY_FORM
CONTEXT:
  - Feature: Crear componente SalaryForm para interfaz de nómina
  - Dependencias: react-hook-form-validator (debe tener schemas)
  - Recursos: /frontend/types/salary.ts, /docs/payroll-requirements.md
  - Deadline: 2025-11-25
REQUIREMENTS:
  - Componente reutilizable SalaryForm
  - TypeScript strict mode
  - Accessibility WCAG AA
  - 95%+ test coverage
  - Documentación con Storybook
SUCCESS_CRITERIA:
  - All unit tests pass (vitest)
  - Lighthouse accessibility > 95
  - TypeScript strict compilation
  - Manual testing with screen reader
BLOCKERS: None
```

---

### 2. STATUS REPORTING

**Frecuencia**: Después de cada subtarea completada

**Formato de respuesta del agente**:

```
FROM: [agent-name]
TO: orchestrator
TASK_ID: [original-task-id]
STATUS: [COMPLETED/IN_PROGRESS/BLOCKED/FAILED]
PROGRESS: [percentage]
SUMMARY:
  - Completado: [list]
  - En progreso: [list]
  - Pendiente: [list]
ARTIFACTS:
  - Files modified: [list]
  - New files: [list]
  - Deleted files: [list]
METRICS:
  - Líneas añadidas: [#]
  - Líneas modificadas: [#]
  - Tests passing: [%]
BLOCKERS: [None/Descripción]
HANDOFF_TO: [siguiente agente, si aplica]
RECOMMENDED_NEXT_STEPS: [opciones]
```

**Ejemplo de completado**:

```
FROM: react19-component-architect
TO: orchestrator
TASK_ID: FEAT_2025_111_SALARY_FORM
STATUS: COMPLETED
PROGRESS: 100%
SUMMARY:
  - Completado:
    ✓ Componente SalaryForm implementado
    ✓ Validación con Zod integrada
    ✓ Tests con vitest (24 tests)
    ✓ Storybook stories creadas
    ✓ Accessibility audit passed
  - En progreso: None
  - Pendiente: None
ARTIFACTS:
  - Modified: /frontend/components/salary/SalaryForm.tsx
  - New: /frontend/components/salary/SalaryForm.stories.tsx
  - New: /frontend/components/salary/SalaryForm.test.tsx
METRICS:
  - Lines added: 450
  - Lines modified: 0
  - Tests passing: 24/24 (100%)
  - Lighthouse accessibility: 98/100
  - TypeScript strict: ✓
BLOCKERS: None
HANDOFF_TO: zustand-state-maestro (integración con salary-store)
RECOMMENDED_NEXT_STEPS:
  1. zustand-state-maestro implementa integración
  2. playwright-e2e-engineer crea tests E2E
  3. react-query-data-fetcher integra con API
```

---

### 3. ESCALACIÓN Y PROBLEMAS

**Cuando un agente está bloqueado**:

```
FROM: [agent-name]
TO: orchestrator
ESCALATION_LEVEL: [1/2/3]
ISSUE: [descripción]
CONTEXT: [detalles técnicos]
ATTEMPTED_SOLUTIONS: [lista]
NEEDS:
  - [Qué necesita para desbloquearse]
IMPACT: [si no se resuelve, qué se afecta]
TIMELINE: [cuánto tiempo puede esperar]
```

**Ejemplo de escalación Level 2**:

```
FROM: payroll-processing-engine
TO: orchestrator
ESCALATION_LEVEL: 2
ISSUE: Conflicto entre tax rate calculation y new regulation
CONTEXT: Regulación fiscal cambió el 2025-11-20
  - Nueva tasa de impuesto: 15.2% (era 14.5%)
  - Aplica retroactivamente a 2025-11-01
  - Afecta cálculos de nómina del mes
ATTEMPTED_SOLUTIONS:
  ✗ Actualizar constante (requiere validación legal)
  ✗ Crear migración de datos (sin decisión del equipo)
NEEDS:
  - Confirmación legal de nueva tasa
  - Decision: ¿aplicar retroactivamente?
  - Validación de datos históricos
IMPACT: No puedo completar nómina de noviembre sin esto
TIMELINE: Máximo 4 horas
```

---

## 🤝 HANDOFF PROCEDURES

### Paso 1: Preparación del Handoff

El agente que termina prepara el siguiente:

```
HANDOFF_FROM: Agent A
HANDOFF_TO: Agent B

DELIVERABLES:
  ├─ Code:
  │  ├─ Archivos modificados
  │  ├─ Archivos nuevos
  │  └─ Archivos borrados
  ├─ Documentation:
  │  ├─ Inline comments
  │  ├─ Design patterns used
  │  └─ Known limitations
  ├─ Tests:
  │  ├─ Tests que pasan
  │  ├─ Coverage report
  │  └─ Manual test results
  └─ Context:
     ├─ Decisiones técnicas
     ├─ Trade-offs considerados
     └─ Dependencias

ASSUMPTIONS:
  - [Asunción 1]
  - [Asunción 2]

REQUIREMENTS_FOR_NEXT:
  - [Requisito 1]
  - [Requisito 2]

TESTING_VALIDATION:
  - [¿Cómo validar que esto está correcto?]

ROLLBACK_PROCEDURE:
  - [Si algo falla, cómo revertir?]
```

### Paso 2: Verificación del Handoff

El agente siguiente verifica:

```
HANDOFF_VERIFICATION:

✓ Code Review
  - Lógica es correcta
  - Naming es claro
  - Error handling está presente

✓ Tests
  - Todos los tests pasan
  - Coverage >= target
  - Tests son significativos

✓ Documentation
  - README actualizado
  - Inline comments claros
  - API documented

✓ Integration
  - No rompe interfaces existentes
  - Compatible con siguientes pasos
  - Performance acceptable

ISSUES_FOUND: [None/List]
READY_FOR_NEXT_STAGE: [Yes/No]
```

---

## 🔄 RESOLUCIÓN DE CONFLICTOS

### Escenario 1: Conflicto de Arquitectura

```
AGENT_A (zustand-state-maestro) propone:
  "Usar centralized store para todos los datos"

AGENT_B (react-query-data-fetcher) propone:
  "Usar React Query para server state"

ORCHESTRATOR RESOLVES:
  - Pedir contexto a ambos
  - Comparar trade-offs
  - Tomar decisión basada en:
    1. Requerimientos del proyecto
    2. Performance metrics
    3. Team expertise
    4. Long-term maintainability

DECISION: "React Query para server state (db),
           Zustand para client state (UI)"

DOCUMENTATION: ADR creado explicando decisión
```

### Escenario 2: Conflicto de Dependencia

```
AGENT_A necesita output de AGENT_B
AGENT_B está bloqueado en AGENT_C

ORCHESTRATOR INTERVENES:
  1. Identifica cadena de bloqueo: A → B → C
  2. Prioriza AGENT_C para desbloquear B
  3. Prioriza AGENT_B para desbloquear A
  4. Proporciona mock/stub temporal si es necesario
  5. Monitorea progress
```

---

## 💊 HEALTH CHECKS

### Cada Agente Debe Verificar:

```
DAILY_HEALTH_CHECK:

1. Performance
   ├─ Latencia < target
   ├─ Memoria within limits
   ├─ CPU usage acceptable
   └─ No memory leaks

2. Quality
   ├─ Tests passing: 100%
   ├─ Code coverage: >= target
   ├─ No regressions
   └─ TypeScript strict: clean

3. Documentation
   ├─ README actual
   ├─ Comments up-to-date
   ├─ API documented
   └─ Known issues listed

4. Security
   ├─ No vulnerabilities
   ├─ Dependencies updated
   ├─ Secrets not exposed
   └─ OWASP compliant

5. Integration
   ├─ No breaking changes
   ├─ Backward compatible
   ├─ Dependencies available
   └─ APIs consistent

REPORT_FORMAT:
  ✓ = All Good
  ⚠️ = Minor Issue (document)
  ✗ = Critical Issue (escalate)
```

### Orchestrator Monitorea:

```
PROJECT_HEALTH_DASHBOARD:

├─ Feature Completion
│  ├─ Planned: [#]
│  ├─ In Progress: [#]
│  ├─ Completed: [#]
│  └─ % Complete: [xx%]

├─ Code Quality
│  ├─ TypeScript errors: [#]
│  ├─ Lint warnings: [#]
│  ├─ Test coverage: [xx%]
│  └─ Code review status: [%]

├─ Performance
│  ├─ API latency: [xxms]
│  ├─ Bundle size: [xxKB]
│  ├─ LCP: [xxs]
│  └─ FID: [xxms]

├─ Security
│  ├─ Vulnerabilities: [#]
│  ├─ Security score: [A+/A/B/C]
│  ├─ Audit pending: [Y/N]
│  └─ Compliance: [%]

├─ Team Status
│  ├─ Blocked agents: [names]
│  ├─ Escalations pending: [#]
│  ├─ Avg cycle time: [xxh]
│  └─ Productivity: [%]

└─ Risks
   ├─ Critical blockers: [#]
   ├─ Tech debt score: [xx/100]
   ├─ Knowledge gaps: [list]
   └─ Upcoming deadlines: [list]
```

---

## 🚨 ESCALATION PROCEDURES

### Niveles de Escalación

```
LEVEL 1: Agent autonomously resolves
  └─ Examples: Minor bugs, Documentation updates

LEVEL 2: Domain Lead involved
  └─ Examples: Architectural decision, Cross-team conflict

LEVEL 3: Orchestrator decides
  └─ Examples: Major design change, Priority conflict

LEVEL 4: Human intervention needed
  └─ Examples: Business requirements unclear, Legal issue

ESCALATION_TIME_BUDGET:
  Level 1: < 30 min
  Level 2: < 1 hour (within same day)
  Level 3: < 2 hours (within same day)
  Level 4: Decision within 4 hours
```

### Escalation Template

```
ESCALATION_TICKET:

ID: ESC_2025_XXX
FROM: [agent-name]
LEVEL: [1/2/3/4]
SEVERITY: [CRITICAL/HIGH/MEDIUM/LOW]
DATE: [timestamp]
DOMAIN: [which domain]

DESCRIPTION:
  [Clear problem statement]

ROOT_CAUSE:
  [Why is this blocking?]

ATTEMPTED_FIXES:
  1. [Fix 1]: [Result]
  2. [Fix 2]: [Result]

REQUIRED_DECISION:
  [What needs to be decided?]

OPTIONS:
  A) [Option A]: Pros/Cons
  B) [Option B]: Pros/Cons
  C) [Option C]: Pros/Cons

IMPACT_IF_UNRESOLVED:
  - [Effect 1]
  - [Effect 2]
  - [Timeline impact]

DEPENDENCIES:
  - Blocks: [other-agents]
  - Depends on: [other-tasks]

ASSIGNED_TO: [escalation owner]
TARGET_RESOLUTION: [time]
```

---

## 📊 EJEMPLOS REALES

### EJEMPLO 1: Nueva Feature (Flujo Completo)

```
┌─────────────────────────────────────────────────────────┐
│ FEATURE: Salary Report Export to Excel                  │
│ ORCHESTRATOR: Creates task list                         │
│ ESTIMATED TIME: 3 days                                  │
└─────────────────────────────────────────────────────────┘

DAY 1 - PLANNING & BACKEND
══════════════════════════

08:00 ORCHESTRATOR sends:
  TO: fastapi-router-architect
  TASK: Create /api/salary/export/excel endpoint
  DEADLINE: 18:00 same day

10:00 fastapi-router-architect reports:
  STATUS: IN_PROGRESS
  SUBTASKS:
    ✓ Endpoint design
    ✓ Request schema with Zod
    🔄 Response implementation
    ⏳ Tests
  BLOCKERS: None

15:00 ORCHESTRATOR sends:
  TO: pydantic-schema-validator
  TASK: Create salary export schema
  DEPENDENCY: fastapi-router-architect

16:30 pydantic-schema-validator completes:
  STATUS: COMPLETED
  DELIVERED: SalaryExportRequest schema

17:00 fastapi-router-architect completes:
  STATUS: COMPLETED
  HANDOFF_TO: pytest-backend-tester

18:30 pytest-backend-tester completes:
  STATUS: COMPLETED
  METRICS: 15/15 tests pass
  HANDOFF_TO: ORCHESTRATOR

DAY 2 - FRONTEND
════════════════

08:00 ORCHESTRATOR sends:
  TO: react19-component-architect
  TASK: Create SalaryExportDialog component
  DEPENDENCY: Backend API ready

09:30 react19-component-architect reports:
  STATUS: IN_PROGRESS
  ISSUES: None

12:00 react19-component-architect completes:
  STATUS: COMPLETED
  HANDOFF_TO: react-query-data-fetcher

13:00 react-query-data-fetcher reports:
  STATUS: IN_PROGRESS
  TASK: Integrate export mutation

14:30 react-query-data-fetcher completes:
  STATUS: COMPLETED
  HANDOFF_TO: playwright-e2e-engineer

DAY 3 - TESTING & INTEGRATION
═══════════════════════════════

08:00 ORCHESTRATOR sends:
  TO: playwright-e2e-engineer
  TASK: E2E test for export flow

10:00 playwright-e2e-engineer reports:
  STATUS: COMPLETED
  METRICS: 3/3 scenarios pass

11:00 ORCHESTRATOR sends:
  TO: api-caching-optimizer
  TASK: Optimize export endpoint caching

12:00 api-caching-optimizer completes

13:00 ORCHESTRATOR sends:
  TO: api-documentation-specialist
  TASK: Document export endpoint

14:00 api-documentation-specialist completes

15:00 ORCHESTRATOR:
  - All agents report complete
  - All tests pass
  - Documentation ready
  - FEATURE MERGED TO MAIN
```

---

### EJEMPLO 2: Bug Fix (Escalación)

```
┌──────────────────────────────────┐
│ BUG: Salary calculations incorrect│
│ SEVERITY: CRITICAL               │
│ DISCOVERED: 10:00                │
└──────────────────────────────────┘

10:15 ORCHESTRATOR alerts:
  TO: payroll-processing-engine
  PRIORITY: CRITICAL
  TASK: Investigate salary calc bug

10:30 payroll-processing-engine reports:
  STATUS: INVESTIGATING
  FINDINGS:
    - Overtime multiplier wrong (was 1.5x, should be 2x)
    - Affects all overtime hours
    - Data corruption: Nov payroll affected
  BLOCKERS: Unclear if tax implications

11:00 ESCALATION LEVEL 2:
  FROM: payroll-processing-engine
  ISSUE: Legal/tax implications
  NEEDS: payroll-compliance-officer review

11:30 payroll-compliance-officer reports:
  STATUS: ANALYZED
  FINDINGS:
    - Tax deductions must be recalculated
    - Employee refunds needed
    - Legal documentation required

12:00 ESCALATION LEVEL 3:
  FROM: payroll-compliance-officer
  DECISION_NEEDED: How to handle retroactive correction?

12:30 ORCHESTRATOR DECISION:
  1. Fix calculation immediately
  2. Recalculate all Nov salaries
  3. Create adjustment records
  4. Notify employees
  5. Log audit trail

13:00 ORCHESTRATOR sends tasks:
  1. TO: payroll-processing-engine
     TASK: Fix overtime calculation + data correction

  2. TO: audit-security-logger
     TASK: Log all corrections

  3. TO: notification-system-builder
     TASK: Send notifications to affected employees

14:00 All fixes verified
14:30 New payroll report generated (correct)
15:00 BUG FIXED & DOCUMENTED
```

---

## 🎯 BEST PRACTICES

### Para ORCHESTRATOR:

1. **Delegación clara**: Cada agente sabe exactamente qué hacer
2. **Monitoreo continuo**: Check-in después de cada subtarea
3. **Escalación oportuna**: No esperes a que algo falle
4. **Context preservation**: Mantén contexto de todas las tareas
5. **Documentation**: Documenta todas las decisiones

### Para AGENTS:

1. **Reportes frecuentes**: No desaparezcas sin actualizar
2. **Bloqueos tempranos**: Escala antes de gastar mucho tiempo
3. **Código limpio**: No dejes tech debt para otros
4. **Tests completos**: Verifica antes de handoff
5. **Comunicación clara**: Sé específico en problemas

### Para HANDOFFS:

1. **Prepare bien**: No passes problemas a otros
2. **Document todo**: Inline comments + README
3. **Validar antes**: Tests pasan antes de entregar
4. **Contexto completo**: Explica decisiones
5. **Clear interfaces**: No cambies APIs sin avisar

---

## 📞 CONTACT & SUPPORT

### Cuando contactar a cada agente:

```
BUG EN FRONTEND STYLING:
  → tailwind-design-system-curator

BUG EN API ENDPOINT:
  → fastapi-router-architect

BUG EN ESTADO (Zustand):
  → zustand-state-maestro

BUG EN BD QUERIES:
  → postgresql-query-optimizer

PERFORMANCE ISSUE:
  → performance-benchmark-specialist

SECURITY VULNERABILITY:
  → security-vulnerability-hunter

TEST FAILURES:
  → [playwright-e2e-engineer / vitest-unit-tester]

DEPLOYMENT ISSUE:
  → github-actions-pipeline-builder

UNKNOWN ORIGIN:
  → ORCHESTRATOR (diagnostics)
```

---

**Versión**: 1.0
**Efectivo desde**: 2025-11-23
**Actualizar cuando**: Se agreguen nuevos agentes o cambios de arquitectura
