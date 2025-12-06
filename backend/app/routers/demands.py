from fastapi import APIRouter, Depends, HTTPException, status

from app.core.db import handle_response
from app.core.dependencies import get_current_user, get_supabase

router = APIRouter(prefix="/demands", tags=["demands"])


@router.get("")
async def list_demands(user=Depends(get_current_user), supabase=Depends(get_supabase)):
    response = (
        supabase.table("demands")
        .select("*, profiles(full_name, avatar_url)")
        .order("created_at", desc=True)
        .execute()
    )
    return handle_response(response)


@router.get("/{demand_id}")
async def retrieve_demand(demand_id: str, user=Depends(get_current_user), supabase=Depends(get_supabase)):
    response = (
        supabase.table("demands")
        .select("*, profiles(full_name, avatar_url)")
        .eq("id", demand_id)
        .single()
        .execute()
    )
    data = handle_response(response)
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demanda não encontrada")
    return data


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_demand(payload: dict, user=Depends(get_current_user), supabase=Depends(get_supabase)):
    response = (
        supabase.table("demands")
        .insert([{**payload, "user_id": user["id"]}])
        .select("*")
        .single()
        .execute()
    )
    return handle_response(response)


@router.put("/{demand_id}")
async def update_demand(demand_id: str, payload: dict, user=Depends(get_current_user), supabase=Depends(get_supabase)):
    response = (
        supabase.table("demands")
        .update(payload)
        .eq("id", demand_id)
        .eq("user_id", user["id"])
        .select("*")
        .single()
        .execute()
    )
    data = handle_response(response)
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demanda não encontrada ou sem permissão")
    return data


@router.delete("/{demand_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_demand(demand_id: str, user=Depends(get_current_user), supabase=Depends(get_supabase)):
    response = (
        supabase.table("demands")
        .delete()
        .eq("id", demand_id)
        .eq("user_id", user["id"])
        .execute()
    )
    handle_response(response)
    return {}

