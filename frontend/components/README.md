# Catálogo de Componentes - Frontend

> Biblioteca completa de componentes React para **UNS-ClaudeJP 5.0**

[![Total Components](https://img.shields.io/badge/Componentes-103-blue)]()
[![React](https://img.shields.io/badge/React-19.0.0-61DAFB)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6)]()
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC)]()
[![Next.js](https://img.shields.io/badge/Next.js-16.0.0-000000)]()

---

## Índice Rápido

- [Resumen General](#resumen-general)
- [Componentes Principales](#componentes-principales)
- [Componentes UI (Shadcn)](#componentes-ui-shadcn)
- [Dashboard](#dashboard)
- [Temas y Personalización](#temas-y-personalización)
- [Templates](#templates)
- [Loading y Estados](#loading-y-estados)
- [Herramientas de Diseño](#herramientas-de-diseño)
- [Ejemplos de Uso](#ejemplos-de-uso)
- [Estructura de Archivos](#estructura-de-archivos)
- [Guía de Estilo](#guía-de-estilo)

---

## Resumen General

### Estadísticas

- **Total de Componentes**: 103 archivos `.tsx`
- **Componentes UI (Shadcn)**: 36
- **Componentes de Dashboard**: 11
- **Componentes de Temas**: 15+
- **Componentes de Carga**: 5
- **Componentes Principales**: 40+

### Tecnologías

- **React 19.0.0** - Framework UI
- **TypeScript 5.6** - Type safety
- **Tailwind CSS 3.4** - Utility-first styling
- **Shadcn UI** - Component library base
- **Next.js 16** - App Router, Server Components
- **Lucide Icons** - Icon library
- **Heroicons** - Additional icons

---

## Componentes Principales

Componentes de alto nivel ubicados en la raíz de `/components/`.

### Formularios y OCR

| Componente | Archivo | Descripción | Props Principales |
|------------|---------|-------------|-------------------|
| **OCRUploader** | `OCRUploader.tsx` | Cargador de documentos con OCR automático | `onOCRComplete: (data) => void` |
| **AzureOCRUploader** | `AzureOCRUploader.tsx` | Variante OCR específica de Azure | `onOCRComplete: (data) => void` |
| **CandidateForm** | `CandidateForm.tsx` | Formulario completo de candidatos (履歴書) | `candidateId?: string`, `isEdit?: boolean` |
| **EmployeeForm** | `EmployeeForm.tsx` | Formulario completo de empleados (派遣社員) | `employeeId?: string`, `isEdit?: boolean` |
| **RirekishoPrintView** | `RirekishoPrintView.tsx` | Vista de impresión de履歴書 | `candidateId: string` |

#### Ejemplo: OCRUploader

```tsx
import OCRUploader from '@/components/OCRUploader';

function CandidatePage() {
  const handleOCRComplete = (ocrData: any) => {
    console.log('OCR data:', ocrData);
    // Auto-populate form with OCR results
  };

  return (
    <OCRUploader onOCRComplete={handleOCRComplete} />
  );
}
```

**Características**:
- Soporta JPG, PNG, PDF (hasta 5MB)
- Validación de tipo de archivo
- Vista previa de imágenes
- Barra de progreso animada
- 3 tipos de documentos: 履歴書 (Rirekisho), 在留カード, 運転免許証

---

### Navegación y Layout

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| **PageTransition** | `PageTransition.tsx` | Transiciones animadas entre páginas |
| **BreadcrumbNav** | `breadcrumb-nav.tsx` | Navegación de migas de pan |
| **AnimatedLink** | `animated-link.tsx` | Enlaces con animaciones |
| **NavigationProgress** | `navigation-progress.tsx` | Indicador de progreso de navegación |
| **ProgressIndicator** | `progress-indicator.tsx` | Indicador de progreso genérico |

---

### Estados y Guardias

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| **ErrorBoundary** | `error-boundary.tsx` | Captura errores de React |
| **ErrorBoundaryWrapper** | `error-boundary-wrapper.tsx` | Wrapper simplificado |
| **ErrorDisplay** | `error-display.tsx` | Muestra errores formateados |
| **ErrorState** | `error-state.tsx` | Estado de error completo |
| **EmptyState** | `empty-state.tsx` | Estado vacío con ilustración |
| **UnderConstruction** | `under-construction.tsx` | Página en construcción |
| **VisibilityGuard** | `visibility-guard.tsx` | Control de visibilidad basado en permisos |

---

## Componentes UI (Shadcn)

Biblioteca completa de componentes UI basados en Shadcn, ubicados en `/components/ui/`.

### Inputs y Formularios

| Componente | Archivo | Descripción | Características |
|------------|---------|-------------|-----------------|
| **Input** | `input.tsx` | Input básico | Variantes, estados, iconos |
| **EnhancedInput** | `enhanced-input.tsx` | Input mejorado | Validación inline, autocompletado |
| **FloatingInput** | `floating-input.tsx` | Input con label flotante | Animación smooth, focus states |
| **PasswordInput** | `password-input.tsx` | Input de contraseña | Toggle visibilidad, strength meter |
| **PhoneInput** | `phone-input.tsx` | Input de teléfono | Formato automático, validación |
| **Textarea** | `textarea.tsx` | Área de texto | Auto-resize, contador |
| **AnimatedTextarea** | `animated-textarea.tsx` | Textarea animado | Animaciones focus, resize |

### Selects y Pickers

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| **Select** | `select.tsx` | Select básico |
| **SearchableSelect** | `searchable-select.tsx` | Select con búsqueda |
| **DatePicker** | `date-picker.tsx` | Selector de fechas |
| **ColorPicker** | `color-picker.tsx` | Selector de colores HSL |

### Botones y Acciones

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| **Button** | `button.tsx` | Botón con variantes |
| **Toggle** | `toggle.tsx` | Toggle switch |
| **ToggleGroup** | `toggle-group.tsx` | Grupo de toggles |
| **Checkbox** | `checkbox.tsx` | Checkbox con estados |
| **Switch** | `switch.tsx` | Switch on/off |

### Layout y Contenedores

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| **Card** | `card.tsx` | Tarjeta contenedora |
| **Dialog** | `dialog.tsx` | Modal/Dialog |
| **Accordion** | `accordion.tsx` | Acordeón colapsable |
| **Tabs** | `tabs.tsx` | Pestañas |
| **Separator** | `separator.tsx` | Separador visual |
| **ScrollArea** | `scroll-area.tsx` | Área con scroll custom |

### Navegación y Menus

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| **DropdownMenu** | `dropdown-menu.tsx` | Menú desplegable |
| **Tooltip** | `tooltip.tsx` | Tooltip con posicionamiento |

### Feedback y Estados

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| **Badge** | `badge.tsx` | Etiqueta de estado |
| **Skeleton** | `skeleton.tsx` | Placeholder de carga |
| **Avatar** | `avatar.tsx` | Avatar de usuario |
| **Slider** | `slider.tsx` | Control deslizante |

### Formularios Complejos

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| **Form** | `form.tsx` | Sistema de formularios |
| **FormField** | `form-field.tsx` | Campo de formulario |
| **MultiStepForm** | `multi-step-form.tsx` | Formulario multi-paso |
| **FileUpload** | `file-upload.tsx` | Carga de archivos drag & drop |

### Especiales

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| **Table** | `table.tsx` | Tabla responsive |
| **Label** | `label.tsx` | Label accesible |
| **Animated** | `animated.tsx` | Wrapper de animaciones |
| **ThemeSwitcher** | `theme-switcher.tsx` | Cambiar tema claro/oscuro |

#### Ejemplo: FloatingInput

```tsx
import { FloatingInput } from '@/components/ui/floating-input';

function MyForm() {
  const [value, setValue] = useState('');

  return (
    <FloatingInput
      label="氏名（漢字）"
      name="full_name_kanji"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      required
      placeholder="山田 太郎"
    />
  );
}
```

---

## Dashboard

Componentes específicos del dashboard ubicados en `/components/dashboard/`.

### Componentes de Dashboard

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| **Sidebar** | `sidebar.tsx` | Barra lateral de navegación |
| **Header** | `header.tsx` | Encabezado del dashboard |
| **DashboardHeader** | `dashboard-header.tsx` | Variante header con breadcrumbs |
| **MetricCard** | `metric-card.tsx` | Tarjeta de métricas/KPIs |
| **StatsChart** | `stats-chart.tsx` | Gráfico de estadísticas |
| **DataTable** | `data-table.tsx` | Tabla de datos con paginación |

### Gráficos (Charts)

Ubicados en `/components/dashboard/charts/`.

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| **AreaChartCard** | `AreaChartCard.tsx` | Gráfico de área |
| **BarChartCard** | `BarChartCard.tsx` | Gráfico de barras |
| **DonutChartCard** | `DonutChartCard.tsx` | Gráfico de dona |
| **TrendCard** | `TrendCard.tsx` | Tarjeta de tendencias |

#### Ejemplo: MetricCard

```tsx
import MetricCard from '@/components/dashboard/metric-card';

function DashboardPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <MetricCard
        title="Total Candidates"
        value={234}
        trend="+12%"
        icon={<UsersIcon />}
      />
      <MetricCard
        title="Active Employees"
        value={156}
        trend="+5%"
        icon={<BriefcaseIcon />}
      />
    </div>
  );
}
```

---

## Temas y Personalización

Sistema completo de theming con 12 temas predefinidos + temas personalizados ilimitados.

### Componentes de Temas

| Componente | Archivo | Descripción | Props Principales |
|------------|---------|-------------|-------------------|
| **ThemeCard** | `theme-card.tsx` | Tarjeta de vista previa de tema | `theme`, `isActive`, `onApply`, `onPreview` |
| **ThemeDetailModal** | `theme-detail-modal.tsx` | Modal con detalles del tema | `theme`, `isOpen`, `onClose` |
| **ThemePreviewModal** | `theme-preview-modal.tsx` | Vista previa en vivo de tema | `theme`, `isOpen`, `onClose` |
| **ThemeSelector** | `theme-selector.tsx` | Selector de tema dropdown | `onThemeChange` |
| **EnhancedThemeSelector** | `enhanced-theme-selector.tsx` | Selector mejorado con búsqueda | `onThemeChange`, `showFavorites` |
| **ThemeToggle** | `theme-toggle.tsx` | Toggle claro/oscuro simple | - |
| **ThemeManager** | `ThemeManager.tsx` | Gestor global de temas | - |
| **CustomThemeBuilder** | `custom-theme-builder.tsx` | Constructor de temas personalizados | `onSave` |

### Editor de Temas

Dos versiones del editor (carpetas con diferentes estilos de capitalización).

**`/components/ThemeEditor/`** (Pascal Case):

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| **EditorCanvas** | `EditorCanvas.tsx` | Canvas de edición visual |
| **PropertiesPanel** | `PropertiesPanel.tsx` | Panel de propiedades |
| **SidebarTree** | `SidebarTree.tsx` | Árbol de navegación |
| **FontSelectorDemo** | `FontSelectorDemo.tsx` | Demo selector de fuentes |

**`/components/theme-editor/`** (kebab-case):

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| **editor-canvas** | `editor-canvas.tsx` | Canvas de edición |
| **properties-panel** | `properties-panel.tsx` | Panel de propiedades |
| **sidebar-tree** | `sidebar-tree.tsx` | Árbol lateral |

#### Ejemplo: ThemeCard

```tsx
import { ThemeCard } from '@/components/theme-card';
import { themes } from '@/lib/themes';

function ThemeGallery() {
  const [activeTheme, setActiveTheme] = useState('default-light');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {themes.map((theme) => (
        <ThemeCard
          key={theme.name}
          theme={theme}
          isActive={activeTheme === theme.name}
          onApply={() => setActiveTheme(theme.name)}
          onPreview={() => console.log('Preview:', theme.name)}
          metadata={{
            emoji: '🎨',
            label: theme.name,
            description: 'Beautiful theme',
            category: 'predefined',
          }}
        />
      ))}
    </div>
  );
}
```

**Características del ThemeCard**:
- Vista previa visual con colores HSL
- Hover overlay con botones Preview/Apply
- Indicador de tema activo
- Botón de favoritos con corazón
- Badge de categoría
- Paleta de colores con dots
- Conversión HSL a RGB automática

---

## Templates

Sistema de plantillas para layouts personalizados.

### Componentes de Templates

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| **TemplateCard** | `template-card.tsx` | Tarjeta de plantilla |
| **TemplateDetailModal** | `template-detail-modal.tsx` | Detalles de plantilla |
| **TemplateComparison** | `template-comparison.tsx` | Comparar plantillas |
| **TemplatePreview** | `template-preview.tsx` | Vista previa de plantilla |
| **TemplateSelector** | `template-selector.tsx` | Selector de plantilla |
| **TemplateManager** | `TemplateManager.tsx` | Gestor de plantillas |

### Templates Especiales

Ubicados en `/components/templates/visibilidad-rrhh/`.

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| **VisibilidadRRHHLayout** | `VisibilidadRRHHLayout.tsx` | Layout completo RRHH |
| **Sidebar** | `Sidebar.tsx` | Sidebar específico |
| **NavItem** | `NavItem.tsx` | Item de navegación |

#### Estructura del Template

```
templates/
└── visibilidad-rrhh/
    ├── VisibilidadRRHHLayout.tsx   # Layout principal
    ├── Sidebar.tsx                  # Sidebar custom
    ├── NavItem.tsx                  # Navegación
    ├── index.ts                     # Exports
    ├── templates-config.json        # Configuración
    ├── README.md                    # Documentación
    └── INSTALLATION_GUIDE.md        # Guía de instalación
```

---

## Loading y Estados

Componentes para estados de carga y transiciones.

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| **LoadingOverlay** | `loading-overlay.tsx` | Overlay de carga fullscreen |
| **InlineLoading** | `inline-loading.tsx` | Loading inline |
| **PageSkeleton** | `page-skeleton.tsx` | Skeleton de página completa |
| **SuspenseBoundary** | `suspense-boundary.tsx` | Boundary de Suspense |
| **ProgressIndicator** | `progress-indicator.tsx` | Indicador de progreso |

#### Ejemplo: PageSkeleton

```tsx
import PageSkeleton from '@/components/page-skeleton';

function CandidatesPage() {
  const { data, isLoading } = useQuery(['candidates']);

  if (isLoading) {
    return <PageSkeleton />;
  }

  return <div>...</div>;
}
```

---

## Herramientas de Diseño

Componentes para diseñadores y personalización avanzada.

### Generadores

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| **GradientBuilder** | `gradient-builder.tsx` | Generador de gradientes CSS |
| **ShadowCustomizer** | `shadow-customizer.tsx` | Generador de sombras |
| **ColorPaletteGenerator** | `color-palette-generator.tsx` | Generador de paletas |
| **TypographyScaleGenerator** | `typography-scale-generator.tsx` | Escala tipográfica |
| **SpacingScaleGenerator** | `spacing-scale-generator.tsx` | Escala de espaciado |
| **BorderRadiusVisualizer** | `border-radius-visualizer.tsx` | Visualizador de border-radius |

### Utilidades de Diseño

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| **AdvancedColorPicker** | `advanced-color-picker.tsx` | Picker avanzado HSL/RGB/HEX |
| **ContrastChecker** | `contrast-checker.tsx` | Verificador de contraste WCAG |
| **FontSelector** | `font-selector.tsx` | Selector de fuentes Google Fonts |
| **PresetCard** | `preset-card.tsx` | Tarjeta de preset |

#### Ejemplo: GradientBuilder

```tsx
import GradientBuilder from '@/components/gradient-builder';

function DesignToolsPage() {
  const [gradient, setGradient] = useState('');

  return (
    <GradientBuilder
      onGradientChange={(css) => setGradient(css)}
    />
  );
}
```

**Características**:
- Editor visual interactivo
- Soporte múltiples stops de color
- Ángulo ajustable
- Preview en tiempo real
- Copy to clipboard
- Export CSS

---

## Ejemplos de Uso

### Formulario Completo con Validación

```tsx
'use client';

import { useState } from 'react';
import { FloatingInput } from '@/components/ui/floating-input';
import { DatePicker } from '@/components/ui/date-picker';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function ExampleForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    birthday: null,
    role: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form data:', formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Example Form</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FloatingInput
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <FloatingInput
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <DatePicker
            label="Birthday"
            value={formData.birthday}
            onChange={(date) => setFormData({ ...formData, birthday: date })}
          />

          <SearchableSelect
            label="Role"
            options={[
              { value: 'admin', label: 'Administrator' },
              { value: 'user', label: 'User' },
              { value: 'guest', label: 'Guest' },
            ]}
            value={formData.role}
            onChange={(value) => setFormData({ ...formData, role: value })}
          />

          <Button type="submit" className="w-full">
            Submit
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

### Dashboard con Métricas

```tsx
'use client';

import MetricCard from '@/components/dashboard/metric-card';
import { AreaChartCard } from '@/components/dashboard/charts/AreaChartCard';
import { DataTable } from '@/components/dashboard/data-table';
import { Users, Briefcase, TrendingUp } from 'lucide-react';

export default function DashboardExample() {
  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Total Users"
          value={1234}
          trend="+12.5%"
          icon={<Users />}
        />
        <MetricCard
          title="Active Projects"
          value={56}
          trend="+8.2%"
          icon={<Briefcase />}
        />
        <MetricCard
          title="Revenue"
          value="¥4.2M"
          trend="+15.3%"
          icon={<TrendingUp />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AreaChartCard
          title="Monthly Growth"
          data={[...]}
        />
      </div>

      {/* Data Table */}
      <DataTable
        columns={[...]}
        data={[...]}
      />
    </div>
  );
}
```

### Theme Switcher

```tsx
'use client';

import { useState } from 'react';
import { EnhancedThemeSelector } from '@/components/enhanced-theme-selector';
import { useTheme } from 'next-themes';

export default function ThemeSwitcherExample() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Choose Your Theme</h2>
      <EnhancedThemeSelector
        onThemeChange={(themeName) => setTheme(themeName)}
        showFavorites
      />
    </div>
  );
}
```

---

## Estructura de Archivos

```
components/
├── README.md                        # Este archivo
├── FONT_SELECTOR_README.md          # Documentación de font-selector
│
├── [Root Components]                # Componentes principales (40+ archivos)
│   ├── OCRUploader.tsx              # OCR uploader
│   ├── AzureOCRUploader.tsx         # Azure OCR variant
│   ├── CandidateForm.tsx            # Formulario candidatos
│   ├── EmployeeForm.tsx             # Formulario empleados
│   ├── RirekishoPrintView.tsx       # Vista impresión
│   ├── PageTransition.tsx           # Transiciones
│   ├── providers.tsx                # React providers
│   ├── error-boundary.tsx           # Error handling
│   ├── empty-state.tsx              # Estado vacío
│   ├── under-construction.tsx       # En construcción
│   └── ...                          # 30+ componentes más
│
├── ui/                              # Shadcn UI Components (36 componentes)
│   ├── button.tsx                   # Botón
│   ├── card.tsx                     # Tarjeta
│   ├── input.tsx                    # Input básico
│   ├── floating-input.tsx           # Input flotante
│   ├── enhanced-input.tsx           # Input mejorado
│   ├── password-input.tsx           # Input contraseña
│   ├── phone-input.tsx              # Input teléfono
│   ├── textarea.tsx                 # Textarea
│   ├── animated-textarea.tsx        # Textarea animado
│   ├── select.tsx                   # Select
│   ├── searchable-select.tsx        # Select con búsqueda
│   ├── date-picker.tsx              # Date picker
│   ├── color-picker.tsx             # Color picker
│   ├── dialog.tsx                   # Dialog/Modal
│   ├── form.tsx                     # Form system
│   ├── form-field.tsx               # Form field
│   ├── multi-step-form.tsx          # Multi-step form
│   ├── file-upload.tsx              # File upload
│   ├── table.tsx                    # Table
│   ├── accordion.tsx                # Accordion
│   ├── tabs.tsx                     # Tabs
│   ├── dropdown-menu.tsx            # Dropdown
│   ├── tooltip.tsx                  # Tooltip
│   ├── badge.tsx                    # Badge
│   ├── avatar.tsx                   # Avatar
│   ├── skeleton.tsx                 # Skeleton loader
│   ├── slider.tsx                   # Slider
│   ├── switch.tsx                   # Switch
│   ├── toggle.tsx                   # Toggle
│   ├── toggle-group.tsx             # Toggle group
│   ├── checkbox.tsx                 # Checkbox
│   ├── label.tsx                    # Label
│   ├── separator.tsx                # Separator
│   ├── scroll-area.tsx              # Scroll area
│   ├── animated.tsx                 # Animation wrapper
│   └── theme-switcher.tsx           # Theme switcher
│
├── dashboard/                       # Dashboard Components (7 + charts)
│   ├── sidebar.tsx                  # Sidebar navigation
│   ├── header.tsx                   # Dashboard header
│   ├── dashboard-header.tsx         # Header variant
│   ├── metric-card.tsx              # Metric/KPI card
│   ├── stats-chart.tsx              # Stats chart
│   ├── data-table.tsx               # Data table
│   └── charts/                      # Chart components
│       ├── AreaChartCard.tsx        # Area chart
│       ├── BarChartCard.tsx         # Bar chart
│       ├── DonutChartCard.tsx       # Donut chart
│       ├── TrendCard.tsx            # Trend card
│       └── index.ts                 # Exports
│
├── ThemeEditor/                     # Theme Editor (Pascal Case - 4 componentes)
│   ├── EditorCanvas.tsx             # Canvas de edición
│   ├── PropertiesPanel.tsx          # Panel de propiedades
│   ├── SidebarTree.tsx              # Árbol de navegación
│   └── FontSelectorDemo.tsx         # Demo font selector
│
├── theme-editor/                    # Theme Editor (kebab-case - 4 componentes)
│   ├── editor-canvas.tsx            # Canvas de edición
│   ├── properties-panel.tsx         # Panel de propiedades
│   ├── sidebar-tree.tsx             # Árbol de navegación
│   └── README.md                    # Documentación
│
├── templates/                       # Templates System
│   └── visibilidad-rrhh/            # Template RRHH
│       ├── VisibilidadRRHHLayout.tsx
│       ├── Sidebar.tsx
│       ├── NavItem.tsx
│       ├── index.ts
│       ├── templates-config.json
│       ├── README.md
│       └── INSTALLATION_GUIDE.md
│
└── [Design Tools & Utilities]       # Herramientas de diseño (15+ componentes)
    ├── theme-card.tsx               # Theme card
    ├── theme-detail-modal.tsx       # Theme details
    ├── theme-preview-modal.tsx      # Theme preview
    ├── theme-selector.tsx           # Theme selector
    ├── enhanced-theme-selector.tsx  # Enhanced selector
    ├── theme-toggle.tsx             # Theme toggle
    ├── ThemeManager.tsx             # Theme manager
    ├── custom-theme-builder.tsx     # Custom theme builder
    ├── template-card.tsx            # Template card
    ├── template-detail-modal.tsx    # Template details
    ├── template-comparison.tsx      # Compare templates
    ├── template-preview.tsx         # Template preview
    ├── template-selector.tsx        # Template selector
    ├── TemplateManager.tsx          # Template manager
    ├── gradient-builder.tsx         # Gradient generator
    ├── shadow-customizer.tsx        # Shadow generator
    ├── color-palette-generator.tsx  # Palette generator
    ├── typography-scale-generator.tsx
    ├── spacing-scale-generator.tsx
    ├── border-radius-visualizer.tsx
    ├── advanced-color-picker.tsx
    ├── contrast-checker.tsx
    ├── font-selector.tsx
    ├── preset-card.tsx
    ├── loading-overlay.tsx
    ├── inline-loading.tsx
    ├── page-skeleton.tsx
    ├── suspense-boundary.tsx
    ├── progress-indicator.tsx
    ├── navigation-progress.tsx
    ├── breadcrumb-nav.tsx
    ├── animated-link.tsx
    ├── visibility-guard.tsx
    ├── error-boundary.tsx
    ├── error-boundary-wrapper.tsx
    ├── error-display.tsx
    ├── error-state.tsx
    ├── empty-state.tsx
    ├── under-construction.tsx
    └── global-error-handler.tsx
```

---

## Guía de Estilo

### Convenciones de Naming

- **Componentes**: PascalCase (`CandidateForm.tsx`)
- **Utilidades**: kebab-case (`theme-card.tsx`)
- **Tipos/Interfaces**: PascalCase con sufijo Props (`CandidateFormProps`)
- **Hooks personalizados**: camelCase con prefijo `use` (`useTheme`)

### Estructura de Componente

```tsx
'use client'; // Si usa hooks o estado

import React from 'react';
import { type ComponentProps } from 'react';

// 1. Types/Interfaces
interface MyComponentProps {
  title: string;
  onAction?: () => void;
  children?: React.ReactNode;
}

// 2. Component
export default function MyComponent({
  title,
  onAction,
  children
}: MyComponentProps) {
  // 3. State y hooks
  const [state, setState] = React.useState(false);

  // 4. Handlers
  const handleClick = () => {
    onAction?.();
  };

  // 5. Render
  return (
    <div className="...">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
```

### Props Pattern

#### Props Comunes

```tsx
interface CommonProps {
  className?: string;           // Tailwind classes adicionales
  children?: React.ReactNode;   // Contenido hijo
  disabled?: boolean;           // Estado deshabilitado
  loading?: boolean;            // Estado de carga
  variant?: 'default' | 'primary' | 'secondary'; // Variantes
  size?: 'sm' | 'md' | 'lg';   // Tamaños
}
```

#### Callbacks

```tsx
interface CallbackProps {
  onClick?: () => void;
  onChange?: (value: string) => void;
  onSubmit?: (data: FormData) => void;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
}
```

### Styling Guidelines

#### Tailwind CSS

- Usar utility classes de Tailwind
- Evitar CSS inline salvo casos necesarios
- Usar `cn()` helper para combinar clases

```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  "base-classes",
  variant === 'primary' && "primary-classes",
  className // User override
)} />
```

#### Responsive Design

```tsx
<div className="
  grid
  grid-cols-1     // Mobile
  md:grid-cols-2  // Tablet
  lg:grid-cols-3  // Desktop
  gap-4
" />
```

#### Dark Mode

```tsx
<div className="
  bg-white       // Light mode
  dark:bg-gray-900  // Dark mode
  text-gray-900
  dark:text-white
" />
```

### TypeScript Best Practices

#### Props con Valores por Defecto

```tsx
interface ButtonProps {
  variant?: 'default' | 'primary';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  variant = 'default',
  size = 'md'
}: ButtonProps) {
  // ...
}
```

#### Tipos Genéricos

```tsx
interface SelectProps<T> {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  renderOption?: (option: T) => React.ReactNode;
}
```

#### Event Handlers

```tsx
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  // ...
};

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  // ...
};
```

### Accesibilidad (a11y)

#### Labels

```tsx
<label htmlFor="email" className="...">
  Email
</label>
<input id="email" name="email" type="email" />
```

#### ARIA Attributes

```tsx
<button
  aria-label="Close dialog"
  aria-expanded={isOpen}
  aria-controls="dialog-content"
>
  Close
</button>
```

#### Keyboard Navigation

```tsx
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Click me
</div>
```

### Performance

#### React.memo

```tsx
export const ExpensiveComponent = React.memo(function ExpensiveComponent({
  data
}: Props) {
  // ...
});
```

#### useCallback

```tsx
const handleClick = React.useCallback(() => {
  // ...
}, [dependencies]);
```

#### useMemo

```tsx
const expensiveValue = React.useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

---

## Recursos Adicionales

### Documentación Externa

- [React 19 Docs](https://react.dev/)
- [Next.js 16 Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn UI](https://ui.shadcn.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Lucide Icons](https://lucide.dev/)

### Archivos Relacionados

- `/frontend/lib/themes.ts` - Definiciones de temas
- `/frontend/lib/custom-themes.ts` - Gestión de temas personalizados
- `/frontend/lib/templates.ts` - Sistema de plantillas
- `/frontend/lib/api.ts` - Cliente API
- `/frontend/stores/` - Zustand stores
- `/frontend/types/` - Type definitions

### Documentación Interna

- `FONT_SELECTOR_README.md` - Guía del selector de fuentes
- `theme-editor/README.md` - Editor de temas
- `templates/visibilidad-rrhh/README.md` - Template RRHH
- `templates/visibilidad-rrhh/INSTALLATION_GUIDE.md` - Instalación template

---

## Contribuir

### Agregar un Nuevo Componente

1. Crear archivo en la carpeta apropiada
2. Seguir convenciones de naming
3. Incluir tipos TypeScript
4. Agregar documentación JSDoc
5. Incluir ejemplo de uso
6. Actualizar este README

### Mejores Prácticas

- ✅ Componentes pequeños y reutilizables
- ✅ Props bien tipadas
- ✅ Valores por defecto sensibles
- ✅ Accesibilidad (a11y)
- ✅ Responsive design
- ✅ Dark mode support
- ✅ Documentación clara

### Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build
npm run build
```

---

## Changelog

### 2025-10-28 - v5.0
- 103 componentes totales
- Next.js 16 con React 19
- 36 componentes UI (Shadcn)
- 15+ componentes de temas
- 11 componentes de dashboard
- Sistema completo de templates
- Herramientas de diseño profesionales

---

**Mantenido por**: UNS-ClaudeJP Team
**Última actualización**: 2025-10-28
**Versión**: 5.0.0
**Tecnologías**: React 19, TypeScript 5.6, Tailwind CSS 3.4, Next.js 16
