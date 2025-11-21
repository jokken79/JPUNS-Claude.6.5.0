# Theme Switcher Improved - Integration Guide

## Overview

The `ThemeSwitcherImproved` component is a compact, feature-rich theme switcher designed for the dashboard header. It provides quick access to themes with favorites, search, category filtering, and live preview.

**Component Location:** `/frontend/components/ui/theme-switcher-improved.tsx`

---

## Features

### ✨ Core Features

1. **Favorites Section** - Quick access to up to 5 favorite themes as buttons
2. **Search Functionality** - Real-time search by theme name or label
3. **Theme Grid** - Responsive 3-column grid showing all themes
4. **Live Preview** - Hover over themes for 500ms to preview (non-destructive)
5. **Apply Theme** - Click to apply theme immediately
6. **Category Filter** - 7 category tabs (All, Corporate, Minimal, Creative, Nature, Premium, Vibrant)
7. **Current Theme Indicator** - Visual checkmark on active theme
8. **Open Gallery** - Direct link to full theme gallery (`/themes`)
9. **Create Custom** - Direct link to theme customizer (`/themes/customizer`)
10. **Accessibility** - WCAG compliant with keyboard navigation and ARIA labels

### 🎯 Visual Elements

- **Compact Popover** - 380px wide, 600px tall, opens from header icon
- **Color Preview** - Gradient background showing theme colors
- **Color Dots** - Small circles showing primary and accent colors
- **Favorite Star** - Toggle favorite on hover (yellow when favorited)
- **Active Badge** - Checkmark icon on currently applied theme
- **Theme Count** - Badge showing total number of themes available

---

## Integration Steps

### Step 1: Verify Dependencies

Ensure all required UI components exist:

```bash
# Check if these files exist:
frontend/components/ui/button.tsx
frontend/components/ui/badge.tsx
frontend/components/ui/input.tsx
frontend/components/ui/popover.tsx
frontend/components/ui/tabs.tsx
frontend/components/ui/scroll-area.tsx
```

All components should already exist in the project (Shadcn/ui).

### Step 2: Import in Header

**File:** `frontend/components/dashboard/header.tsx`

Replace the existing `ThemeToggle` import with the new component:

```typescript
// OLD - Remove or comment out
// import { ThemeToggle } from '@/components/ui/theme-toggle'

// NEW - Add this import
import { ThemeSwitcherImproved } from '@/components/ui/theme-switcher-improved'
```

### Step 3: Update Header JSX

In the header component, replace `<ThemeToggle />` with `<ThemeSwitcherImproved />`:

```typescript
// OLD
<ThemeToggle />

// NEW
<ThemeSwitcherImproved />
```

**Example:**
```typescript
export function Header() {
  return (
    <header className="...">
      <div className="flex items-center gap-2">
        {/* Other header items */}
        <ThemeSwitcherImproved />  {/* ← Replace here */}
        {/* User menu, etc. */}
      </div>
    </header>
  )
}
```

### Step 4: Verify Theme Provider

Ensure the app is wrapped with `ThemeProvider` from `next-themes`:

**File:** `frontend/app/layout.tsx`

```typescript
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

---

## Required Imports

The component automatically imports all necessary dependencies:

```typescript
// React
import * as React from "react";
import { useRouter } from "next/navigation";

// Icons (lucide-react)
import {
  Palette, Search, Star, X, Settings,
  Grid3x3, Check, ExternalLink, Plus
} from "lucide-react";

// Theme management
import { useTheme } from "next-themes";

// UI Components (Shadcn/ui)
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

// Theme system
import { themes as defaultThemes } from "@/lib/themes";
import { getCustomThemes, type CustomTheme } from "@/lib/custom-themes";
import {
  hslToRgb,
  parseHslString,
  getCategoryForTheme,
  THEME_CATEGORIES,
} from "@/lib/theme-utils";

// Hooks
import { useThemePreview } from "@/hooks/useThemePreview";
```

**All imports are already available in the project** - no additional packages needed!

---

## Component API

### Props

The component has no props - it's a standalone component.

### Internal State

- `mounted` - Hydration check for SSR
- `customThemes` - Array of user-created custom themes from localStorage
- `searchQuery` - Current search filter text
- `selectedCategory` - Active category filter (default: "all")
- `favorites` - Array of favorited theme names from localStorage
- `isOpen` - Popover open/closed state

### Theme Data Structure

Each theme follows this structure:

```typescript
interface Theme {
  id: string;
  name: string;
  colors: Record<string, string>; // HSL color values
}
```

### Favorites Storage

Favorites are stored in `localStorage` under the key `"theme-favorites"`:

```json
["default-light", "uns-kikaku", "ocean-blue", "sunset", "royal-purple"]
```

Maximum 5 favorites displayed in quick access, but unlimited can be stored.

---

## Usage Examples

### Basic Usage

```typescript
import { ThemeSwitcherImproved } from '@/components/ui/theme-switcher-improved'

export function Header() {
  return (
    <header>
      <ThemeSwitcherImproved />
    </header>
  )
}
```

### With Custom Wrapper

```typescript
<div className="flex items-center gap-2">
  <NotificationBell />
  <ThemeSwitcherImproved />
  <UserMenu />
</div>
```

---

## Testing Checklist

### ✅ Visual Testing

- [ ] Component renders in header without layout issues
- [ ] Popover opens and closes correctly
- [ ] Popover width is 380px, height is 600px
- [ ] Popover aligns to the right edge of trigger button
- [ ] Theme grid shows 3 columns on all screen sizes
- [ ] Theme cards display color gradients correctly
- [ ] Color dots (primary, accent) render correctly
- [ ] Active theme shows checkmark indicator
- [ ] Favorite star appears on hover
- [ ] Search input is visible and styled correctly
- [ ] Category tabs are scrollable horizontally
- [ ] Footer buttons are visible and styled correctly

### ✅ Functionality Testing

- [ ] **Search**: Type in search box - themes filter in real-time
- [ ] **Search Clear**: Click X button - search clears and all themes show
- [ ] **Category Filter**: Click each category tab - themes filter correctly
- [ ] **Apply Theme**: Click a theme card - theme applies immediately
- [ ] **Preview**: Hover over theme for 500ms - preview activates
- [ ] **Preview Cancel**: Move mouse away - original theme restores
- [ ] **Favorite Toggle**: Click star button - theme is favorited
- [ ] **Favorite Toggle**: Click star again - theme is unfavorited
- [ ] **Favorite Quick Access**: Favorited themes appear at top
- [ ] **Favorite Count**: Footer shows correct number of favorites
- [ ] **Gallery Link**: Click "Gallery" button - navigates to `/themes`
- [ ] **Customizer Link**: Click "Create" button - navigates to `/themes/customizer`
- [ ] **Popover Close**: Click outside - popover closes
- [ ] **No Results**: Search for non-existent theme - shows "No themes found" message

### ✅ Accessibility Testing

- [ ] **Keyboard Navigation**: Tab through components - focus visible
- [ ] **Keyboard Selection**: Press Enter/Space on theme card - applies theme
- [ ] **ARIA Labels**: Screen reader announces theme names correctly
- [ ] **Focus Management**: Popover opens - focus doesn't auto-focus search
- [ ] **Focus Trap**: Tab while popover open - stays within popover
- [ ] **Escape Key**: Press Escape - closes popover

### ✅ Responsive Testing

- [ ] Desktop (1920px): All elements visible, no overflow
- [ ] Laptop (1366px): Grid maintains 3 columns
- [ ] Tablet (768px): Popover adjusts position if needed
- [ ] Mobile (375px): Category labels hidden, emojis only

### ✅ Performance Testing

- [ ] **Initial Load**: Component renders within 100ms
- [ ] **Search**: Filter results update within 50ms
- [ ] **Category Switch**: Instant filter with no lag
- [ ] **Preview**: Theme preview applies within 500ms of hover
- [ ] **Apply**: Theme applies instantly on click
- [ ] **LocalStorage**: Favorites persist across page reloads

### ✅ Browser Testing

- [ ] Chrome/Edge (Chromium): All features work
- [ ] Firefox: All features work
- [ ] Safari: All features work
- [ ] Mobile Safari (iOS): Touch interactions work
- [ ] Mobile Chrome (Android): Touch interactions work

### ✅ Theme Testing

Test with these themes to verify color rendering:

- [ ] `default-light` - Light background
- [ ] `default-dark` - Dark background
- [ ] `uns-kikaku` - Corporate blue
- [ ] `ocean-blue` - Blue gradient
- [ ] `sunset` - Orange gradient
- [ ] `royal-purple` - Purple gradient
- [ ] `neon-aurora` - Dark with neon colors
- [ ] `forest-magic` - Green gradient
- [ ] Custom theme (if created)

### ✅ Edge Cases

- [ ] **No Favorites**: Component works without any favorites
- [ ] **All Favorites**: Component works with all themes favorited
- [ ] **No Custom Themes**: Component works with only predefined themes
- [ ] **Many Custom Themes**: Grid scrolls correctly with 20+ themes
- [ ] **Long Theme Names**: Names truncate with ellipsis
- [ ] **Special Characters**: Theme names with symbols render correctly
- [ ] **SSR**: Component doesn't crash on server-side render
- [ ] **localStorage Disabled**: Component gracefully handles no storage

---

## Component Structure

### Layout Hierarchy

```
ThemeSwitcherImproved
└─ Popover
   └─ PopoverContent (380px × 600px)
      ├─ Header Section (p-4)
      │  ├─ Title + Badge
      │  └─ Favorites Quick Access (if any)
      │     └─ FavoriteButton × (1-5)
      ├─ Search Section (p-3)
      │  └─ Input with Search icon and Clear button
      ├─ Category Filter Section
      │  └─ Tabs (7 categories)
      ├─ Theme Grid Section (flex-1, scrollable)
      │  └─ Grid (3 columns)
      │     └─ CompactThemeCard × N
      └─ Footer Section (p-3)
         ├─ Gallery Button
         ├─ Create Button
         └─ Favorite Count
```

### Sub-Components

#### `CompactThemeCard`
- **Size**: ~110px × 90px (height varies)
- **Elements**:
  - Color gradient preview (h-16)
  - Primary & accent color dots
  - Active checkmark (if active)
  - Favorite star (on hover)
  - Theme emoji + label
- **Interactions**:
  - Click: Apply theme
  - Hover 500ms: Preview theme
  - Mouse leave: Cancel preview
  - Click star: Toggle favorite
  - Keyboard: Enter/Space to select

#### `FavoriteButton`
- **Size**: h-8, auto width
- **Elements**:
  - Theme emoji
  - Theme label (max 80px, truncated)
  - Checkmark (if active)
- **Interactions**:
  - Click: Apply theme
  - Hover 500ms: Preview theme
  - Mouse leave: Cancel preview

---

## Customization Options

### Adjust Popover Size

```typescript
// In PopoverContent props
<PopoverContent
  className="w-[380px] p-0"  // Change width here
  // ...
>
  <div className="flex flex-col h-[600px]">  // Change height here
```

### Change Grid Columns

```typescript
// In theme grid section
<div className="grid grid-cols-3 gap-2">  // Change to grid-cols-2 or grid-cols-4
```

### Adjust Preview Delay

```typescript
// In onPreviewStart handlers
onPreviewStart={() => startPreview(themeOption, 500)}
//                                              ^^^ Change delay in milliseconds
```

### Change Max Favorites

```typescript
// In favoriteThemes calculation
const favoriteThemes = allThemes
  .filter((t) => favorites.includes(t.name))
  .slice(0, 5);  // Change max number here
```

### Customize Theme Metadata

Edit the `themeMetadata` object to change labels, emojis, or descriptions:

```typescript
const themeMetadata: Record<string, { emoji: string; label: string; description: string }> = {
  "uns-kikaku": {
    emoji: "🏢",          // Change emoji
    label: "UNS Kikaku",  // Change label
    description: "Corporate theme",  // Change description
  },
  // ...
};
```

---

## Troubleshooting

### Issue: Component doesn't render

**Solution**: Check if `next-themes` is installed and `ThemeProvider` wraps the app.

```bash
npm list next-themes
# Should show: next-themes@X.X.X

# If missing:
npm install next-themes
```

### Issue: Preview doesn't work

**Solution**: Verify `useThemePreview` hook exists at `/frontend/hooks/useThemePreview.ts`

### Issue: Favorites don't persist

**Solution**: Check browser's localStorage is enabled. Test in incognito/private mode may not persist.

### Issue: Popover position is wrong

**Solution**: Adjust `align` and `sideOffset` props:

```typescript
<PopoverContent
  align="end"        // Options: "start", "center", "end"
  sideOffset={8}     // Increase for more spacing
>
```

### Issue: Search doesn't filter

**Solution**: Verify theme names match the format in `themes.ts` (lowercase with hyphens).

### Issue: Category filter shows wrong themes

**Solution**: Check `THEME_CATEGORY_MAP` in `theme-utils.ts` has correct mappings.

### Issue: Custom themes don't appear

**Solution**: Verify `getCustomThemes()` is working:

```typescript
console.log(getCustomThemes()) // Should return array of custom themes
```

---

## File Locations

```
frontend/
├── components/
│   ├── ui/
│   │   ├── theme-switcher-improved.tsx  ← NEW COMPONENT
│   │   ├── theme-toggle.tsx             ← OLD COMPONENT (keep for reference)
│   │   ├── button.tsx                   ← Required
│   │   ├── badge.tsx                    ← Required
│   │   ├── input.tsx                    ← Required
│   │   ├── popover.tsx                  ← Required
│   │   ├── tabs.tsx                     ← Required
│   │   └── scroll-area.tsx              ← Required
│   └── dashboard/
│       └── header.tsx                   ← MODIFY HERE
├── lib/
│   ├── themes.ts                        ← Theme definitions
│   ├── custom-themes.ts                 ← Custom theme storage
│   └── theme-utils.ts                   ← Utility functions
├── hooks/
│   └── useThemePreview.ts               ← Preview hook
└── app/
    └── (dashboard)/
        └── themes/
            ├── page.tsx                 ← Theme gallery
            └── customizer/
                └── page.tsx             ← Theme customizer
```

---

## Next Steps

After integrating the component:

1. **Test thoroughly** - Use the testing checklist above
2. **Gather feedback** - Ask users about the UX
3. **Monitor performance** - Check if preview causes lag
4. **Iterate** - Adjust based on user behavior

Optional enhancements for future:

- [ ] Add theme export/import buttons in footer
- [ ] Add "Reset to default" option
- [ ] Add theme sorting (by name, by recent use)
- [ ] Add theme tags/labels for better organization
- [ ] Add keyboard shortcuts (e.g., Cmd+K to open)
- [ ] Add theme preview in a separate panel
- [ ] Add color contrast information per theme
- [ ] Add "Light/Dark mode" toggle within popover
- [ ] Add recent themes section (last 3 applied)

---

## Support

For issues or questions:

1. Check this integration guide
2. Review component source code comments
3. Check existing theme system documentation
4. Test in browser console for errors

---

**Created**: 2025-11-16
**Component Version**: 1.0.0
**Compatibility**: Next.js 16.0.0, React 19.0.0, TypeScript 5.6
