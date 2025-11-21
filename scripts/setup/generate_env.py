#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Utility to bootstrap local environment files with safe defaults."""

from __future__ import annotations

import argparse
import secrets
import sys
from pathlib import Path
from typing import Dict

ROOT = Path(__file__).parent.parent.parent  # Go up to project root
DEFAULT_VERSION = "5.6.0"


class EnvValidationError(RuntimeError):
    """Raised when an environment file is missing required keys."""


def parse_env_file(path: Path) -> Dict[str, str]:
    """Parse a dotenv style file into a dictionary."""
    values: Dict[str, str] = {}
    if not path.exists():
        return values

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip()
    return values


def ensure_parent(path: Path) -> None:
    """Ensure the directory for the target path exists."""
    path.parent.mkdir(parents=True, exist_ok=True)


def write_env_file(path: Path, header: str, values: Dict[str, str]) -> None:
    """Write a dotenv file with deterministic ordering."""
    ensure_parent(path)
    ordered_lines = [header.rstrip(), ""]
    for key in sorted(values.keys()):
        ordered_lines.append(f"{key}={values[key]}")
    ordered_lines.append("")
    path.write_text("\n".join(ordered_lines), encoding="utf-8")


def validate_root(values: Dict[str, str]) -> None:
    required = {
        "POSTGRES_DB",
        "POSTGRES_USER",
        "POSTGRES_PASSWORD",
        "DATABASE_URL",
        "SECRET_KEY",
        "FRONTEND_URL",
        "NEXT_PUBLIC_API_URL",
    }
    missing = [key for key in required if not values.get(key)]
    if missing:
        raise EnvValidationError(f"Root .env missing values for: {', '.join(sorted(missing))}")
    if len(values["SECRET_KEY"]) < 32:
        raise EnvValidationError("Root SECRET_KEY must be at least 32 characters")
    if "postgresql://" not in values["DATABASE_URL"]:
        raise EnvValidationError("DATABASE_URL must be a PostgreSQL connection string")


def validate_backend(values: Dict[str, str]) -> None:
    required = {"DATABASE_URL", "SECRET_KEY", "APP_NAME", "APP_VERSION"}
    missing = [key for key in required if not values.get(key)]
    if missing:
        raise EnvValidationError(f"backend/.env missing values for: {', '.join(sorted(missing))}")
    if len(values["SECRET_KEY"]) < 32:
        raise EnvValidationError("Backend SECRET_KEY must be at least 32 characters")


def validate_frontend(values: Dict[str, str]) -> None:
    required = {
        "NEXT_PUBLIC_API_URL",
        "NEXT_PUBLIC_APP_VERSION",
        "NEXT_PUBLIC_APP_NAME",
    }
    missing = [key for key in required if not values.get(key)]
    if missing:
        raise EnvValidationError(
            f"frontend/.env.local missing values for: {', '.join(sorted(missing))}"
        )


def build_root_values(context: Dict[str, str]) -> Dict[str, str]:
    postgres_password = context.setdefault("postgres_password", secrets.token_urlsafe(32))
    secret_key = context.setdefault("secret_key", secrets.token_urlsafe(64))
    # Use absolute URL via nginx for browser API requests (not relative /api)
    # Next.js rewrites don't work for client-side axios calls from browser
    api_url = "http://localhost/api"

    return {
        "ACCESS_TOKEN_EXPIRE_MINUTES": "480",
        "ALGORITHM": "HS256",
        "APP_NAME": "UNS-ClaudeJP 5.6.0",
        "APP_VERSION": DEFAULT_VERSION,
        "AZURE_COMPUTER_VISION_API_VERSION": "2023-02-01-preview",
        "AZURE_COMPUTER_VISION_ENDPOINT": "",
        "AZURE_COMPUTER_VISION_KEY": "",
        "BACKEND_CORS_ORIGINS": "http://localhost:3000,http://127.0.0.1:3000",
        "DATABASE_URL": f"postgresql://uns_admin:{postgres_password}@localhost:5432/uns_claudejp",
        "DEBUG": "true",
        "ENABLE_TELEMETRY": "true",
        "ENVIRONMENT": "development",
        "FRONTEND_URL": "http://localhost:3000",
        "GEMINI_API_KEY": "",
        "GOOGLE_CLOUD_VISION_API_KEY": "",
        "GOOGLE_CLOUD_VISION_ENABLED": "false",
        "INTERNAL_API_URL": "http://backend:8000/api",
        "JWT_AUDIENCE": "uns-claudejp::api",
        "JWT_ISSUER": "uns-claudejp",
        "LINE_CHANNEL_ACCESS_TOKEN": "",
        "LOG_FILE": "./logs/uns-claudejp.log",
        "LOG_LEVEL": "INFO",
        "MAX_UPLOAD_SIZE": "10485760",
        "NEXT_PUBLIC_API_URL": api_url,
        "NEXT_PUBLIC_APP_NAME": "UNS-ClaudeJP 5.6.0",
        "NEXT_PUBLIC_APP_VERSION": DEFAULT_VERSION,
        "NEXT_PUBLIC_AUTH_TOKEN_MAX_AGE": str(60 * 60 * 8),
        "NEXT_PUBLIC_GRAFANA_URL": "http://localhost:3001",
        "NEXT_PUBLIC_OTEL_EXPORTER_URL": "http://localhost:4318/v1/traces",
        "NEXT_PUBLIC_TELEMETRY_SAMPLE_RATE": "1",
        "OCR_ENABLED": "true",
        "OTEL_EXPORTER_OTLP_ENDPOINT": "http://localhost:4317",
        "OTEL_EXPORTER_OTLP_METRICS_ENDPOINT": "http://localhost:4317",
        "OTEL_METRICS_EXPORT_INTERVAL_MS": "60000",
        "OTEL_SERVICE_NAME": "uns-claudejp-backend",
        "POSTGRES_DB": "uns_claudejp",
        "POSTGRES_PASSWORD": postgres_password,
        "POSTGRES_USER": "uns_admin",
        "PROMETHEUS_METRICS_PATH": "/metrics",
        "REPORTS_DIR": "./reports",
        "SECRET_KEY": secret_key,
        "SMTP_FROM": "noreply@uns-kikaku.com",
        "SMTP_PASSWORD": "",
        "SMTP_PORT": "587",
        "SMTP_SERVER": "smtp.gmail.com",
        "SMTP_USER": "",
        "TESSERACT_LANG": "jpn+eng",
        "UPLOAD_DIR": "./uploads",
    }


def build_backend_values(context: Dict[str, str]) -> Dict[str, str]:
    postgres_password = context.setdefault("postgres_password", secrets.token_urlsafe(32))
    secret_key = context.setdefault("secret_key", secrets.token_urlsafe(64))

    return {
        "ACCESS_TOKEN_EXPIRE_MINUTES": "480",
        "ALGORITHM": "HS256",
        "APP_NAME": "UNS-ClaudeJP 5.6.0",
        "APP_VERSION": DEFAULT_VERSION,
        "AZURE_COMPUTER_VISION_API_VERSION": "2023-02-01-preview",
        "AZURE_COMPUTER_VISION_ENDPOINT": "",
        "AZURE_COMPUTER_VISION_KEY": "",
        "BACKEND_CORS_ORIGINS": "http://localhost:3000,http://127.0.0.1:3000",
        "DATABASE_URL": f"postgresql://uns_admin:{postgres_password}@localhost:5432/uns_claudejp",
        "DEBUG": "true",
        "ENABLE_TELEMETRY": "true",
        "ENVIRONMENT": "development",
        "FRONTEND_URL": "http://localhost:3000",
        "GEMINI_API_KEY": "",
        "GOOGLE_CLOUD_VISION_API_KEY": "",
        "GOOGLE_CLOUD_VISION_ENABLED": "false",
        "JWT_AUDIENCE": "uns-claudejp::api",
        "JWT_ISSUER": "uns-claudejp",
        "LINE_CHANNEL_ACCESS_TOKEN": "",
        "LOG_FILE": "./logs/uns-claudejp.log",
        "LOG_LEVEL": "INFO",
        "MAX_UPLOAD_SIZE": "10485760",
        "OCR_ENABLED": "true",
        "OTEL_EXPORTER_OTLP_ENDPOINT": "http://localhost:4317",
        "OTEL_EXPORTER_OTLP_METRICS_ENDPOINT": "http://localhost:4317",
        "OTEL_METRICS_EXPORT_INTERVAL_MS": "60000",
        "OTEL_SERVICE_NAME": "uns-claudejp-backend",
        "PROMETHEUS_METRICS_PATH": "/metrics",
        "REPORTS_DIR": "./reports",
        "SECRET_KEY": secret_key,
        "SMTP_FROM": "noreply@uns-kikaku.com",
        "SMTP_PASSWORD": "",
        "SMTP_PORT": "587",
        "SMTP_SERVER": "smtp.gmail.com",
        "SMTP_USER": "",
        "TESSERACT_LANG": "jpn+eng",
        "UPLOAD_DIR": "./uploads",
    }


def build_frontend_values() -> Dict[str, str]:
    return {
        "NEXT_PUBLIC_API_URL": "/api",  # Use relative URL for Next.js rewrites to proxy to backend
        "NEXT_PUBLIC_APP_NAME": "UNS-ClaudeJP 5.6.0",
        "NEXT_PUBLIC_APP_VERSION": DEFAULT_VERSION,
        "NEXT_PUBLIC_AUTH_TOKEN_MAX_AGE": str(60 * 60 * 8),
        "NEXT_PUBLIC_GRAFANA_URL": "http://localhost:3001",
        "NEXT_PUBLIC_OTEL_EXPORTER_URL": "http://localhost:4318/v1/traces",
        "NEXT_PUBLIC_TELEMETRY_SAMPLE_RATE": "1",
    }


def generate(force: bool = False) -> None:
    context: Dict[str, str] = {}

    services = [
        {
            "name": "root",
            "path": ROOT / ".env",
            "example": ROOT / ".env.example",
            "builder": lambda: build_root_values(context),
            "validator": validate_root,
            "header": "# Auto-generated by generate_env.py — root configuration",
        },
        {
            "name": "backend",
            "path": ROOT / "backend/.env",
            "example": ROOT / "backend/.env.example",
            "builder": lambda: build_backend_values(context),
            "validator": validate_backend,
            "header": "# Auto-generated by generate_env.py — backend configuration",
        },
        {
            "name": "frontend",
            "path": ROOT / "frontend/.env.local",
            "example": ROOT / "frontend/.env.example",
            "builder": build_frontend_values,
            "validator": validate_frontend,
            "header": "# Auto-generated by generate_env.py — frontend configuration",
        },
    ]

    for service in services:
        example = service["example"]
        if not example.exists():
            raise EnvValidationError(f"Missing template file: {example}")

        env_path: Path = service["path"]
        validator = service["validator"]

        if env_path.exists() and not force:
            existing = parse_env_file(env_path)
            validator(existing)
            print(f"[SKIP] {env_path.relative_to(ROOT)} already exists and is valid.")
            continue

        values = service["builder"]()
        validator(values)
        write_env_file(env_path, service["header"], values)
        print(f"[OK] Generated {env_path.relative_to(ROOT)}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Generate local environment files")
    parser.add_argument("--force", action="store_true", help="Overwrite existing files")
    args = parser.parse_args(argv)

    try:
        generate(force=args.force)
    except EnvValidationError as exc:
        print(f"[ERROR] {exc}")
        return 1
    except Exception as exc:  # pragma: no cover - safeguard
        print(f"[ERROR] Unexpected failure: {exc}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
