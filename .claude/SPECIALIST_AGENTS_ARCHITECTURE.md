# 🚀 ARQUITECTURA DE AGENTES ESPECIALISTAS
## UNS-ClaudeJP 6.0.0

---

## 📋 VISIÓN GENERAL

Este documento define una estructura de **agentes especializados** para gestionar cada aspecto del proyecto UNS-ClaudeJP 6.0.0. Cada agente es un especialista autónomo con dominio profundo en su área.

---

## 🎯 ESTRUCTURA DE AGENTES POR DOMINIO

### **DOMINIO 1: FRONTEND (Next.js + React 19 + TypeScript)**

#### 1.1 **nextjs-app-router-specialist** ⚙️
**Responsabilidad**: Arquitectura de páginas, rutas y navegación
- **Expertise**: Next.js 16 App Router, Server Components, Layouts
- **Dominio**: `/frontend/app/**` (30+ páginas)
- **Tareas**:
  - Crear/mantener rutas de páginas
  - Configurar layouts y metadata
  - Optimizar ISR (Incremental Static Regeneration)
  - Implementar dynamic imports y code splitting
- **Competencias**: App Router, Middleware, Streaming, Suspense
- **Métrica**: Performance score > 90

---

#### 1.2 **react19-component-architect** 🎨
**Responsabilidad**: Diseño y arquitectura de componentes React
- **Expertise**: React 19, Server Components, Client Components, Hooks
- **Dominio**: `/frontend/components/` (171+ componentes)
- **Tareas**:
  - Diseñar componentes reutilizables
  - Implementar patrones (Compound, Provider, etc)
  - Optimizar re-renders
  - Gestionar ciclo de vida
- **Competencias**: React internals, Concurrency, Transitions
- **Métrica**: Componente coverage > 90%

---

#### 1.3 **typescript-strictness-guardian** 🔒
**Responsabilidad**: Type safety y validación estática
- **Expertise**: TypeScript strict mode, Zod, Type guards
- **Dominio**: `/frontend/types/`, validación en componentes
- **Tareas**:
  - Mantener strict mode (tsconfig.json)
  - Definir tipos globales
  - Implementar type guards
  - Validar props con Zod
- **Competencias**: Advanced types, Generics, Conditional types
- **Métrica**: Type coverage 100%

---

#### 1.4 **tailwind-design-system-curator** 🎭
**Responsabilidad**: Diseño visual, Tailwind CSS, Radix UI
- **Expertise**: Tailwind CSS 3.4, Radix UI 1.0, Design tokens
- **Dominio**: `/frontend/styles/`, Radix UI configuration
- **Tareas**:
  - Mantener design tokens
  - Implementar dark mode
  - Crear componentes UI base
  - Garantizar accesibilidad (WCAG)
- **Competencias**: CSS-in-JS, Accessibility, Theme systems
- **Métrica**: Lighthouse accessibility > 95

---

#### 1.5 **zustand-state-maestro** 🧠
**Responsabilidad**: Gestión de estado global con Zustand
- **Expertise**: Zustand 5.0, State management patterns
- **Dominio**: `/frontend/stores/` (8 stores)
- **Tareas**:
  - Diseñar store architecture
  - Implementar auth-store, salary-store, etc
  - Middleware y persistence
  - DevTools integration
- **Competencias**: State patterns, Immer, Middleware, Selectors
- **Métrica**: Zero prop drilling, <100ms state updates

---

#### 1.6 **react-hook-form-validator** ✅
**Responsabilidad**: Formularios y validación con React Hook Form + Zod
- **Expertise**: React Hook Form 7.65, Zod 3.25, Form patterns
- **Dominio**: `/frontend/components/forms/`
- **Tareas**:
  - Crear form components reutilizables
  - Implementar validación con Zod
  - Manejar errores de validación
  - Integrar con backend
- **Competencias**: Async validation, Custom hooks, Field arrays
- **Métrica**: Form error handling 100%

---

#### 1.7 **react-query-data-fetcher** 🔄
**Responsabilidad**: Data fetching, caching y sincronización
- **Expertise**: TanStack Query 5.59, Axios, Cache strategies
- **Dominio**: `/frontend/lib/api.ts`, custom hooks
- **Tareas**:
  - Crear hooks para queries (useQuery, useMutation)
  - Implementar cache invalidation
  - Manejar offline sync
  - Optimizar request batching
- **Competencias**: Request deduplication, Stale-while-revalidate, Optimistic updates
- **Métrica**: API response time < 500ms

---

#### 1.8 **playwright-e2e-engineer** 🎬
**Responsabilidad**: Testing end-to-end con Playwright
- **Expertise**: Playwright 1.56, Test automation, Visual regression
- **Dominio**: `/frontend/e2e/**` (Playwright spec files)
- **Tareas**:
  - Escribir E2E tests para flujos críticos
  - Implementar visual regression testing
  - Crear page objects
  - CI integration
- **Competencias**: Selectors, Fixtures, API testing, Screenshots
- **Métrica**: Test coverage > 80%, <5min para full suite

---

#### 1.9 **vitest-unit-tester** 🧪
**Responsabilidad**: Unit testing con Vitest
- **Expertise**: Vitest 2.1, Testing Library, Mock strategies
- **Dominio**: `/frontend/tests/**`, component tests
- **Tareas**:
  - Escribir unit tests para componentes
  - Implementar mocks y stubs
  - Coverage analysis
  - Snapshot testing
- **Competencias**: Testing patterns, MSW mocking, Coverage tools
- **Métrica**: Coverage > 80%, All tests < 30s

---

#### 1.10 **accessibility-advocate** ♿
**Responsabilidad**: Accesibilidad WCAG 2.1 AA
- **Expertise**: WCAG, Radix UI accessibility, Screen readers
- **Dominio**: Frontend completo, auditoría de a11y
- **Tareas**:
  - Auditar accesibilidad
  - Implementar ARIA labels
  - Testing con screen readers
  - Documentar patrones a11y
- **Competencias**: WCAG guidelines, Keyboard navigation, ARIA
- **Métrica**: Lighthouse accessibility > 95

---

---

### **DOMINIO 2: BACKEND (FastAPI + Python 3.11)**

#### 2.1 **fastapi-router-architect** 🔗
**Responsabilidad**: Diseño de API REST y routers FastAPI
- **Expertise**: FastAPI 0.115, Pydantic 2.0, HTTP best practices
- **Dominio**: `/backend/app/api/` (24 routers)
- **Tareas**:
  - Diseñar endpoints RESTful
  - Implementar request/response validation
  - Documentación OpenAPI
  - Versionado de API
- **Competencias**: HTTP semantics, REST patterns, OpenAPI, Pagination
- **Métrica**: All endpoints documented, 100% validation

---

#### 2.2 **sqlalchemy-orm-expert** 🗄️
**Responsabilidad**: Modelos ORM y relaciones de datos
- **Expertise**: SQLAlchemy 2.0, Relationships, Query optimization
- **Dominio**: `/backend/app/models/` (17+ models)
- **Tareas**:
  - Diseñar modelos y relaciones
  - Implementar constraints
  - Crear mixins y inheritance
  - Lazy loading optimization
- **Competencias**: Relationships, Cascade, Polymorphism, Eager loading
- **Métrica**: 0 N+1 queries, <100ms por query

---

#### 2.3 **alembic-migration-master** 📦
**Responsabilidad**: Migraciones de BD con Alembic
- **Expertise**: Alembic, Schema versioning, Data migrations
- **Dominio**: `/backend/alembic/`
- **Tareas**:
  - Crear migraciones automáticas
  - Escribir migraciones manuales
  - Testing de rollback
  - Versionado y documentación
- **Competencias**: Migration strategies, Schema changes, Zero-downtime
- **Métrica**: All migrations tested, Zero data loss

---

#### 2.4 **pydantic-schema-validator** ✔️
**Responsabilidad**: Validación de datos con Pydantic
- **Expertise**: Pydantic 2.0, Custom validators, JSON schema
- **Dominio**: `/backend/app/schemas/`
- **Tareas**:
  - Crear schemas para request/response
  - Implementar custom validators
  - Configurar validación cross-field
  - Documentación JSON Schema
- **Competencias**: Field validators, Root validators, Config classes
- **Métrica**: 100% request validation

---

#### 2.5 **jwt-auth-guardian** 🔐
**Responsabilidad**: Autenticación y autorización
- **Expertise**: JWT, OAuth2, RBAC, Security best practices
- **Dominio**: `/backend/app/api/auth.py`, middleware
- **Tareas**:
  - Implementar login/register con JWT
  - Crear RBAC middleware
  - Manejar token refresh
  - Auditoría de acceso
- **Competencias**: Cryptography, Security patterns, Password hashing
- **Métrica**: All endpoints protected, OWASP compliant

---

#### 2.6 **payroll-processing-engine** 💰
**Responsabilidad**: Lógica compleja de nómina
- **Expertise**: Payroll algorithms, Tax calculations, Deductions
- **Dominio**: `/backend/app/services/payroll/`
- **Tareas**:
  - Implementar calculadora de salarios
  - Procesar retenciones de impuestos
  - Calcular horas extras
  - Generar slip de pago
- **Competencias**: Financial math, Tax regulations, Compliance
- **Métrica**: 99.99% accuracy, All deductions correct

---

#### 2.7 **ai-integration-specialist** 🤖
**Responsabilidad**: Integración multi-proveedor de IA
- **Expertise**: OpenAI, Gemini, Claude, Streaming, Rate limiting
- **Dominio**: `/backend/app/services/ai_gateway.py`
- **Tareas**:
  - Implementar gateway de IA
  - Integrar múltiples providers
  - Streaming responses
  - Usage tracking y billing
- **Competencias**: LLM APIs, Prompt engineering, Token counting
- **Métrica**: <1s latency, 99.9% uptime

---

#### 2.8 **ocr-document-processor** 📄
**Responsabilidad**: OCR y procesamiento de documentos
- **Expertise**: Azure Vision, Tesseract, EasyOCR, Document parsing
- **Dominio**: `/backend/app/services/` OCR services
- **Tareas**:
  - Implementar pipeline OCR
  - Integrar múltiples engines
  - Cache de resultados
  - Quality validation
- **Competencias**: Computer vision, Image processing, Document layout
- **Métrica**: 95%+ accuracy, <5s por documento

---

#### 2.9 **notification-system-builder** 📧
**Responsabilidad**: Email, SMS, LINE notifications
- **Expertise**: SMTP, LINE Bot API, Queue systems
- **Dominio**: `/backend/app/services/notification_service.py`
- **Tareas**:
  - Implementar templates de email
  - Integración con LINE
  - Queue para envíos
  - Delivery tracking
- **Competencias**: Message queues, Template engines, Delivery guarantees
- **Métrica**: 99%+ delivery rate

---

#### 2.10 **audit-security-logger** 🔍
**Responsabilidad**: Auditoría y logging de seguridad
- **Expertise**: Audit trails, Security logging, Compliance
- **Dominio**: `/backend/app/core/audit.py`, logging
- **Tareas**:
  - Implementar audit log
  - Registrar cambios críticos
  - Compliance reporting
  - Forensics capabilities
- **Competencias**: Audit patterns, Log analysis, Compliance frameworks
- **Métrica**: 100% compliance, 0 missed events

---

#### 2.11 **service-layer-architect** 🏗️
**Responsabilidad**: Arquitectura de servicios de negocio
- **Expertise**: Service patterns, Domain-driven design, Dependency injection
- **Dominio**: `/backend/app/services/` (20 servicios)
- **Tareas**:
  - Diseñar servicios
  - Inyección de dependencias
  - Transacciones y ACID
  - Error handling
- **Competencias**: SOLID principles, DDD, Dependency graphs
- **Métrica**: Clear separation of concerns, Testable services

---

#### 2.12 **error-resilience-engineer** 🛡️
**Responsabilidad**: Manejo de errores y resiliencia
- **Expertise**: Error handling, Retry logic, Circuit breakers
- **Dominio**: `/backend/app/core/` exception handling
- **Tareas**:
  - Definir jerarquía de excepciones
  - Implementar retry logic
  - Circuit breakers
  - Graceful degradation
- **Competencias**: Resilience patterns, Error recovery
- **Métrica**: <2s recovery time, 99.99% uptime

---

#### 2.13 **pytest-backend-tester** 🧪
**Responsabilidad**: Testing unitario e integración con PyTest
- **Expertise**: PyTest, Fixtures, Mocking, Database testing
- **Dominio**: `/backend/tests/**`
- **Tareas**:
  - Escribir unit tests para servicios
  - Integration tests para API
  - Fixtures y factories
  - Coverage analysis
- **Competencias**: Testing patterns, Database fixtures, Mock strategies
- **Métrica**: Coverage > 85%, All tests < 60s

---

---

### **DOMINIO 3: BASE DE DATOS**

#### 3.1 **postgresql-query-optimizer** ⚡
**Responsabilidad**: Optimización de queries y índices
- **Expertise**: PostgreSQL 15, Query optimization, Index strategies
- **Dominio**: Database layer, query analysis
- **Tareas**:
  - Analizar slow queries
  - Crear índices estratégicos
  - Rewrite queries
  - Explain plan analysis
- **Competencias**: Query planning, Index types, Statistics
- **Métrica**: All queries < 100ms, 0 sequential scans

---

#### 3.2 **redis-caching-strategist** 🚀
**Responsabilidad**: Estrategia de caching con Redis
- **Expertise**: Redis 7, Cache patterns, TTL strategies
- **Dominio**: Redis integration, cache layer
- **Tareas**:
  - Diseñar cache strategy
  - Implementar cache-aside pattern
  - Cache invalidation
  - Monitoring
- **Competencias**: Cache patterns, Key design, Expiration
- **Métrica**: 90%+ hit rate, <1ms latency

---

#### 3.3 **database-backup-guardian** 💾
**Responsabilidad**: Backups y recuperación de datos
- **Expertise**: PostgreSQL backup, PITR, Disaster recovery
- **Dominio**: Backup strategy, monitoring
- **Tareas**:
  - Implementar backup automático
  - Testing de restore
  - Disaster recovery plan
  - RTO/RPO optimization
- **Competencias**: Backup strategies, PITR, Replication
- **Métrica**: RTO < 4 horas, RPO < 1 hora

---

---

### **DOMINIO 4: INFRAESTRUCTURA**

#### 4.1 **docker-container-orchestrator** 🐳
**Responsabilidad**: Docker Compose y containerización
- **Expertise**: Docker, Docker Compose, Container networking
- **Dominio**: `/docker/` (6 servicios)
- **Tareas**:
  - Mantener docker-compose.yml
  - Crear Dockerfiles optimizados
  - Multi-stage builds
  - Health checks
- **Competencias**: Container best practices, Networking, Volumes
- **Métrica**: <5s startup, Multi-arch build

---

#### 4.2 **environment-config-manager** ⚙️
**Responsabilidad**: Configuración de entorno
- **Expertise**: Environment variables, Config management, Secrets
- **Dominio**: `.env.example`, config/
- **Tareas**:
  - Gestionar variables de entorno
  - Secretos seguros
  - Validación de config
  - Documentación
- **Competencias**: Secrets management, Config validation
- **Métrica**: Zero hardcoded secrets, Full coverage

---

---

### **DOMINIO 5: DEVOPS**

#### 5.1 **github-actions-pipeline-builder** 🚀
**Responsabilidad**: CI/CD con GitHub Actions
- **Expertise**: GitHub Actions, Workflows, Deployment
- **Dominio**: `/.github/workflows/`
- **Tareas**:
  - Crear workflows
  - Implementar CI (test, lint, build)
  - Deployment automation
  - Release process
- **Competencias**: Workflow syntax, Matrix builds, Secrets
- **Métrica**: <15min para test+build, 99% success rate

---

#### 5.2 **prometheus-grafana-observer** 📊
**Responsabilidad**: Monitoreo y observabilidad
- **Expertise**: Prometheus, Grafana, OpenTelemetry
- **Dominio**: Monitoring setup, dashboards
- **Tareas**:
  - Crear dashboards Grafana
  - Configurar alertas
  - Métrics collection
  - SLO/SLI definition
- **Competencias**: Metrics design, Alerting, Dashboard creation
- **Métrica**: <30s para alertas, 99.9% SLO

---

#### 5.3 **kubernetes-deployment-specialist** ☸️
**Responsabilidad**: Deployment en Kubernetes (futuro)
- **Expertise**: Kubernetes, Helm, StatefulSets
- **Dominio**: Kubernetes configuration
- **Tareas**:
  - Crear manifests K8s
  - Helm charts
  - Scaling strategies
  - Network policies
- **Competencias**: K8s patterns, Helm, Service mesh
- **Métrica**: Auto-scaling, Zero-downtime deployment

---

---

### **DOMINIO 6: SEGURIDAD**

#### 6.1 **security-vulnerability-hunter** 🔒
**Responsabilidad**: Identificación y corrección de vulnerabilidades
- **Expertise**: OWASP, XSS, SQL injection, Security scanning
- **Dominio**: Security audit, vulnerability fixes
- **Tareas**:
  - Auditoría de seguridad
  - Escaneo de vulnerabilidades
  - Penetration testing
  - Remediación
- **Competencias**: Security testing, Vulnerability analysis
- **Métrica**: 0 HIGH/CRITICAL, Regular audits

---

#### 6.2 **csp-headers-enforcer** 🚨
**Responsabilidad**: Content Security Policy y headers de seguridad
- **Expertise**: CSP, Security headers, XSS prevention
- **Dominio**: Middleware, headers configuration
- **Tareas**:
  - Implementar CSP headers
  - Noindex policies
  - CORS configuration
  - Header validation
- **Competencias**: CSP directives, Header security
- **Métrica**: A+ en security headers, 0 CSP violations

---

#### 6.3 **rate-limiter-architect** ⏱️
**Responsabilidad**: Rate limiting y throttling
- **Expertise**: Rate limiting, DDoS protection, Token bucket
- **Dominio**: Middleware, API endpoints
- **Tareas**:
  - Implementar rate limiting
  - Adaptive throttling
  - IP whitelisting
  - Analytics
- **Competencias**: Throttling algorithms, Token bucket, Leaky bucket
- **Métrica**: Zero abuse attacks, <1% false positives

---

---

### **DOMINIO 7: RENDIMIENTO**

#### 7.1 **code-splitting-optimizer** 📦
**Responsabilidad**: Bundle optimization y code splitting
- **Expertise**: Webpack/esbuild, Tree shaking, Code splitting
- **Dominio**: Frontend build configuration
- **Tareas**:
  - Analizar bundle size
  - Implementar dynamic imports
  - Lazy loading
  - Tree shaking optimization
- **Competencias**: Bundle analysis, Lazy loading patterns
- **Métrica**: Bundle < 200KB gzip, LCP < 2.5s

---

#### 7.2 **api-caching-optimizer** 💾
**Responsabilidad**: Caching de respuestas API
- **Expertise**: HTTP caching, ETag, Cache-Control
- **Dominio**: Backend caching layer
- **Tareas**:
  - Configurar cache headers
  - ETags y conditional requests
  - Cache invalidation
  - CDN integration
- **Competencias**: HTTP semantics, Cache validation
- **Métrica**: 50%+ cache hit rate, <100ms latency

---

#### 7.3 **performance-benchmarking-specialist** ⚡
**Responsabilidad**: Load testing y benchmarking
- **Expertise**: Load testing, Performance metrics, Profiling
- **Dominio**: Performance monitoring
- **Tareas**:
  - Load testing
  - Benchmark suite
  - Profiling
  - Performance regression detection
- **Competencias**: Load testing tools, Metrics collection
- **Métrica**: Can handle 10x normal load, <5% degradation

---

---

### **DOMINIO 8: LÓGICA DE NEGOCIO**

#### 8.1 **employee-lifecycle-manager** 👥
**Responsabilidad**: Gestión del ciclo de vida de empleados
- **Expertise**: Employee management, HR processes
- **Dominio**: Employee services, models
- **Tareas**:
  - Candidate evaluation workflow
  - Employee onboarding
  - Status transitions
  - Offboarding
- **Competencias**: HR processes, Data consistency
- **Métrica**: 100% data integrity, Complete audit trail

---

#### 8.2 **payroll-compliance-officer** ⚖️
**Responsabilidad**: Cumplimiento normativo de nómina
- **Expertise**: Tax regulations, Labor laws, Compliance
- **Dominio**: Payroll service, compliance logic
- **Tareas**:
  - Implementar tax rules
  - Compliance checks
  - Regulatory reporting
  - Audit trail
- **Competencias**: Tax law, Compliance frameworks
- **Métrica**: 100% compliance, Zero audit findings

---

#### 8.3 **apartment-management-specialist** 🏠
**Responsabilidad**: Gestión de apartamentos y asignaciones
- **Expertise**: Apartment allocation, Assignment logic
- **Dominio**: Apartment services
- **Tareas**:
  - Assignment algorithms
  - Occupancy tracking
  - Deduction calculation
  - Maintenance tracking
- **Competencias**: Resource allocation, Complex calculations
- **Métrica**: 100% occupancy accuracy, <1% errors

---

#### 8.4 **vacation-management-expert** 🏖️
**Responsabilidad**: Gestión de vacaciones pagadas (有給休暇)
- **Expertise**: Vacation accrual, Request handling
- **Dominio**: Yukyu service
- **Tareas**:
  - Accrual calculations
  - Request workflows
  - Carry-over logic
  - Reporting
- **Competencias**: Vacation policies, Complex calculations
- **Métrica**: 100% accurate accrual, Zero disputes

---

#### 8.5 **attendance-timer-specialist** ⏱️
**Responsabilidad**: Procesamiento de tarjetas de asistencia
- **Expertise**: Timer card processing, OCR integration
- **Dominio**: Timer card services
- **Tareas**:
  - OCR pipeline
  - Data validation
  - Anomaly detection
  - Correction workflows
- **Competencias**: Data validation, OCR integration
- **Métrica**: 99%+ accuracy, <5min processing

---

---

### **DOMINIO 9: DOCUMENTACIÓN**

#### 9.1 **api-documentation-specialist** 📚
**Responsabilidad**: Documentación de API con OpenAPI/Swagger
- **Expertise**: OpenAPI 3.0, API documentation
- **Dominio**: `/docs/`, API specifications
- **Tareas**:
  - Mantener OpenAPI spec
  - API documentation
  - Example requests
  - Client generation
- **Competencias**: OpenAPI, Swagger, API design
- **Métrica**: 100% endpoints documented, Live Swagger UI

---

#### 9.2 **architecture-decision-recorder** 🏛️
**Responsabilidad**: Decisiones arquitectónicas y ADRs
- **Expertise**: Architecture documentation, ADR format
- **Dominio**: `/docs/architecture/`
- **Tareas**:
  - Escribir ADRs
  - Justificación de decisiones
  - Trade-off analysis
  - Architecture diagrams
- **Competencias**: System design, Documentation
- **Métrica**: All major decisions documented

---

#### 9.3 **deployment-runbook-author** 📖
**Responsabilidad**: Guías de deployment y runbooks
- **Expertise**: Deployment procedures, Troubleshooting
- **Dominio**: `/docs/` deployment guides
- **Tareas**:
  - Crear guías de setup
  - Runbooks de troubleshooting
  - Disaster recovery guides
  - Change logs
- **Competencias**: System administration, Documentation
- **Métrica**: Zero knowledge gaps, All team trained

---

---

### **DOMINIO 10: TESTING AVANZADO**

#### 10.1 **integration-test-engineer** 🔗
**Responsabilidad**: Testing de integración entre componentes
- **Expertise**: Integration testing, Full-stack testing
- **Dominio**: `/frontend/e2e/`, `/backend/tests/`
- **Tareas**:
  - E2E flow testing
  - API integration testing
  - Database integration
  - Cross-component testing
- **Competencias**: Full-stack testing, Test orchestration
- **Métrica**: Coverage > 80%, All critical flows tested

---

#### 10.2 **load-stress-tester** 📈
**Responsabilidad**: Load testing y stress testing
- **Expertise**: Load testing, Stress testing, Capacity planning
- **Dominio**: Performance testing
- **Tareas**:
  - Load testing scripts
  - Stress test scenarios
  - Capacity planning
  - Bottleneck identification
- **Competencias**: Load testing tools, Metrics analysis
- **Métrica**: 10x sustained load, Clear bottleneck analysis

---

#### 10.3 **security-penetration-tester** 🎯
**Responsabilidad**: Penetration testing y security assessments
- **Expertise**: Penetration testing, Security testing
- **Dominio**: Security testing
- **Tareas**:
  - Penetration tests
  - Security assessment
  - Vulnerability identification
  - Remediation validation
- **Competencias**: Penetration testing, Security tools
- **Métrica**: Regular audits, Zero critical findings

---

---

## 📊 MATRIZ DE RESPONSABILIDADES

```
┌─────────────────────────────┬─────────────┬──────────┬──────────┐
│ Agent                       │ Dominio     │ LOC Impa │ Crítico  │
├─────────────────────────────┼─────────────┼──────────┼──────────┤
│ nextjs-app-router-specialist│ Frontend    │  5,000  │ CRÍTICO  │
│ react19-component-architect │ Frontend    │  8,000  │ CRÍTICO  │
│ typescript-strictness-guardian│ Frontend  │  2,000  │ ALTO     │
│ tailwind-design-system      │ Frontend    │  1,500  │ MEDIO    │
│ zustand-state-maestro       │ Frontend    │  1,500  │ CRÍTICO  │
│ react-hook-form-validator   │ Frontend    │  2,000  │ ALTO     │
│ react-query-data-fetcher    │ Frontend    │  1,500  │ CRÍTICO  │
│ playwright-e2e-engineer     │ Testing     │  2,000  │ ALTO     │
│ vitest-unit-tester          │ Testing     │  2,500  │ ALTO     │
│ accessibility-advocate      │ Frontend    │  500    │ MEDIO    │
│                             │             │         │          │
│ fastapi-router-architect    │ Backend     │  4,000  │ CRÍTICO  │
│ sqlalchemy-orm-expert       │ Backend     │  3,500  │ CRÍTICO  │
│ alembic-migration-master    │ Backend     │  500    │ CRÍTICO  │
│ pydantic-schema-validator   │ Backend     │  1,500  │ ALTO     │
│ jwt-auth-guardian           │ Security    │  1,000  │ CRÍTICO  │
│ payroll-processing-engine   │ Logic       │  3,000  │ CRÍTICO  │
│ ai-integration-specialist   │ Backend     │  2,000  │ ALTO     │
│ ocr-document-processor      │ Backend     │  2,500  │ ALTO     │
│ notification-system-builder │ Backend     │  1,500  │ MEDIO    │
│ audit-security-logger       │ Security    │  1,000  │ ALTO     │
│ service-layer-architect     │ Backend     │  4,000  │ CRÍTICO  │
│ error-resilience-engineer   │ Backend     │  1,500  │ ALTO     │
│ pytest-backend-tester       │ Testing     │  3,000  │ ALTO     │
│                             │             │         │          │
│ postgresql-query-optimizer  │ Database    │  500    │ CRÍTICO  │
│ redis-caching-strategist    │ Database    │  800    │ ALTO     │
│ database-backup-guardian    │ Database    │  400    │ CRÍTICO  │
│                             │             │         │          │
│ docker-container-orchestrator│ Infra      │  300    │ ALTO     │
│ environment-config-manager  │ Infra       │  200    │ CRÍTICO  │
│                             │             │         │          │
│ github-actions-pipeline     │ DevOps      │  1,000  │ ALTO     │
│ prometheus-grafana-observer │ DevOps      │  600    │ MEDIO    │
│ kubernetes-deployment       │ DevOps      │  0*     │ FUTURO   │
│                             │             │         │          │
│ security-vulnerability-hunter│ Security   │  300    │ CRÍTICO  │
│ csp-headers-enforcer        │ Security    │  400    │ ALTO     │
│ rate-limiter-architect      │ Security    │  600    │ ALTO     │
│                             │             │         │          │
│ code-splitting-optimizer    │ Performance │  300    │ MEDIO    │
│ api-caching-optimizer       │ Performance │  400    │ ALTO     │
│ performance-benchmark-spec  │ Performance │  300    │ MEDIO    │
│                             │             │         │          │
│ employee-lifecycle-manager  │ Logic       │  2,000  │ CRÍTICO  │
│ payroll-compliance-officer  │ Logic       │  1,500  │ CRÍTICO  │
│ apartment-management-spec   │ Logic       │  2,500  │ CRÍTICO  │
│ vacation-management-expert  │ Logic       │  1,500  │ CRÍTICO  │
│ attendance-timer-specialist │ Logic       │  2,000  │ CRÍTICO  │
│                             │             │         │          │
│ api-documentation-specialist│ Docs        │  500    │ MEDIO    │
│ architecture-decision-rec   │ Docs        │  300    │ MEDIO    │
│ deployment-runbook-author   │ Docs        │  400    │ MEDIO    │
│                             │             │         │          │
│ integration-test-engineer   │ Testing     │  2,500  │ ALTO     │
│ load-stress-tester          │ Testing     │  800    │ MEDIO    │
│ security-penetration-tester │ Testing     │  500    │ ALTO     │
└─────────────────────────────┴─────────────┴──────────┴──────────┘
```

---

## 🎯 FLUJO DE DELEGACIÓN

### Ejemplo: Implementar nueva feature de salarios

```
Orchestrator (You)
    ↓
1. Analizar: ¿Qué se necesita?
   - Backend: API endpoint
   - Database: Nuevas tablas
   - Frontend: UI components
   - Testing: E2E tests
    ↓
2. Crear TODO list
    ↓
3. Delegar a especialistas:
   ├─→ fastapi-router-architect (API endpoint)
   ├─→ sqlalchemy-orm-expert (Modelos)
   ├─→ alembic-migration-master (Migraciones)
   ├─→ payroll-processing-engine (Lógica)
   ├─→ react19-component-architect (UI)
   ├─→ zustand-state-maestro (State management)
   ├─→ pytest-backend-tester (Tests backend)
   ├─→ playwright-e2e-engineer (Tests E2E)
   └─→ postgresql-query-optimizer (Optimización)
    ↓
4. Testing y validación
    ↓
5. Documentación y merge
```

---

## 🏆 CRITERIOS DE ÉXITO POR AGENTE

Cada agente tiene métricas claras de éxito:

- **Frontend**: Lighthouse > 90, Accesibilidad > 95, Tests > 80%
- **Backend**: Coverage > 85%, Latencia < 100ms, Uptime 99.9%
- **Database**: Queries < 100ms, Hit rate > 90%, Zero data loss
- **Security**: 0 HIGH/CRITICAL, A+ score, Regular audits
- **DevOps**: <15min CI, 99% success rate, <5min deployments
- **Docs**: 100% coverage, Actualizadas, Claras

---

## 📈 ROADMAP DE IMPLEMENTACIÓN

### Phase 1: Core Infrastructure (Semana 1-2)
- Docker, Environment, Database setup
- Core authentication and RBAC

### Phase 2: Frontend Foundation (Semana 3-4)
- Component architecture
- State management setup
- Form validation

### Phase 3: Backend Services (Semana 5-6)
- All API endpoints
- Business logic services
- Database models

### Phase 4: Integration (Semana 7-8)
- Frontend-Backend integration
- Full E2E flows
- Performance optimization

### Phase 5: Quality & Security (Semana 9-10)
- Penetration testing
- Load testing
- Security hardening

### Phase 6: Deployment (Semana 11-12)
- CI/CD pipeline
- Monitoring setup
- Production readiness

---

## 🚀 PRÓXIMAS ACCIONES

1. **Para cada agente**: Crear MCP server especializado
2. **Crear prompt templates** para cada especialista
3. **Configurar communication protocol** entre agentes
4. **Establecer métricas** y health checks
5. **Documentar handoff procedures** entre agentes

---

**Documento generado**: 2025-11-23
**Versión**: 1.0
**Arquitecto**: Claude Orchestrator
