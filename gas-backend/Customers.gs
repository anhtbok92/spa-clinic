/**
 * Customers Module - Admin functions
 */

function listCustomers_(e) {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Customers');
  
  if (!sheet || sheet.getLastRow() <= 1) {
    return successResponse_([]);
  }
  
  var data = sheet.getDataRange().getValues();
  var search = (e.parameter.search || '').trim().toLowerCase();
  var customers = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var phone = row[1].toString();
    var name = row[2].toString();
    
    // Filter by search if provided
    if (search && name.toLowerCase().indexOf(search) === -1 && phone.indexOf(search) === -1) {
      continue;
    }
    
    customers.push({
      customer_id: row[0],
      phone: phone,
      name: name,
      created_at: row[3]
    });
  }
  
  return successResponse_(customers);
}

function getCustomerDetail_(e) {
  var phone = (e.parameter.phone || '').trim();
  
  if (!phone) {
    return errorResponse_('Thiếu số điện thoại');
  }
  
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  
  // Get customer info
  var customerSheet = ss.getSheetByName('Customers');
  var customerData = customerSheet.getDataRange().getValues();
  var customer = null;
  
  for (var i = 1; i < customerData.length; i++) {
    if (customerData[i][1].toString().trim() === phone) {
      customer = {
        customer_id: customerData[i][0],
        phone: customerData[i][1].toString(),
        name: customerData[i][2],
        created_at: customerData[i][3]
      };
      break;
    }
  }
  
  if (!customer) {
    return errorResponse_('Không tìm thấy khách hàng', 404);
  }
  
  // Get booking history
  var bookingsSheet = ss.getSheetByName('Bookings');
  var bookings = [];
  
  if (bookingsSheet && bookingsSheet.getLastRow() > 1) {
    var bookingsData = bookingsSheet.getDataRange().getValues();
    
    for (var i = 1; i < bookingsData.length; i++) {
      if (bookingsData[i][1].toString().trim() === phone) {
        bookings.push({
          booking_id: bookingsData[i][0],
          service_names: bookingsData[i][8],
          staff_id: bookingsData[i][4],
          date: formatDate_(bookingsData[i][5]),
          start_time: bookingsData[i][6],
          end_time: bookingsData[i][7],
          status: bookingsData[i][9],
          note: bookingsData[i][10],
          created_at: bookingsData[i][11]
        });
      }
    }
    
    // Sort by date descending
    bookings.sort(function(a, b) {
      return new Date(b.date + 'T' + b.start_time) - new Date(a.date + 'T' + a.start_time);
    });
  }
  
  customer.bookings = bookings;
  customer.total_bookings = bookings.length;
  customer.completed_bookings = bookings.filter(function(b) { return b.status === 'completed'; }).length;
  
  return successResponse_(customer);
}
