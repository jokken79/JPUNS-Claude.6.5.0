'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ja } from 'date-fns/locale';
import { formAnimations } from '@/lib/form-animations';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export interface DatePickerProps {
  label?: string;
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  disabled?: boolean;
  error?: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

const DatePicker = React.forwardRef<HTMLDivElement, DatePickerProps>(
  (
    {
      label,
      value,
      onChange,
      disabled = false,
      error,
      hint,
      required,
      placeholder = '日付を選択',
      minDate,
      maxDate,
      className,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [currentMonth, setCurrentMonth] = React.useState(value || new Date());
    const dropdownRef = React.useRef<HTMLDivElement>(null);

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

    const handleDateSelect = (date: Date) => {
      onChange?.(date);
      setIsOpen(false);
    };

    const handlePreviousMonth = () => {
      setCurrentMonth(subMonths(currentMonth, 1));
    };

    const handleNextMonth = () => {
      setCurrentMonth(addMonths(currentMonth, 1));
    };

    const handleToday = () => {
      const today = new Date();
      setCurrentMonth(today);
      handleDateSelect(today);
    };

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Get day of week for first day (0 = Sunday, 1 = Monday, ...)
    const firstDayOfWeek = monthStart.getDay();

    // Fill empty cells before first day
    const emptyDays = Array.from({ length: firstDayOfWeek }, (_, i) => i);

    const isDateDisabled = (date: Date) => {
      if (minDate && date < minDate) return true;
      if (maxDate && date > maxDate) return true;
      return false;
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

        {/* Input Container */}
        <div ref={dropdownRef} className="relative">
          <motion.button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={cn(
              'flex h-10 w-full items-center justify-between rounded-md border bg-transparent px-3 py-2 text-base shadow-sm transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error
                ? 'border-red-500 focus-visible:ring-red-500 bg-red-50/50'
                : 'border-input focus-visible:ring-ring',
              !value && 'text-muted-foreground'
            )}
            animate={error ? 'animate' : 'initial'}
            variants={error ? formAnimations.shake : undefined}
          >
            <span className="truncate">
              {value ? format(value, 'PPP', { locale: ja }) : placeholder}
            </span>
            <CalendarIcon className="ml-2 h-4 w-4 shrink-0" />
          </motion.button>

          {/* Calendar Dropdown */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                className="absolute z-50 mt-2 w-full min-w-[280px] bg-white rounded-lg shadow-lg border border-gray-200 p-3"
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={handlePreviousMonth}
                    className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>

                  <h3 className="text-sm font-semibold">
                    {format(currentMonth, 'yyyy年 M月', { locale: ja })}
                  </h3>

                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Day of Week Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
                    <div
                      key={day}
                      className="text-xs font-medium text-center text-muted-foreground py-1"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells for days before month start */}
                  {emptyDays.map((i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}

                  {/* Days */}
                  {days.map((day, index) => {
                    const isSelected = value && isSameDay(day, value);
                    const isCurrentDay = isToday(day);
                    const disabled = isDateDisabled(day);

                    return (
                      <motion.button
                        key={day.toISOString()}
                        type="button"
                        onClick={() => !disabled && handleDateSelect(day)}
                        disabled={disabled}
                        className={cn(
                          'aspect-square p-0 text-sm rounded-md transition-all',
                          'hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          isSelected &&
                            'bg-indigo-600 text-white hover:bg-indigo-700',
                          isCurrentDay &&
                            !isSelected &&
                            'border-2 border-indigo-600 font-semibold',
                          disabled &&
                            'text-muted-foreground opacity-50 cursor-not-allowed hover:bg-transparent',
                          !isSameMonth(day, currentMonth) && 'text-muted-foreground'
                        )}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.01 }}
                        whileHover={!disabled ? { scale: 1.1 } : {}}
                        whileTap={!disabled ? { scale: 0.95 } : {}}
                      >
                        {format(day, 'd')}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Today Button */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleToday}
                    className="w-full px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                  >
                    今日
                  </button>
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

DatePicker.displayName = 'DatePicker';

export { DatePicker };
