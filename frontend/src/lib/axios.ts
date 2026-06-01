import axios from 'axios';
import { getSession, signOut } from 'next-auth/react';
import { DJANGO_API } from './api-config';

const api = axios.create({
  baseURL: DJANGO_API,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    // Note: getSession works well on the client side.
    // For server components, you'd extract the token using getServerSession.
    const session = await getSession();
    
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const clearSessionAndRedirect = () => {
  console.warn("Forcing logout and session cleanup...");
  if (typeof window !== 'undefined') {
    localStorage.clear();
    sessionStorage.clear();
  }
  signOut({ callbackUrl: '/login' });
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 Unauthorized
    if (error.response?.status === 401) {
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        const session = await getSession();

        if (session?.refreshToken) {
          try {
            // Attempt to refresh the token directly via Django
            const response = await axios.post(`${DJANGO_API}/auth/token/refresh/`, {
              refresh: session.refreshToken
            });
            
            if (response.data.access) {
              // Retry the original request with the new access token
              originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
              return api(originalRequest);
            }
          } catch (refreshError) {
            console.error("Token refresh failed. Forcing logout.");
            clearSessionAndRedirect();
            return Promise.reject(error);
          }
        } else {
          console.warn("No refresh token found. Forcing logout.");
          clearSessionAndRedirect();
          return Promise.reject(error);
        }
      } else {
        // We already retried and still got a 401. Session is permanently invalid.
        console.error("Permanent 401 unauthorized encountered after retry. Forcing logout.");
        clearSessionAndRedirect();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
