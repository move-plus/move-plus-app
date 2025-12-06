from fastapi import APIRouter, Depends, HTTPException, status

from app.core.db import handle_response
from app.core.dependencies import get_current_user, get_supabase

router = APIRouter(prefix="/enrollments", tags=["enrollments"])


@router.get("")
async def list_my_enrollments(user=Depends(get_current_user), supabase=Depends(get_supabase)):
    response = (
        supabase.table("enrollments")
        .select("*, classes(*, profiles(full_name))")
        .eq("user_id", user["id"])
        .order("created_at", desc=True)
        .execute()
    )
    return handle_response(response)


@router.get("/class/{class_id}")
async def list_enrollments_for_class(class_id: str, user=Depends(get_current_user), supabase=Depends(get_supabase)):
    response = (
        supabase.table("enrollments")
        .select("*, profiles(full_name, avatar_url)")
        .eq("class_id", class_id)
        .execute()
    )
    return handle_response(response)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_enrollment(payload: dict, user=Depends(get_current_user), supabase=Depends(get_supabase)):
    class_id = payload.get("class_id")
    if not class_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="class_id é obrigatório")

    existing_response = (
        supabase.table("enrollments")
        .select("id")
        .eq("user_id", user["id"])
        .eq("class_id", class_id)
        .limit(1)
        .execute()
    )
    existing = handle_response(existing_response)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Já inscrito nesta aula")

    class_response = (
        supabase.table("classes")
        .select("capacity, max_students")
        .eq("id", class_id)
        .single()
        .execute()
    )
    class_data = handle_response(class_response)
    if not class_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aula não encontrada")

    capacity = class_data.get("capacity") or class_data.get("max_students")

    enrollment_count_response = (
        supabase.table("enrollments")
        .select("id")
        .eq("class_id", class_id)
        .execute()
    )
    enrollment_count = len(handle_response(enrollment_count_response) or [])

    if capacity is not None and enrollment_count >= capacity:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Aula lotada")

    response = (
        supabase.table("enrollments")
        .insert([{"user_id": user["id"], "class_id": class_id}])
        .select("*")
        .single()
        .execute()
    )
    return handle_response(response)


@router.delete("/{enrollment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_enrollment(enrollment_id: str, user=Depends(get_current_user), supabase=Depends(get_supabase)):
    response = (
        supabase.table("enrollments")
        .delete()
        .eq("id", enrollment_id)
        .eq("user_id", user["id"])
        .execute()
    )
    handle_response(response)
    return {}

