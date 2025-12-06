from fastapi import APIRouter, Depends, HTTPException, status

from app.core.db import handle_response
from app.core.dependencies import get_current_user, get_supabase

router = APIRouter(prefix="/messages", tags=["messages"])


@router.get("/conversations")
async def list_conversations(user=Depends(get_current_user), supabase=Depends(get_supabase)):
    response = (
        supabase.table("messages")
        .select(
            "*, sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url), "
            "recipient:profiles!messages_recipient_id_fkey(id, full_name, avatar_url)"
        )
        .or_(f"sender_id.eq.{user['id']},recipient_id.eq.{user['id']}")
        .order("created_at", desc=True)
        .execute()
    )
    messages = handle_response(response) or []

    conversations = {}
    for message in messages:
        other_user_id = message["recipient_id"] if message["sender_id"] == user["id"] else message["sender_id"]
        if other_user_id not in conversations:
            conversations[other_user_id] = message

    return list(conversations.values())


@router.get("/{other_user_id}")
async def list_messages_with_user(other_user_id: str, user=Depends(get_current_user), supabase=Depends(get_supabase)):
    response = (
        supabase.table("messages")
        .select(
            "*, sender:profiles!messages_sender_id_fkey(full_name, avatar_url), "
            "recipient:profiles!messages_recipient_id_fkey(full_name, avatar_url)"
        )
        .or_(
            f"and(sender_id.eq.{user['id']},recipient_id.eq.{other_user_id}),"
            f"and(sender_id.eq.{other_user_id},recipient_id.eq.{user['id']})"
        )
        .order("created_at", desc=True)
        .execute()
    )
    data = handle_response(response) or []
    return list(reversed(data))


@router.post("", status_code=status.HTTP_201_CREATED)
async def send_message(payload: dict, user=Depends(get_current_user), supabase=Depends(get_supabase)):
    recipient_id = payload.get("recipient_id")
    content = payload.get("content")

    if not recipient_id or not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="recipient_id e content são obrigatórios")

    response = (
        supabase.table("messages")
        .insert(
            [
                {
                    "sender_id": user["id"],
                    "recipient_id": recipient_id,
                    "content": content,
                }
            ]
        )
        .select("*")
        .single()
        .execute()
    )
    return handle_response(response)


@router.put("/{message_id}/read")
async def mark_message_as_read(message_id: str, user=Depends(get_current_user), supabase=Depends(get_supabase)):
    response = (
        supabase.table("messages")
        .update({"read": True})
        .eq("id", message_id)
        .eq("recipient_id", user["id"])
        .select("*")
        .single()
        .execute()
    )
    data = handle_response(response)
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mensagem não encontrada")
    return data

