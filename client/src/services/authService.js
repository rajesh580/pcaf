import api from './api';

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('pfac_token', response.data.token);
      localStorage.setItem('pfac_user', JSON.stringify(response.data.user));
      localStorage.setItem('pfac_routing', JSON.stringify(response.data.routing));
    }
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  verifyEmail: async (token) => {
    const response = await api.get(`/auth/verify-email?token=${token}`);
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (data) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('pfac_token');
      localStorage.removeItem('pfac_user');
      localStorage.removeItem('pfac_routing');
    }
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('pfac_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getDashboardRouting: () => {
    const routingStr = localStorage.getItem('pfac_routing');
    return routingStr ? JSON.parse(routingStr) : null;
  }
};
