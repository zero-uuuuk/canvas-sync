import type { UserLoginRequest, UserLoginResponse, UserSignupRequest, UserSignupResponse, UserLogoutResponse } from '../types/auth';
import { apiPost } from '../utils/apiClient';
import { setToken, removeToken } from '../utils/tokenStorage';

export const authApi = {
  /**
   * 회원가입
   */
  async signup(request: UserSignupRequest): Promise<UserSignupResponse> {
    return apiPost<UserSignupResponse>('/users/signup', request);
  },

  /**
   * 로그인
   * 로그인 성공 시 토큰을 자동으로 저장합니다.
   */
  async login(request: UserLoginRequest): Promise<UserLoginResponse> {
    const response = await apiPost<UserLoginResponse>('/users/login', request);
    
    // 로그인 성공 시 토큰 저장
    if (response.token) {
      setToken(response.token);
    }
    
    return response;
  },

  /**
   * 로그아웃
   * 로그아웃 시 토큰을 자동으로 제거합니다.
   */
  async logout(): Promise<UserLogoutResponse> {
    const response = await apiPost<UserLogoutResponse>('/users/logout');
    
    // 로그아웃 시 토큰 제거
    removeToken();
    
    return response;
  },
};

