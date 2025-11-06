"""Modal GPU 호출 클라이언트"""
from __future__ import annotations

import asyncio
import base64
import logging
from typing import Optional

try:
    import modal  # type: ignore
except ImportError:  # pragma: no cover - optional dependency
    modal = None  # type: ignore

from config import settings

logger = logging.getLogger(__name__)

_modal_function: Optional["modal.Function"] = None  # type: ignore[name-defined]
_local_service = None


def _get_modal_function() -> Optional["modal.Function"]:  # type: ignore[name-defined]
    """Modal 함수 조회"""
    global _modal_function

    if not settings.USE_MODAL_GPU:
        return None

    if modal is None:
        logger.warning("modal 패키지를 찾을 수 없습니다. 로컬 모드로 전환합니다.")
        return None

    if _modal_function is not None:
        return _modal_function

    try:
        _modal_function = modal.Function.lookup(  # type: ignore[attr-defined]
            settings.MODAL_APP_NAME,
            settings.MODAL_FUNCTION_NAME,
        )
        logger.info(
            "Modal 함수 조회 완료: app=%s, function=%s",
            settings.MODAL_APP_NAME,
            settings.MODAL_FUNCTION_NAME,
        )
        return _modal_function
    except Exception as exc:  # pragma: no cover - 네트워크 오류 등
        logger.error("Modal 함수 조회 실패: %s", exc)
        return None


def _get_local_service():
    """로컬 Gemini 서비스 반환"""
    global _local_service

    if _local_service is None:
        from services.gemini_service import GeminiService

        _local_service = GeminiService()
        logger.info("로컬 Gemini 서비스 초기화 완료")

    return _local_service


async def generate_image_edit(prompt: str, image_bytes: bytes) -> bytes:
    """이미지 편집 (Modal GPU 우선, 실패 시 로컬)"""
    modal_fn = _get_modal_function()

    if modal_fn is not None:
        try:
            return await asyncio.to_thread(
                modal_fn.call,
                prompt,
                image_bytes,
                timeout=settings.MODAL_CALL_TIMEOUT,
            )
        except Exception as exc:  # pragma: no cover - 네트워크 오류 등
            logger.error("Modal GPU 호출 실패. 로컬 처리로 전환: %s", exc)

    service = _get_local_service()
    return service.generate_image_edit(image_bytes=image_bytes, prompt=prompt)


def image_to_base64(image_bytes: bytes) -> str:
    """이미지 바이트를 Base64 문자열로 변환"""
    return base64.b64encode(image_bytes).decode("utf-8")


__all__ = ["generate_image_edit", "image_to_base64"]


