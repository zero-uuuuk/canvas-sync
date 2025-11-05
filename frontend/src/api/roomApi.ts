import type { RoomCreateRequest, RoomCreateResponse, RoomResponse, InvitationCreateResponse, InvitationAcceptResponse } from '../types/room';
import { apiGet, apiPost } from '../utils/apiClient';

export const roomApi = {
  /**
   * 새 방 생성
   */
  async createRoom(request: RoomCreateRequest): Promise<RoomCreateResponse> {
    return apiPost<RoomCreateResponse>('/rooms', request);
  },

  /**
   * 전체 방 리스트 조회
   * 최근 업데이트된 순서로 정렬된 방 목록을 반환
   */
  async getAllRooms(): Promise<RoomResponse[]> {
    return apiGet<RoomResponse[]>('/rooms');
  },

  /**
   * 방 정보 조회
   */
  async getRoom(roomId: string): Promise<RoomResponse> {
    return apiGet<RoomResponse>(`/rooms/${roomId}`);
  },

  /**
   * 초대 링크 생성
   */
  async createInvitation(roomId: string): Promise<InvitationCreateResponse> {
    return apiPost<InvitationCreateResponse>(`/rooms/${roomId}/invitations`);
  },

  /**
   * 초대 수락
   */
  async acceptInvitation(token: string): Promise<InvitationAcceptResponse> {
    return apiPost<InvitationAcceptResponse>(`/invitations/${token}/accept`);
  },
};

