# AI Image Generation Service

FastAPI 기반 Gemini 2.5 Flash Image API 서비스

## 설치

1. Python 가상 환경 생성 (권장)

```bash
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# 또는
venv\Scripts\activate  # Windows
```

2. 의존성 설치

```bash
pip install -r requirements.txt
```

3. 환경 변수 설정

```bash
cp env.example .env
# .env 파일을 열어 API 키 등 설정
```

## 환경 변수

`.env` 파일에 다음 변수들을 설정해야 합니다:

### Google AI Studio 사용 (간단, 무료 티어)

- `USE_VERTEX_AI=false`: Vertex AI 미사용
- `GOOGLE_API_KEY`: Google AI Studio에서 발급받은 API 키

### 공통 설정

- `API_HOST`: 서버 호스트 (기본값: 0.0.0.0)
- `API_PORT`: 서버 포트 (기본값: 8000)
- `CORS_ORIGINS`: CORS 허용 오리진 (콤마로 구분)

## 실행

```bash
# 개발 모드
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 프로덕션 모드
uvicorn main:app --host 0.0.0.0 --port 8000
```

## API 문서

서버 실행 후 다음 URL에서 API 문서 확인:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Vertex AI 인증 설정 상세

### 방법 1: Application Default Credentials (ADC) - 로컬 개발용

```bash
# gcloud CLI 설치 후
gcloud auth application-default login
```

### 방법 2: 서비스 계정 키 파일 - 프로덕션용

1. Google Cloud Console에서 서비스 계정 생성
2. 서비스 계정 키 파일 (JSON) 다운로드
3. 환경 변수 설정:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your-service-account-key.json"
```

또는 `.env` 파일에 추가:

```bash
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your-service-account-key.json
```

### 방법 3: Google Colab 환경

Colab에서는 자동으로 인증이 설정됩니다:

```python
from google.colab import auth
auth.authenticate_user()
```

## 참고 자료

- [Gemini 2.5 Flash Image 가이드](../backend/GEMINI_2_5_FLASH_IMAGE_GUIDE.md)
- [Google AI Studio](https://aistudio.google.com/)
- [Vertex AI 문서](https://cloud.google.com/vertex-ai/docs)
- [FastAPI 문서](https://fastapi.tiangolo.com/)
- [공식 Colab 노트북](https://colab.research.google.com/github/GoogleCloudPlatform/generative-ai/blob/main/gemini/getting-started/intro_gemini_2_5_image_gen.ipynb)

