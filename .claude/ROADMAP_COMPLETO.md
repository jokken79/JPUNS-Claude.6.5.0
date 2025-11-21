# 📋 Roadmap UNS-ClaudeJP - Multi-AI & Features

**Documento maestro de todas las tareas pendientes y mejoras planificadas**

Fecha: 2025-11-16
Última actualización: 2025-11-16
Status: En desarrollo

---

## 🎯 Estado Actual (Completado)

✅ **Sistema de Agentes (13 especialistas)**
- ✅ Orchestrator master implementation
- ✅ Especialistas definidos en agents.json
- ✅ Documentación completa (CLAUDE.md)

✅ **Documentación AI (Completa)**
- ✅ agents.md (guía maestra)
- ✅ AGENT_QUICK_START.md (5 min intro)
- ✅ AI_INTEGRATION_PATTERNS.md (patrones)
- ✅ PROMPT_TEMPLATES.md (30+ templates)
- ✅ SPECIALIST_MATRIX.md (13 agents)
- ✅ AI_EVALUATION_CHECKLIST.md (QA)
- ✅ REAL_WORLD_EXAMPLES/ (5 workflows)
- ✅ AI_TROUBLESHOOTING.md (soluciones)

✅ **Multi-AI Gateway**
- ✅ AIGateway service (backend/app/services/ai_gateway.py)
- ✅ REST API endpoints (backend/app/api/ai_agents.py)
- ✅ Tests (backend/tests/test_ai_gateway.py)
- ✅ Gemini integration
- ✅ OpenAI integration
- ✅ Claude API integration
- ✅ Local CLI support
- ✅ Batch invocation
- ✅ Health checks
- ✅ Error handling

✅ **Documentación Gateway**
- ✅ AI_GATEWAY_GUIDE.md (setup & examples)
- ✅ TodasLasMpcIA.md (master reference)
- ✅ .env.example (updated)

---

## 📅 Roadmap por Fases

### FASE 1: Fundamentos (Semana 1) - ✅ COMPLETADO

**Objetivo:** Establecer sistema base de agentes y documentación

**Tareas completadas:**
- [x] Crear agents.md maestro
- [x] Crear AGENT_QUICK_START.md
- [x] Crear PROMPT_TEMPLATES.md
- [x] Crear SPECIALIST_MATRIX.md
- [x] Crear AI_EVALUATION_CHECKLIST.md
- [x] Crear REAL_WORLD_EXAMPLES (5 ejemplos)
- [x] Crear AI_INTEGRATION_PATTERNS.md
- [x] Implementar AIGateway service
- [x] Crear REST API endpoints
- [x] Crear tests (25+ casos)
- [x] Documentar todo

**Resultado:**
- ✅ Sistema multi-IA completo
- ✅ 2,700+ líneas de documentación
- ✅ 650+ líneas de código backend
- ✅ 100% listo para usar

---

### FASE 2: Rate Limiting & Cost Control (Semana 2-3) - ⏳ PENDIENTE

**Objetivo:** Proteger contra abuso y controlar costos

**Tareas:**

#### 2.1 Rate Limiting por Usuario
- [ ] Instalar: `pip install slowapi`
- [ ] Crear: `backend/app/core/rate_limiter.py`
- [ ] Implementar: Límites por usuario
  - [ ] Gemini: 100 calls/día
  - [ ] OpenAI: 50 calls/día
  - [ ] Claude: 50 calls/día
- [ ] Tests para rate limiting
- [ ] Documentación

**Archivo esperado:** `backend/app/core/rate_limiter.py` (150 líneas)

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

# En endpoints:
@router.post("/gemini")
@limiter.limit("100/day")
async def invoke_gemini(...):
    ...
```

---

#### 2.2 Cost Tracking
- [ ] Crear modelo: `AIUsageLog` en models.py
- [ ] Campos:
  - [ ] user_id (FK)
  - [ ] provider (gemini|openai|claude)
  - [ ] prompt_tokens
  - [ ] response_tokens
  - [ ] cost_usd
  - [ ] timestamp
- [ ] API endpoint: `GET /api/ai/usage` (admin only)
- [ ] Dashboard: `/admin/ai-usage`
- [ ] Alerts cuando usuario se acerca al budget

**Archivo esperado:**
- `backend/app/models/models.py` (agregar AIUsageLog)
- `backend/app/api/admin.py` (agregar endpoints)

---

#### 2.3 Budget Limits
- [ ] Crear modelo: `AIBudget` en models.py
  - [ ] user_id (FK)
  - [ ] monthly_limit_usd
  - [ ] current_spent_usd
  - [ ] reset_date
- [ ] Validación: antes de cada invocación
- [ ] Webhook: notificar cuando se acerca

**Estimación:** 2-3 horas

---

### FASE 3: Caching & Performance (Semana 3-4) - ⏳ PENDIENTE

**Objetivo:** Reducir latencia y costos con caching

**Tareas:**

#### 3.1 Response Caching
- [ ] Usar Redis para cache de respuestas
- [ ] Crear: `backend/app/services/cache_service.py`
- [ ] Cache key: hash(provider + prompt + model + temperature)
- [ ] TTL configurable (default: 7 días)
- [ ] Invalidation manual via API

**Lógica:**
```python
cache_key = hash(f"{provider}:{prompt}:{model}")
cached = await redis.get(cache_key)
if cached:
    return cached  # From cache

result = await gateway.invoke(...)
await redis.setex(cache_key, ttl, result)
return result
```

**Estimación:** 3-4 horas

---

#### 3.2 Prompt Optimization
- [ ] Agregar campo: `original_prompt` y `optimized_prompt`
- [ ] Usar Gemini para auto-optimizar prompts
- [ ] Reducir tokens innecesarios
- [ ] Logging de ahorro

**Estimación:** 2-3 horas

---

#### 3.3 Batch Optimization
- [ ] Detectar prompts similares
- [ ] Agrupar en un solo batch
- [ ] Dividir resultados
- [ ] Performance: 3x más rápido

**Estimación:** 4-5 horas

---

### FASE 4: Streaming & Webhooks (Semana 4-5) - ⏳ PENDIENTE

**Objetivo:** Respuestas en tiempo real y notificaciones

**Tareas:**

#### 4.1 Streaming Responses
- [ ] Implementar Server-Sent Events (SSE)
- [ ] Cambiar endpoints a `EventSourceResponse`
- [ ] Cliente recibe tokens conforme se generan
- [ ] Reducir tiempo percibido

**Archivo:** `backend/app/api/ai_agents_streaming.py` (200 líneas)

```python
@router.post("/gemini/stream")
async def invoke_gemini_stream(request: GeminiRequest):
    async def event_generator():
        async for chunk in gateway.stream_gemini(request.prompt):
            yield f"data: {chunk}\n\n"

    return EventSourceResponse(event_generator())
```

**Estimación:** 4 horas

---

#### 4.2 Webhooks
- [ ] Crear modelo: `AIWebhook` en models.py
- [ ] Campos: url, events, active
- [ ] Enviar notificación cuando:
  - [ ] Invocación completada
  - [ ] Error ocurrido
  - [ ] Budget excedido
- [ ] Retry logic con exponential backoff

**Estimación:** 5 horas

---

### FASE 5: Más Proveedores IA (Semana 5-6) - ⏳ PENDIENTE

**Objetivo:** Soporte para más IA systems

**Tareas:**

#### 5.1 Mistral AI
- [ ] Crear: `invoke_mistral(prompt)`
- [ ] API key: MISTRAL_API_KEY en .env
- [ ] Endpoint: /api/ai/mistral
- [ ] Tests

**Estimación:** 2 horas

---

#### 5.2 LLaMA (local via Ollama)
- [ ] Crear: `invoke_llama_local(prompt)`
- [ ] Requiere: Ollama running locally
- [ ] Endpoint: /api/ai/llama
- [ ] Health check para Ollama

**Estimación:** 3 horas

---

#### 5.3 AWS Bedrock
- [ ] Soporte para: Claude, Titan, Stability models
- [ ] Crear: `invoke_bedrock(model_id, prompt)`
- [ ] Endpoint: /api/ai/bedrock
- [ ] Cost tracking para AWS

**Estimación:** 4 horas

---

#### 5.4 Azure OpenAI
- [ ] Usar: deployment_id en lugar de model_id
- [ ] Crear: `invoke_azure_openai(prompt)`
- [ ] Variables de config: AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_KEY
- [ ] Endpoint: /api/ai/azure

**Estimación:** 3 horas

---

### FASE 6: Analytics & Dashboard (Semana 6-7) - ⏳ PENDIENTE

**Objetivo:** Monitoreo y análisis de uso

**Tareas:**

#### 6.1 Analytics Backend
- [ ] Crear: `backend/app/api/analytics.py`
- [ ] Endpoints:
  - [ ] GET /api/analytics/usage (por usuario, provider, fecha)
  - [ ] GET /api/analytics/cost (gastos totales, por provider)
  - [ ] GET /api/analytics/performance (latencia, éxito/error)
- [ ] Agregar campos: provider, tokens, cost, latency

**Estimación:** 5 horas

---

#### 6.2 Admin Dashboard (Frontend)
- [ ] Crear: `frontend/app/(dashboard)/admin/ai-analytics/page.tsx`
- [ ] Gráficos:
  - [ ] Uso por provider (pie chart)
  - [ ] Costo por día (line chart)
  - [ ] Latencia promedio (bar chart)
  - [ ] Tasa de éxito/error (gauge)
- [ ] Filtros: fecha, usuario, provider
- [ ] Exportar a CSV

**Estimación:** 8 horas

---

#### 6.3 User Dashboard
- [ ] Crear: `frontend/app/(dashboard)/ai-usage/page.tsx`
- [ ] Mostrar:
  - [ ] Mi uso (llamadas, tokens)
  - [ ] Mi gasto (USD totales)
  - [ ] Mi presupuesto (% usado)
  - [ ] Historial de invocaciones

**Estimación:** 6 horas

---

### FASE 7: Integration Tests (Semana 7-8) - ⏳ PENDIENTE

**Objetivo:** E2E tests completos

**Tareas:**

#### 7.1 E2E Tests con Playwright
- [ ] Crear: `tests/e2e/ai-gateway.spec.ts`
- [ ] Tests:
  - [ ] Login → Invoke Gemini → Verify response
  - [ ] Batch invocation → Parallel execution
  - [ ] Rate limiting → Get 429 after limit
  - [ ] Cost tracking → Verify logged
  - [ ] Cache hit → Same prompt returns cached

**Estimación:** 6 horas

---

#### 7.2 Load Testing
- [ ] Crear: `tests/load/ai_gateway_load.py`
- [ ] Simular:
  - [ ] 100 concurrent users
  - [ ] 1000 requests
  - [ ] Measure latency, errors, throughput
- [ ] Usar: `locust` framework

**Estimación:** 4 horas

---

#### 7.3 Cost Testing
- [ ] Mock API calls
- [ ] Verify cost calculations
- [ ] Test budget enforcement
- [ ] 100% coverage

**Estimación:** 3 horas

---

### FASE 8: Production Hardening (Semana 8-9) - ⏳ PENDIENTE

**Objetivo:** Production-ready y resiliente

**Tareas:**

#### 8.1 Error Handling Improvements
- [ ] Retry logic con exponential backoff
- [ ] Circuit breaker pattern
- [ ] Fallback providers (si Gemini falla, intentar OpenAI)
- [ ] Graceful degradation

**Estimación:** 5 horas

---

#### 8.2 Security Hardening
- [ ] API key rotation
- [ ] Rate limiting by IP + user
- [ ] Request signing/validation
- [ ] Audit logging

**Estimación:** 6 horas

---

#### 8.3 Monitoring & Alerting
- [ ] Prometheus metrics export
- [ ] Grafana dashboards
- [ ] Alerts:
  - [ ] Error rate > 5%
  - [ ] Latency > 30s
  - [ ] Cost > budget
- [ ] PagerDuty integration

**Estimación:** 8 horas

---

#### 8.4 Documentation Updates
- [ ] API docs (Swagger)
- [ ] Architecture diagrams
- [ ] Deployment guide
- [ ] Troubleshooting guide

**Estimación:** 4 horas

---

### FASE 9: Advanced Features (Semana 10+) - ⏳ PENDIENTE

**Objetivo:** Características avanzadas

**Tareas:**

#### 9.1 Prompt Chaining
- [ ] Ejecutar N prompts en secuencia
- [ ] Output de N-1 como input de N
- [ ] Error handling para cadenas

```python
result = await gateway.chain_invoke([
    {"provider": "gemini", "prompt": "Generate code"},
    {"provider": "openai", "prompt": "Review: {result_1}"},
    {"provider": "claude", "prompt": "Explain: {result_2}"}
])
```

**Estimación:** 4 horas

---

#### 9.2 Conditional Logic
- [ ] Si respuesta contiene error → reintentar con otro provider
- [ ] Si tokens > threshold → usar modelo más barato
- [ ] Si latencia > threshold → usar cache

**Estimación:** 3 horas

---

#### 9.3 Custom Agents
- [ ] Permitir usuarios crear agentes personalizados
- [ ] Sistema de template
- [ ] Persistencia en DB
- [ ] Version control

**Estimación:** 8 horas

---

#### 9.4 Fine-tuning Support
- [ ] Capacidad de fine-tunear modelos
- [ ] Almacenar dataset de entrenamiento
- [ ] Tracking de modelos custom
- [ ] Cost accounting

**Estimación:** 10 horas

---

## 📊 Timeline Sugerido

| Fase | Duración | Inicio | Fin | Prioridad |
|------|----------|--------|-----|-----------|
| **1: Fundamentos** | ✅ Completada | 2025-11-09 | 2025-11-16 | ✅ |
| **2: Rate Limiting** | 1-2 semanas | 2025-11-16 | 2025-11-30 | 🔴 Alta |
| **3: Caching** | 1 semana | 2025-11-30 | 2025-12-07 | 🟡 Media |
| **4: Streaming** | 1 semana | 2025-12-07 | 2025-12-14 | 🟡 Media |
| **5: Más Proveedores** | 1-2 semanas | 2025-12-14 | 2025-12-28 | 🟢 Baja |
| **6: Analytics** | 1-2 semanas | 2025-12-28 | 2026-01-11 | 🟡 Media |
| **7: Tests** | 1 semana | 2026-01-11 | 2026-01-18 | 🔴 Alta |
| **8: Production** | 1-2 semanas | 2026-01-18 | 2026-02-01 | 🔴 Alta |
| **9: Advanced** | Ongoing | 2026-02-01 | TBD | 🟢 Baja |

---

## 🎯 Prioridades

### 🔴 ALTA PRIORIDAD (Hazlo primero)

1. **Rate Limiting (FASE 2.1)** - Protege contra abuso
2. **Tests (FASE 7)** - Asegura calidad
3. **Production Hardening (FASE 8)** - Para producción
4. **Cost Control (FASE 2.2-2.3)** - Evita sorpresas

**Tiempo total:** 2-3 semanas
**Impacto:** Alto - Producción segura

---

### 🟡 MEDIA PRIORIDAD (Después)

1. **Caching (FASE 3)** - Mejora performance
2. **Analytics (FASE 6)** - Visibilidad
3. **Más Proveedores (FASE 5)** - Flexibilidad
4. **Streaming (FASE 4)** - UX mejorado

**Tiempo total:** 3-4 semanas
**Impacto:** Medio - Mejoras UX

---

### 🟢 BAJA PRIORIDAD (Futuro)

1. **Advanced Features (FASE 9)** - Nice-to-have
2. **Fine-tuning (FASE 9.4)** - Especialización

**Tiempo total:** Ongoing
**Impacto:** Bajo - Features avanzadas

---

## 📋 Checklist por Fase

### FASE 2: Rate Limiting

```
FASE 2.1: Rate Limiting por Usuario
- [ ] Instalar slowapi
- [ ] Crear rate_limiter.py
- [ ] Implementar en /api/ai/gemini (100/día)
- [ ] Implementar en /api/ai/openai (50/día)
- [ ] Implementar en /api/ai/claude (50/día)
- [ ] Tests (5+ casos)
- [ ] Documentación actualizada
- [ ] Commit & Push

FASE 2.2: Cost Tracking
- [ ] Crear modelo AIUsageLog
- [ ] Crear migración Alembic
- [ ] Crear endpoint GET /api/ai/usage
- [ ] Agregar middleware de logging
- [ ] Tests (5+ casos)
- [ ] Documentación
- [ ] Commit & Push

FASE 2.3: Budget Limits
- [ ] Crear modelo AIBudget
- [ ] Crear migración Alembic
- [ ] Validación pre-invocación
- [ ] Webhook cuando se acerca
- [ ] Tests (5+ casos)
- [ ] Documentación
- [ ] Commit & Push
```

---

### FASE 3: Caching

```
FASE 3.1: Response Caching
- [ ] Crear cache_service.py
- [ ] Implementar en AIGateway
- [ ] Cache key hashing
- [ ] TTL configurable
- [ ] Manual invalidation
- [ ] Tests (5+ casos)
- [ ] Commit & Push

FASE 3.2: Prompt Optimization
- [ ] Agregar campo optimized_prompt
- [ ] Crear optimizer function
- [ ] Tests de reducción de tokens
- [ ] Logging de ahorro
- [ ] Commit & Push

FASE 3.3: Batch Optimization
- [ ] Detección de prompts similares
- [ ] Agrupación inteligente
- [ ] División de resultados
- [ ] Perf tests (2x-3x improvement)
- [ ] Commit & Push
```

---

### FASE 4: Streaming

```
FASE 4.1: Streaming Responses
- [ ] Crear ai_agents_streaming.py
- [ ] Implementar EventSourceResponse
- [ ] Cambiar endpoint /gemini/stream
- [ ] Cliente React para SSE
- [ ] Tests
- [ ] Documentación
- [ ] Commit & Push

FASE 4.2: Webhooks
- [ ] Crear modelo AIWebhook
- [ ] Crear endpoint POST /api/ai/webhooks
- [ ] Implementar webhook delivery
- [ ] Retry logic (exponential backoff)
- [ ] Tests
- [ ] Commit & Push
```

---

## 🔗 Dependencias Entre Fases

```
FASE 1: Fundamentos ✅
    ↓
FASE 2: Rate Limiting (DEBE hacerse antes de FASE 3)
    ↓
FASE 3: Caching (Usa rate limiting)
    ↓
FASE 6: Analytics (Usa data de FASE 2)
    ↓
FASE 7: Tests (Testa todo)
    ↓
FASE 8: Production (Harden todo)

FASE 4: Streaming (Independiente)
FASE 5: Más Proveedores (Independiente, después FASE 8)
FASE 9: Advanced (Último, optional)
```

---

## 💻 Como Empezar Cada Fase

### Plantilla para iniciar FASE 2.1 (Rate Limiting):

```bash
# 1. Crear rama
git checkout -b claude/add-rate-limiting-SESSION_ID

# 2. Instalar dependencia
pip install slowapi
# En backend/requirements.txt: slowapi==0.1.9

# 3. Crear archivo
touch backend/app/core/rate_limiter.py

# 4. Implementar (ver plantilla abajo)

# 5. Actualizar endpoints
# En backend/app/api/ai_agents.py

# 6. Tests
touch backend/tests/test_rate_limiting.py

# 7. Commit
git add ...
git commit -m "feat: add rate limiting for AI Gateway endpoints"

# 8. Push
git push -u origin claude/add-rate-limiting-SESSION_ID
```

---

## 📝 Plantillas de Código

### Plantilla: Rate Limiter

```python
# backend/app/core/rate_limiter.py
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)

# En backend/app/api/ai_agents.py:
from app.core.rate_limiter import limiter

@router.post("/gemini")
@limiter.limit("100/day")  # 100 calls per day
async def invoke_gemini(...):
    ...
```

---

### Plantilla: Cache Service

```python
# backend/app/services/cache_service.py
import redis
import hashlib
import json

class CacheService:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.ttl = 86400 * 7  # 7 days

    async def get(self, key: str):
        return await self.redis.get(key)

    async def set(self, key: str, value: str, ttl: int = None):
        await self.redis.setex(key, ttl or self.ttl, value)

    @staticmethod
    def make_key(provider: str, prompt: str, model: str = "", temp: float = 0.7) -> str:
        content = f"{provider}:{prompt}:{model}:{temp}"
        return hashlib.md5(content.encode()).hexdigest()

# En ai_gateway.py:
cache = CacheService(redis_client)
cache_key = CacheService.make_key("gemini", prompt)
cached = await cache.get(cache_key)
if cached:
    return cached
result = await invoke_gemini(...)
await cache.set(cache_key, result)
```

---

### Plantilla: Cost Tracking Model

```python
# backend/app/models/models.py
class AIUsageLog(Base):
    __tablename__ = "ai_usage_logs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    provider = Column(String, nullable=False)  # gemini, openai, claude
    prompt_tokens = Column(Integer)
    response_tokens = Column(Integer)
    cost_usd = Column(Float)
    latency_ms = Column(Integer)
    status = Column(String, default="success")  # success, error
    error_message = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
```

---

## 📊 Estimaciones de Esfuerzo

| Tarea | Horas | Dificultad | Personas |
|-------|-------|-----------|----------|
| FASE 2.1: Rate Limiting | 3 | Media | 1 |
| FASE 2.2: Cost Tracking | 4 | Media | 1 |
| FASE 2.3: Budget Limits | 3 | Media | 1 |
| FASE 3.1: Caching | 4 | Media | 1 |
| FASE 3.2: Optimization | 3 | Difícil | 1 |
| FASE 3.3: Batch Opt | 5 | Difícil | 1 |
| FASE 4.1: Streaming | 4 | Media | 1 |
| FASE 4.2: Webhooks | 5 | Media | 1 |
| FASE 5.x: Más Providers | 12 | Fácil | 1 |
| FASE 6.1: Analytics | 5 | Media | 1 |
| FASE 6.2: Admin Dashboard | 8 | Media | 1-2 |
| FASE 6.3: User Dashboard | 6 | Fácil | 1 |
| FASE 7.1: E2E Tests | 6 | Media | 1 |
| FASE 7.2: Load Tests | 4 | Difícil | 1 |
| FASE 7.3: Cost Tests | 3 | Media | 1 |
| FASE 8.x: Production | 23 | Difícil | 1-2 |
| FASE 9.x: Advanced | 25+ | Muy Difícil | 2+ |
| **TOTAL** | **148** | **Media** | **1-2** |

**Tiempo total:** 2-3 meses a ritmo de 40h/semana

---

## 🚀 Quick Start para Próxima Sesión

Cuando vuelvas a trabajar en esto:

1. **Lee este archivo** (5 min)
2. **Elige una FASE** (recomendado: FASE 2 - Rate Limiting)
3. **Lee el Checklist** de esa fase
4. **Sigue el template** de código
5. **Implementa** la tarea
6. **Tests**
7. **Commit & Push**

---

## 📞 Notas Importantes

### NO HAGAS ESTO (Evita)

```
❌ NO cambies las funciones de AIGateway existentes
❌ NO borres código anterior
❌ NO modifiques .cursorrules o .claude/CLAUDE.md
❌ NO cambies versiones de dependencias (FastAPI 0.115.6, etc.)
```

### SIEMPRE HACES ESTO

```
✅ Crea rama: claude/description-SESSION_ID
✅ Commits descriptivos: feat:, fix:, docs:
✅ Tests ANTES de commit
✅ Documentación DURANTE implementación
✅ Push a rama feature (NO a main)
```

---

## 📈 Success Metrics

Cuando completes cada fase:

| Métrica | FASE 1 | FASE 2 | FASE 3 | FASE 4 |
|---------|--------|--------|--------|--------|
| **Tests** | 25+ | 40+ | 55+ | 70+ |
| **Code Coverage** | 85% | 90% | 92% | 95% |
| **Latency** | 5-8s | 5-8s | 2-4s | 1-2s |
| **Cost/call** | $0.10 | $0.10 | $0.07 | $0.07 |
| **Documentation** | 100% | 100% | 100% | 100% |

---

## 🎯 Goal Final

**Al completar todas las fases:**

✅ Sistema multi-IA production-ready
✅ Rate limiting & cost control
✅ Caching & optimization
✅ Streaming responses
✅ 5+ proveedores soportados
✅ Analytics dashboard completo
✅ 95%+ test coverage
✅ Completamente documentado
✅ Listo para escala empresarial

---

**¡Documenta aquí todas tus ideas y vuelve cuando estés listo para implementar!** 🚀

Última actualización: 2025-11-16
