from functools import lru_cache

from pydantic import EmailStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Valaiyagam E-commerce Admin API"
    app_env: str = "development"
    api_v1_prefix: str = "/api/v1"
    secret_key: str = "change-this-secret-in-production"
    access_token_expire_minutes: int = 60
    cors_origins: str = "http://localhost:3000"

    mysql_host: str = "localhost"
    mysql_port: int = 3306
    mysql_database: str = "valaiyagam"
    mysql_user: str = "valaiyagam"
    mysql_password: str = "valaiyagam"

    initial_admin_email: EmailStr = "admin@example.com"
    initial_admin_password: str = "ChangeMe123!"
    initial_admin_name: str = "System Admin"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def database_url(self) -> str:
        return (
            f"mysql+pymysql://{self.mysql_user}:{self.mysql_password}"
            f"@{self.mysql_host}:{self.mysql_port}/{self.mysql_database}"
            "?charset=utf8mb4"
        )

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
