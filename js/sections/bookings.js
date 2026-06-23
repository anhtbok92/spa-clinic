/**
 * Bookings Section - Admin
 */
const BookingsSection = {
  bookings: [],
  filterDate: new Date().toISOString().split('T')[0],
  filterStatus: '',
  viewMode: 'list',

  async render(container) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>Đang tải...</p></div>';
    
    await this.loadBookings();
    container.innerHTML = this.getHTML();
    this.bindEvents();
  },

  async loadBookings() {
    const result = await AdminAPI.get('listBookings', {
      date: this.filterDate,
      status: this.filterStatus
    });
    if (result.success) {
      this.bookings = result.data;
    }
  },

  getHTML() {
    const statusLabels = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      completed: 'Hoàn tất',
      cancelled: 'Đã hủy'
    };

    return `
      <div class="section-header">
        <h1 class="section-title">Lịch hẹn</h1>
        <button class="btn btn-primary" id="btn-add-booking">
          <i class="fas fa-plus"></i> Thêm lịch hẹn
        </button>
      </div>

      <div class="filter-bar">
        <input type="date" class="form-input" id="filter-date" value="${this.filterDate}">
        <select id="filter-status">
          <option value="">Tất cả trạng thái</option>
          <option value="pending" ${this.filterStatus === 'pending' ? 'selected' : ''}>Chờ xác nhận</option>
          <option value="confirmed" ${this.filterStatus === 'confirmed' ? 'selected' : ''}>Đã xác nhận</option>
          <option value="completed" ${this.filterStatus === 'completed' ? 'selected' : ''}>Hoàn tất</option>
          <option value="cancelled" ${this.filterStatus === 'cancelled' ? 'selected' : ''}>Đã hủy</option>
        </select>
      </div>

      <div class="stat-cards">
        <div class="stat-card">
          <div class="stat-card-label">Tổng lịch hẹn</div>
          <div class="stat-card-value">${this.bookings.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">Chờ xác nhận</div>
          <div class="stat-card-value" style="color:var(--warning)">${this.bookings.filter(b => b.status === 'pending').length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">Đã xác nhận</div>
          <div class="stat-card-value" style="color:var(--info)">${this.bookings.filter(b => b.status === 'confirmed').length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">Hoàn tất</div>
          <div class="stat-card-value" style="color:var(--success)">${this.bookings.filter(b => b.status === 'completed').length}</div>
        </div>
      </div>

      ${this.bookings.length === 0 ? `
        <div class="empty-state">
          <i class="fas fa-calendar-xmark"></i>
          <p>Không có lịch hẹn nào</p>
        </div>
      ` : `
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Giờ</th>
                <th>Khách hàng</th>
                <th>Dịch vụ</th>
                <th>KTV</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              ${this.bookings.map(b => `
                <tr>
                  <td><strong>${b.start_time} - ${b.end_time}</strong></td>
                  <td>${b.customer_name}<br><small style="color:var(--text-muted)">${b.customer_phone}</small></td>
                  <td>${b.service_names || ''}</td>
                  <td>${b.staff_id || '-'}</td>
                  <td><span class="badge badge-${b.status}">${statusLabels[b.status] || b.status}</span></td>
                  <td>
                    <select class="status-select" data-id="${b.booking_id}" style="padding:4px 8px;border-radius:4px;background:var(--bg-surface);border:1px solid var(--border);color:var(--text);font-size:0.8rem;">
                      <option value="pending" ${b.status === 'pending' ? 'selected' : ''}>Chờ</option>
                      <option value="confirmed" ${b.status === 'confirmed' ? 'selected' : ''}>Xác nhận</option>
                      <option value="completed" ${b.status === 'completed' ? 'selected' : ''}>Hoàn tất</option>
                      <option value="cancelled" ${b.status === 'cancelled' ? 'selected' : ''}>Hủy</option>
                    </select>
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
    // Date filter
    const dateInput = document.getElementById('filter-date');
    if (dateInput) {
      dateInput.addEventListener('change', () => {
        this.filterDate = dateInput.value;
        this.render(document.getElementById('admin-content'));
      });
    }

    // Status filter
    const statusSelect = document.getElementById('filter-status');
    if (statusSelect) {
      statusSelect.addEventListener('change', () => {
        this.filterStatus = statusSelect.value;
        this.render(document.getElementById('admin-content'));
      });
    }

    // Status change
    document.querySelectorAll('.status-select').forEach(select => {
      select.addEventListener('change', async () => {
        const bookingId = select.dataset.id;
        const newStatus = select.value;
        
        const result = await AdminAPI.post('updateBookingStatus', {
          booking_id: bookingId,
          status: newStatus
        });
        
        if (result.success) {
          AdminApp.showToast('Cập nhật trạng thái thành công');
          this.render(document.getElementById('admin-content'));
        } else {
          AdminApp.showToast(result.error || 'Lỗi cập nhật', 'error');
        }
      });
    });

    // Add booking button
    const addBtn = document.getElementById('btn-add-booking');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.showAddBookingModal());
    }
  },

  showAddBookingModal() {
    const html = `
      <h2>Thêm lịch hẹn mới</h2>
      <div class="form-group">
        <label class="form-label">Tên khách</label>
        <input type="text" class="form-input" id="new-bk-name" placeholder="Họ tên khách">
      </div>
      <div class="form-group">
        <label class="form-label">SĐT</label>
        <input type="tel" class="form-input" id="new-bk-phone" placeholder="0901234567">
      </div>
      <div class="form-group">
        <label class="form-label">Ngày</label>
        <input type="date" class="form-input" id="new-bk-date" value="${this.filterDate}">
      </div>
      <div class="form-group">
        <label class="form-label">Giờ bắt đầu</label>
        <input type="time" class="form-input" id="new-bk-time" value="09:00">
      </div>
      <div class="form-group">
        <label class="form-label">Ghi chú</label>
        <input type="text" class="form-input" id="new-bk-note" placeholder="Ghi chú (tùy chọn)">
      </div>
      <div class="modal-actions">
        <button class="btn btn-ghost" onclick="AdminApp.closeModal()">Hủy</button>
        <button class="btn btn-primary" id="btn-save-booking">Lưu</button>
      </div>
    `;
    
    AdminApp.showModal(html);
    
    document.getElementById('btn-save-booking').addEventListener('click', async () => {
      const result = await AdminAPI.post('createBookingByAdmin', {
        name: document.getElementById('new-bk-name').value,
        phone: document.getElementById('new-bk-phone').value,
        date: document.getElementById('new-bk-date').value,
        start_time: document.getElementById('new-bk-time').value,
        service_ids: [],
        staff_id: 'any',
        note: document.getElementById('new-bk-note').value
      });
      
      if (result.success) {
        AdminApp.closeModal();
        AdminApp.showToast('Thêm lịch hẹn thành công');
        this.render(document.getElementById('admin-content'));
      } else {
        AdminApp.showToast(result.error || 'Lỗi', 'error');
      }
    });
  }
};
