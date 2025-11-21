# FontSelector Component

A beautiful, professional font selector component for the UNS-ClaudeJP 4.2 Custom Theme Builder.

## Features

- **21 Professional Fonts**: All carefully curated Google Fonts
- **Search & Filter**: Find fonts by name, description, or category
- **Visual Previews**: See font names displayed in the actual font
- **Category Badges**: Sans-serif, Serif, Display labels
- **Keyboard Navigation**: Full arrow key, Enter, Escape support
- **Preview Text**: Optional "AaBbCc 123 日本語" preview
- **Mobile Friendly**: Responsive design for all screen sizes
- **Fully Accessible**: ARIA labels and keyboard support
- **TypeScript**: Complete type safety with IntelliSense
- **Dark Mode Ready**: Designed for dark mode support

## Installation

The component is already installed at `D:\JPUNS-CLAUDE4.2\frontend-nextjs\components\font-selector.tsx`.

### Dependencies

All dependencies are already included:
- `@/lib/font-utils` - Font utility functions
- `@/components/ui/badge` - Badge component for categories
- `@/components/ui/input` - Input component for search
- `lucide-react` - Icons (Search, ChevronDown, Check)

## Basic Usage

```tsx
import { FontSelector } from '@/components/font-selector';

function MyComponent() {
  const [selectedFont, setSelectedFont] = useState('Work Sans');

  return (
    <FontSelector
      currentFont={selectedFont}
      onFontChange={setSelectedFont}
      label="Choose Font"
    />
  );
}
```

## Props API

### FontSelectorProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `currentFont` | `string` | **required** | Current selected font name (e.g., "Work Sans") |
| `onFontChange` | `(font: string) => void` | **required** | Callback when user selects a new font |
| `label` | `string` | `"Tipografía"` | Label text displayed above the selector |
| `placeholder` | `string` | `"Seleccionar fuente..."` | Placeholder when no font is selected |
| `showDescription` | `boolean` | `true` | Show font description in dropdown |
| `showPreview` | `boolean` | `true` | Show "AaBbCc 123 日本語" preview below selector |
| `className` | `string` | `undefined` | Additional CSS classes for the container |

## Examples

### Full Featured (Default)

```tsx
<FontSelector
  currentFont="Work Sans"
  onFontChange={(font) => console.log('Selected:', font)}
  label="Primary Font"
  showPreview={true}
  showDescription={true}
/>
```

### Without Description

```tsx
<FontSelector
  currentFont="Inter"
  onFontChange={(font) => console.log('Selected:', font)}
  label="Heading Font"
  showPreview={true}
  showDescription={false}
/>
```

### Compact Version

Use the `FontSelectorCompact` component for a minimal version:

```tsx
import { FontSelectorCompact } from '@/components/font-selector';

<FontSelectorCompact
  currentFont="Roboto"
  onFontChange={(font) => console.log('Selected:', font)}
  label="Body Font"
/>
```

This automatically sets `showPreview={false}` and `showDescription={false}`.

### Custom Styling

```tsx
<FontSelector
  currentFont="Montserrat"
  onFontChange={handleFontChange}
  className="max-w-md"
  label="Custom Font"
/>
```

## Keyboard Navigation

| Key | Action |
|-----|--------|
| **Enter / Space** | Open dropdown (when closed) |
| **Arrow Down** | Navigate to next font |
| **Arrow Up** | Navigate to previous font |
| **Enter** | Select highlighted font |
| **Escape** | Close dropdown and clear search |
| **Home** | Jump to first font |
| **End** | Jump to last font |
| **Type to search** | Filter fonts as you type |

## Visual Structure

```
┌─────────────────────────────────────────┐
│  Tipografía                             │
│  ┌───────────────────────────────────┐ │
│  │ Work Sans               ▼          │ │  <- Trigger button
│  └───────────────────────────────────┘ │
│                                         │
│  Preview: AaBbCc 123 日本語            │  <- Optional preview
└─────────────────────────────────────────┘

DROPDOWN (when open):
┌────────────────────────────────────────────┐
│ 🔍 [Buscar fuentes...]                    │  <- Search input
├────────────────────────────────────────────┤
│ ✓ Work Sans          [Sans-serif]         │  <- Selected, highlighted
│   IBM Plex Sans      [Sans-serif]         │
│   Roboto             [Sans-serif]         │
│   ... (18 more fonts)                     │
├────────────────────────────────────────────┤
│   21 fuentes encontradas                  │  <- Results count
└────────────────────────────────────────────┘
```

## Available Fonts (21 Total)

### Sans-serif Fonts (19)
- Inter
- Manrope
- Space Grotesk
- Urbanist
- Poppins
- DM Sans
- Plus Jakarta Sans
- Sora
- Montserrat
- Work Sans
- IBM Plex Sans
- Rubik
- Nunito
- Source Sans 3
- Lato
- Fira Sans
- Open Sans
- Roboto
- Libre Franklin

### Serif Fonts (2)
- Lora
- Playfair Display

## Styling

The component uses Tailwind CSS and follows the jpkken1 theme design system:

- **Colors**: Blue accents, gray neutrals
- **Borders**: 2px solid, rounded-xl (12px radius)
- **Shadows**: Subtle shadows with hover/focus states
- **Animations**: Smooth transitions (200ms duration)
- **Focus States**: Blue ring with 20% opacity
- **Hover States**: Border and shadow changes

## Accessibility

The component is fully accessible:

- ✅ ARIA labels and roles (`role="listbox"`, `aria-expanded`, etc.)
- ✅ Keyboard navigation (arrow keys, Enter, Escape)
- ✅ Focus management (auto-focus search input)
- ✅ Screen reader support
- ✅ Color contrast compliance
- ✅ Clear visual indicators for selection

## Performance

The component is optimized for performance:

- ✅ `useMemo` for filtered fonts (only recalculates when search changes)
- ✅ `useCallback` for event handlers (prevents unnecessary re-renders)
- ✅ Smooth scroll for keyboard navigation
- ✅ Efficient re-renders with React best practices

## Integration with Custom Theme Builder

This component is designed to be used in the Custom Theme Builder:

```tsx
// In your theme builder component
const [theme, setTheme] = useState({
  primaryFont: 'Work Sans',
  headingFont: 'Montserrat',
  bodyFont: 'Inter',
});

<div className="space-y-6">
  <FontSelector
    currentFont={theme.primaryFont}
    onFontChange={(font) => setTheme(prev => ({ ...prev, primaryFont: font }))}
    label="Primary Font"
  />

  <FontSelector
    currentFont={theme.headingFont}
    onFontChange={(font) => setTheme(prev => ({ ...prev, headingFont: font }))}
    label="Heading Font"
  />

  <FontSelector
    currentFont={theme.bodyFont}
    onFontChange={(font) => setTheme(prev => ({ ...prev, bodyFont: font }))}
    label="Body Font"
  />
</div>
```

## Demo Page

A comprehensive demo page is available at:
- **Path**: `D:\JPUNS-CLAUDE4.2\frontend-nextjs\app\demo-font-selector\page.tsx`
- **URL**: `http://localhost:3000/demo-font-selector` (when development server is running)

The demo includes:
- Full featured version
- Version without description
- Compact version
- Live preview of selected fonts
- Complete feature list
- Usage examples

## Troubleshooting

### Font not displaying correctly

Make sure the font is loaded in your `layout.tsx`:

```tsx
import { Work_Sans, Inter, Roboto } from 'next/font/google';

const workSans = Work_Sans({
  subsets: ['latin'],
  variable: '--font-work-sans',
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={workSans.variable}>
      <body>{children}</body>
    </html>
  );
}
```

### Dropdown not closing on click outside

This should work automatically. If it doesn't, check that you don't have any z-index conflicts in your layout.

### Search not working

Make sure you're not preventing the input's `onChange` event somewhere in your parent component.

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## License

This component is part of the UNS-ClaudeJP 4.2 project.

## Credits

- **Design**: Based on jpkken1 theme design system
- **Fonts**: Google Fonts
- **Icons**: Lucide React
- **UI Components**: Shadcn/ui
