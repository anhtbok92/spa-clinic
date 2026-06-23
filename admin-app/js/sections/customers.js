/**
 * Customers Section - Admin
 */
const CustomersSection = {
  customers: [],
  searchQuery: '',

  async render(container) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>Đang tải...</p></div>';
    
    const result = await AdminAPI.get('listCustomers', { search: this.searchQuery });
    if (result.success) {
      this.customers = result.data;
    }
    
    container.innerHTML = this.getHTML();
    this.bindEvents();
  },

  getHTML() {
    return `
      <div class="section-header">
        <h1 class="section-title">Khách hàng</h1>
      </div>

      <div class="filter-bar">
        <input type="text" class="form-input" id="customer-search" 
               placeholder="Tìm theo tên hoặc SĐT..." value="${this.searchQuery}"
               style="flex:1;max-width:300px;">
        <button class="btn btn-primary" id="btn-search-customer">
          <i class="fas fa-search"></i> Tìm
        </button>
      </div>

      ${this.customers.length === 0 ? `
        <div class="empty-state">
          <i class="fas fa-user-group"></i>
          <p>Không tìm thấy khách hàng</p>
        </div>
      ` : `
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tên</th>
                <th>SĐT</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              ${this.customers.map(c => `
                <tr>
                  <td><strong>${c.name}</strong></td>
                  <td>${c.phone}</td>
                  <td>${c.created_at ? new Date(c.created_at).toLocaleDateString('vi-VN') : '-'}</td>
                  <td>
                    <button class="btn btn-ghost btn-sm btn-view-customer" data-phone="${c.phone}">
                      <i class="fas fa-eye"></i> Chi tiết
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    `;
  },

  bindEvents() {
    // Search
    const searchBtn = document.getElementById('btn-search-customer');
    const searchInput = document.getElementById('customer-search');
    
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        this.searchQuery = searchInput.value;
        this.render(document.getElementById('admin-content'));
      });
    }
    
    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.searchQuery = searchInput.value;
          this.render(document.getElementById('admin-content'));
        }
      });
    }

    // View detail
    document.querySelectorAll('.btn-view-customer').forEach(btn => {
      btn.addEventListener('click', () => this.showCustomerDetail(btn.dataset.phone));
    });
  },

  async showCustomerDetail(phone) {
    const result = await AdminAPI.get('getCustomerDetail', { phone });
    
    if (!result.success) {
      AdminApp.showToast(result.error || 'Lỗi tải thông tin', 'error');
      return;
    }

    const customer = result.data;
    const statusLabels = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      completed: 'Hoàn tất',
      cancelled: 'Đã hủy'
    };

    const html = `
      <h2>Thông tin khách hàng</h2>
      <div style="margin-bottom:20px;">
        <p><strong>Tên:</strong> ${customer.name}</p>
        <p><strong>SĐT:</strong> ${customer.phone}</p>
        <p><strong>Tổng lịch hẹn:</strong> ${customer.total_bookings}</p>
        <p><strong>Đã hoàn tất:</strong> ${customer.completed_bookings}</p>
      </div>
      
      <h3 style="font-size:1rem;margin-bottom:12px;">Lịch sử đặt lịch</h3>
      ${customer.bookings.length === 0 ? '<p style="color:var(--text-muted);">Chưa có lịch hẹn</p>' : `
        <div style="max-height:300px;overflow-y:auto;">
          <table class="data-table" style="font-size:0.8rem;">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Giờ</th>
                <th>Dịch vụ</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              ${customer.bookings.map(b => `
                <tr>
                  <td>${b.date}</td>
                  <td>${b.start_time}</td>
                  <td>${b.service_names || '-'}</td>
                  <td><span class="badge badge-${b.status}">${statusLabels[b.status] || b.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
      
      <div class="modal-actions">
        <button class="btn btn-ghost" onclick="AdminApp.closeModal()">Đóng</button>
      </div>
    `;

    AdminApp.showModal(html);
  }
};
