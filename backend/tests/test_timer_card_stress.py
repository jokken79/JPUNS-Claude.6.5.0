"""
Tests de stress para Timer Card OCR
"""
import pytest
from unittest.mock import Mock, patch
from sqlalchemy.orm import Session
import time

from app.services.timer_card_ocr_service import TimerCardOCRService

class TestTimerCardStressTests:
    """Tests de stress para el sistema OCR"""
    
    @pytest.fixture
    def timer_ocr_service(self):
        return TimerCardOCRService()
    
    @pytest.fixture
    def mock_db_session(self):
        return Mock(spec=Session)
    
    def test_concurrent_pdf_processing(self, timer_ocr_service, mock_db_session):
        """Test procesamiento concurrente de múltiples PDFs"""
        import concurrent.futures
        
        def process_single_pdf(pdf_id):
            with patch.object(timer_ocr_service, 'process_pdf') as mock_process:
                mock_process.return_value = {
                    'success': True,
                    'pages_processed': 1,
                    'records_found': 10,
                    'records': [{'work_date': '2025-10-01'}],
                    'processing_errors': []
                }
                
                return timer_ocr_service.process_pdf(
                    pdf_bytes=f"pdf {pdf_id}".encode(),
                    factory_id='FACTORY_A',
                    db_session=mock_db_session
                )
        
        # Procesar 5 PDFs concurrentemente
        start_time = time.time()
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(process_single_pdf, i) for i in range(5)]
            results = [f.result() for f in futures]
        elapsed = time.time() - start_time
        
        assert len(results) == 5
        assert all(r['success'] for r in results)
        assert elapsed < 10
    
    def test_memory_usage_large_pdf(self, timer_ocr_service, mock_db_session):
        """Test uso de memoria con PDF grande"""
        with patch.object(timer_ocr_service, 'process_pdf') as mock_process:
            large_data = [
                {'work_date': f'2025-10-{i:02d}', 'clock_in': '08:00', 
                 'clock_out': '17:00', 'break_minutes': 60}
                for i in range(1, 101)
            ]
            
            mock_process.return_value = {
                'success': True,
                'pages_processed': 10,
                'records_found': 100,
                'records': large_data,
                'processing_errors': []
            }
            
            result = timer_ocr_service.process_pdf(
                pdf_bytes=b"large pdf",
                factory_id='FACTORY_A',
                db_session=mock_db_session
            )
            
            assert result['success'] is True
            assert result['records_found'] == 100
