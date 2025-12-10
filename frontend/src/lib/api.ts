const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const API_PREFIX = '/api';

const buildEndpoint = (endpoint: string) => {
  const normalized = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const withPrefix = normalized.startsWith(API_PREFIX)
    ? normalized
    : `${API_PREFIX}${normalized}`;
  return `${API_URL}${withPrefix}`;
};

export const api = {
  async fetch(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('supabase.auth.token'); // ou de onde você guarda o token
    
    const response = await fetch(buildEndpoint(endpoint), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    if (response.status === 204) {
      return null;
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  },

  // Métodos auxiliares
  get: (endpoint: string) => api.fetch(endpoint),
  post: (endpoint: string, data: any) => 
    api.fetch(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint: string, data: any) => 
    api.fetch(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (endpoint: string) => 
    api.fetch(endpoint, { method: 'DELETE' }),
};

export default api;