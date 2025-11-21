'use client';

import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { NavigationProvider } from '@/contexts/navigation-context';
import { SimpleNavigationProgress } from '@/components/navigation-progress';
import { PageTransition } from '@/components/PageTransition';
import { BreadcrumbNav } from '@/components/breadcrumb-nav';
import { AnimatedLink } from '@/components/animated-link';
import { VisibilityGuard } from '@/components/visibility-guard';
import { useLayoutStore } from '@/stores/layout-store';
import { useEffect, useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  let contentWidth = 'auto';
  let paddingMultiplier = 1;

  try {
    if (mounted) {
      const { contentWidth: cw, paddingMultiplier: pm } = useLayoutStore.getState();
      contentWidth = cw;
      paddingMultiplier = pm;
    }
  } catch (error) {
    console.debug('[DashboardLayout] Store access failed:', error);
  }

  const containerClassMap = {
    auto: 'w-full max-w-7xl',
    full: 'w-full',
    compact: 'w-full max-w-4xl',
  } as const;

  const containerClass = containerClassMap[contentWidth as keyof typeof containerClassMap];

  const paddingStyle = {
    padding: `${1.5 * paddingMultiplier}rem`,
  };

  return (
    <NavigationProvider>
      <SimpleNavigationProgress />

      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />

          <main className="flex-1 overflow-y-auto">
            <VisibilityGuard>
              <div className={`${containerClass} mx-auto space-y-6`} style={paddingStyle}>
                <BreadcrumbNav showHome={true} maxItems={3} />

                <PageTransition variant="fade" duration={0.3}>
                  {children}
                </PageTransition>
              </div>
            </VisibilityGuard>
          </main>

          <footer className="border-t border-border bg-background/95 backdrop-blur-sm px-6 py-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <p>© 2025 UNS HRApp - Sistema de RRHH para agencias japonesas</p>
              <div className="flex items-center gap-4">
                <AnimatedLink
                  href="/dashboard/privacy"
                  className="hover:text-foreground dark:hover:text-foreground/90 transition-colors"
                  prefetchOnHover={true}
                >
                  Privacidad
                </AnimatedLink>
                <AnimatedLink
                  href="/dashboard/terms"
                  className="hover:text-foreground dark:hover:text-foreground/90 transition-colors"
                  prefetchOnHover={true}
                >
                  Términos
                </AnimatedLink>
                <AnimatedLink
                  href="/dashboard/support"
                  className="hover:text-foreground dark:hover:text-foreground/90 transition-colors"
                  prefetchOnHover={true}
                >
                  Soporte
                </AnimatedLink>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </NavigationProvider>
  );
}
