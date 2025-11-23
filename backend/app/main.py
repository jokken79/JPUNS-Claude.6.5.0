"""FastAPI application entry point."""
from __future__ import annotations

import os
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db, init_db
from app.core.rate_limiter import limiter, handle_rate_limit_error
from app.core.logging import app_logger
from app.core.observability import configure_observability
from app.core.scheduler import start_scheduler, stop_scheduler
from app.core.middleware import (
    AuditContextMiddleware,
    ExceptionHandlerMiddleware,
    LoggingMiddleware,
    SecurityMiddleware,
)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager - replaces deprecated @app.on_event"""
    # Startup
    app_logger.info("Starting application", version=settings.APP_VERSION, environment=settings.ENVIRONMENT)
    try:
        init_db()
        app_logger.info("Database initialised successfully")

        # Start background scheduler for cron jobs
        start_scheduler()
        app_logger.info("Scheduler started successfully")

    except Exception as exc:  # pragma: no cover
        app_logger.exception("Database init failed", error=str(exc))
        raise

    yield

    # Shutdown
    app_logger.info("Shutting down application")
    stop_scheduler()
    app_logger.info("Scheduler stopped")


app = FastAPI(
    title=f"{settings.APP_NAME} API",
    description="""## UNS-ClaudeJP v6.5.0 - API de Gestión de Personal Temporal

### Características Principales
- **OCR Híbrido**: Azure + EasyOCR + Gemini + Tesseract con caché inteligente
- **Gestión de Personal**: Candidatos, empleados, fábricas y tarjetas de tiempo
- **Nóminas Automatizadas**: Cálculo según normativa laboral japonesa
- **Notificaciones**: Integración con Email y LINE
- **Monitoreo**: Endpoints de health check y métricas
- **Seguridad**: JWT authentication con rate limiting

### Autenticación
La API utiliza tokens JWT. Incluye el header: `Authorization: Bearer <token>`.

### Formato de Respuesta
Todas las respuestas retornan JSON estructurado con mensajes y códigos claros.
""",
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    contact={
        "name": "UNS-Kikaku Support",
        "email": "support@uns-kikaku.com",
        "url": settings.COMPANY_WEBSITE,
    },
    license_info={"name": "Proprietary"},
    servers=[
        {"url": "http://localhost:8000", "description": "Development"},
        {"url": "https://api.uns-kikaku.com", "description": "Production"},
    ],
    lifespan=lifespan,
    redirect_slashes=True,
)

configure_observability(app)

# Add rate limiter state and custom error handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, handle_rate_limit_error)

# Add custom middlewares (order matters: audit context first)
app.add_middleware(AuditContextMiddleware)
app.add_middleware(SecurityMiddleware)
app.add_middleware(ExceptionHandlerMiddleware)
app.add_middleware(LoggingMiddleware)

# Global rate limiting middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """
    Global rate limiting middleware.

    Applies rate limiting to all endpoints unless they have specific limits.
    Adds X-RateLimit-* headers to all responses.
    """
    if not settings.RATE_LIMIT_ENABLED:
        return await call_next(request)

    # Skip rate limiting for health check endpoints
    if request.url.path in ["/api/health", "/health", "/"]:
        return await call_next(request)

    # Process the request (rate limiting handled by decorator on each endpoint)
    response = await call_next(request)

    # Add rate limit headers to all responses
    # These headers are automatically added by slowapi when using @limiter.limit()
    return response

# CORS configuration - restricted for security
safe_origins = [
    origin
    for origin in settings.BACKEND_CORS_ORIGINS
    if isinstance(origin, str) and origin.startswith(("http://", "https://"))
]
if not safe_origins:  # Fallback for misconfiguration
    safe_origins = ["http://localhost", "http://127.0.0.1"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=safe_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Request-ID", "Accept"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Trusted hosts configuration
def _build_allowed_hosts() -> list[str]:
    """Return allowed host list for TrustedHostMiddleware."""

    base_local_hosts = [
        "localhost",
        "127.0.0.1",
        "0.0.0.0",
        "backend",
        "testserver",  # FastAPI TestClient default host
    ]

    production_hosts = [
        "uns-kikaku.com",
        "api.uns-kikaku.com",
        "www.uns-kikaku.com",
    ]

    is_production = (
        settings.ENVIRONMENT.lower() == "production" and not settings.DEBUG
    )

    allowed_hosts: list[str] = []
    if is_production:
        allowed_hosts.extend(production_hosts)
    else:
        allowed_hosts.extend(base_local_hosts + production_hosts)

    for extra_host in settings.ADDITIONAL_TRUSTED_HOSTS:
        if extra_host and extra_host not in allowed_hosts:
            allowed_hosts.append(extra_host)

    return allowed_hosts


app.add_middleware(TrustedHostMiddleware, allowed_hosts=_build_allowed_hosts())

# Create necessary directories
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.dirname(settings.LOG_FILE), exist_ok=True)

# Mount static files
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get("/")
async def root() -> dict:
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "company": settings.COMPANY_NAME,
        "website": settings.COMPANY_WEBSITE,
        "status": "running",
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/health", tags=["Monitoring"], summary="Application readiness probe")
async def health_check(db: Session = Depends(get_db)) -> dict:
    """Verify core dependencies used by external health checks."""
    database_status = "available"
    try:
        db.execute(text("SELECT 1"))
    except Exception as exc:  # pragma: no cover - defensive logging
        database_status = "unavailable"
        app_logger.exception("Database health check failed", error=str(exc))

    return {
        "app": settings.APP_NAME,
        "status": "healthy" if database_status == "available" else "degraded",
        "database": database_status,
        "version": settings.APP_VERSION,
        "timestamp": datetime.now().isoformat(),
    }


@app.exception_handler(404)
async def not_found_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(status_code=404, content={"detail": "Not found", "path": str(request.url)})


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc: Exception) -> JSONResponse:
    app_logger.exception("Internal server error", path=request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "message": str(exc) if settings.DEBUG else "An error occurred"},
    )


from app.api import (
    ai_agents,  # noqa: E402  pylint: disable=wrong-import-position
    azure_ocr,  # noqa: E402  pylint: disable=wrong-import-position
    admin,
    apartments_v2,
    audit,
    auth,
    candidates,
    contracts,
    dashboard,
    database,
    employees,
    factories,
    import_export,
    monitoring,
    notifications,
    pages,
    payroll,
    reports,
    requests,
    resilient_import,
    role_permissions,
    salary,
    settings as settings_router,
    timer_cards,
    yukyu,
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(admin.router, tags=["Admin Panel"])
app.include_router(ai_agents.router, prefix="/api/ai", tags=["AI Agents"])
app.include_router(audit.router, tags=["Admin Audit Log"])
app.include_router(apartments_v2.router, prefix="/api/apartments", tags=["Apartments"])
app.include_router(candidates.router, prefix="/api/candidates", tags=["Candidates"])
app.include_router(contracts.router, prefix="/api/contracts", tags=["Contracts"])
app.include_router(database.router, prefix="/api/database", tags=["Database"])
app.include_router(azure_ocr.router, prefix="/api/azure-ocr", tags=["Azure OCR"])
app.include_router(employees.router, prefix="/api/employees", tags=["Employees"])
app.include_router(factories.router, prefix="/api/factories", tags=["Factories"])
app.include_router(timer_cards.router, prefix="/api/timer-cards", tags=["Timer Cards"])
app.include_router(salary.router, prefix="/api/salary", tags=["Salary"])
app.include_router(requests.router, prefix="/api/requests", tags=["Requests"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(import_export.router, prefix="/api/import", tags=["Import/Export"])
app.include_router(resilient_import.router, tags=["Resilient Import"])
app.include_router(payroll.router, tags=["Payroll"])  # Router already has prefix="/api/payroll"
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(monitoring.router, prefix="/api/monitoring", tags=["Monitoring"])
app.include_router(pages.router)
app.include_router(settings_router.router, prefix="/api/settings", tags=["Settings"])
app.include_router(role_permissions.router, tags=["Role Permissions"])
app.include_router(yukyu.router, prefix="/api/yukyu", tags=["Yukyu (有給休暇 - Paid Vacation)"])


if __name__ == "__main__":  # pragma: no cover
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
