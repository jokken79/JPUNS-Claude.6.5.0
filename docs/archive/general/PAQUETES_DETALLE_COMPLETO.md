# 📦 PAQUETES INSTALADOS - UNS-ClaudeJP 5.4.1

## 🎨 FRONTEND (105 paquetes NPM)

### ⚛️ Core Framework (3)
- **next** (16.0.0) - Framework React con SSR, routing, optimización
- **react** (19.0.0) - Librería UI declarativa
- **react-dom** (19.0.0) - DOM renderer para React

### 🎨 UI Components & Styling (28)
- **@radix-ui/*** (18 paquetes) - Primitivas UI accesibles headless:
  - `react-accordion`, `react-avatar`, `react-checkbox`, `react-dialog`
  - `react-dropdown-menu`, `react-label`, `react-scroll-area`, `react-select`
  - `react-separator`, `react-slider`, `react-progress`, `react-slot`
  - `react-switch`, `react-tabs`, `react-toggle-group`, `react-tooltip`
- **tailwindcss** (3.4.13) - Utility-first CSS framework
- **tailwindcss-animate** (1.0.7) - Animaciones Tailwind
- **@tailwindcss/forms** (0.5.10) - Estilos para formularios
- **framer-motion** (11.15.0) - Librería animaciones React
- **lucide-react** (0.451.0) - Iconos modernos (24,000+)
- **@heroicons/react** (2.2.0) - Iconos SVG Tailwind
- **class-variance-authority** (0.7.1) - Variantes de componentes
- **clsx** (2.1.1) + **tailwind-merge** (2.6.0) - Utilidades className
- **next-themes** (0.3.0) - Dark/light mode switching
- **react-colorful** (5.6.1) - Color picker

### 📊 Data & State Management (7)
- **@tanstack/react-query** (5.59.0) - Server state management
- **@tanstack/react-query-devtools** (5.59.0) - DevTools para RQ
- **@tanstack/react-table** (8.21.3) - Tablas headless potentes
- **zustand** (5.0.8) - State management ligero
- **axios** (1.7.7) - HTTP client
- **recharts** (2.15.4) - Librería de gráficos React
- **date-fns** (4.1.0) - Utilidades de fechas

### 📝 Forms & Validation (4)
- **react-hook-form** (7.65.0) - Formularios performantes
- **@hookform/resolvers** (3.10.0) - Resolvers validación
- **zod** (3.25.76) - Schema validation TypeScript-first
- **react-dropzone** (14.3.8) - Drag & drop archivos

### 🔔 Notifications & Feedback (3)
- **sonner** (2.0.7) - Toast notifications modernas
- **react-hot-toast** (2.6.0) - Toast alternativo
- **qrcode** (1.5.4) + **@types/qrcode** - Generación QR codes

### 📡 Observability & Monitoring (9)
- **@opentelemetry/*** (8 paquetes) - Telemetría OpenTelemetry:
  - `api`, `api-logs`, `context-zone`, `resources`
  - `sdk-trace-base`, `sdk-trace-web`
  - `exporter-trace-otlp-http`, `instrumentation-fetch`
- **@vercel/otel** (1.8.0) - OpenTelemetry Vercel

### 🛠️ Build & Development (22)
- **typescript** (5.6.0) - Superset JavaScript tipado
- **eslint** (9.0.0) + **eslint-config-next** (16.0.0) - Linting
- **eslint-config-prettier** (9.1.0) + **eslint-plugin-prettier** (5.2.1)
- **prettier** (3.2.5) + **prettier-plugin-tailwindcss** (0.5.11) - Code formatting
- **postcss** (8.4.47) + **autoprefixer** (10.4.21) - CSS processing
- **critters** (0.0.25) - Critical CSS inline

### 🧪 Testing (12)
- **@playwright/test** (1.49.0) - E2E testing framework
- **vitest** (2.1.5) + **@vitest/coverage-v8** (2.1.5) - Unit testing
- **@vitejs/plugin-react** (5.1.0) - Vite plugin React
- **@testing-library/react** (16.1.0) - React testing utilities
- **@testing-library/dom** (10.4.0)
- **@testing-library/jest-dom** (6.6.3)
- **@testing-library/user-event** (14.5.2)
- **jsdom** (25.0.1) - DOM implementation

### 📦 Types & Misc (7)
- **@types/node** (24.9.1)
- **@types/react** (19.0.0)
- **@types/react-dom** (19.0.0)
- **@types/testing-library__jest-dom** (6.0.0)
- **next-env.d.ts** - Next.js types auto-generated

---

## 🐍 BACKEND (91 paquetes Python)

### ⚡ Framework & Server (3)
- **fastapi** (0.115.6) - Framework web moderno async
- **uvicorn[standard]** (0.34.0) - ASGI server (con websockets, watchfiles)
- **python-multipart** (0.0.20) - Parsing multipart/form-data

### 🗄️ Database & ORM (4)
- **sqlalchemy** (2.0.36) - ORM potente Python
- **psycopg2-binary** (2.9.10) - Driver PostgreSQL
- **alembic** (1.17.0) - Migraciones DB
- **pyodbc** (5.3.0) - Conector ODBC (Access DB)

### 🔐 Authentication & Security (4)
- **python-jose[cryptography]** (3.3.0) - JWT tokens
- **passlib[bcrypt]** (1.7.4) - Password hashing
- **bcrypt** (4.2.1) - Hashing algorithm

### 🖼️ OCR & Image Processing (9)
- **Pillow** (11.1.0) - Librería imágenes Python
- **pdf2image** (1.17.0) - Convertir PDF a imágenes
- **opencv-python-headless** (4.10.0.84) - Computer vision (sin GUI)
- **numpy** (<2.0.0) - Operaciones numéricas
- **azure-cognitiveservices-vision-computervision** (0.9.1) - Azure OCR
- **pykakasi** (2.3.0) - Conversión Romaji/Kanji
- **mediapipe** (0.10.15) - Face/pose detection Google
- **easyocr** (1.7.2) - OCR multi-idioma

### 📊 Excel/CSV Processing (2)
- **openpyxl** (3.1.5) - Leer/escribir Excel (.xlsx)
- **pandas** (2.3.3) - Análisis datos, DataFrames

### 📄 PDF Processing (2)
- **pdfplumber** (0.11.5) - Extraer texto/tablas PDF
- **reportlab** (4.4.4) - Generar PDFs

### ✉️ Email (3)
- **aiosmtplib** (3.0.2) - Cliente SMTP async
- **jinja2** (3.1.6) - Templates HTML emails
- **python-dotenv** (1.0.1) - Variables entorno .env

### ✅ Validation (3)
- **pydantic** (2.10.5) - Data validation con types
- **pydantic-settings** (2.11.0) - Settings management
- **email-validator** (2.3.0) - Validar emails

### 📅 Date/Time (2)
- **python-dateutil** (2.9.0.post0) - Parsing fechas
- **pytz** (2025.2) - Timezones

### ⏰ Scheduling (1)
- **apscheduler** (3.10.4) - Cron jobs Python

### 🌐 HTTP Requests (3)
- **httpx** (0.28.1) - HTTP client async
- **aiohttp** (3.13.1) - HTTP client/server async
- **requests** (2.32.5) - HTTP client sync simple

### 🧪 Testing (2)
- **pytest** (8.3.4) - Framework testing
- **pytest-asyncio** (0.24.0) - Testing async code

### 💾 Redis (1)
- **redis** (7.0.1) - Cliente Redis (cache, queues)

### 📝 Logging (1)
- **loguru** (0.7.3) - Logging mejorado con colores

### 🚦 Rate Limiting (1)
- **slowapi** (0.1.9) - Rate limiting para FastAPI

### 📊 Observability & Telemetry (10)
- **opentelemetry-api** (1.27.0) - API OpenTelemetry
- **opentelemetry-sdk** (1.27.0) - SDK core
- **opentelemetry-exporter-otlp-proto-grpc** (1.27.0) - Exporter OTLP
- **opentelemetry-instrumentation-fastapi** (0.48b0) - Instrumentación FastAPI
- **opentelemetry-instrumentation-logging** (0.48b0) - Logs
- **opentelemetry-instrumentation-requests** (0.48b0) - HTTP requests
- **opentelemetry-instrumentation-sqlalchemy** (0.48b0) - DB queries
- **prometheus-fastapi-instrumentator** (7.1.0) - Métricas Prometheus
- **psutil** (6.1.0) - Info sistema (CPU, RAM)

---

## 📋 RESUMEN POR CATEGORÍA

### Frontend (105 total)
- **Framework/Core**: 3 (Next.js, React)
- **UI/Styling**: 28 (Radix UI, Tailwind, iconos)
- **State/Data**: 7 (React Query, Zustand, Axios)
- **Forms**: 4 (React Hook Form, Zod)
- **Notifications**: 3 (Sonner, Toast)
- **Observability**: 9 (OpenTelemetry)
- **Build/Dev**: 22 (TypeScript, ESLint, Prettier)
- **Testing**: 12 (Playwright, Vitest)
- **Types**: 7

### Backend (91 total)
- **Framework**: 3 (FastAPI, Uvicorn)
- **Database**: 4 (SQLAlchemy, PostgreSQL, Alembic)
- **Security**: 4 (JWT, bcrypt)
- **OCR/Images**: 9 (Azure OCR, EasyOCR, OpenCV)
- **Excel/CSV**: 2 (Pandas, openpyxl)
- **PDF**: 2 (pdfplumber, reportlab)
- **Email**: 3 (aiosmtplib, Jinja2)
- **Validation**: 3 (Pydantic)
- **DateTime**: 2 (dateutil, pytz)
- **Scheduling**: 1 (APScheduler)
- **HTTP**: 3 (httpx, aiohttp, requests)
- **Testing**: 2 (pytest)
- **Cache**: 1 (Redis)
- **Logging**: 1 (loguru)
- **Rate Limit**: 1 (SlowAPI)
- **Observability**: 10 (OpenTelemetry, Prometheus)

## 🎯 PARA QUÉ SIRVEN

### Frontend
**Next.js Stack** permite:
- Server-side rendering (SEO, performance)
- Routing automático basado en archivos
- API routes integradas
- Optimización imágenes/fonts automática
- React 19 con Server Components

**Radix UI + Tailwind** da:
- Componentes accesibles (WCAG AA/AAA)
- Headless (control total CSS)
- Dark mode nativo
- Animaciones fluidas
- Design system escalable

**React Query** maneja:
- Cache server state automático
- Refetch en background
- Optimistic updates
- Infinite scroll
- Invalidación inteligente

**Testing** cubre:
- E2E: Playwright (UI real browser)
- Unit: Vitest (ultra rápido)
- Integration: Testing Library

### Backend
**FastAPI** provee:
- Auto-documentación OpenAPI
- Validación automática (Pydantic)
- Async nativo (alta concurrencia)
- Type hints Python

**OCR Stack** procesa:
- Fotos Rirekisho (Azure OCR)
- PDFs (pdfplumber)
- Face detection (mediapipe)
- Conversión Kanji (pykakasi)

**Database** gestiona:
- ORM tipo-safe (SQLAlchemy 2.0)
- Migraciones versionadas (Alembic)
- PostgreSQL optimizado
- Access legacy (pyodbc)

**Observability** monitorea:
- Traces distribuidas (OpenTelemetry)
- Métricas (Prometheus)
- Logs estructurados (loguru)
- Performance (psutil)

## 💰 VALOR ESTIMADO

Si compraras estos paquetes como licencias comerciales:
- **Frontend**: Radix UI Pro (~$200), Tailwind UI (~$300), Vercel Pro (~$20/mes)
- **Backend**: Azure OCR (~$1/1000 páginas), EasyOCR (gratis pero $$$$ en GPU)
- **Monitoring**: Datadog/New Relic (~$15-100/mes por servicio)

**Total ahorrado usando OSS**: ~$5,000-10,000/año 🎉
