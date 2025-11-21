# 3. GESTIÓN DE ESTADO Y SISTEMA DE TEMAS

## A. ZUSTAND STORES (9 Total)

### 1. auth-store.ts - Autenticación
- token: JWT string
- user: User object
- isAuthenticated: boolean
- Persistencia en localStorage
- Cookie segura con Secure flag
- JWT max age configurable (default 8h)

### 2. themeStore.ts - Sistema de Temas
- selectedElement: elemento seleccionado
- currentTheme: Theme object
- updateThemeProperty(path, value)
- getProperty(path) por dot notation
- previewMode: boolean

### 3. layout-store.ts - Layout
- contentWidth: 'auto' | 'full' | 'compact'
- paddingMultiplier: número
- sidebarCollapsed: boolean

### 4. payroll-store.ts
- Cálculos de nómina
- Configuración temporal
- Filtros

### 5. salary-store.ts
- Datos de salarios
- Filtros y búsqueda
- Cálculos derivados

### 6. settings-store.ts
- Preferencias de usuario
- Configuración de visualización
- Idioma y zona horaria

### 7. fonts-store.ts
- Familias de fuentes
- Pesos y escalas
- Aplicación de fonts custom

### 8. visibilidad-template-store.ts
- Toggles de visibilidad
- Estados de expansión

### 9. dashboard-tabs-store.ts
- Tab activo
- Historial de tabs

## B. REACT CONTEXTS (2)

1. **navigation-context.tsx**
   - currentPath, breadcrumbs
   - Prefetching de páginas
   
2. **theme-context.tsx**
   - currentTheme, setTheme
   - Aplicación global de temas
   - Detección de preferencias del sistema

## C. CUSTOM HOOKS (11)

- use-cached-page-permission
- use-cached-page-visibility
- use-dev-auto-login
- use-form-validation
- use-page-permission
- use-page-visibility
- use-route-change
- useThemeApplier
- useThemePreview
- use-toast

## D. SISTEMA DE TEMAS (17 TEMAS)

### Temas Originales (12)
1. default-light - Claro
2. default-dark - Oscuro
3. uns-kikaku - Corporativo UNS
4. industrial - Industrial
5. ocean-blue - Azul océano
6. mint-green - Verde menta
7. forest-green - Verde bosque
8. sunset - Atardecer
9. royal-purple - Púrpura real
10. vibrant-coral - Coral vibrante
11. monochrome - Monocromático
12. espresso - Espresso

### Temas Nuevos v5.4 (5)
13. pastel - Pastel suave
14. neon - Neón brillante
15. vintage - Vintage retro
16. modern - Moderno
17. minimalist - Minimalista

### Variables CSS por Tema (18 total)
- --background / --foreground
- --card / --card-foreground
- --popover / --popover-foreground
- --primary / --primary-foreground
- --secondary / --secondary-foreground
- --muted / --muted-foreground
- --accent / --accent-foreground
- --destructive / --destructive-foreground
- --border
- --input
- --ring

### Aplicación de Temas
1. User selecciona en /themes
2. themeStore.updateThemeProperty() actualiza estado
3. useThemeApplier hook detecta cambio
4. Inyecta variables CSS en :root
5. Tailwind responde automáticamente
6. DOM renderiza con nuevos colores
7. Transición suave (0.3s)

