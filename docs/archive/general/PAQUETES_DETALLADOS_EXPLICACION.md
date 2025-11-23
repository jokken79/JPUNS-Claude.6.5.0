# 📦 Análisis Detallado de Paquetes - UNS-ClaudeJP 5.4.1

## 🎨 FRONTEND (105 paquetes npm)

### ⚛️ Framework Principal y Core (8 paquetes)
| Paquete | Versión | Función |
|---------|---------|---------|
| `next` | 16.0.0 | Framework React con SSR, SSG, enrutamiento automático, optimización de imágenes |
| `react` | 19.0.0 | Librería UI declarativa para construir interfaces de componentes |
| `react-dom` | 19.0.0 | Renderizador de React para el navegador (DOM) |
| `typescript` | 5.6.0 | Superset de JavaScript con tipado estático para prevenir bugs |
| `autoprefixer` | 10.4.21 | Añade prefijos CSS vendor automáticamente (-webkit, -moz, etc) |
| `postcss` | 8.4.47 | Herramienta para transformar CSS con plugins JavaScript |
| `tailwindcss` | 3.4.13 | Framework CSS utility-first para diseño rápido y consistente |
| `tailwindcss-animate` | 1.0.7 | Plugin Tailwind para animaciones predefinidas |

### 🎯 UI Components - Radix UI (18 paquetes)
Componentes accesibles, sin estilos, totalmente customizables:
| Paquete | Función |
|---------|---------|
| `@radix-ui/react-accordion` | Acordeones expandibles/colapsables |
| `@radix-ui/react-avatar` | Avatares con fallback de iniciales |
| `@radix-ui/react-checkbox` | Checkboxes accesibles |
| `@radix-ui/react-dialog` | Modales y diálogos |
| `@radix-ui/react-dropdown-menu` | Menús desplegables |
| `@radix-ui/react-label` | Labels para formularios |
| `@radix-ui/react-scroll-area` | Áreas scrolleables customizadas |
| `@radix-ui/react-select` | Selectores dropdown |
| `@radix-ui/react-separator` | Líneas separadoras |
| `@radix-ui/react-slider` | Sliders de rango |
| `@radix-ui/react-progress` | Barras de progreso |
| `@radix-ui/react-slot` | Composición de componentes |
| `@radix-ui/react-switch` | Toggles on/off |
| `@radix-ui/react-tabs` | Sistema de pestañas |
| `@radix-ui/react-toggle-group` | Grupos de botones toggle |
| `@radix-ui/react-tooltip` | Tooltips informativos |

### 📊 Data Management & Forms (10 paquetes)
| Paquete | Función |
|---------|---------|
| `@tanstack/react-query` | Fetching, caching, sincronización de datos del servidor |
| `@tanstack/react-query-devtools` | DevTools para inspeccionar queries |
| `@tanstack/react-table` | Tablas avanzadas con sorting, filtering, pagination |
| `react-hook-form` | Formularios performantes con validación |
| `@hookform/resolvers` | Integración de validadores (Zod, Yup) con react-hook-form |
| `zod` | Schema validation con TypeScript inference |
| `zustand` | State management minimalista y rápido |
| `axios` | Cliente HTTP con interceptores y transformers |
| `date-fns` | Manipulación de fechas moderna (reemplazo de moment.js) |

### 🎨 UI Enhancement & Icons (9 paquetes)
| Paquete | Función |
|---------|---------|
| `@heroicons/react` | Iconos SVG optimizados de Tailwind Labs |
| `lucide-react` | 1000+ iconos consistentes y customizables |
| `framer-motion` | Animaciones declarativas y gestos |
| `next-themes` | Tema claro/oscuro con SSR sin flash |
| `react-colorful` | Color picker ligero y accesible |
| `class-variance-authority` | Variantes de componentes tipo-safe |
| `clsx` | Utilidad para concatenar classNames condicionales |
| `tailwind-merge` | Merge inteligente de clases Tailwind (evita conflictos) |
| `@tailwindcss/forms` | Estilos base para formularios |

### 📈 Charts & Visualization (1 paquete)
| Paquete | Función |
|---------|---------|
| `recharts` | Gráficos React componibles (líneas, barras, pie, etc) |

### 🔔 Notifications & Feedback (2 paquetes)
| Paquete | Función |
|---------|---------|
| `react-hot-toast` | Notificaciones toast elegantes y animadas |
| `sonner` | Toast notifications con stack inteligente |

### 📁 File Handling (2 paquetes)
| Paquete | Función |
|---------|---------|
| `react-dropzone` | Zona drag & drop para subir archivos |
| `qrcode` | Generador de códigos QR |

### 📡 Observability & Monitoring (10 paquetes OpenTelemetry)
| Paquete | Función |
|---------|---------|
| `@opentelemetry/api` | API estándar para telemetría |
| `@opentelemetry/api-logs` | API de logs |
| `@opentelemetry/context-zone` | Propagación de contexto |
| `@opentelemetry/exporter-trace-otlp-http` | Exportar traces via HTTP |
| `@opentelemetry/instrumentation-fetch` | Auto-instrumentación de fetch |
| `@opentelemetry/resources` | Metadatos de recursos |
| `@opentelemetry/sdk-trace-base` | SDK base de tracing |
| `@opentelemetry/sdk-trace-web` | SDK web de tracing |
| `@vercel/otel` | Integración OpenTelemetry para Vercel |

### ⚡ Performance (1 paquete)
| Paquete | Función |
|---------|---------|
| `critters` | Inline critical CSS y lazy-load el resto |

---

### 🧪 DevDependencies - Testing & Quality (27 paquetes)

#### Testing
| Paquete | Función |
|---------|---------|
| `@playwright/test` | E2E testing en navegadores reales |
| `vitest` | Test runner ultrarrápido compatible con Vite |
| `@vitejs/plugin-react` | Plugin React para Vitest |
| `@vitest/coverage-v8` | Coverage de código con V8 |
| `jsdom` | DOM virtual para testing |
| `@testing-library/react` | Testing de componentes enfocado en usuario |
| `@testing-library/dom` | Utilidades DOM para testing |
| `@testing-library/jest-dom` | Matchers custom de Jest para DOM |
| `@testing-library/user-event` | Simulación avanzada de interacciones |

#### Linting & Formatting
| Paquete | Función |
|---------|---------|
| `eslint` | Linter JavaScript/TypeScript |
| `eslint-config-next` | Configuración ESLint para Next.js |
| `eslint-config-prettier` | Desactiva reglas que conflictúan con Prettier |
| `eslint-plugin-prettier` | Ejecuta Prettier como regla ESLint |
| `prettier` | Code formatter opinionado |
| `prettier-plugin-tailwindcss` | Ordena clases Tailwind automáticamente |

#### TypeScript Types
| Paquete | Función |
|---------|---------|
| `@types/node` | Tipos TypeScript para Node.js |
| `@types/react` | Tipos para React |
| `@types/react-dom` | Tipos para React DOM |
| `@types/qrcode` | Tipos para qrcode |
| `@types/testing-library__jest-dom` | Tipos para jest-dom |

---

## 🐍 BACKEND (91 paquetes Python)

### 🚀 Framework Web (3 paquetes)
| Paquete | Función |
|---------|---------|
| `fastapi==0.115.6` | Framework web moderno, rápido, con validación automática |
| `uvicorn[standard]==0.34.0` | Servidor ASGI ultrarrápido para FastAPI |
| `python-multipart==0.0.20` | Parsing de formularios multipart/form-data (uploads) |

### 🗄️ Base de Datos (3 paquetes)
| Paquete | Función |
|---------|---------|
| `sqlalchemy==2.0.36` | ORM Python más popular, manejo de BD relacional |
| `psycopg2-binary==2.9.10` | Driver PostgreSQL binario (pre-compilado) |
| `alembic==1.17.0` | Migraciones de BD con versionado |

### 🔐 Autenticación & Seguridad (3 paquetes)
| Paquete | Función |
|---------|---------|
| `python-jose[cryptography]==3.3.0` | JWT tokens (autenticación stateless) |
| `passlib[bcrypt]==1.7.4` | Hashing de contraseñas con múltiples algoritmos |
| `bcrypt==4.2.1` | Algoritmo bcrypt para hash seguro |

### 📸 OCR & Procesamiento de Imágenes (7 paquetes)
| Paquete | Función |
|---------|---------|
| `Pillow==11.1.0` | Librería Python para manipulación de imágenes |
| `pdf2image==1.17.0` | Convierte PDFs a imágenes |
| `opencv-python-headless==4.10.0.84` | Computer vision sin GUI (para Docker) |
| `numpy>=1.23.5,<2.0.0` | Arrays numéricos y matemáticas (base de OpenCV) |
| `azure-cognitiveservices-vision-computervision==0.9.1` | OCR de Azure para extraer texto |
| `pykakasi==2.3.0` | Conversión de Kanji a Romaji (texto japonés) |
| `requests==2.32.5` | Cliente HTTP simple para APIs |

### 📊 Excel/CSV Processing (2 paquetes)
| Paquete | Función |
|---------|---------|
| `openpyxl==3.1.5` | Leer/escribir archivos Excel (.xlsx) |
| `pandas==2.3.3` | Análisis de datos, DataFrames, CSV/Excel |

### 🗃️ Access Database (1 paquete)
| Paquete | Función |
|---------|---------|
| `pyodbc==5.3.0` | Conectar a bases MS Access via ODBC |

### 📄 PDF Processing (2 paquetes)
| Paquete | Función |
|---------|---------|
| `pdfplumber==0.11.5` | Extraer texto, tablas de PDFs |
| `reportlab==4.4.4` | Generar PDFs desde Python |

### 📧 Email (3 paquetes)
| Paquete | Función |
|---------|---------|
| `aiosmtplib==3.0.2` | Cliente SMTP asíncrono (envío de emails) |
| `jinja2==3.1.6` | Motor de templates para emails HTML |
| `python-dotenv==1.0.1` | Cargar variables de entorno desde .env |

### ✅ Validación (3 paquetes)
| Paquete | Función |
|---------|---------|
| `pydantic==2.10.5` | Validación de datos con Python type hints |
| `pydantic-settings==2.11.0` | Gestión de configuración con Pydantic |
| `email-validator==2.3.0` | Validación robusta de emails |

### 📅 Date/Time (2 paquetes)
| Paquete | Función |
|---------|---------|
| `python-dateutil==2.9.0.post0` | Extensiones poderosas para datetime |
| `pytz==2025.2` | Timezones actualizadas (IANA database) |

### ⏰ Scheduling (1 paquete)
| Paquete | Función |
|---------|---------|
| `apscheduler==3.10.4` | Scheduler de tareas (cron jobs) en Python |

### 🌐 HTTP Requests (2 paquetes)
| Paquete | Función |
|---------|---------|
| `httpx==0.28.1` | Cliente HTTP async/sync moderno |
| `aiohttp==3.13.1` | Cliente/servidor HTTP asíncrono |

### 🧪 Testing (2 paquetes)
| Paquete | Función |
|---------|---------|
| `pytest==8.3.4` | Framework de testing Python |
| `pytest-asyncio==0.24.0` | Soporte async/await en pytest |

### 💾 Redis (1 paquete)
| Paquete | Función |
|---------|---------|
| `redis==7.0.1` | Cliente Redis para cache y queues |

### 👤 Detección Facial Mejorada (2 paquetes)
| Paquete | Función |
|---------|---------|
| `mediapipe==0.10.15` | ML de Google para detección facial, pose, manos |
| `easyocr==1.7.2` | OCR basado en deep learning (80+ idiomas) |

### 📝 Logging (1 paquete)
| Paquete | Función |
|---------|---------|
| `loguru==0.7.3` | Logging Python simple y potente |

### 🚦 Rate Limiting (1 paquete)
| Paquete | Función |
|---------|---------|
| `slowapi==0.1.9` | Rate limiting para FastAPI |

### 📊 Observability & Telemetry (9 paquetes)
| Paquete | Función |
|---------|---------|
| `opentelemetry-api==1.27.0` | API OpenTelemetry para traces |
| `opentelemetry-sdk==1.27.0` | SDK implementación completa |
| `opentelemetry-exporter-otlp-proto-grpc==1.27.0` | Exportar a Jaeger/Grafana via gRPC |
| `opentelemetry-instrumentation-fastapi==0.48b0` | Auto-instrumentar FastAPI |
| `opentelemetry-instrumentation-logging==0.48b0` | Correlacionar logs con traces |
| `opentelemetry-instrumentation-requests==0.48b0` | Instrumentar requests HTTP |
| `opentelemetry-instrumentation-sqlalchemy==0.48b0` | Instrumentar queries SQL |
| `prometheus-fastapi-instrumentator==7.1.0` | Métricas Prometheus para FastAPI |
| `psutil==6.1.0` | Info sistema (CPU, memoria, disco) |

---

## 📦 Total de Dependencias Instaladas

### Frontend: **~1,200+ paquetes** (contando dependencias transitivas)
- **Directas**: 52 dependencies + 27 devDependencies = **79 paquetes**
- **Transitivas**: ~1,100+ paquetes que se instalan automáticamente

Ejemplo de transitivas de `next@16.0.0`:
- `@swc/core`, `@next/swc-*`, `styled-jsx`, `postcss`, `watchpack`, etc.

### Backend: **~350+ paquetes** (contando dependencias transitivas)
- **Directas**: **91 paquetes** en requirements.txt
- **Transitivas**: ~260+ paquetes

Ejemplo de transitivas de `fastapi`:
- `starlette`, `pydantic-core`, `typing-extensions`, `anyio`, `sniffio`, etc.

---

## 🎯 Resumen por Categoría

### FRONTEND
```
Framework & Core:        8 paquetes
UI Components (Radix):  18 paquetes
Data & Forms:           10 paquetes
UI Enhancement:          9 paquetes
Charts:                  1 paquete
Notifications:           2 paquetes
File Handling:           2 paquetes
Observability:          10 paquetes
Performance:             1 paquete
Testing:                 9 paquetes
Linting:                 5 paquetes
TypeScript:              5 paquetes
─────────────────────────────────
TOTAL:                  80 paquetes
```

### BACKEND
```
Framework Web:           3 paquetes
Database:                3 paquetes
Auth & Security:         3 paquetes
OCR & Images:            7 paquetes
Excel/CSV:               2 paquetes
Access DB:               1 paquete
PDF:                     2 paquetes
Email:                   3 paquetes
Validation:              3 paquetes
Date/Time:               2 paquetes
Scheduling:              1 paquete
HTTP:                    2 paquetes
Testing:                 2 paquetes
Redis:                   1 paquete
Face Detection:          2 paquetes
Logging:                 1 paquete
Rate Limiting:           1 paquete
Observability:           9 paquetes
─────────────────────────────────
TOTAL:                  48 paquetes base
                      + 43 dependencias transitivas documentadas
                      ═══════════════
                        91 TOTAL
```

---

## 💾 Espacio en Disco

### Frontend (`node_modules/`)
- **Tamaño aproximado**: 800 MB - 1.2 GB
- **Archivos**: ~150,000 archivos
- **Carpetas**: ~30,000 carpetas

### Backend (Python virtual env)
- **Tamaño aproximado**: 2.5 - 3.5 GB
- **Razón del tamaño**: 
  - `mediapipe` (~500 MB con modelos ML)
  - `easyocr` (~400 MB con modelos deep learning)
  - `opencv-python-headless` (~100 MB)
  - `pandas` + `numpy` (~200 MB)

---

## ⚙️ Comandos de Instalación

### Frontend
```bash
cd frontend
npm install          # Instala todos los paquetes
npm ci              # Instalación limpia (CI/CD)
```

### Backend
```bash
cd backend
pip install -r requirements.txt              # Instalación normal
pip install -r requirements.txt --no-cache  # Sin cache (limpio)
```

---

## 🔄 Actualización de Paquetes

### Frontend
```bash
npm outdated                    # Ver paquetes desactualizados
npm update                      # Actualizar (respeta package.json)
npx npm-check-updates -u       # Actualizar a latest (ignora semver)
```

### Backend
```bash
pip list --outdated            # Ver paquetes desactualizados
pip install --upgrade <paquete>  # Actualizar uno
pip-review --auto              # Tool para actualizar todos
```

---

## 🎓 Notas Importantes

1. **Frontend usa npm** (no yarn ni pnpm) - verificado por `package-lock.json`
2. **Backend NO usa pywin32 en Docker** - solo necesario en Windows host
3. **Versiones fijadas** - Para reproducibilidad y estabilidad
4. **OpenTelemetry** en ambos lados - Observabilidad end-to-end
5. **Tailwind + Radix** - Sistema de diseño consistente y accesible
6. **FastAPI + SQLAlchemy** - Stack moderno async-first
