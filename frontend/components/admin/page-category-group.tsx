'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Users,
  DollarSign,
  Settings,
  Shield,
  Grid,
  Clock,
  FileText,
  Home,
  Building,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PagePermission {
  page_key: string;
  is_enabled: boolean;
  page_name?: string;
  page_name_en?: string;
  description?: string;
  path?: string;
}

interface PageCategoryGroupProps {
  permissions: PagePermission[];
  onToggle: (pageKey: string, currentState: boolean) => void;
}

interface Category {
  key: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  pages: PagePermission[];
}

const getCategoryForPage = (pageKey: string): string => {
  // Main Modules
  if (pageKey === 'dashboard') return 'main';
  if (pageKey.startsWith('candidate')) return 'main';
  if (pageKey.startsWith('employee')) return 'main';
  if (pageKey.startsWith('factory') || pageKey.startsWith('factories')) return 'main';
  if (pageKey.startsWith('timer_card') || pageKey.startsWith('timercards')) return 'main';

  // HR Module
  if (pageKey.startsWith('request')) return 'hr';
  if (pageKey === 'staff') return 'hr';
  if (pageKey.startsWith('contract')) return 'hr';
  if (pageKey.startsWith('apartment')) return 'hr';

  // Finance Module
  if (pageKey.startsWith('salary') || pageKey.startsWith('payroll')) return 'finance';

  // Settings Module
  if (pageKey.startsWith('setting') || pageKey === 'profile') return 'settings';
  if (pageKey.startsWith('theme')) return 'settings';

  // Admin Module
  if (pageKey.startsWith('admin')) return 'admin';
  if (pageKey.startsWith('role_permission')) return 'admin';
  if (pageKey === 'users') return 'admin';

  return 'other';
};

const CATEGORY_INFO: Record<
  string,
  { name: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  main: { name: 'Main Modules', icon: Home, color: 'text-blue-600 dark:text-blue-400' },
  hr: { name: 'HR & Workforce', icon: Users, color: 'text-green-600 dark:text-green-400' },
  finance: { name: 'Finance & Payroll', icon: DollarSign, color: 'text-yellow-600 dark:text-yellow-400' },
  settings: { name: 'Settings & Preferences', icon: Settings, color: 'text-purple-600 dark:text-purple-400' },
  admin: { name: 'Administration', icon: Shield, color: 'text-red-600 dark:text-red-400' },
  other: { name: 'Other Pages', icon: Grid, color: 'text-gray-600 dark:text-gray-400' },
};

export function PageCategoryGroup({ permissions, onToggle }: PageCategoryGroupProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['main', 'hr', 'finance'])
  );

  // Group permissions by category
  const categories: Category[] = Object.keys(CATEGORY_INFO).map((categoryKey) => {
    const info = CATEGORY_INFO[categoryKey];
    const categoryPages = permissions.filter((p) => getCategoryForPage(p.page_key) === categoryKey);

    return {
      key: categoryKey,
      name: info.name,
      icon: info.icon,
      color: info.color,
      pages: categoryPages,
    };
  }).filter(cat => cat.pages.length > 0);

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryKey)) {
        next.delete(categoryKey);
      } else {
        next.add(categoryKey);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {categories.map((category) => {
        const isExpanded = expandedCategories.has(category.key);
        const Icon = category.icon;
        const enabledCount = category.pages.filter((p) => p.is_enabled).length;
        const totalCount = category.pages.length;

        return (
          <div key={category.key} className="border rounded-lg overflow-hidden">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.key)}
              className="w-full p-4 bg-accent/30 hover:bg-accent/50 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <Icon className={`h-5 w-5 ${category.color}`} />
                <span className="font-semibold">{category.name}</span>
                <Badge variant="secondary">
                  {enabledCount}/{totalCount}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${(enabledCount / totalCount) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground">
                  {Math.round((enabledCount / totalCount) * 100)}%
                </span>
              </div>
            </button>

            {/* Category Pages */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 space-y-3">
                    {category.pages.map((permission, index) => (
                      <div key={permission.page_key}>
                        <TooltipProvider>
                          <Tooltip delayDuration={500}>
                            <TooltipTrigger asChild>
                              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3">
                                    <h3 className="font-medium capitalize">
                                      {permission.page_name_en || permission.page_key.replace(/_/g, ' ')}
                                    </h3>
                                    {permission.page_name && (
                                      <Badge variant="secondary" className="text-xs">
                                        {permission.page_name}
                                      </Badge>
                                    )}
                                    {permission.is_enabled ? (
                                      <Badge variant="default" className="bg-green-600 gap-1">
                                        <Eye className="h-3 w-3" />
                                        Enabled
                                      </Badge>
                                    ) : (
                                      <Badge variant="destructive" className="gap-1">
                                        <EyeOff className="h-3 w-3" />
                                        Disabled
                                      </Badge>
                                    )}
                                  </div>
                                  {permission.description && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {permission.description}
                                    </p>
                                  )}
                                </div>
                                <Switch
                                  checked={permission.is_enabled}
                                  onCheckedChange={() => onToggle(permission.page_key, permission.is_enabled)}
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              <div className="space-y-1">
                                <div className="font-semibold">Page Details</div>
                                <div className="text-xs">
                                  <strong>Key:</strong> {permission.page_key}
                                </div>
                                {permission.path && (
                                  <div className="text-xs">
                                    <strong>Path:</strong> {permission.path}
                                  </div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {index < category.pages.length - 1 && <Separator className="mt-3" />}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {categories.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No pages found in any category
        </div>
      )}
    </div>
  );
}
