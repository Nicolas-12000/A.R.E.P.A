"""FastAPI application entrypoint."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.api.v1.router import router as v1_router
from backend.app.config import settings
from backend.app.db.repository import sync_model_metadata
from backend.app.db.session import init_db
from backend.app.services.model_registry import registry


@asynccontextmanager
async def lifespan(_app: FastAPI):
    registry.load_all()
    init_db(settings.database_url)
    sync_model_metadata({name: registry.get(name) for name in registry.loaded_names})
    yield


app = FastAPI(
    title=settings.app_name,
    description=settings.app_description,
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1_router, prefix=settings.api_v1_prefix)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "message": "Validation failed"},
    )


@app.get("/")
def root():
    return {
        "name": "AREPA",
        "full_name": "Applied Regression, Estimation & Predictive Analytics",
        "docs": "/docs",
        "health": f"{settings.api_v1_prefix}/health",
    }
