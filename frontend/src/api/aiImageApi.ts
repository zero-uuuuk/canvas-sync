import type { AIImageConversionRequest, AIImageConversionResponse } from '../types/aiImage';
import { getToken } from '../utils/tokenStorage';

const API_BASE_URL = 'http://localhost:8080/api';

export const aiImageApi = {
  /**
   * 선택된 객체들을 AI 이미지로 변환 요청
   */
  async convertToImage(
    roomId: string,
    request: AIImageConversionRequest
  ): Promise<AIImageConversionResponse> {
    // FormData 생성
    const formData = new FormData();
    
    // selectedObjectIds를 JSON 배열로 추가
    formData.append('selectedObjectIds', JSON.stringify(request.selectedObjectIds));
    
    // prompt 추가
    formData.append('prompt', request.prompt);
    
    // image 파일 추가
    formData.append('image', request.image, 'selected-area.png');
    
    // 토큰 가져오기
    const token = getToken();
    
    // fetch 요청
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/ai-image-conversion`, {
      method: 'POST',
      headers: token ? {
        'Authorization': `Bearer ${token}`,
      } : {},
      body: formData,
    });
    
    if (!response.ok) {
      let errorMessage = '요청에 실패했습니다.';
      try {
        const error = await response.json();
        errorMessage = error.message || error.error || errorMessage;
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    return response.json();
  },
};

