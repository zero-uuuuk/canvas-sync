# AI Image Generation Service

Gemini 2.5 Flash 이미지를 편집하는 FastAPI 서비스입니다. 웹 애플리케이션은 Render와 같은 CPU 환경에서 동작하고, GPU가 필요한 연산은 Modal serverless GPU 함수로 분리되어 있습니다.

## 아키텍처 개요

- FastAPI (`main.py`): Render 등 일반 CPU 호스트에 배포.
- Modal GPU 함수 (`deploy_modal.py`): T4 GPU가 필요한 이미지 편집 로직을 실행.
- FastAPI → Modal 호출: `services/modal_client.py`에서 Modal 함수를 호출하고, 실패 시 로컬 `GeminiService`로 대체.

## 사전 준비

- Python 3.10 이상
- Google AI Studio API Key (`GOOGLE_API_KEY`)
- Modal 계정 및 CLI (`pip install modal`) 설정

## 설치

```bash
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# 또는
venv\Scripts\activate    # Windows

pip install -r requirements.txt
```

## 환경 변수

`env.example`를 참고해 `.env` 파일을 작성하거나 배포 환경 변수로 설정합니다.

| 변수 | 설명 | 기본값 |
| --- | --- | --- |
| `GOOGLE_API_KEY` | Gemini API 키 (Modal Secret으로도 등록 필요) | 없음 |
| `GEMINI_MODEL_ID` | 사용 모델 ID | `gemini-2.5-flash-image` |
| `API_HOST` / `API_PORT` / `API_RELOAD` | FastAPI 실행 설정 | `0.0.0.0` / `8000` / `true` |
| `CORS_ORIGINS` | 허용 오리진 (콤마 구분) | `http://localhost:3000,...` |
| `MAX_IMAGE_SIZE_MB` / `ALLOWED_IMAGE_TYPES` | 업로드 제한 | `10` / `jpeg,jpg,png,webp` |
| `USE_MODAL_GPU` | Modal GPU 사용 여부 | `true` |
| `MODAL_APP_NAME` / `MODAL_FUNCTION_NAME` | Modal lookup 정보 | `canvas-sync-gpu-worker` / `generate_image_edit` |
| `MODAL_CALL_TIMEOUT` | Modal 호출 타임아웃(초) | `120` |

## 로컬 실행

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- Modal GPU까지 사용하려면 CLI에서 `modal token new` 후 `USE_MODAL_GPU=true`로 설정합니다.
- Modal 연결이 어려운 개발 환경에서는 `USE_MODAL_GPU=false`로 두고 로컬 `GeminiService`로만 실행할 수 있습니다.

## Modal GPU 함수 배포

1. `modal secret create google-api-key GOOGLE_API_KEY=...` 명령으로 API 키를 등록합니다.
2. `modal deploy ai.deploy_modal --name canvas-sync-gpu-worker`로 GPU 함수를 배포합니다.
3. Render에 배포한 FastAPI에서 Modal 토큰/환경 변수를 설정하면 서버가 자동으로 GPU 함수를 호출합니다.

## API 엔드포인트

- `POST /api/generate/image-to-image`
  - FormData: `prompt` (str), `image` (file)
  - 반환: 편집된 이미지(Base64 인코딩), 상태 메시지

Swagger 문서는 `http://localhost:8000/docs`에서 확인할 수 있습니다.