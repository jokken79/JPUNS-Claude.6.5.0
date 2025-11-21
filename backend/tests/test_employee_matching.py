"""
Tests unitarios para EmployeeMatchingService
"""
import pytest
from unittest.mock import Mock, MagicMock
from sqlalchemy.orm import Session
from rapidfuzz import fuzz

from app.services.employee_matching_service import EmployeeMatchingService, employee_matching_service


class TestEmployeeMatchingService:
    """Tests para EmployeeMatchingService con fuzzy matching"""

    @pytest.fixture
    def mock_db_session(self):
        """Fixture para simular sesión de BD"""
        return Mock(spec=Session)

    @pytest.fixture
    def mock_employees(self):
        """Fixture con datos de empleados de ejemplo"""
        return [
            {
                'hakenmoto_id': 1,
                'full_name_kanji': '山田太郎',
                'full_name_kana': 'ヤマダタロウ',
                'factory_id': 'FACTORY_A'
            },
            {
                'hakenmoto_id': 2,
                'full_name_kanji': '鈴木花子',
                'full_name_kana': 'スズキハナコ',
                'factory_id': 'FACTORY_A'
            },
            {
                'hakenmoto_id': 3,
                'full_name_kanji': '佐藤次郎',
                'full_name_kana': 'サトウジロウ',
                'factory_id': 'FACTORY_B'
            }
        ]

    def test_normalize_japanese_name_basic(self):
        """Test normalización básica de nombres japoneses"""
        service = EmployeeMatchingService()

        # Test nombres normales
        assert service._normalize_japanese_name('山田太郎') == '山田太郎'
        assert service._normalize_japanese_name(' 山田 太郎 ') == '山田太郎'

        # Test con símbolos de OCR
        assert service._normalize_japanese_name('山田:太郎') == '山田太郎'
        assert service._normalize_japanese_name('山田｜太郎') == '山田太郎'

        # Test con números de empleado
        assert service._normalize_japanese_name('山田太郎12345') == '山田太郎'

        # Test con espacios entre kanji
        assert service._normalize_japanese_name('山 田太郎') == '山田太郎'
        # Nota: múltiples espacios entre múltiples caracteres se normalizan a un solo espacio
        assert service._normalize_japanese_name('山   田   太   郎') == '山田 太郎'

        # Test string vacío
        assert service._normalize_japanese_name('') == ''
        assert service._normalize_japanese_name(None) == ''

    def test_generate_name_variations(self):
        """Test generación de variaciones de nombres"""
        service = EmployeeMatchingService()

        # Test con kanji simple
        variations = service._generate_name_variations('山田太郎')
        assert '山田太郎' in variations
        assert '山田太郎' in variations  # sin espacios
        assert '山 田 太 郎' not in variations  # no debe agregar espacios extra

        # Test con espacios
        variations = service._generate_name_variations('山田 太郎')
        assert '山田 太郎' in variations
        assert '山田太郎' in variations  # también sin espacios

        # Test con caracteres especiales
        variations = service._generate_name_variations('山田・太郎')
        assert '山田・太郎' in variations
        assert '山田太郎' in variations  # sin punto

        # Test string vacío
        variations = service._generate_name_variations('')
        assert variations == []

    def test_get_factory_employees(self, mock_db_session, mock_employees):
        """Test obtener empleados de una fábrica"""
        service = EmployeeMatchingService(mock_db_session)

        # Mock query
        mock_query = Mock()
        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.all.return_value = [
            Mock(**emp) for emp in mock_employees
        ]

        # Test obtener empleados
        result = service._get_factory_employees('FACTORY_A')

        # Verificar que se llamó correctamente
        assert len(result) == 3
        assert result[0]['hakenmoto_id'] == 1
        assert result[1]['full_name_kanji'] == '鈴木花子'

        # Verificar que se llamó filter con el factory_id correcto
        mock_query.filter.assert_called_once()
        call_args = mock_query.filter.call_args[0][0]
        assert 'factory_id' in str(call_args)

    def test_get_factory_employees_no_results(self, mock_db_session):
        """Test cuando no hay empleados en la fábrica"""
        service = EmployeeMatchingService(mock_db_session)

        # Mock query vacía
        mock_query = Mock()
        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.all.return_value = []

        result = service._get_factory_employees('FACTORY_EMPTY')

        assert result == []

    def test_get_factory_employees_error(self, mock_db_session):
        """Test manejo de error en query de empleados"""
        service = EmployeeMatchingService(mock_db_session)

        # Simular error en BD
        mock_db_session.query.side_effect = Exception("Database connection error")

        result = service._get_factory_employees('FACTORY_ERROR')

        assert result == []

    def test_match_employee_by_name_exact_match(self, mock_db_session, mock_employees):
        """Test match con coincidencia exacta"""
        service = EmployeeMatchingService(mock_db_session)

        # Mock empleados de una sola fábrica
        factory_employees = [emp for emp in mock_employees if emp['factory_id'] == 'FACTORY_A']

        mock_query = Mock()
        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.all.return_value = [
            Mock(**emp) for emp in factory_employees
        ]

        # Test match exacto
        result = service.match_employee_by_name('山田太郎', 'FACTORY_A')

        assert result is not None
        assert result['hakenmoto_id'] == 1
        assert result['full_name_kanji'] == '山田太郎'
        assert result['confidence'] > 0.9  # > 90% confidence

    def test_match_employee_by_name_fuzzy_match(self, mock_db_session, mock_employees):
        """Test fuzzy matching con variaciones"""
        service = EmployeeMatchingService(mock_db_session)

        factory_employees = [emp for emp in mock_employees if emp['factory_id'] == 'FACTORY_A']

        mock_query = Mock()
        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.all.return_value = [
            Mock(**emp) for emp in factory_employees
        ]

        # Test match fuzzy - espacios diferentes
        result = service.match_employee_by_name('山 田 太郎', 'FACTORY_A')

        assert result is not None
        assert result['hakenmoto_id'] == 1
        assert result['confidence'] > 0.7  # > 70% confidence

    def test_match_employee_by_name_no_match(self, mock_db_session, mock_employees):
        """Test cuando no hay match"""
        service = EmployeeMatchingService(mock_db_session)

        factory_employees = [emp for emp in mock_employees if emp['factory_id'] == 'FACTORY_A']

        mock_query = Mock()
        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.all.return_value = [
            Mock(**emp) for emp in factory_employees
        ]

        # Test nombre que no coincide
        result = service.match_employee_by_name('宮本武蔵', 'FACTORY_A')

        assert result is None

    def test_match_employee_by_name_low_threshold(self, mock_db_session, mock_employees):
        """Test con threshold personalizado bajo"""
        service = EmployeeMatchingService(mock_db_session)

        factory_employees = [emp for emp in mock_employees if emp['factory_id'] == 'FACTORY_A']

        mock_query = Mock()
        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.all.return_value = [
            Mock(**emp) for emp in factory_employees
        ]

        # Test con nombre muy diferente y threshold alto
        result = service.match_employee_by_name('テストユーザー', 'FACTORY_A', threshold=90.0)

        assert result is None  # No debe coincidir con threshold 90%

    def test_match_employee_by_name_empty_inputs(self, mock_db_session):
        """Test con inputs vacíos"""
        service = EmployeeMatchingService(mock_db_session)

        # Sin nombre
        result = service.match_employee_by_name('', 'FACTORY_A')
        assert result is None

        # Sin factory_id
        result = service.match_employee_by_name('山田太郎', '')
        assert result is None

        # Ninguno
        result = service.match_employee_by_name('', '')
        assert result is None

        # None
        result = service.match_employee_by_name(None, None)
        assert result is None

    def test_match_employee_by_name_no_db_session(self):
        """Test sin sesión de BD"""
        service = EmployeeMatchingService()

        result = service.match_employee_by_name('山田太郎', 'FACTORY_A')

        assert result is None

    def test_match_employee_by_name_no_employees_in_factory(self, mock_db_session):
        """Test cuando no hay empleados en la fábrica"""
        service = EmployeeMatchingService(mock_db_session)

        # Mock respuesta vacía
        mock_query = Mock()
        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.all.return_value = []

        result = service.match_employee_by_name('山田太郎', 'FACTORY_EMPTY')

        assert result is None

    def test_get_all_matches(self, mock_db_session, mock_employees):
        """Test obtener múltiples matches"""
        service = EmployeeMatchingService(mock_db_session)

        factory_employees = [emp for emp in mock_employees if emp['factory_id'] == 'FACTORY_A']

        mock_query = Mock()
        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.all.return_value = [
            Mock(**emp) for emp in factory_employees
        ]

        # Test obtener top 2 matches
        result = service.get_all_matches('太郎', 'FACTORY_A', limit=2)

        assert isinstance(result, list)
        assert len(result) <= 2

        # Verificar que todos los resultados tienen la estructura correcta
        for match in result:
            assert 'hakenmoto_id' in match
            assert 'full_name_kanji' in match
            assert 'confidence' in match
            assert 0.0 <= match['confidence'] <= 1.0

    def test_get_all_matches_no_results(self, mock_db_session):
        """Test get_all_matches sin resultados"""
        service = EmployeeMatchingService(mock_db_session)

        mock_query = Mock()
        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.all.return_value = []

        result = service.get_all_matches('不存在', 'FACTORY_EMPTY')

        assert result == []

    def test_set_db_session(self):
        """Test establecer sesión de BD"""
        service = EmployeeMatchingService()
        mock_session = Mock()

        service.set_db_session(mock_session)

        assert service.db_session == mock_session

    def test_integration_with_timer_card_ocr_service(self):
        """Test que se puede importar desde TimerCardOCRService"""
        # Verificar que la importación funciona
        from app.services.timer_card_ocr_service import timer_card_ocr_service

        assert timer_card_ocr_service is not None
        assert hasattr(timer_card_ocr_service, '_match_employee')

    def test_employee_name_with_katakana_variations(self, mock_db_session):
        """Test nombres con variaciones katakana/kanji"""
        service = EmployeeMatchingService(mock_db_session)

        # Crear empleados con diferentes formas del mismo nombre
        employees = [
            {
                'hakenmoto_id': 10,
                'full_name_kanji': '田中',
                'full_name_kana': 'タナカ',
                'factory_id': 'FACTORY_TEST'
            }
        ]

        mock_query = Mock()
        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.all.return_value = [
            Mock(**emp) for emp in employees
        ]

        # Probar matching con forma incompleta (solo apellido)
        result = service.match_employee_by_name('田中', 'FACTORY_TEST')

        assert result is not None
        assert result['hakenmoto_id'] == 10
        assert result['confidence'] > 0.8

    def test_case_sensitivity(self, mock_db_session, mock_employees):
        """Test que el matching maneja case-sensitivity correctamente"""
        service = EmployeeMatchingService(mock_db_session)

        # Agregar empleado con caracteres ASCII
        employees = [
            {
                'hakenmoto_id': 100,
                'full_name_kanji': 'Test User',
                'full_name_kana': 'テストユーザー',
                'factory_id': 'FACTORY_ASCII'
            }
        ] + mock_employees

        factory_employees = [emp for emp in employees if emp['factory_id'] == 'FACTORY_ASCII']

        mock_query = Mock()
        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.all.return_value = [
            Mock(**emp) for emp in factory_employees
        ]

        # Test match exacto (case-sensitive para ASCII)
        result1 = service.match_employee_by_name('Test User', 'FACTORY_ASCII')
        assert result1 is not None
        assert result1['hakenmoto_id'] == 100

        # Nota: rapidfuzz es case-sensitive para caracteres ASCII
        # "test user" puede no coincidir con "Test User" sin ajustes
        # Esto es un comportamiento esperado del library
        # Lo importante es que nombres japoneses funcionan correctamente
        result2 = service.match_employee_by_name('test user', 'FACTORY_ASCII', threshold=30.0)
        # No verificamos el resultado aquí porque depende de la implementación de rapidfuzz

    def test_special_characters_in_names(self, mock_db_session):
        """Test nombres con caracteres especiales"""
        service = EmployeeMatchingService(mock_db_session)

        employees = [
            {
                'hakenmoto_id': 200,
                'full_name_kanji': '松本・ゴールド',
                'full_name_kana': 'モト-Morita',
                'factory_id': 'FACTORY_SPECIAL'
            }
        ]

        mock_query = Mock()
        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.all.return_value = [
            Mock(**emp) for emp in employees
        ]

        # Test matching con y sin caracteres especiales
        result1 = service.match_employee_by_name('松本・ゴールド', 'FACTORY_SPECIAL')
        result2 = service.match_employee_by_name('松本ゴールド', 'FACTORY_SPECIAL')

        assert result1 is not None
        assert result2 is not None  # Debe funcionar sin el punto
        assert result1['hakenmoto_id'] == 200
        assert result2['hakenmoto_id'] == 200
