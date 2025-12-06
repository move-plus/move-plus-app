from fastapi import APIRouter, Depends, HTTPException, status

from app.core.db import handle_response
from app.core.dependencies import get_current_user, get_supabase

router = APIRouter(prefix="/classes", tags=["classes"])


@router.get("")
async def list_classes(user=Depends(get_current_user), supabase=Depends(get_supabase)):
    response = (
        supabase.table("classes")
        .select("*, profiles(full_name)")
        .order("date", desc=False)
        .execute()
    )
    return handle_response(response)


@router.get("/{class_id}")
async def retrieve_class(class_id: str, user=Depends(get_current_user), supabase=Depends(get_supabase)):
    response = (
        supabase.table("classes")
        .select("*, profiles(full_name), enrollments(count)")
        .eq("id", class_id)
        .single()
        .execute()
    )
    data = handle_response(response)
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aula não encontrada")
    return data


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_class(payload: dict, user=Depends(get_current_user), supabase=Depends(get_supabase)):
    response = (
        supabase.table("classes")
        .insert([{**payload, "instructor_id": user["id"]}])
        .select("*")
        .single()
        .execute()
    )
    return handle_response(response)


@router.put("/{class_id}")
async def update_class(class_id: str, payload: dict, user=Depends(get_current_user), supabase=Depends(get_supabase)):
    response = (
        supabase.table("classes")
        .update(payload)
        .eq("id", class_id)
        .eq("instructor_id", user["id"])
        .select("*")
        .single()
        .execute()
    )
    data = handle_response(response)
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aula não encontrada ou sem permissão")
    return data


@router.delete("/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_class(class_id: str, user=Depends(get_current_user), supabase=Depends(get_supabase)):
    response = (
        supabase.table("classes")
        .delete()
        .eq("id", class_id)
        .eq("instructor_id", user["id"])
        .execute()
    )
    handle_response(response)
    return {}

