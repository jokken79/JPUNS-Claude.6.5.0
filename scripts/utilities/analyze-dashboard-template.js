/**
 * Script para analizar y capturar screenshots del dashboard template
 * URL: https://dashboard-template-1-ivory.vercel.app/en/dashboard
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function analyzeDashboard() {
  console.log('🚀 Iniciando análisis del dashboard template...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Navegar al dashboard
    console.log('📍 Navegando a: https://dashboard-template-1-ivory.vercel.app/en/dashboard');
    await page.goto('https://dashboard-template-1-ivory.vercel.app/en/dashboard', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('✅ Página cargada\n');

    // Esperar que el contenido cargue
    await page.waitForTimeout(2000);

    // Crear directorio para screenshots
    const screenshotsDir = path.join(__dirname, 'dashboard-screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir);
    }

    // 1. Screenshot completo del dashboard
    console.log('📸 Capturando screenshot completo...');
    await page.screenshot({
      path: path.join(screenshotsDir, '01-dashboard-full.png'),
      fullPage: true
    });
    console.log('   ✅ Guardado: 01-dashboard-full.png');

    // 2. Screenshot del viewport (sin scroll)
    console.log('📸 Capturando vista principal...');
    await page.screenshot({
      path: path.join(screenshotsDir, '02-dashboard-viewport.png'),
      fullPage: false
    });
    console.log('   ✅ Guardado: 02-dashboard-viewport.png');

    // 3. Extraer información de la estructura
    console.log('\n🔍 Analizando estructura del DOM...\n');
    
    const analysis = await page.evaluate(() => {
      const results = {
        title: document.title,
        colors: [],
        fonts: [],
        components: {
          sidebar: null,
          navbar: null,
          cards: [],
          charts: [],
          tables: []
        }
      };

      // Detectar sidebar
      const sidebar = document.querySelector('[class*="sidebar"], aside, nav[class*="side"]');
      if (sidebar) {
        const sidebarStyles = window.getComputedStyle(sidebar);
        results.components.sidebar = {
          width: sidebarStyles.width,
          backgroundColor: sidebarStyles.backgroundColor,
          position: sidebarStyles.position,
          found: true
        };
      }

      // Detectar navbar/header
      const navbar = document.querySelector('header, [class*="navbar"], [class*="topbar"]');
      if (navbar) {
        const navbarStyles = window.getComputedStyle(navbar);
        results.components.navbar = {
          height: navbarStyles.height,
          backgroundColor: navbarStyles.backgroundColor,
          position: navbarStyles.position,
          found: true
        };
      }

      // Detectar cards
      const cards = document.querySelectorAll('[class*="card"], [class*="metric"], article');
      results.components.cards = Array.from(cards).slice(0, 10).map((card, idx) => {
        const styles = window.getComputedStyle(card);
        return {
          index: idx,
          width: styles.width,
          height: styles.height,
          backgroundColor: styles.backgroundColor,
          borderRadius: styles.borderRadius,
          boxShadow: styles.boxShadow,
          padding: styles.padding
        };
      });

      // Detectar charts (canvas, svg)
      const charts = document.querySelectorAll('canvas, svg[class*="chart"], [class*="recharts"]');
      results.components.charts = Array.from(charts).map((chart, idx) => ({
        index: idx,
        type: chart.tagName.toLowerCase(),
        width: chart.width || chart.getAttribute('width'),
        height: chart.height || chart.getAttribute('height')
      }));

      // Detectar tablas
      const tables = document.querySelectorAll('table, [role="table"]');
      results.components.tables = Array.from(tables).map((table, idx) => ({
        index: idx,
        rows: table.querySelectorAll('tr, [role="row"]').length,
        columns: table.querySelectorAll('th, [role="columnheader"]').length
      }));

      // Extraer colores principales
      const allElements = document.querySelectorAll('*');
      const colorSet = new Set();
      
      Array.from(allElements).slice(0, 100).forEach(el => {
        const styles = window.getComputedStyle(el);
        if (styles.backgroundColor && styles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          colorSet.add(styles.backgroundColor);
        }
        if (styles.color && styles.color !== 'rgb(0, 0, 0)') {
          colorSet.add(styles.color);
        }
      });

      results.colors = Array.from(colorSet).slice(0, 20);

      // Extraer fuentes
      const fontSet = new Set();
      Array.from(allElements).slice(0, 50).forEach(el => {
        const styles = window.getComputedStyle(el);
        if (styles.fontFamily) {
          fontSet.add(styles.fontFamily);
        }
      });

      results.fonts = Array.from(fontSet).slice(0, 10);

      return results;
    });

    // Guardar análisis en JSON
    const analysisPath = path.join(screenshotsDir, 'analysis.json');
    fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));
    console.log('   ✅ Análisis guardado: analysis.json\n');

    // Mostrar resumen
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 RESUMEN DEL ANÁLISIS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log(`📄 Título: ${analysis.title}`);
    console.log(`\n🎨 Colores principales detectados: ${analysis.colors.length}`);
    analysis.colors.slice(0, 5).forEach(color => console.log(`   - ${color}`));
    
    console.log(`\n✒️  Fuentes detectadas: ${analysis.fonts.length}`);
    analysis.fonts.slice(0, 3).forEach(font => console.log(`   - ${font}`));
    
    console.log(`\n🧩 Componentes encontrados:`);
    console.log(`   - Sidebar: ${analysis.components.sidebar ? '✅ Detectado' : '❌ No encontrado'}`);
    console.log(`   - Navbar: ${analysis.components.navbar ? '✅ Detectado' : '❌ No encontrado'}`);
    console.log(`   - Cards: ${analysis.components.cards.length} encontradas`);
    console.log(`   - Charts: ${analysis.components.charts.length} encontrados`);
    console.log(`   - Tables: ${analysis.components.tables.length} encontradas`);

    if (analysis.components.sidebar) {
      console.log(`\n📐 Sidebar:`);
      console.log(`   - Ancho: ${analysis.components.sidebar.width}`);
      console.log(`   - Color: ${analysis.components.sidebar.backgroundColor}`);
    }

    if (analysis.components.navbar) {
      console.log(`\n📐 Navbar:`);
      console.log(`   - Alto: ${analysis.components.navbar.height}`);
      console.log(`   - Color: ${analysis.components.navbar.backgroundColor}`);
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ ANÁLISIS COMPLETADO');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\n📁 Archivos guardados en: ${screenshotsDir}/`);
    console.log('   - 01-dashboard-full.png (página completa)');
    console.log('   - 02-dashboard-viewport.png (vista principal)');
    console.log('   - analysis.json (datos estructurados)\n');

  } catch (error) {
    console.error('❌ Error durante el análisis:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Ejecutar
analyzeDashboard()
  .then(() => {
    console.log('🎉 Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
