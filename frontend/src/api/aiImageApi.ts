import type { AIImageConversionRequest, AIImageConversionResponse } from '../types/aiImage';
import { apiPost } from '../utils/apiClient';

export const aiImageApi = {
  /**
   * 선택된 객체들을 AI 이미지로 변환 요청
   */
  async convertToImage(
    roomId: string,
    request: AIImageConversionRequest
  ): Promise<AIImageConversionResponse> {
    return apiPost<AIImageConversionResponse>(`/rooms/${roomId}/ai-image-conversion`, request);
  },
};

