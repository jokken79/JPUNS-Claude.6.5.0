/**
 * Breadcrumb Navigation Component
 *
 * Automatic breadcrumb generation from route path with animations.
 * Supports mobile collapse and custom labels.
 */

'use client';

import { Fragment } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface BreadcrumbNavProps {
  customLabels?: Record<string, string>;
  maxItems?: number; // Max items to show on mobile
  showHome?: boolean;
  className?: string;
}

/**
 * Default route labels (can be overridden with customLabels prop)
 */
const defaultLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  candidates: 'Candidatos',
  employees: 'Empleados',
  factories: 'Fábricas',
  timercards: 'タイムカード',
  salary: 'Nómina',
  requests: 'Solicitudes',
  settings: 'Configuración',
  new: 'Nuevo',
  edit: 'Editar',
  privacy: 'Privacidad',
  terms: 'Términos',
  support: 'Soporte',
};

/**
 * Generate breadcrumb items from pathname
 */
function generateBreadcrumbs(
  pathname: string,
  customLabels?: Record<string, string>
): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const labels = { ...defaultLabels, ...customLabels };

  const items: BreadcrumbItem[] = [];
  let currentPath = '';

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;

    // Skip numeric IDs in breadcrumb labels
    if (/^\d+$/.test(segment)) {
      // Use the previous segment's label + "Detalle"
      const prevLabel = items[items.length - 1]?.label || 'Detalle';
      items.push({
        label: 'Detalle',
        href: currentPath,
      });
    } else {
      items.push({
        label: labels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
        href: currentPath,
      });
    }
  });

  return items;
}

export function BreadcrumbNav({
  customLabels,
  maxItems = 2,
  showHome = true,
  className,
}: BreadcrumbNavProps) {
  const pathname = usePathname();
  const items = generateBreadcrumbs(pathname, customLabels);

  // On mobile, only show last N items
  const mobileItems = items.slice(-maxItems);
  const hasHiddenItems = items.length > maxItems;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-1 text-sm', className)}
    >
      <AnimatePresence mode="popLayout">
        {/* Home Icon */}
        {showHome && (
          <motion.div
            key="home"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex items-center"
          >
            <Link
              href="/dashboard"
              className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="h-4 w-4" />
              <span className="sr-only">Dashboard</span>
            </Link>
          </motion.div>
        )}

        {/* Desktop: Show all items */}
        <motion.div
          key="desktop-items"
          className="hidden md:flex items-center"
        >
          {items.map((item, index) => (
            <div key={`desktop-${item.href}-${index}`} className="flex items-center">
              {/* Separator */}
              {(showHome || index > 0) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.05 }}
                  className="inline-flex"
                >
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 mx-1" />
                </motion.div>
              )}

              {/* Breadcrumb Item */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ delay: index * 0.05 }}
                className="inline-flex"
              >
                {index === items.length - 1 ? (
                  // Current page (not a link)
                  <span className="font-medium text-foreground">
                    {item.label}
                  </span>
                ) : (
                  // Link to page
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                )}
              </motion.div>
            </div>
          ))}
        </motion.div>

        {/* Mobile: Show only last N items */}
        <motion.div
          key="mobile-items"
          className="flex md:hidden items-center"
        >
          {hasHiddenItems && (
            <motion.div
              key="mobile-ellipsis"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center"
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 mx-1" />
              <span className="text-muted-foreground">...</span>
            </motion.div>
          )}

          {mobileItems.map((item, index) => (
            <div key={`mobile-${item.href}-${index}`} className="flex items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
                className="inline-flex"
              >
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 mx-1" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ delay: index * 0.05 }}
                className="inline-flex"
              >
                {index === mobileItems.length - 1 ? (
                  <span className="font-medium text-foreground">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                )}
              </motion.div>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    </nav>
  );
}

/**
 * Compact breadcrumb with dropdown for hidden items
 */
export function CompactBreadcrumbNav(props: BreadcrumbNavProps) {
  return <BreadcrumbNav {...props} maxItems={1} />;
}
