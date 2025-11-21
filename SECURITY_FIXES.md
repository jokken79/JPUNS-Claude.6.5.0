# 🔒 SECURITY FIXES - UNS-ClaudeJP 6.0.0

**Fecha de análisis**: 2025-11-19  
**Versión del proyecto**: 6.0.0  
**Prioridad**: MÁXIMA  
**Estado**: PENDIENTE DE IMPLEMENTACIÓN

---

## 📋 RESUMEN EJECUTIVO

Se identificaron **3 vulnerabilidades de seguridad** en la aplicación UNS-ClaudeJP 6.0.0, todas relacionadas con ataques XSS (Cross-Site Scripting) y exposición de credenciales:

| ID | Vulnerabilidad | Severidad | Archivo Afectado | Estado |
|----|---------------|-----------|------------------|--------|
| **XSS-01** | Uso de `innerHTML` sin sanitización | 🔴 **ALTA** | `frontend/app/dashboard/candidates/page.tsx` | ⏳ Pendiente |
| **XSS-02** | Uso de `dangerouslySetInnerHTML` | 🟡 **MEDIA** | `frontend/app/layout.tsx` | ⏳ Pendiente |
| **SEC-01** | Credenciales demo expuestas | 🟡 **MEDIA** | `.env.example` | ⏳ Pendiente |

---

## 🎯 TABLA DE CONTENIDOS

1. [Vulnerabilidad XSS-01: innerHTML en Candidates Page](#vulnerabilidad-xss-01)
2. [Vulnerabilidad XSS-02: dangerouslySetInnerHTML en Layout](#vulnerabilidad-xss-02)
3. [Vulnerabilidad SEC-01: Credenciales Demo Expuestas](#vulnerabilidad-sec-01)
4. [Content Security Policy (CSP) Recomendada](#content-security-policy-csp)
5. [Checklist de Validación](#checklist-de-validación)
6. [Implementación Paso a Paso](#implementación-paso-a-paso)

---

## 🔴 VULNERABILIDAD XSS-01

### 📌 Resumen
**Archivo**: `frontend/app/dashboard/candidates/page.tsx`  
**Línea**: ~210  
**Severidad**: 🔴 **ALTA**  
**Tipo**: Cross-Site Scripting (XSS) mediante `innerHTML`

### 🐛 Descripción del Problema

El código utiliza `innerHTML` para insertar dinámicamente un ícono SVG en el DOM cuando una imagen de candidato falla al cargar. Esto crea un vector de ataque XSS si el contenido SVG es manipulado o si se introduce código malicioso.

### 📋 Código Vulnerable (ANTES)

```typescript
// Línea ~210 en frontend/app/dashboard/candidates/page.tsx
onError={(e) => {
  // Hide broken image and show fallback
  e.currentTarget.style.display = 'none';
  const parent = e.currentTarget.parentElement;
  if (parent) {
    const icon = document.createElement('div');
    icon.innerHTML = '<svg class="h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>';
    parent.appendChild(icon.firstChild!);
  }
}}
```

### ✅ Código Seguro (DESPUÉS)

**Opción 1: Usar `createElement` + `setAttribute` (Recomendada)**

```typescript
// Solución segura usando DOM APIs nativas
onError={(e) => {
  e.currentTarget.style.display = 'none';
  const parent = e.currentTarget.parentElement;
  if (parent) {
    // Crear elementos SVG usando namespace correcto
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'h-8 w-8 text-gray-400');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('stroke-width', '1.5');
    svg.setAttribute('stroke', 'currentColor');
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('d', 'M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z');
    
    svg.appendChild(path);
    parent.appendChild(svg);
  }
}}
```

**Opción 2: Usar React Component con Estado (Mejor Práctica)**

```typescript
// 1. Agregar estado para manejar error de imagen
const [imageError, setImageError] = useState<Record<number, boolean>>({});

// 2. Dentro del map de candidatos, reemplazar la imagen con:
{candidate.photo_data_url && candidate.photo_data_url.trim() !== '' && !imageError[candidate.id] ? (
  <img
    src={candidate.photo_data_url}
    alt="候補者写真"
    className="w-full h-full object-cover"
    onError={() => setImageError(prev => ({ ...prev, [candidate.id]: true }))}
  />
) : (
  <UserPlusIcon className="h-8 w-8 text-muted-foreground" />
)}
```

### 🎯 Impacto de la Vulnerabilidad

- **Riesgo**: Un atacante podría inyectar código JavaScript malicioso en `photo_data_url` que se ejecutaría cuando la imagen falle
- **Vectores de ataque**:
  - Manipulación de datos de candidato en la base de datos
  - XSS stored mediante API endpoints vulnerables
  - Session hijacking, robo de tokens JWT

### 🛡️ Protección Implementada

- ✅ Elimina `innerHTML` y usa APIs seguras del DOM
- ✅ SVG creado con `createElementNS` (namespace-aware)
- ✅ Atributos configurados con `setAttribute` (escapa automáticamente)
- ✅ Alternativa React evita manipulación directa del DOM

---

## 🟡 VULNERABILIDAD XSS-02

### 📌 Resumen
**Archivo**: `frontend/app/layout.tsx`  
**Línea**: ~161  
**Severidad**: 🟡 **MEDIA**  
**Tipo**: Cross-Site Scripting (XSS) mediante `dangerouslySetInnerHTML`

### 🐛 Descripción del Problema

El código utiliza `dangerouslySetInnerHTML` para inyectar un script que sanitiza nombres de temas almacenados en `localStorage`. Aunque el contenido actual es seguro, el uso de `dangerouslySetInnerHTML` es una mala práctica que podría ser explotada si el código se modifica incorrectamente en el futuro.

### 📋 Código Vulnerable (ANTES)

```typescript
// Línea ~161 en frontend/app/layout.tsx
<head>
  {/* Sanitize theme from localStorage before next-themes loads */}
  <script
    dangerouslySetInnerHTML={{
      __html: `
        try {
          const storedTheme = localStorage.getItem('uns-theme');
          if (storedTheme && storedTheme.includes(' ')) {
            // Convert theme names with spaces to IDs
            const themeMap = {
              'Forest Green': 'forest-green',
              'Default Light': 'default-light',
              'Default Dark': 'default-dark',
              'Ocean Blue': 'ocean-blue',
              'Mint Green': 'mint-green',
              'Royal Purple': 'royal-purple',
              'Vibrant Coral': 'vibrant-coral',
              'UNS Kikaku': 'uns-kikaku',
            };
            const validThemeId = themeMap[storedTheme] || 'default-light';
            localStorage.setItem('uns-theme', validThemeId);
          }
        } catch (e) {
          // Silently fail if localStorage is not available
        }
      `,
    }}
  />
</head>
```

### ✅ Código Seguro (DESPUÉS)

**Opción 1: Mover lógica a componente cliente (Recomendada)**

```typescript
// 1. Crear nuevo archivo: frontend/components/theme-sanitizer.tsx
'use client';

import { useEffect } from 'react';

export function ThemeSanitizer() {
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window !== 'undefined') {
      try {
        const storedTheme = localStorage.getItem('uns-theme');
        if (storedTheme && storedTheme.includes(' ')) {
          // Convert theme names with spaces to IDs
          const themeMap: Record<string, string> = {
            'Forest Green': 'forest-green',
            'Default Light': 'default-light',
            'Default Dark': 'default-dark',
            'Ocean Blue': 'ocean-blue',
            'Mint Green': 'mint-green',
            'Royal Purple': 'royal-purple',
            'Vibrant Coral': 'vibrant-coral',
            'UNS Kikaku': 'uns-kikaku',
          };
          const validThemeId = themeMap[storedTheme] || 'default-light';
          localStorage.setItem('uns-theme', validThemeId);
        }
      } catch (e) {
        // Silently fail if localStorage is not available
        console.warn('Theme sanitization failed:', e);
      }
    }
  }, []);

  return null; // Este componente no renderiza nada
}

// 2. Modificar frontend/app/layout.tsx
import { ThemeSanitizer } from '@/components/theme-sanitizer';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Ya no necesitamos el script inline */}
      </head>
      <body className={`${fontVariables} font-sans antialiased`} suppressHydrationWarning>
        <ErrorBoundaryWrapper>
          <Providers>
            <ThemeSanitizer /> {/* Componente seguro en lugar de script */}
            <ChunkErrorHandler />
            {children}
          </Providers>
        </ErrorBoundaryWrapper>
      </body>
    </html>
  );
}
```

**Opción 2: Si el script DEBE ser inline, usar sanitización estricta**

```typescript
// Si absolutamente necesitas el script inline (no recomendado)
<head>
  <script
    // Usar nonce para CSP
    nonce={process.env.NEXT_PUBLIC_CSP_NONCE}
    dangerouslySetInnerHTML={{
      __html: `
        (function() {
          'use strict';
          try {
            const ALLOWED_THEMES = [
              'forest-green',
              'default-light',
              'default-dark',
              'ocean-blue',
              'mint-green',
              'royal-purple',
              'vibrant-coral',
              'uns-kikaku'
            ];
            
            const storedTheme = localStorage.getItem('uns-theme');
            
            // Validar que el tema es una cadena segura
            if (typeof storedTheme === 'string' && storedTheme.length < 50) {
              const themeMap = {
                'Forest Green': 'forest-green',
                'Default Light': 'default-light',
                'Default Dark': 'default-dark',
                'Ocean Blue': 'ocean-blue',
                'Mint Green': 'mint-green',
                'Royal Purple': 'royal-purple',
                'Vibrant Coral': 'vibrant-coral',
                'UNS Kikaku': 'uns-kikaku',
              };
              
              const normalizedTheme = themeMap[storedTheme] || storedTheme;
              
              // Solo guardar si está en la lista de temas permitidos
              if (ALLOWED_THEMES.includes(normalizedTheme)) {
                localStorage.setItem('uns-theme', normalizedTheme);
              } else {
                localStorage.setItem('uns-theme', 'default-light');
              }
            }
          } catch (e) {
            // Silently fail
          }
        })();
      `.trim(),
    }}
  />
</head>
```

### 🎯 Impacto de la Vulnerabilidad

- **Riesgo**: Medio - Actualmente el código es seguro, pero `dangerouslySetInnerHTML` es un anti-patrón
- **Vectores de ataque**:
  - Si se modifica el script en el futuro sin sanitización adecuada
  - Si se introduce lógica que lee input del usuario
  - Bypass de Content Security Policy

### 🛡️ Protección Implementada

- ✅ Elimina `dangerouslySetInnerHTML` completamente (Opción 1)
- ✅ Lógica movida a componente React cliente con `useEffect`
- ✅ Validación estricta de temas permitidos
- ✅ Type-safe con TypeScript
- ✅ Compatible con CSP strict

---

## 🟡 VULNERABILIDAD SEC-01

### 📌 Resumen
**Archivo**: `.env.example`  
**Línea**: 239-242  
**Severidad**: 🟡 **MEDIA**  
**Tipo**: Exposición de credenciales de demostración

### 🐛 Descripción del Problema

Las credenciales de demostración están expuestas como variables de entorno **públicas** (`NEXT_PUBLIC_*`), lo que significa que se compilan directamente en el bundle JavaScript del frontend y son accesibles en el código fuente del navegador.

**Problema adicional**: Estas credenciales no están deshabilitadas en producción.

### 📋 Código Vulnerable (ANTES)

```bash
# Línea 239-242 en .env.example
# ---- Demo Credentials (Development Only) ----
NEXT_PUBLIC_DEMO_USER=admin
NEXT_PUBLIC_DEMO_PASS=admin123
```

### ✅ Código Seguro (DESPUÉS)

**Paso 1: Modificar `.env.example`**

```bash
# ---- Demo Credentials (Development Only) ----
# ⚠️ ADVERTENCIA: Solo habilitar en entornos de desarrollo local
# ⚠️ NUNCA habilitar en producción - descomenta SOLO en local
#
# NEXT_PUBLIC_DEMO_ENABLED=false  # Cambiar a "true" SOLO en desarrollo local
# NEXT_PUBLIC_DEMO_USER=demo
# NEXT_PUBLIC_DEMO_PASS=demo123

# En producción, estas variables DEBEN estar completamente ausentes o en false
NEXT_PUBLIC_DEMO_ENABLED=false
```

**Paso 2: Crear archivo `.env.local` para desarrollo (NO subir a git)**

```bash
# .env.local (solo para desarrollo - agregar a .gitignore)
NEXT_PUBLIC_DEMO_ENABLED=true
NEXT_PUBLIC_DEMO_USER=demo
NEXT_PUBLIC_DEMO_PASS=demo123
```

**Paso 3: Modificar código de auto-login en frontend**

```typescript
// Ejemplo: frontend/hooks/use-dev-auto-login.ts o similar
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';

export function useDevAutoLogin() {
  const login = useAuthStore((state) => state.login);
  
  useEffect(() => {
    // SOLO habilitar si la variable está explícitamente en "true"
    const isDemoEnabled = process.env.NEXT_PUBLIC_DEMO_ENABLED === 'true';
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDemoEnabled && isDevelopment) {
      const demoUser = process.env.NEXT_PUBLIC_DEMO_USER;
      const demoPass = process.env.NEXT_PUBLIC_DEMO_PASS;
      
      if (demoUser && demoPass) {
        console.warn('🚨 Demo mode enabled - auto-login active');
        login(demoUser, demoPass);
      }
    }
  }, [login]);
}
```

**Paso 4: Crear configuración de producción `.env.production`**

```bash
# .env.production (para despliegue de producción)
# ⚠️ NUNCA habilitar demo en producción
NEXT_PUBLIC_DEMO_ENABLED=false
# No incluir NEXT_PUBLIC_DEMO_USER ni NEXT_PUBLIC_DEMO_PASS
```

**Paso 5: Actualizar `.gitignore`**

```bash
# .gitignore - Asegurar que archivos sensibles no se suban
.env.local
.env.development.local
.env.test.local
.env.production.local
.env
```

### 🎯 Impacto de la Vulnerabilidad

- **Riesgo**: Medio-Alto en producción
- **Vectores de ataque**:
  - Credenciales visibles en el código fuente JavaScript compilado
  - Acceso no autorizado con credenciales conocidas
  - Bypass de autenticación en producción si no se deshabilita

### 🛡️ Protección Implementada

- ✅ Credenciales comentadas en `.env.example` por defecto
- ✅ Variable `NEXT_PUBLIC_DEMO_ENABLED` para control explícito
- ✅ Validación doble: `isDevelopment && isDemoEnabled`
- ✅ Credenciales movidas a `.env.local` (no versionado)
- ✅ Configuración de producción sin credenciales demo
- ✅ Logging de advertencia cuando demo está activo

---

## 🛡️ CONTENT SECURITY POLICY (CSP)

### 📌 Recomendación de Headers de Seguridad

Para proteger contra XSS y otros ataques, implementar los siguientes headers HTTP en el servidor Next.js:

### ✅ Configuración Recomendada

**Archivo: `frontend/next.config.js`**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... configuración existente ...
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Content Security Policy (CSP) - Protección XSS
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Ajustar según necesidad
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' http://localhost:8000 http://backend:8000",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
          // Prevenir clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevenir MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // XSS Protection (legacy)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Referrer Policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions Policy
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=()',
              'interest-cohort=()',
            ].join(', '),
          },
          // HSTS (Strict Transport Security)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### 🔧 CSP para Producción (Strict)

Para producción, usar una CSP más estricta sin `unsafe-inline` ni `unsafe-eval`:

```javascript
// CSP Estricta para Producción
"Content-Security-Policy": [
  "default-src 'self'",
  "script-src 'self' 'nonce-{RANDOM_NONCE}'", // Usar nonce para scripts inline
  "style-src 'self' 'nonce-{RANDOM_NONCE}' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "connect-src 'self' https://api.uns-kikaku.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
  "block-all-mixed-content",
].join('; ')
```

### 📋 Implementación de Nonce para Scripts

Si se necesitan scripts inline (como en XSS-02), usar nonces:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';

export function middleware(request: NextRequest) {
  const nonce = crypto.randomBytes(16).toString('base64');
  const response = NextResponse.next();
  
  // Agregar nonce a headers
  response.headers.set('x-nonce', nonce);
  
  return response;
}

// layout.tsx - Usar nonce en scripts
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = headers().get('x-nonce') || '';
  
  return (
    <html>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: '...' }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

## ✅ CHECKLIST DE VALIDACIÓN

### Pre-implementación

- [ ] Backup de archivos antes de modificar
- [ ] Crear rama Git: `git checkout -b security/xss-fixes`
- [ ] Leer documentación completa de cada fix

### XSS-01: innerHTML en Candidates Page

- [ ] Reemplazar `innerHTML` con `createElement` + `setAttribute`
- [ ] Verificar que SVG se renderiza correctamente en navegador
- [ ] Probar con imágenes rotas (error de carga)
- [ ] Verificar que no hay regresiones visuales
- [ ] Test: Intentar inyectar `<script>alert('XSS')</script>` en `photo_data_url` - debe fallar

### XSS-02: dangerouslySetInnerHTML en Layout

- [ ] Crear componente `ThemeSanitizer.tsx`
- [ ] Mover lógica de sanitización a `useEffect`
- [ ] Eliminar `dangerouslySetInnerHTML` de `layout.tsx`
- [ ] Verificar que temas se cargan correctamente al inicio
- [ ] Test: Cambiar temas manualmente - debe funcionar sin errores
- [ ] Verificar que no hay parpadeo (flash of unstyled content)

### SEC-01: Credenciales Demo

- [ ] Comentar credenciales en `.env.example`
- [ ] Crear variable `NEXT_PUBLIC_DEMO_ENABLED=false`
- [ ] Modificar lógica de auto-login con validación doble
- [ ] Crear `.env.local` para desarrollo (agregar a `.gitignore`)
- [ ] Verificar `.env.production` sin credenciales demo
- [ ] Test: Build de producción - credenciales NO deben estar en bundle
- [ ] Usar `grep -r "admin123" .next/` - debe retornar vacío

### Content Security Policy

- [ ] Implementar headers CSP en `next.config.js`
- [ ] Verificar headers con herramientas: [securityheaders.com](https://securityheaders.com)
- [ ] Test en navegador: Abrir DevTools > Network > Headers
- [ ] Verificar que no hay errores CSP en consola
- [ ] Ajustar `script-src` y `style-src` según necesidad
- [ ] Test: Intentar cargar script externo malicioso - debe bloquearse

### Testing Final

- [ ] Ejecutar suite de tests: `npm run test`
- [ ] Build de producción exitoso: `npm run build`
- [ ] Verificar bundle size no aumentó significativamente
- [ ] Test manual en Chrome, Firefox, Safari
- [ ] Verificar accesibilidad (no regresiones A11Y)
- [ ] Code review por segundo desarrollador
- [ ] Escáner de seguridad: `npm audit`
- [ ] Test con herramienta OWASP ZAP o Burp Suite

### Post-implementación

- [ ] Commit con mensaje descriptivo
- [ ] Push a rama de seguridad
- [ ] Crear Pull Request con referencia a este documento
- [ ] Actualizar CHANGELOG.md
- [ ] Notificar al equipo de cambios de seguridad
- [ ] Monitorear logs por 48 horas post-deploy

---

## 🚀 IMPLEMENTACIÓN PASO A PASO

### Paso 1: Preparación

```bash
# 1. Crear rama de seguridad
git checkout -b security/xss-fixes

# 2. Backup de archivos críticos
cp frontend/app/dashboard/candidates/page.tsx frontend/app/dashboard/candidates/page.tsx.backup
cp frontend/app/layout.tsx frontend/app/layout.tsx.backup
cp .env.example .env.example.backup

# 3. Verificar estado actual
git status
```

### Paso 2: Fix XSS-01 (innerHTML)

```bash
# Editar archivo
nano frontend/app/dashboard/candidates/page.tsx

# Ubicar línea ~210 con innerHTML
# Reemplazar con código seguro (ver sección XSS-01 arriba)

# Verificar cambios
git diff frontend/app/dashboard/candidates/page.tsx
```

### Paso 3: Fix XSS-02 (dangerouslySetInnerHTML)

```bash
# 1. Crear nuevo componente
nano frontend/components/theme-sanitizer.tsx

# Copiar código de ThemeSanitizer (ver sección XSS-02)

# 2. Editar layout
nano frontend/app/layout.tsx

# Eliminar script con dangerouslySetInnerHTML
# Agregar import y uso de ThemeSanitizer

# 3. Verificar cambios
git diff frontend/app/layout.tsx
```

### Paso 4: Fix SEC-01 (Credenciales)

```bash
# 1. Editar .env.example
nano .env.example

# Comentar credenciales, agregar NEXT_PUBLIC_DEMO_ENABLED=false

# 2. Crear .env.local para desarrollo
cat > .env.local << 'ENVLOCAL'
NEXT_PUBLIC_DEMO_ENABLED=true
NEXT_PUBLIC_DEMO_USER=demo
NEXT_PUBLIC_DEMO_PASS=demo123
ENVLOCAL

# 3. Agregar a .gitignore
echo ".env.local" >> .gitignore

# 4. Verificar que .env.local NO está en git
git status | grep ".env.local" # NO debe aparecer
```

### Paso 5: Implementar CSP

```bash
# Editar next.config.js
nano frontend/next.config.js

# Agregar función async headers() con CSP (ver sección CSP arriba)

# Verificar sintaxis
npm run build
```

### Paso 6: Testing

```bash
# 1. Instalar dependencias
cd frontend
npm install

# 2. Build de desarrollo
npm run dev

# 3. Verificar en navegador:
# - http://localhost:3000/dashboard/candidates
# - Abrir DevTools > Console (no debe haber errores)
# - Network > Headers (verificar CSP headers)

# 4. Build de producción
npm run build

# 5. Verificar que credenciales NO están en bundle
grep -r "admin123" .next/ # Debe retornar vacío

# 6. Ejecutar tests
npm run test
```

### Paso 7: Commit y Push

```bash
# 1. Agregar archivos modificados
git add frontend/app/dashboard/candidates/page.tsx
git add frontend/components/theme-sanitizer.tsx
git add frontend/app/layout.tsx
git add .env.example
git add .gitignore
git add frontend/next.config.js

# 2. Commit descriptivo
git commit -m "security: Fix 3 XSS vulnerabilities (XSS-01, XSS-02, SEC-01)

- Replace innerHTML with createElement in candidates page (HIGH)
- Move dangerouslySetInnerHTML to React component (MEDIUM)
- Disable demo credentials in production (MEDIUM)
- Implement Content Security Policy headers
- Add security validation checklist

Ref: SECURITY_FIXES.md"

# 3. Push a repositorio
git push origin security/xss-fixes

# 4. Crear Pull Request en GitHub
gh pr create --title "Security: Fix XSS vulnerabilities" --body "See SECURITY_FIXES.md for details"
```

### Paso 8: Validación Post-Deploy

```bash
# 1. Verificar headers en producción
curl -I https://tu-dominio.com | grep -i "content-security-policy"

# 2. Test con herramientas online
# - https://securityheaders.com
# - https://observatory.mozilla.org

# 3. Monitoreo de logs
# Verificar que no hay errores relacionados con CSP en logs de producción
```

---

## 📚 RECURSOS ADICIONALES

### Documentación de Referencia

- **OWASP XSS Prevention Cheat Sheet**  
  https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html

- **Content Security Policy (CSP) Guide**  
  https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP

- **Next.js Security Headers**  
  https://nextjs.org/docs/advanced-features/security-headers

- **React Security Best Practices**  
  https://react.dev/learn/writing-markup-with-jsx#dangers-of-inserting-html

### Herramientas de Testing

- **OWASP ZAP** (Zed Attack Proxy)  
  https://www.zaproxy.org/

- **Burp Suite Community Edition**  
  https://portswigger.net/burp/communitydownload

- **npm audit** (Análisis de dependencias)  
  ```bash
  npm audit --production
  ```

- **Security Headers Checker**  
  https://securityheaders.com

### Comandos Útiles

```bash
# Buscar uso de innerHTML en proyecto
grep -r "innerHTML" frontend/

# Buscar dangerouslySetInnerHTML
grep -r "dangerouslySetInnerHTML" frontend/

# Buscar credenciales hardcodeadas
grep -r "password.*=" frontend/ backend/

# Verificar permisos de archivos sensibles
ls -la .env* config/
```

---

## 🔐 CONTACTO Y ESCALAMIENTO

**Para reportar vulnerabilidades adicionales:**

- Email: security@uns-kikaku.com
- GitHub Issues: (marcar como [SECURITY])
- Responsable de Seguridad: [Nombre del Security Lead]

**Política de Divulgación Responsable:**

1. No divulgar vulnerabilidades públicamente antes de fix
2. Reportar por canal seguro (email cifrado preferible)
3. Esperar confirmación antes de publicar
4. Tiempo de respuesta: 48 horas para confirmación, 7 días para fix crítico

---

## ✅ ESTADO DE IMPLEMENTACIÓN

| Fix | Estado | Implementado Por | Fecha | Commit |
|-----|--------|-----------------|-------|--------|
| XSS-01 | ⏳ Pendiente | - | - | - |
| XSS-02 | ⏳ Pendiente | - | - | - |
| SEC-01 | ⏳ Pendiente | - | - | - |
| CSP Headers | ⏳ Pendiente | - | - | - |

**Última actualización**: 2025-11-19  
**Próxima revisión**: Después de implementación completa

---

## 📝 NOTAS FINALES

1. **Prioridad**: Implementar XSS-01 primero (severidad ALTA)
2. **Testing**: Ejecutar suite completa de tests antes de merge
3. **Rollback**: Mantener backups de archivos originales
4. **Monitoreo**: Observar logs por 48h post-deploy
5. **Documentación**: Actualizar CHANGELOG y README
6. **Comunicación**: Notificar al equipo de cambios críticos

**¡La seguridad es responsabilidad de todos!** 🔒

---

**Generado por**: @security-specialist  
**Versión del documento**: 1.0  
**Fecha**: 2025-11-19
