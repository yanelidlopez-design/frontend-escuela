import axiosClient from './axiosClient';

export const authApi = {
  login: async (username, password) => {
    try {
      // El endpoint real de login es /api/core/token/ (custom_token_obtain:
      // valida contra core.Usuarios y setea la cookie access_token).
      const response = await axiosClient.post('/core/token/', { username, password });
      // Se guarda también el access en localStorage para enviarlo como
      // Bearer (necesario en dev cross-origin, donde la cookie Lax no viaja).
      if (response.data.access) {
        localStorage.setItem('access_token', response.data.access);
      }
      if (response.data.refresh) {
        localStorage.setItem('refresh_token', response.data.refresh);
      }
      return response.data;
    // eslint-disable-next-line eslint/no-useless-catch -- fail-closed intencional: se relanza para que la vista muestre el banner de error
    } catch (error) {
      // Fail-closed: deniega acceso si el servidor no responde o las credenciales son incorrectas.
      // La vista debe manejar el error y mostrar el banner visual indicado.
      throw error;
    }
  },

  refreshToken: async (refresh) => {
    const response = await axiosClient.post('/token/refresh/', { refresh });
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
    }
    return response.data;
  },

  logout: async () => {
    try {
      // Call backend logout endpoint to clear the HttpOnly cookie
      await axiosClient.post('/core/logout/');
    } catch (error) {
      // Continue with cleanup even if backend call fails
      console.error('Logout backend call failed:', error);
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
  }
};
