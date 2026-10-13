import axios from 'axios';

const BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/'

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: true, // Enable cookies to be sent with requests
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor de Peticiones: adjunta el access token como Bearer cuando
// existe en localStorage (refuerza el envío de cookies en dev cross-origin,
// donde SameSite=Lax impide que la cookie viaje en XHR).
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      if (typeof config.headers?.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Respuestas: Renovación Automática JWT (401)
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Evitar bucles infinitos en solicitudes de autenticación
    if (!error.response || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Rutas de auth relativas al baseURL ('/api/'): no deben disparar refresh.
    // '/token/' está contenido en '/token/refresh/', por eso la lista simple basta.
    const urlRelativa = originalRequest.url || '';
    const isAuthEndpoint = ['/token/', '/core/token/', '/core/logout/'].some(
      (ruta) => urlRelativa.includes(ruta)
    );

    if (error.response.status === 401 && !isAuthEndpoint) {
      if (isRefreshing) {
        // Si ya hay una solicitud de refresh en proceso, encolar la petición actual
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        isRefreshing = false;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        window.dispatchEvent(new Event('auth:unauthorized'));
        return Promise.reject(error);
      }

      try {
        // Solicitud POST /token/refresh/ (MiTokenRefreshView: valida contra
        // core.Usuarios y setea la cookie access_token; el body trae el access)
        const response = await axios.post(`${BASE_URL}token/refresh/`, {
          refresh: refreshToken,
        });

        if (response.data.access) {
          localStorage.setItem('access_token', response.data.access);
        }
        if (response.data.refresh) {
          localStorage.setItem('refresh_token', response.data.refresh);
        }

        processQueue(null);
        isRefreshing = false;

        return axiosClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        window.dispatchEvent(new Event('auth:unauthorized'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
