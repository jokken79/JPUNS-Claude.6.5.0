"""
Hybrid OCR Service - UNS-ClaudeJP 3.0
Servicio híbrido que combina Azure OCR y EasyOCR para máxima precisión
"""
import os
import logging
import base64
import time
from typing import Dict, Any, Optional, List
from io import BytesIO
from pathlib import Path

import numpy as np
from PIL import Image

from app.core.observability import (
    record_ocr_failure,
    record_ocr_request,
    trace_ocr_operation,
)
from app.core.timeout_utils import timeout_executor, TimeoutException

logger = logging.getLogger(__name__)


class HybridOCRService:
    """Servicio híbrido OCR que combina múltiples métodos para máxima precisión.

    Este servicio implementa una estrategia inteligente de procesamiento OCR que:
    - Intenta múltiples proveedores OCR (Azure, EasyOCR, Tesseract)
    - Combina resultados para máxima precisión
    - Maneja fallbacks automáticos
    - Proporciona scores de confianza

    Attributes:
        azure_available (bool): Indica si Azure OCR está disponible
        easyocr_available (bool): Indica si EasyOCR está disponible
        tesseract_available (bool): Indica si Tesseract OCR está disponible
        azure_service: Instancia del servicio Azure OCR
        easyocr_service: Instancia del servicio EasyOCR
        tesseract_service: Instancia del servicio Tesseract OCR

    Examples:
        >>> service = HybridOCRService()
        >>> result = service.process_document_hybrid(image_bytes, "zairyu_card")
        >>> print(result['method_used'])  # 'hybrid', 'azure', 'easyocr', or 'tesseract'
        >>> print(result['confidence_score'])  # 0.0 - 0.95
    """

    def __init__(self):
        """Inicializa el servicio híbrido OCR.

        Intenta inicializar todos los servicios OCR (Azure, EasyOCR, Tesseract) y registra
        cuáles están disponibles para su uso.
        """
        self.azure_available = False
        self.easyocr_available = False
        self.tesseract_available = False

        # Inicializar servicios disponibles
        self._init_services()

        logger.info(f"HybridOCRService inicializado - Azure: {self.azure_available}, EasyOCR: {self.easyocr_available}, Tesseract: {self.tesseract_available}")
    
    def _init_services(self):
        """Inicializa los servicios OCR disponibles.

        NOTA: v6.0.0 consolidación - Individual OCR services (AzureOCRService, EasyOCRService,
        TesseractOCRService) were removed during SEMANA 3-4 cleanup. HybridOCRService now
        contains all OCR logic internally.

        Side Effects:
            - Sets availability flags based on configuration
            - Initializes OCR backends (Azure API, EasyOCR model, Tesseract)
            - Registers log messages about provider availability
        """
        # Check Azure Computer Vision API availability
        try:
            from app.core.config import settings
            self.azure_available = bool(settings.AZURE_COMPUTER_VISION_ENDPOINT and settings.AZURE_COMPUTER_VISION_KEY)
            if self.azure_available:
                logger.info("Azure Computer Vision OCR available (configured)")
            else:
                logger.info("Azure Computer Vision OCR not configured (using fallbacks)")
        except Exception as e:
            logger.warning(f"Azure OCR initialization check failed: {e}")
            self.azure_available = False

        # Check EasyOCR availability
        try:
            import easyocr
            self.easyocr_available = True
            logger.info("EasyOCR library available (fallback method)")
        except ImportError:
            logger.warning("EasyOCR not installed (will use Tesseract fallback)")
            self.easyocr_available = False

        # Check Tesseract availability
        try:
            import pytesseract
            self.tesseract_available = True
            logger.info("Tesseract OCR available (final fallback)")
        except ImportError:
            logger.warning("Tesseract not installed (may fail if other methods unavailable)")
            self.tesseract_available = False
    
    def _process_document_hybrid_internal(self, image_data: bytes, document_type: str,
                                         preferred_method: str) -> Dict[str, Any]:
        """Internal method for hybrid OCR processing (without timeout wrapper).

        This method is called by process_document_hybrid with timeout protection.

        Args:
            image_data (bytes): Document image bytes
            document_type (str): Document type
            preferred_method (str): Processing strategy

        Returns:
            Dict[str, Any]: OCR processing results
        """
        try:
            logger.info(f"Procesando documento con método híbrido: {document_type}, preferencia: {preferred_method}")
            
            results = {
                "document_type": document_type,
                "success": False,
                "method_used": "none",
                "confidence_score": 0.0,
                "azure_result": None,
                "easyocr_result": None,
                "combined_data": {}
            }
            
            # Estrategia de procesamiento según preferencia
            if preferred_method == "azure" and self.azure_available:
                # Azure primero, EasyOCR como fallback
                azure_result = self._process_with_azure(image_data, document_type)
                results["azure_result"] = azure_result
                
                if azure_result.get("success"):
                    results["success"] = True
                    results["method_used"] = "azure"
                    results["combined_data"] = azure_result
                    results["confidence_score"] = 0.8  # Confianza base para Azure
                    
                    # Intentar mejorar con EasyOCR si hay campos faltantes
                    if self.easyocr_available and self._has_missing_fields(azure_result, document_type):
                        logger.info("Campos faltantes detectados, complementando con EasyOCR")
                        easyocr_result = self._process_with_easyocr(image_data, document_type)
                        results["easyocr_result"] = easyocr_result
                        
                        if easyocr_result.get("success"):
                            combined = self._combine_results(azure_result, easyocr_result, "azure")
                            results["combined_data"] = combined
                            results["confidence_score"] = 0.9  # Mayor confianza con combinación
                else:
                    # Si Azure falla, probar con EasyOCR
                    if self.easyocr_available:
                        easyocr_result = self._process_with_easyocr(image_data, document_type)
                        results["easyocr_result"] = easyocr_result

                        if easyocr_result.get("success"):
                            results["success"] = True
                            results["method_used"] = "easyocr"
                            results["combined_data"] = easyocr_result
                            results["confidence_score"] = 0.7
                        else:
                            # Si EasyOCR también falla, probar con Tesseract
                            if self.tesseract_available:
                                logger.info("Azure y EasyOCR fallaron, intentando con Tesseract")
                                tesseract_result = self._process_with_tesseract(image_data, document_type)
                                results["tesseract_result"] = tesseract_result

                                if tesseract_result and tesseract_result.get("success"):
                                    results["success"] = True
                                    results["method_used"] = "tesseract"
                                    results["combined_data"] = tesseract_result
                                    results["confidence_score"] = 0.6
                    else:
                        # Si EasyOCR no está disponible, probar directamente con Tesseract
                        if self.tesseract_available:
                            logger.info("Azure falló y EasyOCR no disponible, intentando con Tesseract")
                            tesseract_result = self._process_with_tesseract(image_data, document_type)
                            results["tesseract_result"] = tesseract_result

                            if tesseract_result and tesseract_result.get("success"):
                                results["success"] = True
                                results["method_used"] = "tesseract"
                                results["combined_data"] = tesseract_result
                                results["confidence_score"] = 0.6
            
            elif preferred_method == "easyocr" and self.easyocr_available:
                # EasyOCR primero, Azure como fallback
                easyocr_result = self._process_with_easyocr(image_data, document_type)
                results["easyocr_result"] = easyocr_result
                
                if easyocr_result.get("success"):
                    results["success"] = True
                    results["method_used"] = "easyocr"
                    results["combined_data"] = easyocr_result
                    results["confidence_score"] = 0.8
                    
                    # Intentar mejorar con Azure si hay campos faltantes
                    if self.azure_available and self._has_missing_fields(easyocr_result, document_type):
                        logger.info("Campos faltantes detectados, complementando con Azure")
                        azure_result = self._process_with_azure(image_data, document_type)
                        results["azure_result"] = azure_result
                        
                        if azure_result.get("success"):
                            combined = self._combine_results(easyocr_result, azure_result, "easyocr")
                            results["combined_data"] = combined
                            results["confidence_score"] = 0.9
                else:
                    # Si EasyOCR falla, probar con Azure
                    if self.azure_available:
                        azure_result = self._process_with_azure(image_data, document_type)
                        results["azure_result"] = azure_result

                        if azure_result.get("success"):
                            results["success"] = True
                            results["method_used"] = "azure"
                            results["combined_data"] = azure_result
                            results["confidence_score"] = 0.7
                        else:
                            # Si Azure también falla, probar con Tesseract
                            if self.tesseract_available:
                                logger.info("EasyOCR y Azure fallaron, intentando con Tesseract")
                                tesseract_result = self._process_with_tesseract(image_data, document_type)
                                results["tesseract_result"] = tesseract_result

                                if tesseract_result and tesseract_result.get("success"):
                                    results["success"] = True
                                    results["method_used"] = "tesseract"
                                    results["combined_data"] = tesseract_result
                                    results["confidence_score"] = 0.6
                    else:
                        # Si Azure no está disponible, probar directamente con Tesseract
                        if self.tesseract_available:
                            logger.info("EasyOCR falló y Azure no disponible, intentando con Tesseract")
                            tesseract_result = self._process_with_tesseract(image_data, document_type)
                            results["tesseract_result"] = tesseract_result

                            if tesseract_result and tesseract_result.get("success"):
                                results["success"] = True
                                results["method_used"] = "tesseract"
                                results["combined_data"] = tesseract_result
                                results["confidence_score"] = 0.6
            
            else:  # auto
                # Estrategia automática: probar ambos y combinar los mejores resultados
                azure_result = None
                easyocr_result = None
                
                # Ejecutar ambos servicios en paralelo si es posible
                if self.azure_available:
                    azure_result = self._process_with_azure(image_data, document_type)
                    results["azure_result"] = azure_result
                
                if self.easyocr_available:
                    easyocr_result = self._process_with_easyocr(image_data, document_type)
                    results["easyocr_result"] = easyocr_result
                
                # Evaluar resultados y seleccionar el mejor
                azure_success = azure_result and azure_result.get("success")
                easyocr_success = easyocr_result and easyocr_result.get("success")
                
                if azure_success and easyocr_success:
                    # Ambos funcionaron, combinar resultados
                    logger.info("Ambos métodos funcionaron, combinando resultados")
                    combined = self._combine_results(azure_result, easyocr_result, "auto")
                    results["success"] = True
                    results["method_used"] = "hybrid"
                    results["combined_data"] = combined
                    results["confidence_score"] = 0.95  # Máxima confianza con híbrido
                    
                elif azure_success:
                    # Solo Azure funcionó
                    logger.info("Solo Azure funcionó")
                    results["success"] = True
                    results["method_used"] = "azure"
                    results["combined_data"] = azure_result
                    results["confidence_score"] = 0.8
                    
                elif easyocr_success:
                    # Solo EasyOCR funcionó
                    logger.info("Solo EasyOCR funcionó")
                    results["success"] = True
                    results["method_used"] = "easyocr"
                    results["combined_data"] = easyocr_result
                    results["confidence_score"] = 0.8
                    
                else:
                    # Ninguno funcionó, intentar con Tesseract como último recurso
                    logger.error("Azure y EasyOCR fallaron, intentando Tesseract como último recurso")
                    if self.tesseract_available:
                        tesseract_result = self._process_with_tesseract(image_data, document_type)
                        results["tesseract_result"] = tesseract_result

                        if tesseract_result and tesseract_result.get("success"):
                            results["success"] = True
                            results["method_used"] = "tesseract"
                            results["combined_data"] = tesseract_result
                            results["confidence_score"] = 0.6
                        else:
                            # Todos los métodos fallaron
                            logger.error("Todos los métodos OCR fallaron (Azure, EasyOCR, Tesseract)")
                            results["success"] = False
                            results["method_used"] = "none"
                            results["confidence_score"] = 0.0
                    else:
                        # No hay Tesseract disponible
                        logger.error("Ningún método OCR funcionó y Tesseract no está disponible")
                        results["success"] = False
                        results["method_used"] = "none"
                        results["confidence_score"] = 0.0
            
            # Extraer foto con el servicio mejorado de detección facial
            if results["success"]:
                try:
                    from app.services.face_detection_service import face_detection_service
                    photo_data = face_detection_service.extract_face_from_document(image_data, document_type)
                    if photo_data:
                        results["combined_data"]["photo"] = photo_data
                        logger.info("Foto extraída exitosamente con servicio mejorado")
                except Exception as e:
                    logger.warning(f"Error extrayendo foto: {e}")
                    # Usar método original como fallback
                    try:
                        if self.azure_available:
                            photo_data = self.azure_service._extract_photo_from_document(image_data, document_type)
                            if photo_data:
                                results["combined_data"]["photo"] = photo_data
                    except Exception as e2:
                        logger.error(f"Error extrayendo foto con método original: {e2}")
            
            logger.info(f"Procesamiento híbrido completado - Método: {results['method_used']}, Éxito: {results['success']}")
            return results

        except Exception as e:
            logger.error(f"Error en procesamiento híbrido: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "method_used": "error",
                "confidence_score": 0.0
            }

    def process_document_hybrid(self, image_data: bytes, document_type: str = "zairyu_card",
                               preferred_method: str = "auto") -> Dict[str, Any]:
        """Procesa un documento usando estrategia híbrida inteligente de OCR (with 90s timeout).

        Este método implementa una estrategia sofisticada que:
        1. Si preferred_method='azure': Usa Azure primero, EasyOCR como fallback
        2. Si preferred_method='easyocr': Usa EasyOCR primero, Azure como fallback
        3. Si preferred_method='auto': Ejecuta ambos y combina los mejores resultados

        La estrategia automática proporciona la máxima precisión al combinar
        resultados de múltiples proveedores OCR y completar campos faltantes.

        Args:
            image_data (bytes): Bytes de la imagen del documento a procesar
            document_type (str): Tipo de documento. Opciones:
                - "zairyu_card": Tarjeta de residencia
                - "rirekisho": Curriculum vitae japonés
                - "license": Licencia de conducir
                - "timer_card": Timer card (タイムカード)
            preferred_method (str): Estrategia de procesamiento. Opciones:
                - "azure": Priorizar Azure OCR
                - "easyocr": Priorizar EasyOCR
                - "auto": Estrategia híbrida automática (recomendado)

        Returns:
            Dict[str, Any]: Diccionario con estructura:
                {
                    "success": bool,  # True si al menos un método funcionó
                    "method_used": str,  # "hybrid", "azure", "easyocr", "none"
                    "confidence_score": float,  # 0.0-0.95 (mayor=mejor)
                    "azure_result": Dict | None,  # Resultado de Azure
                    "easyocr_result": Dict | None,  # Resultado de EasyOCR
                    "combined_data": Dict,  # Datos combinados finales
                    "document_type": str,
                    # Campos extraídos (según tipo de documento):
                    "name_kanji": str,
                    "birthday": str,
                    "nationality": str,
                    # ... más campos según document_type
                }

        Raises:
            Exception: Si ambos métodos OCR fallan completamente

        Examples:
            >>> # Estrategia automática (recomendado)
            >>> result = service.process_document_hybrid(
            ...     image_bytes,
            ...     document_type="zairyu_card",
            ...     preferred_method="auto"
            ... )
            >>> if result['success']:
            ...     print(f"Método usado: {result['method_used']}")
            ...     print(f"Confianza: {result['confidence_score']}")
            ...     print(f"Nombre: {result['combined_data']['name_kanji']}")

            >>> # Forzar uso de Azure con fallback a EasyOCR
            >>> result = service.process_document_hybrid(
            ...     image_bytes,
            ...     preferred_method="azure"
            ... )

        Note:
            - El score de confianza es mayor cuando se combinan múltiples métodos
            - La estrategia 'auto' es la más precisa pero más lenta
            - Si ningún método está disponible, success=False
            - **TIMEOUT: 90 segundos total** - Prevents indefinite hanging (allows for both OCR methods + processing)
        """
        try:
            # Execute with 90 second total timeout (allows for both Azure 30s + EasyOCR 30s + overhead)
            result = timeout_executor(
                self._process_document_hybrid_internal,
                timeout_seconds=90,
                image_data=image_data,
                document_type=document_type,
                preferred_method=preferred_method
            )
            return result

        except TimeoutException as e:
            logger.error(f"Hybrid OCR processing timed out after 90 seconds: {e}")
            return {
                "success": False,
                "error": "Hybrid OCR processing timeout after 90 seconds",
                "method_used": "timeout",
                "confidence_score": 0.0,
                "document_type": document_type
            }

        except Exception as e:
            logger.error(f"Error in process_document_hybrid: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "method_used": "error",
                "confidence_score": 0.0,
                "document_type": document_type
            }

    def _process_with_azure_internal(self, image_data: bytes, document_type: str, temp_path: str) -> Dict[str, Any]:
        """Internal method to process document with Azure OCR (without timeout wrapper).

        This method is called by _process_with_azure with timeout protection.

        Args:
            image_data (bytes): Image bytes
            document_type (str): Document type
            temp_path (str): Temporary file path for Azure

        Returns:
            Dict[str, Any]: Azure OCR result
        """
        with open(temp_path, 'wb') as f:
            f.write(image_data)

        started = time.perf_counter()
        with trace_ocr_operation("azure.process_document", document_type, "azure"):
            result = self.azure_service.process_document(temp_path, document_type)
        duration = time.perf_counter() - started
        record_ocr_request(document_type=document_type, method="azure", duration_seconds=duration)

        return result

    def _process_with_azure(self, image_data: bytes, document_type: str) -> Optional[Dict[str, Any]]:
        """Procesa documento con Azure Computer Vision OCR (with 30s timeout).

        Args:
            image_data (bytes): Imagen del documento en bytes
            document_type (str): Tipo de documento ("zairyu_card", "license", etc.)

        Returns:
            Optional[Dict[str, Any]]: Resultado de Azure OCR o None si no disponible.
                Estructura del diccionario de éxito:
                {
                    "success": True,
                    "raw_text": str,
                    "name_kanji": str,
                    # ... más campos extraídos
                }

        Raises:
            Exception: Si Azure OCR falla durante el procesamiento

        Note:
            - Registra métricas de observabilidad (duración, errores)
            - Crea archivo temporal para Azure OCR
            - Limpia archivo temporal después del procesamiento
            - **TIMEOUT: 30 segundos** - Prevents indefinite hanging
        """
        if not self.azure_available:
            return None

        temp_path = "/tmp/temp_azure_image.jpg"
        try:
            # Execute with 30 second timeout
            result = timeout_executor(
                self._process_with_azure_internal,
                timeout_seconds=30,
                image_data=image_data,
                document_type=document_type,
                temp_path=temp_path
            )

            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)

            return result

        except TimeoutException as e:
            logger.error(f"Azure OCR timed out after 30 seconds: {e}")
            record_ocr_failure(document_type=document_type, method="azure")
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
            return {"success": False, "error": "Azure OCR timeout after 30 seconds"}

        except Exception as e:
            logger.error(f"Error procesando con Azure: {e}")
            record_ocr_failure(document_type=document_type, method="azure")
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
            return {"success": False, "error": str(e)}

    def _process_with_easyocr_internal(self, image_data: bytes, document_type: str) -> Dict[str, Any]:
        """Internal method to process document with EasyOCR (without timeout wrapper).

        This method is called by _process_with_easyocr with timeout protection.

        Args:
            image_data (bytes): Image bytes
            document_type (str): Document type

        Returns:
            Dict[str, Any]: EasyOCR result
        """
        started = time.perf_counter()
        with trace_ocr_operation("easyocr.process_document", document_type, "easyocr"):
            result = self.easyocr_service.process_document_with_easyocr(image_data, document_type)
        duration = time.perf_counter() - started
        record_ocr_request(document_type=document_type, method="easyocr", duration_seconds=duration)
        return result

    def _process_with_easyocr(self, image_data: bytes, document_type: str) -> Optional[Dict[str, Any]]:
        """Procesa documento con EasyOCR (with 30s timeout).

        Args:
            image_data (bytes): Imagen del documento en bytes
            document_type (str): Tipo de documento ("zairyu_card", "license", etc.)

        Returns:
            Optional[Dict[str, Any]]: Resultado de EasyOCR o None si no disponible.
                Estructura del diccionario de éxito:
                {
                    "success": True,
                    "raw_text": str,
                    "detections": int,
                    "ocr_method": "EasyOCR",
                    # ... campos extraídos
                }

        Raises:
            Exception: Si EasyOCR falla durante el procesamiento

        Note:
            - Registra métricas de observabilidad (duración, errores)
            - No requiere archivo temporal (procesa bytes directamente)
            - **TIMEOUT: 30 segundos** - Prevents indefinite hanging
        """
        if not self.easyocr_available:
            return None

        try:
            # Execute with 30 second timeout
            result = timeout_executor(
                self._process_with_easyocr_internal,
                timeout_seconds=30,
                image_data=image_data,
                document_type=document_type
            )
            return result

        except TimeoutException as e:
            logger.error(f"EasyOCR timed out after 30 seconds: {e}")
            record_ocr_failure(document_type=document_type, method="easyocr")
            return {"success": False, "error": "EasyOCR timeout after 30 seconds"}

        except Exception as e:
            logger.error(f"Error procesando con EasyOCR: {e}")
            record_ocr_failure(document_type=document_type, method="easyocr")
            return {"success": False, "error": str(e)}

    def _process_with_tesseract(self, image_data: bytes, document_type: str) -> Optional[Dict[str, Any]]:
        """Procesa documento con Tesseract OCR (fallback final).

        Args:
            image_data (bytes): Imagen del documento en bytes
            document_type (str): Tipo de documento ("zairyu_card", "license", etc.)

        Returns:
            Optional[Dict[str, Any]]: Resultado de Tesseract OCR o None si no disponible.
                Estructura del diccionario de éxito:
                {
                    "success": True,
                    "raw_text": str,
                    "ocr_method": "tesseract",
                    # ... campos extraídos
                }

        Raises:
            Exception: Si Tesseract OCR falla durante el procesamiento

        Note:
            - Registra métricas de observabilidad (duración, errores)
            - No requiere archivo temporal (procesa bytes directamente)
            - No usa timeout (es lo suficientemente rápido)
        """
        if not self.tesseract_available:
            return None

        try:
            started = time.perf_counter()
            with trace_ocr_operation("tesseract.process_document", document_type, "tesseract"):
                result = self.tesseract_service.process_document(image_data, document_type)
            duration = time.perf_counter() - started
            record_ocr_request(document_type=document_type, method="tesseract", duration_seconds=duration)
            return result

        except Exception as e:
            logger.error(f"Error procesando con Tesseract: {e}")
            record_ocr_failure(document_type=document_type, method="tesseract")
            return {"success": False, "error": str(e)}

    def _has_missing_fields(self, result: Dict[str, Any], document_type: str) -> bool:
        """Verifica si faltan campos críticos en el resultado OCR.

        Determina si un resultado OCR necesita ser complementado con otro método
        basándose en la presencia de campos críticos según el tipo de documento.

        Args:
            result (Dict[str, Any]): Resultado OCR a verificar
            document_type (str): Tipo de documento para determinar campos críticos

        Returns:
            bool: True si faltan más del 50% de campos críticos, False en caso contrario

        Note:
            Campos críticos por tipo de documento:
            - zairyu_card: name_kanji, birthday, nationality
            - rirekisho: name_kanji, birthday
            - license: name_kanji, license_number
            - otros: name_kanji
        """
        if not result or not result.get("success"):
            return True

        # Campos críticos por tipo de documento
        if document_type == "zairyu_card":
            critical_fields = ['name_kanji', 'birthday', 'nationality']
        elif document_type == "rirekisho":
            critical_fields = ['name_kanji', 'birthday']
        elif document_type == "license":
            critical_fields = ['name_kanji', 'license_number']
        else:
            critical_fields = ['name_kanji']

        missing_count = 0
        for field in critical_fields:
            if not result.get(field):
                missing_count += 1

        # Si faltan más del 50% de campos críticos
        return missing_count > len(critical_fields) // 2
    
    def _combine_results(self, primary_result: Dict[str, Any], secondary_result: Dict[str, Any],
                        primary_method: str) -> Dict[str, Any]:
        """Combina resultados de dos métodos OCR para máxima precisión.

        Implementa lógica inteligente para seleccionar los mejores valores de cada
        método OCR, completando campos faltantes y mejorando la calidad general.

        Args:
            primary_result (Dict[str, Any]): Resultado del método principal
            secondary_result (Dict[str, Any]): Resultado del método secundario
            primary_method (str): Método principal ('azure', 'easyocr', 'auto')

        Returns:
            Dict[str, Any]: Diccionario combinado con metadata adicional:
                {
                    # Todos los campos del primary_result
                    # Campos completados/mejorados del secondary_result
                    "ocr_method": "hybrid",
                    "primary_method": str,  # Método que se priorizó
                    "azure_available": bool,
                    "easyocr_available": bool
                }

        Note:
            Estrategias de combinación por tipo de campo:
            - Nombres: Prefiere el valor más largo y completo
            - Fechas: Prefiere formato japonés completo (YYYY年MM月DD日)
            - Nacionalidad: EasyOCR tiene mejor normalización
            - Números de tarjeta: Valida formato antes de seleccionar
            - Texto crudo: Combina ambos sin duplicados
        """
        try:
            combined = primary_result.copy()
            
            # Campos a combinar, priorizando el método principal
            fields_to_combine = [
                'name_kanji', 'name_kana', 'name_roman',
                'birthday', 'date_of_birth',
                'nationality',
                'address', 'current_address',
                'visa_status', 'residence_status',
                'zairyu_card_number', 'residence_card_number',
                'license_number',
                'raw_text'
            ]
            
            # Para cada campo, seleccionar el mejor valor
            for field in fields_to_combine:
                primary_value = primary_result.get(field)
                secondary_value = secondary_result.get(field)
                
                if not primary_value and secondary_value:
                    # Si el principal no tiene valor, usar el secundario
                    combined[field] = secondary_value
                    logger.info(f"Campo '{field}' complementado con {self._secondary_method(primary_method)}")
                elif primary_value and secondary_value:
                    # Ambos tienen valores, seleccionar el mejor
                    better_value = self._select_best_field_value(
                        field, primary_value, secondary_value, primary_method
                    )
                    if better_value != primary_value:
                        combined[field] = better_value
                        logger.info(f"Campo '{field}' mejorado con {self._secondary_method(primary_method)}")
            
            # Agregar metadata del procesamiento híbrido
            combined['ocr_method'] = 'hybrid'
            combined['primary_method'] = primary_method
            combined['azure_available'] = self.azure_available
            combined['easyocr_available'] = self.easyocr_available
            
            return combined
            
        except Exception as e:
            logger.error(f"Error combinando resultados: {e}")
            return primary_result
    
    def _select_best_field_value(self, field: str, primary_value: str, secondary_value: str,
                                primary_method: str) -> str:
        """Selecciona el mejor valor entre dos opciones para un campo específico.

        Aplica heurísticas según el tipo de campo para determinar cuál valor
        es más confiable o completo.

        Args:
            field (str): Nombre del campo a evaluar
            primary_value (str): Valor del método principal
            secondary_value (str): Valor del método secundario
            primary_method (str): Método principal usado

        Returns:
            str: El mejor valor seleccionado (puede ser primary o secondary)

        Note:
            Heurísticas aplicadas:
            - Nombres: Prefiere valores más largos (más completos)
            - Fechas: Prefiere formato japonés (YYYY年MM月DD日)
            - Nacionalidad: Prefiere método EasyOCR
            - Números tarjeta: Valida con regex antes de seleccionar
            - Texto crudo: Combina ambos valores sin duplicados
        """
        # Para nombres, preferir el más largo y completo
        if 'name' in field:
            if len(secondary_value) > len(primary_value):
                return secondary_value
        
        # Para fechas, validar formato
        elif 'birthday' in field or 'date' in field:
            # Preferir formato japonés completo (YYYY年MM月DD日)
            if '年' in secondary_value and '月' in secondary_value and '日' in secondary_value:
                if '年' not in primary_value or '月' not in primary_value or '日' not in primary_value:
                    return secondary_value
        
        # Para nacionalidad, usar mapeo normalizado
        elif 'nationality' in field:
            # EasyOCR usualmente tiene mejor normalización para japonés
            if primary_method == 'azure' and secondary_value:
                return secondary_value
        
        # Para números de tarjeta, validar formato
        elif 'card_number' in field or 'license_number' in field:
            # Preferir el que coincida con el patrón esperado
            import re
            
            if field == 'zairyu_card_number':
                zairyu_pattern = r'[A-Z]{2}\s?\d{8}\s?[A-Z]{2}'
                if re.search(zairyu_pattern, secondary_value) and not re.search(zairyu_pattern, primary_value):
                    return secondary_value
        
        # Para texto crudo, combinar ambos
        elif field == 'raw_text':
            # Combinar textos únicos
            primary_lines = set(primary_value.split('\n'))
            secondary_lines = set(secondary_value.split('\n'))
            combined_lines = primary_lines.union(secondary_lines)
            return '\n'.join(sorted(combined_lines, key=len, reverse=True))
        
        # Por defecto, mantener el valor principal
        return primary_value
    
    def _secondary_method(self, primary_method: str) -> str:
        """Obtiene el nombre legible del método OCR secundario.

        Args:
            primary_method (str): Nombre del método principal

        Returns:
            str: Nombre descriptivo del método secundario:
                - "EasyOCR" si primary_method="azure"
                - "Azure OCR" si primary_method="easyocr"
                - "OCR secundario" en otros casos
        """
        if primary_method == "azure":
            return "EasyOCR"
        elif primary_method == "easyocr":
            return "Azure OCR"
        else:
            return "OCR secundario"


# Instancia global del servicio
hybrid_ocr_service = HybridOCRService()

__all__ = ["HybridOCRService", "hybrid_ocr_service"]