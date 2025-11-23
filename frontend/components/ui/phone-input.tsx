'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formAnimations } from '@/lib/form-animations';
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export interface CountryCode {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

// Popular country codes (expand as needed)
const countryCodes: CountryCode[] = [
  { code: 'JP', name: '日本', dialCode: '+81', flag: '🇯🇵' },
  { code: 'CN', name: '中国', dialCode: '+86', flag: '🇨🇳' },
  { code: 'KR', name: '韓国', dialCode: '+82', flag: '🇰🇷' },
  { code: 'US', name: 'アメリカ', dialCode: '+1', flag: '🇺🇸' },
  { code: 'VN', name: 'ベトナム', dialCode: '+84', flag: '🇻🇳' },
  { code: 'TH', name: 'タイ', dialCode: '+66', flag: '🇹🇭' },
  { code: 'PH', name: 'フィリピン', dialCode: '+63', flag: '🇵🇭' },
  { code: 'ID', name: 'インドネシア', dialCode: '+62', flag: '🇮🇩' },
  { code: 'MY', name: 'マレーシア', dialCode: '+60', flag: '🇲🇾' },
  { code: 'IN', name: 'インド', dialCode: '+91', flag: '🇮🇳' },
  { code: 'GB', name: 'イギリス', dialCode: '+44', flag: '🇬🇧' },
  { code: 'DE', name: 'ドイツ', dialCode: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'フランス', dialCode: '+33', flag: '🇫🇷' },
  { code: 'BR', name: 'ブラジル', dialCode: '+55', flag: '🇧🇷' },
  { code: 'AU', name: 'オーストラリア', dialCode: '+61', flag: '🇦🇺' },
];

export interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  hint?: string;
  defaultCountry?: string;
  value?: string;
  onChange?: (value: string, dialCode: string, country: CountryCode) => void;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      className,
      label,
      error,
      hint,
      defaultCountry = 'JP',
      value,
      disabled,
      required,
      onChange,
      ...props
    },
    ref
  ) => {
    const [selectedCountry, setSelectedCountry] = React.useState<CountryCode>(
      () =>
        countryCodes.find((c) => c.code === defaultCountry) || countryCodes[0]
    );
    const [phoneNumber, setPhoneNumber] = React.useState('');
    const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Parse value prop if provided
    React.useEffect(() => {
      if (value) {
        // Try to extract dial code from value
        const matchingCountry = countryCodes.find((c) =>
          value.startsWith(c.dialCode)
        );
        if (matchingCountry) {
          setSelectedCountry(matchingCountry);
          setPhoneNumber(value.substring(matchingCountry.dialCode.length));
        } else {
          setPhoneNumber(value);
        }
      }
    }, [value]);

    // Close dropdown when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsDropdownOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;

      // Auto-format based on country
      if (selectedCountry.code === 'JP') {
        // Remove non-digits
        value = value.replace(/\D/g, '');
        // Format as XXX-XXXX-XXXX or XXX-XXXX
        if (value.length > 6) {
          value = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7, 11)}`;
        } else if (value.length > 3) {
          value = `${value.slice(0, 3)}-${value.slice(3)}`;
        }
      }

      setPhoneNumber(value);
      const fullNumber = selectedCountry.dialCode + value.replace(/\D/g, '');
      onChange?.(fullNumber, selectedCountry.dialCode, selectedCountry);
    };

    const handleCountrySelect = (country: CountryCode) => {
      setSelectedCountry(country);
      setIsDropdownOpen(false);
      setSearchQuery('');

      const fullNumber = country.dialCode + phoneNumber.replace(/\D/g, '');
      onChange?.(fullNumber, country.dialCode, country);
    };

    const filteredCountries = countryCodes.filter(
      (country) =>
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.dialCode.includes(searchQuery) ||
        country.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="w-full space-y-1.5">
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
        <motion.div
          className="relative"
          animate={error ? 'animate' : 'initial'}
          variants={error ? formAnimations.shake : undefined}
        >
          <div className="relative flex items-center">
            {/* Country Code Selector */}
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
                disabled={disabled}
                className={cn(
                  'flex items-center gap-1.5 px-3 h-10 border border-r-0 rounded-l-md bg-muted/50',
                  'hover:bg-muted transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  disabled && 'opacity-50 cursor-not-allowed',
                  error && 'border-red-500'
                )}
              >
                <span className="text-lg">{selectedCountry.flag}</span>
                <span className="text-sm font-medium">
                  {selectedCountry.dialCode}
                </span>
                <ChevronDownIcon
                  className={cn(
                    'w-4 h-4 text-muted-foreground transition-transform',
                    isDropdownOpen && 'rotate-180'
                  )}
                />
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    className="absolute z-50 mt-1 w-64 bg-white rounded-md shadow-lg border border-gray-200 overflow-hidden"
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
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="国を検索..."
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>

                    {/* Country List */}
                    <div className="max-h-60 overflow-y-auto">
                      {filteredCountries.length > 0 ? (
                        filteredCountries.map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => handleCountrySelect(country)}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted transition-colors',
                              selectedCountry.code === country.code &&
                                'bg-muted/50'
                            )}
                          >
                            <span className="text-lg">{country.flag}</span>
                            <span className="flex-1 text-left">
                              {country.name}
                            </span>
                            <span className="text-muted-foreground">
                              {country.dialCode}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-4 text-sm text-center text-muted-foreground">
                          国が見つかりません
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Phone Number Input */}
            <input
              type="tel"
              className={cn(
                'flex h-10 w-full rounded-r-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-all duration-200',
                'placeholder:text-muted-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'disabled:cursor-not-allowed disabled:opacity-50',
                error && 'border-red-500 focus-visible:ring-red-500 bg-red-50/50',
                className
              )}
              ref={ref}
              value={phoneNumber}
              disabled={disabled}
              onChange={handlePhoneChange}
              placeholder={
                selectedCountry.code === 'JP'
                  ? '090-1234-5678'
                  : 'Phone number'
              }
              {...props}
            />
          </div>
        </motion.div>

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

PhoneInput.displayName = 'PhoneInput';

export { PhoneInput };
