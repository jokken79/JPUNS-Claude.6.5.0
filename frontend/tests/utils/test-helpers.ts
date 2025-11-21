/**
 * Test utilities and helpers for UNS-ClaudeJP frontend tests
 * Provides common testing utilities, mock factories, and custom render functions
 */

import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

/**
 * Create a test QueryClient with retry disabled for faster tests
 */
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });

/**
 * Custom render function that includes common providers
 */
export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

export const renderWithProviders = (
  ui: ReactElement,
  options?: CustomRenderOptions
) => {
  const queryClient = options?.queryClient || createTestQueryClient();

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    queryClient,
  };
};

/**
 * Mock fetch with custom response
 */
export const mockFetch = (data: any, status: number = 200) => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
      headers: new Headers(),
      redirected: false,
      type: 'basic' as ResponseType,
      url: '',
      clone: () => ({}) as Response,
      body: null,
      bodyUsed: false,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      blob: () => Promise.resolve(new Blob()),
      formData: () => Promise.resolve(new FormData()),
    } as Response)
  );
};

/**
 * Mock fetch error
 */
export const mockFetchError = (error: string = 'Network error') => {
  global.fetch = vi.fn(() => Promise.reject(new Error(error)));
};

/**
 * Wait for a condition to be true
 */
export const waitForCondition = async (
  condition: () => boolean,
  timeout: number = 3000
): Promise<void> => {
  const startTime = Date.now();
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Condition not met within timeout');
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
};

/**
 * Create mock router for Next.js navigation
 */
export const createMockRouter = (overrides?: Partial<any>) => ({
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  route: '/',
  ...overrides,
});

/**
 * Create mock search params
 */
export const createMockSearchParams = (params: Record<string, string> = {}) => {
  const searchParams = new URLSearchParams(params);
  return searchParams;
};

/**
 * Simulate user typing with delay
 */
export const typeWithDelay = async (
  element: HTMLElement,
  text: string,
  delay: number = 10
) => {
  for (const char of text) {
    element.dispatchEvent(new Event('input', { bubbles: true }));
    (element as HTMLInputElement).value += char;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
};

/**
 * Create mock file for file upload tests
 */
export const createMockFile = (
  name: string = 'test.txt',
  size: number = 1024,
  type: string = 'text/plain'
): File => {
  const blob = new Blob(['test content'.repeat(size / 12)], { type });
  return new File([blob], name, { type });
};

/**
 * Create mock FileList for file input tests
 */
export const createMockFileList = (files: File[]): FileList => {
  const fileList = {
    length: files.length,
    item: (index: number) => files[index] || null,
    *[Symbol.iterator]() {
      yield* files;
    },
  };
  return fileList as FileList;
};

/**
 * Assert error message is shown
 */
export const expectErrorMessage = async (
  getByText: any,
  message: string | RegExp
) => {
  const errorElement = await getByText(message);
  expect(errorElement).toBeInTheDocument();
  expect(errorElement).toBeVisible();
};

/**
 * Assert loading state is shown
 */
export const expectLoadingState = (container: HTMLElement) => {
  const loadingElements = container.querySelectorAll('[aria-busy="true"]');
  expect(loadingElements.length).toBeGreaterThan(0);
};

/**
 * Create mock intersection observer for lazy loading tests
 */
export const createMockIntersectionObserver = () => {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | null = null;
    readonly rootMargin: string = '';
    readonly thresholds: ReadonlyArray<number> = [];

    constructor(
      public callback: IntersectionObserverCallback,
      public options?: IntersectionObserverInit
    ) {}

    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn(() => []);
  }

  global.IntersectionObserver = MockIntersectionObserver as any;
};

/**
 * Create mock ResizeObserver for responsive component tests
 */
export const createMockResizeObserver = () => {
  class MockResizeObserver implements ResizeObserver {
    constructor(public callback: ResizeObserverCallback) {}

    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }

  global.ResizeObserver = MockResizeObserver as any;
};

/**
 * Local storage mock
 */
export const createLocalStorageMock = () => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    },
  };
};

/**
 * Session storage mock
 */
export const createSessionStorageMock = createLocalStorageMock;

/**
 * Mock clipboard API
 */
export const createMockClipboard = () => ({
  writeText: vi.fn(() => Promise.resolve()),
  readText: vi.fn(() => Promise.resolve('mocked clipboard text')),
});

/**
 * Mock geolocation API
 */
export const createMockGeolocation = () => ({
  getCurrentPosition: vi.fn((success) =>
    success({
      coords: {
        latitude: 35.6762,
        longitude: 139.6503,
        accuracy: 100,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    })
  ),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
});

export default {
  createTestQueryClient,
  renderWithProviders,
  mockFetch,
  mockFetchError,
  waitForCondition,
  createMockRouter,
  createMockSearchParams,
  typeWithDelay,
  createMockFile,
  createMockFileList,
  expectErrorMessage,
  expectLoadingState,
  createMockIntersectionObserver,
  createMockResizeObserver,
  createLocalStorageMock,
  createSessionStorageMock,
  createMockClipboard,
  createMockGeolocation,
};
