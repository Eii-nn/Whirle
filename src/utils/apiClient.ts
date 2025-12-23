import { handleUnauthorized, handleServerOffline } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/**
 * Checks if an error is a network/server offline error
 */
const isNetworkError = (error: unknown): boolean => {
  if (error instanceof TypeError) {
    // Network errors like "Failed to fetch", "NetworkError", connection refused
    return error.message.includes('fetch') || 
           error.message.includes('network') ||
           error.message.includes('Failed to fetch');
  }
  if (error instanceof Error) {
    return error.name === 'NetworkError' || 
           error.message.includes('network') ||
           error.message.includes('ECONNREFUSED') ||
           error.message.includes('ENOTFOUND');
  }
  return false;
};

/**
 * Wrapper for fetch that handles 401 responses and network errors by clearing session and redirecting to login
 */
export const apiFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  try {
    const response = await fetch(url, options);

    // Handle 401 Unauthorized responses
    if (response.status === 401) {
      handleUnauthorized('Your session has expired. Please log in again.');
      throw new Error('Unauthorized');
    }

    return response;
  } catch (error) {
    // Handle network errors (server offline, no internet, connection refused)
    if (isNetworkError(error)) {
      handleServerOffline('Server is offline. Please try again later.');
      throw error;
    }
    // Re-throw other errors
    throw error;
  }
};

/**
 * Gets authentication headers with token from localStorage
 */
export const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('jwt_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export { API_BASE_URL };

