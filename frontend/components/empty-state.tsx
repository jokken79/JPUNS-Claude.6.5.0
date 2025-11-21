'use client';

/**
 * EmptyState Component
 *
 * Displays empty states with different variants for different scenarios.
 * Includes call-to-action buttons and customizable icons.
 */

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Inbox,
  Search,
  ShieldOff,
  Sparkles,
  Plus,
  ArrowRight,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type EmptyStateVariant = 'no-data' | 'no-results' | 'no-permission' | 'coming-soon' | 'custom';

export interface EmptyStateAction {
  /**
   * Action button label
   */
  label: string;

  /**
   * Click handler
   */
  onClick?: () => void;

  /**
   * Navigation href (alternative to onClick)
   */
  href?: string;

  /**
   * Button variant
   */
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';

  /**
   * Button icon
   */
  icon?: LucideIcon;
}

export interface EmptyStateProps {
  /**
   * Variant of empty state
   */
  variant?: EmptyStateVariant;

  /**
   * Custom icon component
   */
  icon?: ReactNode;

  /**
   * Title text
   */
  title?: string;

  /**
   * Description text
   */
  description?: string;

  /**
   * Primary action
   */
  action?: EmptyStateAction;

  /**
   * Secondary action (optional)
   */
  secondaryAction?: EmptyStateAction;

  /**
   * Custom className
   */
  className?: string;

  /**
   * Full height container
   */
  fullHeight?: boolean;
}

const variantConfig = {
  'no-data': {
    icon: Inbox,
    defaultTitle: 'No data yet',
    defaultDescription: 'Get started by creating your first item.',
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
  },
  'no-results': {
    icon: Search,
    defaultTitle: 'No results found',
    defaultDescription: 'Try adjusting your search or filter to find what you\'re looking for.',
    iconColor: 'text-gray-500',
    bgColor: 'bg-gray-50 dark:bg-gray-950/20',
  },
  'no-permission': {
    icon: ShieldOff,
    defaultTitle: 'No access',
    defaultDescription: 'You don\'t have permission to view this content. Contact your administrator.',
    iconColor: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
  },
  'coming-soon': {
    icon: Sparkles,
    defaultTitle: 'Coming soon',
    defaultDescription: 'This feature is under development and will be available soon.',
    iconColor: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
  },
  'custom': {
    icon: Inbox,
    defaultTitle: 'Empty',
    defaultDescription: 'No content to display.',
    iconColor: 'text-gray-500',
    bgColor: 'bg-gray-50 dark:bg-gray-950/20',
  },
};

export function EmptyState({
  variant = 'no-data',
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  fullHeight = false,
}: EmptyStateProps) {
  const router = useRouter();
  const config = variantConfig[variant];

  const emptyTitle = title || config.defaultTitle;
  const emptyDescription = description || config.defaultDescription;

  const handleAction = (actionConfig: EmptyStateAction) => {
    if (actionConfig.onClick) {
      actionConfig.onClick();
    } else if (actionConfig.href) {
      router.push(actionConfig.href);
    }
  };

  // Default icon or custom icon
  const IconComponent = icon ? (
    icon
  ) : (
    <config.icon className={cn('w-12 h-12', config.iconColor)} strokeWidth={1.5} />
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex items-center justify-center p-8',
        fullHeight && 'min-h-[400px]',
        className
      )}
    >
      <div className="w-full max-w-md">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className={cn(
            'mx-auto mb-6 w-24 h-24 rounded-full flex items-center justify-center',
            config.bgColor
          )}
        >
          {IconComponent}
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center space-y-4"
        >
          {/* Title */}
          <h3 className="text-2xl font-bold text-foreground">
            {emptyTitle}
          </h3>

          {/* Description */}
          <p className="text-muted-foreground leading-relaxed">
            {emptyDescription}
          </p>

          {/* Actions */}
          {(action || secondaryAction) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6"
            >
              {action && (
                <Button
                  onClick={() => handleAction(action)}
                  variant={action.variant || 'default'}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  {action.icon && <action.icon className="w-4 h-4 mr-2" />}
                  {action.label}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}

              {secondaryAction && (
                <Button
                  onClick={() => handleAction(secondaryAction)}
                  variant={secondaryAction.variant || 'outline'}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  {secondaryAction.icon && <secondaryAction.icon className="w-4 h-4 mr-2" />}
                  {secondaryAction.label}
                </Button>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

/**
 * Specialized empty state components for common scenarios
 */

export function NoData(props: Omit<EmptyStateProps, 'variant'>) {
  return <EmptyState variant="no-data" {...props} />;
}

export function NoResults(props: Omit<EmptyStateProps, 'variant'>) {
  return <EmptyState variant="no-results" {...props} />;
}

export function NoPermission(props: Omit<EmptyStateProps, 'variant'>) {
  return <EmptyState variant="no-permission" {...props} />;
}

export function ComingSoon(props: Omit<EmptyStateProps, 'variant'>) {
  return <EmptyState variant="coming-soon" {...props} />;
}
