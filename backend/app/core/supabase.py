from app.core import httpx_compat  # noqa: F401  # garante patch do httpx antes do supabase
from supabase import Client, create_client

from app.core.config import settings


def build_supabase_client() -> Client:
    return create_client(settings.supabase_url, settings.supabase_service_key)


supabase_client: Client = build_supabase_client()

