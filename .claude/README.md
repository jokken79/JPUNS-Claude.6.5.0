# Agentes Personalizados de Claude Code

Este proyecto incluye agentes personalizados que mejoran el flujo de trabajo de desarrollo.

## 📁 Estructura

```
.claude/
├── agents/              # Agentes personalizados (SE SUBEN A GIT)
│   ├── coder.md        # Agente de implementación
│   ├── research.md     # Agente de investigación con Jina AI
│   ├── stuck.md        # Agente de escalación humana
│   └── tester.md       # Agente de pruebas visuales con Playwright
├── CLAUDE.md           # Instrucciones del orquestador (SE SUBE A GIT)
└── settings.local.json # Configuración personal (NO se sube - en .gitignore)
```

## 🤖 Agentes Disponibles

### 1. **research** - Investigación de Documentación
Usa Jina AI para buscar documentación técnica.

**Cuándo usar:**
- Trabajas con una tecnología/librería nueva
- Necesitas documentación oficial actualizada

**Ejemplo:**
```
Usuario: "Necesito usar React Query v5"
Claude: Invocaré el agente research para obtener la documentación...
```

### 2. **coder** - Implementación de Código
Implementa tareas específicas de programación.

**Cuándo usar:**
- Implementar una funcionalidad específica
- Crear componentes nuevos
- Modificar lógica existente

**Ejemplo:**
```
Usuario: "Crea un formulario de login con validación"
Claude: Invocaré el agente coder para implementar esto...
```

### 3. **tester** - Pruebas Visuales
Usa Playwright MCP para verificar implementaciones visualmente.

**Cuándo usar:**
- Después de implementar UI nueva
- Verificar que una página funciona correctamente
- Validar formularios y navegación

**Ejemplo:**
```
Usuario: "Verifica que el login funciona"
Claude: Invocaré el agente tester para probarlo con Playwright...
```

### 4. **stuck** - Escalación Humana
Obtiene input humano cuando hay problemas o decisiones.

**Cuándo usar:**
- Errores que no se pueden resolver automáticamente
- Decisiones de diseño o arquitectura
- Conflictos o ambigüedades

**Ejemplo:**
```
Claude: Encontré un error. Invocando agente stuck para pedir ayuda...
```

## 🔄 Flujo de Trabajo (Orquestador)

Claude Code actúa como orquestador que:

1. **Planifica** tareas con TodoWrite
2. **Investiga** con `research` si hay tecnología nueva
3. **Implementa** con `coder` tarea por tarea
4. **Prueba** con `tester` después de cada implementación
5. **Escala** con `stuck` si hay problemas

## 🚀 Cómo Usar en Múltiples PCs

### Primera Vez (PC Nueva)

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/JPUNS-CLAUDE4.0.git
cd JPUNS-CLAUDE4.0

# 2. Los agentes YA ESTÁN incluidos en .claude/agents/
# No necesitas configurar nada!

# 3. Iniciar el proyecto
REINSTALAR.bat
```

### Actualizar Agentes en Otra PC

```bash
# 1. Bajar cambios (incluye agentes actualizados)
GIT_BAJAR.bat

# Los agentes se actualizan automáticamente!
```

### Modificar Agentes

Si modificas un agente en tu PC de trabajo:

```bash
# 1. Edita el agente
notepad .claude/agents/coder.md

# 2. Sube cambios
GIT_SUBIR.bat

# 3. En tu PC de casa
GIT_BAJAR.bat  # Los agentes se actualizan automáticamente
```

## 📝 Archivos y Su Comportamiento en Git

| Archivo | Se Sube a Git? | Por Qué |
|---------|----------------|---------|
| `.claude/agents/*.md` | ✅ SÍ | Son los agentes compartidos entre PCs |
| `.claude/CLAUDE.md` | ✅ SÍ | Instrucciones del orquestador |
| `.claude/settings.local.json` | ❌ NO | Configuración personal (en .gitignore) |

## ⚙️ Personalizar Agentes

Puedes modificar los agentes según tus necesidades:

```bash
# Editar agente de investigación
notepad .claude/agents/research.md

# Editar agente de código
notepad .claude/agents/coder.md

# Crear nuevo agente
notepad .claude/agents/mi-agente.md
```

Después de editar:
```bash
GIT_SUBIR.bat  # Los cambios se compartirán con todas tus PCs
```

## 🎯 Mejores Prácticas

1. **Usa los agentes proactivamente:** No esperes a tener problemas
2. **Documenta cambios:** Si modificas un agente, explica por qué
3. **Comparte mejoras:** Los agentes se comparten entre todas tus PCs
4. **No edites settings.local.json en Git:** Es configuración personal

## 📚 Documentación Adicional

- [Documentación oficial de Claude Code](https://docs.claude.com/claude-code)
- Ver `.claude/CLAUDE.md` para instrucciones del orquestador
- Ver cada archivo `.md` en `agents/` para detalles del agente

---

**Última actualización:** 2025-10-20  
**Versión:** 4.0
