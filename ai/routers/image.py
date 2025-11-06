"""
이미지 편집 라우터
"""
import logging
import sys
import os
from fastapi import APIRouter, HTTPException, UploadFile, File, Form

# 상위 디렉토리를 경로에 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import ImageEditResponse
from services import image_to_base64, generate_image_edit

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/generate", tags=["Image Generation"])


@router.post("/image-to-image", response_model=ImageEditResponse)
async def generate_image_to_image(
    prompt: str = Form(...),
    image: UploadFile = File(...)
):
    """
    이미지와 프롬프트로 이미지 편집/생성
    
    - **prompt**: 이미지 편집 프롬프트
    - **image**: 업로드할 이미지 파일
    """
    try:
        # 이미지 파일 읽기
        image_bytes = await image.read()
        
        logger.info(f"이미지 편집 요청 수신: 파일명={image.filename}, 크기={len(image_bytes)} bytes")
        
        # 이미지 편집
        edited_image_bytes = await generate_image_edit(
            prompt=prompt,
            image_bytes=image_bytes,
        )
        
        # Base64로 인코딩
        image_base64 = image_to_base64(edited_image_bytes)
        
        return ImageEditResponse(
            success=True,
            message="이미지 편집 완료",
            image_data=image_base64
        )
        
    except ValueError as e:
        logger.error(f"요청 오류: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"이미지 편집 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=f"이미지 편집 실패: {str(e)}")

