export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
}

function extractDetailMessage(data: unknown, fallback: string): string {
  if (data && typeof data === 'object') {
    if ('detail' in data) {
      const detail = (data as { detail: unknown }).detail;

      if (typeof detail === 'string') {
        return detail;
      }

      if (Array.isArray(detail)) {
        const messages = detail
          .map((item) => {
            if (item && typeof item === 'object' && 'msg' in item) {
              const locArray = Array.isArray((item as { loc?: unknown[] }).loc)
                ? (item as { loc: unknown[] }).loc.filter((part) => part !== 'body')
                : [];
              const prefix = locArray.length > 0 ? `${locArray.join('.')}: ` : '';
              return `${prefix}${String((item as { msg: unknown }).msg)}`;
            }
            return typeof item === 'string' ? item : JSON.stringify(item);
          })
          .filter(Boolean);

        if (messages.length > 0) {
          return messages.join(', ');
        }
      }

      if (detail !== null && detail !== undefined) {
        return JSON.stringify(detail);
      }
    }

    if ('message' in data && typeof (data as { message: unknown }).message === 'string') {
      return (data as { message: string }).message;
    }
  }

  return fallback;
}

const BASE_URL = (import.meta.env?.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, body, ...restOptions } = options;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let url = `${BASE_URL}${cleanEndpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  let serializedBody: BodyInit | undefined;
  if (body !== undefined) {
    serializedBody = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const response = await fetch(url, {
    ...restOptions,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    body: serializedBody,
  });

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      try {
        errorData = await response.text();
      } catch {
        errorData = null;
      }
    }

    const message = extractDetailMessage(
      errorData,
      response.statusText || `Request failed with status ${response.status}`
    );

    throw new ApiError(message, response.status, errorData);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return (await response.json()) as T;
}

export const apiClient = {
  get: <T>(endpoint: string, options?: Omit<RequestOptions, 'body' | 'method'>) =>
    request<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'body' | 'method'>) =>
    request<T>(endpoint, { ...options, method: 'POST', body }),
  patch: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'body' | 'method'>) =>
    request<T>(endpoint, { ...options, method: 'PATCH', body }),
  put: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'body' | 'method'>) =>
    request<T>(endpoint, { ...options, method: 'PUT', body }),
  delete: <T = void>(endpoint: string, options?: Omit<RequestOptions, 'body' | 'method'>) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};
