import axiosClient from './axiosClient';

export const authApi = {
  login: async (username, password) => {
    try {
      const response = await axiosClient.post('/core/token/', { username, password });
      if (response.data.access) {
        localStorage.setItem('access_token', response.data.access);
        if (response.data.refresh) {
          localStorage.setItem('refresh_token', response.data.refresh);
        }
      }
      return response.data;
    } catch (error) {
      // Mock login fallback if backend isn't available
      if (!error.response || error.code === 'ERR_NETWORK') {
        console.warn('Backend endpoint no disponible. Modo demostración simulado.');
        const mockResponse = {
          access: 'mock-access-token-jwt-example-' + Date.now(),
          refresh: 'mock-refresh-token-jwt-example-' + Date.now(),
          user: { username, email: `${username}@escuela.edu`, role: 'Administrador' }
        };
        localStorage.setItem('access_token', mockResponse.access);
        localStorage.setItem('refresh_token', mockResponse.refresh);
        return mockResponse;
      }
      throw error;
    }
  },

  refreshToken: async (refresh) => {
    const response = await axiosClient.post('/token/refresh/', { refresh });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
  }
};
