/**
 * Setup Script - Chạy 1 lần để tạo cấu trúc Sheets
 * 
 * HƯỚNG DẪN:
 * 1. Tạo Google Spreadsheet mới
 * 2. Copy SPREADSHEET_ID vào Script Properties
 * 3. Set ADMIN_EMAIL và ADMIN_PASSWORD_HASH trong Script Properties
 * 4. Chạy function setupSheets() 1 lần
 * 5. Deploy as Web App (Anyone can access)
 * 
 * Để tạo ADMIN_PASSWORD_HASH:
 * - Chạy function generatePasswordHash() với password mong muốn
 */

function setupSheets() {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  
  // Sheet: Customers
  var customers = ss.getSheetByName('Customers') || ss.insertSheet('Customers');
  if (customers.getLastRow() === 0) {
    customers.appendRow(['customer_id', 'phone', 'name', 'created_at']);
    customers.getRange(1, 1, 1, 4).setFontWeight('bold');
  }
  
  // Sheet: Services  
  var services = ss.getSheetByName('Services') || ss.insertSheet('Services');
  if (services.getLastRow() === 0) {
    services.appendRow(['service_id', 'name', 'category', 'duration_min', 'price', 'image_url', 'active', 'description']);
    services.getRange(1, 1, 1, 8).setFontWeight('bold');
    
    // Sample data
    services.appendRow(['SVC001', 'Massage Thư Giãn', 'Massage', 60, 350000, 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400', true, 'Massage toàn thân thư giãn với tinh dầu thiên nhiên']);
    services.appendRow(['SVC002', 'Chăm Sóc Da Mặt Cơ Bản', 'Spa Mặt', 45, 250000, 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400', true, 'Làm sạch, tẩy tế bào chết, đắp mặt nạ']);
    services.appendRow(['SVC003', 'Sơn Gel', 'Nail', 30, 150000, 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400', true, 'Sơn gel bền đẹp lên đến 3 tuần']);
    services.appendRow(['SVC004', 'Massage Đá Nóng', 'Massage', 90, 500000, 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400', true, 'Massage kết hợp đá nóng giúp giảm đau nhức, thư giãn sâu']);
    services.appendRow(['SVC005', 'Nail Art', 'Nail', 60, 300000, 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400', true, 'Vẽ nail nghệ thuật theo yêu cầu']);
    services.appendRow(['SVC006', 'Waxing Chân', 'Waxing', 30, 200000, 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=400', true, 'Tẩy lông chân bằng sáp mềm']);
    services.appendRow(['SVC007', 'Chăm Sóc Da Nâng Cao', 'Spa Mặt', 75, 450000, 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400', true, 'Trị mụn, trẻ hóa da với công nghệ hiện đại']);
    services.appendRow(['SVC008', 'Foot Massage', 'Massage', 45, 200000, 'https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=400', true, 'Massage chân và bấm huyệt thư giãn']);
  }
  
  // Sheet: Staff
  var staff = ss.getSheetByName('Staff') || ss.insertSheet('Staff');
  if (staff.getLastRow() === 0) {
    staff.appendRow(['staff_id', 'name', 'phone', 'active', 'avatar_url']);
    staff.getRange(1, 1, 1, 5).setFontWeight('bold');
    
    // Sample data
    staff.appendRow(['STF001', 'Ngọc Anh', '0901234001', true, 'https://i.pravatar.cc/150?img=1']);
    staff.appendRow(['STF002', 'Thu Hà', '0901234002', true, 'https://i.pravatar.cc/150?img=5']);
    staff.appendRow(['STF003', 'Minh Tâm', '0901234003', true, 'https://i.pravatar.cc/150?img=9']);
    staff.appendRow(['STF004', 'Lan Phương', '0901234004', true, 'https://i.pravatar.cc/150?img=16']);
  }
  
  // Sheet: Bookings
  var bookings = ss.getSheetByName('Bookings') || ss.insertSheet('Bookings');
  if (bookings.getLastRow() === 0) {
    bookings.appendRow(['booking_id', 'customer_phone', 'customer_name', 'service_ids', 'staff_id', 'date', 'start_time', 'end_time', 'service_names', 'status', 'note', 'created_at']);
    bookings.getRange(1, 1, 1, 12).setFontWeight('bold');
  }
  
  // Sheet: Admins (optional)
  var admins = ss.getSheetByName('Admins') || ss.insertSheet('Admins');
  if (admins.getLastRow() === 0) {
    admins.appendRow(['admin_id', 'email', 'password_hash', 'name']);
    admins.getRange(1, 1, 1, 4).setFontWeight('bold');
  }
  
  // Remove default Sheet1 if exists
  var sheet1 = ss.getSheetByName('Sheet1');
  if (sheet1) {
    ss.deleteSheet(sheet1);
  }
  
  Logger.log('Setup completed! Sheets created with sample data.');
}

/**
 * Helper: Generate password hash
 * Thay 'your_password' bằng mật khẩu muốn dùng
 * Copy kết quả vào Script Properties → ADMIN_PASSWORD_HASH
 */
function generatePasswordHash() {
  var password = 'admin123'; // ← ĐỔI MẬT KHẨU TẠI ĐÂY
  var hash = hashPassword_(password);
  Logger.log('Password: ' + password);
  Logger.log('Hash: ' + hash);
  return hash;
}

/**
 * Helper: Set Script Properties
 * Chạy 1 lần sau khi tạo Spreadsheet
 */
function setScriptProperties() {
  var props = PropertiesService.getScriptProperties();
  props.setProperties({
    'SPREADSHEET_ID': 'YOUR_SPREADSHEET_ID_HERE',
    'ADMIN_EMAIL': 'admin@spa.com',
    'ADMIN_PASSWORD_HASH': '' // Chạy generatePasswordHash() để lấy hash
  });
  Logger.log('Properties set!');
}
