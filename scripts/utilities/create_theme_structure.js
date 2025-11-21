const fs = require('fs');
const path = require('path');

// Crear estructura de directorios para themes
const baseDir = 'D:\\UNS-ClaudeJP-5.4.1\\config\\themes';

const dirs = [
  '',
  'available',
  'available\\default-theme',
  'available\\default-theme\\components',
  'available\\default-theme\\app',
  'available\\default-theme\\styles',
  'current-theme',
  'history',
  'scripts'
];

console.log('🎨 Creando estructura de themes...\n');

dirs.forEach(dir => {
  const fullPath = path.join(baseDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ Creado: ${dir || 'themes/'}`);
  } else {
    console.log(`⏭️  Ya existe: ${dir || 'themes/'}`);
  }
});

console.log('\n✨ Estructura de themes creada exitosamente!');
