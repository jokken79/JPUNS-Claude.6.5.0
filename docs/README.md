# Documentación - UNS-ClaudeJP 6.0.0

## Índice de Documentación

### 🎯 Comienza Aquí

| Documento | Descripción |
|-----------|-------------|
| [START_HERE.md](../START_HERE.md) | ⭐ Guía de inicio en 30 segundos |
| [00-START-HERE/](00-START-HERE/) | Documentación de inicio rápido |
| [00-START-HERE/QUICK_START.md](00-START-HERE/QUICK_START.md) | Guía de inicio rápido detallada |
| [00-START-HERE/ARCHITECTURE.md](00-START-HERE/ARCHITECTURE.md) | Arquitectura del sistema |

### 📚 Categorías de Documentación

#### 01. Instalación
- Instalación en Windows
- Instalación en Linux/macOS
- Instalación con Docker
- Requisitos del sistema
- Configuración inicial

#### 02. Configuración
- Base de datos
- Migraciones
- Backups
- Variables de entorno
- Configuración de servicios

#### 03. Uso
- OCR japonés
- Sistema de temas
- Impresión de documentos
- Gestión de candidatos
- Gestión de empleados
- Control de asistencia
- Cálculo de nómina
- Solicitudes de empleados

#### 04. Troubleshooting
- Problemas comunes
- Solución de errores
- Diagnósticos
- Logs
- Windows troubleshooting

#### 05. DevOps
- Git y GitHub
- CI/CD
- Docker
- Deployment
- Monitoreo

#### 06. Agentes
- Sistema de agentes
- OpenSpec
- Claude integration
- AI tools

### 🤖 Documentación para IAs

| Documento | Propósito |
|-----------|-----------|
| [DOCUMENTACION_COMPLETA.md](../DOCUMENTACION_COMPLETA.md) | Documentación integrada completa |
| [CLAUDE.md](../CLAUDE.md) | Reglas y patrones para IAs |
| [AUTORIDAD_SISTEMA.md](AUTORIDAD_SISTEMA.md) | Arquitectura completa (3,500 líneas) |
| [ESPECIFICACION_MAPA.md](ESPECIFICACION_MAPA.md) | Mapas visuales del sistema |

### 📊 Documentación Técnica

#### Architecture
- Arquitectura general
- Arquitectura backend
- Arquitectura frontend
- Arquitectura de base de datos
- Flujos de datos

#### Guides
- Development patterns
- Common issues
- Best practices
- Testing guide
- Performance guide

#### Database
- Schema completo
- Relaciones entre tablas
- Migraciones
- Queries comunes

## Estructura de Directorios

```
docs/
├── 00-START-HERE/          # Inicio rápido
├── 01-instalacion/         # Guías de instalación
├── 02-configuracion/       # Configuración del sistema
├── 03-uso/                 # Guías de uso
├── 04-troubleshooting/     # Solución de problemas
├── 05-devops/              # DevOps y deployment
├── 06-agentes/             # Sistema de agentes
├── architecture/           # Arquitectura detallada
├── guides/                 # Guías de desarrollo
└── database/               # Documentación de BD
```

## Convenciones de Documentación

### Formato de Archivos
- Todos los archivos en formato Markdown (.md)
- Uso de GitHub-flavored Markdown
- Tablas para comparaciones
- Code blocks con syntax highlighting
- Emojis para mejor legibilidad

### Estructura de Documentos
1. Título principal (H1)
2. Descripción breve
3. Tabla de contenidos (si es largo)
4. Secciones principales (H2)
5. Subsecciones (H3-H6)
6. Ejemplos de código
7. Referencias y links

### Estilo
- Claro y conciso
- Ejemplos prácticos
- Screenshots cuando sea necesario
- Links a documentación relacionada
- Advertencias y notas importantes

## Contribuir a la Documentación

### Añadir Nueva Documentación

1. Identificar la categoría correcta
2. Crear archivo .md en el directorio correspondiente
3. Seguir el template de documentación
4. Actualizar el índice (INDEX.md)
5. Crear PR con los cambios

### Actualizar Documentación Existente

1. Leer la documentación actual
2. Identificar qué necesita actualizarse
3. Hacer cambios manteniendo el formato
4. Verificar links y referencias
5. Crear PR con los cambios

### Template de Documentación

```markdown
# Título del Documento

## Descripción

Breve descripción del contenido.

## Tabla de Contenidos

- [Sección 1](#sección-1)
- [Sección 2](#sección-2)

## Sección 1

Contenido...

### Subsección 1.1

Contenido...

## Ejemplos

```bash
# Ejemplo de comando
```

## Referencias

- [Documento relacionado](link)
```

## Herramientas de Documentación

- **Markdown Editors**: VSCode, Typora, Mark Text
- **Diagramas**: Mermaid, draw.io
- **Screenshots**: ShareX, Lightshot
- **Validación**: markdownlint

## Licencia

La documentación está bajo la misma licencia MIT que el proyecto.
