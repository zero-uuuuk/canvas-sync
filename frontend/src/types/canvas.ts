// Canvas Object types matching backend
export interface CanvasObjectCreateRequest {
  objectType: string; // "line", "text", "circle", etc.
  objectData: string; // JSON 문자열
}

export interface CanvasObjectUpdateRequest {
  objectData: string; // 업데이트할 객체 데이터 (JSON 문자열)
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

// Path object data structure (for freehand drawing)
export interface PathObjectData {
  points: Array<{ x: number; y: number }>;
  color: string;
  strokeWidth: number;
}

