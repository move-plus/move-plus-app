from typing import Any, Optional

from pydantic import BaseModel


class HttpResponseModel(BaseModel):
    success: bool = True
    message: str
    data: Optional[Any] = None

