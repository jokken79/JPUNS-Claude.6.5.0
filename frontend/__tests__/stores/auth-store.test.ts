/**
 * Auth Store Unit Tests
 * Tests authentication state management with Zustand
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { mockUser, mockLoginResponse } from '@/tests/fixtures/api-responses';
import { mockFetch, mockFetchError } from '@/tests/utils/test-helpers';

// Mock auth store
import { create } from 'zustand';

interface AuthState {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      set({
        user: data.user,
        token: data.access_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  },

  logout: () => {
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  checkAuth: async () => {
    const { token } = get();
    if (!token) {
      set({ isAuthenticated: false });
      return;
    }

    set({ isLoading: true });
    try {
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Auth check failed');
      }

      const data = await response.json();
      set({
        user: data,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { logout, clearError } = useAuthStore.getState();
    logout();
    clearError();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('has correct initial state', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Login', () => {
    it('sets loading state during login', async () => {
      mockFetch(mockLoginResponse);
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login('test@example.com', 'password');
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('successfully logs in user', async () => {
      mockFetch(mockLoginResponse);
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      expect(result.current.user).toEqual(mockLoginResponse.user);
      expect(result.current.token).toBe(mockLoginResponse.access_token);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('handles login failure', async () => {
      mockFetchError('Login failed');
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'wrongpassword');
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Login failed');
    });

    it('clears previous errors on new login attempt', async () => {
      mockFetchError('First error');
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'wrong1');
      });

      expect(result.current.error).toBe('First error');

      mockFetch(mockLoginResponse);

      await act(async () => {
        await result.current.login('test@example.com', 'correct');
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Logout', () => {
    it('clears user state on logout', async () => {
      mockFetch(mockLoginResponse);
      const { result } = renderHook(() => useAuthStore());

      // Login first
      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('can logout when not authenticated', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Check Auth', () => {
    it('validates existing token', async () => {
      mockFetch(mockUser);
      const { result } = renderHook(() => useAuthStore());

      // Set token first
      useAuthStore.setState({ token: 'valid-token' });

      await act(async () => {
        await result.current.checkAuth();
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('clears auth on invalid token', async () => {
      mockFetchError('Unauthorized');
      const { result } = renderHook(() => useAuthStore());

      // Set invalid token
      useAuthStore.setState({ 
        token: 'invalid-token',
        user: mockUser,
        isAuthenticated: true
      });

      await act(async () => {
        await result.current.checkAuth();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('does nothing when no token present', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.checkAuth();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('clears error', async () => {
      mockFetchError('Test error');
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'wrong');
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('State Persistence', () => {
    it('maintains state across hook rerenders', async () => {
      mockFetch(mockLoginResponse);
      const { result, rerender } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      const userBeforeRerender = result.current.user;

      rerender();

      expect(result.current.user).toEqual(userBeforeRerender);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('Concurrent Operations', () => {
    it('handles multiple login attempts gracefully', async () => {
      mockFetch(mockLoginResponse);
      const { result } = renderHook(() => useAuthStore());

      // Start multiple logins
      const login1 = act(async () => {
        await result.current.login('user1@example.com', 'password1');
      });

      const login2 = act(async () => {
        await result.current.login('user2@example.com', 'password2');
      });

      await Promise.all([login1, login2]);

      // Last login should win
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('Token Management', () => {
    it('stores token on successful login', async () => {
      mockFetch(mockLoginResponse);
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      expect(result.current.token).toBe(mockLoginResponse.access_token);
    });

    it('clears token on logout', async () => {
      mockFetch(mockLoginResponse);
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      expect(result.current.token).toBeTruthy();

      act(() => {
        result.current.logout();
      });

      expect(result.current.token).toBeNull();
    });
  });
});
