# 📡 AI Gateway - API Endpoints Reference

**URL Base:** `http://localhost:8000/api/ai`
**Auth:** Todos los endpoints requieren `Authorization: Bearer {token}`

---

## 🔐 Authentication

### Login
```
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}

Response:
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

---

## 🚀 Core Invocation

### Gemini
```
POST /gemini
{
  "prompt": "string",
  "max_tokens": 4096,
  "temperature": 0.7,
  "system_instruction": "string (optional)"
}
```

### OpenAI
```
POST /openai
{
  "prompt": "string",
  "model": "gpt-4-turbo-preview",
  "max_tokens": 4096,
  "temperature": 0.7,
  "system_message": "string (optional)"
}
```

### Anthropic Claude
```
POST /anthropic
{
  "prompt": "string",
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 4096,
  "temperature": 0.7,
  "system_message": "string (optional)"
}
```

### Cohere
```
POST /cohere
{
  "prompt": "string",
  "model": "command",
  "max_tokens": 4096,
  "temperature": 0.7
}
```

### Hugging Face
```
POST /huggingface
{
  "prompt": "string",
  "model": "meta-llama/Llama-2-7b-chat-hf",
  "max_tokens": 1024,
  "temperature": 0.7
}
```

### Ollama (Local)
```
POST /ollama
{
  "prompt": "string",
  "model": "llama2",
  "max_tokens": 2048,
  "temperature": 0.7,
  "base_url": "http://localhost:11434"
}
```

### Zhipu GLM (Chinese AI)
```
POST /zhipu
{
  "prompt": "string",
  "model": "glm-4.6",
  "max_tokens": 4096,
  "temperature": 0.7,
  "system_message": "string (optional)"
}
```

**Available Models:**
- `glm-4.6` - Latest GLM model (recommended)
- `glm-4` - Standard GLM-4 model
- `glm-3.5-turbo` - Lightweight GLM model

### Multi-Provider Comparison
```
POST /multi-provider
{
  "prompt": "string",
  "providers": ["gemini", "anthropic", "openai"],
  "models": {
    "gemini": "gemini-2.0-flash",
    "anthropic": "claude-3-5-sonnet-20241022",
    "openai": "gpt-4"
  },
  "max_tokens": 1024,
  "temperature": 0.7
}
```

---

## 💾 Caching (FASE 3.1)

### Get Cache Statistics
```
GET /cache/stats

Response:
{
  "total_cache_entries": 245,
  "cache_hits": 1250,
  "cache_misses": 500,
  "hit_rate_percent": 71.4,
  "total_memory_kb": 2450
}
```

### Get Memory Usage
```
GET /cache/memory

Response:
{
  "total_memory_bytes": 2509824,
  "used_memory_bytes": 1254912,
  "memory_usage_percent": 50.0,
  "keys_count": 245
}
```

### Cache Health Check
```
GET /cache/health

Response:
{
  "status": "healthy",
  "redis_connected": true,
  "response_time_ms": 2.3
}
```

### Clear All Cache
```
DELETE /cache

Response:
{
  "status": "success",
  "cleared_keys": 245
}
```

### Clear Cache by Provider
```
DELETE /cache/provider/{provider}

Parameters:
- provider: gemini|openai|anthropic|cohere|huggingface

Response:
{
  "status": "success",
  "cleared_entries": 120
}
```

### Clear Cache by Model
```
DELETE /cache/model/{provider}/{model}

Response:
{
  "status": "success",
  "cleared_entries": 45
}
```

---

## ⚡ Optimization (FASE 3.2)

### Optimize Prompt
```
POST /optimize
{
  "prompt": "Please help me write code...",
  "system_message": "You are helpful (optional)",
  "aggressive": false
}

Response:
{
  "optimized_prompt": "Write code",
  "optimized_system_message": "Helpful assistant",
  "stats": {
    "original_length": 120,
    "optimized_length": 32,
    "tokens_saved": 22,
    "reduction_percentage": 73.3,
    "strategies_applied": ["normalize_whitespace", "remove_redundancies"]
  }
}
```

### Get Optimization Recommendations
```
POST /optimize/recommendations
{
  "prompt": "Your prompt here"
}

Response:
{
  "recommendations": [
    "Remove 'Please' at beginning",
    "Remove redundant words"
  ],
  "has_optimization_opportunities": true
}
```

### Estimate Savings
```
POST /optimize/estimate
{
  "prompt": "Your long prompt",
  "aggressive": false
}

Response:
{
  "original_chars": 250,
  "estimated_reduction_chars": 75,
  "estimated_tokens_saved": 44,
  "estimated_reduction_percentage": 30.0,
  "mode": "normal"
}
```

---

## 📦 Batch Optimization (FASE 3.3)

### Optimize Batch
```
POST /batch/optimize
{
  "prompts": ["prompt1", "prompt2", "prompt1"],
  "system_message": "optional",
  "detect_similar": true
}

Response:
{
  "optimization_map": {0: "hash1", 1: "hash2", 2: "hash1"},
  "grouped_prompts": {"hash1": [0,2], "hash2": [1]},
  "stats": {
    "original_prompts": 3,
    "grouped_prompts": 2,
    "api_calls_saved": 1,
    "cost_savings_percentage": 33.3
  }
}
```

### Estimate Batch Savings
```
POST /batch/estimate
{
  "prompts": ["prompt1", "prompt1", "prompt2"]
}

Response:
{
  "original_count": 3,
  "estimated_optimized_count": 2,
  "api_calls_saved": 1,
  "cost_savings_percentage": 33.3
}
```

### Analyze Similarity
```
POST /batch/similarity
{
  "prompts": ["Write code", "Generate code", "Write docs"],
  "similarity_threshold": 0.8
}

Response:
{
  "similarity_threshold": 0.8,
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

## 🌊 Streaming (FASE 4)

### Stream Response (SSE)
```
POST /stream
{
  "prompt": "Write essay about AI",
  "provider": "gemini",
  "model": "gemini-2.0-flash",
  "chunk_size": 50,
  "max_tokens": 2000
}

Response: Server-Sent Events
data: {"chunk_id": 0, "content": "AI is...", "is_complete": false}
data: {"chunk_id": 1, "content": " revolutionary", "is_complete": false}
...
data: {"chunk_id": 999, "is_complete": true}
```

### Create Streaming Session
```
POST /stream/session
{
  "prompt": "Your prompt",
  "provider": "gemini"
}

Response:
{
  "session_id": "uuid-123",
  "streaming_url": "/api/ai/stream?session_id=uuid-123",
  "expected_duration_ms": 3500
}
```

### Streaming Health
```
GET /stream/health

Response:
{
  "streaming_available": true,
  "supported_providers": ["gemini", "openai"],
  "max_concurrent_streams": 100,
  "active_streams": 5
}
```

---

## 📊 Analytics (FASE 6)

### Get Dashboard
```
GET /analytics/dashboard

Response: Complete dashboard with all metrics
{
  "summary": {...},
  "performance": {...},
  "provider_breakdown": {...},
  "cost_trends": {...},
  "optimization_impact": {...}
}
```

### Get Summary
```
GET /analytics/summary

Response:
{
  "total_api_calls": 1250,
  "total_tokens_used": 1562500,
  "total_cost_usd": 125.50,
  "average_cost_per_call": 0.10
}
```

### Get Provider Breakdown
```
GET /analytics/providers

Response:
{
  "gemini": {
    "total_calls": 750,
    "total_cost": 75.00,
    "success_rate": 99.5
  },
  "openai": {...}
}
```

### Get Cost Trends
```
GET /analytics/trends?days=30

Response:
{
  "period_days": 30,
  "daily_breakdown": {"2025-11-16": 12.40, ...},
  "total_period_cost": 850.00,
  "average_daily_cost": 28.33,
  "cost_trend": "stable"
}
```

### Get Optimization Impact
```
GET /analytics/optimization

Response:
{
  "total_requests": 1250,
  "optimized_requests": 1063,
  "optimization_rate_percent": 85.0,
  "cached_requests": 893,
  "estimated_savings": 87.50,
  "combined_impact": 142.0
}
```

### Get Performance Report
```
GET /analytics/performance

Response:
{
  "report_type": "Performance Report",
  "summary": {...},
  "metrics": {...},
  "providers": [...]
}
```

### Export Analytics
```
POST /analytics/export
{
  "provider": "gemini",
  "days": 30,
  "include_costs": true
}

Response:
{
  "status": "success",
  "data": {...},
  "export_time": "2025-11-16T10:30:00Z"
}
```

### Reset Analytics
```
DELETE /analytics/reset

Response:
{
  "status": "success",
  "message": "All analytics data reset"
}
```

---

## 📋 List Providers

```
GET /providers

Response:
{
  "available_providers": ["gemini", "openai", "anthropic", "cohere", "huggingface", "ollama", "zhipu"],
  "provider_details": {
    "anthropic": {
      "models": [...],
      "default_model": "...",
      "max_tokens": 4096
    },
    "zhipu": {
      "models": ["glm-4.6", "glm-4", "glm-3.5-turbo"],
      "default_model": "glm-4.6",
      "max_tokens": 4096
    },
    ...
  },
  "total_providers": 7
}
```

## 🏥 Providers Health

```
GET /providers/health

Response:
{
  "gemini": {
    "status": "healthy",
    "api_key_configured": true
  },
  "anthropic": {
    "status": "unconfigured",
    "api_key_configured": false
  },
  ...
}
```

---

## 📝 Response Format

### Success Response
```json
{
  "status": "success",
  "provider": "gemini",
  "model": "gemini-2.0-flash",
  "response": "The answer is...",
  "tokens_used": 150,
  "estimated_cost": 0.0001,
  "from_cache": false,
  "optimized": true
}
```

### Error Response
```json
{
  "status": "error",
  "provider": "gemini",
  "error": "Rate limit exceeded",
  "detail": "Too many requests"
}
```

---

## 🔑 Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 429 | Rate limited |
| 500 | Server error |

---

## 📚 Parameter Types

```
string: Text
integer: Whole number
float: Decimal number
boolean: true/false
array: [item1, item2]
object: {key: value}
```

---

**Need help?** See `AI_GATEWAY_USER_GUIDE.md` for detailed examples.
