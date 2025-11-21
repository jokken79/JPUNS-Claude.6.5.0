'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '@/stores/themeStore';
import type { ElementConfig } from '@/stores/themeStore';
import { cn } from '@/lib/utils';

/**
 * EditorCanvas Component
 *
 * Main canvas area for theme editing with live preview.
 * Shows a scaled-down version of the app layout with interactive elements.
 */

interface EditorCanvasProps {
  className?: string;
  deviceMode?: 'desktop' | 'tablet' | 'mobile';
  showGrid?: boolean;
  scale?: number;
}

/**
 * Convert ElementConfig to React CSSProperties
 */
function applyElementStyles(elementConfig: ElementConfig): React.CSSProperties {
  return {
    backgroundColor: elementConfig.backgroundColor.startsWith('hsl')
      ? elementConfig.backgroundColor
      : `hsl(${elementConfig.backgroundColor})`,
    color: elementConfig.textColor.startsWith('hsl')
      ? elementConfig.textColor
      : `hsl(${elementConfig.textColor})`,
    fontSize: elementConfig.fontSize,
    fontFamily: elementConfig.fontFamily,
    fontWeight: elementConfig.fontWeight,
    padding: elementConfig.padding,
    margin: elementConfig.margin,
    borderRadius: elementConfig.borderRadius,
    boxShadow: elementConfig.boxShadow,
    borderColor: elementConfig.borderColor.startsWith('hsl')
      ? elementConfig.borderColor
      : `hsl(${elementConfig.borderColor})`,
    borderWidth: elementConfig.borderWidth,
    borderStyle: elementConfig.borderWidth !== '0' ? 'solid' : 'none',
  };
}

/**
 * Apply theme colors to CSS custom properties style
 */
function applyThemeColors(colors: Record<string, string>): React.CSSProperties {
  const cssVars: Record<string, string> = {};

  Object.entries(colors).forEach(([key, value]) => {
    // Convert --primary format to --primary
    const cssVarName = key.startsWith('--') ? key : `--${key}`;
    cssVars[cssVarName] = value;
  });

  return cssVars as React.CSSProperties;
}

/**
 * PreviewHeader Component
 */
interface PreviewSectionProps {
  elementId: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
  elementConfig: ElementConfig;
  children: React.ReactNode;
  className?: string;
}

function PreviewSection({
  elementId,
  isSelected,
  onSelect,
  elementConfig,
  children,
  className,
}: PreviewSectionProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.div
      data-element-id={elementId}
      className={cn(
        'relative cursor-pointer',
        className
      )}
      style={applyElementStyles(elementConfig)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(elementId)}
      whileHover={{ scale: 1.005 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
    >
      {/* Animated selection ring */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            className="absolute -inset-0.5 rounded ring-2 ring-blue-600 ring-offset-2 pointer-events-none z-10"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          />
        )}
        {isHovered && !isSelected && (
          <motion.div
            className="absolute -inset-0.5 rounded ring-2 ring-blue-400/50 pointer-events-none z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
        )}
      </AnimatePresence>

      {/* Animated label */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            className="absolute -top-6 left-0 bg-blue-600 text-white text-xs px-2 py-1 rounded-t z-10"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {elementId}
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </motion.div>
  );
}

/**
 * PreviewHeader
 */
function PreviewHeader({
  elementConfig,
  isSelected,
  onSelect,
}: {
  elementConfig: ElementConfig;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <PreviewSection
      elementId="header"
      isSelected={isSelected}
      onSelect={onSelect}
      elementConfig={elementConfig}
      className="flex items-center justify-between px-6 py-4"
    >
      <div className="flex items-center gap-4">
        <div className="text-2xl font-bold">UNS</div>
        <nav className="flex gap-4 text-sm">
          <span className="opacity-70 hover:opacity-100 transition-opacity">Home</span>
          <span className="opacity-70 hover:opacity-100 transition-opacity">Candidates</span>
          <span className="opacity-70 hover:opacity-100 transition-opacity">Employees</span>
          <span className="opacity-70 hover:opacity-100 transition-opacity">Reports</span>
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary/20"></div>
      </div>
    </PreviewSection>
  );
}

/**
 * PreviewSidebar
 */
function PreviewSidebar({
  elementConfig,
  isSelected,
  onSelect,
  deviceMode,
}: {
  elementConfig: ElementConfig;
  isSelected: boolean;
  onSelect: (id: string) => void;
  deviceMode: string;
}) {
  if (deviceMode === 'mobile') return null;

  const menuItems = [
    { icon: '📊', label: 'Dashboard' },
    { icon: '👤', label: 'Candidates' },
    { icon: '👥', label: 'Employees' },
    { icon: '🏭', label: 'Factories' },
    { icon: '⏰', label: 'Timer Cards' },
    { icon: '💰', label: 'Salary' },
    { icon: '📝', label: 'Requests' },
    { icon: '📈', label: 'Reports' },
    { icon: '⚙️', label: 'Settings' },
  ];

  return (
    <PreviewSection
      elementId="sidebar"
      isSelected={isSelected}
      onSelect={onSelect}
      elementConfig={elementConfig}
      className={cn(
        'flex flex-col gap-1 py-4',
        deviceMode === 'tablet' ? 'w-16' : 'w-64'
      )}
    >
      {menuItems.map((item, index) => (
        <div
          key={index}
          className="flex items-center gap-3 px-4 py-2 opacity-70 hover:opacity-100 transition-opacity"
        >
          <span className="text-xl">{item.icon}</span>
          {deviceMode !== 'tablet' && (
            <span className="text-sm">{item.label}</span>
          )}
        </div>
      ))}
    </PreviewSection>
  );
}

/**
 * PreviewMain
 */
function PreviewMain({
  elementConfig,
  cardConfig,
  isSelected,
  onSelect,
}: {
  elementConfig: ElementConfig;
  cardConfig: ElementConfig;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <PreviewSection
      elementId="main"
      isSelected={isSelected}
      onSelect={onSelect}
      elementConfig={elementConfig}
      className="flex-1 p-6 overflow-auto"
    >
      <h1 className="text-3xl font-bold mb-6">Main Content Area</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((index) => (
          <div
            key={index}
            style={applyElementStyles(cardConfig)}
            className="p-4 transition-shadow hover:shadow-lg"
          >
            <div className="w-full h-32 bg-muted rounded mb-3"></div>
            <h3 className="font-semibold mb-2">Card Title {index}</h3>
            <p className="text-sm opacity-70">
              This is a sample card to demonstrate theme styling.
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Dashboard Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Total', 'Active', 'Pending', 'Completed'].map((stat) => (
            <div
              key={stat}
              style={applyElementStyles(cardConfig)}
              className="p-4 text-center"
            >
              <div className="text-2xl font-bold mb-1">123</div>
              <div className="text-sm opacity-70">{stat}</div>
            </div>
          ))}
        </div>
      </div>
    </PreviewSection>
  );
}

/**
 * PreviewFooter
 */
function PreviewFooter({
  elementConfig,
  isSelected,
  onSelect,
}: {
  elementConfig: ElementConfig;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <PreviewSection
      elementId="footer"
      isSelected={isSelected}
      onSelect={onSelect}
      elementConfig={elementConfig}
      className="flex items-center justify-between px-6 py-4 text-sm"
    >
      <div className="opacity-70">
        © 2025 UNS-ClaudeJP
      </div>
      <div className="flex gap-4 opacity-70">
        <span className="hover:opacity-100 transition-opacity cursor-pointer">Privacy</span>
        <span className="hover:opacity-100 transition-opacity cursor-pointer">Terms</span>
        <span className="hover:opacity-100 transition-opacity cursor-pointer">Help</span>
      </div>
    </PreviewSection>
  );
}

/**
 * Main EditorCanvas Component
 */
export function EditorCanvas({
  className,
  deviceMode = 'desktop',
  showGrid = false,
  scale = 0.7,
}: EditorCanvasProps) {
  const { currentTheme, selectedElement, selectElement } = useThemeStore();

  // Device dimensions
  const deviceDimensions = {
    desktop: { width: 1440, height: 900 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 812 },
  };

  const dimensions = deviceDimensions[deviceMode];

  // Apply theme colors as CSS variables
  const themeStyles = applyThemeColors(currentTheme.colors);

  return (
    <div
      className={cn(
        'flex items-center justify-center p-8 overflow-auto',
        showGrid && 'bg-grid-pattern',
        className
      )}
      style={{
        background: showGrid
          ? 'linear-gradient(0deg, transparent 24%, rgba(0, 0, 0, .05) 25%, rgba(0, 0, 0, .05) 26%, transparent 27%, transparent 74%, rgba(0, 0, 0, .05) 75%, rgba(0, 0, 0, .05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 0, 0, .05) 25%, rgba(0, 0, 0, .05) 26%, transparent 27%, transparent 74%, rgba(0, 0, 0, .05) 75%, rgba(0, 0, 0, .05) 76%, transparent 77%, transparent)'
          : undefined,
        backgroundSize: showGrid ? '50px 50px' : undefined,
      }}
    >
      <motion.div
        key={deviceMode}
        className="device-frame origin-center shadow-2xl"
        data-device={deviceMode}
        style={{
          width: dimensions.width,
          height: dimensions.height,
          ...themeStyles,
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: scale }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{
          duration: 0.3,
          ease: 'easeInOut',
          scale: { type: 'spring', stiffness: 300, damping: 30 }
        }}
      >
        <motion.div
          className="preview-layout flex flex-col h-full overflow-hidden rounded-lg border-2 border-border"
          layout
          transition={{ duration: 0.2 }}
        >
          <PreviewHeader
            elementConfig={currentTheme.layout.header}
            isSelected={selectedElement === 'header'}
            onSelect={selectElement}
          />

          <div className="flex flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {deviceMode !== 'mobile' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <PreviewSidebar
                    elementConfig={currentTheme.layout.sidebar}
                    isSelected={selectedElement === 'sidebar'}
                    onSelect={selectElement}
                    deviceMode={deviceMode}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <PreviewMain
              elementConfig={currentTheme.layout.main}
              cardConfig={currentTheme.layout.card}
              isSelected={selectedElement === 'main'}
              onSelect={selectElement}
            />
          </div>

          <PreviewFooter
            elementConfig={currentTheme.layout.footer}
            isSelected={selectedElement === 'footer'}
            onSelect={selectElement}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
