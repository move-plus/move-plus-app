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
    // Buscar token do Supabase corretamente
    const supabaseAuth = localStorage.getItem('sb-mxegxtsndzuxmxdittgg-auth-token');
    let token = null;
    if (supabaseAuth) {
      try {
        const authData = JSON.parse(supabaseAuth);
        token = authData?.access_token;
      } catch (e) {
        console.error('Error parsing auth token:', e);
      }
    }
    
    const response = await fetch(buildEndpoint(endpoint), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.statusText} - ${errorText}`);
    }

    if (response.status === 204) {
      return { data: null };
    }

    const data = await response.json();
    return { data };
  },

  // Métodos auxiliares
  get: async (endpoint: string) => await api.fetch(endpoint),
  post: async (endpoint: string, data: any) => 
    await api.fetch(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: async (endpoint: string, data: any) => 
    await api.fetch(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: async (endpoint: string) => 
    await api.fetch(endpoint, { method: 'DELETE' }),
};

export default api;