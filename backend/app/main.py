from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.api.routes.health import router as health_router
from app.api.routes.auth import router as auth_router
from app.api.routes.content import router as content_router
from app.api.routes.tags import router as tags_router
from app.api.routes.ai import router as ai_router
from app.api.routes.outputs import router as outputs_router
from app.middleware.error_handler import (
    validation_exception_handler,
    http_exception_handler,
    general_exception_handler,
)

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Content Intelligence Platform — Module 01 Foundation",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

app.include_router(health_router, prefix="/api", tags=["health"])
app.include_router(auth_router, prefix="/api", tags=["auth"])
app.include_router(content_router, prefix="/api", tags=["content"])
app.include_router(tags_router, prefix="/api", tags=["tags"])
app.include_router(ai_router, prefix="/api", tags=["ai"])
app.include_router(outputs_router, prefix="/api", tags=["outputs"])


@app.get("/")
def root():
    return {"message": f"{settings.app_name} — API running", "docs": "/docs"}
