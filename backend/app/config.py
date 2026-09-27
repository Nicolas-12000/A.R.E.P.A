"""Environment-based configuration (no hardcoded secrets)."""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="AREPA_",
        extra="ignore",
    )

    app_name: str = "AREPA API"
    app_description: str = (
        "Applied Regression, Estimation & Predictive Analytics — "
        "multi-domain linear regression inference"
    )
    api_v1_prefix: str = "/v1"
    models_dir: Path = Path(__file__).resolve().parents[2] / "models"
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    database_url: str | None = None
    debug: bool = False


settings = Settings()
