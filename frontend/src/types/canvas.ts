// Canvas Object types matching backend
export interface CanvasObjectCreateRequest {
  objectType: string; // "line", "text", "circle", etc.
  objectData: string; // JSON 문자열
}

export interface CanvasObjectResponse {
  objectId: string;
  roomId: string;
  creatorId: string;
  objectType: string;
  objectData: string; // JSON 문자열
  createdAt: string;
}

// Line object data structure
export interface LineObjectData {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  strokeWidth: number;
}

