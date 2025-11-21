# 📦 PAQUETES INSTALADOS COMPLETOS - UNS-ClaudeJP 5.4.1

## 🐍 BACKEND - 91 PAQUETES PYTHON

### 1️⃣ **FRAMEWORK WEB (3 paquetes)**

#### `fastapi==0.115.6`
- **¿Qué es?** Framework web moderno y rápido para crear APIs
- **¿Para qué?** Crear todos los endpoints REST del backend (/api/employees, /api/candidates, etc.)
- **Características:** Auto-documentación (Swagger), validación automática, async/await

#### `uvicorn[standard]==0.34.0`
- **¿Qué es?** Servidor ASGI de alto rendimiento
- **¿Para qué?** Ejecutar la aplicación FastAPI (escucha en puerto 8000)
- **Incluye:** uvloop, httptools, websockets

#### `python-multipart==0.0.20`
- **¿Qué es?** Parser de formularios multipart
- **¿Para qué?** Subir archivos (fotos, PDFs, Excel) vía API
- **Uso:** Upload de rirekisho, zairyu cards, documentos

---

### 2️⃣ **BASE DE DATOS (3 paquetes)**

#### `sqlalchemy==2.0.36`
- **¿Qué es?** ORM (Object-Relational Mapper) más popular de Python
- **¿Para qué?** Mapear objetos Python a tablas PostgreSQL (Employee, Candidate, etc.)
- **Características:** Queries type-safe, migraciones, relaciones

#### `psycopg2-binary==2.9.10`
- **¿Qué es?** Driver PostgreSQL para Python
- **¿Para qué?** Conectar con la base de datos PostgreSQL
- **Nota:** Versión "binary" incluye librerías compiladas

#### `alembic==1.17.0`
- **¿Qué es?** Herramienta de migraciones de base de datos
- **¿Para qué?** Crear/actualizar tablas sin perder datos (version control de DB)
- **Uso:** `alembic upgrade head` crea las 24 tablas

---

### 3️⃣ **SEGURIDAD & AUTENTICACIÓN (3 paquetes)**

#### `python-jose[cryptography]==3.3.0`
- **¿Qué es?** Librería para crear/verificar tokens JWT
- **¿Para qué?** Generar tokens de autenticación para login
- **Uso:** Token que recibe frontend al hacer POST /api/auth/login

#### `passlib[bcrypt]==1.7.4`
- **¿Qué es?** Librería de hashing de contraseñas
- **¿Para qué?** Hash seguro de passwords (bcrypt algorithm)
- **Uso:** Guardar contraseña de "admin" hasheada

#### `bcrypt==4.2.1`
- **¿Qué es?** Algoritmo de hash criptográfico
- **¿Para qué?** Backend de passlib, hashing seguro
- **Seguridad:** Resistente a ataques de fuerza bruta

---

### 4️⃣ **OCR & PROCESAMIENTO DE IMÁGENES (7 paquetes)**

#### `Pillow==11.1.0`
- **¿Qué es?** Librería de manipulación de imágenes
- **¿Para qué?** Abrir, redimensionar, convertir imágenes (JPEG, PNG, BMP)
- **Uso:** Procesar fotos de candidatos/empleados

#### `pdf2image==1.17.0`
- **¿Qué es?** Convierte PDF a imágenes
- **¿Para qué?** Convertir rirekisho PDF a imágenes para OCR
- **Requisito:** poppler-utils (instalado en Dockerfile)

#### `opencv-python-headless==4.10.0.84`
- **¿Qué es?** Librería de visión computacional
- **¿Para qué?** Detección de rostros, preprocesamiento de imágenes
- **Uso:** Mejorar calidad de imágenes antes de OCR
- **Headless:** Sin GUI (para servidores)

#### `numpy>=1.23.5,<2.0.0`
- **¿Qué es?** Librería de arrays numéricos
- **¿Para qué?** Backend de OpenCV y Pandas (matrices de imágenes)
- **Restricción:** <2.0.0 por compatibilidad con mediapipe

#### `azure-cognitiveservices-vision-computervision==0.9.1`
- **¿Qué es?** SDK de Azure Computer Vision API
- **¿Para qué?** OCR de rirekisho con IA de Microsoft Azure
- **Precisión:** ~95% en japonés/inglés mixto

#### `requests==2.32.5`
- **¿Qué es?** Cliente HTTP simple
- **¿Para qué?** Llamar APIs externas (Azure OCR, Google Vision)
- **Uso:** Enviar imágenes a servicios de OCR

#### `pykakasi==2.3.0`
- **¿Qué es?** Convertidor japonés (Kanji/Kana → Romaji)
- **¿Para qué?** Romanizar nombres japoneses
- **Ejemplo:** 田中太郎 → Tanaka Taro

---

### 5️⃣ **EXCEL/CSV (2 paquetes)**

#### `openpyxl==3.1.5`
- **¿Qué es?** Lector/escritor de archivos Excel (.xlsx)
- **¿Para qué?** Importar datos de empleados desde Excel
- **Uso:** `import_data.py` lee yukyu_data.xlsm

#### `pandas==2.3.3`
- **¿Qué es?** Librería de análisis de datos (DataFrames)
- **¿Para qué?** Procesar Excel, CSV, hacer cálculos de payroll
- **Uso:** Análisis de yukyu, reportes de nómina

---

### 6️⃣ **ACCESS DATABASE (1 paquete)**

#### `pyodbc==5.3.0`
- **¿Qué es?** Conector ODBC para bases de datos
- **¿Para qué?** Leer base de datos Access (.accdb) de DATABASEJP
- **Uso:** Extraer fotos OLE de Access antiguo
- **Nota:** Solo funciona en Windows host (no en Docker)

---

### 7️⃣ **PROCESAMIENTO DE PDF (2 paquetes)**

#### `pdfplumber==0.11.5`
- **¿Qué es?** Extrae texto y tablas de PDFs
- **¿Para qué?** Leer rirekisho en formato PDF
- **Uso:** Extraer texto antes de enviar a OCR

#### `reportlab==4.4.4`
- **¿Qué es?** Generador de PDFs
- **¿Para qué?** Crear PDFs de payslips, reportes
- **Uso:** Generar nóminas en PDF para empleados

---

### 8️⃣ **EMAIL (3 paquetes)**

#### `python-dotenv==1.0.1`
- **¿Qué es?** Carga variables de entorno desde .env
- **¿Para qué?** Leer configuración (POSTGRES_PASSWORD, SECRET_KEY, etc.)
- **Uso:** `load_dotenv()` al inicio de la app

#### `aiosmtplib==3.0.2`
- **¿Qué es?** Cliente SMTP asíncrono
- **¿Para qué?** Enviar emails (notificaciones, password reset)
- **Uso:** Enviar credenciales a nuevos empleados

#### `jinja2==3.1.6`
- **¿Qué es?** Motor de templates
- **¿Para qué?** Crear HTML para emails y reportes
- **Uso:** Templates de payslips, notificaciones

---

### 9️⃣ **VALIDACIÓN (3 paquetes)**

#### `pydantic==2.10.5`
- **¿Qué es?** Validación de datos con type hints
- **¿Para qué?** Validar requests/responses de API
- **Uso:** EmployeeCreate, CandidateUpdate schemas

#### `pydantic-settings==2.11.0`
- **¿Qué es?** Manejo de configuración con Pydantic
- **¿Para qué?** Cargar settings desde .env de forma type-safe
- **Uso:** `Settings` class en app/core/config.py

#### `email-validator==2.3.0`
- **¿Qué es?** Validador de emails
- **¿Para qué?** Verificar formato de emails
- **Uso:** Validar email de candidatos/empleados

---

### 🔟 **FECHA/HORA (2 paquetes)**

#### `python-dateutil==2.9.0.post0`
- **¿Qué es?** Parser de fechas avanzado
- **¿Para qué?** Parsear fechas en múltiples formatos
- **Uso:** Convertir fechas de Excel/Access a PostgreSQL

#### `pytz==2025.2`
- **¿Qué es?** Base de datos de zonas horarias
- **¿Para qué?** Manejar timezone de Japón (Asia/Tokyo)
- **Uso:** Cálculos de yukyu, timer cards

---

### 1️⃣1️⃣ **SCHEDULING (1 paquete)**

#### `apscheduler==3.10.4`
- **¿Qué es?** Programador de tareas (cron jobs)
- **¿Para qué?** Ejecutar tareas periódicas
- **Uso:** Sincronización diaria de fotos, limpieza de caché

---

### 1️⃣2️⃣ **HTTP CLIENTS (2 paquetes)**

#### `httpx==0.28.1`
- **¿Qué es?** Cliente HTTP async moderno
- **¿Para qué?** Llamar APIs externas (async/await)
- **Ventaja:** Soporte HTTP/2, mejor que requests

#### `aiohttp==3.13.1`
- **¿Qué es?** Cliente/servidor HTTP async
- **¿Para qué?** Requests async paralelos
- **Uso:** Llamar múltiples APIs de OCR simultáneamente

---

### 1️⃣3️⃣ **TESTING (2 paquetes)**

#### `pytest==8.3.4`
- **¿Qué es?** Framework de testing
- **¿Para qué?** Ejecutar tests unitarios e integración
- **Uso:** `pytest backend/tests -v`

#### `pytest-asyncio==0.24.0`
- **¿Qué es?** Plugin pytest para async
- **¿Para qué?** Testear funciones async/await
- **Uso:** Tests de endpoints FastAPI

---

### 1️⃣4️⃣ **CACHÉ (1 paquete)**

#### `redis==7.0.1`
- **¿Qué es?** Cliente Redis para Python
- **¿Para qué?** Caché de sesiones, rate limiting
- **Uso:** Cachear queries frecuentes

---

### 1️⃣5️⃣ **IA AVANZADA (2 paquetes)**

#### `mediapipe==0.10.15`
- **¿Qué es?** Framework ML de Google (detección facial)
- **¿Para qué?** Detectar rostros en fotos de candidatos
- **Uso:** Validar que foto tenga cara visible
- **Tamaño:** ~150 MB

#### `easyocr==1.7.2`
- **¿Qué es?** OCR con deep learning (soporta 80+ idiomas)
- **¿Para qué?** Fallback OCR si Azure falla
- **Idiomas:** Japonés, inglés, chino
- **Precisión:** ~85-90%

---

### 1️⃣6️⃣ **LOGGING (1 paquete)**

#### `loguru==0.7.3`
- **¿Qué es?** Librería de logging mejorada
- **¿Para qué?** Logs estructurados con colores
- **Ventaja:** Más simple que logging estándar
- **Uso:** `logger.info("Employee created: {id}", id=emp.id)`

---

### 1️⃣7️⃣ **RATE LIMITING (1 paquete)**

#### `slowapi==0.1.9`
- **¿Qué es?** Rate limiting para FastAPI
- **¿Para qué?** Limitar requests por IP (anti-spam)
- **Ejemplo:** Máximo 100 requests/minuto

---

### 1️⃣8️⃣ **OBSERVABILIDAD (9 paquetes)**

#### `opentelemetry-api==1.27.0`
- **¿Qué es?** API estándar de telemetría
- **¿Para qué?** Traces, métricas, logs distribuidos

#### `opentelemetry-sdk==1.27.0`
- **¿Qué es?** SDK de implementación
- **¿Para qué?** Implementar telemetría

#### `opentelemetry-exporter-otlp-proto-grpc==1.27.0`
- **¿Qué es?** Exportador OTLP/gRPC
- **¿Para qué?** Enviar telemetría a OTEL Collector

#### `opentelemetry-instrumentation-fastapi==0.48b0`
- **¿Qué es?** Auto-instrumentación de FastAPI
- **¿Para qué?** Rastrear automáticamente requests HTTP

#### `opentelemetry-instrumentation-logging==0.48b0`
- **¿Qué es?** Instrumentación de logs
- **¿Para qué?** Correlacionar logs con traces

#### `opentelemetry-instrumentation-requests==0.48b0`
- **¿Qué es?** Instrumentación de requests HTTP
- **¿Para qué?** Rastrear llamadas a APIs externas

#### `opentelemetry-instrumentation-sqlalchemy==0.48b0`
- **¿Qué es?** Instrumentación de SQLAlchemy
- **¿Para qué?** Rastrear queries a base de datos

#### `prometheus-fastapi-instrumentator==7.1.0`
- **¿Qué es?** Métricas Prometheus para FastAPI
- **¿Para qué?** Exponer métricas en /metrics
- **Métricas:** Request count, latency, errores

#### `psutil==6.1.0`
- **¿Qué es?** Información del sistema
- **¿Para qué?** CPU, memoria, disco (health checks)
- **Uso:** Endpoint /api/health

---

## ⚛️ FRONTEND - 105 PAQUETES NPM

### 1️⃣ **FRAMEWORK CORE (3 paquetes)**

#### `next@16.0.0`
- **¿Qué es?** Framework React full-stack
- **¿Para qué?** SSR, routing, API routes, optimización
- **Características:** App Router, Server Components, RSC

#### `react@19.0.0`
- **¿Qué es?** Librería de UI declarativa
- **¿Para qué?** Crear componentes (EmployeeCard, CandidateForm, etc.)

#### `react-dom@19.0.0`
- **¿Qué es?** Renderizador DOM de React
- **¿Para qué?** Renderizar componentes en navegador

---

### 2️⃣ **UI PRIMITIVOS - RADIX UI (20 paquetes)**

#### `@radix-ui/react-dialog@1.1.15`
- **¿Qué es?** Modales accesibles
- **¿Para qué?** Diálogos de confirmación, forms modales

#### `@radix-ui/react-dropdown-menu@2.1.16`
- **¿Qué es?** Menús desplegables
- **¿Para qué?** Menú de usuario, acciones de tabla

#### `@radix-ui/react-select@2.2.6`
- **¿Qué es?** Select accesible
- **¿Para qué?** Seleccionar factory, apartment type

#### `@radix-ui/react-checkbox@1.3.3`
- **¿Qué es?** Checkbox accesible
- **¿Para qué?** Seleccionar empleados en tabla

#### `@radix-ui/react-switch@1.1.5`
- **¿Qué es?** Toggle switch
- **¿Para qué?** Activar/desactivar empleados

#### `@radix-ui/react-tabs@1.1.13`
- **¿Qué es?** Pestañas accesibles
- **¿Para qué?** Navegación en forms (Info Personal / Documentos)

#### `@radix-ui/react-tooltip@1.2.8`
- **¿Qué es?** Tooltips accesibles
- **¿Para qué?** Ayuda contextual en botones

#### `@radix-ui/react-accordion@1.2.12`
- **¿Qué es?** Acordeones
- **¿Para qué?** FAQ, secciones colapsables

#### `@radix-ui/react-avatar@1.1.10`
- **¿Qué es?** Avatares
- **¿Para qué?** Fotos de empleados/candidatos

#### `@radix-ui/react-label@2.1.7`
- **¿Qué es?** Labels accesibles
- **¿Para qué?** Labels de forms vinculados a inputs

#### `@radix-ui/react-scroll-area@1.2.10`
- **¿Qué es?** Área de scroll personalizada
- **¿Para qué?** Scroll en tablas, listas

#### `@radix-ui/react-separator@1.1.7`
- **¿Qué es?** Separadores visuales
- **¿Para qué?** Líneas divisorias en UI

#### `@radix-ui/react-slider@1.3.6`
- **¿Qué es?** Slider accesible
- **¿Para qué?** Filtros de rango (salario, edad)

#### `@radix-ui/react-progress@1.1.0`
- **¿Qué es?** Barra de progreso
- **¿Para qué?** Upload de archivos, loading

#### `@radix-ui/react-slot@1.2.3`
- **¿Qué es?** Composición de componentes
- **¿Para qué?** Patrón asChild en componentes

#### `@radix-ui/react-toggle-group@1.1.11`
- **¿Qué es?** Grupo de toggles
- **¿Para qué?** Filtros de vista (Grid/List)

#### *(+4 Radix más)*

---

### 3️⃣ **ESTILOS (6 paquetes)**

#### `tailwindcss@3.4.13`
- **¿Qué es?** Framework CSS utility-first
- **¿Para qué?** Estilos con clases (bg-blue-500, text-lg)

#### `autoprefixer@10.4.21`
- **¿Qué es?** Añade prefijos CSS automáticamente
- **¿Para qué?** Compatibilidad cross-browser (-webkit-, -moz-)

#### `postcss@8.4.47`
- **¿Qué es?** Procesador CSS
- **¿Para qué?** Transformar CSS con plugins

#### `tailwindcss-animate@1.0.7`
- **¿Qué es?** Animaciones para Tailwind
- **¿Para qué?** Animaciones predefinidas (fade, slide)

#### `@tailwindcss/forms@0.5.10`
- **¿Qué es?** Estilos base para forms
- **¿Para qué?** Forms bonitos sin CSS manual

#### `prettier-plugin-tailwindcss@0.5.11`
- **¿Qué es?** Plugin Prettier para Tailwind
- **¿Para qué?** Ordenar clases automáticamente

---

### 4️⃣ **STATE MANAGEMENT (5 paquetes)**

#### `zustand@5.0.8`
- **¿Qué es?** State management minimalista
- **¿Para qué?** Estado global (usuario logueado, theme)
- **Ventaja:** Más simple que Redux

#### `@tanstack/react-query@5.59.0`
- **¿Qué es?** Server state management
- **¿Para qué?** Caché de API calls, refetch automático
- **Uso:** `useQuery('employees', fetchEmployees)`

#### `@tanstack/react-query-devtools@5.59.0`
- **¿Qué es?** DevTools para React Query
- **¿Para qué?** Debuggear queries en desarrollo

#### `@tanstack/react-table@8.21.3`
- **¿Qué es?** Librería de tablas headless
- **¿Para qué?** Tablas con sort, filter, pagination
- **Uso:** Tabla de empleados/candidatos

---

### 5️⃣ **FORMS (3 paquetes)**

#### `react-hook-form@7.65.0`
- **¿Qué es?** Manejo de forms performante
- **¿Para qué?** Forms con validación
- **Ventaja:** Menos re-renders

#### `@hookform/resolvers@3.10.0`
- **¿Qué es?** Resolvers de validación
- **¿Para qué?** Integrar Zod con react-hook-form

#### `zod@3.25.76`
- **¿Qué es?** Schema validation TypeScript-first
- **¿Para qué?** Validar forms, API responses
- **Ejemplo:** `z.object({ email: z.string().email() })`

---

### 6️⃣ **HTTP CLIENT (1 paquete)**

#### `axios@1.7.7`
- **¿Qué es?** Cliente HTTP
- **¿Para qué?** Llamar backend API
- **Uso:** `axios.post('/api/employees', data)`

---

### 7️⃣ **GRÁFICAS (1 paquete)**

#### `recharts@2.15.4`
- **¿Qué es?** Librería de gráficas React
- **¿Para qué?** Dashboards (payroll charts, yukyu stats)
- **Tipos:** LineChart, BarChart, PieChart

---

### 8️⃣ **ICONOS (2 paquetes)**

#### `@heroicons/react@2.2.0`
- **¿Qué es?** Iconos de Heroicons
- **¿Para qué?** Iconos SVG (UserIcon, HomeIcon)

#### `lucide-react@0.451.0`
- **¿Qué es?** Iconos de Lucide
- **¿Para qué?** Más opciones de iconos
- **Total:** ~1400 iconos

---

### 9️⃣ **UTILIDADES (12 paquetes)**

#### `clsx@2.1.1`
- **¿Qué es?** Combinar clases CSS condicionalmente
- **¿Para qué?** `clsx('btn', isActive && 'active')`

#### `class-variance-authority@0.7.1`
- **¿Qué es?** Variantes de componentes
- **¿Para qué?** Botones con variantes (primary, secondary)

#### `tailwind-merge@2.6.0`
- **¿Qué es?** Merge inteligente de clases Tailwind
- **¿Para qué?** Evitar conflictos de clases

#### `date-fns@4.1.0`
- **¿Qué es?** Utilidades de fecha/hora
- **¿Para qué?** Formatear fechas (`format(date, 'yyyy/MM/dd')`)

#### `qrcode@1.5.4`
- **¿Qué es?** Generador de QR codes
- **¿Para qué?** QR de empleados (ID, documentos)

#### `react-dropzone@14.3.8`
- **¿Qué es?** Drag & drop de archivos
- **¿Para qué?** Upload de fotos, documentos

#### `react-colorful@5.6.1`
- **¿Qué es?** Color picker
- **¿Para qué?** Seleccionar colores (branding)

#### `react-hot-toast@2.6.0`
- **¿Qué es?** Notificaciones toast
- **¿Para qué?** Feedback de acciones (success, error)

#### `sonner@2.0.7`
- **¿Qué es?** Sistema de toasts alternativo
- **¿Para qué?** Notificaciones más avanzadas

#### `framer-motion@11.15.0`
- **¿Qué es?** Librería de animaciones
- **¿Para qué?** Transiciones, animaciones de UI

#### `next-themes@0.3.0`
- **¿Qué es?** Manejo de temas (dark/light)
- **¿Para qué?** Dark mode toggle

#### `critters@0.0.25`
- **¿Qué es?** Inline CSS crítico
- **¿Para qué?** Optimización de First Paint

---

### 🔟 **OBSERVABILIDAD (9 paquetes)**

#### `@opentelemetry/api@1.9.0`
- **¿Qué es?** API de telemetría
- **¿Para qué?** Traces en frontend

#### `@opentelemetry/sdk-trace-web@2.2.0`
- **¿Qué es?** SDK de traces para web
- **¿Para qué?** Rastrear user interactions

#### `@opentelemetry/instrumentation-fetch@0.207.0`
- **¿Qué es?** Auto-instrumentación de fetch
- **¿Para qué?** Rastrear API calls automáticamente

#### `@vercel/otel@1.8.0`
- **¿Qué es?** OTEL para Vercel
- **¿Para qué?** Integración con Vercel Analytics

#### *(+5 paquetes OTEL más)*

---

### 1️⃣1️⃣ **TESTING (14 paquetes)**

#### `@playwright/test@1.49.0`
- **¿Qué es?** Framework E2E testing
- **¿Para qué?** Tests end-to-end (login, CRUD)
- **Incluye:** Chromium, Firefox, WebKit (~300 MB)

#### `vitest@2.1.5`
- **¿Qué es?** Unit testing framework (Vite-native)
- **¿Para qué?** Tests unitarios de componentes

#### `@testing-library/react@16.1.0`
- **¿Qué es?** Testing utilities para React
- **¿Para qué?** Renderizar componentes en tests

#### `@testing-library/user-event@14.5.2`
- **¿Qué es?** Simular interacciones de usuario
- **¿Para qué?** Clicks, typing en tests

#### `@testing-library/jest-dom@6.6.3`
- **¿Qué es?** Matchers custom para DOM
- **¿Para qué?** Assertions (`toBeInTheDocument()`)

#### `@vitest/coverage-v8@2.1.5`
- **¿Qué es?** Cobertura de código
- **¿Para qué?** Ver % de código testeado

#### `jsdom@25.0.1`
- **¿Qué es?** DOM virtual para Node.js
- **¿Para qué?** Simular navegador en tests

#### *(+7 paquetes testing más)*

---

### 1️⃣2️⃣ **LINTING/FORMATTING (8 paquetes)**

#### `eslint@9.0.0`
- **¿Qué es?** Linter de JavaScript/TypeScript
- **¿Para qué?** Detectar errores, enforcar estilo

#### `eslint-config-next@16.0.0`
- **¿Qué es?** Config ESLint de Next.js
- **¿Para qué?** Reglas recomendadas para Next.js

#### `eslint-config-prettier@9.1.0`
- **¿Qué es?** Desactiva reglas conflictivas con Prettier
- **¿Para qué?** Compatibilidad ESLint + Prettier

#### `eslint-plugin-prettier@5.2.1`
- **¿Qué es?** Plugin ESLint para Prettier
- **¿Para qué?** Ejecutar Prettier como regla ESLint

#### `prettier@3.2.5`
- **¿Qué es?** Code formatter
- **¿Para qué?** Formatear código automáticamente

#### `typescript@5.6.0`
- **¿Qué es?** Lenguaje TypeScript
- **¿Para qué?** Type safety, autocompletado

#### *(+2 tipos TypeScript)*

---

### 1️⃣3️⃣ **BUILD TOOLS (3 paquetes)**

#### `@vitejs/plugin-react@5.1.0`
- **¿Qué es?** Plugin Vite para React
- **¿Para qué?** Fast Refresh en desarrollo

#### `@types/node@24.9.1`
- **¿Qué es?** Tipos TypeScript de Node.js
- **¿Para qué?** Autocompletado de Node APIs

#### `@types/react@19.0.0` + `@types/react-dom@19.0.0`
- **¿Qué es?** Tipos TypeScript de React
- **¿Para qué?** Type safety en componentes

---

## 📊 RESUMEN FINAL

| Categoría | Backend | Frontend | Total |
|-----------|---------|----------|-------|
| **Paquetes** | 91 | 105 | **196** |
| **Tamaño** | ~1.0 GB | ~650 MB | **~1.65 GB** |
| **Dependencias totales** | ~400 | ~1200 | **~1600** |

---

## 🎯 PAQUETES MÁS IMPORTANTES

### Backend (Top 5)
1. **FastAPI** - Framework web completo
2. **SQLAlchemy** - ORM para base de datos
3. **Mediapipe** - Detección facial IA
4. **Azure OCR** - OCR de rirekisho
5. **Pandas** - Análisis de datos

### Frontend (Top 5)
1. **Next.js** - Framework React full-stack
2. **Tailwind CSS** - Framework de estilos
3. **React Query** - Server state management
4. **Radix UI** - Componentes accesibles
5. **Playwright** - Testing E2E

---

**Última actualización:** 2025-11-12
**Versión:** UNS-ClaudeJP 5.4.1
