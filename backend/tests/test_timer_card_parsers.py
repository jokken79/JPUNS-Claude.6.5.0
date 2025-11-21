"""
Tests de parsers para Timer Card OCR
"""
import pytest
from unittest.mock import Mock, patch
from datetime import datetime, date

from app.services.timer_card_ocr_service import TimerCardOCRService

class TestTimerCardParsers:
    """Tests para métodos de parsing del OCR"""
    
    @pytest.fixture
    def timer_ocr_service(self):
        return TimerCardOCRService()
    
    def test_extract_document_date_various_formats(self, timer_ocr_service):
        """Test extracción de fecha de documento en diferentes formatos"""
        test_cases = [
            ("タイムカード - 2025年10月", 2025, 10),
            ("2025/10 勤怠記録", 2025, 10),
            ("10月度 2025年", 2025, 10),
            ("Timer Card October 2025", 2025, 10),
            ("2025年10月度", 2025, 10),
            ("2025-10", 2025, 10),
        ]
        
        for text, expected_year, expected_month in test_cases:
            result = timer_ocr_service._extract_document_date(text)
            assert result == (expected_year, expected_month), f"Failed for: {text}"
    
    def test_extract_employee_name_various_formats(self, timer_ocr_service):
        """Test extracción de nombre de empleado"""
        test_cases = [
            ("氏名: 山田太郎", "山田太郎"),
            ("山田 太郎", "山田太郎"),
            ("Employee: Yamada Taro", "Yamada Taro"),
            ("Name 山田太郎", "山田太郎"),
            ("田中一郎", "田中一郎"),
        ]
        
        for text, expected_name in test_cases:
            result = timer_ocr_service._extract_employee_name(text)
            assert result == expected_name, f"Failed for: {text}"
    
    def test_extract_daily_records_format_a(self, timer_ocr_service):
        """Test extracción de registros formato tabla simple"""
        text = """
        日付      出勤時刻    退勤時刻    休憩時間
        10/01     08:00      17:00      60分
        10/02     08:30      18:00      60分
        10/03     09:00      17:30      60分
        """
        
        records = timer_ocr_service._extract_daily_records(text, 2025, 10)
        
        assert len(records) == 3
        assert records[0]['work_date'] == '2025-10-01'
        assert records[0]['clock_in'] == '08:00'
        assert records[0]['clock_out'] == '17:00'
        assert records[0]['break_minutes'] == 60
    
    def test_extract_daily_records_format_b(self, timer_ocr_service):
        """Test extracción formato alternativo"""
        text = """
        日付    勤怠区分    出社時間    退社時間    休憩
        10/01  通常       08:00      17:00      01:00
        10/02  通常       08:30      18:00      01:00
        """
        
        records = timer_ocr_service._extract_daily_records(text, 2025, 10)
        
        assert len(records) >= 1
        assert records[0]['clock_in'] == '08:00'
    
    def test_parse_time_various_formats(self, timer_ocr_service):
        """Test parsing de horas en diferentes formatos"""
        test_cases = [
            ("08:00", "08:00"),
            ("8:00", "08:00"),
            ("8時00分", "08:00"),
            ("8:00AM", "08:00"),
            ("20:30", "20:30"),
            ("20時30分", "20:30"),
            ("22:00", "22:00"),
        ]
        
        for time_str, expected in test_cases:
            result = timer_ocr_service._parse_time(time_str)
            assert result == expected, f"Failed for: {time_str}"
    
    def test_validate_timer_record_future_date(self, timer_ocr_service):
        """Test validación: fecha futura"""
        record = {
            'work_date': '2099-12-31',
            'clock_in': '08:00',
            'clock_out': '17:00',
            'break_minutes': 60
        }
        
        errors = timer_ocr_service._validate_timer_record(record)
        assert any("futuro" in str(e).lower() for e in errors)
    
    def test_validate_timer_record_invalid_hours(self, timer_ocr_service):
        """Test validación: horas inválidas"""
        # Salida antes de entrada
        record1 = {
            'work_date': '2025-10-01',
            'clock_in': '17:00',
            'clock_out': '08:00',
            'break_minutes': 60
        }
        
        errors1 = timer_ocr_service._validate_timer_record(record1)
        assert len(errors1) > 0
    
    def test_validate_timer_record_excessive_break(self, timer_ocr_service):
        """Test validación: descanso excesivo"""
        record = {
            'work_date': '2025-10-01',
            'clock_in': '08:00',
            'clock_out': '17:00',
            'break_minutes': 180  # 3 horas
        }
        
        errors = timer_ocr_service._validate_timer_record(record)
        assert any("excesivo" in str(e).lower() for e in errors)
    
    def test_parse_night_shift(self, timer_ocr_service):
        """Test parsing de turnos nocturnos"""
        text = """
        日付      出勤時刻    退勤時刻    休憩時間
        10/01     22:00      06:00      60分
        10/02     22:30      06:30      60分
        """
        
        records = timer_ocr_service._extract_daily_records(text, 2025, 10)
        
        assert len(records) >= 1
        # Verificar que el parser detecta turno nocturno
        record = records[0]
        clock_in = record.get('clock_in', '')
        clock_out = record.get('clock_out', '')
        
        # Lógica para detectar turnos nocturnos
        if clock_in.startswith('22') or clock_in.startswith('23'):
            assert 'night_shift' in record or record.get('is_night_shift', False)
    
    def test_extract_multiple_employees(self, timer_ocr_service):
        """Test extracción con múltiples empleados"""
        text = """
        田中一郎
        10/01  08:00  17:00  60分
        10/02  08:30  18:00  60分
        
        山田太郎
        10/01  08:00  17:00  60分
        10/02  08:30  18:00  60分
        """
        
        records = timer_ocr_service._extract_daily_records(text, 2025, 10)
        
        # Debe extraer al menos algunos registros
        assert len(records) >= 1
