// User DTO types matching backend
export interface UserSignupRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface UserSignupResponse {
  userId: string;
  email: string;
  displayName: string;
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface UserLoginResponse {
  userId: string;
  email: string;
  displayName: string;
}

export interface UserLogoutResponse {
  message: string;
}

export interface ApiError {
  error: string;
  message: string;
}

// Room API에서도 사용
export type { ApiError as RoomApiError };

