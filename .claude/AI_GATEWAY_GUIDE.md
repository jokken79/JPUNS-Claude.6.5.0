# 🚀 AI Gateway Guide - Multi-AI Direct Integration

**Now Claude Code can invoke Gemini, OpenAI, Claude API directly!**

---

## 📋 Quick Start

### What is AI Gateway?

The AI Gateway is a unified service that allows Claude Code to directly invoke multiple AI systems:

- **Google Gemini** - Code generation, analysis
- **OpenAI (ChatGPT)** - Code review, architecture, analysis
- **Anthropic Claude API** - External Claude service
- **Local CLI Tools** - gemini-cli, custom tools

### Access Points

**Backend Service:**
```python
# backend/app/services/ai_gateway.py
gateway = AIGateway()
```

**REST API Endpoints:**
```
POST /api/ai/gemini     - Invoke Gemini
POST /api/ai/openai     - Invoke OpenAI
POST /api/ai/claude     - Invoke Claude API
POST /api/ai/cli        - Invoke local CLI
POST /api/ai/batch      - Batch invocation
GET  /api/ai/health     - Health check
```

---

## 🔧 Setup

### 1. Add API Keys to .env

```bash
# Google Gemini
GOOGLE_API_KEY=your-gemini-api-key

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Anthropic Claude
ANTHROPIC_API_KEY=your-anthropic-api-key
```

Get API keys:
- **Gemini**: https://makersuite.google.com/app/apikey
- **OpenAI**: https://platform.openai.com/api-keys
- **Claude API**: https://console.anthropic.com/account/keys

### 2. Verify Installation

```bash
# Start backend
docker compose up -d backend

# Test health check
curl http://localhost:8000/api/ai/health

# Response:
# {
#   "status": "healthy",
#   "providers": {
#     "gemini": "healthy",
#     "openai": "healthy",
#     "claude_api": "healthy",
#     "local_cli": "available"
#   }
# }
```

---

## 💡 Usage Examples

### Example 1: Generate Code with Gemini

```bash
curl -X POST http://localhost:8000/api/ai/gemini \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "prompt": "Generate a FastAPI CRUD endpoint for candidates table",
    "max_tokens": 2000,
    "temperature": 0.7
  }'
```

**Python Client:**

```python
from app.services.ai_gateway import AIGateway

gateway = AIGateway()

# Generate code
code = await gateway.invoke_gemini(
    prompt="Generate FastAPI CRUD endpoint for candidates",
    max_tokens=2000,
    temperature=0.7,
)

print(code)
```

---

### Example 2: Code Review with OpenAI

```bash
curl -X POST http://localhost:8000/api/ai/openai \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "prompt": "Review this FastAPI code: [code here]",
    "model": "gpt-4-turbo-preview",
    "system_message": "You are a senior code reviewer"
  }'
```

**Python Client:**

```python
review = await gateway.invoke_openai(
    prompt="Review this FastAPI code: ...",
    model="gpt-4-turbo-preview",
    system_message="You are a senior code reviewer with 20 years experience",
    temperature=0.3,  # Lower temp for consistency
)

print(review)
```

---

### Example 3: Architecture Analysis with Claude API

```python
explanation = await gateway.invoke_claude_api(
    prompt="Explain why we should use this pattern: ...",
    model="claude-3-5-sonnet-20241022",
    system_prompt="You are an expert system architect",
    max_tokens=2000,
)

print(explanation)
```

---

### Example 4: Invoke Local CLI Tool

```python
result = await gateway.invoke_local_cli(
    tool="gemini-cli",
    args={
        "action": "generate-endpoint",
        "model": "candidates",
        "crud": True,
    },
    timeout=30,
)

print(result)
```

---

### Example 5: Batch Invocation (Multi-AI)

**HTTP:**

```bash
curl -X POST http://localhost:8000/api/ai/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "tasks": [
      {
        "provider": "gemini",
        "prompt": "Generate FastAPI endpoint for candidates"
      },
      {
        "provider": "openai",
        "prompt": "Review the generated code",
        "system_message": "You are a code reviewer"
      },
      {
        "provider": "claude_api",
        "prompt": "Explain the architectural pattern used"
      }
    ],
    "parallel": true
  }'
```

**Python (Claude Code):**

```python
gateway = AIGateway()

# Get generated code, review, and explanation all at once!
results = await gateway.batch_invoke(
    tasks=[
        {
            "provider": "gemini",
            "prompt": "Generate FastAPI CRUD endpoint",
            "max_tokens": 2000,
        },
        {
            "provider": "openai",
            "prompt": "Review the generated code",
            "system_message": "You are a code reviewer",
        },
        {
            "provider": "claude_api",
            "prompt": "Explain this architectural pattern",
        }
    ],
    parallel=True,  # Execute all in parallel
)

# Access results
generated_code = results[0]["response"]
code_review = results[1]["response"]
explanation = results[2]["response"]

print(f"Generated:\n{generated_code}")
print(f"\nReview:\n{code_review}")
print(f"\nExplanation:\n{explanation}")
```

---

## 🎯 Common Workflows

### Workflow 1: Auto-Generate and Review Code

```python
async def auto_generate_and_review(feature_request: str):
    """Generate code and get review automatically"""

    gateway = AIGateway()

    # Generate code with Gemini
    generated_code = await gateway.invoke_gemini(
        f"Generate FastAPI endpoint: {feature_request}",
        max_tokens=3000,
    )

    # Review with OpenAI
    review = await gateway.invoke_openai(
        f"Review this code:\n{generated_code}",
        system_message="You are a senior code reviewer",
        temperature=0.3,
    )

    # Explain with Claude
    explanation = await gateway.invoke_claude_api(
        f"Explain this code:\n{generated_code}",
    )

    return {
        "code": generated_code,
        "review": review,
        "explanation": explanation,
    }
```

---

### Workflow 2: Multi-Language Code Generation

```python
async def generate_code_multiple_languages(feature: str):
    """Generate code in Python and TypeScript"""

    results = await gateway.batch_invoke(
        tasks=[
            {
                "provider": "gemini",
                "prompt": f"Generate Python code for: {feature}",
                "system_instruction": "You are a Python expert",
            },
            {
                "provider": "openai",
                "prompt": f"Generate TypeScript code for: {feature}",
                "system_message": "You are a TypeScript expert",
                "model": "gpt-4",
            },
        ],
        parallel=True,
    )

    python_code = results[0]["response"]
    typescript_code = results[1]["response"]

    return {
        "python": python_code,
        "typescript": typescript_code,
    }
```

---

### Workflow 3: Architecture Discussion

```python
async def architecture_discussion(problem: str):
    """Get multiple perspectives on architecture"""

    results = await gateway.batch_invoke(
        tasks=[
            {
                "provider": "gemini",
                "prompt": f"Suggest an architecture for: {problem}",
            },
            {
                "provider": "openai",
                "prompt": f"What's the best architecture for: {problem}?",
                "system_message": "You have 20 years of architecture experience",
            },
            {
                "provider": "claude_api",
                "prompt": f"Critique this architecture approach: {problem}",
            }
        ],
        parallel=True,
    )

    return {
        "gemini_suggestion": results[0]["response"],
        "openai_recommendation": results[1]["response"],
        "claude_critique": results[2]["response"],
    }
```

---

## 🔒 Authentication & Authorization

All AI Gateway endpoints require authentication:

```bash
# Get JWT token
curl -X POST http://localhost:8000/api/auth/login \
  -d '{"email": "admin@example.com", "password": "admin123"}'

# Use token in requests
curl -X POST http://localhost:8000/api/ai/gemini \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiI..."
```

**Note:** Only authenticated users can invoke AI services to prevent abuse.

---

## 📊 API Response Format

### Success Response

```json
{
  "status": "success",
  "provider": "gemini",
  "response": "Generated code here...",
  "tokens_used": 1200
}
```

### Error Response

```json
{
  "status": "error",
  "provider": "openai",
  "error": "OpenAI API error: Rate limit exceeded"
}
```

### Batch Response

```json
{
  "status": "partial",
  "total_tasks": 3,
  "successful": 2,
  "failed": 1,
  "results": [
    {
      "provider": "gemini",
      "status": "success",
      "response": "Code here..."
    },
    {
      "provider": "openai",
      "status": "success",
      "response": "Review here..."
    },
    {
      "provider": "claude_api",
      "status": "error",
      "error": "API key not configured"
    }
  ]
}
```

---

## ⚙️ Configuration

### Environment Variables

```bash
# Required for each AI
GOOGLE_API_KEY=your-key          # For Gemini
OPENAI_API_KEY=your-key          # For OpenAI
ANTHROPIC_API_KEY=your-key       # For Claude API

# Optional
AI_GATEWAY_TIMEOUT=60            # HTTP timeout (default: 60s)
AI_GATEWAY_MAX_RETRIES=3         # Max retries (default: 3)
```

### Rate Limiting

Current implementation has basic rate limiting:
- Each provider has API-level rate limits
- Batch requests are parallelized (faster)
- Local CLI has timeout protection

---

## 🐛 Troubleshooting

### Issue: "API key not configured"

```
Error: GOOGLE_API_KEY not configured

Solution:
1. Add GOOGLE_API_KEY to .env
2. Restart backend: docker compose restart backend
3. Verify: curl http://localhost:8000/api/ai/health
```

### Issue: "API call failed"

```
Check:
1. API key is valid and has quota
2. Network connectivity
3. API service is up
4. Rate limits not exceeded

Debug:
curl http://localhost:8000/api/ai/health
```

### Issue: Local CLI tool not found

```
Solution:
1. Install tool: npm install -g gemini-cli
2. Verify in PATH: which gemini-cli
3. Test: gemini-cli --version
```

---

## 🎓 Advanced Usage

### Custom System Instructions

```python
# For specialized code generation
code = await gateway.invoke_gemini(
    prompt="Generate an endpoint",
    system_instruction="""
    You are a FastAPI expert.
    Follow these rules:
    - Use async/await
    - Use dependency injection
    - Use Pydantic for validation
    - Include docstrings
    """
)
```

### Temperature Control

```python
# For consistency (code review)
review = await gateway.invoke_openai(
    prompt="Review this code",
    temperature=0.1,  # Lower = more consistent
)

# For creativity (brainstorming)
ideas = await gateway.invoke_openai(
    prompt="Brainstorm architecture options",
    temperature=1.5,  # Higher = more creative
)
```

### Long Prompts with Context

```python
# Include full code for review
full_context = f"""
Project: {project_name}
Architecture: {architecture_desc}

Code to review:
{code_to_review}

Specific concerns:
{user_concerns}
"""

review = await gateway.invoke_openai(prompt=full_context)
```

---

## 📈 Performance Metrics

### Typical Response Times

| Provider | Time | Notes |
|----------|------|-------|
| Gemini | 2-5s | Code generation |
| OpenAI | 3-8s | Analysis/review |
| Claude API | 2-6s | Explanation |
| Local CLI | 1-3s | Subprocess |

### Batch vs Sequential

```python
# Sequential: 2+3+2 = 7 seconds
for task in tasks:
    result = await invoke(task)

# Parallel: max(2,3,2) = 3 seconds
results = await batch_invoke(tasks, parallel=True)
```

---

## 🔐 Security Considerations

1. **API Keys:** Store in .env, never in code
2. **Rate Limiting:** Implement per-user/per-IP limits
3. **Cost Control:** Monitor API usage
4. **Timeout Protection:** Local CLI has timeout
5. **Input Validation:** All inputs validated

---

## 📚 See Also

- [agents.md](../agents.md) - Complete guide for all AIs
- [SPECIALIST_MATRIX.md](./SPECIALIST_MATRIX.md) - 13-agent reference
- [PROMPT_TEMPLATES.md](./PROMPT_TEMPLATES.md) - Ready-to-use prompts
- [Real-world examples](./REAL_WORLD_EXAMPLES/) - Complete workflows

---

**Now you can orchestrate multiple AIs directly from Claude Code!** 🚀
