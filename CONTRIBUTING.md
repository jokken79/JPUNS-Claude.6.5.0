# Guía de Contribución - UNS-ClaudeJP 6.0.0

## 🎯 Cómo Contribuir

Gracias por tu interés en contribuir a UNS-ClaudeJP. Esta guía te ayudará a hacer contribuciones efectivas.

## 📖 Antes de Empezar

### 1. Lectura Obligatoria

**IMPORTANTE:** Lee estos documentos antes de contribuir:

- ✅ [CLAUDE.md](CLAUDE.md) - Reglas y patrones del proyecto
- ✅ [README.md](README.md) - Descripción general del proyecto
- ✅ [ARCHITECTURE.md](docs/00-START-HERE/ARCHITECTURE.md) - Arquitectura del sistema

### 2. Configurar tu Entorno

```bash
# Fork el repositorio en GitHub
# Clonar tu fork
git clone https://github.com/TU_USUARIO/JPUNS-Claude.6.0.2.git
cd JPUNS-Claude.6.0.2

# Añadir upstream remote
git remote add upstream https://github.com/jokken79/JPUNS-Claude.6.0.2.git

# Configurar .env
cp .env.example .env
# Editar .env con tus credenciales

# Iniciar servicios
docker compose up -d
```

## 🔄 Workflow de Contribución

### 1. Crear una Branch

```bash
# Actualizar tu fork
git checkout main
git pull upstream main

# Crear feature branch
git checkout -b feature/descripcion-corta
# o para bugs
git checkout -b fix/descripcion-del-bug
```

### 2. Hacer tus Cambios

- Seguir los patrones de código existentes
- Escribir código limpio y documentado
- Añadir tests si es necesario
- Actualizar documentación si es necesario

### 3. Commits

```bash
# Hacer commit con mensaje descriptivo
git add .
git commit -m "feat: descripción clara del cambio"

# Tipos de commits (Conventional Commits):
# - feat: Nueva funcionalidad
# - fix: Corrección de bug
# - docs: Cambios en documentación
# - style: Cambios de formato (no afectan código)
# - refactor: Refactorización de código
# - test: Añadir o modificar tests
# - chore: Cambios en build, CI, etc.
```

### 4. Push y Pull Request

```bash
# Push a tu fork
git push origin feature/descripcion-corta

# Crear Pull Request en GitHub
# Título: [feat] Descripción clara
# Descripción: Explicar qué, por qué y cómo
```

## ✅ Checklist antes de PR

- [ ] El código sigue los patrones del proyecto
- [ ] Tests pasan (`pytest` backend, `npm test` frontend)
- [ ] Linting pasa (`npm run lint` frontend)
- [ ] Type checking pasa (`npm run typecheck` frontend)
- [ ] Documentación actualizada si es necesario
- [ ] Commits siguen Conventional Commits
- [ ] Branch actualizada con main
- [ ] No hay conflictos de merge
- [ ] `.env` no está incluido (solo `.env.example`)
- [ ] No hay credenciales o secrets en el código

## 🚫 Normas Críticas

### ❌ NUNCA HACER

- ❌ NO modificar scripts en `scripts/` sin consultar
- ❌ NO eliminar código funcional sin reemplazo
- ❌ NO modificar `docker-compose.yml` sin aprobación
- ❌ NO cambiar versiones fijas de dependencias
- ❌ NO tocar archivos en `.claude/` sin permiso
- ❌ NO modificar `backend/alembic/versions/` directamente
- ❌ NO hacer commit de `.env` o archivos con credenciales
- ❌ NO hacer commit de archivos grandes (>10MB)
- ❌ NO hacer commit de `node_modules/` o `__pycache__/`

### ✅ SIEMPRE HACER

- ✅ Usar Windows-compatible paths en batch files (`\` no `/`)
- ✅ Mantener compatibilidad Docker
- ✅ Crear branch antes de cambios
- ✅ Seguir patrones de arquitectura existentes
- ✅ Usar SQLAlchemy ORM (no SQL directo)
- ✅ Usar Next.js App Router (no Pages Router)
- ✅ Usar Shadcn/ui components para UI
- ✅ Escribir docstrings y type hints en Python
- ✅ Escribir TypeScript types en frontend
- ✅ Actualizar documentación con cambios

## 📝 Estándares de Código

### Python (Backend)

```python
# Usar type hints
def get_user(user_id: int) -> Optional[User]:
    """
    Obtener usuario por ID.

    Args:
        user_id: ID del usuario

    Returns:
        User object o None si no existe
    """
    return db.query(User).filter(User.id == user_id).first()

# Usar docstrings
# Usar snake_case para variables y funciones
# Usar PascalCase para clases
```

### TypeScript (Frontend)

```typescript
// Usar tipos explícitos
interface UserData {
  id: number;
  name: string;
  email: string;
}

// Usar async/await
async function fetchUser(id: number): Promise<UserData> {
  const response = await api.get(`/users/${id}`);
  return response.data;
}

// Usar camelCase para variables y funciones
// Usar PascalCase para componentes y tipos
```

### React Components

```tsx
// Functional components con TypeScript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} className={cn('btn', `btn-${variant}`)}>
      {label}
    </button>
  );
}
```

## 🧪 Testing

### Backend Tests

```bash
# Ejecutar todos los tests
pytest backend/tests/ -v

# Ejecutar tests específicos
pytest backend/tests/test_auth.py -vs

# Coverage
pytest --cov=app backend/tests/
```

### Frontend Tests

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

## 📚 Documentación

### Actualizar Documentación

Si tu cambio afecta:
- **API**: Actualizar docstrings en FastAPI
- **UI**: Actualizar docs en `docs/03-uso/`
- **Arquitectura**: Actualizar `docs/00-START-HERE/ARCHITECTURE.md`
- **Configuración**: Actualizar `.env.example` y docs

### Escribir Documentación

- Usar Markdown con GitHub flavor
- Incluir ejemplos de código
- Usar tablas para comparaciones
- Incluir screenshots si es necesario
- Links a documentación relacionada

## 🐛 Reportar Bugs

### Template de Bug Report

```markdown
**Descripción del Bug**
Descripción clara del problema.

**Pasos para Reproducir**
1. Ir a '...'
2. Click en '...'
3. Ver error

**Comportamiento Esperado**
Qué debería pasar.

**Comportamiento Actual**
Qué está pasando.

**Screenshots**
Si aplica.

**Entorno**
- OS: [e.g. Windows 11]
- Docker: [e.g. 24.0.0]
- Browser: [e.g. Chrome 120]

**Logs**
```
Logs relevantes
```
```

## 💡 Proponer Features

### Template de Feature Request

```markdown
**Feature Propuesto**
Descripción clara del feature.

**Problema que Resuelve**
Qué problema resuelve este feature.

**Solución Propuesta**
Cómo funcionaría.

**Alternativas Consideradas**
Otras formas de resolver el problema.

**Impacto**
- Performance
- UX
- Complejidad
```

## 🤝 Código de Conducta

- Ser respetuoso y profesional
- Dar feedback constructivo
- Aceptar críticas constructivas
- Enfocarse en el código, no en la persona
- Ayudar a otros colaboradores

## 📞 Obtener Ayuda

- **Issues**: [GitHub Issues](https://github.com/jokken79/JPUNS-Claude.6.0.2/issues)
- **Documentación**: [docs/](docs/)
- **Troubleshooting**: [docs/04-troubleshooting/](docs/04-troubleshooting/)

## 🎉 Reconocimientos

Todos los contribuidores serán reconocidos en el README y en los release notes.

---

**Gracias por contribuir a UNS-ClaudeJP! 🙏**
