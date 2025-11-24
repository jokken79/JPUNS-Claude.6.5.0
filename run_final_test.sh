#!/bin/bash

echo "🚀 VERIFICANDO Y CORRIGIENDO APLICACIÓN"
echo "════════════════════════════════════════════════════════"
echo ""

# Check if server is running
echo "📍 Verificando servidor en puerto 3000..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login --max-time 3)

if [ "$response" = "200" ]; then
    echo "✅ Servidor está corriendo"
    echo ""
    
    # Run the comprehensive test
    echo "🧪 Ejecutando test de Playwright..."
    echo "════════════════════════════════════════════════════════"
    echo ""
    
    node verify_all_pages.js
    
else
    echo "❌ Servidor no está disponible (Status: $response)"
    echo ""
    echo "📝 Por favor, inicia el servidor con:"
    echo "   cd frontend && npm run dev"
    echo ""
    echo "O ejecuta el reinicio automático:"
    echo "   node restart_server.js"
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo "✅ Proceso completado"
