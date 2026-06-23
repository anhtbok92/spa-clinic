/**
 * Services Module - CRUD dịch vụ
 */

// ============== PUBLIC ==============
function getServices_(e) {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Services');
  
  if (!sheet || sheet.getLastRow() <= 1) {
    return successResponse_([]);
  }
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var services = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    // Only return active services for public
    if (row[6] === true || row[6] === 'TRUE' || row[6] === 1) {
      services.push({
        service_id: row[0],
        name: row[1],
        category: row[2],
        duration_min: row[3],
        price: row[4],
        image_url: row[5],
        active: true,
        description: row[7] || ''
      });
    }
  }
  
  return successResponse_(services);
}

// ============== ADMIN ==============
function listServicesAdmin_(e) {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Services');
  
  if (!sheet || sheet.getLastRow() <= 1) {
    return successResponse_([]);
  }
  
  var data = sheet.getDataRange().getValues();
  var services = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    services.push({
      service_id: row[0],
      name: row[1],
      category: row[2],
      duration_min: row[3],
      price: row[4],
      image_url: row[5],
      active: row[6] === true || row[6] === 'TRUE' || row[6] === 1,
      description: row[7] || ''
    });
  }
  
  return successResponse_(services);
}

function createService_(body) {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Services');
  
  var name = (body.name || '').trim();
  var category = (body.category || '').trim();
  var duration_min = parseInt(body.duration_min) || 60;
  var price = parseInt(body.price) || 0;
  var image_url = (body.image_url || '').trim();
  var description = (body.description || '').trim();
  
  if (!name) {
    return errorResponse_('Tên dịch vụ không được để trống');
  }
  
  var service_id = 'SVC' + new Date().getTime();
  
  sheet.appendRow([
    service_id,
    name,
    category,
    duration_min,
    price,
    image_url,
    true,
    description
  ]);
  
  return successResponse_({
    service_id: service_id,
    name: name,
    category: category,
    duration_min: duration_min,
    price: price,
    image_url: image_url,
    active: true,
    description: description
  });
}

function updateService_(body) {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Services');
  var service_id = body.service_id;
  
  if (!service_id) {
    return errorResponse_('Thiếu service_id');
  }
  
  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === service_id) {
      rowIndex = i + 1; // 1-indexed for sheet
      break;
    }
  }
  
  if (rowIndex === -1) {
    return errorResponse_('Không tìm thấy dịch vụ', 404);
  }
  
  // Update fields if provided
  if (body.name !== undefined) sheet.getRange(rowIndex, 2).setValue(body.name);
  if (body.category !== undefined) sheet.getRange(rowIndex, 3).setValue(body.category);
  if (body.duration_min !== undefined) sheet.getRange(rowIndex, 4).setValue(parseInt(body.duration_min));
  if (body.price !== undefined) sheet.getRange(rowIndex, 5).setValue(parseInt(body.price));
  if (body.image_url !== undefined) sheet.getRange(rowIndex, 6).setValue(body.image_url);
  if (body.active !== undefined) sheet.getRange(rowIndex, 7).setValue(body.active);
  if (body.description !== undefined) sheet.getRange(rowIndex, 8).setValue(body.description);
  
  return successResponse_({ service_id: service_id, updated: true });
}

function deleteService_(body) {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Services');
  var service_id = body.service_id;
  
  if (!service_id) {
    return errorResponse_('Thiếu service_id');
  }
  
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === service_id) {
      sheet.deleteRow(i + 1);
      return successResponse_({ deleted: true });
    }
  }
  
  return errorResponse_('Không tìm thấy dịch vụ', 404);
}
