// AI Image Conversion types matching backend
export interface AIImageConversionRequest {
  selectedObjectIds: string[]; // 선택된 객체 ID 목록
  prompt: string; // 사용자가 입력한 프롬프트
}

export interface AIImageConversionResponse {
  conversionId: string; // 변환 작업 ID
  status: string; // 변환 상태 (PENDING, PROCESSING, COMPLETED, FAILED)
  message: string; // 상태 메시지
}

