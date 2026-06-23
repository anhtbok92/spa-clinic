/**
 * Services Section - Admin CRUD
 */
const ServicesSection = {
  services: [],

  async render(container) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>Đang tải...</p></div>';
    
    const result = await AdminAPI.get('listServices');
    if (result.success) {
      this.services = result.data;
    }
    
    container.innerHTML = this.getHTML();
    this.bindEvents();
  },

  getHTML() {
    return `
      <div class="section-header">
        <h1 class="section-title">Quản lý dịch vụ</h1>
        <button class="btn btn-primary" id="btn-add-service">
          <i class="fas fa-plus"></i> Thêm dịch vụ
        </button>
      </div>

      ${this.services.length === 0 ? `
        <div class="empty-state">
          <i class="fas fa-concierge-bell"></i>
          <p>Chưa có dịch vụ nào</p>
        </div>
      ` : `
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Tên dịch vụ</th>
                <th>Danh mục</th>
                <th>Thời gian</th>
                <th>Giá</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              ${this.services.map(s => `
                <tr>
                  <td><div style="width:48px;height:48px;border-radius:8px;background:url('${s.image_url || ''}') center/cover;background-color:var(--bg-surface);"></div></td>
                  <td><strong>${s.name}</strong></td>
                  <td>${s.category || '-'}</td>
                  <td>${s.duration_min} phút</td>
                  <td>${AdminApp.formatPrice(s.price)}</td>
                  <td><span class="badge ${s.active ? 'badge-active' : 'badge-inactive'}">${s.active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <button class="btn btn-ghost btn-sm btn-edit-service" data-id="${s.service_id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger btn-sm btn-del-service" data-id="${s.service_id}"><i class="fas fa-trash"></i></button>
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
    document.getElementById('btn-add-service')?.addEventListener('click', () => this.showForm());
    
    document.querySelectorAll('.btn-edit-service').forEach(btn => {
      btn.addEventListener('click', () => {
        const service = this.services.find(s => s.service_id === btn.dataset.id);
        if (service) this.showForm(service);
      });
    });

    document.querySelectorAll('.btn-del-service').forEach(btn => {
      btn.addEventListener('click', () => this.deleteService(btn.dataset.id));
    });
  },

  showForm(service = null) {
    const isEdit = !!service;
    const html = `
      <h2>${isEdit ? 'Sửa dịch vụ' : 'Thêm dịch vụ mới'}</h2>
      <div class="form-group">
        <label class="form-label">Tên dịch vụ *</label>
        <input type="text" class="form-input" id="svc-name" value="${service?.name || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Danh mục</label>
        <input type="text" class="form-input" id="svc-category" value="${service?.category || ''}" placeholder="VD: Massage, Nail, Spa Mặt...">
      </div>
      <div class="form-group">
        <label class="form-label">Thời gian (phút)</label>
        <input type="number" class="form-input" id="svc-duration" value="${service?.duration_min || 60}">
      </div>
      <div class="form-group">
        <label class="form-label">Giá (VNĐ)</label>
        <input type="number" class="form-input" id="svc-price" value="${service?.price || 0}">
      </div>
      <div class="form-group">
        <label class="form-label">URL ảnh</label>
        <input type="url" class="form-input" id="svc-image" value="${service?.image_url || ''}" placeholder="https://...">
      </div>
      <div class="form-group">
        <label class="form-label">Mô tả</label>
        <input type="text" class="form-input" id="svc-desc" value="${service?.description || ''}">
      </div>
      ${isEdit ? `
        <div class="form-group">
          <label class="form-label">Trạng thái</label>
          <select class="form-input" id="svc-active">
            <option value="true" ${service.active ? 'selected' : ''}>Active</option>
            <option value="false" ${!service.active ? 'selected' : ''}>Inactive</option>
          </select>
        </div>
      ` : ''}
      <div class="modal-actions">
        <button class="btn btn-ghost" onclick="AdminApp.closeModal()">Hủy</button>
        <button class="btn btn-primary" id="btn-save-service">Lưu</button>
      </div>
    `;

    AdminApp.showModal(html);

    document.getElementById('btn-save-service').addEventListener('click', async () => {
      const data = {
        name: document.getElementById('svc-name').value,
        category: document.getElementById('svc-category').value,
        duration_min: document.getElementById('svc-duration').value,
        price: document.getElementById('svc-price').value,
        image_url: document.getElementById('svc-image').value,
        description: document.getElementById('svc-desc').value
      };

      let result;
      if (isEdit) {
        data.service_id = service.service_id;
        data.active = document.getElementById('svc-active').value === 'true';
        result = await AdminAPI.post('updateService', data);
      } else {
        result = await AdminAPI.post('createService', data);
      }

      if (result.success) {
        AdminApp.closeModal();
        AdminApp.showToast(isEdit ? 'Cập nhật thành công' : 'Thêm dịch vụ thành công');
        this.render(document.getElementById('admin-content'));
      } else {
        AdminApp.showToast(result.error || 'Có lỗi xảy ra', 'error');
      }
    });
  },

  async deleteService(serviceId) {
    if (!confirm('Bạn có chắc muốn xóa dịch vụ này?')) return;
    
    const result = await AdminAPI.post('deleteService', { service_id: serviceId });
    if (result.success) {
      AdminApp.showToast('Đã xóa dịch vụ');
      this.render(document.getElementById('admin-content'));
    } else {
      AdminApp.showToast(result.error || 'Lỗi xóa', 'error');
    }
  }
};
