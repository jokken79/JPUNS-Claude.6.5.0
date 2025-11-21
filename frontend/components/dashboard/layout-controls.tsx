'use client';

import { Button } from '@/components/ui/button';
import { useLayoutStore } from '@/stores/layout-store';
import { Maximize2, Minimize2, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LayoutControls() {
  const { contentWidth, paddingMultiplier, setContentWidth, setPaddingMultiplier } = useLayoutStore();

  const widthOptions = [
    { value: 'compact' as const, label: 'Compacto', icon: Minimize2 },
    { value: 'auto' as const, label: 'Normal (Recomendado)', icon: Settings },
    { value: 'full' as const, label: 'Ancho Completo', icon: Maximize2 },
  ];

  const currentWidthLabel = widthOptions.find(opt => opt.value === contentWidth)?.label || 'Normal';

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 h-9 border-border bg-background hover:bg-accent hover:text-accent-foreground"
            title="Ajustar ancho del contenido"
          >
            {contentWidth === 'full' && <Maximize2 className="h-4 w-4" />}
            {contentWidth === 'auto' && <Settings className="h-4 w-4" />}
            {contentWidth === 'compact' && <Minimize2 className="h-4 w-4" />}
            <span className="text-xs hidden sm:inline">
              {currentWidthLabel}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-xs font-semibold">
            Ancho del Contenido
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {widthOptions.map(option => {
            const Icon = option.icon;
            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setContentWidth(option.value)}
                className={contentWidth === option.value ? 'bg-primary/10' : ''}
              >
                <Icon className="h-4 w-4 mr-2" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{option.label}</div>
                  {option.value === 'compact' && (
                    <div className="text-xs text-muted-foreground">Max 896px</div>
                  )}
                  {option.value === 'auto' && (
                    <div className="text-xs text-muted-foreground">Max 1280px</div>
                  )}
                  {option.value === 'full' && (
                    <div className="text-xs text-muted-foreground">100% del ancho</div>
                  )}
                </div>
                {contentWidth === option.value && (
                  <motion.div
                    className="h-2 w-2 rounded-full bg-primary"
                    layoutId="activeWidthIndicator"
                  />
                )}
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs font-semibold">
            Espaciado (Padding)
          </DropdownMenuLabel>
          {([0.5, 1, 1.5, 2, 3] as const).map(multiplier => (
            <DropdownMenuItem
              key={multiplier}
              onClick={() => setPaddingMultiplier(multiplier)}
              className={paddingMultiplier === multiplier ? 'bg-primary/10' : ''}
            >
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {multiplier === 0.5 && 'Muy Pequeño'}
                  {multiplier === 1 && 'Pequeño'}
                  {multiplier === 1.5 && 'Normal'}
                  {multiplier === 2 && 'Grande'}
                  {multiplier === 3 && 'Muy Grande'}
                </div>
              </div>
              {paddingMultiplier === multiplier && (
                <motion.div
                  className="h-2 w-2 rounded-full bg-primary"
                  layoutId="activePaddingIndicator"
                />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
