const fs = require('fs');
const path = require('path');

const baseDir = 'D:\\UNS-ClaudeJP-5.4.1\\config\\themes';

// 1. README.md principal
const readmeContent = `# 🎨 Sistema de Themes - UNS-ClaudeJP 5.4.1

## Descripción

Sistema modular de themes que permite instalar, cambiar y hacer rollback de diseños completos sin afectar la funcionalidad de la aplicación.

## Estructura

\`\`\`
config/themes/
├── README.md                    # Este archivo
├── current-theme/               # Backup del theme actualmente activo
├── history/                     # Historial de themes instalados
├── available/                   # Themes disponibles para instalar
│   └── default-theme/           # Theme original de la app
└── scripts/                     # Scripts de gestión
    ├── ThemeInstall.bat
    ├── ThemeBackup.bat
    ├── ThemeRollback.bat
    └── ThemeList.bat
\`\`\`

## Uso Rápido

### 📦 Instalar un Theme
\`\`\`bash
cd config\\themes\\scripts
ThemeInstall.bat nombre-del-theme
\`\`\`

### 🔄 Hacer Rollback
\`\`\`bash
ThemeRollback.bat
\`\`\`

### 📋 Listar Themes
\`\`\`bash
ThemeList.bat
\`\`\`

## Documentación Completa

Ver **SISTEMA_THEMES_GUIA_COMPLETA.md** en la raíz del proyecto.

---
**Versión:** 1.0.0 | **Última actualización:** 2025-11-12
`;

// 2. config.json del default-theme
const defaultConfigContent = `{
  "name": "default-theme",
  "version": "1.0.0",
  "displayName": "UNS ClaudeJP Default Theme",
  "description": "Theme original de la aplicación UNS-ClaudeJP 5.4.1",
  "author": "UNS Development Team",
  "created": "2025-11-12",
  "lastModified": "2025-11-12",
  "baseTheme": "original",
  "compatibility": "5.4.x",
  
  "dependencies": {},
  
  "features": {
    "darkMode": true,
    "responsive": true,
    "animations": true,
    "customFonts": false
  },
  
  "colors": {
    "primary": "hsl(262.1 83.3% 57.8%)",
    "secondary": "hsl(220 14.3% 95.9%)",
    "background": {
      "light": "hsl(0 0% 100%)",
      "dark": "hsl(224 71.4% 4.1%)"
    }
  },
  
  "typography": {
    "fontFamily": "Inter, system-ui, sans-serif",
    "headingWeight": 600,
    "bodyWeight": 400
  },
  
  "components": [
    "Button",
    "Card",
    "Table",
    "Form",
    "Sidebar",
    "Header"
  ],
  
  "modifiedFiles": []
}
`;

// 3. README.md del default-theme
const defaultThemeReadme = `# Default Theme

Theme original de UNS-ClaudeJP 5.4.1

## Características

- ✅ Modo claro/oscuro
- ✅ Responsive design
- ✅ Componentes Shadcn/ui
- ✅ Tailwind CSS
- ✅ Radix UI primitives

## Preview

![Default Theme Preview](preview.png)

## Instalación

\`\`\`bash
cd config\\themes\\scripts
ThemeInstall.bat default-theme
\`\`\`

## Componentes

- Button (variants: default, destructive, outline, secondary, ghost, link)
- Card (con header, content, footer)
- Table (con sorting y filtering)
- Form (con validación Zod)
- Sidebar (collapsible)
- Header (con usuario y notificaciones)

---
**Versión:** 1.0.0
`;

// Escribir archivos
console.log('\n📝 Creando archivos de configuración...\n');

const files = [
  {
    path: path.join(baseDir, 'README.md'),
    content: readmeContent,
    name: 'README principal'
  },
  {
    path: path.join(baseDir, 'available', 'default-theme', 'config.json'),
    content: defaultConfigContent,
    name: 'config.json del default-theme'
  },
  {
    path: path.join(baseDir, 'available', 'default-theme', 'README.md'),
    content: defaultThemeReadme,
    name: 'README del default-theme'
  }
];

files.forEach(file => {
  try {
    fs.writeFileSync(file.path, file.content, 'utf8');
    console.log(`✅ ${file.name}`);
  } catch (error) {
    console.log(`❌ Error creando ${file.name}:`, error.message);
  }
});

console.log('\n✨ Archivos creados exitosamente!');
