from fastapi import APIRouter, Depends, HTTPException, status

from app.core.db import handle_response
from app.core.dependencies import get_current_user, get_supabase

router = APIRouter(prefix="/me", tags=["me"])


@router.get("")
async def get_profile(user=Depends(get_current_user), supabase=Depends(get_supabase)):
    response = (
        supabase.table("profiles")
        .select("*")
        .eq("id", user["id"])
        .single()
        .execute()
    )
    data = handle_response(response)
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil não encontrado")
    return data


@router.put("")
async def update_profile(payload: dict, user=Depends(get_current_user), supabase=Depends(get_supabase)):
    response = (
        supabase.table("profiles")
        .update(payload)
        .eq("id", user["id"])
        .select("*")
        .single()
        .execute()
    )
    return handle_response(response)

