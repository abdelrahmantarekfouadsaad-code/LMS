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
    
    // If 401 Unauthorized and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const session = await getSession();

      if (session?.refreshToken) {
        try {
          // Attempt to refresh the token directly via Django
          const response = await axios.post(`${DJANGO_API}/auth/token/refresh/`, {
            refresh: session.refreshToken
          });
          
          if (response.data.access) {
            // In a complete implementation, you'd need to force NextAuth to update its JWT session here
            // NextAuth token rotation is complex client-side; usually handled in the `jwt` callback instead.
            // For now, we update the axios header and retry.
            originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error("Token refresh failed. Forcing logout.");
          clearSessionAndRedirect();
        }
      } else {
        clearSessionAndRedirect();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
