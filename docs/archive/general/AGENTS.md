# Repository Guidelines

## Project Structure & Module Organization
UNS-ClaudeJP 5.4 es una suite RRHH sobre Docker. El backend vive en `backend/app` (routers `api/`, ORM `models/models.py`, config `core/`, automatizaciones `backend/scripts/`); el dashboard Next.js reside en `frontend/app` con layout `(dashboard)`. Assets están en `config/` + `base-datos/`, scripts en `scripts/`, docs en `docs/` y pruebas en `tests/`.

## Build, Test, and Development Commands
- `python generate_env.py`: refresca todas las `.env`.
- `scripts/START.bat` o `docker compose up -d --build`: levanta los seis servicios de `docker-compose.yml`.
- `docker exec -it uns-claudejp-backend bash && uvicorn app.main:app --reload --port 8000`: ciclo FastAPI.
- `docker exec -it uns-claudejp-frontend bash && npm run dev`: watch del dashboard.
- `scripts/VALIDATE.bat`: humo (lint + imports) previo a cualquier PR.

## Coding Style & Naming Conventions
Backend: PEP 8 (4 espacios, type hints y docstrings), módulos snake_case, clases/servicios en PascalCase y `.claude/`, `docker-compose*.yml` o `scripts/*.bat` solo con aprobación. Frontend: ESLint + Prettier (`npm run lint`, `npm run format`, `npm run typecheck`), componentes en PascalCase, hooks/stores camelCase y UI basada en Shadcn.

## Testing Guidelines
Ejecuta `pytest backend/tests -v` como base, añade `pytest --cov=app backend/tests/` antes de fusionar y usa filtros (`pytest -k timer_cards`) solo cuando aplique. Nuevos archivos `backend/tests/test_<feature>.py` deben compartir fixtures. Para validaciones de plataforma extiende los scripts de `tests/`. En frontend usa Vitest/Testing Library (`npm test`, `npm run test:watch`) y Playwright (`npm run test:e2e`) y adjunta evidencia ante cambios de UI o API.

## Commit & Pull Request Guidelines
Parte de `main` con ramas tipo `feature/timer-card-alerts` o `fix/payroll-rounding`. Commits en inglés, imperativos y, si aplica, Conventional (`feat: add OCR retries`). Cada PR debe detallar contexto, comandos corridos (START, lint, pruebas, migraciones), docs impactadas (`ROLE_PERMISSIONS_ANALYSIS.md`, etc.) y evidencias visuales cuando aplique. Fusiona solo con `scripts/VALIDATE.bat` en verde y revisión aprobada.

## Security & Configuration Tips
Las credenciales viven solo en `.env*`; ejecuta `python generate_env.py` en lugar de editar plantillas rastreadas. Usa hostnames Docker (`db`, `redis`), mantén la lógica JWT en `backend/app/core/security.py`, documenta cambios de permisos en `ROLE_PERMISSIONS_ANALYSIS.md`, consulta `docs/security/` para temas de payroll o PII y usa los .bat oficiales.

## Instrucciones para Agentes
El sistema de agentes vive en `.claude/` (lee `README.md`, `agents.json` y `CLAUDE.md`). Los perfiles principales son `research`, `coder`, `tester` y `stuck`; sus `.md` se versionan y `settings.local.json` queda local. No toques `.claude/` ni `/subagentes/` sin coordinación; si ajustas un agente, documenta el motivo y sincroniza con `GIT_SUBIR.bat` / `GIT_BAJAR.bat` según `scripts/README.md`.
