"""
Gemini API 서비스
"""
import base64
import logging
from typing import Optional
from io import BytesIO
from google import genai
from PIL import Image
from rembg import remove
import sys
import os

# 상위 디렉토리를 경로에 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import settings

logger = logging.getLogger(__name__)


class GeminiService:
    """Gemini API 서비스 클래스"""
    
    def __init__(self):
        """Gemini API 클라이언트 초기화"""
        if not settings.GOOGLE_API_KEY:
            logger.warning("GOOGLE_API_KEY가 설정되지 않았습니다.")
            self.client = None
        else:
            self.client = genai.Client(api_key=settings.GOOGLE_API_KEY)
            logger.info("Gemini API 클라이언트 초기화 완료")
    
    def generate_image_edit(
        self,
        image_bytes: bytes,
        prompt: str
    ) -> Optional[bytes]:
        """
        이미지와 프롬프트로 이미지 편집
        
        Args:
            image_bytes: 원본 이미지 바이트 데이터
            prompt: 이미지 편집 프롬프트
            
        Returns:
            편집된 이미지 바이트 데이터 (PNG 형식)
        """
        if not self.client:
            raise ValueError("API 키가 설정되지 않았습니다.")
        
        try:
            logger.info(f"이미지 편집 요청: {prompt[:50]}...")
            
            # 이미지 바이트를 PIL Image로 변환
            image = Image.open(BytesIO(image_bytes))

            # 프롬프트에 스티커 스타일 키워드 추가
            enhanced_prompt = (
                f"{prompt}. "
                f"Create this as a simple sticker-style shape on a pure white background. "
                f"Keep the shape simple and clean, similar to the original drawing, "
                f"with no complex background or details."
            )

            logger.info(f"향상된 프롬프트: {enhanced_prompt[:100]}...")
            
            # Gemini API 호출
            response = self.client.models.generate_content(
                model=settings.MODEL_ID,
                contents=[enhanced_prompt, image],
            )
            
            # 응답에서 이미지 추출
            for part in response.candidates[0].content.parts:
                if part.text is not None:
                    logger.info(f"응답 텍스트: {part.text}")
                elif part.inline_data is not None:
                    # 응답 이미지를 PIL Image로 변환
                    response_image = Image.open(BytesIO(part.inline_data.data))
                    
                    # 배경 제거
                    logger.info("배경 제거 중...")
                    output_image = remove(response_image)
                    
                    # PNG 형식으로 변환 (투명 배경)
                    png_buffer = BytesIO()
                    output_image.save(png_buffer, format="PNG")
                    png_bytes = png_buffer.getvalue()
                    
                    logger.info("이미지 편집 및 배경 제거 완료 (PNG 형식, 투명 배경)")
                    return png_bytes
            
            raise ValueError("이미지 데이터를 찾을 수 없습니다.")
            
        except Exception as e:
            logger.error(f"이미지 편집 실패: {str(e)}")
            raise
    
    def image_to_base64(self, image_bytes: bytes) -> str:
        """이미지 바이트를 Base64 문자열로 변환"""
        return base64.b64encode(image_bytes).decode('utf-8')


# 싱글톤 인스턴스
gemini_service = GeminiService()

