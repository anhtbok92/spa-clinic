/**
 * Admin API Module
 */
const AdminAPI = {
  getToken() {
    return localStorage.getItem('admin_token') || '';
  },

  async get(action, params = {}) {
    const url = new URL(ADMIN_CONFIG.API_URL);
    url.searchParams.set('action', action);
    url.searchParams.set('token', this.getToken());
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        url.searchParams.set(key, val);
      }
    });

    try {
      const response = await fetch(url.toString());
      const data = await response.json();
      if (data.code === 401) {
        AdminApp.logout();
      }
      return data;
    } catch (error) {
      console.error('API GET Error:', error);
      return { success: false, error: 'Không thể kết nối server' };
    }
  },

  async post(action, body = {}) {
    const url = new URL(ADMIN_CONFIG.API_URL);
    url.searchParams.set('action', action);

    body.token = this.getToken();

    try {
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (data.code === 401) {
        AdminApp.logout();
      }
      return data;
    } catch (error) {
      console.error('API POST Error:', error);
      return { success: false, error: 'Không thể kết nối server' };
    }
  }
};
