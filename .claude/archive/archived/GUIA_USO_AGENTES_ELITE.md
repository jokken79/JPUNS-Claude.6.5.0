# 📚 GUÍA COMPLETA: Cómo Usar los Agentes Elite

## 🎯 ¿Qué son los Agentes Elite?

Los agentes elite son **especialistas de nivel senior** que Claude Code invoca automáticamente cuando detecta que necesitas su expertise. No necesitas llamarlos manualmente - Claude los invoca por ti.

---

## 🚀 INSTALACIÓN RÁPIDA

### Paso 1: Ejecuta el Instalador
```cmd
SETUP_AGENTES_ELITE.bat
```

Verás algo como:
```
✓ Directorio .claude/elite creado
✓ Agente master-problem-solver creado
✓ Agente full-stack-architect creado
✓ Agente code-quality-guardian creado
✓ 3 agentes elite registrados en agents.json
```

### Paso 2: ¡Listo!
Los agentes ya están disponibles. No necesitas hacer nada más.

---

## 💡 CÓMO USAR LOS AGENTES

### Método 1: Invocación Automática (Recomendado)

Los agentes se activan **automáticamente** cuando:
- Mencionas palabras clave (triggers)
- Describes un problema que coincide con su expertise

**Ejemplos:**

#### 🧠 Master Problem Solver

**Triggers:** "problema complejo", "bug imposible", "debugging avanzado", "root cause", "optimización sistema"

```
TÚ ESCRIBES:
"Tengo un bug muy raro: la API funciona bien en local pero 
en producción tarda 8 segundos. Solo pasa con algunos usuarios."

CLAUDE RESPONDE:
*invocando agente master-problem-solver*
"Voy a analizar este problema sistemáticamente..."

EL AGENTE:
1. Analiza logs y traces
2. Identifica root cause (N+1 query en permissions check)
3. Propone solución (eager loading)
4. Sugiere monitoreo para prevenir regresión
```

**Otros ejemplos:**
- "El sistema está caído, necesito root cause analysis"
- "Optimiza el performance de este módulo completo"
- "Debugging avanzado de memory leak en producción"

---

#### 🏗️ Full-Stack Architect

**Triggers:** "diseñar feature", "arquitectura completa", "sistema end-to-end", "api design", "implementar feature"

```
TÚ ESCRIBES:
"Necesito implementar un sistema de notificaciones en tiempo real 
con persistencia en base de datos"

CLAUDE RESPONDE:
*invocando agente full-stack-architect*
"Voy a diseñar e implementar el sistema completo..."

EL AGENTE:
1. Diseña schema PostgreSQL (notifications table)
2. Implementa backend (WebSocket + API REST + Celery)
3. Crea frontend (React component + real-time hooks)
4. Agrega tests (unit + integration + E2E)
5. Configura Docker y environment vars
```

**Otros ejemplos:**
- "Crea una feature completa de autenticación OAuth2"
- "Diseña la arquitectura para integrar Stripe payments"
- "Implementa un sistema de roles y permisos end-to-end"

---

#### 🛡️ Code Quality Guardian

**Triggers:** "revisar código", "code review", "mejorar calidad", "refactorizar", "code smell", "test coverage"

```
TÚ ESCRIBES:
"Revisa este servicio de usuarios y mejora su calidad"

CLAUDE RESPONDE:
*invocando agente code-quality-guardian*
"Voy a hacer un code review exhaustivo..."

EL AGENTE:
1. Detecta Long Method (120 líneas → refactorizar)
2. Identifica Magic Numbers (usar constantes)
3. Encuentra N+1 query (agregar eager loading)
4. Sugiere missing tests (edge cases)
5. Propone refactoring con SOLID principles
```

**Otros ejemplos:**
- "Code review de este pull request"
- "Detecta code smells en el módulo de pagos"
- "Mejora el test coverage de este servicio"
- "Refactoriza este código legacy"

---

### Método 2: Invocación Explícita

Puedes invocarlos directamente mencionando su nombre:

```
"Usa el master-problem-solver para analizar este error"
"Invoca al full-stack-architect para diseñar esto"
"Code-quality-guardian revisa este archivo"
```

---

## 🎓 EJEMPLOS PRÁCTICOS COMPLETOS

### Ejemplo 1: Bug Complejo en Producción

**Tu mensaje:**
```
Tengo un problema complejo: algunos usuarios reportan que 
el dashboard tarda mucho en cargar, pero otros no tienen 
problema. Revisé logs y no veo errores. ¿Qué hago?
```

**Claude invoca:** `master-problem-solver`

**Proceso del agente:**
1. **Gather Evidence**: Pide logs específicos, user IDs afectados
2. **Form Hypotheses**: 
   - ¿Query lenta para ciertos datos?
   - ¿Falta de índices en tablas grandes?
   - ¿Caching no funcionando?
3. **Profile**: Analiza EXPLAIN de queries
4. **Diagnose**: Encuentra que usuarios con muchos departamentos causan N+1
5. **Fix**: Propone eager loading + índice compuesto
6. **Prevent**: Agrega monitoring de query times

---

### Ejemplo 2: Nueva Feature Completa

**Tu mensaje:**
```
Necesito implementar un sistema de comentarios en los 
reportes. Los usuarios deben poder comentar, editar sus 
comentarios, y recibir notificaciones cuando alguien responde.
```

**Claude invoca:** `full-stack-architect`

**Proceso del agente:**

**1. Database Schema:**
```sql
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    report_id INT REFERENCES reports(id),
    user_id INT REFERENCES users(id),
    parent_id INT REFERENCES comments(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_comments_report ON comments(report_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
```

**2. Backend (FastAPI):**
```python
# models/models.py
class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True)
    report_id = Column(Integer, ForeignKey("reports.id"))
    # ... resto de campos

# schemas/comment.py
class CommentCreate(BaseModel):
    report_id: int
    content: str
    parent_id: Optional[int] = None

# services/comment_service.py
class CommentService:
    async def create_comment(self, data: CommentCreate, user_id: int):
        # ... crear comentario
        # ... enviar notificación
        return comment

# api/comments.py
@router.post("/", response_model=CommentResponse)
async def create_comment(...)
```

**3. Frontend (React):**
```typescript
// components/CommentList.tsx
export function CommentList({ reportId }) {
  const { data: comments } = useComments(reportId)
  return <CommentThread comments={comments} />
}

// hooks/useComments.ts
export function useComments(reportId: number) {
  return useQuery({
    queryKey: ['comments', reportId],
    queryFn: () => api.comments.list(reportId)
  })
}
```

**4. Tests:**
```python
# tests/test_comments.py
def test_create_comment_sends_notification(...)
def test_edit_own_comment_allowed(...)
def test_edit_other_comment_forbidden(...)
```

---

### Ejemplo 3: Mejorar Código Legacy

**Tu mensaje:**
```
Este servicio de reportes tiene 300 líneas y es difícil 
de mantener. Ayúdame a refactorizarlo.
```

**Claude invoca:** `code-quality-guardian`

**Proceso del agente:**

**Análisis:**
```
❌ PROBLEMAS DETECTADOS:

1. Long Method: generate_report() tiene 150 líneas
   → Refactorizar en métodos más pequeños

2. Magic Numbers: 
   if total > 1000000:  # ¿Qué es 1000000?
   → Usar constantes: MAX_REPORT_SIZE = 1_000_000

3. Nested Conditionals (6 niveles):
   → Usar guard clauses y early returns

4. N+1 Query:
   for dept in departments:
       employees = dept.employees  # Query por cada dept!
   → Usar eager loading

5. Missing Tests:
   - No hay tests para edge cases
   - Coverage: 45% (debería ser 80%+)
```

**Refactoring Propuesto:**

**Antes (código original):**
```python
def generate_report(self, user_id, filters):
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            if user.is_active:
                if filters:
                    # ... 150 líneas más
```

**Después (refactorizado):**
```python
MAX_REPORT_SIZE = 1_000_000
MIN_DEPARTMENT_SIZE = 10

def generate_report(self, user_id: int, filters: ReportFilters) -> Report:
    user = self._validate_user(user_id)
    data = self._fetch_data(filters)
    processed = self._process_data(data)
    return self._build_report(processed)

def _validate_user(self, user_id: int) -> User:
    user = self._user_repo.get_by_id(user_id)
    if not user:
        raise UserNotFound()
    if not user.is_active:
        raise InactiveUser()
    return user

def _fetch_data(self, filters: ReportFilters) -> QueryResult:
    # Single responsibility: solo fetch data
    return self._report_repo.query(filters)
    
# ... métodos pequeños y enfocados
```

**Tests Agregados:**
```python
def test_generate_report_inactive_user_raises():
    with pytest.raises(InactiveUser):
        service.generate_report(inactive_user_id, filters)

def test_generate_report_exceeds_max_size_raises():
    large_filters = ReportFilters(limit=MAX_REPORT_SIZE + 1)
    with pytest.raises(ReportTooLarge):
        service.generate_report(user_id, large_filters)
```

---

## 🔄 FLUJO DE TRABAJO TÍPICO

### Desarrollo de Nueva Feature

```
1. TÚ: "Necesito implementar búsqueda full-text en productos"
   → Claude invoca: full-stack-architect

2. AGENTE: Diseña e implementa:
   - PostgreSQL: índice GIN con ts_vector
   - Backend: endpoint /api/products/search
   - Frontend: SearchBar component
   - Tests: búsqueda funciona correctamente

3. TÚ: "Revisa el código antes de hacer commit"
   → Claude invoca: code-quality-guardian

4. AGENTE: Revisa y sugiere:
   - Agregar índice en nombre_producto
   - Validar input (prevenir SQL injection)
   - Test para búsqueda vacía

5. TÚ: "La búsqueda es lenta con 100k productos"
   → Claude invoca: master-problem-solver

6. AGENTE: Optimiza:
   - Agrega paginación
   - Implementa caching con Redis
   - Añade índice compuesto
   - Resultado: < 100ms por búsqueda
```

---

## 📋 COMANDOS ÚTILES

### Verificar Instalación
```cmd
# Ver agentes registrados
type .claude\agents.json | findstr "elite"

# Ver archivos creados
dir .claude\elite
```

### Actualizar Agentes
```cmd
# Editar un agente
notepad .claude\elite\master-problem-solver.md

# Subir cambios a Git
scripts\GIT_SUBIR.bat
```

### En Otra PC
```cmd
# Bajar agentes actualizados
scripts\GIT_BAJAR.bat
```

---

## 🎯 TIPS PARA MEJORES RESULTADOS

### ✅ HACER:
1. **Describe el problema claramente**: Más contexto = mejor solución
2. **Menciona el objetivo**: "necesito optimizar" vs "quiero que cargue en < 1s"
3. **Comparte código relevante**: Pega snippets para review
4. **Confía en el agente**: Son nivel senior, siguen best practices
5. **Pide explicaciones**: "explica por qué recomiendas esto"

### ❌ NO HACER:
1. **No seas vago**: "arregla esto" → mejor: "optimiza esta query SQL que tarda 5s"
2. **No ignores warnings**: Si el agente dice "esto es inseguro", escucha
3. **No uses elite para tareas simples**: "crea una variable" → no necesitas agente elite
4. **No te saltes tests**: Los agentes sugieren tests por una razón

---

## 🔍 DIFERENCIAS ENTRE AGENTES

| Situación | Usa Este Agente |
|-----------|----------------|
| Bug que cruza frontend + backend + DB | 🧠 Master Problem Solver |
| Implementar feature nueva completa | 🏗️ Full-Stack Architect |
| Review código antes de merge | 🛡️ Code Quality Guardian |
| Sistema está caído en producción | 🧠 Master Problem Solver |
| Diseñar arquitectura de microservicio | 🏗️ Full-Stack Architect |
| Refactorizar código legacy | 🛡️ Code Quality Guardian |
| Query SQL muy lenta | 🧠 Master Problem Solver |
| Crear CRUD completo | 🏗️ Full-Stack Architect |
| Detectar code smells | 🛡️ Code Quality Guardian |

---

## 🚨 TROUBLESHOOTING

**Problema:** Agente no se invoca
- **Solución:** Usa triggers específicos ("problema complejo", "diseñar feature", "revisar código")

**Problema:** Agente da solución incorrecta
- **Solución:** Da más contexto, comparte código, especifica requisitos

**Problema:** No aparecen en agents.json
- **Solución:** Ejecuta `node register_elite_agents.js`

**Problema:** Archivos no se crearon
- **Solución:** Ejecuta `node create_elite_agents.js`

---

## 📚 RECURSOS

- **Plantilla de Agente**: `.claude/templates/agent-template.md`
- **Documentación General**: `.claude/README.md`
- **Guidelines del Repo**: `AGENTS.md`
- **Ejemplos de Triggers**: `.claude/agents.json`

---

## 🎓 APRENDE DE LOS AGENTES

Los agentes elite no solo resuelven problemas - **enseñan**:

- **Master Problem Solver**: Te enseña debugging sistemático
- **Full-Stack Architect**: Te muestra arquitectura limpia
- **Code Quality Guardian**: Te entrena en best practices

**Observa sus razonamientos** y aplícalos en tu propio código.

---

**¿Preguntas?** Solo pregunta:
- "¿Cómo invocar al master-problem-solver?"
- "¿Qué hace el full-stack-architect?"
- "¿Cuándo usar code-quality-guardian?"

**¡Los agentes están listos para ayudarte! 🚀**
