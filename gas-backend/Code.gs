/**
 * Spa/Nail Booking System - Main Entry Point
 * Google Apps Script Backend
 * 
 * Routing: doGet/doPost với parameter `action`
 */

// ============== CONFIG ==============
var CONFIG = {
  SPREADSHEET_ID: PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || '',
  ADMIN_EMAIL: PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL') || 'admin@spa.com',
  ADMIN_PASSWORD_HASH: PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD_HASH') || '',
  CANCEL_HOURS_LIMIT: 2,
  WORKING_HOURS_START: 9,  // 9:00
  WORKING_HOURS_END: 21,   // 21:00
  SLOT_INTERVAL: 30        // 30 phút mỗi slot
};

// ============== RESPONSE HELPERS ==============
function createJsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function successResponse_(data) {
  return createJsonResponse_({ success: true, data: data });
}

function errorResponse_(message, code) {
  return createJsonResponse_({ success: false, error: message, code: code || 400 });
}

// ============== ROUTING ==============
function doGet(e) {
  var action = e.parameter.action;
  
  try {
    switch (action) {
      // Public
      case 'getServices':
        return getServices_(e);
      case 'getStaff':
        return getStaffPublic_(e);
      case 'getAvailableSlots':
        return getAvailableSlots_(e);
      case 'getBookingsByPhone':
        return getBookingsByPhone_(e);
      
      // Admin
      case 'listBookings':
        return withAuth_(e, listBookings_);
      case 'listServices':
        return withAuth_(e, listServicesAdmin_);
      case 'listStaff':
        return withAuth_(e, listStaffAdmin_);
      case 'listCustomers':
        return withAuth_(e, listCustomers_);
      case 'getCustomerDetail':
        return withAuth_(e, getCustomerDetail_);
      
      default:
        return errorResponse_('Unknown action: ' + action, 404);
    }
  } catch (err) {
    return errorResponse_(err.message, 500);
  }
}

function doPost(e) {
  var params = e.parameter;
  var body = {};
  
  try {
    if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
  } catch (err) {
    // fallback to empty body
  }
  
  var action = params.action || body.action;
  
  try {
    switch (action) {
      // Public
      case 'createBooking':
        return createBooking_(body);
      case 'cancelBookingByCustomer':
        return cancelBookingByCustomer_(body);
      
      // Admin auth
      case 'login':
        return login_(body);
      
      // Admin CRUD
      case 'createBookingByAdmin':
        return withAuthPost_(body, createBookingByAdmin_);
      case 'updateBookingStatus':
        return withAuthPost_(body, updateBookingStatus_);
      case 'createService':
        return withAuthPost_(body, createService_);
      case 'updateService':
        return withAuthPost_(body, updateService_);
      case 'deleteService':
        return withAuthPost_(body, deleteService_);
      case 'createStaff':
        return withAuthPost_(body, createStaff_);
      case 'updateStaff':
        return withAuthPost_(body, updateStaff_);
      case 'deleteStaff':
        return withAuthPost_(body, deleteStaff_);
      
      default:
        return errorResponse_('Unknown action: ' + action, 404);
    }
  } catch (err) {
    return errorResponse_(err.message, 500);
  }
}
