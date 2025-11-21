// tools/consolidate-md.ts
// Ejecuta: npx ts-node tools/consolidate-md.ts
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

type Bucket =
  | 'instalacion'
  | 'upgrade'
  | 'reinstalar'
  | 'db'
  | 'troubleshooting'
  | 'ocr'
  | 'theming'
  | 'agentes'
  | 'scripts'
  | 'reportes'
  | 'otros';

const ROOT = process.cwd();

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function bucketFor(p: string, content: string): Bucket {
  const s = (p + ' ' + content).toLowerCase();
  if (s.includes('instalacion') || s.includes('quick start')) return 'instalacion';
  if (s.includes('upgrade') || s.includes('actualiza')) return 'upgrade';
  if (s.includes('reinstalar') || s.includes('post_reinstall')) return 'reinstalar';
  if (s.includes('alembic') || s.includes('database') || s.includes('migracion')) return 'db';
  if (s.includes('troubleshooting') || s.includes('error')) return 'troubleshooting';
  if (s.includes('ocr')) return 'ocr';
  if (s.includes('theme') || s.includes('ui')) return 'theming';
  if (s.includes('agent') || s.includes('claude') || s.includes('workflow')) return 'agentes';
  if (s.includes('script') || s.includes('bat') || s.includes('powershell')) return 'scripts';
  if (s.includes('auditoria') || s.match(/\b202\d-\d{2}-\d{2}\b/)) return 'reportes';
  return 'otros';
}

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function mdHeader(title: string, sources: string[]): string {
  const list = sources.map(s => `- ${s}`).join('\n');
  return `# ${title}

> Este documento fue consolidado automáticamente desde:
${list ? list : '- (fuentes varias)'}
\n`;
}

function uniqParagraphs(text: string): string {
  const seen = new Set<string>();
  const paras = text.split(/\n{2,}/g);
  const out: string[] = [];
  for (const para of paras) {
    const hash = crypto.createHash('sha1').update(para.trim()).digest('hex');
    if (!seen.has(hash)) {
      seen.add(hash);
      out.push(para.trim());
    }
  }
  return out.join('\n\n').trim() + '\n';
}

(async () => {
  const files = walk(ROOT)
    .filter(f => f.toLowerCase().endsWith('.md') || f.toLowerCase().endsWith('.txt'));

  const buckets: Record<Bucket, { sources: string[]; text: string[] }> = {
    instalacion: { sources: [], text: [] },
    upgrade: { sources: [], text: [] },
    reinstalar: { sources: [], text: [] },
    db: { sources: [], text: [] },
    troubleshooting: { sources: [], text: [] },
    ocr: { sources: [], text: [] },
    theming: { sources: [], text: [] },
    agentes: { sources: [], text: [] },
    scripts: { sources: [], text: [] },
    reportes: { sources: [], text: [] },
    otros: { sources: [], text: [] },
  };

  for (const file of files) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf-8');
    const b = bucketFor(rel, content);
    // evita mezclar README.md raíz en "otros"
    if (rel === 'README.md') continue;
    buckets[b].sources.push(rel);
    buckets[b].text.push(`\n\n<!-- Fuente: ${rel} -->\n\n${content.trim()}\n`);
  }

  // rutas destino
  const OUT = path.join(ROOT, 'docs');
  ensureDir(OUT);
  ensureDir(path.join(OUT, '01-instalacion'));
  ensureDir(path.join(OUT, '02-configuracion'));
  ensureDir(path.join(OUT, '03-uso'));
  ensureDir(path.join(OUT, '04-troubleshooting'));
  ensureDir(path.join(OUT, '05-devops'));
  ensureDir(path.join(OUT, '06-agentes'));
  ensureDir(path.join(OUT, '97-reportes'));
  ensureDir(path.join(OUT, '99-archive'));

  const writes: Array<[string, string, string[]]> = [
    [path.join(OUT, '01-instalacion', 'instalacion_rapida.md'), 'Instalación Rápida', buckets.instalacion.sources],
    [path.join(OUT, '01-instalacion', 'upgrade_5.x.md'), 'Upgrade 5.x', buckets.upgrade.sources],
    [path.join(OUT, '04-troubleshooting', 'post_reinstalacion.md'), 'Verificación Post Reinstalación', buckets.reinstalar.sources],
    [path.join(OUT, '02-configuracion', 'base_datos.md'), 'Base de Datos y Migraciones', buckets.db.sources],
    [path.join(OUT, '04-troubleshooting', 'guia.md'), 'Guía de Troubleshooting', buckets.troubleshooting.sources],
    [path.join(OUT, '03-uso', 'ocr_multi_documento.md'), 'OCR Multidocumento', buckets.ocr.sources],
    [path.join(OUT, '03-uso', 'temas_y_ui.md'), 'Temas (Theme) y UI', buckets.theming.sources],
    [path.join(OUT, '06-agentes', 'orquestador.md'), 'Orquestador y Agentes', buckets.agentes.sources],
    [path.join(OUT, '05-devops', 'scripts_utiles.md'), 'Scripts Útiles', buckets.scripts.sources],
  ];

  for (const [dest, title, sources] of writes) {
    const key = dest.includes('instalacion_rapida') ? 'instalacion'
      : dest.includes('upgrade_5.x') ? 'upgrade'
      : dest.includes('post_reinstalacion') ? 'reinstalar'
      : dest.includes('base_datos') ? 'db'
      : dest.includes('troubleshooting') && !dest.includes('post_reinstalacion') ? 'troubleshooting'
      : dest.includes('ocr_multi_documento') ? 'ocr'
      : dest.includes('temas_y_ui') ? 'theming'
      : dest.includes('orquestador') ? 'agentes'
      : dest.includes('scripts_utiles') ? 'scripts'
      : 'otros';

    const texts = buckets[key as Bucket].text.join('\n\n');
    const body = uniqParagraphs(texts);
    const header = mdHeader(title, sources);
    fs.writeFileSync(dest, header + body, 'utf-8');
  }

  // docs/README.md índice maestro (simple)
  const index = `# Documentación – UNS-ClaudeJP-5.0

- **00 – Overview**
  - [Arquitectura](./00-overview/arquitectura.md) *(pendiente de completar)*
  - [Componentes](./00-overview/componentes.md) *(pendiente de completar)*
  - [Roles y permisos](./00-overview/roles-permisos.md) *(pendiente de completar)*

- **01 – Instalación**
  - [Instalación Rápida](./01-instalacion/instalacion_rapida.md)
  - [Upgrade 5.x](./01-instalacion/upgrade_5.x.md)

- **02 – Configuración**
  - [Base de Datos y Migraciones](./02-configuracion/base_datos.md)
  - [Backup/Restore](./02-configuracion/backup_restore.md) *(pendiente de completar)*

- **03 – Uso**
  - [Onboarding de Candidatos (Fotos/OCR)](./03-uso/onboarding_candidatos.md) *(pendiente de completar)*
  - [OCR Multidocumento](./03-uso/ocr_multi_documento.md)
  - [Temas y UI](./03-uso/temas_y_ui.md)

- **04 – Troubleshooting**
  - [Guía](./04-troubleshooting/guia.md)
  - [Post Reinstalación](./04-troubleshooting/post_reinstalacion.md)

- **05 – DevOps**
  - [Scripts Útiles](./05-devops/scripts_utiles.md)
  - [Herramientas de Verificación](./05-devops/herramientas_verificacion.md) *(pendiente de completar)*

- **06 – Agentes**
  - [Orquestador y Agentes](./06-agentes/orquestador.md)
  - [Workflows](./06-agentes/workflows.md) *(pendiente de completar)*

- **97 – Reportes**
  - Mantenemos reportes por fecha aquí.

- **99 – Archive**
  - Todo lo histórico/legacy mudado aquí.
`;
  fs.writeFileSync(path.join(OUT, 'README.md'), index, 'utf-8');

  console.log('Consolidación inicial completada. Revisa docs/.');
})();
