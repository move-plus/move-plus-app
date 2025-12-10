from fastapi import APIRouter, Depends, HTTPException, status

from app.core.db import handle_response
from app.core.dependencies import get_current_user, get_supabase

router = APIRouter(prefix="/classes", tags=["classes"])


@router.get("")
async def list_classes(user=Depends(get_current_user), supabase=Depends(get_supabase)):
    response = (
        supabase.table("classes")
        .select("*, professionals(full_name)")
        .order("created_at", desc=False)
        .execute()
    )
    return handle_response(response)


@router.get("/{class_id}")
async def retrieve_class(class_id: str, user=Depends(get_current_user), supabase=Depends(get_supabase)):
    response = (
        supabase.table("classes")
        .select("*, professionals(full_name, user_id)")
        .eq("id", class_id)
        .single()
        .execute()
    )
    data = handle_response(response)
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aula não encontrada")
    
    # Buscar contagem de enrollments separadamente
    enrollments_response = (
        supabase.table("enrollments")
        .select("id")
        .eq("class_id", class_id)
        .execute()
    )
    enrollment_count = len(handle_response(enrollments_response) or [])
    data["enrollment_count"] = enrollment_count
    
    return data


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_class(payload: dict, user=Depends(get_current_user), supabase=Depends(get_supabase)):
    # Buscar o professional_id do usuário logado
    professional_response = (
        supabase.table("professionals")
        .select("id")
        .eq("user_id", user["id"])
        .single()
        .execute()
    )
    professional_data = handle_response(professional_response)
    if not professional_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profissional não encontrado. Complete seu cadastro primeiro.")
    
    response = (
        supabase.table("classes")
        .insert([{**payload, "professional_id": professional_data["id"]}])
        .select("*")
        .single()
        .execute()
    )
    return handle_response(response)


@router.put("/{class_id}")
async def update_class(class_id: str, payload: dict, user=Depends(get_current_user), supabase=Depends(get_supabase)):
    # Verificar se o usuário é o profissional dono da aula
    class_response = (
        supabase.table("classes")
        .select("professional_id")
        .eq("id", class_id)
        .single()
        .execute()
    )
    class_data = handle_response(class_response)
    if not class_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aula não encontrada")
    
    # Verificar se o profissional pertence ao usuário logado
    professional_response = (
        supabase.table("professionals")
        .select("id")
        .eq("id", class_data["professional_id"])
        .eq("user_id", user["id"])
        .single()
        .execute()
    )
    professional_data = handle_response(professional_response)
    if not professional_data:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão para atualizar esta aula")
    
    response = (
        supabase.table("classes")
        .update(payload)
        .eq("id", class_id)
        .select("*")
        .single()
        .execute()
    )
    data = handle_response(response)
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aula não encontrada")
    return data


@router.delete("/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_class(class_id: str, user=Depends(get_current_user), supabase=Depends(get_supabase)):
    # Verificar se o usuário é o profissional dono da aula
    class_response = (
        supabase.table("classes")
        .select("professional_id")
        .eq("id", class_id)
        .single()
        .execute()
    )
    class_data = handle_response(class_response)
    if not class_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aula não encontrada")
    
    # Verificar se o profissional pertence ao usuário logado
    professional_response = (
        supabase.table("professionals")
        .select("id")
        .eq("id", class_data["professional_id"])
        .eq("user_id", user["id"])
        .single()
        .execute()
    )
    professional_data = handle_response(professional_response)
    if not professional_data:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão para deletar esta aula")
    
    response = (
        supabase.table("classes")
        .delete()
        .eq("id", class_id)
        .execute()
    )
    handle_response(response)
    return {}

