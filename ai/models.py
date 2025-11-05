"""
Pydantic 모델
"""
from typing import Optional
from pydantic import BaseModel


class ImageEditResponse(BaseModel):
    """이미지 편집 응답"""
    success: bool
    message: str
    image_data: Optional[str] = None  # Base64 인코딩된 PNG 이미지

