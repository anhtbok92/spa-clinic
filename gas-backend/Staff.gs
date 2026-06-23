/**
 * Staff Module - CRUD nhân viên / KTV
 */

// ============== PUBLIC ==============
function getStaffPublic_(e) {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Staff');
  
  if (!sheet || sheet.getLastRow() <= 1) {
    return successResponse_([]);
  }
  
  var data = sheet.getDataRange().getValues();
  var staffList = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    // Only active staff for public
    if (row[3] === true || row[3] === 'TRUE' || row[3] === 1) {
      staffList.push({
        staff_id: row[0],
        name: row[1],
        avatar_url: row[4] || '',
        active: true
      });
    }
  }
  
  return successResponse_(staffList);
}

// ============== ADMIN ==============
function listStaffAdmin_(e) {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Staff');
  
  if (!sheet || sheet.getLastRow() <= 1) {
    return successResponse_([]);
  }
  
  var data = sheet.getDataRange().getValues();
  var staffList = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    staffList.push({
      staff_id: row[0],
      name: row[1],
      phone: row[2],
      active: row[3] === true || row[3] === 'TRUE' || row[3] === 1,
      avatar_url: row[4] || ''
    });
  }
  
  return successResponse_(staffList);
}

function createStaff_(body) {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Staff');
  
  var name = (body.name || '').trim();
  var phone = (body.phone || '').trim();
  var avatar_url = (body.avatar_url || '').trim();
  
  if (!name) {
    return errorResponse_('Tên nhân viên không được để trống');
  }
  
  var staff_id = 'STF' + new Date().getTime();
  
  sheet.appendRow([
    staff_id,
    name,
    phone,
    true,
    avatar_url
  ]);
  
  return successResponse_({
    staff_id: staff_id,
    name: name,
    phone: phone,
    active: true,
    avatar_url: avatar_url
  });
}

function updateStaff_(body) {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Staff');
  var staff_id = body.staff_id;
  
  if (!staff_id) {
    return errorResponse_('Thiếu staff_id');
  }
  
  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === staff_id) {
      rowIndex = i + 1;
      break;
    }
  }
  
  if (rowIndex === -1) {
    return errorResponse_('Không tìm thấy nhân viên', 404);
  }
  
  if (body.name !== undefined) sheet.getRange(rowIndex, 2).setValue(body.name);
  if (body.phone !== undefined) sheet.getRange(rowIndex, 3).setValue(body.phone);
  if (body.active !== undefined) sheet.getRange(rowIndex, 4).setValue(body.active);
  if (body.avatar_url !== undefined) sheet.getRange(rowIndex, 5).setValue(body.avatar_url);
  
  return successResponse_({ staff_id: staff_id, updated: true });
}

function deleteStaff_(body) {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Staff');
  var staff_id = body.staff_id;
  
  if (!staff_id) {
    return errorResponse_('Thiếu staff_id');
  }
  
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === staff_id) {
      sheet.deleteRow(i + 1);
      return successResponse_({ deleted: true });
    }
  }
  
  return errorResponse_('Không tìm thấy nhân viên', 404);
}
