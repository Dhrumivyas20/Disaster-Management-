"""
PixelAlchemy Risk Dashboard - FastAPI Application Entrypoint.
Provides REST API endpoints for multi-hazard aggregation, relocation priority, AHP safe-site ranking, and ML hazard intelligence.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.core.config import settings
from app.api import routes
from app.db.session import init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("pixelalchemy")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing PixelAlchemy Risk Dashboard API...")
    init_db()
    logger.info("Database initialized and verified.")
    yield
    logger.info("Shutting down PixelAlchemy API.")


app = FastAPI(
    title="PixelAlchemy Risk Dashboard API",
    version="1.0.0",
    description="Disaster-management decision-support API for Rudraprayag and Chamoli, Uttarakhand",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all dev origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routes at root, /api, and /api/v1 for complete compatibility
app.include_router(routes.router)
app.include_router(routes.router, prefix="/api")
app.include_router(routes.router, prefix="/api/v1")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred.", "error": str(exc)}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.api_host, port=settings.api_port)
