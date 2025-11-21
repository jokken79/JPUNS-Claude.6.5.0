"""
Timer Card OCR Service
Servicio especializado para procesamiento de timer cards (タイムカード)
"""
import re
import logging
from datetime import datetime
from typing import Dict, Any, List, Tuple, Optional
from io import BytesIO

from PIL import Image
import pdfplumber

from app.services.hybrid_ocr_service import hybrid_ocr_service
from app.models.models import Employee

logger = logging.getLogger(__name__)


class TimerCardOCRService:
    """Servicio para procesar PDFs de timer cards con OCR"""

    def __init__(self, db_session=None):
        """
        Initialize TimerCardOCRService.

        Args:
            db_session: Optional SQLAlchemy session for employee matching
        """
        self.ocr_service = hybrid_ocr_service
        self.db = db_session

    def process_pdf(self, pdf_bytes: bytes, factory_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Procesar PDF de timer card completo

        Args:
            pdf_bytes: Contenido del archivo PDF
            factory_id: ID de fábrica para matching de empleados

        Returns:
            Diccionario con registros extraídos y errores
        """
        try:
            # 1. Convertir PDF a imágenes
            images = self._pdf_to_images(pdf_bytes)
            logger.info(f"PDF convertido a {len(images)} páginas")

            # 2. Procesar cada página con OCR
            all_records = []
            processing_errors = []

            for page_num, image in enumerate(images, start=1):
                try:
                    # Convertir imagen PIL a bytes
                    image_bytes = self._pil_to_bytes(image)

                    # Procesar con Hybrid OCR
                    ocr_result = self.ocr_service.process_document_hybrid(
                        image_bytes,
                        document_type="timer_card",
                        preferred_method="auto"
                    )

                    if not ocr_result.get('success'):
                        processing_errors.append({
                            "page": page_num,
                            "error": ocr_result.get('error', 'OCR failed')
                        })
                        continue

                    # Extraer texto de la respuesta OCR (manejando diferentes estructuras)
                    raw_text = ""
                    if 'combined_data' in ocr_result:
                        # Hybrid OCR service returns combined_data
                        combined_data = ocr_result['combined_data']
                        if isinstance(combined_data, dict) and 'raw_text' in combined_data:
                            raw_text = combined_data['raw_text']
                        elif isinstance(combined_data, str):
                            raw_text = combined_data
                    elif 'raw_text' in ocr_result:
                        # Direct OCR service returns raw_text
                        raw_text = ocr_result['raw_text']

                    if not raw_text:
                        logger.warning(f"No se pudo extraer texto de página {page_num}")
                        processing_errors.append({
                            "page": page_num,
                            "error": "No text extracted from page"
                        })
                        continue

                    # Extraer registros de esta página
                    page_records = self._extract_timer_records(
                        raw_text,
                        page_num,
                        factory_id
                    )

                    all_records.extend(page_records)

                except Exception as e:
                    logger.error(f"Error procesando página {page_num}: {e}", exc_info=True)
                    processing_errors.append({
                        "page": page_num,
                        "error": str(e)
                    })

            return {
                "success": True,
                "pages_processed": len(images),
                "records_found": len(all_records),
                "records": all_records,
                "processing_errors": processing_errors
            }

        except Exception as e:
            logger.error(f"Error procesando PDF: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "records": []
            }

    def _pdf_to_images(self, pdf_bytes: bytes) -> List[Image.Image]:
        """Convertir PDF a lista de imágenes usando pdfplumber"""
        try:
            # Usar pdfplumber para extraer imágenes directamente
            images = []
            with pdfplumber.open(BytesIO(pdf_bytes)) as pdf:
                for page in pdf.pages:
                    # Convertir página a imagen
                    page_image = page.to_image(resolution=300)
                    pil_image = page_image.original
                    images.append(pil_image)

            logger.info(f"PDF convertido a {len(images)} imagen(es)")
            return images
        except Exception as e:
            logger.error(f"Error convirtiendo PDF con pdfplumber: {e}")
            # Fallback: intentar con pdf2image si está disponible
            try:
                logger.info("Intentando con pdf2image como fallback...")
                import pdf2image
                images = pdf2image.convert_from_bytes(
                    pdf_bytes,
                    dpi=300,
                    fmt='jpeg'
                )
                logger.info(f"PDF convertido exitosamente con pdf2image: {len(images)} imagen(es)")
                return images
            except Exception as e2:
                logger.error(f"Error con pdf2image: {e2}")
                raise Exception(f"No se pudo convertir PDF: {str(e)} | {str(e2)}")

    def _pil_to_bytes(self, image: Image.Image) -> bytes:
        """Convertir imagen PIL a bytes"""
        buffer = BytesIO()
        image.save(buffer, format='JPEG', quality=95)
        return buffer.getvalue()

    def _extract_timer_records(self, raw_text: str, page_number: int,
                              factory_id: Optional[str]) -> List[Dict[str, Any]]:
        """
        Extraer registros de timer card de texto OCR
        """
        records = []

        try:
            # 1. Extraer año y mes del documento
            year, month = self._extract_document_date(raw_text)

            # 2. Extraer nombre de empleado
            employee_name = self._extract_employee_name(raw_text)

            # 3. Extraer registros diarios
            daily_records = self._extract_daily_records(raw_text, year, month)

            # 4. Para cada registro, agregar metadatos y validar
            for record in daily_records:
                record.update({
                    "page_number": page_number,
                    "employee_name_ocr": employee_name,
                    "factory_id": factory_id
                })

                # Validar registro
                validation_errors = self._validate_timer_record(record)
                record["validation_errors"] = validation_errors

                # Intentar match de empleado (si factory_id disponible)
                if factory_id:
                    employee_match = self._match_employee(employee_name, factory_id)
                    record["employee_matched"] = employee_match

                records.append(record)

            logger.info(f"Página {page_number}: extraídos {len(records)} registros")

        except Exception as e:
            logger.error(f"Error extrayendo registros de página {page_number}: {e}")

        return records

    def _extract_document_date(self, raw_text: str) -> Tuple[int, int]:
        """Extrae año y mes del documento"""
        # Mapeo de meses en inglés a números
        month_names = {
            'january': 1, 'jan': 1,
            'february': 2, 'feb': 2,
            'march': 3, 'mar': 3,
            'april': 4, 'apr': 4,
            'may': 5,
            'june': 6, 'jun': 6,
            'july': 7, 'jul': 7,
            'august': 8, 'aug': 8,
            'september': 9, 'sep': 9, 'sept': 9,
            'october': 10, 'oct': 10,
            'november': 11, 'nov': 11,
            'december': 12, 'dec': 12,
        }

        # Buscar patrón "Month YYYY" o "Month YYYY"
        month_year_pattern = r'(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{4})'
        match = re.search(month_year_pattern, raw_text, re.IGNORECASE)
        if match:
            month_name = match.group(1).lower()
            year = int(match.group(2))
            if month_name in month_names and 2020 <= year <= 2030:
                return (year, month_names[month_name])

        month_year_patterns = [
            r'(\d{4})年(\d{1,2})月',          # 2025年10月
            r'(\d{4})[/\-\.](\d{1,2})',       # 2025/10 or 2025-10
            r'(\d{1,2})月度.*(\d{4})年?',      # 10月度 2025年
            r'(\d{1,2})月分.*(\d{4})年?',      # 10月分 2025年
        ]

        for pattern in month_year_patterns:
            match = re.search(pattern, raw_text)
            if match:
                groups = match.groups()
                if len(groups) == 2:
                    # Si el primer grupo tiene 4 dígitos, es el año
                    if len(groups[0]) == 4:
                        year = int(groups[0])
                        month = int(groups[1])
                    else:
                        # Primer grupo es mes, segundo es año
                        month = int(groups[0])
                        year = int(groups[1])

                    if 2020 <= year <= 2030 and 1 <= month <= 12:
                        return (year, month)

        # Fallback a mes/año actual si no se encuentra
        now = datetime.now()
        logger.warning(f"No se pudo extraer fecha del documento, usando actual: {now.year}-{now.month}")
        return (now.year, now.month)

    def _extract_employee_name(self, raw_text: str) -> str:
        """Extrae nombre del empleado"""
        name_patterns = [
            r'氏名[：:\s]*([^\n]+)',
            r'社員名[：:\s]*([^\n]+)',
            r'名前[：:\s]*([^\n]+)',
            r'社員[：:\s]*([^\n]+)',
            r'Employee[：:\s]*([^\n]+)',
            r'Name[：:\s]*([^\n]+)',
        ]

        # Primero buscar patrones con etiquetas
        for pattern in name_patterns:
            match = re.search(pattern, raw_text)
            if match:
                name = match.group(1).strip()
                # Limpiar números de empleado
                name = re.sub(r'\d{4,}', '', name).strip()
                # Limpiar todo después de ID
                name = re.sub(r'\s*(ID[：:].*)?$', '', name, flags=re.IGNORECASE).strip()
                # Limpiar símbolos de separación
                name = re.sub(r'[：:|｜]', '', name).strip()
                if len(name) >= 2:
                    return name

        # Si no se encuentra con etiqueta, buscar nombres japoneses o ingleses simples
        # Patrón para nombres japoneses: 姓 名 (espacios o kana)
        japanese_name_pattern = r'([ァ-ヶー一-龯]{2,4})\s+([ァ-ヶー一-龯]{2,4})'
        match = re.search(japanese_name_pattern, raw_text)
        if match:
            name = f"{match.group(1)}{match.group(2)}"
            return name

        # Patrón para nombres japoneses sin espacio: 田中太郎
        japanese_compound_pattern = r'\b([ァ-ヶー一-龯]{2,4})(田中|山田|佐藤|鈴木|高橋|伊藤|渡辺|山本|中村|小林|[ァ-ヶー一-龯]{2,4})\b'
        match = re.search(japanese_compound_pattern, raw_text)
        if match:
            # Ya está combinado, retornar tal como está
            return match.group(0)

        # Patrón para nombres en inglés: First Last
        english_name_pattern = r'\b([A-Z][a-z]+)\s+([A-Z][a-z]+)\b'
        match = re.search(english_name_pattern, raw_text)
        if match:
            return f"{match.group(1)} {match.group(2)}"

        # Buscar cualquier cadena de kanji que parezca un nombre
        kanji_pattern = r'\b[ァ-ヶー一-龯]{3,6}\b'
        match = re.search(kanji_pattern, raw_text)
        if match:
            return match.group(0)

        return "不明"  # "Desconocido" si no se encuentra

    def _parse_time(self, time_str: str) -> str:
        """Parsea tiempo en diferentes formatos a HH:MM"""
        if not time_str:
            return ""

        # Limpiar la cadena
        time_str = time_str.strip().upper()

        # Remover AM/PM si existe
        time_str = re.sub(r'\s*(AM|PM)$', '', time_str, flags=re.IGNORECASE)

        # Patrones para diferentes formatos
        patterns = [
            r'(\d{1,2}):(\d{2})',  # 8:00, 22:30
            r'(\d{1,2})時(\d{1,2})分',  # 8時00分, 22時30分
            r'(\d{1,2})(\d{2})',  # 800, 2230
        ]

        for pattern in patterns:
            match = re.search(pattern, time_str)
            if match:
                if len(match.groups()) == 2:
                    hour = int(match.group(1))
                    minute = int(match.group(2))
                else:
                    # Para formato 4 dígitos sin separador
                    time_clean = match.group(1)
                    hour = int(time_clean[:len(time_clean)//2])
                    minute = int(time_clean[len(time_clean)//2:])

                # Validar rango
                if 0 <= hour <= 23 and 0 <= minute <= 59:
                    return f"{hour:02d}:{minute:02d}"

        return time_str  # Return original if can't parse

    def _extract_daily_records(self, raw_text: str, year: int, month: int) -> List[Dict]:
        """Extrae registros diarios del timer card"""
        records = []

        # Patrones para diferentes formatos
        table_patterns = [
            # Formato: 10/15     08:00      17:00      60分
            r'(\d{1,2})/(\d{1,2})\s+(\d{1,2}):(\d{2})\s+(\d{1,2}):(\d{2})\s+(\d+)分?',

            # Formato: 15 | 月 | 8:00 | 17:00 | 60
            r'(\d{1,2})\s*\|\s*[月火水木金土日]\s*\|\s*(\d{1,2}):(\d{2})\s*\|\s*(\d{1,2}):(\d{2})\s*\|\s*(\d+)',

            # Formato: 15日 8:00-17:00 休憩60分
            r'(\d{1,2})日.*?(\d{1,2}):(\d{2})[^\d]*(\d{1,2}):(\d{2}).*?(\d+)分',

            # Formato B: 10/01  通常       08:00      17:00      01:00
            r'(\d{1,2})/(\d{1,2})\s+[^\d]+\s+(\d{1,2}):(\d{2})\s+(\d{1,2}):(\d{2})\s+(\d{1,2}):(\d{2})',
        ]

        for pattern in table_patterns:
            matches = re.finditer(pattern, raw_text)
            for match in matches:
                try:
                    groups = match.groups()
                    num_groups = len(groups)

                    if num_groups == 8:
                        # Formato B: 10/01  通常       08:00      17:00      01:00
                        day = int(groups[1])
                        clock_in_h, clock_in_m = int(groups[2]), int(groups[3])
                        clock_out_h, clock_out_m = int(groups[4]), int(groups[5])
                        break_h, break_m = int(groups[6]), int(groups[7])
                        break_min = break_h * 60 + break_m
                    elif num_groups == 7:
                        # Formato estándar con minutos
                        day = int(groups[1])
                        clock_in_h, clock_in_m = int(groups[2]), int(groups[3])
                        clock_out_h, clock_out_m = int(groups[4]), int(groups[5])
                        break_min = int(groups[6])
                    elif num_groups == 6:
                        # Formato con | o día日
                        day = int(groups[0])
                        clock_in_h, clock_in_m = int(groups[1]), int(groups[2])
                        clock_out_h, clock_out_m = int(groups[3]), int(groups[4])
                        break_min = int(groups[5])
                    else:
                        continue

                    # Validar día
                    if not (1 <= day <= 31):
                        continue

                    # Validar horas
                    if not (0 <= clock_in_h <= 23 and 0 <= clock_in_m <= 59):
                        continue
                    if not (0 <= clock_out_h <= 23 and 0 <= clock_out_m <= 59):
                        continue

                    # Crear fecha completa
                    work_date = f"{year}-{month:02d}-{day:02d}"

                    # Detectar turno nocturno
                    is_night_shift = False
                    if clock_out_h < clock_in_h or (clock_in_h >= 20 and clock_out_h <= 8):
                        is_night_shift = True

                    record = {
                        "work_date": work_date,
                        "clock_in": f"{clock_in_h:02d}:{clock_in_m:02d}",
                        "clock_out": f"{clock_out_h:02d}:{clock_out_m:02d}",
                        "break_minutes": break_min,
                        "is_night_shift": is_night_shift
                    }

                    records.append(record)

                except (ValueError, IndexError) as e:
                    logger.debug(f"Línea ignorada (no es registro válido): {match.group(0)}")
                    continue

        return records

    def _validate_timer_record(self, record: Dict) -> List[str]:
        """Valida un registro de timer card"""
        errors = []

        # Validar fecha
        try:
            work_date = datetime.strptime(record['work_date'], '%Y-%m-%d').date()
            if work_date > datetime.now().date():
                errors.append("Fecha en el futuro")
        except ValueError:
            errors.append("Fecha inválida")

        # Validar horas
        try:
            clock_in = datetime.strptime(record['clock_in'], '%H:%M').time()
            clock_out = datetime.strptime(record['clock_out'], '%H:%M').time()

            # Permitir turnos nocturnos (22:00-06:00)
            if clock_out <= clock_in:
                if not (clock_in.hour >= 20 and clock_out.hour <= 8):
                    errors.append("Hora de salida debe ser posterior a hora de entrada")
        except ValueError:
            errors.append("Formato de hora inválido")

        # Validar minutos de descanso
        break_minutes = record.get('break_minutes', 0)
        if break_minutes < 0:
            errors.append("Minutos de descanso no puede ser negativo")
        elif break_minutes > 180:
            errors.append("Minutos de descanso fuera de rango (máximo 180 minutos)")
        elif break_minutes > 120:
            errors.append("Minutos de descanso excesivo (máximo 120 minutos)")

        return errors

    def _normalize_factory_id(self, factory_id: str) -> str:
        """
        Normalizar 派遣先ID para matching correcto
        - Remover leading zeros de compañías específicas (ej: コーリツ)
        - Estandarizar formato

        Args:
            factory_id: ID de fábrica del timer card

        Returns:
            ID normalizado para matching
        """
        if not factory_id:
            return factory_id

        # Remover espacios y convertir a string
        normalized = str(factory_id).strip()

        # Si empieza con 0 y parece ser un ID numérico, remover todos los leading zeros
        # (específicamente para コーリツ y otras empresas que añaden 0 padding)
        if normalized.startswith('0') and len(normalized) > 1:
            # Verificar que después de los ceros hay números
            if normalized[1:].isdigit():
                # Remover todos los leading zeros
                normalized = normalized.lstrip('0')
                # Si queda vacío, usar '0' (caso de "0000")
                if not normalized:
                    normalized = '0'

        return normalized

    def _match_employee(self, employee_name: str, factory_id: str) -> Optional[Dict]:
        """
        Buscar empleado por nombre en la fábrica especificada usando fuzzy matching.

        Args:
            employee_name: Nombre extraído del OCR
            factory_id: ID de la fábrica para filtrar empleados

        Returns:
            Dict con hakenmoto_id, full_name_kanji, confidence, o None si no hay DB
        """
        # Si no hay factory_id, no se puede hacer matching
        if not factory_id:
            return None

        # Normalizar factory_id para matching correcto
        normalized_factory_id = self._normalize_factory_id(factory_id)

        # Si no hay sesión de base de datos, retornar placeholder
        if not self.db:
            logger.warning("No database session available for employee matching")
            return {
                "hakenmoto_id": None,
                "full_name_kanji": employee_name,
                "factory_id_original": factory_id,
                "factory_id_normalized": normalized_factory_id,
                "confidence": 0.0
            }

        # Importar difflib para fuzzy matching
        from difflib import SequenceMatcher

        try:
            # Query employees (filter by factory if provided)
            query = self.db.query(Employee).filter(Employee.deleted_at.is_(None))

            # Filter by normalized factory_id
            if normalized_factory_id:
                query = query.filter(Employee.factory_id == normalized_factory_id)

            employees = query.all()

            if not employees:
                logger.warning(f"No employees found for factory_id: {normalized_factory_id}")
                return {
                    "hakenmoto_id": None,
                    "full_name_kanji": employee_name,
                    "factory_id_original": factory_id,
                    "factory_id_normalized": normalized_factory_id,
                    "confidence": 0.0
                }

            # Find best match using fuzzy matching
            best_match = None
            best_score = 0

            for emp in employees:
                # Try matching with kanji, kana, and romaji names
                names_to_try = [
                    emp.full_name_kanji or "",
                    emp.full_name_kana or "",
                    emp.full_name_roman or ""
                ]

                for name in names_to_try:
                    if not name:
                        continue

                    # Calculate similarity ratio (0.0 to 1.0)
                    ratio = SequenceMatcher(None, employee_name, name).ratio()
                    score = ratio * 100  # Convert to percentage

                    if score > best_score and score >= 70:  # Minimum 70% confidence
                        best_score = score
                        best_match = {
                            'hakenmoto_id': emp.id,
                            'full_name_kanji': emp.full_name_kanji,
                            'full_name_kana': emp.full_name_kana,
                            'full_name_roman': emp.full_name_roman,
                            'factory_id_original': factory_id,
                            'factory_id_normalized': normalized_factory_id,
                            'confidence': round(score / 100.0, 2)  # Return as 0.0-1.0
                        }

            if best_match:
                logger.info(f"Employee matched: {best_match['full_name_kanji']} with confidence {best_match['confidence']}")
                return best_match
            else:
                logger.warning(f"No employee match found for name: {employee_name} in factory: {normalized_factory_id}")
                return {
                    "hakenmoto_id": None,
                    "full_name_kanji": employee_name,
                    "factory_id_original": factory_id,
                    "factory_id_normalized": normalized_factory_id,
                    "confidence": 0.0
                }

        except Exception as e:
            logger.error(f"Error matching employee: {e}", exc_info=True)
            return {
                "hakenmoto_id": None,
                "full_name_kanji": employee_name,
                "factory_id_original": factory_id,
                "factory_id_normalized": normalized_factory_id,
                "confidence": 0.0,
                "error": str(e)
            }


# Instancia singleton
timer_card_ocr_service = TimerCardOCRService()

__all__ = ["TimerCardOCRService", "timer_card_ocr_service"]
