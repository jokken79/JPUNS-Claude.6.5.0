'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface NavigationContextType {
  isNavigating: boolean;
  startNavigation: () => void;
  completeNavigation: () => void;
  navigationProgress: number;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationProgress, setNavigationProgress] = useState(0);

  const startNavigation = useCallback(() => {
    setIsNavigating(true);
    setNavigationProgress(0);
    
    // Simulate progress
    const interval = setInterval(() => {
      setNavigationProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 100);
  }, []);

  const completeNavigation = useCallback(() => {
    setNavigationProgress(100);
    setTimeout(() => {
      setIsNavigating(false);
      setNavigationProgress(0);
    }, 200);
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        isNavigating,
        startNavigation,
        completeNavigation,
        navigationProgress,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
