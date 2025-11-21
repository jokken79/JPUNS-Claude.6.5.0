# CLAUDE_FRONTEND.md - Guía Frontend

> **Guía especializada para trabajar con el Frontend Next.js**

## 🏗️ Arquitectura Frontend

**Framework:** Next.js 16.0.0 (App Router)
**UI Library:** React 19.0.0
**Language:** TypeScript 5.6
**Styling:** Tailwind CSS 3.4
**State:** Zustand + React Query
**UI Components:** Shadcn/ui (Radix + Tailwind)

### Estructura de Directorios
```
frontend/
├── app/                      # App Router (45+ páginas)
│   ├── (dashboard)/          # Protected routes group
│   │   ├── layout.tsx        # Dashboard layout con auth
│   │   ├── candidates/       # 6 páginas (list, create, view, edit, OCR)
│   │   ├── employees/        # 5 páginas
│   │   ├── factories/        # 2 páginas
│   │   ├── timercards/       # Attendance (3 turnos)
│   │   ├── salary/           # Payroll calculations
│   │   ├── requests/         # Leave requests workflow
│   │   ├── themes/           # Theme gallery (12+ themes)
│   │   ├── design-system/    # Template designer
│   │   ├── reports/          # PDF reports
│   │   └── [10+ módulos]
│   └── page.tsx              # Landing page
├── components/               # React components
│   ├── ui/                   # Shadcn/ui components (40+)
│   ├── [feature-comp]/       # Feature components
│   └── providers.tsx         # React Query, Theme providers
├── lib/
│   ├── api.ts                # Axios client con JWT interceptors
│   ├── themes.ts             # 12 predefined + custom themes
│   ├── utils.ts              # Utilities
│   └── validations.ts        # Zod schemas
├── stores/                   # Zustand state management
│   ├── auth.ts               # Authentication store
│   ├── candidates.ts         # Candidate data
│   ├── employees.ts          # Employee data
│   └── [stores]              # All domain stores
├── contexts/                 # React contexts
├── hooks/                    # Custom React hooks
└── types/                    # TypeScript definitions
```

## 🔧 Comandos Esenciales

### Development
```bash
# Acceder al contenedor
docker exec -it uns-claudejp-frontend bash

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Quality Checks
```bash
# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Format code
npm run format
```

### Testing
```bash
# Unit tests (Vitest)
npm test
npm test -- --watch

# E2E tests (Playwright)
npm run test:e2e
npm run test:e2e -- --headed

# Coverage
npm run test:coverage
```

### Dependencies
```bash
# Install package
npm install <package-name>

# Install dev package
npm install -D <package-name>

# Update package
npm update <package-name>

# Show dependencies
npm list
npm outdated
```

## 📱 App Router Pattern

### Page Structure
```typescript
// app/(dashboard)/candidates/page.tsx
import { getCandidates } from '@/lib/api'
import { CandidateList } from '@/components/candidates/candidate-list'

export default async function CandidatesPage() {
  const candidates = await getCandidates()
  return <CandidateList candidates={candidates} />
}
```

### Client Components
```typescript
// components/candidates/candidate-list.tsx
'use client'
import { useState } from 'react'
import { useCandidateStore } from '@/stores/candidates'

export function CandidateList({ candidates }) {
  const { selectedCandidate, setSelected } = useCandidateStore()
  // ... component logic
}
```

### Layout
```typescript
// app/(dashboard)/layout.tsx
import { getCurrentUser } from '@/lib/api'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div>
      <Sidebar />
      <main>{children}</main>
    </div>
  )
}
```

## 🎨 UI Components (Shadcn/ui)

### Usage Pattern
```typescript
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function MyComponent() {
  return (
    <Card>
      <CardHeader>Title</CardHeader>
      <CardContent>
        <Input placeholder="Enter value" />
        <Button>Submit</Button>
      </CardContent>
    </Card>
  )
}
```

### Available Components (40+)
- Button, Input, Card, Dialog
- DataTable, Pagination
- Form (with react-hook-form)
- Select, DropdownMenu
- Tabs, Accordion
- Badge, Avatar
- Calendar, DatePicker
- And more...

## 🗂️ State Management

### Zustand Stores
```typescript
// stores/candidates.ts
import { create } from 'zustand'
import { Candidate } from '@/types'

interface CandidateState {
  candidates: Candidate[]
  selectedCandidate: Candidate | null
  setCandidates: (candidates: Candidate[]) => void
  selectCandidate: (candidate: Candidate) => void
}

export const useCandidateStore = create<CandidateState>((set) => ({
  candidates: [],
  selectedCandidate: null,
  setCandidates: (candidates) => set({ candidates }),
  selectCandidate: (candidate) => set({ selectedCandidate: candidate }),
}))
```

### React Query (Server State)
```typescript
// hooks/useCandidates.ts
import { useQuery } from '@tanstack/react-query'
import { getCandidates } from '@/lib/api'

export function useCandidates() {
  return useQuery({
    queryKey: ['candidates'],
    queryFn: getCandidates,
  })
}
```

### Usage in Components
```typescript
'use client'
import { useCandidateStore } from '@/stores/candidates'

export function CandidateList() {
  const { candidates, selectCandidate } = useCandidateStore()

  return (
    <ul>
      {candidates.map((candidate) => (
        <li key={candidate.id} onClick={() => selectCandidate(candidate)}>
          {candidate.full_name_roman}
        </li>
      ))}
    </ul>
  )
}
```

## 🌐 API Integration

### Axios Client
```typescript
// lib/api.ts
import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
})

// Request interceptor (add JWT)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor (handle 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

### API Methods
```typescript
// lib/api/candidates.ts
import api from '../api'

export const getCandidates = async () => {
  const { data } = await api.get('/api/candidates/')
  return data
}

export const getCandidate = async (id: string) => {
  const { data } = await api.get(`/api/candidates/${id}`)
  return data
}

export const createCandidate = async (candidate: CreateCandidateRequest) => {
  const { data } = await api.post('/api/candidates/', candidate)
  return data
}

export const updateCandidate = async (id: string, candidate: UpdateCandidateRequest) => {
  const { data } = await api.put(`/api/candidates/${id}`, candidate)
  return data
}

export const deleteCandidate = async (id: string) => {
  await api.delete(`/api/candidates/${id}`)
}
```

## 🎨 Theme System

### 12 Predefined Themes
```typescript
// lib/themes.ts
export const themes = {
  'default-light': { ... },
  'default-dark': { ... },
  'uns-kikaku': { ... },
  'industrial': { ... },
  'ocean-blue': { ... },
  'mint-green': { ... },
  'forest-green': { ... },
  'sunset': { ... },
  'royal-purple': { ... },
  'vibrant-coral': { ... },
  'monochrome': { ... },
  'espresso': { ... },
}
```

### Custom Themes
```typescript
// Create custom theme
const customTheme = {
  name: 'my-custom-theme',
  colors: {
    primary: '#...',
    secondary: '#...',
    // ... more colors
  }
}

// Apply theme
useThemeStore.getState().setTheme(customTheme)
```

## 🧪 Testing

### Unit Tests (Vitest)
```typescript
// __tests__/components/Button.test.tsx
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

test('renders button', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByText('Click me')).toBeInTheDocument()
})
```

### E2E Tests (Playwright)
```typescript
// e2e/candidates.spec.ts
import { test, expect } from '@playwright/test'

test('candidate workflow', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name="username"]', 'admin')
  await page.fill('[name="password"]', 'admin123')
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL('/dashboard')
  await expect(page.locator('text=Candidates')).toBeVisible()
})
```

## 🏗️ Build & Deployment

### Development
```bash
npm run dev        # Dev server with hot reload
npm run build      # Production build
npm start          # Start production server
```

### Build Optimization
```bash
# Analyze bundle
npm run build
npm run analyze

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📱 Pages (45+)

### Structure
- **Candidates (6 pages):** List, Create, View, Edit, OCR, Import
- **Employees (5 pages):** List, Create, View, Edit, Assign
- **Factories (2 pages):** List, View
- **Timer Cards (3 pages):** Morning, Afternoon, Night shifts
- **Salary:** Payroll calculations
- **Requests:** Leave workflow
- **Themes:** Gallery (12+ themes), Customizer
- **Design System:** Template designer
- **Reports:** PDF generation
- **Dashboard:** Analytics & stats

### Protected Routes
```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')

  if (!token && request.nextUrl.pathname.startsWith('/(dashboard)')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}
```

## 🐛 Debugging

### View Logs
```bash
# Container logs
docker compose logs -f frontend

# With timestamps
docker compose logs -f -t frontend

# Last 100 lines
docker compose logs --tail=100 frontend
```

### Common Issues

**Blank Page:**
```bash
# Wait 1-2 minutes for compilation
# Check logs
docker compose logs frontend

# Rebuild if needed
docker compose up -d --build frontend
```

**Build Fails:**
```bash
# Clean build
docker compose exec frontend rm -rf .next
docker compose exec frontend npm run build

# Check TypeScript
npm run type-check

# Check dependencies
npm install
```

**API Errors:**
```bash
# Check backend
curl http://localhost:8000/api/health

# Check CORS
# Verify FRONTEND_URL in .env
```

## 📁 Key Files

### Core
- `app/layout.tsx` - Root layout
- `app/page.tsx` - Landing page
- `app/(dashboard)/layout.tsx` - Protected layout

### Providers
- `components/providers.tsx` - React Query, Theme providers
- `contexts/AuthContext.tsx` - Auth context

### API & State
- `lib/api.ts` - Axios client
- `stores/auth.ts` - Auth store
- `hooks/use-auth.ts` - Auth hook

### Utilities
- `lib/utils.ts` - Helper functions
- `lib/validations.ts` - Zod schemas

---

**💡 Tip:** Use server components for data fetching, client components for interactivity
**⚠️ Warning:** Never use localStorage for sensitive data - use HttpOnly cookies instead
