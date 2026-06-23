/**
 * Main App Controller
 */
const App = {
  currentPage: 'home',
  
  init() {
    this.bindNavigation();
    this.hideLoading();
    this.navigateTo('home');
  },

  hideLoading() {
    setTimeout(() => {
      document.getElementById('loading-screen').classList.add('hidden');
    }, 800);
  },

  bindNavigation() {
    // Bottom nav
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        this.navigateTo(page);
      });
    });

    // FAB button
    document.getElementById('fab-booking').addEventListener('click', () => {
      this.navigateTo('booking');
    });
  },

  navigateTo(page, data = {}) {
    this.currentPage = page;
    
    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === page);
    });

    // Show/hide FAB
    const fab = document.getElementById('fab-booking');
    fab.classList.toggle('hidden', page === 'booking');

    // Render page
    const content = document.getElementById('main-content');
    
    switch (page) {
      case 'home':
        HomePage.render(content);
        break;
      case 'booking':
        BookingPage.render(content, data);
        break;
      case 'my-bookings':
        MyBookingsPage.render(content);
        break;
      default:
        HomePage.render(content);
    }

    // Scroll to top
    window.scrollTo(0, 0);
  },

  // Toast notifications
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    
    toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  // Format price
  formatPrice(price) {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  },

  // Format date
  formatDateDisplay(dateStr) {
    const date = new Date(dateStr);
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    return date.toLocaleDateString('vi-VN', options);
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
