/**
 * Admin App Controller
 */
const AdminApp = {
  currentSection: 'bookings',

  init() {
    if (this.isLoggedIn()) {
      this.showDashboard();
    } else {
      this.showLogin();
    }
    this.bindEvents();
  },

  isLoggedIn() {
    return !!localStorage.getItem('admin_token');
  },

  showLogin() {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');
  },

  showDashboard() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    
    const name = localStorage.getItem('admin_name') || 'Admin';
    document.getElementById('admin-name').textContent = name;
    
    this.navigateTo('bookings');
  },

  bindEvents() {
    // Login form
    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleLogin();
    });

    // Sidebar navigation
    document.querySelectorAll('.sidebar-item').forEach(item => {
      item.addEventListener('click', () => {
        this.navigateTo(item.dataset.section);
      });
    });

    // Logout
    document.getElementById('btn-logout').addEventListener('click', () => {
      this.logout();
    });

    // Mobile menu toggle
    document.getElementById('menu-toggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });
  },

  async handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    const btn = document.querySelector('.btn-login');

    errorEl.textContent = '';
    btn.disabled = true;
    btn.textContent = 'Đang đăng nhập...';

    const url = new URL(ADMIN_CONFIG.API_URL);
    url.searchParams.set('action', 'login');

    try {
      const response = await fetch(url.toString(), {
        method: 'POST',
        body: JSON.stringify({ action: 'login', email, password }),
        redirect: 'follow'
      });
      const result = await response.json();

      if (result.success) {
        localStorage.setItem('admin_token', result.data.token);
        localStorage.setItem('admin_name', result.data.name);
        localStorage.setItem('admin_email', result.data.email);
        this.showDashboard();
      } else {
        errorEl.textContent = result.error || 'Đăng nhập thất bại';
      }
    } catch (err) {
      errorEl.textContent = 'Không thể kết nối server';
    }

    btn.disabled = false;
    btn.textContent = 'Đăng nhập';
  },

  logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_name');
    localStorage.removeItem('admin_email');
    this.showLogin();
  },

  navigateTo(section) {
    this.currentSection = section;

    // Update sidebar active
    document.querySelectorAll('.sidebar-item').forEach(item => {
      item.classList.toggle('active', item.dataset.section === section);
    });

    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');

    // Render section
    const content = document.getElementById('admin-content');
    
    switch (section) {
      case 'bookings':
        BookingsSection.render(content);
        break;
      case 'services':
        ServicesSection.render(content);
        break;
      case 'staff':
        StaffSection.render(content);
        break;
      case 'customers':
        CustomersSection.render(content);
        break;
    }
  },

  showToast(message, type = 'success') {
    const container = document.getElementById('admin-toast');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  formatPrice(price) {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  },

  showModal(html) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div class="modal-box">${html}</div>`;
    document.body.appendChild(overlay);
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
    
    return overlay;
  },

  closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
  }
};

document.addEventListener('DOMContentLoaded', () => AdminApp.init());
