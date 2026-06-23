/**
 * API Module - Communication with GAS Backend
 */
const API = {
  async get(action, params = {}) {
    const url = new URL(APP_CONFIG.API_URL);
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        url.searchParams.set(key, val);
      }
    });

    try {
      const response = await fetch(url.toString());
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API GET Error:', error);
      return { success: false, error: 'Không thể kết nối server' };
    }
  },

  async post(action, body = {}) {
    const url = new URL(APP_CONFIG.API_URL);
    url.searchParams.set('action', action);

    try {
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API POST Error:', error);
      return { success: false, error: 'Không thể kết nối server' };
    }
  }
};
