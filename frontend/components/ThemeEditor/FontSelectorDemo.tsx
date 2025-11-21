'use client';

/**
 * Font Selector Demo Component
 *
 * Demonstrates the Google Fonts integration with PropertiesPanel.
 * This component can be used in the theme editor page to test font loading.
 */

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ALL_GOOGLE_FONTS,
  loadGoogleFont,
  isFontLoaded,
  getFontStats,
  FONT_PAIRINGS,
  getRandomFontPairing,
} from '@/utils/googleFonts';

export function FontSelectorDemo() {
  const [selectedFont, setSelectedFont] = React.useState('Inter');
  const [loading, setLoading] = React.useState(false);
  const [stats, setStats] = React.useState(getFontStats());

  // Handle font selection with loading
  const handleFontSelect = async (font: string) => {
    setLoading(true);
    try {
      await loadGoogleFont(font);
      setSelectedFont(font);
      setStats(getFontStats());
    } catch (error) {
      console.error('Error loading font:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply random font pairing
  const applyRandomPairing = async () => {
    const pairing = getRandomFontPairing();
    setLoading(true);
    try {
      await Promise.all([
        loadGoogleFont(pairing.heading),
        loadGoogleFont(pairing.body),
      ]);
      setSelectedFont(pairing.heading);
      setStats(getFontStats());
    } catch (error) {
      console.error('Error loading font pairing:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Google Fonts Integration Demo</CardTitle>
          <CardDescription>
            Test the dynamic Google Fonts loading system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Font Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.totalAvailable}</div>
                <div className="text-xs text-muted-foreground">Available Fonts</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.loaded}</div>
                <div className="text-xs text-muted-foreground">Loaded Fonts</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.loading}</div>
                <div className="text-xs text-muted-foreground">Loading Fonts</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {isFontLoaded(selectedFont) ? '✓' : '⏳'}
                </div>
                <div className="text-xs text-muted-foreground">Current Font</div>
              </CardContent>
            </Card>
          </div>

          {/* Random Pairing Button */}
          <Button onClick={applyRandomPairing} disabled={loading} className="w-full">
            {loading ? 'Loading...' : 'Apply Random Font Pairing'}
          </Button>

          {/* Font Preview */}
          <Card>
            <CardHeader>
              <CardTitle style={{ fontFamily: selectedFont }}>
                {selectedFont}
              </CardTitle>
              <CardDescription>Current Font Preview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4" style={{ fontFamily: selectedFont }}>
              <div className="text-4xl font-bold">
                The Quick Brown Fox
              </div>
              <div className="text-2xl">
                Jumps Over The Lazy Dog
              </div>
              <div className="text-base">
                The quick brown fox jumps over the lazy dog.
                0123456789 !@#$%^&*()
              </div>
              <div className="text-sm text-muted-foreground">
                Pack my box with five dozen liquor jugs.
                The five boxing wizards jump quickly.
              </div>
            </CardContent>
          </Card>

          {/* Font List (First 10) */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Quick Font Selection (First 10)</h3>
            <div className="flex flex-wrap gap-2">
              {ALL_GOOGLE_FONTS.slice(0, 10).map((font) => (
                <Button
                  key={font}
                  variant={selectedFont === font ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFontSelect(font)}
                  disabled={loading}
                >
                  {font}
                  {isFontLoaded(font) && (
                    <Badge variant="secondary" className="ml-1 text-[8px] px-1">
                      ✓
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Font Pairings */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Recommended Font Pairings</h3>
            <div className="grid grid-cols-2 gap-2">
              {FONT_PAIRINGS.slice(0, 4).map((pairing, index) => (
                <Card key={index} className="cursor-pointer hover:border-primary">
                  <CardContent className="pt-4">
                    <div className="text-xs font-semibold mb-2">{pairing.name}</div>
                    <div className="text-xs text-muted-foreground">
                      <div>Heading: {pairing.heading}</div>
                      <div>Body: {pairing.body}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Loaded Fonts List */}
          {stats.loaded > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">
                Loaded Fonts ({stats.loaded})
              </h3>
              <div className="flex flex-wrap gap-2">
                {stats.loadedFonts.map((font) => (
                  <Badge key={font} variant="secondary">
                    {font}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
