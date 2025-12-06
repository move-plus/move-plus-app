from typing import Any

from fastapi import HTTPException, status


def handle_response(response: Any) -> Any:
    error = getattr(response, "error", None)
    if error:
        detail = getattr(error, "message", str(error))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)
    return response.data

