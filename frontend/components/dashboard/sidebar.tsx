'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { dashboardConfig } from '@/lib/constants/dashboard-config';
import { ChevronRight } from 'lucide-react';
import { useSidebar } from '@/lib/hooks/use-sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInLeft, staggerFast, shouldReduceMotion } from '@/lib/animations';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useTheme } from 'next-themes';

export function Sidebar() {
  const pathname = usePathname();
  const prevPathnameRef = useRef<string | null>(null);
  const { collapsed, toggle } = useSidebar();
  const reducedMotion = shouldReduceMotion();
  const { user } = useAuthStore();
  const { theme: activeTheme } = useTheme();
  const [renderKey, setRenderKey] = useState(0);

  // Sincronizar cuando la ruta cambia o el tema cambia para limpiar estados de animación
  useEffect(() => {
    if (prevPathnameRef.current && prevPathnameRef.current !== pathname) {
      // Force re-render de los items para resetear estados de animación
      setRenderKey(prev => prev + 1);
    }
    prevPathnameRef.current = pathname;
  }, [pathname, activeTheme]);

  // Dynamic colors using CSS variables - automatically updates with theme changes
  // Logo uses primary color with contrasting foreground text
  const logoGradient = 'linear-gradient(to bottom right, hsl(var(--primary)), hsl(var(--primary)))';
  const logoTextColor = 'hsl(var(--primary-foreground))';

  return (
    <motion.aside
      className={cn(
        'h-screen flex-shrink-0 bg-background border-r border-border',
        'transition-all duration-300 ease-in-out'
      )}
      animate={{
        width: collapsed ? '4rem' : '16rem',
      }}
      transition={
        !reducedMotion
          ? { type: 'spring', stiffness: 300, damping: 30 }
          : { duration: 0.3 }
      }
    >
      {/* Header del Sidebar */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border bg-background/70 backdrop-blur-sm">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              key="logo"
              initial={!reducedMotion ? { opacity: 0, x: -20 } : undefined}
              animate={!reducedMotion ? { opacity: 1, x: 0 } : undefined}
              exit={!reducedMotion ? { opacity: 0, x: -20 } : undefined}
              transition={!reducedMotion ? { duration: 0.2 } : undefined}
            >
              <Link href="/dashboard" className="flex items-center gap-2 group">
                <motion.div
                  className="h-9 w-9 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow bg-background p-1"
                  whileHover={!reducedMotion ? { rotate: [0, -10, 10, 0] } : undefined}
                  transition={!reducedMotion ? { duration: 0.5 } : undefined}
                >
                  <img
                    src="/logo-uns-corto-negro.png"
                    alt="UNS Logo"
                    className="h-full w-full object-contain"
                  />
                </motion.div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">UNS-JPApp</span>
                  <span className="text-xs text-muted-foreground">v5.2</span>
                </div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          animate={{ x: collapsed ? 0 : undefined }}
          className={cn(collapsed && 'mx-auto')}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="h-8 w-8 hover:bg-accent hover:text-accent-foreground"
          >
            <motion.div
              animate={{ rotate: collapsed ? 0 : 180 }}
              transition={!reducedMotion ? { duration: 0.3 } : undefined}
            >
              <ChevronRight className="h-4 w-4" />
            </motion.div>
          </Button>
        </motion.div>
      </div>


      {/* Navegación */}
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <nav className="flex flex-col gap-3 p-3">
          {/* Navegación Principal */}
          <div className="space-y-1">
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.h4
                  key="main-nav-title"
                  className="px-4 mb-2 text-[11px] font-semibold tracking-[0.2em] text-muted-foreground/70 uppercase"
                  initial={!reducedMotion ? { opacity: 0, x: -20 } : undefined}
                  animate={!reducedMotion ? { opacity: 1, x: 0 } : undefined}
                  exit={!reducedMotion ? { opacity: 0, x: -20 } : undefined}
                  transition={!reducedMotion ? { duration: 0.2 } : undefined}
                >
                  Principal
                </motion.h4>
              )}
            </AnimatePresence>
            {dashboardConfig.mainNav.map((item, index) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

              return (
                <motion.div
                  key={`main-nav-${item.href}-${renderKey}`}
                  initial={!reducedMotion ? { opacity: 0, x: -20 } : undefined}
                  animate={!reducedMotion ? { opacity: 1, x: 0 } : undefined}
                  transition={!reducedMotion ? { delay: index * 0.05 } : undefined}
                >
                  <Link href={item.href}>
                    <motion.div
                      key={`motion-wrapper-${item.href}`}
                      whileHover={!reducedMotion && !isActive ? { scale: 1.02, x: 4 } : undefined}
                      whileTap={!reducedMotion && !isActive ? { scale: 0.98 } : undefined}
                      transition={!reducedMotion ? { type: 'spring', stiffness: 400, damping: 25 } : undefined}
                    >
                      <Button
                        variant="ghost"
                        className={cn(
                          'w-full justify-start gap-3 h-11 rounded-xl transition-all relative overflow-hidden text-foreground hover:bg-accent hover:text-accent-foreground',
                          'border border-transparent backdrop-blur-sm',
                          collapsed && 'justify-center px-2 rounded-full',
                          isActive &&
                            'shadow-md ring-1 hover:!shadow-lg hover:text-primary hover:shadow-primary/20 bg-primary/15 text-primary border-primary/30 dark:bg-primary/25 dark:border-primary/40'
                        )}
                        title={collapsed ? item.title : undefined}
                      >
                        <motion.div
                          key={`icon-${item.href}`}
                          animate={!reducedMotion && isActive ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                          transition={!reducedMotion && isActive ? { duration: 0.3 } : undefined}
                        >
                          <Icon
                            className="h-5 w-5 transition-colors"
                          />
                        </motion.div>
                        <AnimatePresence mode="wait">
                          {!collapsed && (
                            <motion.span
                              key="nav-text"
                              className="text-sm truncate"
                              initial={!reducedMotion ? { opacity: 0, width: 0 } : undefined}
                              animate={!reducedMotion ? { opacity: 1, width: 'auto' } : undefined}
                              exit={!reducedMotion ? { opacity: 0, width: 0 } : undefined}
                              transition={!reducedMotion ? { duration: 0.2 } : undefined}
                            >
                              {item.title}
                            </motion.span>
                          )}
                        </AnimatePresence>

                        {/* Active indicator line - layoutId debe ser único por item */}
                        {isActive && (
                          <motion.div
                            className="absolute right-1 top-1 bottom-1 w-1.5 rounded-full bg-primary"
                            layoutId={`activeIndicator-main-${item.href}`}
                            transition={!reducedMotion ? { type: 'spring', stiffness: 300, damping: 30 } : undefined}
                          />
                        )}
                      </Button>
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <Separator className="my-3 bg-border/60" />

          {/* Navegación Secundaria */}
          <div className="space-y-1">
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.h4
                  key="secondary-nav-title"
                  className="px-4 mb-2 text-[11px] font-semibold tracking-[0.2em] text-muted-foreground/70 uppercase"
                  initial={!reducedMotion ? { opacity: 0, x: -20 } : undefined}
                  animate={!reducedMotion ? { opacity: 1, x: 0 } : undefined}
                  exit={!reducedMotion ? { opacity: 0, x: -20 } : undefined}
                  transition={!reducedMotion ? { duration: 0.2 } : undefined}
                >
                  Otros
                </motion.h4>
              )}
            </AnimatePresence>
            {dashboardConfig.secondaryNav.map((item, index) => {
              const Icon = item.icon;
              // Estandarizar con la misma lógica que mainNav
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

              return (
                <motion.div
                  key={`secondary-nav-${item.href}-${renderKey}`}
                  initial={!reducedMotion ? { opacity: 0, x: -20 } : undefined}
                  animate={!reducedMotion ? { opacity: 1, x: 0 } : undefined}
                  transition={!reducedMotion ? { delay: index * 0.05 } : undefined}
                >
                  <Link href={item.href}>
                    <motion.div
                      key={`motion-wrapper-secondary-${item.href}`}
                      whileHover={!reducedMotion && !isActive ? { scale: 1.02, x: 4 } : undefined}
                      whileTap={!reducedMotion && !isActive ? { scale: 0.98 } : undefined}
                      transition={!reducedMotion ? { type: 'spring', stiffness: 400, damping: 25 } : undefined}
                    >
                      <Button
                        variant="ghost"
                        className={cn(
                          'w-full justify-start gap-3 h-11 rounded-xl transition-all relative overflow-hidden hover:bg-accent hover:text-accent-foreground',
                          'border border-transparent backdrop-blur-sm',
                          collapsed && 'justify-center px-2 rounded-full',
                          isActive &&
                            'shadow-md ring-1 hover:!shadow-lg hover:text-primary hover:shadow-primary/20 bg-primary/15 text-primary border-primary/30 dark:bg-primary/25 dark:border-primary/40'
                        )}
                        title={collapsed ? item.title : undefined}
                      >
                        <motion.div
                          key={`icon-secondary-${item.href}`}
                          animate={!reducedMotion && isActive ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                          transition={!reducedMotion && isActive ? { duration: 0.3 } : undefined}
                        >
                          <Icon
                            className="h-5 w-5 transition-colors"
                          />
                        </motion.div>
                        <AnimatePresence mode="wait">
                          {!collapsed && (
                            <motion.span
                              key="nav-text"
                              className="text-sm truncate"
                              initial={!reducedMotion ? { opacity: 0, width: 0 } : undefined}
                              animate={!reducedMotion ? { opacity: 1, width: 'auto' } : undefined}
                              exit={!reducedMotion ? { opacity: 0, width: 0 } : undefined}
                              transition={!reducedMotion ? { duration: 0.2 } : undefined}
                            >
                              {item.title}
                            </motion.span>
                          )}
                        </AnimatePresence>

                        {/* Active indicator line - layoutId debe ser único por item */}
                        {isActive && (
                          <motion.div
                            className="absolute right-1 top-1 bottom-1 w-1.5 rounded-full bg-primary"
                            layoutId={`activeIndicator-secondary-${item.href}`}
                            transition={!reducedMotion ? { type: 'spring', stiffness: 300, damping: 30 } : undefined}
                          />
                        )}
                      </Button>
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Footer del Sidebar */}
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                key="sidebar-footer"
                className="mt-auto pt-4 pb-2"
                initial={!reducedMotion ? { opacity: 0, y: 20 } : undefined}
                animate={!reducedMotion ? { opacity: 1, y: 0 } : undefined}
                exit={!reducedMotion ? { opacity: 0, y: 20 } : undefined}
                transition={!reducedMotion ? { duration: 0.2 } : undefined}
              >
                <div className="px-3 py-2 rounded-xl bg-background/60 dark:bg-background/80 shadow-sm backdrop-blur-sm border border-border/50">
                  <p className="text-xs text-muted-foreground">
                    Sistema de RRHH para agencias japonesas
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </ScrollArea>
    </motion.aside>
  );
}
