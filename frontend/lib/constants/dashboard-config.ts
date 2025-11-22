import {
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  Home,
  TrendingUp,
  DollarSign,
  Clock,
  FileCheck,
  Grid3x3,
  FileText,
  ShieldCheck,
  HelpCircle,
  MessageCircle,
  BookOpen,
  Calendar,
  CalendarCheck,
  BarChart3,
  Settings,
  Palette,
  Database,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface DashboardNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  description?: string;
}

export interface DashboardConfig {
  mainNav: DashboardNavItem[];
  secondaryNav: DashboardNavItem[];
}

export const dashboardConfig: DashboardConfig = {
  mainNav: [
    {
      title: 'Panel Principal',
      href: '/dashboard',
      icon: LayoutDashboard,
      description: 'Resumen ejecutivo con métricas clave en tiempo real.',
    },
    {
      title: 'Candidatos',
      href: '/candidates',
      icon: Users,
      description: 'Gestión completa de 履歴書 y pipeline de reclutamiento.',
    },
    {
      title: 'Empleados',
      href: '/employees',
      icon: UserCheck,
      description: 'Estado, asignaciones y documentación del personal activo.',
    },
    {
      title: 'Fábricas',
      href: '/factories',
      icon: Building2,
      description: 'Directorio maestro de 派遣先 con cascada empresa → planta.',
    },
    {
      title: 'Apartamentos',
      href: '/apartments',
      icon: Home,
      description: 'Gestión de 社宅 (apartamentos de empresa) y asignación de empleados.',
    },
    {
      title: 'Reportes',
      href: '/reports',
      icon: TrendingUp,
      description: 'Analítica avanzada y dashboards operativos.',
    },
    {
      title: 'Salarios',
      href: '/salary',
      icon: DollarSign,
      description: 'Control de nómina, diferenciales y costos de facturación.',
    },
    {
      title: 'Control Horario',
      href: '/timercards',
      icon: Clock,
      description: 'Gestión de タイムカード y horas trabajadas.',
    },
    {
      title: 'Payroll',
      href: '/payroll',
      icon: DollarSign,
      description: 'Sistema completo de nómina y cálculo de salarios.',
    },
    {
      title: 'Yukyus (有給)',
      href: '/yukyu-requests',
      icon: Calendar,
      description: 'Gestión de 有給休暇 (vacaciones pagadas) - solicitudes y aprobaciones.',
    },
    {
      title: 'Reportes Yukyu',
      href: '/yukyu-reports',
      icon: BarChart3,
      description: 'Estadísticas y reportes de uso de vacaciones pagadas.',
    },
    {
      title: 'Admin Yukyu',
      href: '/admin/yukyu-management',
      icon: Settings,
      description: 'Administración de yukyus - cálculo manual y mantenimiento.',
    },
    {
      title: 'Payroll Yukyu',
      href: '/payroll/yukyu-summary',
      icon: DollarSign,
      description: 'Resumen de yukyus para integración con nómina.',
    },
    {
      title: 'Historial Yukyu',
      href: '/yukyu-history',
      icon: Clock,
      description: 'Historial detallado de uso de yukyus con lógica LIFO.',
    },
    {
      title: 'Dashboard KEIRI',
      href: '/dashboard/keiri/yukyu-dashboard',
      icon: CalendarCheck,
      description: 'Panel especializado de KEITOSAN para gestión de yukyus, compliance y análisis financiero.',
    },
  ],
  secondaryNav: [
    {
      title: 'Gestión Base de Datos',
      href: '/database-management',
      icon: Database,
      description: 'Administración completa de tablas: ver, importar, exportar, editar y eliminar datos.',
    },
    {
      title: 'Solicitudes',
      href: '/requests',
      icon: FileCheck,
      description: 'Seguimiento de aprobaciones internas y requerimientos.',
    },
    {
      title: 'Temas',
      href: '/themes',
      icon: Palette,
      description: 'Galería de temas y personalizador con 22 temas predefinidos + temas personalizados ilimitados.',
    },
    {
      title: 'Design System',
      href: '/design-system',
      icon: Grid3x3,
      description: 'Guías de estilo, tokens y componentes UI estandarizados.',
    },
    {
      title: 'Ejemplos de Formularios',
      href: '/examples/forms',
      icon: BookOpen,
      description: 'Casos prácticos y mejores prácticas de UX.',
    },
    {
      title: 'Soporte',
      href: '/support',
      icon: MessageCircle,
      description: 'Mesa de ayuda, tickets y comunicación con clientes.',
    },
    {
      title: 'Centro de Ayuda',
      href: '/help',
      icon: HelpCircle,
      description: 'FAQ interactiva y recursos de capacitación.',
    },
    {
      title: 'Privacidad',
      href: '/privacy',
      icon: ShieldCheck,
      description: 'Políticas de protección de datos y cumplimiento.',
    },
    {
      title: 'Términos',
      href: '/terms',
      icon: FileText,
      description: 'Condiciones de servicio y acuerdos legales.',
    },
  ],
};
