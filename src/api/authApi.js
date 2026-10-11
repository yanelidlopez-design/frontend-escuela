import axiosClient from './axiosClient';

export const authApi = {
  login: async (username, password) => {
    try {
      const response = await axiosClient.post('/token/', { username, password });
      if (response.data.access) {
        localStorage.setItem('access_token', response.data.access);
        if (response.data.refresh) {
          localStorage.setItem('refresh_token', response.data.refresh);
        }
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
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
  }
};
