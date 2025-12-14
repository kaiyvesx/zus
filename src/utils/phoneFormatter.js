// Utility function to format phone numbers with automatic "63" prefix
// Users only need to enter 10 digits, and "63" will be added automatically

export const formatPhoneInput = (value) => {
  // Remove all non-digit characters
  const digitsOnly = value.replace(/\D/g, '');
  
  // If empty, return empty
  if (!digitsOnly) {
    return '';
  }
  
  // If it already starts with 63, keep it (max 12 digits: 63 + 10)
  if (digitsOnly.startsWith('63')) {
    return digitsOnly.substring(0, 12);
  }
  
  // If it's 10 digits, add "63" prefix
  if (digitsOnly.length === 10) {
    return '63' + digitsOnly;
  }
  
  // If less than 10 digits, just return the digits (will add 63 when it reaches 10)
  if (digitsOnly.length < 10) {
    return digitsOnly;
  }
  
  // If more than 10 digits but doesn't start with 63, take first 10 and add 63
  if (digitsOnly.length > 10) {
    return '63' + digitsOnly.substring(0, 10);
  }
  
  return digitsOnly;
};

// Function to get the display value (show 10 digits if it starts with 63, otherwise show as is)
export const getPhoneDisplayValue = (value) => {
  if (!value) return '';
  
  const digitsOnly = value.replace(/\D/g, '');
  
  // If it starts with 63 and is 12 digits, show only the last 10 digits
  if (digitsOnly.startsWith('63') && digitsOnly.length === 12) {
    return digitsOnly.substring(2);
  }
  
  // Otherwise show as is (for backwards compatibility)
  return digitsOnly;
};

// Function to get the full phone number with 63 prefix for API calls
export const getFullPhoneNumber = (value) => {
  if (!value) return '';
  
  const digitsOnly = value.replace(/\D/g, '');
  
  // If it already starts with 63, return as is
  if (digitsOnly.startsWith('63')) {
    return digitsOnly.substring(0, 12);
  }
  
  // If it's 10 digits, add 63 prefix
  if (digitsOnly.length === 10) {
    return '63' + digitsOnly;
  }
  
  // If less than 10 digits, pad or return empty
  if (digitsOnly.length < 10) {
    return ''; // Don't send incomplete numbers
  }
  
  // If more than 10 digits, take first 10 and add 63
  return '63' + digitsOnly.substring(0, 10);
};

