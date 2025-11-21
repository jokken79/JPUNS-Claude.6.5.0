# ⚡ Quick Start - 5 Minutos para Usar el AI Gateway

## 1️⃣ Obtener Token (1 minuto)

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Copiar el token (aceess_token) del resultado
TOKEN="tu_token_aqui"
```

## 2️⃣ Tu Primer Request (1 minuto)

```bash
curl -X POST http://localhost:8000/api/ai/gemini \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"What is AI?","max_tokens":100}'
```

**Resultado:** ✅ Automáticamente optimizado, cacheado y tracking de costos

## 3️⃣ Ver Dashboard (1 minuto)

```bash
curl http://localhost:8000/api/ai/analytics/dashboard \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

**Ves:** Total de calls, costos, ahorro por caching, etc.

## 4️⃣ Comparar Providers (1 minuto)

```bash
curl -X POST http://localhost:8000/api/ai/multi-provider \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is machine learning?",
    "providers": ["gemini","anthropic","openai"]
  }' | jq '.responses | keys'
```

## 5️⃣ Optimizar Batch (1 minuto)

```bash
curl -X POST http://localhost:8000/api/ai/batch/optimize \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompts":["Write code","Write code","Write code","Create class"]
  }' | jq '.stats'
```

---

## 🔥 Lo Más Importante

| Acción | Endpoint |
|--------|----------|
| **Usar AI** | `POST /api/ai/gemini` |
| **Ver costos** | `GET /api/ai/analytics/dashboard` |
| **Limpiar caché** | `DELETE /api/ai/cache` |
| **Comparar providers** | `POST /api/ai/multi-provider` |
| **Optimizar batch** | `POST /api/ai/batch/optimize` |

---

📖 **Leer el manual completo:** `AI_GATEWAY_USER_GUIDE.md`
