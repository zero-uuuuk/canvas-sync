import type { UserLoginRequest, UserLoginResponse, UserSignupRequest, UserSignupResponse, UserLogoutResponse, ApiError } from '../types/auth';

const API_BASE_URL = 'http://localhost:8080/api';

export const authApi = {
  /**
   * 회원가입
   */
  async signup(request: UserSignupRequest): Promise<UserSignupResponse> {
    const response = await fetch(`${API_BASE_URL}/users/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || '회원가입에 실패했습니다.');
    }

    return response.json();
  },

  /**
   * 로그인
   */
  async login(request: UserLoginRequest): Promise<UserLoginResponse> {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || '로그인에 실패했습니다.');
    }

    return response.json();
  },

  /**
   * 로그아웃
   */
  async logout(): Promise<UserLogoutResponse> {
    const response = await fetch(`${API_BASE_URL}/users/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || '로그아웃에 실패했습니다.');
    }

    return response.json();
  },
};

