@echo off
REM ==============================================================================
REM GENERATE_DOCS.bat - Generate project documentation
REM ==============================================================================
REM Description:
REM   Generates or updates project documentation including:
REM   - API documentation (Swagger/OpenAPI export)
REM   - Database schema documentation
REM   - Test coverage reports
REM   - TypeScript documentation
REM
REM Usage:
REM   GENERATE_DOCS.bat              - Generate all documentation
REM   GENERATE_DOCS.bat api          - Generate only API docs
REM   GENERATE_DOCS.bat schema       - Generate only DB schema docs
REM   GENERATE_DOCS.bat coverage     - Generate only test coverage
REM ==============================================================================

echo.
echo ================================================================================
echo                    UNS-ClaudeJP Documentation Generator
echo ================================================================================
echo.

REM Parse command line arguments
set DOC_TYPE=%1
if "%DOC_TYPE%"=="" set DOC_TYPE=all

REM Check if Docker is running
docker ps >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop first.
    goto :error
)

echo [INFO] Generating documentation: %DOC_TYPE%
echo.

REM Create docs directory if it doesn't exist
if not exist "..\docs\generated" mkdir "..\docs\generated"

REM Generate API documentation
if "%DOC_TYPE%"=="all" goto :generate_api
if "%DOC_TYPE%"=="api" goto :generate_api
goto :check_schema

:generate_api
echo ================================================================================
echo                        API Documentation (OpenAPI)
echo ================================================================================
echo.

echo [INFO] Exporting OpenAPI schema from FastAPI...
docker exec uns-claudejp-600-backend-1 bash -c "cd /app && python -c 'from app.main import app; import json; print(json.dumps(app.openapi(), indent=2))'" > "..\docs\generated\openapi.json"

if errorlevel 1 (
    echo [WARNING] Failed to export OpenAPI schema
) else (
    echo [SUCCESS] OpenAPI schema exported to docs/generated/openapi.json
)

echo.
echo [INFO] API documentation available at: http://localhost:8000/api/docs
echo.

:check_schema
if "%DOC_TYPE%"=="api" goto :summary

REM Generate database schema documentation
if "%DOC_TYPE%"=="all" goto :generate_schema
if "%DOC_TYPE%"=="schema" goto :generate_schema
goto :check_coverage

:generate_schema
echo ================================================================================
echo                    Database Schema Documentation
echo ================================================================================
echo.

echo [INFO] Exporting database schema...
docker exec uns-claudejp-600-db bash -c "pg_dump -U uns_admin -d uns_claudejp --schema-only" > "..\docs\generated\schema.sql"

if errorlevel 1 (
    echo [WARNING] Failed to export database schema
) else (
    echo [SUCCESS] Database schema exported to docs/generated/schema.sql
)

echo.
echo [INFO] Generating table list...
docker exec uns-claudejp-600-db psql -U uns_admin -d uns_claudejp -c "\dt" > "..\docs\generated\tables.txt"

echo [SUCCESS] Table list exported to docs/generated/tables.txt
echo.

:check_coverage
if "%DOC_TYPE%"=="schema" goto :summary

REM Generate test coverage reports
if "%DOC_TYPE%"=="all" goto :generate_coverage
if "%DOC_TYPE%"=="coverage" goto :generate_coverage
goto :generate_typescript

:generate_coverage
echo ================================================================================
echo                        Test Coverage Reports
echo ================================================================================
echo.

echo [INFO] Generating backend test coverage...
docker exec uns-claudejp-600-backend-1 bash -c "cd /app && pytest backend/tests/ --cov=app --cov-report=html --cov-report=term"

if errorlevel 1 (
    echo [WARNING] Failed to generate backend coverage report
) else (
    echo [SUCCESS] Backend coverage report generated
    echo [INFO] View at: backend/htmlcov/index.html
)
echo.

echo [INFO] Generating frontend test coverage...
docker exec uns-claudejp-600-frontend bash -c "cd /app && npm run test -- --coverage"

if errorlevel 1 (
    echo [WARNING] Failed to generate frontend coverage report
) else (
    echo [SUCCESS] Frontend coverage report generated
    echo [INFO] View at: frontend/coverage/index.html
)
echo.

:generate_typescript
if "%DOC_TYPE%"=="coverage" goto :summary

REM Generate TypeScript documentation
if "%DOC_TYPE%"=="all" goto :typescript_docs
goto :summary

:typescript_docs
echo ================================================================================
echo                    TypeScript Documentation
echo ================================================================================
echo.

echo [INFO] Running TypeScript type check...
docker exec uns-claudejp-600-frontend bash -c "cd /app && npm run typecheck" > "..\docs\generated\typecheck.log" 2>&1

if errorlevel 1 (
    echo [WARNING] TypeScript type check found errors
    echo [INFO] See docs/generated/typecheck.log for details
) else (
    echo [SUCCESS] TypeScript type check passed
)
echo.

:summary
echo ================================================================================
echo                    Documentation Summary
echo ================================================================================
echo.

if "%DOC_TYPE%"=="all" (
    echo Generated documentation:
    echo   [*] API Documentation: docs/generated/openapi.json
    echo   [*] Database Schema: docs/generated/schema.sql
    echo   [*] Table List: docs/generated/tables.txt
    echo   [*] Backend Coverage: backend/htmlcov/index.html
    echo   [*] Frontend Coverage: frontend/coverage/index.html
    echo   [*] TypeScript Check: docs/generated/typecheck.log
    echo.
    echo Online documentation:
    echo   [*] API Docs: http://localhost:8000/api/docs
    echo   [*] ReDoc: http://localhost:8000/api/redoc
)

if "%DOC_TYPE%"=="api" (
    echo Generated API documentation:
    echo   [*] OpenAPI Schema: docs/generated/openapi.json
    echo   [*] Interactive Docs: http://localhost:8000/api/docs
)

if "%DOC_TYPE%"=="schema" (
    echo Generated database documentation:
    echo   [*] Schema: docs/generated/schema.sql
    echo   [*] Tables: docs/generated/tables.txt
)

if "%DOC_TYPE%"=="coverage" (
    echo Generated coverage reports:
    echo   [*] Backend: backend/htmlcov/index.html
    echo   [*] Frontend: frontend/coverage/index.html
)

echo.
echo ================================================================================
echo                    Documentation generation completed!
echo ================================================================================
echo.
pause >nul
exit /b 0

:error
echo.
echo [ERROR] Documentation generation failed!
echo.
pause >nul
