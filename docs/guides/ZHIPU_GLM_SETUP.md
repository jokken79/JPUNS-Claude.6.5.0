# 🤖 Zhipu GLM-4.6 Setup Guide

**Bienvenido!** Este es el guía de configuración e integración para **Zhipu GLM-4.6**, un potente modelo de lenguaje chino disponible en el AI Gateway.

---

## 📋 Contenidos

1. [Qué es Zhipu GLM](#qué-es-zhipu-glm)
2. [Obtener API Key](#obtener-api-key)
3. [Configuración](#configuración)
4. [Primeros Pasos](#primeros-pasos)
5. [Ejemplos de Uso](#ejemplos-de-uso)
6. [Modelos Disponibles](#modelos-disponibles)
7. [Precios](#precios)
8. [Troubleshooting](#troubleshooting)

---

## ¿Qué es Zhipu GLM?

**Zhipu AI** es una empresa china que desarrolla modelos de lenguaje de alta calidad. **GLM-4.6** es su modelo más avanzado:

- 🚀 **Rendimiento:** Comparable a GPT-4 en muchas tareas
- 🌍 **Multiidioma:** Excelente soporte para chino, inglés, y otros idiomas
- 💰 **Económico:** Precios competitivos vs. modelos occidentales
- ⚡ **Rápido:** Respuestas rápidas con buena latencia
- 🔒 **Privacidad:** Servidores ubicados en China (relevante para datos sensibles)

### Casos de Uso Ideales

- ✅ Procesamiento de texto en chino
- ✅ Traducción entre idiomas
- ✅ Generación de contenido
- ✅ Análisis de sentimiento
- ✅ Q&A y búsqueda de información
- ✅ Comparar con otros providers (GPT-4, Claude, Gemini)

---

## Obtener API Key

### Paso 1: Crear Cuenta en Zhipu

1. Accede a [open.bigmodel.cn](https://open.bigmodel.cn)
2. Haz clic en **"Registrarse"** o **"登录"** (Sign in)
3. Completa el formulario con tu información

### Paso 2: Obtener API Key

1. Ve a **"Account"** → **"API Keys"**
2. Haz clic en **"Crear Nueva Clave"** o **"Create New Key"**
3. Copia la clave: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxx`
4. ⚠️ **Guárdala en lugar seguro** - no la perdas

### API Key Proporcionada

Si ya tienes una API key de Zhipu:

```
ZHIPU_API_KEY=893f4eab82514c7e9a277557bb812e30.G6QA2HmFmiyaqWeY
```

---

## Configuración

### Opción 1: Variable de Entorno

Agrega tu API key al archivo `.env`:

```bash
# .env
ZHIPU_API_KEY=tu_api_key_aqui
```

Luego reinicia el backend:

```bash
docker compose restart backend
```

### Opción 2: En Tiempo de Ejecución

Puedes pasar la API key directamente en la solicitud (menos seguro):

```bash
POST /api/ai/zhipu
{
  "prompt": "Hello",
  "model": "glm-4.6"
}
```

El endpoint usará la variable de entorno automáticamente.

### Opción 3: Docker Compose

Agrega la variable al servicio backend:

```yaml
# docker-compose.yml
backend:
  environment:
    - ZHIPU_API_KEY=tu_api_key_aqui
```

---

## Primeros Pasos

### 1️⃣ Verificar que Zhipu esté Disponible

```bash
curl -X GET http://localhost:8000/api/ai/providers \
  -H "Authorization: Bearer $TOKEN"

# Verifica que "zhipu" esté en la lista de providers
```

### 2️⃣ Tu Primer Request

```bash
TOKEN="tu_token_aqui"

curl -X POST http://localhost:8000/api/ai/zhipu \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is artificial intelligence?",
    "model": "glm-4.6",
    "max_tokens": 500
  }'

# Resultado:
# {
#   "status": "success",
#   "provider": "zhipu",
#   "model": "glm-4.6",
#   "response": "Artificial intelligence (AI) is...",
#   "tokens_used": 125,
#   "estimated_cost": 0.000045
# }
```

### 3️⃣ Con Sistema Message

```bash
curl -X POST http://localhost:8000/api/ai/zhipu \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Eres un experto en programación. Explica qué es Python.",
    "system_message": "Eres un profesor excelente que explica conceptos complejos de forma simple.",
    "model": "glm-4.6",
    "max_tokens": 1000,
    "temperature": 0.7
  }'
```

---

## Ejemplos de Uso

### Ejemplo 1: Procesar Texto en Chino

```python
import requests
import json

def invoke_zhipu_chinese():
    token = "tu_token_aqui"

    payload = {
        "prompt": "请解释什么是深度学习",  # Explain what deep learning is
        "model": "glm-4.6",
        "max_tokens": 2000
    }

    response = requests.post(
        "http://localhost:8000/api/ai/zhipu",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        },
        json=payload
    )

    result = response.json()
    print(f"Response: {result['response']}")
    print(f"Cost: ${result['estimated_cost']}")

invoke_zhipu_chinese()
```

### Ejemplo 2: Traducción

```python
def translate_with_glm():
    payload = {
        "prompt": "Traduce al inglés: La inteligencia artificial es el futuro.",
        "system_message": "Eres un traductor experto. Traduce de forma precisa y natural.",
        "model": "glm-4.6",
        "temperature": 0.3  # Lower temperature for consistency
    }

    # Hacer request...
```

### Ejemplo 3: Comparar con Otros Providers

```bash
# Comparar GLM-4.6 con Claude y Gemini
curl -X POST http://localhost:8000/api/ai/multi-provider \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain machine learning in 100 words",
    "providers": ["zhipu", "anthropic", "gemini"],
    "models": {
      "zhipu": "glm-4.6",
      "anthropic": "claude-3-5-sonnet-20241022",
      "gemini": "gemini-2.0-flash"
    },
    "max_tokens": 500
  }'
```

### Ejemplo 4: Análisis de Sentimiento

```python
def analyze_sentiment():
    payload = {
        "prompt": "Analiza el sentimiento de este texto: 'Tengo un día maravilloso, la vida es hermosa'",
        "system_message": "Eres un experto en análisis de sentimientos. Responde solo con: POSITIVO, NEUTRAL o NEGATIVO, seguido de una breve explicación.",
        "model": "glm-4.6",
        "temperature": 0.2
    }

    # Hacer request...
```

---

## Modelos Disponibles

### GLM-4.6 ⭐ (Recomendado)

```bash
"model": "glm-4.6"
```

**Características:**
- Mejor rendimiento general
- Mejor comprensión del contexto
- Mejor para tareas complejas
- Precio: $0.0001 input / $0.0003 output por 1M tokens

### GLM-4

```bash
"model": "glm-4"
```

**Características:**
- Alternativa a GLM-4.6
- Similar rendimiento
- Precio: $0.0001 input / $0.0003 output por 1M tokens

### GLM-3.5-Turbo (Económico)

```bash
"model": "glm-3.5-turbo"
```

**Características:**
- Modelo más ligero y rápido
- Ideal para tareas simples
- Menor costo
- Precio: $0.00005 input / $0.00015 output por 1M tokens

---

## Precios

### Comparación de Costos

| Modelo | Input | Output | Caso de Uso |
|--------|-------|--------|------------|
| **GLM-4.6** | $0.0001 | $0.0003 | Tareas complejas |
| **GLM-4** | $0.0001 | $0.0003 | General |
| **GLM-3.5-turbo** | $0.00005 | $0.00015 | Tareas simples |

### Ejemplo de Costo

**Request típica (2000 tokens):**

```
GLM-4.6: 1000 input + 1000 output
= (1000/1M * $0.0001) + (1000/1M * $0.0003)
= $0.0000001 + $0.0000003
= $0.0000004 por request (muy económico!)
```

**Con 1000 requests diarios:**

```
GLM-4.6: $0.0000004 * 1000 = $0.0004/día ≈ $0.12/mes
GLM-3.5-turbo: $0.0000002 * 1000 = $0.0002/día ≈ $0.06/mes
```

---

## Troubleshooting

### ❌ Error: "Zhipu API key not configured"

**Solución:**

1. Verifica que la variable de entorno esté establecida:
```bash
echo $ZHIPU_API_KEY
```

2. Si está vacía, agrega a `.env`:
```bash
ZHIPU_API_KEY=tu_api_key_aqui
```

3. Reinicia el backend:
```bash
docker compose restart backend
```

### ❌ Error: "Invalid API Key"

**Solución:**

1. Verifica que tu API key sea correcta
2. Copia la clave completa (sin espacios)
3. Verifica el formato: `xxxxx.xxxxx`

### ❌ Error: "Network timeout"

**Solución:**

1. Verifica tu conexión a Internet
2. Intenta con `/api/ai/providers` para ver si otros providers funcionan
3. Si Zhipu es lento, intenta con GLM-3.5-turbo

### ❌ Error: "Rate limit exceeded"

**Solución:**

1. Espera 60 segundos antes de reintentar
2. Usa GLM-3.5-turbo si es posible (tiene límites más altos)
3. Contacta a Zhipu para aumentar tu cuota

### ⚠️ Respuestas muy lentas

**Solución:**

1. Usa GLM-3.5-turbo en lugar de GLM-4.6
2. Reduce `max_tokens` si es posible
3. Verifica tu conexión a Internet

---

## 🔗 Recursos

### Documentación Oficial

- **Zhipu API Docs:** https://open.bigmodel.cn/docs
- **Modelos:** https://open.bigmodel.cn/docs/api/glm-4
- **Pricing:** https://open.bigmodel.cn/pricing

### En el AI Gateway

- **API Reference:** [API_ENDPOINTS_REFERENCE.md](./API_ENDPOINTS_REFERENCE.md)
- **User Guide:** [AI_GATEWAY_USER_GUIDE.md](./AI_GATEWAY_USER_GUIDE.md)
- **Quick Start:** [QUICK_START.md](./QUICK_START.md)

### Documentación del Gateway

```bash
# Ver todos los providers disponibles
GET /api/ai/providers

# Ver salud de todos los providers
GET /api/ai/providers/health

# Ver analytics de uso
GET /api/ai/analytics/dashboard
```

---

## 📞 Soporte

¿Problemas con Zhipu GLM? Intenta:

1. ✅ Verifica que el API key sea correcto
2. ✅ Verifica que la variable de entorno esté establecida
3. ✅ Intenta con GLM-3.5-turbo (más estable)
4. ✅ Revisa los logs: `docker compose logs backend`
5. ✅ Reinicia el backend: `docker compose restart backend`

---

## ✨ Próximos Pasos

1. **Ahora mismo:** Configura tu API key de Zhipu
2. **En 5 minutos:** Haz tu primer request
3. **En 30 minutos:** Lee el [AI_GATEWAY_USER_GUIDE.md](./AI_GATEWAY_USER_GUIDE.md)
4. **En 1 hora:** Integra Zhipu en tu aplicación

---

**¡Listo para usar Zhipu GLM! 🚀**

*Last updated: 2025-11-16*
