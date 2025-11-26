#!/bin/bash
# Verificar y iniciar backend

echo "=== VERIFICANDO BACKEND ==="
echo ""

# Verificar si el puerto 8000 está en uso
echo "[1] Verificando si puerto 8000 está en uso..."
if netstat -ano | grep :8000; then
    echo "✅ Puerto 8000 está en uso"
else
    echo "❌ Puerto 8000 NO está en uso - Backend no está corriendo"
fi

echo ""
echo "[2] Intentando conectar a http://localhost:8000/api/health..."
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:8000/api/health || echo "❌ No se puede conectar"

echo ""
echo "[3] Iniciando Backend en puerto 8000..."
echo "   Ubicación: d:\JPUNS-Claude.6.5.0\backend"
echo "   Comando: python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
echo ""
echo "Por favor ejecuta en PowerShell:"
echo 'cd d:\JPUNS-Claude.6.5.0\backend; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload'
