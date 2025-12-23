/**
 * Clears all user and session related data from localStorage
 */
export const clearSessionData = () => {
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('user');
  localStorage.removeItem('random_chat_session');
};

/**
 * Handles unauthorized access by clearing session and redirecting to login
 * @param message - Optional message to pass to login page
 */
export const handleUnauthorized = (message?: string) => {
  clearSessionData();
  const loginUrl = message 
    ? `/login?message=${encodeURIComponent(message)}`
    : '/login?message=' + encodeURIComponent('Your session has expired. Please log in again.');
  window.location.href = loginUrl;
};

/**
 * Handles server offline/network errors by clearing session and redirecting to login
 * @param message - Optional message to pass to login page
 */
export const handleServerOffline = (message?: string) => {
  clearSessionData();
  const loginUrl = message 
    ? `/login?message=${encodeURIComponent(message)}`
    : '/login?message=' + encodeURIComponent('Server is offline. Please try again later.');
  window.location.href = loginUrl;
};

