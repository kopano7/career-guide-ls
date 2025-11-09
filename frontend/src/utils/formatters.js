export const formatCurrency = (amount, currency = 'LSL') => {
  return new Intl.NumberFormat('en-LS', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const formatRole = (role) => {
  const roleMap = {
    student: 'Student',
    institute: 'Institution',
    company: 'Company',
    admin: 'Administrator'
  };
  
  return roleMap[role] || capitalizeFirst(role);
};