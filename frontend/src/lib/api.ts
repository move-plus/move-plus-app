const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = {
  async fetch(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('supabase.auth.token'); // ou de onde você guarda o token
    
    const response = await fetch(`${API_URL}${endpoint}`, {
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

    return response.json();
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