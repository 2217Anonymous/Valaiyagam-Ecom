from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.init_db import seed_database
from app.modules.catalog.api import categories
from app.modules.catalog.services.category_service import CATEGORY_UPLOAD_DIR, UPLOAD_ROOT
from app.modules.iam.api import roles
from app.modules.identity.api import auth, users
from app.utils.exceptions import AppError


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    CATEGORY_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    with SessionLocal() as db:
        seed_database(db)
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppError)
async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


@app.get("/health", tags=["Health"])
def health() -> dict[str, str]:
    return {"status": "ok"}


UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(Path(UPLOAD_ROOT))), name="uploads")

app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(users.router, prefix=settings.api_v1_prefix)
app.include_router(roles.router, prefix=settings.api_v1_prefix)
app.include_router(categories.router, prefix=settings.api_v1_prefix)
