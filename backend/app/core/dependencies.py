from typing import Annotated, Any, Dict

import httpx
from fastapi import Depends, Header, HTTPException, status

from app.core.config import settings
from app.core.supabase import supabase_client


async def get_current_user(authorization: Annotated[str | None, Header(alias="Authorization")] = None) -> Dict[str, Any]:
    if authorization is None or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token não fornecido")

    token = authorization.split(" ", maxsplit=1)[1]
    headers = {
        "Authorization": f"Bearer {token}",
        "apikey": settings.supabase_anon_key,
    }

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(f"{settings.supabase_url}/auth/v1/user", headers=headers)

    if response.status_code != status.HTTP_200_OK:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido ou expirado")

    payload = response.json()
    user = payload.get("user")
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário não encontrado")

    return user


def get_supabase():
    return supabase_client

