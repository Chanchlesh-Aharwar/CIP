from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    app_name: str = Field(default="Content Intelligence Platform", alias="APP_NAME")
    environment: str = Field(default="development", alias="ENVIRONMENT")
    host: str = Field(default="0.0.0.0", alias="HOST")
    port: int = Field(default=8000, alias="PORT")

    mysql_host: str = Field(default="localhost", alias="MYSQL_HOST")
    mysql_port: int = Field(default=3306, alias="MYSQL_PORT")
    mysql_database: str = Field(default="content_intelligence", alias="MYSQL_DATABASE")
    mysql_user: str = Field(default="root", alias="MYSQL_USER")
    mysql_password: str = Field(default="", alias="MYSQL_PASSWORD")

    jwt_secret: str = Field(default="change_me_min_32_chars", alias="JWT_SECRET")
    ai_api_key: str = Field(default="", alias="AI_API_KEY")
    ai_model: str = Field(default="gpt-4o-mini", alias="AI_MODEL")

    @property
    def database_url(self) -> str:
        from urllib.parse import quote_plus
        pwd = quote_plus(self.mysql_password)
        return f"mysql+pymysql://{self.mysql_user}:{pwd}@{self.mysql_host}:{self.mysql_port}/{self.mysql_database}"

    @property
    def cors_origins(self) -> list[str]:
        if self.environment == "production":
            return ["http://localhost:5173"]
        return ["http://localhost:5173", "http://127.0.0.1:5173"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
