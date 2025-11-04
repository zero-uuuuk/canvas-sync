import { getToken } from './tokenStorage';
import type { ApiError } from '../types/auth';

const API_BASE_URL = 'http://localhost:8080/api';

/**
 * 공통 fetch 함수
 * Authorization 헤더를 자동으로 추가하고, 에러 처리를 담당합니다.
 * 
 * @param url API 엔드포인트 (상대 경로)
 * @param options fetch 옵션
 * @returns Response 객체
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // 기본 헤더 설정
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // 토큰이 있으면 Authorization 헤더 추가
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 전체 URL 구성
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  // fetch 요청
  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  return response;
}

/**
 * API 응답 파싱 및 에러 처리
 * 
 * @param response Response 객체
 * @returns 파싱된 JSON 데이터
 * @throws Error 응답이 실패한 경우
 */
export async function parseApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = '요청에 실패했습니다.';
    
    try {
      const error: ApiError = await response.json();
      errorMessage = error.message || error.error || errorMessage;
    } catch {
      // JSON 파싱 실패 시 기본 메시지 사용
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    
    throw new Error(errorMessage);
  }

  // 응답 본문이 없는 경우 (예: 204 No Content)
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return {} as T;
  }

  return response.json();
}

/**
 * GET 요청 헬퍼
 */
export async function apiGet<T>(url: string): Promise<T> {
  const response = await apiFetch(url, {
    method: 'GET',
  });
  return parseApiResponse<T>(response);
}

/**
 * POST 요청 헬퍼
 */
export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const response = await apiFetch(url, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
  return parseApiResponse<T>(response);
}

/**
 * PUT 요청 헬퍼
 */
export async function apiPut<T>(url: string, body?: unknown): Promise<T> {
  const response = await apiFetch(url, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
  return parseApiResponse<T>(response);
}

/**
 * DELETE 요청 헬퍼
 */
export async function apiDelete<T>(url: string): Promise<T> {
  const response = await apiFetch(url, {
    method: 'DELETE',
  });
  return parseApiResponse<T>(response);
}

