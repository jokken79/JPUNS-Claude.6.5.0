"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export function ColorPicker({
  value,
  onChange,
  label,
  description,
  disabled = false,
  className,
}: ColorPickerProps) {
  const [hexValue, setHexValue] = React.useState(value);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Sync hex value when prop changes
  React.useEffect(() => {
    setHexValue(value);
  }, [value]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setHexValue(newValue);
    onChange(newValue);
  };

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    // Ensure it starts with #
    if (!newValue.startsWith('#')) {
      newValue = '#' + newValue;
    }

    // Only allow valid hex characters
    newValue = newValue.replace(/[^#0-9A-Fa-f]/g, '');

    // Limit to 7 characters (#RRGGBB)
    if (newValue.length > 7) {
      newValue = newValue.substring(0, 7);
    }

    setHexValue(newValue);

    // Only update parent if it's a valid hex color
    if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
      onChange(newValue);
    }
  };

  const handleSwatchClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={`color-${label}`} className="text-sm font-medium">
          {label}
        </Label>
        {description && (
          <span className="text-xs text-muted-foreground">{description}</span>
        )}
      </div>

      <div className="flex gap-3 items-center">
        {/* Color Swatch */}
        <button
          type="button"
          onClick={handleSwatchClick}
          disabled={disabled}
          className={cn(
            "relative h-12 w-12 rounded-md border-2 transition-all shrink-0",
            "hover:scale-105 active:scale-95",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          style={{ backgroundColor: value }}
          title={`Click to pick color for ${label}`}
        >
          {/* Hidden color input */}
          <input
            ref={inputRef}
            type="color"
            value={value}
            onChange={handleColorChange}
            disabled={disabled}
            className="sr-only"
            aria-label={`Color picker for ${label}`}
          />

          {/* Checkered pattern for transparency */}
          <div
            className="absolute inset-0 rounded-md opacity-20"
            style={{
              backgroundImage:
                'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 8px 8px',
            }}
          />
        </button>

        {/* Hex Input */}
        <div className="flex-1">
          <Input
            id={`color-${label}`}
            type="text"
            value={hexValue}
            onChange={handleHexInputChange}
            disabled={disabled}
            placeholder="#RRGGBB"
            className="font-mono uppercase"
            maxLength={7}
          />
        </div>
      </div>
    </div>
  );
}
