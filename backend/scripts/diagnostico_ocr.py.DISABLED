"""
Diagnóstico OCR - UNS-ClaudeJP 2.0
Test simple para diagnosticar problemas OCR y foto
"""
import os
import sys
from pathlib import Path

# Agregar el path del backend
sys.path.append(str(Path(__file__).parent.parent))

from app.core.config_azure import AZURE_ENDPOINT, AZURE_KEY, AZURE_API_VERSION


def diagnosticar_configuracion():
    """Diagnosticar la configuración de Azure"""
    print("🔍 DIAGNÓSTICO CONFIGURACIÓN AZURE")
    print("=" * 50)
    
    print(f"Endpoint: {AZURE_ENDPOINT}")
    print(f"Key disponible: {'✅ Sí' if AZURE_KEY and AZURE_KEY != 'demo_key_for_testing' else '❌ No'}")
    print(f"API Version: {AZURE_API_VERSION}")
    
    if AZURE_KEY and AZURE_KEY != 'demo_key_for_testing':
        print(f"Key length: {len(AZURE_KEY)} caracteres")
        print(f"Key preview: {AZURE_KEY[:10]}...{AZURE_KEY[-10:]}")
    
    return AZURE_KEY and AZURE_KEY != 'demo_key_for_testing'


def test_azure_connection():
    """Test conexión con Azure Computer Vision"""
    print("\n🔗 TEST CONEXIÓN AZURE")
    print("=" * 50)
    
    try:
        from azure.cognitiveservices.vision.computervision import ComputerVisionClient
        from msrest.authentication import CognitiveServicesCredentials
        
        credentials = CognitiveServicesCredentials(AZURE_KEY)
        client = ComputerVisionClient(AZURE_ENDPOINT, credentials)
        
        print("✅ Cliente Azure inicializado correctamente")
        return True, client
        
    except Exception as e:
        print(f"❌ Error al inicializar cliente Azure: {e}")
        return False, None


def test_ocr_simple():
    """Test OCR con imagen simple"""
    print("\n📷 TEST OCR SIMPLE")
    print("=" * 50)
    
    success, client = test_azure_connection()
    if not success:
        print("❌ No se puede hacer test OCR - cliente no disponible")
        return False
        
    # Crear imagen de test simple
    from PIL import Image, ImageDraw, ImageFont
    import io
    
    try:
        # Crear imagen con texto japonés simple
        img = Image.new('RGB', (400, 200), color='white')
        draw = ImageDraw.Draw(img)
        
        # Texto de prueba
        texto_prueba = """氏名: 田中 太郎
生年月日: 1990年5月15日
住所: 東京都新宿区"""
        
        try:
            # Intentar usar fuente del sistema
            font = ImageFont.truetype("arial.ttf", 24)
        except:
            font = ImageFont.load_default()
        
        draw.text((20, 20), texto_prueba, fill='black', font=font)
        
        # Convertir a bytes
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)
        
        # Procesar con Azure OCR
        print("📤 Enviando imagen de test a Azure...")
        
        read_response = client.read_in_stream(img_bytes, raw=True)
        operation_location = read_response.headers["Operation-Location"]
        operation_id = operation_location.split("/")[-1]
        
        # Esperar resultado
        import time
        max_attempts = 10
        attempts = 0
        
        while attempts < max_attempts:
            read_result = client.get_read_result(operation_id)
            if read_result.status.lower() == 'succeeded':
                break
            elif read_result.status.lower() == 'failed':
                print(f"❌ OCR falló: {read_result.status}")
                return False
            
            print(f"⏳ Esperando... intento {attempts + 1}")
            time.sleep(1)
            attempts += 1
        
        if attempts >= max_attempts:
            print("❌ Timeout esperando resultado OCR")
            return False
        
        # Extraer texto
        extracted_text = ""
        if read_result.analyze_result.read_results:
            for text_result in read_result.analyze_result.read_results:
                for line in text_result.lines:
                    extracted_text += line.text + "\n"
        
        print(f"✅ OCR completado exitosamente!")
        print(f"📝 Texto extraído:")
        print(f"   Original: {texto_prueba}")
        print(f"   OCR: {extracted_text.strip()}")
        
        # Verificar si el texto contiene elementos clave
        elementos_clave = ['田中', '太郎', '1990', '東京']
        elementos_encontrados = [elem for elem in elementos_clave if elem in extracted_text]
        
        print(f"🎯 Elementos encontrados: {elementos_encontrados}")
        
        return len(elementos_encontrados) > 0
        
    except Exception as e:
        print(f"❌ Error en test OCR: {e}")
        import traceback
        traceback.print_exc()
        return False


def diagnosticar_parsing():
    """Diagnosticar problemas en el parsing"""
    print("\n🔧 DIAGNÓSTICO PARSING")
    print("=" * 50)
    
    # Texto de ejemplo de una tarjeta de residencia
    texto_ejemplo = """在留カード
氏名 TANAKA TARO
田中太郎
生年月日 1990年5月15日
国籍・地域 ブラジル
住居地 東京都新宿区西新宿1-1-1
在留資格 技能実習1号
在留期間満了日 2025年12月31日
カード番号 AB1234567890"""
    
    print("📝 Texto de ejemplo:")
    print(texto_ejemplo)
    print("\n🔍 Analizando parsing...")
    
    try:
        from app.services.azure_ocr_service import azure_ocr_service
        
        # Test parsing manualmente
        parsed = azure_ocr_service._parse_zairyu_card(texto_ejemplo)
        
        print(f"✅ Resultado del parsing:")
        for key, value in parsed.items():
            print(f"   {key}: {value}")
            
        # Verificar campos críticos
        campos_criticos = ['name_kanji', 'birthday', 'nationality', 'address']
        campos_ok = [campo for campo in campos_criticos if parsed.get(campo)]
        campos_faltantes = [campo for campo in campos_criticos if not parsed.get(campo)]
        
        print(f"\n✅ Campos extraídos correctamente: {campos_ok}")
        if campos_faltantes:
            print(f"❌ Campos faltantes: {campos_faltantes}")
            
        return len(campos_faltantes) == 0
        
    except Exception as e:
        print(f"❌ Error en parsing: {e}")
        import traceback
        traceback.print_exc()
        return False


def diagnosticar_foto():
    """Diagnosticar problemas con la foto"""
    print("\n📸 DIAGNÓSTICO FOTO")
    print("=" * 50)
    
    print("🔍 Problemas identificados con la foto:")
    print("1. ❌ NO hay extracción automática de rostro")
    print("2. ❌ OCR devuelve foto COMPLETA del documento")
    print("3. ❌ NO hay recorte de la zona de foto")
    print("4. ❌ NO hay redimensionamiento a 150x180px")
    
    print("\n💡 Soluciones recomendadas:")
    print("1. ✅ Detectar zona de foto en documento")
    print("2. ✅ Recortar solo la región facial")
    print("3. ✅ Redimensionar a tamaño estándar")
    print("4. ✅ Aplicar mejoras de calidad")
    
    return False  # Actualmente no implementado


def main():
    """Función principal de diagnóstico"""
    print("🏥 DIAGNÓSTICO COMPLETO OCR Y FOTO")
    print("=" * 60)
    
    resultados = {}
    
    # 1. Configuración
    resultados['config'] = diagnosticar_configuracion()
    
    # 2. Test OCR
    if resultados['config']:
        resultados['ocr'] = test_ocr_simple()
    else:
        resultados['ocr'] = False
        print("❌ Saltando test OCR - configuración no válida")
    
    # 3. Test Parsing
    resultados['parsing'] = diagnosticar_parsing()
    
    # 4. Test Foto
    resultados['foto'] = diagnosticar_foto()
    
    # Resumen final
    print("\n📊 RESUMEN DIAGNÓSTICO")
    print("=" * 60)
    
    for test, resultado in resultados.items():
        status = "✅ OK" if resultado else "❌ PROBLEMA"
        print(f"{test.upper():12}: {status}")
    
    problemas_encontrados = sum(1 for r in resultados.values() if not r)
    
    if problemas_encontrados == 0:
        print("\n🎉 ¡TODO FUNCIONANDO CORRECTAMENTE!")
    else:
        print(f"\n⚠️  ENCONTRADOS {problemas_encontrados} PROBLEMAS QUE NECESITAN SOLUCIÓN")
    
    return resultados


if __name__ == "__main__":
    main()