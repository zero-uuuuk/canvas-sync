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

// Image object data structure
export interface ImageObjectData {
  imageData: string; // Base64 인코딩된 이미지 데이터
  width: number;
  height: number;
  x?: number; // 이미지 위치 X 좌표 (기본값: 0)
  y?: number; // 이미지 위치 Y 좌표 (기본값: 0)
}

