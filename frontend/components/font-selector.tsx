'use client';

import * as React from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAllFonts, getFontByName, type FontInfo } from '@/lib/font-utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

/**
 * Props interface for FontSelector component
 */
export interface FontSelectorProps {
  /** Current selected font name (e.g., "Work Sans") */
  currentFont: string;
  /** Callback when user selects a new font */
  onFontChange: (font: string) => void;
  /** Optional label for the selector (default: "Tipografía") */
  label?: string;
  /** Optional placeholder text */
  placeholder?: string;
  /** Show font category/description (default: true) */
  showDescription?: boolean;
  /** Show AaBbCc preview in selected font (default: true) */
  showPreview?: boolean;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Beautiful, professional font selector component with search and visual previews
 *
 * Features:
 * - Dropdown with all 21 fonts
 * - Search/filter by name or description
 * - Visual preview (font name displayed in that font)
 * - Category badges (Sans-serif, Serif, Display)
 * - Keyboard navigation support
 * - Mobile-friendly and accessible
 * - Dark mode support
 *
 * @example
 * ```tsx
 * <FontSelector
 *   currentFont="Work Sans"
 *   onFontChange={(font) => console.log('Selected:', font)}
 *   label="Choose Font"
 *   showPreview={true}
 * />
 * ```
 */
export function FontSelector({
  currentFont,
  onFontChange,
  label = 'Tipografía',
  placeholder = 'Seleccionar fuente...',
  showDescription = true,
  showPreview = true,
  className,
}: FontSelectorProps) {
  // State management
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);

  // Refs for keyboard navigation and click-outside handling
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Get all fonts
  const allFonts = React.useMemo(() => getAllFonts(), []);

  // Filter fonts based on search query
  const filteredFonts = React.useMemo(() => {
    if (!searchQuery.trim()) return allFonts;

    const query = searchQuery.toLowerCase().trim();
    return allFonts.filter(font =>
      font.name.toLowerCase().includes(query) ||
      font.description.toLowerCase().includes(query) ||
      font.category.toLowerCase().includes(query)
    );
  }, [allFonts, searchQuery]);

  // Get current font metadata
  const currentFontInfo = React.useMemo(
    () => getFontByName(currentFont),
    [currentFont]
  );

  // Reset highlighted index when filtered fonts change
  React.useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredFonts]);

  // Focus search input when dropdown opens
  React.useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle click outside to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Scroll highlighted item into view
  const scrollToHighlighted = React.useCallback((index: number) => {
    if (!dropdownRef.current) return;

    const items = dropdownRef.current.querySelectorAll('[data-font-item]');
    const item = items[index] as HTMLElement;

    if (item) {
      item.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, []);

  // Keyboard navigation handler
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const next = prev < filteredFonts.length - 1 ? prev + 1 : prev;
          scrollToHighlighted(next);
          return next;
        });
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const next = prev > 0 ? prev - 1 : 0;
          scrollToHighlighted(next);
          return next;
        });
        break;

      case 'Enter':
        e.preventDefault();
        if (filteredFonts[highlightedIndex]) {
          handleSelectFont(filteredFonts[highlightedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        break;

      case 'Home':
        e.preventDefault();
        setHighlightedIndex(0);
        scrollToHighlighted(0);
        break;

      case 'End':
        e.preventDefault();
        const lastIndex = filteredFonts.length - 1;
        setHighlightedIndex(lastIndex);
        scrollToHighlighted(lastIndex);
        break;
    }
  }, [isOpen, filteredFonts, highlightedIndex, scrollToHighlighted]);

  // Handle font selection
  const handleSelectFont = React.useCallback((font: FontInfo) => {
    onFontChange(font.name);
    setIsOpen(false);
    setSearchQuery('');
  }, [onFontChange]);

  // Get badge variant based on category
  const getCategoryBadgeVariant = (category: string): 'default' | 'secondary' | 'outline' => {
    switch (category) {
      case 'Sans-serif': return 'default';
      case 'Serif': return 'secondary';
      case 'Display': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full', className)}
      onKeyDown={handleKeyDown}
    >
      {/* Label */}
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex h-11 w-full items-center justify-between whitespace-nowrap rounded-xl border-2 bg-white px-4 py-2.5 text-sm font-medium shadow-sm transition-all duration-200',
          'hover:border-gray-300 hover:shadow-md',
          'focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:shadow-lg',
          isOpen ? 'border-blue-500 ring-4 ring-blue-500/20 shadow-lg' : 'border-gray-200',
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={label}
      >
        <span
          className="truncate text-gray-900"
          style={{
            fontFamily: currentFontInfo
              ? `var(${currentFontInfo.variable})`
              : 'inherit'
          }}
        >
          {currentFontInfo?.name || placeholder}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 opacity-50 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Preview Text */}
      {showPreview && currentFontInfo && (
        <div
          className="mt-2 text-lg text-gray-600"
          style={{ fontFamily: `var(${currentFontInfo.variable})` }}
        >
          AaBbCc 123 日本語
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-2 w-full rounded-xl border-2 border-gray-200 bg-white shadow-xl',
            'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2',
            'max-h-[400px] overflow-hidden'
          )}
          role="listbox"
          aria-label="Font options"
        >
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar fuentes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
                aria-label="Search fonts"
              />
            </div>
          </div>

          {/* Font List */}
          <div
            ref={dropdownRef}
            className="overflow-y-auto max-h-[320px] p-1"
          >
            {filteredFonts.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No se encontraron fuentes
              </div>
            ) : (
              filteredFonts.map((font, index) => {
                const isSelected = font.name === currentFont;
                const isHighlighted = index === highlightedIndex;

                return (
                  <button
                    key={font.name}
                    type="button"
                    onClick={() => handleSelectFont(font)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    data-font-item
                    className={cn(
                      'relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150',
                      'hover:bg-blue-50 focus:bg-blue-100 focus:outline-none',
                      isHighlighted && 'bg-blue-50',
                      isSelected && 'bg-blue-100 text-blue-900'
                    )}
                    role="option"
                    aria-selected={isSelected}
                  >
                    {/* Checkmark for selected font */}
                    <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                      {isSelected && (
                        <Check className="h-4 w-4 text-blue-600" />
                      )}
                    </div>

                    {/* Font Info */}
                    <div className="flex-1 min-w-0">
                      {/* Font Name (displayed in the font itself) */}
                      <div
                        className="font-medium text-gray-900 truncate"
                        style={{ fontFamily: `var(${font.variable})` }}
                      >
                        {font.name}
                      </div>

                      {/* Description */}
                      {showDescription && (
                        <div className="text-xs text-gray-500 truncate mt-0.5">
                          {font.description}
                        </div>
                      )}
                    </div>

                    {/* Category Badge */}
                    <Badge
                      variant={getCategoryBadgeVariant(font.category)}
                      className="flex-shrink-0 text-[10px] px-2 py-0.5"
                    >
                      {font.category}
                    </Badge>
                  </button>
                );
              })
            )}
          </div>

          {/* Results Count */}
          {searchQuery && (
            <div className="px-3 py-2 border-t border-gray-200 text-xs text-gray-500 text-center">
              {filteredFonts.length} {filteredFonts.length === 1 ? 'fuente encontrada' : 'fuentes encontradas'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact version of FontSelector without preview and description
 */
export function FontSelectorCompact(props: Omit<FontSelectorProps, 'showPreview' | 'showDescription'>) {
  return (
    <FontSelector
      {...props}
      showPreview={false}
      showDescription={false}
    />
  );
}
