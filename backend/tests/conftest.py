"""Common pytest fixtures for backend tests."""
from __future__ import annotations

import importlib
import os
import sys
from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient


def _reload_app(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> FastAPI:
    """Reload the FastAPI application with test-specific environment variables."""
    monkeypatch.setenv("APP_NAME", os.getenv("APP_NAME", "UNS-ClaudeJP 5.6.0"))
    monkeypatch.setenv("APP_VERSION", os.getenv("APP_VERSION", "5.6.0"))
    monkeypatch.setenv("ENABLE_TELEMETRY", "false")

    db_path = tmp_path / "test.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")

    monkeypatch.setenv(
        "SECRET_KEY",
        os.getenv("SECRET_KEY", "test-secret-key-which-is-definitely-32-bytes-long!"),
    )

    upload_dir = tmp_path / "uploads"
    log_file = tmp_path / "logs" / "app.log"
    reports_dir = tmp_path / "reports"
    monkeypatch.setenv("UPLOAD_DIR", str(upload_dir))
    monkeypatch.setenv("LOG_FILE", str(log_file))
    monkeypatch.setenv("REPORTS_DIR", str(reports_dir))

    for module_name in ["app.core.config", "app.core.database", "app.main"]:
        sys.modules.pop(module_name, None)

    app_module = importlib.import_module("app.main")
    return app_module.app


@pytest.fixture
def app(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> FastAPI:
    """Provide a FastAPI application instance configured for tests."""
    application = _reload_app(monkeypatch, tmp_path)
    return application


@pytest.fixture
def client(app: FastAPI) -> Generator[TestClient, None, None]:
    """Yield a FastAPI test client with startup/shutdown lifecycle management."""
    with TestClient(app, base_url="http://localhost") as test_client:
        yield test_client
