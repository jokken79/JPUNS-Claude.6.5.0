# 📚 ÍNDICE MAESTRO DE DOCUMENTACIÓN - UNS-ClaudeJP v5.4

**Última actualización**: 2025-11-07  
**Versión del Sistema**: 5.4  
**Propósito**: Centralizar toda la documentación del sistema para acceso rápido de IAs y desarrolladores

---

## 🎯 GUÍA RÁPIDA

| Para... | Lee esto primero |
|---------|------------------|
| 🤖 **Iniciar IA** | [`GUIA_INICIO_IA.md`](./GUIA_INICIO_IA.md) |
| 🚀 **Comenzar proyecto** | [`core/README.md`](./core/README.md) |
| 🔧 **Desarrollo con IA** | [`core/CLAUDE.md`](./core/CLAUDE.md) |
| 📦 **Migración V5.2→V5.4** | [`core/MIGRATION_V5.4_README.md`](./core/MIGRATION_V5.4_README.md) |
| 🐛 **Solución problemas** | [`scripts/SOLUCION_PROBLEMAS_LIMPIAR_CACHE.md`](./scripts/SOLUCION_PROBLEMAS_LIMPIAR_CACHE.md) |

---

## 📂 ESTRUCTURA DE DOCUMENTACIÓN

### 🏠 `/docs/core/` - Documentación Central
**Prioridad**: 🔴 CRÍTICA - Lectura obligatoria para IAs

| Archivo | Descripción | Líneas | Última Act. |
|---------|-------------|--------|-------------|
| [`README.md`](./core/README.md) | Documentación principal del proyecto | - | - |
| [`CLAUDE.md`](./core/CLAUDE.md) | Guía completa de desarrollo para IA (496 líneas) | 496 | V5.4 |
| [`MIGRATION_V5.4_README.md`](./core/MIGRATION_V5.4_README.md) | Guía migración V5.2 → V5.4 | - | 2025-11 |

**Contexto**: Estos archivos contienen la arquitectura, reglas críticas y convenciones del proyecto.

---

### 📝 `/docs/changelogs/` - Historial de Cambios
**Prioridad**: 🟡 ALTA - Revisar antes de cambios importantes

| Archivo | Descripción | Versión |
|---------|-------------|---------|
| [`CHANGELOG_V5.2_TO_V5.4.md`](./changelogs/CHANGELOG_V5.2_TO_V5.4.md) | Cambios detallados V5.2 → V5.4 | 5.4 |
| [`CHANGELOG_REINSTALAR.md`](./changelogs/CHANGELOG_REINSTALAR.md) | Historial de cambios en scripts de instalación | - |

**Contexto**: Registro completo de cambios entre versiones y decisiones técnicas tomadas.

---

### 🔗 `/docs/integration/` - Integraciones del Sistema
**Prioridad**: 🟢 MEDIA - Consultar al trabajar con integraciones específicas

| Archivo | Descripción | Sistema |
|---------|-------------|---------|
| [`TIMER_CARD_PAYROLL_INTEGRATION.md`](./integration/TIMER_CARD_PAYROLL_INTEGRATION.md) | Integración tarjetas de tiempo con nómina | Timer Cards + Payroll |

**Contexto**: Documentación técnica de integraciones entre módulos del sistema.

---

### 🛠️ `/docs/scripts/` - Documentación de Scripts
**Prioridad**: 🟢 MEDIA - Consultar al usar scripts específicos

| Archivo | Descripción | Scripts Relacionados |
|---------|-------------|---------------------|
| [`SOLUCION_PROBLEMAS_LIMPIAR_CACHE.md`](./scripts/SOLUCION_PROBLEMAS_LIMPIAR_CACHE.md) | Guía de solución problemas de caché | `LIMPIAR_CACHE.bat` |
| [`PHOTO_IMPORT_GUIDE.md`](./scripts/PHOTO_IMPORT_GUIDE.md) | Guía de importación de fotos | `BUSCAR_FOTOS_AUTO.bat` |

**Contexto**: Instrucciones detalladas para scripts batch y PowerShell del sistema.

---

### 🐙 `/docs/github/` - Configuración GitHub & Copilot
**Prioridad**: 🟢 MEDIA - Para desarrollo con GitHub Copilot

| Archivo | Descripción | Tipo |
|---------|-------------|------|
| [`copilot-instructions.md`](./github/copilot-instructions.md) | Instrucciones para GitHub Copilot | Configuración |
| [`prompts/`](./github/prompts/) | Plantillas de prompts para especificaciones | Templates |

**Archivos en `/prompts/`:**
- `openspec-archive.prompt.md`
- `openspec-apply.prompt.md`
- `openspec-proposal.prompt.md`
- `speckit.analyze.prompt.md`
- `speckit.checklist.prompt.md`
- `speckit.clarify.prompt.md`
- `speckit.constitution.prompt.md`
- `speckit.implement.prompt.md`
- `speckit.specify.prompt.md`
- `speckit.tasks.prompt.md`

**Contexto**: Configuraciones y plantillas para trabajar con GitHub Copilot y sistemas de especificaciones.

---

### 🗄️ `/docs/database/` - Documentación de Base de Datos
**Prioridad**: 🟡 ALTA - Consultar al trabajar con datos

| Archivo | Descripción | Sistema |
|---------|-------------|---------|
| [`BASEDATEJP_README.md`](./database/BASEDATEJP_README.md) | Documentación base de datos japonesa | PostgreSQL 15 + Access |

**Contexto**: Documentación de esquemas de base de datos, migraciones y datos maestros japoneses.

---

### 🔍 `/docs/analysis/` - Análisis Técnicos
**Prioridad**: 🟢 MEDIA - Consultar para optimización y refactorización

| Archivo | Descripción | Fecha |
|---------|-------------|-------|
| [`ANALISIS_DOCUMENTACION_MIGRACION_V5.4.md`](./analysis/ANALISIS_DOCUMENTACION_MIGRACION_V5.4.md) | Análisis de documentación post-migración | 2025-11-07 |

**Contexto**: Análisis técnicos del sistema, código no usado, optimizaciones y auditorías.

---

### 🤖 `/docs/ai/` - Documentación Específica para IA
**Prioridad**: 🔴 CRÍTICA - Lectura obligatoria para IAs al iniciar

| Archivo | Descripción | Propósito |
|---------|-------------|-----------|
| [`CONTEXTO_COMPLETO.md`](./ai/CONTEXTO_COMPLETO.md) | Contexto completo del proyecto | Onboarding IA |
| [`COMANDOS_FRECUENTES.md`](./ai/COMANDOS_FRECUENTES.md) | Comandos más utilizados | Referencia rápida |

**Contexto**: Información específicamente estructurada para consumo de sistemas de IA.

---

## 🎨 CONVENCIONES DE PRIORIDAD

| Símbolo | Nivel | Cuándo Leer |
|---------|-------|-------------|
| 🔴 | **CRÍTICA** | Al iniciar/antes de cualquier cambio |
| 🟡 | **ALTA** | Antes de cambios importantes |
| 🟢 | **MEDIA** | Cuando se trabaja con el tema específico |
| ⚪ | **BAJA** | Para referencia ocasional |

---

## 🔗 ENLACES EXTERNOS A DOCUMENTACIÓN

### Archivos en Raíz del Proyecto
Los siguientes archivos permanecen en la raíz por razones de compatibilidad:

- `/README.md` - README principal (también copiado a `docs/core/`)
- `/CLAUDE.md` - Guía de IA (también copiado a `docs/core/`)
- `/.github/copilot-instructions.md` - Instrucciones Copilot (también copiado a `docs/github/`)

### Documentación de Código
- `/backend/` - Código backend con docstrings
- `/frontend/` - Código frontend con comentarios TypeScript
- `/scripts/` - Scripts con comentarios inline

---

## 🚀 COMANDOS DE ACCESO RÁPIDO

### Para Desarrolladores
```bash
# Ver toda la documentación
ls -R docs/

# Buscar en documentación
grep -r "palabra_clave" docs/

# Ver índice
cat docs/INDEX_DOCUMENTACION.md
```

### Para IAs
```bash
# Inicializar contexto completo
cat docs/GUIA_INICIO_IA.md
cat docs/ai/CONTEXTO_COMPLETO.md

# Lectura secuencial recomendada
cat docs/core/README.md
cat docs/core/CLAUDE.md
cat docs/core/MIGRATION_V5.4_README.md
```

---

## 📊 ESTADÍSTICAS DE DOCUMENTACIÓN

- **Total archivos .md**: ~316 archivos
- **Archivos en `/docs/`**: ~25+ archivos principales
- **Total líneas documentación**: ~2000+ líneas
- **Idiomas**: Español (principal), Japonés (nombres/términos), Inglés (código)

---

## 🔄 MANTENIMIENTO DE DOCUMENTACIÓN

### Reglas de Actualización
1. **Siempre buscar antes de crear**: Verificar si existe .md similar
2. **Formato de fecha**: Incluir `## 📅 YYYY-MM-DD - [TÍTULO]` en actualizaciones
3. **Reutilizar existente**: Editar archivos existentes en lugar de crear duplicados
4. **Actualizar índice**: Actualizar este archivo al agregar nueva documentación

### Responsabilidades
- **IAs**: Actualizar documentación al hacer cambios importantes
- **Desarrolladores**: Mantener changelogs y documentación de scripts
- **Mantenimiento**: Revisar y consolidar documentación mensualmente

---

## 📞 REFERENCIAS CRUZADAS

- **Arquitectura del Sistema**: Ver [`core/CLAUDE.md`](./core/CLAUDE.md) - Sección "Arquitectura del Sistema"
- **Flujos de Trabajo**: Ver [`core/CLAUDE.md`](./core/CLAUDE.md) - Sección "Flujos de Trabajo Esenciales"
- **Comandos Docker**: Ver [`core/README.md`](./core/README.md)
- **Solución de Problemas**: Ver [`scripts/SOLUCION_PROBLEMAS_LIMPIAR_CACHE.md`](./scripts/SOLUCION_PROBLEMAS_LIMPIAR_CACHE.md)

---

**🤖 Para IAs**: Leer primero [`GUIA_INICIO_IA.md`](./GUIA_INICIO_IA.md) para inicialización rápida.  
**👨‍💻 Para Humanos**: Empezar con [`core/README.md`](./core/README.md) para visión general del proyecto.

---

*Última actualización de este índice: 2025-11-07*  
*Mantenido por: Sistema de IA + Equipo de Desarrollo*