import type { RoomCreateRequest, RoomCreateResponse, RoomResponse } from '../types/room';
import type { ApiError } from '../types/auth';

const API_BASE_URL = 'http://localhost:8080/api';

export const roomApi = {
  /**
   * 새 방 생성
   */
  async createRoom(request: RoomCreateRequest): Promise<RoomCreateResponse> {
    const response = await fetch(`${API_BASE_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || '방 생성에 실패했습니다.');
    }

    return response.json();
  },

  /**
   * 전체 방 리스트 조회
   * 최근 업데이트된 순서로 정렬된 방 목록을 반환
   */
  async getAllRooms(): Promise<RoomResponse[]> {
    const response = await fetch(`${API_BASE_URL}/rooms`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || '방 목록을 가져오는데 실패했습니다.');
    }

    return response.json();
  },

  /**
   * 방 정보 조회
   */
  async getRoom(roomId: string): Promise<RoomResponse> {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || '방 정보를 가져오는데 실패했습니다.');
    }

    return response.json();
  },
};

