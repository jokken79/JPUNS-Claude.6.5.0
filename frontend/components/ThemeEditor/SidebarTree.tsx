'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '@/stores/themeStore';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  LayoutDashboard,
  Heading1,
  SidebarClose,
  FileText,
  Columns,
  CreditCard,
  Palette,
  Type,
  Space,
  CornerUpRight,
  Box,
  Search,
  LucideIcon,
} from 'lucide-react';

/**
 * SidebarTree Component
 *
 * Hierarchical tree view for navigating and selecting theme elements.
 * Displays all editable properties organized by category with search/filter.
 */

interface SidebarTreeProps {
  className?: string;
  defaultExpanded?: string[];
}

/**
 * Tree Node Item Interface
 */
interface TreeNodeItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string; // Optional badge to show current value
}

/**
 * TreeNode Component
 * Individual selectable node in the tree
 */
interface TreeNodeProps {
  item: TreeNodeItem;
  isSelected: boolean;
  onClick: (id: string) => void;
}

function TreeNode({ item, isSelected, onClick }: TreeNodeProps) {
  const Icon = item.icon;

  return (
    <motion.button
      type="button"
      onClick={() => onClick(item.id)}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm',
        'hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isSelected
          ? 'bg-blue-100 text-blue-700 font-medium shadow-sm'
          : 'text-foreground hover:text-foreground/80'
      )}
      aria-selected={isSelected}
      role="treeitem"
      whileHover={{ x: 2, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.98 }}
      animate={{
        backgroundColor: isSelected ? 'rgb(219 234 254)' : 'transparent',
      }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        animate={{ scale: isSelected ? 1.1 : 1 }}
        transition={{ duration: 0.2 }}
      >
        <Icon className={cn('h-4 w-4 flex-shrink-0', isSelected && 'text-blue-600')} />
      </motion.div>
      <span className="flex-1 text-left truncate">{item.label}</span>
      {item.badge && (
        <Badge variant="outline" className="text-xs h-5 px-1.5">
          {item.badge}
        </Badge>
      )}
    </motion.button>
  );
}

/**
 * Main SidebarTree Component
 */
export function SidebarTree({
  className,
  defaultExpanded = ['layout'],
}: SidebarTreeProps) {
  const { selectedElement, selectElement, currentTheme } = useThemeStore();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedSections, setExpandedSections] = React.useState<string[]>(defaultExpanded);

  // Define tree structure with all theme elements
  const treeStructure: Record<string, { icon: LucideIcon; items: TreeNodeItem[] }> = {
    layout: {
      icon: LayoutDashboard,
      items: [
        { id: 'header', label: 'Header', icon: Heading1 },
        { id: 'sidebar', label: 'Sidebar', icon: SidebarClose },
        { id: 'main', label: 'Main Content', icon: FileText },
        { id: 'footer', label: 'Footer', icon: Columns },
        { id: 'card', label: 'Card', icon: CreditCard },
      ],
    },
    colors: {
      icon: Palette,
      items: [
        { id: 'colors.--background', label: 'Background', icon: Palette },
        { id: 'colors.--foreground', label: 'Foreground', icon: Palette },
        { id: 'colors.--card', label: 'Card', icon: Palette },
        { id: 'colors.--card-foreground', label: 'Card Foreground', icon: Palette },
        { id: 'colors.--popover', label: 'Popover', icon: Palette },
        { id: 'colors.--popover-foreground', label: 'Popover Foreground', icon: Palette },
        { id: 'colors.--primary', label: 'Primary', icon: Palette },
        { id: 'colors.--primary-foreground', label: 'Primary Foreground', icon: Palette },
        { id: 'colors.--secondary', label: 'Secondary', icon: Palette },
        { id: 'colors.--secondary-foreground', label: 'Secondary Foreground', icon: Palette },
        { id: 'colors.--muted', label: 'Muted', icon: Palette },
        { id: 'colors.--muted-foreground', label: 'Muted Foreground', icon: Palette },
        { id: 'colors.--accent', label: 'Accent', icon: Palette },
        { id: 'colors.--accent-foreground', label: 'Accent Foreground', icon: Palette },
        { id: 'colors.--destructive', label: 'Destructive', icon: Palette },
        { id: 'colors.--destructive-foreground', label: 'Destructive Foreground', icon: Palette },
        { id: 'colors.--border', label: 'Border', icon: Palette },
        { id: 'colors.--input', label: 'Input', icon: Palette },
        { id: 'colors.--ring', label: 'Ring', icon: Palette },
      ],
    },
    typography: {
      icon: Type,
      items: [
        // Font Families
        { id: 'typography.fontFamily.heading', label: 'Heading Font', icon: Type },
        { id: 'typography.fontFamily.body', label: 'Body Font', icon: Type },
        { id: 'typography.fontFamily.ui', label: 'UI Font', icon: Type },
        // Font Sizes
        { id: 'typography.fontSize.xs', label: 'Font Size: XS', icon: Type },
        { id: 'typography.fontSize.sm', label: 'Font Size: SM', icon: Type },
        { id: 'typography.fontSize.base', label: 'Font Size: Base', icon: Type },
        { id: 'typography.fontSize.lg', label: 'Font Size: LG', icon: Type },
        { id: 'typography.fontSize.xl', label: 'Font Size: XL', icon: Type },
        { id: 'typography.fontSize.2xl', label: 'Font Size: 2XL', icon: Type },
        { id: 'typography.fontSize.3xl', label: 'Font Size: 3XL', icon: Type },
        { id: 'typography.fontSize.4xl', label: 'Font Size: 4XL', icon: Type },
        // Font Weights
        { id: 'typography.fontWeight.normal', label: 'Font Weight: Normal', icon: Type },
        { id: 'typography.fontWeight.medium', label: 'Font Weight: Medium', icon: Type },
        { id: 'typography.fontWeight.semibold', label: 'Font Weight: Semibold', icon: Type },
        { id: 'typography.fontWeight.bold', label: 'Font Weight: Bold', icon: Type },
        // Line Heights
        { id: 'typography.lineHeight.tight', label: 'Line Height: Tight', icon: Type },
        { id: 'typography.lineHeight.normal', label: 'Line Height: Normal', icon: Type },
        { id: 'typography.lineHeight.relaxed', label: 'Line Height: Relaxed', icon: Type },
      ],
    },
    spacing: {
      icon: Space,
      items: [
        { id: 'spacing.xs', label: 'Spacing: XS', icon: Space },
        { id: 'spacing.sm', label: 'Spacing: SM', icon: Space },
        { id: 'spacing.md', label: 'Spacing: MD', icon: Space },
        { id: 'spacing.lg', label: 'Spacing: LG', icon: Space },
        { id: 'spacing.xl', label: 'Spacing: XL', icon: Space },
        { id: 'spacing.2xl', label: 'Spacing: 2XL', icon: Space },
        { id: 'spacing.3xl', label: 'Spacing: 3XL', icon: Space },
        { id: 'spacing.4xl', label: 'Spacing: 4XL', icon: Space },
      ],
    },
    borderRadius: {
      icon: CornerUpRight,
      items: [
        { id: 'borderRadius.none', label: 'Border Radius: None', icon: CornerUpRight },
        { id: 'borderRadius.sm', label: 'Border Radius: SM', icon: CornerUpRight },
        { id: 'borderRadius.md', label: 'Border Radius: MD', icon: CornerUpRight },
        { id: 'borderRadius.lg', label: 'Border Radius: LG', icon: CornerUpRight },
        { id: 'borderRadius.xl', label: 'Border Radius: XL', icon: CornerUpRight },
        { id: 'borderRadius.2xl', label: 'Border Radius: 2XL', icon: CornerUpRight },
        { id: 'borderRadius.full', label: 'Border Radius: Full', icon: CornerUpRight },
      ],
    },
    shadows: {
      icon: Box,
      items: [
        { id: 'shadows.sm', label: 'Shadow: SM', icon: Box },
        { id: 'shadows.md', label: 'Shadow: MD', icon: Box },
        { id: 'shadows.lg', label: 'Shadow: LG', icon: Box },
        { id: 'shadows.xl', label: 'Shadow: XL', icon: Box },
        { id: 'shadows.2xl', label: 'Shadow: 2XL', icon: Box },
        { id: 'shadows.inner', label: 'Shadow: Inner', icon: Box },
      ],
    },
  };

  // Filter tree based on search query
  const filteredStructure = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return treeStructure;
    }

    const query = searchQuery.toLowerCase();
    const filtered: typeof treeStructure = {};

    Object.entries(treeStructure).forEach(([category, { icon, items }]) => {
      const matchingItems = items.filter((item) =>
        item.label.toLowerCase().includes(query) || item.id.toLowerCase().includes(query)
      );

      if (matchingItems.length > 0) {
        filtered[category] = { icon, items: matchingItems };
      }
    });

    return filtered;
  }, [searchQuery, treeStructure]);

  // Auto-expand sections with search results
  React.useEffect(() => {
    if (searchQuery.trim()) {
      const sectionsWithMatches = Object.keys(filteredStructure);
      setExpandedSections(sectionsWithMatches);
    } else {
      // Reset to default expanded when search is cleared
      setExpandedSections(defaultExpanded);
    }
  }, [searchQuery, filteredStructure, defaultExpanded]);

  // Handle tree node selection
  const handleNodeClick = (id: string) => {
    selectElement(id);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      selectElement(null);
    }
  };

  const hasResults = Object.keys(filteredStructure).length > 0;

  // Animation variants for stagger effect
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div
      className={cn('flex flex-col h-full', className)}
      onKeyDown={handleKeyDown}
      role="tree"
      aria-label="Theme Structure Tree"
    >
      {/* Search Bar */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search elements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            aria-label="Search theme elements"
          />
        </div>
      </div>

      {/* Tree Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <AnimatePresence mode="wait">
            {hasResults ? (
              <motion.div
                key="results"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={containerVariants}
              >
                <Accordion
                  type="multiple"
                  value={expandedSections}
                  onValueChange={setExpandedSections}
                  className="space-y-2"
                >
                  {Object.entries(filteredStructure).map(([category, { icon: CategoryIcon, items }], index) => {
                    const categoryLabel =
                      category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1');

                    return (
                      <motion.div
                        key={category}
                        variants={itemVariants}
                        custom={index}
                      >
                        <AccordionItem value={category} className="border rounded-lg">
                          <AccordionTrigger className="px-4 hover:no-underline hover:bg-accent/50">
                            <div className="flex items-center gap-2">
                              <CategoryIcon className="h-4 w-4" />
                              <span className="font-medium">{categoryLabel}</span>
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {items.length}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-2 pb-2">
                            <motion.div
                              className="space-y-1"
                              role="group"
                              initial="hidden"
                              animate="visible"
                              variants={containerVariants}
                            >
                              {items.map((item, itemIndex) => (
                                <motion.div
                                  key={item.id}
                                  variants={itemVariants}
                                  custom={itemIndex}
                                >
                                  <TreeNode
                                    item={item}
                                    isSelected={selectedElement === item.id}
                                    onClick={handleNodeClick}
                                  />
                                </motion.div>
                              ))}
                            </motion.div>
                          </AccordionContent>
                        </AccordionItem>
                      </motion.div>
                    );
                  })}
                </Accordion>
              </motion.div>
            ) : (
              <motion.div
                key="no-results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground font-medium">No results found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try a different search term
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Status Bar */}
      <AnimatePresence>
        {selectedElement && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="p-3 border-t bg-muted/30"
          >
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Selected:</span>
              <code className="px-2 py-1 bg-background rounded text-foreground font-mono">
                {selectedElement}
              </code>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
