/**
 * Utility Functions
 */

function formatDate_(date) {
  if (!date) return '';
  if (typeof date === 'string') {
    // Already formatted or ISO string
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) return date;
    date = new Date(date);
  }
  if (date instanceof Date && !isNaN(date)) {
    var y = date.getFullYear();
    var m = padZero_(date.getMonth() + 1);
    var d = padZero_(date.getDate());
    return y + '-' + m + '-' + d;
  }
  return '';
}

function padZero_(num) {
  return num < 10 ? '0' + num : '' + num;
}

function timeToMinutes_(timeStr) {
  if (!timeStr) return 0;
  var parts = timeStr.toString().split(':');
  return parseInt(parts[0]) * 60 + parseInt(parts[1] || 0);
}

function generateId_(prefix) {
  return prefix + new Date().getTime() + Math.random().toString(36).substr(2, 4);
}
