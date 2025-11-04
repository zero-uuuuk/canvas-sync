import type { CanvasObjectCreateRequest, CanvasObjectResponse } from '../types/canvas';
import type { ApiError } from '../types/auth';

const API_BASE_URL = 'http://localhost:8080/api';

export const canvasApi = {
  /**
   * 캔버스 객체 생성
   */
  async createCanvasObject(
    roomId: string,
    request: CanvasObjectCreateRequest
  ): Promise<CanvasObjectResponse> {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/canvas-objects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || '캔버스 객체 생성에 실패했습니다.');
    }

    return response.json();
  },

  /**
   * 방의 캔버스 객체 목록 조회
   */
  async getCanvasObjects(roomId: string): Promise<CanvasObjectResponse[]> {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/canvas-objects`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || '캔버스 객체 목록을 가져오는데 실패했습니다.');
    }

    return response.json();
  },

  /**
   * Undo: 가장 최근에 생성된 캔버스 객체 삭제
   */
  async undoCanvasObject(roomId: string): Promise<CanvasObjectResponse> {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/canvas-objects/undo`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'Undo에 실패했습니다.');
    }

    return response.json();
  },

  /**
   * Redo: 가장 최근에 삭제된 캔버스 객체 복구
   */
  async redoCanvasObject(roomId: string): Promise<CanvasObjectResponse> {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/canvas-objects/redo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'Redo에 실패했습니다.');
    }

    return response.json();
  },
};

