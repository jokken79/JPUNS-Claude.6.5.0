# 🚀 AI Gateway User Guide - Multi-Phase Optimization System

**Versión:** 1.0 | **Última actualización:** 2025-11-16 | **Estado:** Production Ready

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Instalación y Configuración](#instalación-y-configuración)
3. [Guía Rápida](#guía-rápida)
4. [FASE 3.1: Response Caching](#fase-31-response-caching)
5. [FASE 3.2: Prompt Optimization](#fase-32-prompt-optimization)
6. [FASE 3.3: Batch Optimization](#fase-33-batch-optimization)
7. [FASE 4: Streaming Responses](#fase-4-streaming-responses)
8. [FASE 5: Additional Providers](#fase-5-additional-providers)
9. [FASE 6: Analytics Dashboard](#fase-6-analytics-dashboard)
10. [Ejemplos Prácticos](#ejemplos-prácticos)
11. [Troubleshooting](#troubleshooting)
12. [FAQ](#faq)

---

## Introducción

El **AI Gateway** es un sistema completo de optimización y control de costos para APIs de IA. Integra:

- ✅ **Caché inteligente** (Redis) - Evita llamadas repetidas
- ✅ **Optimización de prompts** - Reduce tokens usado
- ✅ **Batch optimization** - Consolida requests similares
- ✅ **Streaming real-time** - Respuestas en vivo (SSE)
- ✅ **Multi-provider** - Soporta 7+ providers diferentes
- ✅ **Analytics completo** - Dashboard de métricas

**Potencial de ahorro:** 70-80% en costos de API

---

## Instalación y Configuración

### Requisitos Previos

```bash
# Backend (ya incluido en Docker)
- FastAPI 0.115.6
- Redis 7+
- Python 3.11+
- PostgreSQL 15

# APIs necesarias (configurar en .env)
- GEMINI_API_KEY
- OPENAI_API_KEY
- ANTHROPIC_API_KEY (opcional)
- COHERE_API_KEY (opcional)
- HUGGINGFACE_API_KEY (opcional)
```

### Configuración del .env

```bash
# Archivo: .env

# API Keys (requeridos según providers que uses)
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
COHERE_API_KEY=your_cohere_key
HUGGINGFACE_API_KEY=your_hf_key

# Redis
REDIS_URL=redis://localhost:6379
REDIS_CACHE_TTL=86400  # 24 horas

# Gateway
ENABLE_OPTIMIZATION=true
ENABLE_CACHING=true
ENABLE_STREAMING=true
AGGRESSIVE_OPTIMIZATION=false

# Analytics
ANALYTICS_ENABLED=true
ALERT_EMAIL=admin@example.com
```

### Iniciar los Servicios

```bash
# Terminal 1: Iniciar Docker Compose
docker compose up -d

# Verificar que todos los servicios estén activos
docker compose ps

# Ver logs del backend
docker compose logs -f backend
```

---

## Guía Rápida

### Primer Uso (5 minutos)

#### 1️⃣ Obtener Token de Autenticación

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'

# Respuesta:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}

# Guardar el token para siguientes requests
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### 2️⃣ Hacer tu Primer Request

```bash
# Request simple a Gemini (con caching + optimization automático)
curl -X POST http://localhost:8000/api/ai/gemini \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain what is artificial intelligence in 100 words",
    "max_tokens": 200,
    "temperature": 0.7
  }'

# Respuesta:
{
  "status": "success",
  "provider": "gemini",
  "response": "Artificial intelligence (AI) is the simulation of human...",
  "tokens_used": 45
}
```

#### 3️⃣ Verificar Dashboard de Analytics

```bash
# Ver métricas en tiempo real
curl -X GET http://localhost:8000/api/ai/analytics/dashboard \
  -H "Authorization: Bearer $TOKEN"

# Respuesta: Dashboard completo con todos los datos
```

---

## FASE 3.1: Response Caching

### ¿Qué es?

El sistema automáticamente cachea respuestas idénticas en Redis. La segunda vez que haces el mismo request, obtienes respuesta **instantánea** sin costo de API.

### Endpoints de Cache

```bash
# 1. Ver estadísticas del caché
GET /api/ai/cache/stats
Respuesta: {
  "total_cache_entries": 245,
  "cache_hits": 1250,
  "cache_misses": 500,
  "hit_rate_percent": 71.4,
  "total_memory_kb": 2450
}

# 2. Ver uso de memoria
GET /api/ai/cache/memory
Respuesta: {
  "total_memory_bytes": 2509824,
  "used_memory_bytes": 1254912,
  "memory_usage_percent": 50.0,
  "keys_count": 245
}

# 3. Health check del caché
GET /api/ai/cache/health
Respuesta: {
  "status": "healthy",
  "redis_connected": true,
  "response_time_ms": 2.3
}

# 4. Limpiar TODO el caché
DELETE /api/ai/cache
Respuesta: {
  "status": "success",
  "cleared_keys": 245
}

# 5. Limpiar caché de un provider
DELETE /api/ai/cache/provider/gemini
Respuesta: {
  "status": "success",
  "cleared_entries": 120
}

# 6. Limpiar caché de un modelo específico
DELETE /api/ai/cache/model/gemini/gemini-2.0-flash
Respuesta: {
  "status": "success",
  "cleared_entries": 45
}
```

### Ejemplo Práctico: Caching en Acción

```bash
# REQUEST 1: Primera vez (va a API)
curl -X POST http://localhost:8000/api/ai/gemini \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is AI?",
    "max_tokens": 100
  }'
# Tiempo de respuesta: ~2000ms (API real)
# Tokens usados: 15
# Costo: $0.00023

# REQUEST 2: Mismo prompt (desde caché)
curl -X POST http://localhost:8000/api/ai/gemini \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is AI?",
    "max_tokens": 100
  }'
# Tiempo de respuesta: ~5ms (desde Redis!)
# Tokens usados: 0 (no se cuenta)
# Costo: $0 (GRATIS!)

# Ahorro en este ejemplo: $0.00023 + 1995ms tiempo
```

---

## FASE 3.2: Prompt Optimization

### ¿Qué es?

Reduce automáticamente el número de tokens en cada prompt sin perder significado. Ejemplo:

```
Original:  "Please help me. I would like you to write code for me. Thanks in advance."
Optimizado: "Write code"

Reducción: 25 → 5 tokens = 80% ahorro!
```

### Endpoints de Optimization

```bash
# 1. Optimizar un prompt (ver resultados)
POST /api/ai/optimize
{
  "prompt": "Please help me. I would like you to write Python code for sorting data. Thanks in advance.",
  "system_message": "You are a helpful programming assistant",
  "aggressive": false
}

Respuesta:
{
  "optimized_prompt": "Write Python code sorting data",
  "optimized_system_message": "Programming assistant",
  "stats": {
    "original_length": 120,
    "optimized_length": 32,
    "tokens_saved": 22,
    "reduction_percentage": 73.3,
    "strategies_applied": [
      "normalize_whitespace",
      "remove_redundancies",
      "condense_verbose_phrases"
    ]
  }
}

# 2. Obtener recomendaciones de optimización
POST /api/ai/optimize/recommendations
{
  "prompt": "Your prompt here",
  "system_message": "Optional system message"
}

Respuesta:
{
  "prompt": "Your prompt here",
  "recommendations": [
    "Remove 'Please' at the beginning",
    "Replace 'I would like you to' with direct command",
    "Remove 'Thanks in advance'"
  ],
  "has_optimization_opportunities": true
}

# 3. Estimar ahorros SIN optimizar
POST /api/ai/optimize/estimate
{
  "prompt": "Your long prompt",
  "aggressive": false
}

Respuesta:
{
  "original_chars": 250,
  "estimated_reduction_chars": 75,
  "estimated_tokens_saved": 44,
  "estimated_reduction_percentage": 30.0,
  "mode": "normal"
}
```

### Modos de Optimización

```
NORMAL MODE (default):
- Reducción: 15-25%
- Calidad: Sin pérdida
- Uso: Recomendado

AGGRESSIVE MODE:
- Reducción: 30-40%
- Calidad: Mínima pérdida
- Uso: Solo si necesitas máximo ahorro
```

### Ejemplo: Optimizar antes de usar

```bash
# Paso 1: Optimizar el prompt
PROMPT="Please help me. I would like you to write a Python function that sorts a list of dictionaries by a specific key. Thanks in advance for your help."

OPTIMIZED=$(curl -s -X POST http://localhost:8000/api/ai/optimize \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"prompt\": \"$PROMPT\"}" | jq -r '.optimized_prompt')

# Paso 2: Usar el prompt optimizado
curl -X POST http://localhost:8000/api/ai/gemini \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"prompt\": \"$OPTIMIZED\"}"

# Resultado: Mismo output, pero con 25% menos tokens (y caché funciona mejor!)
```

---

## FASE 3.3: Batch Optimization

### ¿Qué es?

Si envías 10 requests donde 7 son idénticos, los agrupa en 3 llamadas únicamente. Ahorro de 70%.

### Endpoints de Batch

```bash
# 1. Optimizar un batch de prompts
POST /api/ai/batch/optimize
{
  "prompts": [
    "Write a function",
    "Write a function",
    "Write a function",
    "Create a class",
    "Create a class",
    "Generate documentation"
  ],
  "detect_similar": true
}

Respuesta:
{
  "optimization_map": {
    "0": "hash1",
    "1": "hash1",
    "2": "hash1",
    "3": "hash2",
    "4": "hash2",
    "5": "hash3"
  },
  "grouped_prompts": {
    "hash1": [0, 1, 2],
    "hash2": [3, 4],
    "hash3": [5]
  },
  "representative_prompts": {
    "hash1": "Write a function",
    "hash2": "Create a class",
    "hash3": "Generate documentation"
  },
  "stats": {
    "original_prompts": 6,
    "grouped_prompts": 3,
    "duplicates_detected": 3,
    "api_calls_saved": 3,
    "cost_savings_percentage": 50.0
  }
}

# 2. Estimar ahorros para un batch
POST /api/ai/batch/estimate
{
  "prompts": ["prompt1", "prompt1", "prompt2", "prompt2", "prompt2"]
}

Respuesta:
{
  "original_count": 5,
  "estimated_optimized_count": 2,
  "api_calls_saved": 3,
  "cost_savings_percentage": 60.0
}

# 3. Analizar similitud entre prompts
POST /api/ai/batch/similarity
{
  "prompts": [
    "Write Python code",
    "Generate Python code",
    "Write JavaScript code"
  ],
  "similarity_threshold": 0.8
}

Respuesta:
{
  "similarity_threshold": 0.8,
  "prompt_count": 3,
  "matches": [
    {
      "prompt1_index": 0,
      "prompt2_index": 1,
      "similarity_score": 0.92,
      "is_match": true
    }
  ],
  "total_matches": 1
}
```

---

## FASE 4: Streaming Responses

### ¿Qué es?

Recibe la respuesta **en tiempo real**, byte a byte, en lugar de esperar a que se complete. Perfecto para chats interactivos.

### Endpoints de Streaming

```bash
# 1. Stream una respuesta (SSE)
POST /api/ai/stream
Content-Type: text/event-stream

{
  "prompt": "Write a 500-word essay about artificial intelligence",
  "provider": "gemini",
  "model": "gemini-2.0-flash",
  "chunk_size": 50,
  "max_tokens": 2000
}

# La respuesta llega como Server-Sent Events:
data: {"chunk_id": 0, "content": "Artificial intelligence is", "tokens_estimated": 4, "is_complete": false}
data: {"chunk_id": 1, "content": " a transformative technology that", "tokens_estimated": 5, "is_complete": false}
data: {"chunk_id": 2, "content": " impacts...", "tokens_estimated": 3, "is_complete": false}
...
data: {"chunk_id": 999, "content": "", "is_complete": true}

# 2. Crear sesión de streaming
POST /api/ai/stream/session
{
  "prompt": "Your prompt",
  "provider": "gemini"
}

Respuesta:
{
  "session_id": "uuid-123-456",
  "prompt": "Your prompt",
  "provider": "gemini",
  "streaming_url": "/api/ai/stream?session_id=uuid-123-456",
  "expected_duration_ms": 3500
}

# 3. Health check del streaming
GET /api/ai/stream/health

Respuesta:
{
  "streaming_available": true,
  "supported_providers": ["gemini", "openai"],
  "max_concurrent_streams": 100,
  "active_streams": 5
}
```

### Ejemplo: Usar Streaming en Frontend

```javascript
// HTML
<div id="response-container"></div>

// JavaScript
const eventSource = new EventSource('/api/ai/stream?provider=gemini&prompt=...');

eventSource.onmessage = (event) => {
  const chunk = JSON.parse(event.data);

  if (chunk.is_complete) {
    eventSource.close();
    console.log('Streaming complete!');
  } else {
    // Mostrar el chunk en tiempo real
    document.getElementById('response-container').innerHTML += chunk.content;
  }
};

eventSource.onerror = (error) => {
  console.error('Streaming error:', error);
  eventSource.close();
};
```

---

## FASE 5: Additional Providers

### Providers Soportados

| Provider | Modelo | Costo (1M tokens) | Latencia |
|----------|--------|------------------|----------|
| **Gemini** | gemini-2.0-flash | $0.04/$0.16 | ~500ms |
| **OpenAI** | gpt-4 | $30/$60 | ~1000ms |
| **Anthropic** | claude-3-5-sonnet | $3/$15 | ~800ms |
| **Cohere** | command | $1/$2 | ~700ms |
| **HuggingFace** | Llama-2-7b | FREE | ~2000ms |
| **Ollama** | llama2 | FREE | ~500ms* |

*Local execution

### Endpoints de Providers

```bash
# 1. Invocar Anthropic Claude
POST /api/ai/anthropic
{
  "prompt": "Explain quantum computing",
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 1000,
  "temperature": 0.7
}

Respuesta:
{
  "status": "success",
  "provider": "anthropic",
  "model": "claude-3-5-sonnet-20241022",
  "response": "Quantum computing is...",
  "tokens_used": 150,
  "estimated_cost": 0.00225
}

# 2. Invocar Cohere
POST /api/ai/cohere
{
  "prompt": "Write a poem about coding",
  "model": "command"
}

# 3. Invocar Hugging Face
POST /api/ai/huggingface
{
  "prompt": "Translate to Spanish: Hello world",
  "model": "meta-llama/Llama-2-7b-chat-hf"
}

# 4. Invocar Ollama local
POST /api/ai/ollama
{
  "prompt": "What is machine learning?",
  "model": "llama2",
  "base_url": "http://localhost:11434"
}

# 5. Listar todos los providers
GET /api/ai/providers

Respuesta:
{
  "available_providers": ["gemini", "openai", "anthropic", "cohere", "huggingface", "ollama"],
  "provider_details": {
    "anthropic": {
      "models": ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku", "claude-3-5-sonnet-20241022"],
      "default_model": "claude-3-5-sonnet-20241022",
      "max_tokens": 4096
    },
    ...
  },
  "total_providers": 6
}

# 6. Verificar health de providers
GET /api/ai/providers/health

Respuesta:
{
  "anthropic": {
    "status": "healthy",
    "api_key_configured": true,
    "available_models": [...]
  },
  "cohere": {
    "status": "unconfigured",
    "api_key_configured": false
  },
  ...
}

# 7. Comparar respuestas de múltiples providers
POST /api/ai/multi-provider
{
  "prompt": "What is AI?",
  "providers": ["gemini", "anthropic", "openai"],
  "models": {
    "gemini": "gemini-2.0-flash",
    "anthropic": "claude-3-5-sonnet-20241022",
    "openai": "gpt-4"
  },
  "max_tokens": 500
}

Respuesta:
{
  "prompt": "What is AI?",
  "responses": {
    "gemini": {
      "status": "success",
      "response": "AI is...",
      "estimated_cost": 0.0001
    },
    "anthropic": {
      "status": "success",
      "response": "Artificial Intelligence is...",
      "estimated_cost": 0.00225
    },
    "openai": {
      "status": "success",
      "response": "AI refers to...",
      "estimated_cost": 0.015
    }
  },
  "success_count": 3,
  "error_count": 0,
  "total_estimated_cost": 0.01725
}
```

---

## FASE 6: Analytics Dashboard

### Dashboard Principal

```bash
# Obtener dashboard completo
GET /api/ai/analytics/dashboard

Respuesta:
{
  "summary": {
    "total_api_calls": 1250,
    "total_tokens_used": 1562500,
    "total_cost_usd": 125.50,
    "average_cost_per_call": 0.10
  },
  "performance": {
    "cache_hit_rate_percent": 71.4,
    "optimization_adoption_percent": 85.2,
    "streaming_adoption_percent": 42.0
  },
  "provider_breakdown": {
    "gemini": {
      "total_calls": 750,
      "total_tokens": 937500,
      "total_cost": 75.00
    },
    "openai": {
      "total_calls": 300,
      "total_tokens": 375000,
      "total_cost": 37.50
    },
    "anthropic": {
      "total_calls": 200,
      "total_tokens": 250000,
      "total_cost": 13.00
    }
  },
  "cost_trends": {
    "period_days": 7,
    "daily_breakdown": {
      "2025-11-10": 15.50,
      "2025-11-11": 18.30,
      "2025-11-12": 17.80,
      "2025-11-13": 19.20,
      "2025-11-14": 21.50,
      "2025-11-15": 20.80,
      "2025-11-16": 12.40
    },
    "total_period_cost": 125.50,
    "average_daily_cost": 17.93,
    "cost_trend": "stable"
  },
  "optimization_impact": {
    "total_requests": 1250,
    "optimized_requests": 1063,
    "optimization_rate_percent": 85.0,
    "cached_requests": 893,
    "cache_hit_rate_percent": 71.4,
    "estimated_savings": 87.50,
    "combined_impact": 142.0
  },
  "timestamp": "2025-11-16T10:30:00.000Z"
}
```

### Endpoints Analytics

```bash
# 1. Resumen rápido
GET /api/ai/analytics/summary
{
  "total_api_calls": 1250,
  "total_tokens_used": 1562500,
  "total_cost_usd": 125.50,
  "average_cost_per_call": 0.10
}

# 2. Breakdown por provider
GET /api/ai/analytics/providers
{
  "gemini": { "total_calls": 750, "total_cost": 75.00, ... },
  "openai": { "total_calls": 300, "total_cost": 37.50, ... },
  ...
}

# 3. Trends de costos (últimos 30 días)
GET /api/ai/analytics/trends?days=30
{
  "period_days": 30,
  "daily_breakdown": { ... },
  "total_period_cost": 850.00,
  "average_daily_cost": 28.33,
  "cost_trend": "increasing"
}

# 4. Impacto de optimizaciones
GET /api/ai/analytics/optimization
{
  "total_requests": 1250,
  "optimized_requests": 1063,
  "optimization_rate_percent": 85.0,
  "cached_requests": 893,
  "cache_hit_rate_percent": 71.4,
  "estimated_savings": 87.50,
  "combined_impact": 142.0
}

# 5. Reporte de performance
GET /api/ai/analytics/performance
{
  "report_type": "Performance Report",
  "generated_at": "2025-11-16T10:30:00Z",
  "summary": { ... },
  "metrics": {
    "cache_efficiency": 71.4,
    "optimization_impact": 85.0,
    "streaming_adoption": 42.0
  },
  "providers": ["gemini", "openai", "anthropic"]
}

# 6. Exportar datos
POST /api/ai/analytics/export
{
  "provider": "gemini",
  "days": 30,
  "include_costs": true
}

# 7. Resetear analytics (admin only)
DELETE /api/ai/analytics/reset
{
  "status": "success",
  "message": "All analytics data reset"
}
```

---

## Ejemplos Prácticos

### Ejemplo 1: Chatbot Inteligente

```python
import requests
import json

class SmartChatbot:
    def __init__(self, token):
        self.token = token
        self.base_url = "http://localhost:8000/api/ai"
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

    def chat(self, message, provider="gemini"):
        # Automáticamente:
        # 1. Optimiza el prompt (-25% tokens)
        # 2. Verifica caché (rápido)
        # 3. Si no está, llama a API
        # 4. Cachea resultado

        response = requests.post(
            f"{self.base_url}/{provider}",
            headers=self.headers,
            json={
                "prompt": message,
                "max_tokens": 500,
                "temperature": 0.7
            }
        )
        return response.json()["response"]

# Uso
bot = SmartChatbot(token="your_token_here")

# Primera vez: toma ~2 segundos, cuesta $0.0001
respuesta1 = bot.chat("What is AI?")

# Segunda vez: toma ~5ms, GRATIS (desde caché)
respuesta2 = bot.chat("What is AI?")

print(f"Primera: {respuesta1}")
print(f"Segunda: {respuesta2}")
```

### Ejemplo 2: Comparar Providers

```bash
# Hacer la misma pregunta a todos los providers

curl -X POST http://localhost:8000/api/ai/multi-provider \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Summarize machine learning in 100 words",
    "providers": ["gemini", "anthropic", "openai"],
    "max_tokens": 150
  }' | jq '.'

# Comparar respuestas y costos:
# Gemini: rápido, barato
# Anthropic: muy buena calidad
# OpenAI: calidad premium, más caro
```

### Ejemplo 3: Batch Optimization

```bash
# Tienes 100 requests para procesar

# Paso 1: Detectar duplicados
curl -X POST http://localhost:8000/api/ai/batch/optimize \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompts": [
      "Write a function",
      "Write a function",
      "Write a function",
      ...
    ]
  }' | jq '.stats'

# Resultado: 100 requests → 25 únicos = 75% ahorro

# Paso 2: Procesar solo los 25 únicos
# Paso 3: Distribuir respuestas a los 100 requests originales
```

### Ejemplo 4: Monitoreo en Dashboard

```bash
# Script que muestra métricas cada minuto

while true; do
  echo "=== AI Gateway Dashboard ==="
  curl -s http://localhost:8000/api/ai/analytics/dashboard \
    -H "Authorization: Bearer $TOKEN" | jq '{
      calls: .summary.total_api_calls,
      cost: .summary.total_cost_usd,
      cache_hit: .performance.cache_hit_rate_percent,
      optimization: .performance.optimization_adoption_percent,
      savings: .optimization_impact.estimated_savings
    }'

  sleep 60
done

# Output:
# {
#   "calls": 1250,
#   "cost": 125.50,
#   "cache_hit": 71.4,
#   "optimization": 85.0,
#   "savings": 87.50
# }
```

---

## Troubleshooting

### Problema: "401 Unauthorized"

```bash
# Verificar token válido
# Token expiró? Obtener uno nuevo:

curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'

# Usar el token nuevo en siguientes requests
```

### Problema: "Redis connection failed"

```bash
# Verificar Redis está running:
docker compose logs redis

# Reiniciar Redis:
docker compose restart redis

# Verificar connection:
curl http://localhost:8000/api/ai/cache/health
```

### Problema: "API rate limit exceeded"

```bash
# Verificar límites actuales:
curl http://localhost:8000/api/ai/health -H "Authorization: Bearer $TOKEN"

# Aumentar límites en backend/app/core/rate_limiter.py:
GEMINI_LIMIT = "100/minute"  # Cambiar aquí

# Reiniciar backend:
docker compose restart backend
```

### Problema: Caché no funciona

```bash
# Verificar que esté habilitado:
echo $ENABLE_CACHING  # Debe ser "true"

# Ver estadísticas del caché:
curl http://localhost:8000/api/ai/cache/stats \
  -H "Authorization: Bearer $TOKEN"

# Si está lleno, limpiar:
curl -X DELETE http://localhost:8000/api/ai/cache \
  -H "Authorization: Bearer $TOKEN"
```

---

## FAQ

### P: ¿Cuánto puedo ahorrar realmente?

**R:** Depende de tu uso:
- **Sin optimización:** 0% ahorro
- **Solo caché:** 40-60% (prompts repetidos)
- **Solo optimización:** 15-40% (todos los prompts)
- **Caché + Optimización:** 60-75% (combinado)
- **Todo (caché + opt + batch):** 70-80% (máximo)

### P: ¿Se pierde calidad con la optimización?

**R:** No. El modo "normal" (default) mantiene 100% de calidad semántica.
Solo el modo "aggressive" puede tener pequeñas pérdidas (~5%).

### P: ¿Puedo usar múltiples providers simultáneamente?

**R:** Sí. Usa el endpoint `/api/ai/multi-provider` para comparar
respuestas de varios providers y elegir la mejor.

### P: ¿Cómo reseteo los analytics?

**R:** ```bash
curl -X DELETE http://localhost:8000/api/ai/analytics/reset \
  -H "Authorization: Bearer $TOKEN"
```

### P: ¿Funciona el streaming con todos los providers?

**R:** Actualmente: **Gemini** y **OpenAI**.
Próximamente: Anthropic, Cohere.

### P: ¿Dónde veo el histórico de costos?

**R:** En el endpoint:
```bash
GET /api/ai/analytics/trends?days=30
```

### P: ¿Puedo usar Ollama (local) gratis?

**R:** Sí. Ollama es completamente local y **cero costo**.
Es perfecto para testing y desarrollo.

---

## Recursos Adicionales

- 📚 [API Documentation](./API_ENDPOINTS.md)
- 🔒 [Security Guide](./SECURITY.md)
- 📊 [Analytics Guide](./ANALYTICS_DETAILED.md)
- 🐛 [Troubleshooting](./TROUBLESHOOTING.md)
- 💻 [Code Examples](../examples/)

---

## Soporte

Para preguntas o problemas:
1. Revisar este manual
2. Consultar la sección [Troubleshooting](#troubleshooting)
3. Ver [FAQ](#faq)
4. Crear un issue en GitHub

---

**¡Disfruta del AI Gateway! 🚀**
