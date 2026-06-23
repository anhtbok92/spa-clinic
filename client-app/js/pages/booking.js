/**
 * Booking Page - Multi-step booking flow
 */
const BookingPage = {
  step: 1,
  services: [],
  selectedServices: [],
  staff: [],
  selectedStaff: 'any',
  selectedDate: '',
  selectedTime: '',
  availableSlots: null,
  customerName: '',
  customerPhone: '',
  note: '',

  async render(container, data = {}) {
    this.step = 1;
    this.selectedServices = [];
    this.selectedStaff = 'any';
    this.selectedDate = '';
    this.selectedTime = '';
    this.customerName = '';
    this.customerPhone = '';
    this.note = '';

    container.innerHTML = this.getLoadingHTML();

    // Load services
    const result = await API.get('getServices');
    if (result.success) {
      this.services = result.data;
    }

    // Pre-select service if coming from home
    if (data.preselectedService) {
      this.selectedServices = [data.preselectedService];
    }

    this.renderStep(container);
  },

  getLoadingHTML() {
    return `
      <div class="booking-page page">
        <div class="booking-header">
          <div class="skeleton" style="width:40px;height:40px;border-radius:50%;"></div>
          <div class="skeleton skeleton-line" style="width:120px;"></div>
        </div>
        <div class="skeleton skeleton-line"></div>
        <div class="skeleton skeleton-card" style="margin-top:16px;"></div>
        <div class="skeleton skeleton-card"></div>
      </div>
    `;
  },

  renderStep(container) {
    if (!container) container = document.getElementById('main-content');
    
    let html = `
      <div class="booking-page page">
        <div class="booking-header">
          ${this.step > 1 ? `<button class="back-btn" id="booking-back"><i class="fas fa-arrow-left"></i></button>` : ''}
          <h1 class="booking-page-title">${this.getStepTitle()}</h1>
        </div>
        <div class="steps-indicator">
          ${[1,2,3,4].map(s => `
            <div class="step-dot ${s === this.step ? 'active' : ''} ${s < this.step ? 'completed' : ''}"></div>
          `).join('')}
        </div>
    `;

    switch (this.step) {
      case 1: html += this.renderStep1(); break;
      case 2: html += this.renderStep2(); break;
      case 3: html += this.renderStep3(); break;
      case 4: html += this.renderStep4(); break;
      case 5: html += this.renderSuccess(); break;
    }

    html += `</div>`;
    container.innerHTML = html;
    this.bindStepEvents();
  },

  getStepTitle() {
    const titles = {
      1: 'Chọn dịch vụ',
      2: 'Chọn ngày & giờ',
      3: 'Thông tin của bạn',
      4: 'Xác nhận đặt lịch',
      5: 'Đặt lịch thành công!'
    };
    return titles[this.step];
  },

  // Step 1: Select Services
  renderStep1() {
    return `
      <div class="booking-services-list">
        ${this.services.map(service => `
          <div class="booking-service-item ${this.selectedServices.includes(service.service_id) ? 'selected' : ''}" 
               data-id="${service.service_id}">
            <div class="booking-service-img" style="background-image:url('${service.image_url || ''}')"></div>
            <div class="booking-service-info">
              <div class="booking-service-name">${service.name}</div>
              <div class="booking-service-detail">${service.duration_min} phút · ${App.formatPrice(service.price)}</div>
            </div>
            <div class="booking-service-check">
              ${this.selectedServices.includes(service.service_id) ? '<i class="fas fa-check" style="font-size:12px;"></i>' : ''}
            </div>
          </div>
        `).join('')}
      </div>
      
      ${this.selectedServices.length > 0 ? `
        <div class="bottom-action-bar">
          <div class="bottom-action-info">
            <span>${this.selectedServices.length} dịch vụ · ${this.getTotalDuration()} phút</span>
            <span>${App.formatPrice(this.getTotalPrice())}</span>
          </div>
          <button class="btn-primary" id="btn-next-step">Tiếp tục</button>
        </div>
      ` : ''}
    `;
  },

  getTotalDuration() {
    return this.selectedServices.reduce((sum, id) => {
      const svc = this.services.find(s => s.service_id === id);
      return sum + (svc ? svc.duration_min : 0);
    }, 0);
  },

  getTotalPrice() {
    return this.selectedServices.reduce((sum, id) => {
      const svc = this.services.find(s => s.service_id === id);
      return sum + (svc ? svc.price : 0);
    }, 0);
  },

  // Step 2: Date, Time, Staff
  renderStep2() {
    const dates = this.generateDates(14);
    
    let slotsHTML = '';
    if (this.availableSlots && this.selectedDate) {
      const staffSlots = this.selectedStaff === 'any'
        ? this.getMergedSlots()
        : this.getStaffSlots(this.selectedStaff);
      
      slotsHTML = `
        <h3 style="font-size:0.9rem;font-weight:600;margin:20px 0 10px;">Chọn giờ</h3>
        <div class="time-slots-grid">
          ${staffSlots.map(slot => `
            <button class="time-slot ${slot.available ? '' : 'disabled'} ${this.selectedTime === slot.start_time ? 'selected' : ''}"
                    data-time="${slot.start_time}" ${!slot.available ? 'disabled' : ''}>
              ${slot.start_time}
            </button>
          `).join('')}
        </div>
      `;
    }

    // Staff
    let staffHTML = '';
    if (this.availableSlots) {
      staffHTML = `
        <h3 style="font-size:0.9rem;font-weight:600;margin:20px 0 10px;">Chọn KTV</h3>
        <div class="staff-grid">
          <div class="staff-card ${this.selectedStaff === 'any' ? 'selected' : ''}" data-staff="any">
            <div class="staff-avatar" style="background:var(--bg-surface);display:flex;align-items:center;justify-content:center;">
              <i class="fas fa-random" style="color:var(--primary);"></i>
            </div>
            <div class="staff-name">Bất kỳ</div>
          </div>
          ${this.availableSlots.staff_slots.map(staff => `
            <div class="staff-card ${this.selectedStaff === staff.staff_id ? 'selected' : ''}" data-staff="${staff.staff_id}">
              <div class="staff-avatar" style="background-image:url('${staff.avatar_url || ''}')"></div>
              <div class="staff-name">${staff.name}</div>
            </div>
          `).join('')}
        </div>
      `;
    }

    return `
      <h3 style="font-size:0.9rem;font-weight:600;margin-bottom:10px;">Chọn ngày</h3>
      <div class="date-strip">
        ${dates.map(d => `
          <button class="date-item ${this.selectedDate === d.value ? 'selected' : ''}" data-date="${d.value}">
            <div class="date-item-day">${d.day}</div>
            <div class="date-item-num">${d.num}</div>
          </button>
        `).join('')}
      </div>

      ${staffHTML}
      ${slotsHTML}

      ${this.selectedTime ? `
        <div class="bottom-action-bar">
          <div class="bottom-action-info">
            <span>${this.selectedDate} · ${this.selectedTime}</span>
            <span>${this.getSelectedStaffName()}</span>
          </div>
          <button class="btn-primary" id="btn-next-step">Tiếp tục</button>
        </div>
      ` : ''}
    `;
  },

  generateDates(days) {
    const result = [];
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      result.push({
        value: d.toISOString().split('T')[0],
        day: dayNames[d.getDay()],
        num: d.getDate()
      });
    }
    return result;
  },

  getMergedSlots() {
    if (!this.availableSlots) return [];
    // Merge all staff slots - a time is available if any staff is free
    const slotMap = {};
    this.availableSlots.staff_slots.forEach(staff => {
      staff.available_slots.forEach(slot => {
        if (!slotMap[slot.start_time]) {
          slotMap[slot.start_time] = { ...slot };
        } else if (slot.available) {
          slotMap[slot.start_time].available = true;
        }
      });
    });
    return Object.values(slotMap).sort((a, b) => a.start_time.localeCompare(b.start_time));
  },

  getStaffSlots(staffId) {
    if (!this.availableSlots) return [];
    const staffData = this.availableSlots.staff_slots.find(s => s.staff_id === staffId);
    return staffData ? staffData.available_slots : [];
  },

  getSelectedStaffName() {
    if (this.selectedStaff === 'any') return 'KTV bất kỳ';
    if (!this.availableSlots) return '';
    const staff = this.availableSlots.staff_slots.find(s => s.staff_id === this.selectedStaff);
    return staff ? staff.name : '';
  },

  // Step 3: Customer Info
  renderStep3() {
    return `
      <div class="confirm-section">
        <div class="form-group">
          <label class="form-label">Họ và tên *</label>
          <input type="text" class="form-input" id="input-name" placeholder="Nhập họ tên" value="${this.customerName}">
        </div>
        <div class="form-group">
          <label class="form-label">Số điện thoại *</label>
          <input type="tel" class="form-input" id="input-phone" placeholder="0901 234 567" value="${this.customerPhone}">
        </div>
        <div class="form-group">
          <label class="form-label">Ghi chú (không bắt buộc)</label>
          <input type="text" class="form-input" id="input-note" placeholder="VD: Da nhạy cảm, dị ứng..." value="${this.note}">
        </div>
      </div>

      <div class="booking-summary">
        <h3 class="summary-title">Tóm tắt đặt lịch</h3>
        <div class="summary-row">
          <span class="summary-label">Dịch vụ</span>
          <span class="summary-value">${this.getSelectedServiceNames().join(', ')}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Ngày</span>
          <span class="summary-value">${App.formatDateDisplay(this.selectedDate)}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Giờ</span>
          <span class="summary-value">${this.selectedTime}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">KTV</span>
          <span class="summary-value">${this.getSelectedStaffName()}</span>
        </div>
        <div class="summary-total">
          <span class="summary-total-label">Tổng cộng</span>
          <span class="summary-total-value">${App.formatPrice(this.getTotalPrice())}</span>
        </div>
      </div>

      <div style="margin-top:24px;">
        <button class="btn-primary" id="btn-next-step">Xác nhận đặt lịch</button>
      </div>
    `;
  },

  getSelectedServiceNames() {
    return this.selectedServices.map(id => {
      const svc = this.services.find(s => s.service_id === id);
      return svc ? svc.name : '';
    }).filter(Boolean);
  },

  // Step 4 is actually the confirmation submit (merged into step 3)
  renderStep4() {
    return this.renderStep3();
  },

  // Success screen
  renderSuccess() {
    return `
      <div class="success-page">
        <div class="success-icon">
          <i class="fas fa-check"></i>
        </div>
        <h2 class="success-title">Đặt lịch thành công!</h2>
        <p class="success-subtitle">Chúng tôi sẽ xác nhận lịch hẹn của bạn sớm nhất.</p>

        <div class="booking-summary">
          <div class="summary-row">
            <span class="summary-label">Dịch vụ</span>
            <span class="summary-value">${this.getSelectedServiceNames().join(', ')}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Ngày</span>
            <span class="summary-value">${App.formatDateDisplay(this.selectedDate)}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Giờ</span>
            <span class="summary-value">${this.selectedTime}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">KTV</span>
            <span class="summary-value">${this.getSelectedStaffName()}</span>
          </div>
        </div>

        <div style="margin-top:32px;display:flex;flex-direction:column;gap:12px;">
          <button class="btn-primary" id="btn-my-bookings">Xem lịch của tôi</button>
          <button class="btn-secondary" id="btn-go-home">Về trang chủ</button>
        </div>
      </div>
    `;
  },

  // Event Binding
  bindStepEvents() {
    // Back button
    const backBtn = document.getElementById('booking-back');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (this.step > 1) {
          this.step--;
          this.renderStep();
        }
      });
    }

    // Next button
    const nextBtn = document.getElementById('btn-next-step');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.handleNext());
    }

    // Step-specific events
    switch (this.step) {
      case 1:
        this.bindStep1Events();
        break;
      case 2:
        this.bindStep2Events();
        break;
      case 5:
        this.bindSuccessEvents();
        break;
    }
  },

  bindStep1Events() {
    document.querySelectorAll('.booking-service-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        const idx = this.selectedServices.indexOf(id);
        if (idx > -1) {
          this.selectedServices.splice(idx, 1);
        } else {
          this.selectedServices.push(id);
        }
        this.renderStep();
      });
    });
  },

  bindStep2Events() {
    // Date selection
    document.querySelectorAll('.date-item').forEach(item => {
      item.addEventListener('click', async () => {
        this.selectedDate = item.dataset.date;
        this.selectedTime = '';
        
        // Load available slots
        const result = await API.get('getAvailableSlots', {
          date: this.selectedDate,
          serviceIds: this.selectedServices.join(',')
        });
        
        if (result.success) {
          this.availableSlots = result.data;
        } else {
          App.showToast(result.error || 'Lỗi tải lịch trống', 'error');
        }
        
        this.renderStep();
      });
    });

    // Staff selection
    document.querySelectorAll('.staff-card').forEach(card => {
      card.addEventListener('click', () => {
        this.selectedStaff = card.dataset.staff;
        this.selectedTime = '';
        this.renderStep();
      });
    });

    // Time slot selection
    document.querySelectorAll('.time-slot:not(.disabled)').forEach(slot => {
      slot.addEventListener('click', () => {
        this.selectedTime = slot.dataset.time;
        this.renderStep();
      });
    });
  },

  bindSuccessEvents() {
    const myBookingsBtn = document.getElementById('btn-my-bookings');
    const goHomeBtn = document.getElementById('btn-go-home');
    
    if (myBookingsBtn) {
      myBookingsBtn.addEventListener('click', () => App.navigateTo('my-bookings'));
    }
    if (goHomeBtn) {
      goHomeBtn.addEventListener('click', () => App.navigateTo('home'));
    }
  },

  async handleNext() {
    switch (this.step) {
      case 1:
        if (this.selectedServices.length === 0) {
          App.showToast('Vui lòng chọn ít nhất 1 dịch vụ', 'error');
          return;
        }
        this.step = 2;
        break;
        
      case 2:
        if (!this.selectedDate || !this.selectedTime) {
          App.showToast('Vui lòng chọn ngày và giờ', 'error');
          return;
        }
        this.step = 3;
        break;
        
      case 3:
        await this.submitBooking();
        return;
    }
    
    this.renderStep();
  },

  async submitBooking() {
    const name = document.getElementById('input-name').value.trim();
    const phone = document.getElementById('input-phone').value.trim();
    const note = document.getElementById('input-note').value.trim();

    if (!name) {
      App.showToast('Vui lòng nhập họ tên', 'error');
      return;
    }
    if (!phone || phone.length < 9) {
      App.showToast('Số điện thoại không hợp lệ', 'error');
      return;
    }

    this.customerName = name;
    this.customerPhone = phone;
    this.note = note;

    // Show loading
    const btn = document.getElementById('btn-next-step');
    btn.disabled = true;
    btn.textContent = 'Đang xử lý...';

    const result = await API.post('createBooking', {
      phone: phone,
      name: name,
      service_ids: this.selectedServices,
      staff_id: this.selectedStaff,
      date: this.selectedDate,
      start_time: this.selectedTime,
      note: note
    });

    if (result.success) {
      this.step = 5;
      this.renderStep();
      App.showToast('Đặt lịch thành công!', 'success');
    } else {
      btn.disabled = false;
      btn.textContent = 'Xác nhận đặt lịch';
      App.showToast(result.error || 'Có lỗi xảy ra', 'error');
    }
  }
};
