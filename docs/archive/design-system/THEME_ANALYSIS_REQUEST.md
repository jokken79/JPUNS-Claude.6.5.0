# Design System & Theme Analysis Request

## App Overview
**Project**: UNS-ClaudeJP 5.4 - RRHH Suite (HR Management System)
**Framework**: Next.js 14 + React + TypeScript
**UI Library**: Shadcn/ui components
**Styling**: Tailwind CSS with CSS custom properties (design tokens)
**Language**: Spanish/Japanese (bilingual support)

## Current Theme Configuration

### CSS Custom Properties (globals.css)
**Light Mode (default)**:
- `--background: 0 0% 100%` (white)
- `--foreground: 222.2 84% 4.9%` (dark blue-gray)
- `--primary: 222.2 47.4% 11.2%` (dark blue)
- `--secondary: 210 40% 96.1%` (light gray)
- `--muted: 210 40% 96.1%` (light gray)
- `--accent: 210 40% 96.1%` (light gray)
- `--destructive: 0 84.2% 60.2%` (red)
- `--border: 214.3 31.8% 91.4%` (light border)

**Dark Mode**:
- Dark background, light foreground
- Alternative accent colors
- Adjusted chart colors

### Tailwind Config
- **Color System**: All colors use HSL variables from CSS custom properties
- **Font Families**: 
  - `sans`: Manrope, Inter fallback + Japanese fonts (Noto Sans JP)
  - `heading`: Inter + Japanese fonts
  - `ui`: Space Grotesk, Manrope
  - `japanese`: Noto Sans JP, IBM Plex Sans JP
  - `display`: Playfair Display, Poppins
- **Border Radius**: Scaled system (lg, md, sm)
- **Animations**: Accordion animations only
- **Fonts Loaded**: 23 Google fonts + 2 Japanese fonts (possible bloat?)

### Layout System
- CSS custom properties for dynamic theme switching
- `--layout-font-body`, `--layout-font-heading`, `--layout-font-ui` for runtime font selection
- Dark mode via class-based switching

## Components Structure
- **UI Components**: Shadcn/ui based
- **Theme Editor**: Interactive theme customizer
- **Domain Components**: Apartments, Employees, Candidates, Factory, Payroll, etc.
- **Layout**: Dashboard layout with sidebar, header navigation

## Analysis Needed
1. ✅ **Theme System Validation**
   - Are CSS variables properly defined?
   - Dark/Light mode contrast compliance?
   - Semantic color naming adequate?
   
2. ✅ **Design Token Architecture**
   - Is the color system scalable?
   - Typography scale consistency?
   - Spacing system defined?
   - Shadow/elevation tokens?
   
3. ✅ **Font Management**
   - 23 fonts is excessive - can we optimize?
   - Japanese font loading strategy?
   - Font performance impact?
   - Variable font usage potential?
   
4. ✅ **Tailwind Integration**
   - CSS variables properly connected?
   - Utility classes comprehensive?
   - Custom plugins needed?
   
5. ✅ **Accessibility**
   - Color contrast ratios (WCAG AA/AAA)?
   - Focus states defined?
   - Reduced motion support?
   
6. ✅ **Responsive Design**
   - Breakpoints defined?
   - Mobile-first approach?
   
7. ✅ **Component Library**
   - Consistency across UI?
   - Shadcn integration health?
   - Storybook/documentation?

## Deliverables Expected
- Audit report with findings
- Recommendations for optimization
- Specific CSS/config improvements
- Performance suggestions
- Accessibility gaps & fixes
- Code examples for identified issues
