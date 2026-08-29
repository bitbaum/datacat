'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

interface UseApiRequestOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

interface UseApiRequestReturn<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (url: string, options?: RequestInit) => Promise<T | null>;
  reset: () => void;
}

export function useApiRequest<T = any>(options: UseApiRequestOptions = {}): UseApiRequestReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const execute = useCallback(
    async (url: string, requestOptions: RequestInit = {}): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          ...requestOptions.headers,
        };

        if (token) {
          (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
          ...requestOptions,
          headers,
        });

        const result: ApiResponse<T> = await response.json();

        if (!response.ok || !result.success) {
          const errorMessage = result.message || `HTTP error! status: ${response.status}`;
          setError(errorMessage);
          options.onError?.(errorMessage);
          return null;
        }

        const responseData = result.data ?? (result as T);
        setData(responseData);
        options.onSuccess?.(responseData);
        return responseData;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Network error';
        setError(errorMessage);
        options.onError?.(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}

// Convenience hooks for common HTTP methods
export function useGet<T = any>(options: UseApiRequestOptions = {}) {
  const apiRequest = useApiRequest<T>(options);

  const get = useCallback(
    (url: string) => {
      return apiRequest.execute(url, { method: 'GET' });
    },
    [apiRequest],
  );

  return { ...apiRequest, get };
}

export function usePost<T = any>(options: UseApiRequestOptions = {}) {
  const apiRequest = useApiRequest<T>(options);

  const post = useCallback(
    (url: string, body?: any) => {
      return apiRequest.execute(url, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      });
    },
    [apiRequest],
  );

  return { ...apiRequest, post };
}

export function usePut<T = any>(options: UseApiRequestOptions = {}) {
  const apiRequest = useApiRequest<T>(options);

  const put = useCallback(
    (url: string, body?: any) => {
      return apiRequest.execute(url, {
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
      });
    },
    [apiRequest],
  );

  return { ...apiRequest, put };
}

export function useDelete<T = any>(options: UseApiRequestOptions = {}) {
  const apiRequest = useApiRequest<T>(options);

  const del = useCallback(
    (url: string) => {
      return apiRequest.execute(url, { method: 'DELETE' });
    },
    [apiRequest],
  );

  return { ...apiRequest, delete: del };
}
