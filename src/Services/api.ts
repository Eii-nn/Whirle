import { apiFetch, API_BASE_URL } from '../utils/apiClient';

export interface User {
  id: number;
  username: string;
  email: string;
  bio: string;
  birthdate: string;
  'country-code': string;
  'country-name'?: string;
  avatar_url?: string;
}

export interface Friend {
  id: number;
  username: string;
  bio: string;
  bdate: string;
  'country-code': string;
  'country-name': string;
  avatar: string;
}

export interface Message {
  ID: number;
  SenderID: number;
  ReceiverID: number;
  Content: string;
  Timestamp: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  'confirm-password': string;
  bio: string;
  birthdate: string; // YYYY-MM-DD format
  'country-code': string; // ISO 3166-1 alpha-3 code
}

export interface RegisterResponse {
  status: number;
  token: string;
  user: User;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  status: number;
  token: string;
  user?: User;
  'user:'?: User;
}

export interface ApiError {
  status: number;
  error: string;
  fields?: Record<string, string>;
}

export const registerUser = async (data: RegisterRequest): Promise<RegisterResponse> => {
  const response = await apiFetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const responseData = await response.json();

  if (!response.ok) {
    const error: ApiError = responseData;
    throw error;
  }

  return responseData as RegisterResponse;
};

export const loginUser = async (data: LoginRequest): Promise<LoginResponse> => {
  // Don't use apiFetch for login - login errors should be handled by the component
  // apiFetch would redirect on 401, causing input values to be lost
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const responseData = await response.json();

  if (!response.ok) {
    const error: ApiError = responseData;
    throw error;
  }

  const normalizedUser = responseData.user ?? responseData['user:'];

  if (normalizedUser) {
    responseData.user = normalizedUser;
    delete responseData['user:'];
  }

  return responseData as LoginResponse;
};




