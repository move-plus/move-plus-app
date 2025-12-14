from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import classes, demands, enrollments, forum, me, messages, payments

app = FastAPI(title="FitSenior API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "FitSenior API",
        "version": app.version,
        "endpoints": {
            "health": "/health",
            "api": settings.api_prefix,
        },
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}


app.include_router(me.router, prefix=settings.api_prefix)
app.include_router(demands.router, prefix=settings.api_prefix)
app.include_router(classes.router, prefix=settings.api_prefix)
app.include_router(enrollments.router, prefix=settings.api_prefix)
app.include_router(forum.router, prefix=settings.api_prefix)
app.include_router(messages.router, prefix=settings.api_prefix)
app.include_router(payments.router,prefix=settings.api_prefix)

