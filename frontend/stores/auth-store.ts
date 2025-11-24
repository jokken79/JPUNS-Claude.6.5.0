'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import { clearPermissionCache } from '@/lib/cache/permission-cache';

const AUTH_COOKIE_NAME = 'uns-auth-token';
const parsedMaxAge = Number(process.env.NEXT_PUBLIC_AUTH_TOKEN_MAX_AGE ?? 60 * 60 * 8);
const TOKEN_MAX_AGE_SECONDS = Number.isFinite(parsedMaxAge) && parsedMaxAge > 0 ? parsedMaxAge : 60 * 60 * 8;

const writeAuthCookie = (token: string | null) => {
  if (typeof document === 'undefined') {
    return;
  }

  const isSecureContext = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const secureAttribute = isSecureContext ? '; Secure' : '';

  if (!token) {
    document.cookie = AUTH_COOKIE_NAME + '=; Max-Age=0; Path=/; SameSite=Strict' + secureAttribute;
    return;
  }

  document.cookie = AUTH_COOKIE_NAME + '=' + encodeURIComponent(token) + '; Max-Age=' + TOKEN_MAX_AGE_SECONDS + '; Path=/; SameSite=Strict' + secureAttribute;
};

interface User {
  id: number;
  username: string;
  email?: string;
  role?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setHydrated: (hydrated: boolean) => void;
  rehydrate: () => void;
}

const createStorage = (): StateStorage => {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    };
  }
  localStorage.removeItem('token');
  return localStorage;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isHydrated: false,

      login: (token, user) => {
        console.log('[AUTH_STORE] Setting token and user, isAuthenticated=true');
        
        // Direct localStorage update for immediate persistence
        if (typeof window !== 'undefined') {
          const authData = {
            token,
            user,
            isAuthenticated: true
          };
          localStorage.setItem('auth-storage', JSON.stringify({
            state: authData,
            version: 0
          }));
          console.log('[AUTH_STORE] Saved to localStorage:', { token: token ? token.substring(0, 20) + '...' : null, user: user?.username });
        }
        
        // Also update the in-memory state
        set({ token, user, isAuthenticated: true });
        writeAuthCookie(token);
      },

      logout: () => {
        console.log('[AUTH_STORE] Logging out');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage');
          // Clear all permission cache on logout
          clearPermissionCache();
        }
        writeAuthCookie(null);
        set({ token: null, user: null, isAuthenticated: false });
      },

      setUser: (user) => set({ user }),

      setHydrated: (hydrated) => set({ isHydrated: hydrated }),

      rehydrate: () => {
        const state = get();
        if (state.token) {
          set({ isAuthenticated: true });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(createStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('[AUTH_STORE] Rehydrating:', { 
            token: state.token ? state.token.substring(0, 20) + '...' : null,
            isAuthenticated: state.isAuthenticated,
            user: state.user?.username
          });
          state.setHydrated(true);
          // Ensure isAuthenticated is set if token exists
          if (state.token && !state.isAuthenticated) {
            state.isAuthenticated = true;
          }
        }
      },
    }
  )
);

// Client-side initialization
if (typeof window !== 'undefined') {
  // Ensure hydration happens on mount
  const state = useAuthStore.getState();

  // If token exists but not authenticated, set it
  if (state.token && !state.isAuthenticated) {
    useAuthStore.setState({ isAuthenticated: true });
  }

  // Set hydrated flag if not already set by onRehydrateStorage
  if (!state.isHydrated) {
    useAuthStore.setState({ isHydrated: true });
  }
}
