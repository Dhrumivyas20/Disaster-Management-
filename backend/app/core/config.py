from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Database
    database_url: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/pixelalchemy",
        validation_alias="DATABASE_URL"
    )
    
    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_prefix: str = "/api"
    
    # CORS
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000", "http://localhost:8080"]
    
    # Map Provider
    map_provider: str = "openstreetmap"
    map_api_key: str = Field(default="", validation_alias="MAP_API_KEY")
    map_style_url: str = Field(default="", validation_alias="MAP_STYLE_URL")
    
    # Environment
    environment: str = "development"
    debug: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
