/**
 * My Bookings Page - Lookup & Cancel
 */
const MyBookingsPage = {
  bookings: [],
  phone: '',
  loaded: false,

  render(container) {
    container.innerHTML = this.getHTML();
    this.bindEvents();
  },

  getHTML() {
    return `
      <div class="my-bookings-page page">
        <div class="booking-header">
          <h1 class="booking-page-title">Lịch hẹn của tôi</h1>
        </div>

        <div class="phone-input-section">
          <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:12px;">
            Nhập số điện thoại để xem lịch hẹn
          </p>
          <div class="phone-input-group">
            <input type="tel" class="form-input" id="lookup-phone" 
                   placeholder="0901 234 567" value="${this.phone}">
            <button class="btn-primary" id="btn-lookup">Tìm</button>
          </div>
        </div>

        ${this.loaded ? this.renderBookingsList() : ''}
      </div>
    `;
  },

  renderBookingsList() {
    if (this.bookings.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon"><i class="fas fa-calendar-xmark"></i></div>
          <p class="empty-state-text">Không tìm thấy lịch hẹn nào</p>
        </div>
      `;
    }

    const statusLabels = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      completed: 'Hoàn tất',
      cancelled: 'Đã hủy'
    };

    return `
      <div class="bookings-list">
        ${this.bookings.map(booking => {
          const canCancel = this.canCancelBooking(booking);
          return `
            <div class="booking-card">
              <div class="booking-card-header">
                <span class="booking-card-date">${App.formatDateDisplay(booking.date)}</span>
                <span class="booking-status ${booking.status}">${statusLabels[booking.status] || booking.status}</span>
              </div>
              <div class="booking-card-body">
                <div class="booking-card-services">${booking.service_names || 'Dịch vụ'}</div>
                <div class="booking-card-time">
                  <i class="far fa-clock"></i> ${booking.start_time} - ${booking.end_time}
                </div>
              </div>
              ${canCancel ? `
                <div class="booking-card-footer">
                  <button class="btn-cancel" data-id="${booking.booking_id}">Hủy lịch</button>
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  canCancelBooking(booking) {
    if (booking.status !== 'pending' && booking.status !== 'confirmed') return false;
    
    const bookingDateTime = new Date(booking.date + 'T' + booking.start_time + ':00');
    const now = new Date();
    const hoursUntil = (bookingDateTime - now) / (1000 * 60 * 60);
    
    return hoursUntil >= APP_CONFIG.CANCEL_HOURS_LIMIT;
  },

  bindEvents() {
    const lookupBtn = document.getElementById('btn-lookup');
    const phoneInput = document.getElementById('lookup-phone');

    if (lookupBtn) {
      lookupBtn.addEventListener('click', () => this.lookupBookings());
    }

    if (phoneInput) {
      phoneInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.lookupBookings();
      });
    }

    // Cancel buttons
    document.querySelectorAll('.btn-cancel').forEach(btn => {
      btn.addEventListener('click', () => {
        this.showCancelModal(btn.dataset.id);
      });
    });
  },

  async lookupBookings() {
    const phone = document.getElementById('lookup-phone').value.trim();
    
    if (!phone || phone.length < 9) {
      App.showToast('Vui lòng nhập số điện thoại hợp lệ', 'error');
      return;
    }

    this.phone = phone;
    
    const result = await API.get('getBookingsByPhone', { phone });
    
    if (result.success) {
      this.bookings = result.data;
      this.loaded = true;
    } else {
      App.showToast(result.error || 'Có lỗi xảy ra', 'error');
      this.bookings = [];
      this.loaded = true;
    }

    const container = document.getElementById('main-content');
    container.innerHTML = this.getHTML();
    this.bindEvents();
  },

  showCancelModal(bookingId) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-icon warning">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h3 class="modal-title">Hủy lịch hẹn?</h3>
        <p class="modal-message">Bạn có chắc muốn hủy lịch hẹn này? Hành động này không thể hoàn tác.</p>
        <div class="modal-actions">
          <button class="btn-modal-cancel" id="modal-cancel">Không</button>
          <button class="btn-modal-confirm" id="modal-confirm">Hủy lịch</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('modal-cancel').addEventListener('click', () => {
      modal.remove();
    });

    document.getElementById('modal-confirm').addEventListener('click', async () => {
      modal.remove();
      await this.cancelBooking(bookingId);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  },

  async cancelBooking(bookingId) {
    const result = await API.post('cancelBookingByCustomer', {
      booking_id: bookingId,
      phone: this.phone
    });

    if (result.success) {
      App.showToast('Đã hủy lịch hẹn', 'success');
      await this.lookupBookings();
    } else {
      App.showToast(result.error || 'Không thể hủy lịch', 'error');
    }
  }
};
