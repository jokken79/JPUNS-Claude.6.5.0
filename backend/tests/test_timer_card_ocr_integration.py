"""
Tests de integración para TimerCardOCRService con Employee Matching
"""
import pytest
from unittest.mock import Mock
from sqlalchemy.orm import Session

from app.services.timer_card_ocr_service import TimerCardOCRService


class TestTimerCardOCRServiceIntegration:
    """Tests de integración para TimerCardOCRService con employee matching"""

    @pytest.fixture
    def mock_db_session(self):
        """Fixture para simular sesión de BD"""
        return Mock(spec=Session)

    @pytest.fixture
    def timer_ocr_service(self):
        """Fixture para instancia de TimerCardOCRService"""
        return TimerCardOCRService()

    @pytest.fixture
    def sample_timer_card_text(self):
        """Texto de ejemplo de timer card"""
        return """
        タイムカード - 2025年10月
        工場: ファクトリーA
        氏名: 山田太郎

        日付      出勤時刻    退勤時刻    休憩時間
        10/15     08:00      17:00      60分
        10/16     08:30      18:00      60分
        10/17     09:00      17:30      60分
        """

    def test_match_employee_integration(self, timer_ocr_service, mock_db_session):
        """Test integración del método _match_employee con BD"""
        # El método _match_employee actualmente es un placeholder
        result = timer_ocr_service._match_employee(
            employee_name='山田太郎',
            factory_id='FACTORY_A'
        )

        # Verificar que retorna el placeholder
        assert result is not None
        assert result['hakenmoto_id'] is None
        assert result['full_name_kanji'] == '山田太郎'
        assert result['factory_id_original'] == 'FACTORY_A'
        assert result['factory_id_normalized'] == 'FACTORY_A'
        assert result['confidence'] == 0.0

    def test_match_employee_no_factory_id(self, timer_ocr_service):
        """Test cuando no hay factory_id"""
        result = timer_ocr_service._match_employee(
            employee_name='山田太郎',
            factory_id=None
        )

        # Debe retornar None si no hay factory_id
        assert result is None

    def test_normalize_factory_id(self, timer_ocr_service):
        """Test normalización de 派遣先ID"""
        # Test casos normales
        assert timer_ocr_service._normalize_factory_id('FACTORY_A') == 'FACTORY_A'
        assert timer_ocr_service._normalize_factory_id('123') == '123'

        # Test removing leading zero (コーリツ case)
        assert timer_ocr_service._normalize_factory_id('0123') == '123'
        assert timer_ocr_service._normalize_factory_id('00123') == '123'
        assert timer_ocr_service._normalize_factory_id('00001') == '1'

        # Test con espacios
        assert timer_ocr_service._normalize_factory_id(' 0123 ') == '123'

        # Test edge cases
        assert timer_ocr_service._normalize_factory_id('0') == '0'
        assert timer_ocr_service._normalize_factory_id('00') == '0'  # All zeros become "0"
        assert timer_ocr_service._normalize_factory_id(None) is None
        assert timer_ocr_service._normalize_factory_id('') == ''
