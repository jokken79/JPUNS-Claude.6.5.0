# 1. ESTRUCTURA DE CARPETAS - FRONTEND

## Jerarquía Completa

```
frontend/
├── app/
│   ├── (dashboard)/           # Rutas protegidas (App Router)
│   │   ├── layout.tsx         # Layout principal
│   │   ├── page.tsx           # 75 páginas totales
│   │   └── [módulos]/         # Por funcionalidad
│   ├── login/                 # Autenticación
│   ├── profile/               # Perfil usuario
│   ├── database-management/   # Gestión DB
│   └── under-construction/    # Página temporal
│
├── components/                # 155+ componentes
│   ├── ui/                    # 43 Shadcn/UI
│   ├── dashboard/             # Componentes dashboard (11)
│   ├── candidates/            # Candidatos
│   ├── apartments/            # Apartamentos (10)
│   ├── admin/                 # Admin (8)
│   ├── factory/               # Fábricas (5)
│   ├── payroll/               # Nómina (3)
│   ├── salary/                # Salarios (5)
│   ├── keiri/                 # Contabilidad (4)
│   ├── ThemeEditor/           # Editor temas (4)
│   └── [otros]/               # Utilidades
│
├── hooks/                     # 11 custom hooks
│   ├── use-*.ts              # Hooks reutilizables
│   └── useTheme*.ts          # Hooks de tema
│
├── contexts/                  # 2 contextos
│   ├── navigation-context.tsx
│   └── theme-context.tsx
│
├── stores/                    # 9 Zustand stores
│   ├── auth-store.ts
│   ├── themeStore.ts
│   ├── layout-store.ts
│   ├── payroll-store.ts
│   ├── salary-store.ts
│   ├── settings-store.ts
│   ├── fonts-store.ts
│   ├── visibilidad-template-store.ts
│   └── dashboard-tabs-store.ts
│
├── lib/                       # 38 módulos
│   ├── api/                  # Cliente API
│   ├── cache/                # Caché
│   ├── constants/            # Constantes
│   ├── data/                 # Generadores datos
│   ├── hooks/                # Hooks lib
│   ├── motion/               # Framer Motion
│   ├── observability/        # Telemetría
│   ├── styling/              # Estilos
│   ├── utilities/            # Utilidades
│   ├── validations/          # Zod schemas
│   ├── themes.ts             # 17 temas
│   ├── api.ts                # Axios client
│   ├── animations.ts         # Animaciones
│   ├── color-utils.ts        # Utilidades color
│   ├── design-tokens.ts      # Tokens diseño
│   ├── font-utils.ts         # Utilidades fuentes
│   ├── payroll-api.ts        # API nómina
│   ├── templates.ts          # Templates
│   ├── theme-utils.ts        # Utilidades temas
│   ├── utils.ts              # Utilidades generales
│   └── validations.ts        # Validaciones
│
├── types/                     # Tipos TypeScript
│   ├── api.ts                # Tipos API
│   └── apartments-v2.ts      # Tipos Apartments
│
├── styles/                    # Estilos globales
├── public/                    # Assets
├── tailwind.config.js         # Tailwind config
├── next.config.js             # Next.js config
├── tsconfig.json              # TypeScript config
├── package.json               # Dependencias
└── .env.local                 # Variables entorno
```

## Distribución de Componentes

| Categoría | Cantidad | Descripción |
|-----------|----------|-------------|
| Shadcn/UI | 43 | Componentes headless/base |
| Dashboard | 11 | Sidebar, header, tabs |
| Candidatos | 1+ | Formularios, evaluador, impresión |
| Empleados | 1+ | Formularios, vistas |
| Apartamentos | 10 | Selector, asignaciones, cálculos |
| Admin | 8 | Panel control, auditoría |
| Fábricas | 5 | Selector, configuración |
| Nómina | 3 | Cálculos, resúmenes |
| Salarios | 5 | Gestión, reportes |
| Contabilidad | 4 | Específicos yukyu/keiri |
| Editor Temas | 4 | Personalizador, pickers |
| Utilidades | 20+ | Errores, loading, guards, transiciones |
| **TOTAL** | **155+** | **Componentes reutilizables** |

