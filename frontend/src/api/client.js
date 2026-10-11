import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token (skip for public auth endpoints)
api.interceptors.request.use(
  (config) => {
    const isPublicAuth = config.url?.includes('/api/auth/login') ||
                         config.url?.includes('/api/auth/register') ||
                         config.url?.includes('/api/auth/departments');

    if (!isPublicAuth) {
      const token = localStorage.getItem('sms_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized & Normalize Errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      const status = error.response.status;

      // Handle 401: Token expired or invalid
      if (status === 401) {
        localStorage.removeItem('sms_token');
        localStorage.removeItem('sms_user');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login?expired=true';
        }
      }

      // Return standardized server error structure
      const errorData = error.response.data;
      const message = errorData?.message || 'An unexpected server error occurred';
      const fieldErrors = errorData?.fieldErrors || null;

      return Promise.reject({
        status,
        message,
        fieldErrors,
        raw: errorData,
      });
    }

    return Promise.reject({
      status: 0,
      message: error.message || 'Network error: could not connect to server',
      fieldErrors: null,
    });
  }
);

export default api;
