# 🚀 INSTRUCCIONES DE USO - Sistema de Documentación para IAs

**Proyecto**: UNS-ClaudeJP v5.4  
**Fecha**: 2025-11-07  
**Para**: Desarrolladores y Sistemas de IA

---

## ⚡ INICIO ULTRA-RÁPIDO

### Para IAs que Inician por Primera Vez

**Opción 1: Inicio Rápido (30 segundos) - RECOMENDADO**
```bash
# Desde la raíz del proyecto (doble clic o en terminal)
INIT_AI_QUICK.bat
```

**Opción 2: Inicio Completo (5-10 minutos)**
```bash
# Desde la raíz del proyecto
INIT_AI_DOCS.bat
```

**Opción 3: Lectura Manual Secuencial**
```bash
type docs\GUIA_INICIO_IA.md              # 1. Contexto básico
type docs\ai\CONTEXTO_COMPLETO.md        # 2. Contexto completo
type docs\ai\COMANDOS_FRECUENTES.md      # 3. Comandos
type docs\INDEX_DOCUMENTACION.md         # 4. Índice maestro
```

---

## 📚 ¿QUÉ LEER SEGÚN TU NECESIDAD?

### 🔥 Necesito empezar YA (5 minutos)
```bash
INIT_AI_QUICK.bat
```
→ Tendrás contexto suficiente para comenzar a trabajar

### 🧠 Necesito contexto profundo (15 minutos)
```bash
INIT_AI_DOCS.bat
```
→ Tendrás contexto completo del proyecto

### 🔧 Necesito desarrollar algo nuevo
Lee en orden:
1. `docs/GUIA_INICIO_IA.md` - Contexto básico
2. `docs/core/CLAUDE.md` - Guía de desarrollo (496 líneas)
3. `docs/ai/CONTEXTO_COMPLETO.md` - Arquitectura detallada

### 🐛 Necesito arreglar un bug
Lee en orden:
1. `docs/ai/COMANDOS_FRECUENTES.md` - Comandos de debugging
2. `docs/scripts/SOLUCION_PROBLEMAS_LIMPIAR_CACHE.md` - Solución problemas
3. Logs del sistema: `LOGS.bat`

### 📖 Necesito buscar algo específico
```bash
# Consultar índice maestro
type docs\INDEX_DOCUMENTACION.md

# Buscar en documentación
grep -r "palabra_clave" docs/
```

### 🔌 Necesito entender una integración
```bash
# Ver integraciones disponibles
ls docs/integration/

# Leer integración específica
type docs\integration\TIMER_CARD_PAYROLL_INTEGRATION.md
```

---

## 🎯 FLUJOS DE TRABAJO RECOMENDADOS

### Flujo 1: Nueva Tarea Asignada
```
1. Ejecutar: INIT_AI_QUICK.bat (si no lo hiciste antes)
2. Revisar: docs/INDEX_DOCUMENTACION.md (buscar tema relacionado)
3. Leer: Documentación específica del tema
4. Consultar: docs/ai/COMANDOS_FRECUENTES.md (comandos necesarios)
5. Comenzar a trabajar
```

### Flujo 2: Primera Vez en el Proyecto
```
1. Ejecutar: INIT_AI_DOCS.bat (inicialización completa)
2. Leer: docs/GUIA_INICIO_IA.md (contexto esencial)
3. Estudiar: docs/core/CLAUDE.md (guía de desarrollo)
4. Familiarizarse: docs/ai/CONTEXTO_COMPLETO.md (arquitectura)
5. Practicar: docs/ai/COMANDOS_FRECUENTES.md (comandos)
6. Comenzar a trabajar
```

### Flujo 3: Consulta Rápida
```
1. Abrir: docs/INDEX_DOCUMENTACION.md
2. Buscar tema en el índice
3. Ir a sección correspondiente
4. Leer solo lo necesario
```

---

## 📂 MAPA DE NAVEGACIÓN RÁPIDA

```
¿Qué necesitas?                     → Lee esto:
─────────────────────────────────────────────────────────────
Iniciar trabajo                     → INIT_AI_QUICK.bat
Contexto completo                   → INIT_AI_DOCS.bat
Guía de desarrollo                  → docs/core/CLAUDE.md
Comandos frecuentes                 → docs/ai/COMANDOS_FRECUENTES.md
Arquitectura del sistema            → docs/ai/CONTEXTO_COMPLETO.md
Cambios en V5.4                     → docs/core/MIGRATION_V5.4_README.md
Historial de cambios                → docs/changelogs/
Solución de problemas               → docs/scripts/SOLUCION_PROBLEMAS_LIMPIAR_CACHE.md
Integraciones                       → docs/integration/
Base de datos                       → docs/database/BASEDATEJP_README.md
GitHub Copilot config               → docs/github/copilot-instructions.md
Análisis técnicos                   → docs/analysis/
```

---

## 🔧 COMANDOS ESENCIALES

### Verificar Sistema
```bash
# Ver estado de servicios
docker ps

# Ver logs
LOGS.bat                            # Windows - menú interactivo
docker compose logs -f              # Linux/macOS
```

### Acceder a Contenedores
```bash
# Backend
docker exec -it uns-claudejp-backend bash

# Frontend
docker exec -it uns-claudejp-frontend bash

# Base de datos
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp
```

### Servicios Web
```
Frontend:   http://localhost:3000
Backend:    http://localhost:8000
API Docs:   http://localhost:8000/api/docs
DB Admin:   http://localhost:8080

Login:      admin / admin123
```

---

## 🎓 GUÍA DE PRIORIDADES DE LECTURA

### 🔴 NIVEL 1: CRÍTICO (Leer SIEMPRE)
```
✅ docs/GUIA_INICIO_IA.md              # ~600 líneas - Inicio rápido
✅ docs/INDEX_DOCUMENTACION.md         # ~400 líneas - Mapa completo
✅ docs/core/CLAUDE.md                 # ~496 líneas - Guía desarrollo
```
**Total**: ~1,500 líneas (~10-15 minutos lectura)

### 🟡 NIVEL 2: ALTA PRIORIDAD (Leer según contexto)
```
✅ docs/ai/CONTEXTO_COMPLETO.md        # ~1,000 líneas - Contexto detallado
✅ docs/ai/COMANDOS_FRECUENTES.md      # ~800 líneas - Comandos
✅ docs/core/MIGRATION_V5.4_README.md  # Cambios V5.4
```
**Total**: ~1,800 líneas (~15-20 minutos lectura)

### 🟢 NIVEL 3: MEDIA (Consulta específica)
```
✅ docs/changelogs/                    # Historial de cambios
✅ docs/integration/                   # Documentación integraciones
✅ docs/scripts/                       # Guías de scripts
✅ docs/github/                        # Config GitHub Copilot
```

### ⚪ NIVEL 4: BAJA (Referencia)
```
✅ docs/database/                      # Docs de BD
✅ docs/analysis/                      # Análisis técnicos
```

---

## 💡 TIPS Y MEJORES PRÁCTICAS

### Para IAs
1. **Siempre** ejecuta `INIT_AI_QUICK.bat` al iniciar
2. **Consulta** `INDEX_DOCUMENTACION.md` antes de buscar
3. **Lee** `COMANDOS_FRECUENTES.md` antes de ejecutar comandos
4. **Verifica** patrones en código existente antes de crear nuevo
5. **Nunca** borres código funcional sin confirmar

### Para Desarrolladores
1. **Actualiza** documentación al hacer cambios importantes
2. **Busca** archivos .md existentes antes de crear nuevos
3. **Usa** formato de fecha: `## 📅 YYYY-MM-DD - [TÍTULO]`
4. **Mantén** actualizado el `INDEX_DOCUMENTACION.md`
5. **Documenta** decisiones técnicas importantes

---

## 📝 FORMATO ESTÁNDAR DE DOCUMENTACIÓN

### Encabezado de Archivo .md
```markdown
# 🔰 TÍTULO DEL DOCUMENTO

**Propósito**: Descripción breve  
**Última actualización**: YYYY-MM-DD  
**Para**: Audiencia objetivo

---
```

### Sección con Fecha
```markdown
## 📅 2025-11-07 - [TÍTULO DE LA ACTUALIZACIÓN]

Contenido de la actualización...
```

### Categorías Visuales
```markdown
🎯 Objetivo/Meta
🔴 Crítico/Importante
🟡 Alta prioridad
🟢 Media prioridad
⚪ Baja prioridad
✅ Completado
⏳ En progreso
❌ Error/Problema
💡 Tip/Sugerencia
📚 Documentación
🔧 Código/Técnico
🐛 Bug/Debugging
```

---

## 🔍 BÚSQUEDA EN DOCUMENTACIÓN

### Buscar Texto
```bash
# Windows (PowerShell)
Select-String -Path "docs\**\*.md" -Pattern "palabra_clave"

# Linux/macOS/Git Bash
grep -r "palabra_clave" docs/

# Buscar en archivo específico
type docs\GUIA_INICIO_IA.md | findstr "palabra"
```

### Listar Todos los .md
```bash
# Windows
dir docs\*.md /s /b

# Linux/macOS
find docs/ -name "*.md"
```

---

## 🚨 REGLAS IMPORTANTES

### ⛔ NUNCA HACER
1. Borrar archivos .bat en `/scripts/` sin autorización
2. Modificar `docker-compose.yml` sin confirmar
3. Borrar contenido de `/docs/` sin backup
4. Crear archivos .md duplicados (buscar primero)
5. Ignorar las reglas en `docs/core/CLAUDE.md`

### ✅ SIEMPRE HACER
1. Leer documentación relevante antes de cambios
2. Actualizar docs al hacer cambios importantes
3. Usar formato de fecha en actualizaciones
4. Mantener compatibilidad con Windows
5. Probar cambios en contenedor antes de commit

---

## 📞 RECURSOS DE AYUDA

### Documentación Principal
- **Índice Maestro**: `docs/INDEX_DOCUMENTACION.md`
- **Guía de Inicio**: `docs/GUIA_INICIO_IA.md`
- **Guía de Desarrollo**: `docs/core/CLAUDE.md`
- **Contexto Completo**: `docs/ai/CONTEXTO_COMPLETO.md`

### Scripts de Ayuda
- **Diagnóstico**: `DIAGNOSTICO.bat`
- **Logs**: `LOGS.bat`
- **Solución Problemas**: Ver `docs/scripts/SOLUCION_PROBLEMAS_LIMPIAR_CACHE.md`

### URLs del Sistema
- API Docs: http://localhost:8000/api/docs (Swagger interactivo)
- Frontend: http://localhost:3000
- DB Admin: http://localhost:8080 (Adminer)

---

## 🎉 ¡LISTO PARA EMPEZAR!

### Siguiente Paso Recomendado:
```bash
# Si es tu primera vez:
INIT_AI_DOCS.bat

# Si ya conoces el proyecto:
INIT_AI_QUICK.bat

# Si solo necesitas referencia:
type docs\INDEX_DOCUMENTACION.md
```

---

## 📊 RESUMEN DE ARCHIVOS CLAVE

| Archivo | Líneas | Tiempo Lectura | Prioridad |
|---------|--------|----------------|-----------|
| GUIA_INICIO_IA.md | ~600 | 5 min | 🔴 CRÍTICA |
| INDEX_DOCUMENTACION.md | ~400 | 3 min | 🔴 CRÍTICA |
| CLAUDE.md | ~496 | 5 min | 🔴 CRÍTICA |
| CONTEXTO_COMPLETO.md | ~1000 | 10 min | 🟡 ALTA |
| COMANDOS_FRECUENTES.md | ~800 | 8 min | 🟡 ALTA |
| README.md (docs) | ~500 | 5 min | 🟢 MEDIA |

**Total lectura crítica**: ~13 minutos  
**Total lectura alta prioridad**: ~31 minutos

---

**✨ Sistema de documentación listo para uso**

Elige tu camino y comienza a trabajar. Toda la información está organizada y accesible.

---

*Creado: 2025-11-07*  
*Última actualización: 2025-11-07*  
*Versión: 1.0*