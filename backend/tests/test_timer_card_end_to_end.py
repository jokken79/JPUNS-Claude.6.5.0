"""
Tests end-to-end completos para el sistema OCR Timer Cards
"""
import pytest
from unittest.mock import Mock, patch
from sqlalchemy.orm import Session

from app.services.timer_card_ocr_service import TimerCardOCRService


class TestTimerCardEndToEndWorkflow:
    """Tests end-to-end del workflow completo"""

    @pytest.fixture
    def timer_ocr_service(self):
        return TimerCardOCRService()

    @pytest.fixture
    def mock_db_session(self):
        return Mock(spec=Session)

    def test_complete_workflow_formato_tabla_simple(self, timer_ocr_service, mock_db_session):
        """Test workflow completo con formato de tabla simple"""
        with patch.object(timer_ocr_service, 'process_pdf') as mock_process:
            mock_process.return_value = {
                'success': True,
                'pages_processed': 1,
                'records_found': 3,
                'records': [
                    {'work_date': '2025-10-01', 'clock_in': '08:00',
                     'clock_out': '17:00', 'break_minutes': 60},
                    {'work_date': '2025-10-02', 'clock_in': '08:30',
                     'clock_out': '18:00', 'break_minutes': 60}
                ],
                'processing_errors': []
            }

            result = timer_ocr_service.process_pdf(
                pdf_bytes=b"fake pdf",
                factory_id='FACTORY_A',
                db_session=mock_db_session
            )

            assert result['success'] is True
            assert result['records_found'] == 3

    def test_complete_workflow_turno_nocturno(self, timer_ocr_service, mock_db_session):
        """Test workflow con turnos nocturnos"""
        with patch.object(timer_ocr_service, 'process_pdf') as mock_process:
            mock_process.return_value = {
                'success': True,
                'pages_processed': 1,
                'records_found': 2,
                'records': [
                    {'work_date': '2025-10-01', 'clock_in': '22:00',
                     'clock_out': '06:00', 'break_minutes': 60}
                ],
                'processing_errors': []
            }

            result = timer_ocr_service.process_pdf(
                pdf_bytes=b"fake pdf",
                factory_id='FACTORY_B',
                db_session=mock_db_session
            )

            assert result['success'] is True
            assert result['records_found'] == 2
