/**
 * Auth Module - Login & Token Management
 */

function hashPassword_(password) {
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  return raw.map(function(b) {
    return ('0' + (b & 0xFF).toString(16)).slice(-2);
  }).join('');
}

function login_(body) {
  var email = (body.email || '').trim().toLowerCase();
  var password = body.password || '';
  
  if (!email || !password) {
    return errorResponse_('Email và mật khẩu không được để trống');
  }
  
  var passwordHash = hashPassword_(password);
  
  // Check against Script Properties (single admin mode)
  if (email === CONFIG.ADMIN_EMAIL.toLowerCase() && passwordHash === CONFIG.ADMIN_PASSWORD_HASH) {
    var token = Utilities.getUuid();
    var cache = CacheService.getScriptCache();
    cache.put('admin_token_' + token, email, 21600); // 6 hours TTL
    return successResponse_({ token: token, name: 'Admin', email: email });
  }
  
  // Check Admins sheet if exists
  try {
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    var adminSheet = ss.getSheetByName('Admins');
    if (adminSheet && adminSheet.getLastRow() > 1) {
      var data = adminSheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (data[i][1].toString().toLowerCase() === email && data[i][2] === passwordHash) {
          var token = Utilities.getUuid();
          var cache = CacheService.getScriptCache();
          cache.put('admin_token_' + token, email, 21600);
          return successResponse_({ token: token, name: data[i][3], email: email });
        }
      }
    }
  } catch (err) {
    // Admins sheet not available, only check Script Properties
  }
  
  return errorResponse_('Email hoặc mật khẩu không đúng', 401);
}

function validateToken_(token) {
  if (!token) return false;
  var cache = CacheService.getScriptCache();
  var email = cache.get('admin_token_' + token);
  return !!email;
}

function withAuth_(e, handler) {
  var token = e.parameter.token;
  if (!validateToken_(token)) {
    return errorResponse_('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại', 401);
  }
  return handler(e);
}

function withAuthPost_(body, handler) {
  var token = body.token;
  if (!validateToken_(token)) {
    return errorResponse_('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại', 401);
  }
  return handler(body);
}
