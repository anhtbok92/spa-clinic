/**
 * Staff Section - Admin CRUD
 */
const StaffSection = {
  staffList: [],

  async render(container) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>Đang tải...</p></div>';
    
    const result = await AdminAPI.get('listStaff');
    if (result.success) {
      this.staffList = result.data;
    }
    
    container.innerHTML = this.getHTML();
    this.bindEvents();
  },

  getHTML() {
    return `
      <div class="section-header">
        <h1 class="section-title">Quản lý nhân viên</h1>
        <button class="btn btn-primary" id="btn-add-staff">
          <i class="fas fa-plus"></i> Thêm nhân viên
        </button>
      </div>

      ${this.staffList.length === 0 ? `
        <div class="empty-state">
          <i class="fas fa-users"></i>
          <p>Chưa có nhân viên nào</p>
        </div>
      ` : `
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Avatar</th>
                <th>Tên</th>
                <th>SĐT</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              ${this.staffList.map(s => `
                <tr>
                  <td><div style="width:40px;height:40px;border-radius:50%;background:url('${s.avatar_url || ''}') center/cover;background-color:var(--bg-surface);"></div></td>
                  <td><strong>${s.name}</strong></td>
                  <td>${s.phone || '-'}</td>
                  <td><span class="badge ${s.active ? 'badge-active' : 'badge-inactive'}">${s.active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <button class="btn btn-ghost btn-sm btn-edit-staff" data-id="${s.staff_id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger btn-sm btn-del-staff" data-id="${s.staff_id}"><i class="fas fa-trash"></i></button>
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
    document.getElementById('btn-add-staff')?.addEventListener('click', () => this.showForm());
    
    document.querySelectorAll('.btn-edit-staff').forEach(btn => {
      btn.addEventListener('click', () => {
        const staff = this.staffList.find(s => s.staff_id === btn.dataset.id);
        if (staff) this.showForm(staff);
      });
    });

    document.querySelectorAll('.btn-del-staff').forEach(btn => {
      btn.addEventListener('click', () => this.deleteStaff(btn.dataset.id));
    });
  },

  showForm(staff = null) {
    const isEdit = !!staff;
    const html = `
      <h2>${isEdit ? 'Sửa nhân viên' : 'Thêm nhân viên mới'}</h2>
      <div class="form-group">
        <label class="form-label">Tên nhân viên *</label>
        <input type="text" class="form-input" id="staff-name" value="${staff?.name || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Số điện thoại</label>
        <input type="tel" class="form-input" id="staff-phone" value="${staff?.phone || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">URL avatar</label>
        <input type="url" class="form-input" id="staff-avatar" value="${staff?.avatar_url || ''}" placeholder="https://...">
      </div>
      ${isEdit ? `
        <div class="form-group">
          <label class="form-label">Trạng thái</label>
          <select class="form-input" id="staff-active">
            <option value="true" ${staff.active ? 'selected' : ''}>Active</option>
            <option value="false" ${!staff.active ? 'selected' : ''}>Inactive</option>
          </select>
        </div>
      ` : ''}
      <div class="modal-actions">
        <button class="btn btn-ghost" onclick="AdminApp.closeModal()">Hủy</button>
        <button class="btn btn-primary" id="btn-save-staff">Lưu</button>
      </div>
    `;

    AdminApp.showModal(html);

    document.getElementById('btn-save-staff').addEventListener('click', async () => {
      const data = {
        name: document.getElementById('staff-name').value,
        phone: document.getElementById('staff-phone').value,
        avatar_url: document.getElementById('staff-avatar').value
      };

      let result;
      if (isEdit) {
        data.staff_id = staff.staff_id;
        data.active = document.getElementById('staff-active').value === 'true';
        result = await AdminAPI.post('updateStaff', data);
      } else {
        result = await AdminAPI.post('createStaff', data);
      }

      if (result.success) {
        AdminApp.closeModal();
        AdminApp.showToast(isEdit ? 'Cập nhật thành công' : 'Thêm nhân viên thành công');
        this.render(document.getElementById('admin-content'));
      } else {
        AdminApp.showToast(result.error || 'Có lỗi xảy ra', 'error');
      }
    });
  },

  async deleteStaff(staffId) {
    if (!confirm('Bạn có chắc muốn xóa nhân viên này?')) return;
    
    const result = await AdminAPI.post('deleteStaff', { staff_id: staffId });
    if (result.success) {
      AdminApp.showToast('Đã xóa nhân viên');
      this.render(document.getElementById('admin-content'));
    } else {
      AdminApp.showToast(result.error || 'Lỗi xóa', 'error');
    }
  }
};
