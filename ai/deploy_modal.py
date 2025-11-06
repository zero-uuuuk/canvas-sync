"""Modal GPU 함수 정의"""
from __future__ import annotations

from pathlib import Path

from modal import App, Image, Secret

APP_NAME = "canvas-sync-gpu-worker"

app = App(name=APP_NAME)

APP_DIR = Path(__file__).parent

BASE_IMAGE = (
    Image.debian_slim()
    .pip_install_from_requirements(APP_DIR / "requirements.txt")
    .add_local_dir(
        APP_DIR,
        remote_path="/root",
        ignore=lambda path: (
            "venv" in Path(path).parts
            or "__pycache__" in Path(path).parts
        ),
    )
)

GOOGLE_SECRET = Secret.from_name("google-api-key")


def _ensure_path() -> None:
    """원격 컨테이너에서 파이썬 경로 구성"""
    import os
    import sys

    os.chdir("/root")
    if "/root" not in sys.path:
        sys.path.insert(0, "/root")


_service = None


def _get_service():
    global _service

    if _service is None:
        _ensure_path()
        from services.gemini_service import GeminiService

        _service = GeminiService()

    return _service


@app.function(
    image=BASE_IMAGE,
    gpu="T4",
    secrets=[GOOGLE_SECRET],
    scaledown_window=300,
)
def generate_image_edit(prompt: str, image_bytes: bytes) -> bytes:
    """Gemini 이미지 편집을 GPU에서 실행"""
    service = _get_service()
    return service.generate_image_edit(image_bytes=image_bytes, prompt=prompt)


