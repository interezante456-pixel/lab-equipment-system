import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Petición: Añadir Bearer Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('lab_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Interceptor de Respuesta: Manejo global de expiración
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Si el error no es de login fallido, limpiar token
      const isLoginRequest = error.config.url.includes('/auth/login');
      if (!isLoginRequest) {
        localStorage.removeItem('lab_token');
        localStorage.removeItem('lab_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
