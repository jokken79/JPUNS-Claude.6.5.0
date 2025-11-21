# Frontend - UNS-ClaudeJP 6.0.0

## Descripción

Aplicación web Next.js 16 para el sistema de gestión de recursos humanos UNS-ClaudeJP.

## Stack Tecnológico

- **Next.js** 16.0.0 - Framework React con App Router
- **React** 19.0.0 - UI library
- **TypeScript** 5.6 - Type safety
- **Turbopack** - Bundler (70% más rápido que Webpack)
- **Tailwind CSS** 3.4 - Utility-first CSS
- **Shadcn UI** - 40+ componentes UI
- **Zustand** - State management
- **React Query** - Server state caching
- **Axios** - HTTP client
- **date-fns** - Date utilities

## Estructura

```
frontend/
├── app/                     # Next.js App Router (50+ páginas)
│   ├── fonts/              # Sistema de fuentes optimizado
│   ├── (dashboard)/        # Protected routes group
│   │   ├── candidates/     # Gestión de candidatos
│   │   ├── employees/      # Gestión de empleados
│   │   ├── factories/      # Empresas clientes
│   │   ├── timercards/     # Control de asistencia
│   │   ├── salary/         # Nómina
│   │   ├── requests/       # Solicitudes
│   │   ├── themes/         # Galería de temas
│   │   └── [15+ módulos]   # Sistema completo
│   └── page.tsx            # Landing page
├── components/             # React components
│   ├── ui/                 # Shadcn/ui components unificados
│   └── [feature-comp]/     # Feature components
├── lib/                    # Utilities
│   ├── api.ts              # Axios client con JWT
│   ├── themes.ts           # Sistema de temas
│   └── utils.ts            # Utilities
├── stores/                 # Zustand state management
├── contexts/               # React contexts
├── hooks/                  # Custom React hooks
└── types/                  # TypeScript definitions
```

## Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus configuraciones

# Iniciar servidor de desarrollo
npm run dev

# Abrir en navegador
# http://localhost:3000
```

## Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar con Turbopack
npm run dev:webpack      # Iniciar con Webpack (fallback)

# Producción
npm run build            # Build para producción
npm start                # Iniciar servidor producción

# Testing
npm test                 # Unit tests (Vitest)
npm run test:e2e         # E2E tests (Playwright)

# Linting
npm run lint             # ESLint
npm run lint:fix         # ESLint con auto-fix
npm run typecheck        # TypeScript type checking

# Utilities
npm run clean            # Limpiar cache
```

## Características

### Sistema de Temas
- 12 temas predefinidos
- Temas personalizados ilimitados
- Template designer visual
- Design tools (gradientes, sombras, paletas)
- Live preview en tiempo real

### OCR y Documentos
- OCR híbrido (Azure + EasyOCR + Tesseract)
- Soporte de documentos japoneses (履歴書, 在留カード, 運転免許証)
- Extracción automática de fotos
- Vista previa y edición

### Gestión de Personal
- Candidatos (履歴書) con 50+ campos
- Empleados (派遣社員)
- Contract workers (請負社員)
- Staff interno
- Factories (派遣先)
- Apartamentos (社宅)

### Operaciones
- Timercards (タイムカード) - 3 turnos
- Nómina (給与) - Cálculo automático
- Solicitudes (申請) - Workflow de aprobaciones
- Generación de PDFs

## Optimizaciones v6.0.0

- **Bundle size reducido 96%** (37.5MB → 1.5MB)
- **4 fuentes estratégicas** vs 24 fuentes anteriores
- **Sistema de carga condicional** de fuentes
- **Componentes unificados** (5 inputs → 1 componente)
- **Turbopack** para builds más rápidos

## Configuración de Fuentes

El sistema utiliza 4 fuentes estratégicas:
- **Noto Sans JP** - UI japonés
- **Inter** - UI inglés/español
- **Noto Serif JP** - Documentos japoneses
- **Source Code Pro** - Código

Carga condicional basada en:
- Idioma de la página
- Tipo de contenido
- Preferencias del usuario

## Variables de Entorno

Ver `.env.example` para la lista completa.

Principales:
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_APP_NAME` - Nombre de la aplicación
- `NEXT_PUBLIC_ENABLE_OCR` - Habilitar OCR
- `NEXT_PUBLIC_DEFAULT_THEME` - Tema por defecto

## Licencia

MIT License
