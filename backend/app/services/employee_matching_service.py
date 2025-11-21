"""
Employee Matching Service
Servicio para matching de empleados con fuzzy search usando rapidfuzz
"""
import re
import logging
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_
from rapidfuzz import fuzz, process

from app.models.models import Employee, ContractWorker, Staff

logger = logging.getLogger(__name__)


class EmployeeMatchingService:
    """
    Servicio para encontrar empleados usando fuzzy matching
    Maneja nombres japoneses con kanji/katakana y variaciones
    """

    # Threshold mínimo de confianza (70%)
    MIN_CONFIDENCE_THRESHOLD = 70

    def __init__(self, db_session: Optional[Session] = None):
        """
        Inicializar servicio con sesión de BD opcional

        Args:
            db_session: Sesión SQLAlchemy para queries
        """
        self.db_session = db_session

    def set_db_session(self, db_session: Session):
        """Establecer sesión de BD después de inicialización"""
        self.db_session = db_session

    def match_employee_by_name(
        self,
        employee_name: str,
        factory_id: str,
        threshold: Optional[float] = None
    ) -> Optional[Dict]:
        """
        Buscar empleado por nombre en una fábrica usando fuzzy matching

        Args:
            employee_name: Nombre extraído del OCR
            factory_id: ID de la fábrica (ej: COMPANY__PLANT)
            threshold: Threshold de confianza (0-100), por defecto MIN_CONFIDENCE_THRESHOLD

        Returns:
            Dict con:
                - hakenmoto_id: ID del empleado
                - full_name_kanji: Nombre completo en kanji
                - confidence: Score de confianza (0.0-1.0)
                - matched_name: Nombre usado para el match
            None si no se encuentra match
        """
        if not self.db_session:
            logger.error("No hay sesión de BD disponible para employee matching")
            return None

        if not employee_name or not factory_id:
            logger.warning(f"Nombre o factory_id faltante: name={employee_name}, factory={factory_id}")
            return None

        try:
            # 1. Obtener empleados de la fábrica
            factory_employees = self._get_factory_employees(factory_id)
            if not factory_employees:
                logger.info(f"No hay empleados en factory {factory_id}")
                return None

            # 2. Normalizar nombre del OCR
            normalized_ocr_name = self._normalize_japanese_name(employee_name)

            # 3. Crear lista de nombres para matching
            employee_names = []
            for emp in factory_employees:
                # Usar tanto kanji como kana
                names_to_match = []
                if emp.get('full_name_kanji'):
                    names_to_match.append(emp['full_name_kanji'])
                if emp.get('full_name_kana'):
                    names_to_match.append(emp['full_name_kana'])

                # Agregar variaciones
                for name in names_to_match:
                    variations = self._generate_name_variations(name)
                    for var in variations:
                        employee_names.append({
                            'original': name,
                            'variation': var,
                            'employee': emp
                        })

            # 4. Realizar fuzzy matching
            best_match = self._find_best_match(normalized_ocr_name, employee_names, threshold)

            if best_match:
                logger.info(
                    f"Match encontrado: '{employee_name}' -> '{best_match['employee']['full_name_kanji']}' "
                    f"(confidence: {best_match['confidence']:.2f})"
                )
                return {
                    "hakenmoto_id": best_match['employee']['hakenmoto_id'],
                    "full_name_kanji": best_match['employee']['full_name_kanji'],
                    "confidence": best_match['confidence'] / 100.0,  # Convertir a 0.0-1.0
                    "matched_name": best_match['employee']['full_name_kanji']
                }
            else:
                logger.info(
                    f"No se encontró match para '{employee_name}' en factory {factory_id} "
                    f"(threshold: {threshold or self.MIN_CONFIDENCE_THRESHOLD}%)"
                )
                return None

        except Exception as e:
            logger.error(f"Error en employee matching: {e}", exc_info=True)
            return None

    def _get_factory_employees(self, factory_id: str) -> List[Dict]:
        """
        Obtener lista de empleados de una fábrica desde las 3 tablas

        Args:
            factory_id: ID de la fábrica

        Returns:
            Lista de diccionarios con datos del empleado
        """
        try:
            # 1. Obtener empleados de la tabla Employee
            employees = (
                self.db_session.query(Employee)
                .filter(Employee.factory_id == factory_id)
                .all()
            )

            # 2. Obtener trabajadores por contrato de la tabla ContractWorker
            contract_workers = (
                self.db_session.query(ContractWorker)
                .filter(ContractWorker.factory_id == factory_id)
                .all()
            )

            # 3. Staff no tiene factory_id, así que no los incluimos aquí
            # (Staff trabaja en oficinas, no en fábricas específicas)

            # Combinar resultados
            result = []

            # Agregar empleados regulares
            for emp in employees:
                result.append({
                    'hakenmoto_id': emp.hakenmoto_id,
                    'full_name_kanji': emp.full_name_kanji,
                    'full_name_kana': emp.full_name_kana,
                    'factory_id': emp.factory_id
                })

            # Agregar trabajadores por contrato
            for worker in contract_workers:
                result.append({
                    'hakenmoto_id': worker.hakenmoto_id,
                    'full_name_kanji': worker.full_name_kanji,
                    'full_name_kana': worker.full_name_kana,
                    'factory_id': worker.factory_id
                })

            return result

        except Exception as e:
            logger.error(f"Error obteniendo empleados de factory {factory_id}: {e}")
            return []

    def _normalize_japanese_name(self, name: str) -> str:
        """
        Normalizar nombre para matching

        - Remover espacios extra
        - Remover caracteres especiales
        - Convertir a half-width si es necesario
        - Mantener kanji y katakana intactos

        Args:
            name: Nombre a normalizar

        Returns:
            Nombre normalizado
        """
        if not name:
            return ""

        # Remover espacios al inicio y final
        normalized = name.strip()

        # Remover caracteres especiales comunes de OCR
        normalized = re.sub(r'[：:｜|]', '', normalized)

        # Remover números de empleado (4+ dígitos)
        normalized = re.sub(r'\d{4,}', '', normalized)

        # Normalizar espacios (múltiples -> uno solo)
        normalized = re.sub(r'\s+', ' ', normalized)

        # Remover espacios entre caracteres kanji (común en OCR)
        # ej: "山 田" -> "山田"
        normalized = re.sub(r'([ァ-ヺー])\s+([ァ-ヺー])', r'\1\2', normalized)  # katakana
        normalized = re.sub(r'([一-龯])\s+([一-龯])', r'\1\2', normalized)  # kanji

        return normalized.strip()

    def _generate_name_variations(self, name: str) -> List[str]:
        """
        Generar variaciones de un nombre para matching

        Args:
            name: Nombre original (kanji o kana)

        Returns:
            Lista de variaciones del nombre
        """
        if not name:
            return []

        variations = [name]

        # 1. Sin espacios
        no_spaces = re.sub(r'\s+', '', name)
        if no_spaces != name:
            variations.append(no_spaces)

        # 2. Con espacios (entre caracteres kanji/katakana)
        # Ej: "山田太郎" -> "山田 太郎"
        spaced = re.sub(r'([一-龯])([一-龯])', r'\1 \2', name)
        if spaced != name:
            variations.append(spaced)

        # 3. Solo caracteres sin puntuación
        clean = re.sub(r'[・‐‐―‑–—―]', '', name)
        if clean != name:
            variations.append(clean)

        # 4. Versión en half-width de espacios si es necesario
        # (En general no necesario para matching)

        # Remover duplicados manteniendo orden
        unique_variations = []
        for var in variations:
            if var not in unique_variations:
                unique_variations.append(var)

        return unique_variations

    def _find_best_match(
        self,
        ocr_name: str,
        employee_names: List[Dict],
        threshold: Optional[float] = None
    ) -> Optional[Dict]:
        """
        Encontrar el mejor match usando rapidfuzz

        Args:
            ocr_name: Nombre normalizado del OCR
            employee_names: Lista de nombres de empleados con sus variaciones
            threshold: Threshold mínimo de confianza

        Returns:
            Mejor match o None
        """
        if not ocr_name or not employee_names:
            return None

        threshold = threshold or self.MIN_CONFIDENCE_THRESHOLD

        # Preparar listas para rapidfuzz
        names_to_match = [item['variation'] for item in employee_names]

        # Usar rapidfuzz para encontrar el mejor match
        best_match = process.extractOne(
            ocr_name,
            names_to_match,
            scorer=fuzz.ratio
        )

        if not best_match:
            return None

        matched_variation, score, index = best_match

        if score < threshold:
            logger.debug(f"Mejor match tiene score bajo: {score} < {threshold}")
            return None

        # Obtener el empleado correspondiente
        matched_employee_data = employee_names[index]['employee']

        return {
            'employee': matched_employee_data,
            'confidence': score,
            'matched_variation': matched_variation
        }

    def get_all_matches(
        self,
        employee_name: str,
        factory_id: str,
        limit: int = 5
    ) -> List[Dict]:
        """
        Obtener múltiples matches ordenados por score

        Args:
            employee_name: Nombre del OCR
            factory_id: ID de fábrica
            limit: Número máximo de resultados

        Returns:
            Lista de matches con sus scores
        """
        if not self.db_session:
            return []

        try:
            factory_employees = self._get_factory_employees(factory_id)
            if not factory_employees:
                return []

            normalized_ocr_name = self._normalize_japanese_name(employee_name)

            # Generar todas las variaciones
            employee_names = []
            for emp in factory_employees:
                names_to_match = []
                if emp.get('full_name_kanji'):
                    names_to_match.append(emp['full_name_kanji'])
                if emp.get('full_name_kana'):
                    names_to_match.append(emp['full_name_kana'])

                for name in names_to_match:
                    variations = self._generate_name_variations(name)
                    for var in variations:
                        employee_names.append({
                            'original': name,
                            'variation': var,
                            'employee': emp
                        })

            # Obtener los mejores matches
            names_to_match = [item['variation'] for item in employee_names]
            matches = process.extract(
                normalized_ocr_name,
                names_to_match,
                scorer=fuzz.ratio,
                limit=limit
            )

            results = []
            for matched_variation, score, index in matches:
                if score >= 50:  # Threshold bajo para múltiples matches
                    employee_data = employee_names[index]['employee']
                    results.append({
                        'hakenmoto_id': employee_data['hakenmoto_id'],
                        'full_name_kanji': employee_data['full_name_kanji'],
                        'confidence': score / 100.0,
                        'matched_name': matched_variation
                    })

            return results

        except Exception as e:
            logger.error(f"Error obteniendo múltiples matches: {e}", exc_info=True)
            return []


# Instancia singleton (sin DB session inicialmente)
employee_matching_service = EmployeeMatchingService()

__all__ = ["EmployeeMatchingService", "employee_matching_service"]
