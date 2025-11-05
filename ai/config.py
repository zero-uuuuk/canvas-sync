"""
설정 관리
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """애플리케이션 설정"""
    
    # Google Gemini API
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    MODEL_ID: str = os.getenv("GEMINI_MODEL_ID", "gemini-2.5-flash-image")
    
    # FastAPI
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", 8000))
    API_RELOAD: bool = os.getenv("API_RELOAD", "true").lower() == "true"
    
    # CORS
    CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Image
    MAX_IMAGE_SIZE_MB: int = int(os.getenv("MAX_IMAGE_SIZE_MB", 10))
    ALLOWED_IMAGE_TYPES: list = os.getenv("ALLOWED_IMAGE_TYPES", "jpeg,jpg,png,webp").split(",")


settings = Settings()

