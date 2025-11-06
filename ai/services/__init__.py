"""서비스 모듈"""

from .gemini_service import gemini_service


def generate_image_edit(*, prompt: str, image_bytes: bytes):
    """Gemini 서비스 래퍼 (직접 호출용)"""
    return gemini_service.generate_image_edit(image_bytes=image_bytes, prompt=prompt)


def image_to_base64(image_bytes: bytes) -> str:
    """Gemini 서비스의 Base64 변환 헬퍼"""
    return gemini_service.image_to_base64(image_bytes)


__all__ = ["generate_image_edit", "image_to_base64", "gemini_service"]
