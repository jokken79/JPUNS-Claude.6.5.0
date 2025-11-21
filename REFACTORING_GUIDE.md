# Guía de Refactorización: Exception Handlers

## 📋 Objetivo

Reemplazar ~125 bloques `except Exception` genéricos con el nuevo sistema de manejo de errores automático usando el decorator `@handle_errors()`.

**Beneficios**:
- ✅ Código más limpio (menos try-except)
- ✅ Manejo de errores consistente
- ✅ Mejor logging contextualizado
- ✅ Menos code duplication

## 🏗️ Arquitectura Nueva

```
app/core/
├── app_exceptions.py      # 15+ custom exception classes
├── error_handlers.py      # @handle_errors() decorator (NUEVO)
└── ...

Flujo:
  Endpoint → @handle_errors() → Try endpoint code
                              → Catch specific exceptions
                              → Convert to HTTPException
                              → Return proper HTTP response + log
```

## 🔄 Patrón de Refactorización

### Antes (Con try-except)
```python
@router.post("/endpoint")
async def my_endpoint(
    request: MyRequest,
    current_user: User = Depends(get_current_user),
):
    """Description"""
    try:
        logger.info(f"User {current_user.username} doing something")

        result = do_something(request)

        return {"status": "success", "data": result}

    except ValueError as e:
        logger.error(f"Value error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
```

### Después (Con @handle_errors)
```python
@router.post("/endpoint")
@handle_errors(default_detail="Failed to process request")
async def my_endpoint(
    request: MyRequest,
    current_user: User = Depends(get_current_user),
):
    """Description"""
    logger.info(f"User {current_user.username} doing something")

    result = do_something(request)

    return {"status": "success", "data": result}
```

## 📝 Pasos de Refactorización

### 1. Agregar Import (Una sola vez por archivo)

```python
from app.core.error_handlers import handle_errors
from app.core.app_exceptions import (
    ValidationError,
    ResourceNotFoundError,
    # ... otros que uses
)
```

### 2. Agregar Decorator al Endpoint

Agregar `@handle_errors()` JUSTO ENCIMA de la función:

```python
# ❌ ANTES
@router.post("/endpoint")
@limiter.limit("100/minute")
async def my_endpoint(...):
    try:
        ...
    except Exception as e:
        raise HTTPException(...)

# ✅ DESPUÉS
@router.post("/endpoint")
@limiter.limit("100/minute")
@handle_errors(default_detail="Descripción del error")  # ← AGREGAR AQUÍ
async def my_endpoint(...):
    # Sin try-except, directo el código
    ...
```

### 3. Eliminar Bloque try-except

Quitar TODO el try-except. El decorator lo maneja automáticamente:

```python
# ❌ QUITAR ESTO:
    try:
        ... código ...
    except ValueError as e:
        logger.error(...)
        raise HTTPException(...)
    except Exception as e:
        logger.error(...)
        raise HTTPException(...)

# ✅ QUEDÓ SOLO EL CÓDIGO:
    ... código ...
```

### 4. Cambiar Excepciones Genéricas por Custom (Opcional)

Si quieres mejor logging:

```python
# Antes de cambiar Exception, lanzar custom exception
if invalid_data:
    raise ValidationError("Invalid field X", field="X")

if not found:
    raise ResourceNotFoundError("Employee", employee_id)

# El decorator convierte automáticamente a HTTPException
```

## 📍 Archivos con Más Problemas

| Archivo | Count | Estado |
|---------|-------|--------|
| `ai_agents.py` | 44 | 🔄 **En refactorización** (2 done, 42 pendientes) |
| `payroll.py` | 44 | ✅ **Refactorizado** |
| `requests.py` | 3 | ⏳ Pendiente |
| `reports.py` | 2 | ⏳ Pendiente |
| Otros | ~34 | ⏳ Pendiente |

## 🚀 Script de Búsqueda/Reemplazo

Puedes usar esto para encontrar endpoints que necesitan refactorización:

```bash
# Contar total de "except Exception"
grep -r "except Exception" backend/app/api/ | wc -l

# Ver qué archivos tienen más
grep -r "except Exception" backend/app/api/ | cut -d: -f1 | sort | uniq -c | sort -rn

# Ver línea específica de un archivo
grep -n "except Exception" backend/app/api/payroll.py

# Ver contexto (5 líneas antes y después)
grep -B5 -A5 "except Exception" backend/app/api/ai_agents.py | head -30
```

## 📊 Checklist de Refactorización

Para cada endpoint:

- [ ] ¿Tiene `try-except` genérico?
- [ ] ¿Agregué import de `@handle_errors`?
- [ ] ¿Agregué decorator `@handle_errors()`?
- [ ] ¿Eliminé todos los bloques try-except?
- [ ] ¿La función ahora tiene solo el código principal?
- [ ] ¿Probé que funciona correctamente?

## 🧪 Testing

Después de refactorizar:

```bash
# Tests unitarios
pytest backend/tests/api/ -v

# Verificar que no hay except genéricos
grep "except Exception" backend/app/api/ai_agents.py | wc -l
# Debe devolver 0 después de refactorización completa
```

## 💡 Casos Especiales

### Caso 1: Endpoint con AIGatewayError
```python
# ANTES
try:
    response = await gateway.invoke_openai(...)
except AIGatewayError as e:
    logger.error(...)
    raise HTTPException(...)
except Exception as e:
    logger.error(...)
    raise HTTPException(...)

# DESPUÉS
@handle_errors()
async def invoke_openai(...):
    response = await gateway.invoke_openai(...)
    # El decorator maneja AIGatewayError automáticamente
```

### Caso 2: Endpoint con validación manual
```python
# ANTES
try:
    if not request.field:
        raise ValueError("Field is required")
    result = process(request)
except ValueError as e:
    raise HTTPException(status_code=400, detail=str(e))
except Exception as e:
    raise HTTPException(status_code=500, detail="Error")

# DESPUÉS
@handle_errors()
async def process_data(request: MyRequest):
    if not request.field:
        raise ValidationError("Field is required", field="field")
    result = process(request)
    return result
```

### Caso 3: Múltiples niveles de try-except
```python
# ANTES
try:
    try:
        inner_result = inner_function()
    except CustomError as e:
        raise ValueError(f"Inner error: {e}")

    outer_result = outer_function(inner_result)
except ValueError as e:
    raise HTTPException(...)
except Exception as e:
    raise HTTPException(...)

# DESPUÉS
@handle_errors()
async def process():
    inner_result = inner_function()  # Custom exceptions bubbled up
    outer_result = outer_function(inner_result)
    return outer_result
```

## 🎯 Meta

**Total exception handlers genéricos**: ~125
**Ya refactorizados**: 2 (payroll endpoint + 2 en ai_agents)
**Pendientes**: ~123

**Target**: Reducir a 0 genéricos, usar custom exceptions + @handle_errors

## 📚 Referencias

- `backend/app/core/app_exceptions.py` - Custom exception classes
- `backend/app/core/error_handlers.py` - Decorator @handle_errors()
- `backend/app/api/payroll.py` - Ejemplo de endpoint refactorizado

---

**Contribución bienvenida**: Si refactorizas más endpoints, haz un commit con el patrón y avisa en los comentarios.
