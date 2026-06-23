/**
 * Bookings Module - Core booking logic with LockService
 */

// ============== PUBLIC: Get Available Slots ==============
function getAvailableSlots_(e) {
  var date = e.parameter.date; // format: YYYY-MM-DD
  var serviceIds = e.parameter.serviceIds; // comma-separated
  
  if (!date) {
    return errorResponse_('Vui lòng chọn ngày');
  }
  
  if (!serviceIds) {
    return errorResponse_('Vui lòng chọn dịch vụ');
  }
  
  var serviceIdList = serviceIds.split(',');
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  
  // Calculate total duration
  var servicesSheet = ss.getSheetByName('Services');
  var servicesData = servicesSheet.getDataRange().getValues();
  var totalDuration = 0;
  
  for (var s = 0; s < serviceIdList.length; s++) {
    for (var i = 1; i < servicesData.length; i++) {
      if (servicesData[i][0] === serviceIdList[s].trim()) {
        totalDuration += parseInt(servicesData[i][3]) || 60;
        break;
      }
    }
  }
  
  if (totalDuration === 0) totalDuration = 60;
  
  // Get active staff
  var staffSheet = ss.getSheetByName('Staff');
  var staffData = staffSheet.getDataRange().getValues();
  var activeStaff = [];
  
  for (var i = 1; i < staffData.length; i++) {
    if (staffData[i][3] === true || staffData[i][3] === 'TRUE' || staffData[i][3] === 1) {
      activeStaff.push({
        staff_id: staffData[i][0],
        name: staffData[i][1],
        avatar_url: staffData[i][4] || ''
      });
    }
  }
  
  // Get existing bookings for this date
  var bookingsSheet = ss.getSheetByName('Bookings');
  var existingBookings = [];
  
  if (bookingsSheet && bookingsSheet.getLastRow() > 1) {
    var bookingsData = bookingsSheet.getDataRange().getValues();
    for (var i = 1; i < bookingsData.length; i++) {
      var bDate = formatDate_(bookingsData[i][5]);
      var bStatus = bookingsData[i][9];
      if (bDate === date && (bStatus === 'pending' || bStatus === 'confirmed')) {
        existingBookings.push({
          staff_id: bookingsData[i][4],
          start_time: bookingsData[i][6],
          end_time: bookingsData[i][7]
        });
      }
    }
  }
  
  // Generate available slots per staff
  var result = [];
  
  for (var si = 0; si < activeStaff.length; si++) {
    var staff = activeStaff[si];
    var staffBookings = existingBookings.filter(function(b) {
      return b.staff_id === staff.staff_id;
    });
    
    var slots = generateSlots_(date, totalDuration, staffBookings);
    
    result.push({
      staff_id: staff.staff_id,
      name: staff.name,
      avatar_url: staff.avatar_url,
      available_slots: slots
    });
  }
  
  return successResponse_({
    date: date,
    total_duration: totalDuration,
    staff_slots: result
  });
}

function generateSlots_(date, durationMin, staffBookings) {
  var slots = [];
  var now = new Date();
  var selectedDate = new Date(date + 'T00:00:00');
  var isToday = (formatDate_(now) === date);
  
  for (var hour = CONFIG.WORKING_HOURS_START; hour < CONFIG.WORKING_HOURS_END; hour++) {
    for (var min = 0; min < 60; min += CONFIG.SLOT_INTERVAL) {
      var startTime = padZero_(hour) + ':' + padZero_(min);
      var endMinutes = hour * 60 + min + durationMin;
      
      // Don't exceed working hours
      if (endMinutes > CONFIG.WORKING_HOURS_END * 60) continue;
      
      var endHour = Math.floor(endMinutes / 60);
      var endMin = endMinutes % 60;
      var endTime = padZero_(endHour) + ':' + padZero_(endMin);
      
      // If today, skip past times
      if (isToday) {
        var slotDateTime = new Date(date + 'T' + startTime + ':00');
        if (slotDateTime <= now) continue;
      }
      
      // Check conflict with existing bookings
      var conflict = false;
      for (var b = 0; b < staffBookings.length; b++) {
        if (isTimeOverlap_(startTime, endTime, staffBookings[b].start_time, staffBookings[b].end_time)) {
          conflict = true;
          break;
        }
      }
      
      slots.push({
        start_time: startTime,
        end_time: endTime,
        available: !conflict
      });
    }
  }
  
  return slots;
}

// ============== PUBLIC: Create Booking ==============
function createBooking_(body) {
  var phone = (body.phone || '').trim();
  var name = (body.name || '').trim();
  var serviceIds = body.service_ids || [];
  var staffId = (body.staff_id || '').trim();
  var date = (body.date || '').trim();
  var startTime = (body.start_time || '').trim();
  var note = (body.note || '').trim();
  
  // Validation
  if (!phone || phone.length < 9) {
    return errorResponse_('Số điện thoại không hợp lệ');
  }
  if (!name) {
    return errorResponse_('Vui lòng nhập họ tên');
  }
  if (!serviceIds.length) {
    return errorResponse_('Vui lòng chọn ít nhất 1 dịch vụ');
  }
  if (!date) {
    return errorResponse_('Vui lòng chọn ngày');
  }
  if (!startTime) {
    return errorResponse_('Vui lòng chọn giờ');
  }
  
  // Use LockService to prevent double booking
  var lock = LockService.getScriptLock();
  
  try {
    lock.waitLock(10000); // Wait up to 10 seconds
  } catch (err) {
    return errorResponse_('Hệ thống đang bận, vui lòng thử lại sau giây lát');
  }
  
  try {
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    
    // Calculate total duration
    var servicesSheet = ss.getSheetByName('Services');
    var servicesData = servicesSheet.getDataRange().getValues();
    var totalDuration = 0;
    var serviceNames = [];
    
    for (var s = 0; s < serviceIds.length; s++) {
      for (var i = 1; i < servicesData.length; i++) {
        if (servicesData[i][0] === serviceIds[s]) {
          totalDuration += parseInt(servicesData[i][3]) || 60;
          serviceNames.push(servicesData[i][1]);
          break;
        }
      }
    }
    
    if (totalDuration === 0) totalDuration = 60;
    
    // Calculate end time
    var startParts = startTime.split(':');
    var endMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]) + totalDuration;
    var endTime = padZero_(Math.floor(endMinutes / 60)) + ':' + padZero_(endMinutes % 60);
    
    // Handle "any staff" selection
    if (!staffId || staffId === 'any') {
      staffId = findAvailableStaff_(ss, date, startTime, endTime);
      if (!staffId) {
        lock.releaseLock();
        return errorResponse_('Không còn KTV trống ở khung giờ này, vui lòng chọn giờ khác');
      }
    } else {
      // Validate chosen staff is available
      if (!isStaffAvailable_(ss, staffId, date, startTime, endTime)) {
        lock.releaseLock();
        return errorResponse_('KTV đã có lịch ở khung giờ này, vui lòng chọn giờ hoặc KTV khác');
      }
    }
    
    // Create/update customer
    ensureCustomer_(ss, phone, name);
    
    // Create booking
    var bookingsSheet = ss.getSheetByName('Bookings');
    var bookingId = 'BK' + new Date().getTime();
    
    bookingsSheet.appendRow([
      bookingId,
      phone,
      name,
      serviceIds.join(','),
      staffId,
      date,
      startTime,
      endTime,
      serviceNames.join(', '),
      'pending',
      note,
      new Date()
    ]);
    
    // Get staff name
    var staffName = getStaffName_(ss, staffId);
    
    lock.releaseLock();
    
    return successResponse_({
      booking_id: bookingId,
      services: serviceNames,
      staff_name: staffName,
      date: date,
      start_time: startTime,
      end_time: endTime,
      status: 'pending'
    });
    
  } catch (err) {
    lock.releaseLock();
    return errorResponse_('Lỗi tạo lịch: ' + err.message, 500);
  }
}

// ============== PUBLIC: Get Bookings by Phone ==============
function getBookingsByPhone_(e) {
  var phone = (e.parameter.phone || '').trim();
  
  if (!phone || phone.length < 9) {
    return errorResponse_('Số điện thoại không hợp lệ');
  }
  
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Bookings');
  
  if (!sheet || sheet.getLastRow() <= 1) {
    return successResponse_([]);
  }
  
  var data = sheet.getDataRange().getValues();
  var bookings = [];
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][1].toString().trim() === phone) {
      bookings.push({
        booking_id: data[i][0],
        customer_name: data[i][2],
        service_ids: data[i][3],
        staff_id: data[i][4],
        date: formatDate_(data[i][5]),
        start_time: data[i][6],
        end_time: data[i][7],
        service_names: data[i][8],
        status: data[i][9],
        note: data[i][10],
        created_at: data[i][11]
      });
    }
  }
  
  // Sort by date descending
  bookings.sort(function(a, b) {
    return new Date(b.date + 'T' + b.start_time) - new Date(a.date + 'T' + a.start_time);
  });
  
  return successResponse_(bookings);
}

// ============== PUBLIC: Cancel Booking ==============
function cancelBookingByCustomer_(body) {
  var bookingId = (body.booking_id || '').trim();
  var phone = (body.phone || '').trim();
  
  if (!bookingId || !phone) {
    return errorResponse_('Thiếu thông tin đặt lịch');
  }
  
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Bookings');
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === bookingId && data[i][1].toString().trim() === phone) {
      var status = data[i][9];
      
      if (status === 'completed' || status === 'cancelled') {
        return errorResponse_('Lịch hẹn này không thể hủy (đã ' + (status === 'completed' ? 'hoàn tất' : 'bị hủy') + ')');
      }
      
      // Check cancel time limit
      var bookingDate = data[i][5];
      var bookingTime = data[i][6];
      var bookingDateTime = new Date(formatDate_(bookingDate) + 'T' + bookingTime + ':00');
      var now = new Date();
      var hoursUntil = (bookingDateTime - now) / (1000 * 60 * 60);
      
      if (hoursUntil < CONFIG.CANCEL_HOURS_LIMIT) {
        return errorResponse_('Chỉ có thể hủy lịch trước ' + CONFIG.CANCEL_HOURS_LIMIT + ' tiếng');
      }
      
      // Cancel
      sheet.getRange(i + 1, 10).setValue('cancelled');
      return successResponse_({ cancelled: true, booking_id: bookingId });
    }
  }
  
  return errorResponse_('Không tìm thấy lịch hẹn', 404);
}

// ============== ADMIN: List Bookings ==============
function listBookings_(e) {
  var date = e.parameter.date || '';
  var status = e.parameter.status || '';
  var staffId = e.parameter.staff_id || '';
  
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Bookings');
  
  if (!sheet || sheet.getLastRow() <= 1) {
    return successResponse_([]);
  }
  
  var data = sheet.getDataRange().getValues();
  var bookings = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var bDate = formatDate_(row[5]);
    var bStatus = row[9];
    var bStaffId = row[4];
    
    // Apply filters
    if (date && bDate !== date) continue;
    if (status && bStatus !== status) continue;
    if (staffId && bStaffId !== staffId) continue;
    
    bookings.push({
      booking_id: row[0],
      customer_phone: row[1],
      customer_name: row[2],
      service_ids: row[3],
      staff_id: row[4],
      date: bDate,
      start_time: row[6],
      end_time: row[7],
      service_names: row[8],
      status: bStatus,
      note: row[10],
      created_at: row[11]
    });
  }
  
  // Sort by start_time
  bookings.sort(function(a, b) {
    return (a.start_time || '').localeCompare(b.start_time || '');
  });
  
  return successResponse_(bookings);
}

// ============== ADMIN: Create Booking ==============
function createBookingByAdmin_(body) {
  // Same logic as public createBooking_ but requires token (already validated)
  return createBooking_(body);
}

// ============== ADMIN: Update Booking Status ==============
function updateBookingStatus_(body) {
  var bookingId = (body.booking_id || '').trim();
  var newStatus = (body.status || '').trim();
  
  var validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
  
  if (!bookingId) {
    return errorResponse_('Thiếu booking_id');
  }
  if (validStatuses.indexOf(newStatus) === -1) {
    return errorResponse_('Trạng thái không hợp lệ');
  }
  
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Bookings');
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === bookingId) {
      sheet.getRange(i + 1, 10).setValue(newStatus);
      return successResponse_({ booking_id: bookingId, status: newStatus });
    }
  }
  
  return errorResponse_('Không tìm thấy lịch hẹn', 404);
}

// ============== HELPER FUNCTIONS ==============
function findAvailableStaff_(ss, date, startTime, endTime) {
  var staffSheet = ss.getSheetByName('Staff');
  var staffData = staffSheet.getDataRange().getValues();
  
  for (var i = 1; i < staffData.length; i++) {
    if (staffData[i][3] === true || staffData[i][3] === 'TRUE' || staffData[i][3] === 1) {
      var staffId = staffData[i][0];
      if (isStaffAvailable_(ss, staffId, date, startTime, endTime)) {
        return staffId;
      }
    }
  }
  
  return null;
}

function isStaffAvailable_(ss, staffId, date, startTime, endTime) {
  var bookingsSheet = ss.getSheetByName('Bookings');
  
  if (!bookingsSheet || bookingsSheet.getLastRow() <= 1) return true;
  
  var data = bookingsSheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    var bDate = formatDate_(data[i][5]);
    var bStaffId = data[i][4];
    var bStatus = data[i][9];
    
    if (bDate === date && bStaffId === staffId && (bStatus === 'pending' || bStatus === 'confirmed')) {
      if (isTimeOverlap_(startTime, endTime, data[i][6], data[i][7])) {
        return false;
      }
    }
  }
  
  return true;
}

function isTimeOverlap_(start1, end1, start2, end2) {
  var s1 = timeToMinutes_(start1);
  var e1 = timeToMinutes_(end1);
  var s2 = timeToMinutes_(start2);
  var e2 = timeToMinutes_(end2);
  
  return s1 < e2 && s2 < e1;
}

function ensureCustomer_(ss, phone, name) {
  var sheet = ss.getSheetByName('Customers');
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][1].toString().trim() === phone) {
      // Customer exists, update name if needed
      if (name && data[i][2] !== name) {
        sheet.getRange(i + 1, 3).setValue(name);
      }
      return data[i][0]; // return customer_id
    }
  }
  
  // Create new customer
  var customerId = 'CUS' + new Date().getTime();
  sheet.appendRow([customerId, phone, name, new Date()]);
  return customerId;
}

function getStaffName_(ss, staffId) {
  var staffSheet = ss.getSheetByName('Staff');
  var data = staffSheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === staffId) return data[i][1];
  }
  
  return 'KTV';
}
