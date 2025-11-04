/**
 * JWT 토큰 저장 및 관리 유틸리티
 * localStorage를 사용하여 토큰을 저장하고 관리합니다.
 */

const TOKEN_KEY = 'auth_token';

/**
 * 토큰을 localStorage에 저장
 * @param token JWT 토큰
 */
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * localStorage에서 토큰 가져오기
 * @returns JWT 토큰 또는 null
 */
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * localStorage에서 토큰 제거
 */
export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * 토큰이 존재하는지 확인
 * @returns 토큰이 있으면 true
 */
export const hasToken = (): boolean => {
  return getToken() !== null;
};

