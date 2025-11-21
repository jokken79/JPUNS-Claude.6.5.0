'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formAnimations } from '@/lib/form-animations';
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface SearchableSelectProps {
  label?: string;
  options: SelectOption[];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  disabled?: boolean;
  error?: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  multiple?: boolean;
  clearable?: boolean;
  maxHeight?: number;
  className?: string;
  renderOption?: (option: SelectOption) => React.ReactNode;
}

const SearchableSelect = React.forwardRef<HTMLDivElement, SearchableSelectProps>(
  (
    {
      label,
      options,
      value,
      onChange,
      disabled = false,
      error,
      hint,
      required,
      placeholder = '選択してください',
      searchPlaceholder = '検索...',
      multiple = false,
      clearable = true,
      maxHeight = 300,
      className,
      renderOption,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [focusedIndex, setFocusedIndex] = React.useState(-1);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const searchInputRef = React.useRef<HTMLInputElement>(null);

    const selectedValues = React.useMemo(() => {
      if (!value) return [];
      return Array.isArray(value) ? value : [value];
    }, [value]);

    const selectedOptions = React.useMemo(() => {
      return options.filter((opt) => selectedValues.includes(opt.value));
    }, [options, selectedValues]);

    const filteredOptions = React.useMemo(() => {
      if (!searchQuery) return options;
      const query = searchQuery.toLowerCase();
      return options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(query) ||
          opt.description?.toLowerCase().includes(query) ||
          opt.value.toLowerCase().includes(query)
      );
    }, [options, searchQuery]);

    // Close dropdown when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when dropdown opens
    React.useEffect(() => {
      if (isOpen && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, [isOpen]);

    // Keyboard navigation
    React.useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!isOpen) return;

        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setFocusedIndex((prev) =>
              prev < filteredOptions.length - 1 ? prev + 1 : prev
            );
            break;
          case 'ArrowUp':
            e.preventDefault();
            setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
            break;
          case 'Enter':
            e.preventDefault();
            if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
              handleOptionToggle(filteredOptions[focusedIndex]);
            }
            break;
          case 'Escape':
            e.preventDefault();
            setIsOpen(false);
            break;
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, focusedIndex, filteredOptions]);

    const handleOptionToggle = (option: SelectOption) => {
      if (option.disabled) return;

      if (multiple) {
        const newValue = selectedValues.includes(option.value)
          ? selectedValues.filter((v) => v !== option.value)
          : [...selectedValues, option.value];
        onChange?.(newValue);
      } else {
        onChange?.(option.value);
        setIsOpen(false);
      }
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.(multiple ? [] : '');
    };

    const handleRemoveTag = (valueToRemove: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (multiple) {
        const newValue = selectedValues.filter((v) => v !== valueToRemove);
        onChange?.(newValue);
      }
    };

    const getDisplayText = () => {
      if (selectedOptions.length === 0) return placeholder;
      if (multiple) {
        return `${selectedOptions.length} 件選択`;
      }
      return selectedOptions[0]?.label || placeholder;
    };

    return (
      <div ref={ref} className={cn('w-full space-y-1.5', className)}>
        {/* Label */}
        {label && (
          <label
            className={cn(
              'block text-sm font-medium',
              error ? 'text-red-600' : 'text-foreground',
              disabled && 'opacity-50'
            )}
          >
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        {/* Select Container */}
        <div ref={dropdownRef} className="relative">
          <motion.button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={cn(
              'flex h-auto min-h-[40px] w-full items-center justify-between rounded-md border bg-transparent px-3 py-2 text-base shadow-sm transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error
                ? 'border-red-500 focus-visible:ring-red-500 bg-red-50/50'
                : 'border-input focus-visible:ring-ring',
              selectedOptions.length === 0 && 'text-muted-foreground'
            )}
            animate={error ? 'animate' : 'initial'}
            variants={error ? formAnimations.shake : undefined}
          >
            {/* Selected Tags (Multiple) */}
            {multiple && selectedOptions.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedOptions.map((option) => (
                  <motion.span
                    key={option.value}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-md"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    layout
                  >
                    {option.label}
                    <button
                      type="button"
                      onClick={(e) => handleRemoveTag(option.value, e)}
                      className="hover:bg-indigo-200 rounded-full p-0.5 transition-colors"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </motion.span>
                ))}
              </div>
            ) : (
              <span className="truncate">{getDisplayText()}</span>
            )}

            <div className="flex items-center gap-1 ml-2">
              {/* Clear Button */}
              {clearable &&
                selectedOptions.length > 0 &&
                !disabled && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                  >
                    <button
                      type="button"
                      onClick={handleClear}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

              <ChevronDownIcon
                className={cn(
                  'w-4 h-4 text-muted-foreground transition-transform shrink-0',
                  isOpen && 'rotate-180'
                )}
              />
            </div>
          </motion.button>

          {/* Dropdown */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                className="absolute z-50 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                {/* Search */}
                <div className="p-2 border-b border-gray-200">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setFocusedIndex(-1);
                      }}
                      placeholder={searchPlaceholder}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                {/* Options List */}
                <div
                  className="overflow-y-auto"
                  style={{ maxHeight: `${maxHeight}px` }}
                >
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((option, index) => {
                      const isSelected = selectedValues.includes(option.value);
                      const isFocused = index === focusedIndex;

                      return (
                        <motion.button
                          key={option.value}
                          type="button"
                          onClick={() => handleOptionToggle(option)}
                          disabled={option.disabled}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors',
                            'hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed',
                            isFocused && 'bg-muted',
                            isSelected && 'bg-indigo-50'
                          )}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                        >
                          {/* Checkbox for multiple select */}
                          {multiple && (
                            <div
                              className={cn(
                                'flex items-center justify-center w-4 h-4 border-2 rounded transition-colors',
                                isSelected
                                  ? 'bg-indigo-600 border-indigo-600'
                                  : 'border-gray-300'
                              )}
                            >
                              {isSelected && (
                                <CheckIcon className="w-3 h-3 text-white" />
                              )}
                            </div>
                          )}

                          {/* Option Content */}
                          {renderOption ? (
                            renderOption(option)
                          ) : (
                            <div className="flex-1 min-w-0">
                              <div className="truncate font-medium">
                                {option.label}
                              </div>
                              {option.description && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {option.description}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Checkmark for single select */}
                          {!multiple && isSelected && (
                            <CheckIcon className="w-5 h-5 text-indigo-600 shrink-0" />
                          )}
                        </motion.button>
                      );
                    })
                  ) : (
                    <div className="px-3 py-4 text-sm text-center text-muted-foreground">
                      結果が見つかりません
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Hint Text */}
        {hint && !error && (
          <p className="text-xs text-muted-foreground">{hint}</p>
        )}

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="text-xs text-red-600 flex items-center gap-1"
              variants={formAnimations.slideDown}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

SearchableSelect.displayName = 'SearchableSelect';

export { SearchableSelect };
