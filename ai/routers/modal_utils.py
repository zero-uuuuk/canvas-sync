"""
Modal 유틸리티 모듈
"""
import asyncio
import logging

import modal

from config import settings
from services.gemini_service import gemini_service

logger = logging.getLogger(__name__)

stub = modal.App(name=settings.MODAL_APP_NAME)


@stub.function(
    name=settings.MODAL_FUNCTION_NAME,
    gpu="T4",
    timeout=settings.MODAL_CALL_TIMEOUT,
)
def modal_generate_image_edit(prompt: str, image_bytes: bytes) -> bytes:
    """Modal GPU 환경에서 이미지 편집 수행"""
    return gemini_service.generate_image_edit(image_bytes=image_bytes, prompt=prompt)


def image_to_base64(image_bytes: bytes) -> str:
    """이미지 바이트 데이터를 Base64 문자열로 변환"""
    return gemini_service.image_to_base64(image_bytes)


async def generate_image_edit(prompt: str, image_bytes: bytes) -> bytes:
    """Modal GPU를 호출하거나 로컬 Gemini 서비스로 폴백"""
    if not settings.USE_MODAL_GPU:
        logger.info("Modal GPU 비활성화 - 로컬 서비스 사용")
        return gemini_service.generate_image_edit(image_bytes=image_bytes, prompt=prompt)

    try:
        function = modal.Function.lookup(settings.MODAL_APP_NAME, settings.MODAL_FUNCTION_NAME)

        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(
            None, lambda: function.call(prompt, image_bytes)
        )
    except Exception:
        logger.exception("Modal 호출 실패 - 로컬 서비스로 폴백")
        return gemini_service.generate_image_edit(image_bytes=image_bytes, prompt=prompt)


__all__ = ["generate_image_edit", "image_to_base64", "modal_generate_image_edit", "stub"]