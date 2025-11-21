'use client';

import React from 'react';
import { useFontsStore, getAvailableFonts, getFontDisplayName, FontType, FontVariant } from '@/stores/fonts-store';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

export function FontsSettings() {
  const {
    fontBody,
    fontHeading,
    fontUI,
    fontJapanese,
    baseFontSize,
    headingScale,
    setFontBody,
    setFontHeading,
    setFontUI,
    setFontJapanese,
    setBaseFontSize,
    setHeadingScale,
    reset,
  } = useFontsStore();

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    // Apply fonts on mount
    useFontsStore.getState().applyFonts();
  }, []);

  if (!mounted) return null;

  const FontSelector = ({
    label,
    value,
    onChange,
    category,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    category: FontType;
  }) => {
    const availableFonts = getAvailableFonts(category);

    return (
      <div className="space-y-2">
        <Label className="text-sm font-semibold">{label}</Label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableFonts.map((font) => (
              <SelectItem key={font} value={font}>
                {getFontDisplayName(font)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Configuración de Fonts</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={reset}
          className="gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Restaurar Defaults
        </Button>
      </div>

      {/* Font Selection */}
      <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
          Seleccionar Fonts
        </h3>

        <FontSelector
          label="Font para Cuerpo de Texto (Español)"
          value={fontBody}
          onChange={(value) => setFontBody(value as FontVariant)}
          category="body"
        />

        <FontSelector
          label="Font para Títulos"
          value={fontHeading}
          onChange={(value) => setFontHeading(value as FontVariant)}
          category="heading"
        />

        <FontSelector
          label="Font para UI/Interfaz"
          value={fontUI}
          onChange={(value) => setFontUI(value as FontVariant)}
          category="ui"
        />

        <FontSelector
          label="Font para Texto Japonés (日本語)"
          value={fontJapanese}
          onChange={(value) => setFontJapanese(value as FontVariant)}
          category="japanese"
        />
      </div>

      {/* Font Size Settings */}
      <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
          Tamaño de Fonts
        </h3>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-sm">Tamaño Base: {baseFontSize}px</Label>
            <span className="text-xs text-muted-foreground">12 - 24 px</span>
          </div>
          <Slider
            value={[baseFontSize]}
            onValueChange={(value) => setBaseFontSize(value[0])}
            min={12}
            max={24}
            step={1}
            className="w-full"
          />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-sm">Escala de Títulos: {headingScale.toFixed(1)}x</Label>
            <span className="text-xs text-muted-foreground">0.8 - 1.5 x</span>
          </div>
          <Slider
            value={[headingScale]}
            onValueChange={(value) => setHeadingScale(value[0])}
            min={0.8}
            max={1.5}
            step={0.05}
            className="w-full"
          />
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
          Vista Previa
        </h3>

        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Cuerpo (Body) - Español</p>
            <p className="font-sans">
              El rápido zorro marrón salta sobre el perro perezoso. Lorem ipsum dolor sit amet.
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Títulos (Heading)</p>
            <h2 className="font-heading text-xl font-semibold">
              Este es un Título de Ejemplo
            </h2>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Japonés (Japanese)</p>
            <p className="font-japanese">
              これはサンプルのテキストです。日本語のフォント設定をテストしています。素晴らしいですね！
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Mixto (Mixed) - Español + Japonés</p>
            <p className="font-sans">
              Hola <span className="font-japanese">こんにちは</span> ¡Bienvenido!{' '}
              <span className="font-japanese">ようこそ！</span>
            </p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-muted-foreground space-y-2 p-3 bg-muted/30 rounded border">
        <p>
          💡 <strong>Tip:</strong> Los cambios se guardan automáticamente en tu navegador.
        </p>
        <p>
          🇯🇵 <strong>Fonts Japoneses:</strong> Noto Sans JP es ideal para textos en japonés con excelente legibilidad.
        </p>
        <p>
          🇪🇸 <strong>Fonts Españoles:</strong> Manrope e Inter son perfectos para contenido en español.
        </p>
      </div>
    </div>
  );
}
