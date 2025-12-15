from typing import List


class Settings:
    """Application configuration with hardcoded values."""

    supabase_url: str = "https://mxegxtsndzuxmxdittgg.supabase.co"
    supabase_anon_key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14ZWd4dHNuZHp1eG14ZGl0dGdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MjM3MDQsImV4cCI6MjA4MDk5OTcwNH0.YVuFvCQD_10HvQtD5WBYiuZ4R4JzNXk3NvCVEp4ab6k"
    supabase_service_key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14ZWd4dHNuZHp1eG14ZGl0dGdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQyMzcwNCwiZXhwIjoyMDgwOTk5NzA0fQ.FtVC9etYvnAtrEdglOXSE7mU4upPuA05nNO3lhQAfYQ"

    api_prefix: str = "/api"
    backend_port: int = 8000
    allowed_origins: List[str] = ["*"]


settings = Settings()

