import type { CanvasObjectCreateRequest, CanvasObjectResponse } from '../types/canvas';
import { apiGet, apiPost, apiDelete } from '../utils/apiClient';

export const canvasApi = {
  /**
   * 캔버스 객체 생성
   */
  async createCanvasObject(
    roomId: string,
    request: CanvasObjectCreateRequest
  ): Promise<CanvasObjectResponse> {
    return apiPost<CanvasObjectResponse>(`/rooms/${roomId}/canvas-objects`, request);
  },

  /**
   * 방의 캔버스 객체 목록 조회
   */
  async getCanvasObjects(roomId: string): Promise<CanvasObjectResponse[]> {
    return apiGet<CanvasObjectResponse[]>(`/rooms/${roomId}/canvas-objects`);
  },

  /**
   * Undo: 가장 최근에 생성된 캔버스 객체 삭제
   */
  async undoCanvasObject(roomId: string): Promise<CanvasObjectResponse> {
    return apiDelete<CanvasObjectResponse>(`/rooms/${roomId}/canvas-objects/undo`);
  },

  /**
   * Redo: 가장 최근에 삭제된 캔버스 객체 복구
   */
  async redoCanvasObject(roomId: string): Promise<CanvasObjectResponse> {
    return apiPost<CanvasObjectResponse>(`/rooms/${roomId}/canvas-objects/redo`);
  },
};

