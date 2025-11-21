"""
Face Detection Service - UNS-ClaudeJP 3.0
Servicio especializado para detección y extracción de rostros de documentos
"""
import os
import logging
import base64
from typing import Optional, Tuple, List
from io import BytesIO
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

# Importaciones condicionales para manejar dependencias opcionales
try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    cv2 = None

try:
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    MEDIAPIPE_AVAILABLE = False
    mp = None

logger = logging.getLogger(__name__)


class FaceDetectionService:
    """Servicio especializado para detección facial con múltiples métodos"""
    
    def __init__(self):
        self.cascade_loaded = False
        self.mediapipe_available = False
        self.face_cascade = None
        
        # Inicializar métodos disponibles
        self._init_opencv_cascade()
        self._init_mediapipe()
        
        logger.info(f"FaceDetectionService inicializado - Cascade: {self.cascade_loaded}, MediaPipe: {self.mediapipe_available}")
    
    def _init_opencv_cascade(self):
        """Inicializar Haar Cascade de OpenCV"""
        if not CV2_AVAILABLE or cv2 is None:
            logger.warning("OpenCV no disponible para detección facial")
            return
            
        try:
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            if os.path.exists(cascade_path):
                self.face_cascade = cv2.CascadeClassifier(cascade_path)
                self.cascade_loaded = True
                logger.info("Haar Cascade inicializado correctamente")
            else:
                logger.warning(f"Haar Cascade no encontrado en: {cascade_path}")
                
        except Exception as e:
            logger.error(f"Error inicializando Haar Cascade: {e}")
    
    def _init_mediapipe(self):
        """Inicializar MediaPipe para detección facial más robusta"""
        if not MEDIAPIPE_AVAILABLE or mp is None:
            logger.info("MediaPipe no disponible - se usará Haar Cascade como fallback")
            return
            
        try:
            self.mp_face_detection = mp.solutions.face_detection
            self.mp_drawing = mp.solutions.drawing_utils
            self.mediapipe_available = True
            logger.info("MediaPipe inicializado correctamente")
            
        except Exception as e:
            logger.error(f"Error inicializando MediaPipe: {e}")
    
    def preprocess_image(self, image: Image.Image) -> Image.Image:
        """Preprocesar imagen para mejorar detección facial"""
        try:
            # Convertir a RGB si no lo está
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Mejorar contraste
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(1.2)
            
            # Mejorar nitidez
            enhancer = ImageEnhance.Sharpness(image)
            image = enhancer.enhance(1.1)
            
            # Reducir ruido
            image = image.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))
            
            return image
            
        except Exception as e:
            logger.error(f"Error en preprocesamiento: {e}")
            return image
    
    def detect_face_mediapipe(self, image_array: np.ndarray) -> Optional[Tuple[int, int, int, int]]:
        """Detectar rostro usando MediaPipe - más robusto"""
        if not self.mediapipe_available or not CV2_AVAILABLE or cv2 is None:
            return None
            
        try:
            # Convertir BGR a RGB para MediaPipe
            rgb_image = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
            
            with self.mp_face_detection.FaceDetection(
                model_selection=1,  # 0=short-range, 1=full-range
                min_detection_confidence=0.5
            ) as face_detection:
                
                results = face_detection.process(rgb_image)
                
                if results.detections:
                    # Tomar la detección más grande
                    detection = max(results.detections, key=lambda d: d.location_data.relative_bounding_box.width)
                    
                    h, w = image_array.shape[:2]
                    bbox = detection.location_data.relative_bounding_box
                    
                    # Convertir coordenadas relativas a absolutas
                    x = int(bbox.xmin * w)
                    y = int(bbox.ymin * h)
                    width = int(bbox.width * w)
                    height = int(bbox.height * h)
                    
                    logger.info(f"MediaPipe detectó rostro: x={x}, y={y}, w={width}, h={height}")
                    return (x, y, width, height)
                    
        except Exception as e:
            logger.error(f"Error con MediaPipe: {e}")
            
        return None
    
    def detect_face_opencv(self, gray_image: np.ndarray) -> Optional[Tuple[int, int, int, int]]:
        """Detectar rostro usando OpenCV Haar Cascade"""
        if not self.cascade_loaded or self.face_cascade is None:
            return None
            
        try:
            # Múltiples escalas para mejor detección
            scales = [1.1, 1.2, 1.3]
            min_neighbors_values = [3, 4, 5]
            
            all_faces = []
            
            for scale in scales:
                for min_neighbors in min_neighbors_values:
                    faces = self.face_cascade.detectMultiScale(
                        gray_image,
                        scaleFactor=scale,
                        minNeighbors=min_neighbors,
                        minSize=(80, 80),
                        maxSize=(400, 400)
                    )
                    
                    if len(faces) > 0:
                        all_faces.extend(list(faces))
            
            if all_faces:
                # Seleccionar el rostro más grande
                faces_array = np.array(all_faces)
                areas = faces_array[:, 2] * faces_array[:, 3]
                largest_idx = np.argmax(areas)
                x, y, w, h = faces_array[largest_idx].astype(int)
                
                logger.info(f"OpenCV detectó rostro: x={x}, y={y}, w={w}, h={h}")
                return (x, y, w, h)
                
        except Exception as e:
            logger.error(f"Error con OpenCV: {e}")
            
        return None
    
    def detect_face_contour_based(self, image_array: np.ndarray) -> Optional[Tuple[int, int, int, int]]:
        """Método alternativo basado en contornos y características faciales"""
        if not CV2_AVAILABLE or cv2 is None:
            return None
            
        try:
            gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
            
            # Ecualización de histograma para mejorar contraste
            equalized = cv2.equalizeHist(gray)
            
            # Detección de bordes
            edges = cv2.Canny(equalized, 50, 150)
            
            # Operaciones morfológicas
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
            closed = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)
            
            # Encontrar contornos
            contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # Filtrar contornos que podrían ser rostros
            height, width = gray.shape
            face_candidates = []
            
            for contour in contours:
                x, y, w, h = cv2.boundingRect(contour)
                area = cv2.contourArea(contour)
                aspect_ratio = w / h
                
                # Criterios para rostro
                if (area > 5000 and  # área mínima
                    aspect_ratio > 0.7 and aspect_ratio < 1.5 and  # proporción facial
                    w > 80 and h > 80 and  # tamaño mínimo
                    w < width * 0.6 and h < height * 0.6):  # no demasiado grande
                    
                    face_candidates.append((x, y, w, h, area))
            
            if face_candidates:
                # Seleccionar el candidato más grande
                face_candidates.sort(key=lambda x: x[4], reverse=True)
                x, y, w, h, _ = face_candidates[0]
                
                logger.info(f"Contour-based detectó rostro: x={x}, y={y}, w={w}, h={h}")
                return (x, y, w, h)
                
        except Exception as e:
            logger.error(f"Error con contour-based: {e}")
            
        return None
    
    def validate_face_region(self, image_array: np.ndarray, face_region: np.ndarray) -> bool:
        """Validar si la región detectada realmente contiene un rostro"""
        try:
            if face_region.size == 0:
                return False
                
            # Verificar proporciones
            h, w = face_region.shape[:2]
            aspect_ratio = w / h
            
            if aspect_ratio < 0.6 or aspect_ratio > 2.0:
                logger.warning(f"Proporción facial inusual: {aspect_ratio}")
                return False
            
            # Verificar tamaño mínimo
            if w < 80 or h < 100:
                logger.warning(f"Rostro demasiado pequeño: {w}x{h}")
                return False
            
            # Verificar contenido (no debe ser completamente blanco o negro)
            mean_intensity = np.mean(face_region)
            if mean_intensity < 30 or mean_intensity > 225:
                logger.warning(f"Intensidad atípica: {mean_intensity}")
                return False
            
            # Verificar variación de color (rostro debe tener variación)
            std_intensity = np.std(face_region)
            if std_intensity < 10:
                logger.warning(f"Baja variación de color: {std_intensity}")
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error validando rostro: {e}")
            return False
    
    def extract_face_with_padding(self, image_array: np.ndarray, face_coords: Tuple[int, int, int, int], 
                                padding_percent: float = 0.3) -> np.ndarray:
        """Extraer rostro con padding proporcional"""
        try:
            x, y, w, h = face_coords
            
            # Calcular padding
            padding_y = int(h * padding_percent)
            padding_x = int(w * padding_percent)
            
            # Aplicar padding manteniéndose dentro de los límites
            height, width = image_array.shape[:2]
            
            y1 = max(0, y - padding_y)
            y2 = min(height, y + h + padding_y)
            x1 = max(0, x - padding_x)
            x2 = min(width, x + w + padding_x)
            
            face_region = image_array[y1:y2, x1:x2]
            
            logger.info(f"Rostro extraído con padding: original=({x},{y},{w},{h}) -> final=({x1},{y1},{y2-x1},{y2-y1})")
            
            return face_region
            
        except Exception as e:
            logger.error(f"Error extrayendo rostro con padding: {e}")
            return np.array([])
    
    def extract_face_from_document(self, image_data: bytes, document_type: str = "zairyu_card") -> Optional[str]:
        """
        Extraer rostro de documento usando múltiples métodos de detección
        
        Args:
            image_data: Bytes de la imagen
            document_type: Tipo de documento para coordenadas fijas como fallback
            
        Returns:
            String base64 de la imagen del rostro o None
        """
        try:
            # Cargar imagen
            image = Image.open(BytesIO(image_data)).convert("RGB")
            image = self.preprocess_image(image)
            img_array = np.array(image)
            
            logger.info(f"Procesando imagen de tamaño: {img_array.shape}")
            
            # Método 1: MediaPipe (más robusto)
            face_coords = self.detect_face_mediapipe(img_array)
            
            # Método 2: OpenCV Haar Cascade (fallback)
            if face_coords is None and CV2_AVAILABLE and cv2 is not None:
                gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
                face_coords = self.detect_face_opencv(gray)
            
            # Método 3: Basado en contornos (fallback)
            if face_coords is None:
                face_coords = self.detect_face_contour_based(img_array)
            
            # Método 4: Coordenadas fijas (último fallback)
            if face_coords is None:
                logger.warning("No se detectó rostro automáticamente, usando coordenadas fijas")
                face_region = self._extract_with_fixed_coordinates(img_array, document_type)
            else:
                # Extraer rostro detectado con padding
                face_region = self.extract_face_with_padding(img_array, face_coords)
                
                # Validar calidad del rostro
                if not self.validate_face_region(img_array, face_region):
                    logger.warning("Rostro detectado no pasó validación, usando coordenadas fijas")
                    face_region = self._extract_with_fixed_coordinates(img_array, document_type)
            
            if face_region.size == 0:
                logger.error("No se pudo extraer región facial")
                return None
            
            # Redimensionar a tamaño estándar
            face_image = Image.fromarray(face_region)
            face_image = self._resize_face_portrait(face_image)
            
            # Convertir a base64
            buffered = BytesIO()
            face_image.save(buffered, format="JPEG", quality=95)
            base64_image = base64.b64encode(buffered.getvalue()).decode('utf-8')
            
            result = f"data:image/jpeg;base64,{base64_image}"
            logger.info(f"Rostro extraído exitosamente: {len(result)} caracteres")
            
            return result
            
        except Exception as e:
            logger.error(f"Error extrayendo rostro: {e}", exc_info=True)
            return None
    
    def _extract_with_fixed_coordinates(self, img_array: np.ndarray, document_type: str) -> np.ndarray:
        """Extraer rostro usando coordenadas fijas mejoradas"""
        try:
            height, width = img_array.shape[:2]
            
            if document_type == "zairyu_card":
                # Coordenadas mejoradas para tarjeta de residencia
                y1 = int(height * 0.12)
                y2 = int(height * 0.65)
                x1 = int(width * 0.68)
                x2 = int(width * 0.96)
                
            elif document_type == "license":
                # Coordenadas para licencia de conducir
                y1 = int(height * 0.18)
                y2 = int(height * 0.80)
                x1 = int(width * 0.02)
                x2 = int(width * 0.38)
                
            else:
                # Coordenadas genéricas
                y1 = int(height * 0.15)
                y2 = int(height * 0.70)
                x1 = int(width * 0.60)
                x2 = int(width * 0.95)
            
            face_region = img_array[max(0, y1):min(height, y2), max(0, x1):min(width, x2)]
            logger.info(f"Coordenadas fijas usadas: y={y1}-{y2}, x={x1}-{x2}")
            
            return face_region
            
        except Exception as e:
            logger.error(f"Error con coordenadas fijas: {e}")
            return np.array([])
    
    def _resize_face_portrait(self, face_image: Image.Image, target_width: int = 300, target_height: int = 400) -> Image.Image:
        """Redimensionar rostro a proporción de retrato estándar"""
        try:
            # Mantener proporción facial
            current_width, current_height = face_image.size
            aspect_ratio = current_width / current_height
            target_aspect = target_width / target_height
            
            if aspect_ratio > target_aspect:
                # Más ancho de lo normal - recortar laterales
                new_width = int(current_height * target_aspect)
                left = (current_width - new_width) // 2
                face_image = face_image.crop((left, 0, left + new_width, current_height))
            else:
                # Más alto de lo normal - recortar arriba/abajo
                new_height = int(current_width / target_aspect)
                top = (current_height - new_height) // 2
                face_image = face_image.crop((0, top, current_width, top + new_height))
            
            # Redimensionar al tamaño objetivo
            face_image = face_image.resize((target_width, target_height), Image.Resampling.LANCZOS)
            
            logger.info(f"Rostro redimensionado a {target_width}x{target_height}")
            return face_image
            
        except Exception as e:
            logger.error(f"Error redimensionando rostro: {e}")
            return face_image.resize((target_width, target_height), Image.Resampling.LANCZOS)


# Instancia global del servicio
face_detection_service = FaceDetectionService()

__all__ = ["FaceDetectionService", "face_detection_service"]