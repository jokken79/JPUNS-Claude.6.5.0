'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { authService } from '@/lib/api';

/**
 * Auto-login hook for development mode
 * Automatically logs in as admin using real API
 */
export function useDevAutoLogin() {
  const hasAutoLoggedIn = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      const { login } = useAuthStore.getState();

      if (!hasAutoLoggedIn.current) {
        const doAutoLogin = async () => {
          try {
            console.log('[DEV MODE] Auto-login enabled - logging in as admin');
            
            const response = await authService.login('admin', 'admin123');
            const user = await authService.getCurrentUser(response.access_token);
            
            login(response.access_token, user);
            hasAutoLoggedIn.current = true;
            
            console.log('[DEV MODE] Auto-login successful');
          } catch (error) {
            console.error('[DEV MODE] Auto-login failed:', error);
          }
        };

        doAutoLogin();
      }
    }
  }, []);
}
