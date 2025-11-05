// Room DTO types matching backend
export interface RoomCreateRequest {
  title?: string;
  isAnonymous?: boolean;
}

export interface RoomCreateResponse {
  roomId: string;
  roomUrl: string;
}

export interface RoomResponse {
  roomId: string;
  title: string;
  ownerId: string | null;
  ownerName: string;
  createdAt: string;
  lastUpdatedAt: string;
}

export interface InvitationCreateResponse {
  invitationId: string;
  invitationToken: string;
  invitationUrl: string;
  expiresAt: string;
}

