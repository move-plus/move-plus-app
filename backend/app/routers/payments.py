from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List

from supabase import Client
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.db import handle_response
from app.core.dependencies import get_current_user, get_supabase


router = APIRouter(prefix="/payments", tags=["payments"])

class PaymentCreate(BaseModel):
    class_id: str
    enrollment_id: str
    student_id: str
    amount: float

class PaymentUpdate(BaseModel):
    status: Optional[str] = None
    payment_date: Optional[date] = None
    amount: Optional[float] = None

class PaymentResponse(BaseModel):
    id: str
    class_id: str
    enrollment_id: str
    student_id: str
    amount: float
    status: str
    payment_date: Optional[date]
    created_at: datetime

@router.get("", response_model=List[PaymentResponse])
async def list_payments(
    class_id: Optional[str] = None,
    student_id: Optional[str] = None,
    status: Optional[str] = None,
    supabase: Client = Depends(get_supabase)
):
    """Lista pagamentos com filtros opcionais"""
    try:
        query = supabase.table("payments").select("*")
        
        if class_id:
            query = query.eq("class_id", class_id)
        if student_id:
            query = query.eq("student_id", student_id)
        if status:
            query = query.eq("status", status)
        
        response = query.order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: str,
    supabase: Client = Depends(get_supabase)
):
    """Busca um pagamento específico"""
    try:
        response = supabase.table("payments").select("*").eq("id", payment_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Pagamento não encontrado")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("", response_model=PaymentResponse)
async def create_payment(
    payment: PaymentCreate,
    supabase: Client = Depends(get_supabase)
):
    """Cria um novo pagamento"""
    try:
        payment_data = {
            "class_id": payment.class_id,
            "enrollment_id": payment.enrollment_id,
            "student_id": payment.student_id,
            "amount": payment.amount,
            "status": "paid",
            "payment_date": date.today().isoformat()
        }
        
        response = supabase.table("payments").insert(payment_data).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao criar pagamento: {str(e)}")

@router.patch("/{payment_id}", response_model=PaymentResponse)
async def update_payment(
    payment_id: str,
    payment: PaymentUpdate,
    supabase: Client = Depends(get_supabase)
):
    """Atualiza um pagamento existente"""
    try:
        update_data = payment.dict(exclude_unset=True)
        if payment.payment_date:
            update_data["payment_date"] = payment.payment_date.isoformat()
        
        response = supabase.table("payments").update(update_data).eq("id", payment_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Pagamento não encontrado")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{payment_id}")
async def delete_payment(
    payment_id: str,
    supabase: Client = Depends(get_supabase)
):
    """Deleta um pagamento"""
    try:
        response = supabase.table("payments").delete().eq("id", payment_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Pagamento não encontrado")
        return {"message": "Pagamento deletado com sucesso"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/enrollment/{enrollment_id}", response_model=Optional[PaymentResponse])
async def get_payment_by_enrollment(
    enrollment_id: str,
    supabase: Client = Depends(get_supabase)
):
    """Busca pagamento por enrollment_id"""
    try:
        response = supabase.table("payments").select("*").eq("enrollment_id", enrollment_id).execute()
        if not response.data:
            return None
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))