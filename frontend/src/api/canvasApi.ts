import type { CanvasObjectCreateRequest, CanvasObjectResponse, CanvasObjectUpdateRequest } from '../types/canvas';
import { apiGet, apiPost, apiDelete, apiPut } from '../utils/apiClient';

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

  /**
   * 개별 캔버스 객체 삭제
   */
  async deleteCanvasObject(roomId: string, objectId: string): Promise<CanvasObjectResponse> {
    return apiDelete<CanvasObjectResponse>(`/rooms/${roomId}/canvas-objects/${objectId}`);
  },

  /**
   * 캔버스 객체 업데이트
   */
  async updateCanvasObject(
    roomId: string,
    objectId: string,
    request: CanvasObjectUpdateRequest
  ): Promise<CanvasObjectResponse> {
    return apiPut<CanvasObjectResponse>(`/rooms/${roomId}/canvas-objects/${objectId}`, request);
  },
};

