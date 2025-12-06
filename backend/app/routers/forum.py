from fastapi import APIRouter, Depends, HTTPException, status

from app.core.db import handle_response
from app.core.dependencies import get_current_user, get_supabase

router = APIRouter(prefix="/forum", tags=["forum"])


@router.get("/posts")
async def list_posts(user=Depends(get_current_user), supabase=Depends(get_supabase)):
    response = (
        supabase.table("forum_posts")
        .select("*, profiles(full_name, avatar_url), forum_replies(count)")
        .order("created_at", desc=True)
        .execute()
    )
    return handle_response(response)


@router.get("/posts/{post_id}")
async def retrieve_post(post_id: str, user=Depends(get_current_user), supabase=Depends(get_supabase)):
    post_response = (
        supabase.table("forum_posts")
        .select("*, profiles(full_name, avatar_url)")
        .eq("id", post_id)
        .single()
        .execute()
    )
    post = handle_response(post_response)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post não encontrado")

    replies_response = (
        supabase.table("forum_replies")
        .select("*, profiles(full_name, avatar_url)")
        .eq("post_id", post_id)
        .order("created_at", desc=False)
        .execute()
    )
    replies = handle_response(replies_response) or []
    return {**post, "replies": replies}


@router.post("/posts", status_code=status.HTTP_201_CREATED)
async def create_post(payload: dict, user=Depends(get_current_user), supabase=Depends(get_supabase)):
    response = (
        supabase.table("forum_posts")
        .insert([{**payload, "user_id": user["id"]}])
        .select("*")
        .single()
        .execute()
    )
    return handle_response(response)


@router.post("/posts/{post_id}/replies", status_code=status.HTTP_201_CREATED)
async def reply_post(post_id: str, payload: dict, user=Depends(get_current_user), supabase=Depends(get_supabase)):
    response = (
        supabase.table("forum_replies")
        .insert([{**payload, "post_id": post_id, "user_id": user["id"]}])
        .select("*")
        .single()
        .execute()
    )
    return handle_response(response)


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(post_id: str, user=Depends(get_current_user), supabase=Depends(get_supabase)):
    response = (
        supabase.table("forum_posts")
        .delete()
        .eq("id", post_id)
        .eq("user_id", user["id"])
        .execute()
    )
    handle_response(response)
    return {}

