'use client';

import { Search, Bell, LogOut, User, Settings, Menu, LayoutDashboard, Users, Building2, Clock, DollarSign, FileText, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LayoutControls } from '@/components/dashboard/layout-controls';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import Link from 'next/link';
import { authService } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerFast, fadeInDown, shouldReduceMotion } from '@/lib/animations';
import { usePagePermission } from '@/hooks/use-page-permission';
import { SystemStatusIndicator } from '@/components/dashboard/system-status-indicator';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const user = useAuthStore((state) => state.user);
  const reducedMotion = shouldReduceMotion();

  // Check if user is admin (temporary check - will be expanded for role-based system)
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.username === 'admin';

  // Check permissions for each navigation item
  const hasCandidatesAccess = usePagePermission('candidates');
  const hasEmployeesAccess = usePagePermission('employees');
  const hasFactoriesAccess = usePagePermission('factories');
  const hasTimercardsAccess = usePagePermission('timer_cards');
  const hasSalaryAccess = usePagePermission('salary');
  const hasRequestsAccess = usePagePermission('requests');
  const hasControlPanelAccess = usePagePermission('control_panel');

  const handleLogout = () => {
    authService.logout();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Notificaciones de ejemplo
  const notifications = [
    {
      id: 1,
      title: 'Visa próxima a vencer',
      description: '山田太郎 - Expira en 15 días',
      time: 'Hace 5 min',
      unread: true,
    },
    {
      id: 2,
      title: 'Nueva solicitud',
      description: '田中花子 solicitó vacaciones',
      time: 'Hace 1 hora',
      unread: true,
    },
    {
      id: 3,
      title: 'Nómina procesada',
      description: 'Nómina de marzo completada',
      time: 'Hace 2 horas',
      unread: false,
    },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  const allNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permissionKey: 'dashboard' },
    { href: '/candidates', label: 'Candidatos', icon: Users, permissionKey: 'candidates' },
    { href: '/employees', label: 'Empleados', icon: Users, permissionKey: 'employees' },
    { href: '/factories', label: 'Fábricas', icon: Building2, permissionKey: 'factories' },
    { href: '/timercards', label: 'Asistencia', icon: Clock, permissionKey: 'timer_cards' },
    { href: '/salary', label: 'Nómina', icon: DollarSign, permissionKey: 'salary' },
    { href: '/requests', label: 'Solicitudes', icon: FileText, permissionKey: 'requests' },
    { href: '/admin/control-panel', label: 'Panel Control', icon: Shield, permissionKey: 'control_panel' },
  ];

  // Filter navigation items based on permissions
  const navItems = allNavItems.filter(item => {
    // Dashboard is always visible if logged in
    if (item.permissionKey === 'dashboard') {
      return true;
    }

    // Check permission based on the item
    const permissionMap: Record<string, { hasPermission: boolean | null; loading: boolean }> = {
      'candidates': hasCandidatesAccess,
      'employees': hasEmployeesAccess,
      'factories': hasFactoriesAccess,
      'timer_cards': hasTimercardsAccess,
      'salary': hasSalaryAccess,
      'requests': hasRequestsAccess,
      'control_panel': hasControlPanelAccess,
    };

    const permission = permissionMap[item.permissionKey];

    // If permission check hasn't finished loading, show the item (will hide later if no permission)
    if (permission?.loading) {
      return true;
    }

    // If user is admin in development, grant all permissions
    if (process.env.NODE_ENV === 'development' && isAdmin) {
      return true;
    }

    // Filter based on actual permission
    return permission?.hasPermission !== false;
  });

  return (
    <motion.header
      className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      initial={!reducedMotion ? { y: -100 } : undefined}
      animate={!reducedMotion ? { y: 0 } : undefined}
      transition={!reducedMotion ? { type: 'spring', stiffness: 300, damping: 30 } : undefined}
    >
      <div className="flex h-16 items-center gap-4 px-6">
        {/* MENÚ DE NAVEGACIÓN TEMPORAL */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="border-border bg-background hover:bg-accent hover:text-accent-foreground"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel className="font-bold">Navegación Principal</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {navItems
              .filter(item => {
                // Filter Panel Control to show only to admins
                if (item.href === '/admin/control-panel') {
                  return isAdmin;
                }
                return true;
              })
              .map((item, index) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <motion.div
                    key={item.href}
                    initial={!reducedMotion ? { opacity: 0, x: -20 } : undefined}
                    animate={!reducedMotion ? { opacity: 1, x: 0 } : undefined}
                    transition={!reducedMotion ? { delay: index * 0.05 } : undefined}
                  >
                    <DropdownMenuItem asChild>
                      <Link href={item.href} className={cn(
                        "flex items-center gap-3 w-full",
                        isActive && "bg-primary/10 font-semibold"
                      )}>
                        <Icon className={cn(
                          "h-5 w-5",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )} />
                        <span className="flex-1">{item.label}</span>
                        {item.href === '/admin/control-panel' && (
                          <Shield className="h-4 w-4 text-warning" />
                        )}
                      </Link>
                    </DropdownMenuItem>
                  </motion.div>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
        {/* Barra de Búsqueda */}
        <motion.form
          onSubmit={handleSearch}
          className="flex-1 max-w-md"
          initial={!reducedMotion ? { opacity: 0, scale: 0.95 } : undefined}
          animate={!reducedMotion ? { opacity: 1, scale: 1 } : undefined}
          transition={!reducedMotion ? { delay: 0.1 } : undefined}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar empleados, fábricas, documentos..."
              className="pl-10 w-full bg-muted/50 border-none focus-visible:ring-1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </motion.form>

        {/* System Status Indicator */}
        <SystemStatusIndicator className="hidden md:flex" />

        {/* Acciones del Header */}
        <div className="flex items-center gap-2">
          {/* Theme Switcher */}
          <ThemeSwitcher />

          {/* Controles de Layout */}
          <LayoutControls />

          {/* Notificaciones */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 relative hover:bg-accent hover:text-accent-foreground">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notificaciones</span>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {unreadCount} nuevas
                  </Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={!reducedMotion ? { opacity: 0, x: -20 } : undefined}
                    animate={!reducedMotion ? { opacity: 1, x: 0 } : undefined}
                    transition={!reducedMotion ? { delay: index * 0.05 } : undefined}
                  >
                    <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                      <div className="flex items-center gap-2 w-full">
                        <motion.div
                          className={cn(
                            'h-2 w-2 rounded-full',
                            notification.unread ? 'bg-primary' : 'bg-transparent'
                          )}
                          animate={
                            !reducedMotion && notification.unread
                              ? { scale: [1, 1.2, 1] }
                              : undefined
                          }
                          transition={
                            !reducedMotion && notification.unread
                              ? { duration: 2, repeat: Infinity }
                              : undefined
                          }
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium leading-none">
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.description}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  </motion.div>
                ))}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="justify-center text-sm text-primary cursor-pointer">
                Ver todas las notificaciones
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Menú de Usuario */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full hover:bg-accent hover:text-accent-foreground"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src="/avatars/admin.png" alt="Admin" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    AD
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.username ?? 'Admin'}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email ?? 'admin@uns-hrapp.com'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Mi Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={handleLogout}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  );
}
