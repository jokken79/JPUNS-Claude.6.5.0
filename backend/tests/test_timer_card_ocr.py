"""
Tests para Timer Card OCR Service
"""
import pytest
from app.services.timer_card_ocr_service import timer_card_ocr_service


class TestTimerCardOCRService:

    def test_extract_document_date(self):
        """Test extracción de año y mes"""
        texts = [
            "タイムカード - 2025年10月",
            "2025/10 勤怠記録",
            "10月分 2025年"
        ]

        for text in texts:
            year, month = timer_card_ocr_service._extract_document_date(text)
            assert year == 2025
            assert month == 10

    def test_extract_employee_name(self):
        """Test extracción de nombre"""
        text = "氏名: 山田太郎"
        name = timer_card_ocr_service._extract_employee_name(text)
        assert name == "山田太郎"

    def test_extract_daily_records_format_a(self):
        """Test extracción de registros formato tabla simple"""
        text = """
        日付      出勤時刻    退勤時刻    休憩時間
        10/15     08:00      17:00      60分
        10/16     08:30      18:00      60分
        """

        records = timer_card_ocr_service._extract_daily_records(text, 2025, 10)

        assert len(records) == 2
        assert records[0]['work_date'] == '2025-10-15'
        assert records[0]['clock_in'] == '08:00'
        assert records[0]['clock_out'] == '17:00'
        assert records[0]['break_minutes'] == 60

    def test_validation_errors(self):
        """Test validación de errores"""
        # Fecha en el futuro
        record = {
            'work_date': '2099-12-31',
            'clock_in': '08:00',
            'clock_out': '17:00',
            'break_minutes': 60
        }
        errors = timer_card_ocr_service._validate_timer_record(record)
        assert "Fecha en el futuro" in errors

        # Hora inválida
        record = {
            'work_date': '2025-10-15',
            'clock_in': '17:00',
            'clock_out': '08:00',  # Salida antes de entrada
            'break_minutes': 60
        }
        errors = timer_card_ocr_service._validate_timer_record(record)
        assert len(errors) > 0

    def test_extract_daily_records_format_b(self):
        """Test extracción de registros formato tabla detallada"""
        text = """
        日 | 曜 | 出勤 | 退勤 | 休憩 | 実働
        15 | 月 | 8:00 | 17:00 | 60  | 8.0
        16 | 火 | 8:30 | 17:30 | 60  | 8.0
        """

        records = timer_card_ocr_service._extract_daily_records(text, 2025, 10)

        assert len(records) == 2
        assert records[0]['work_date'] == '2025-10-15'
        assert records[0]['clock_in'] == '08:00'
        assert records[0]['clock_out'] == '17:00'
        assert records[0]['break_minutes'] == 60

    def test_extract_employee_name_with_cleaning(self):
        """Test extracción y limpieza de nombre"""
        text = "氏名: 山田太郎 12345"
        name = timer_card_ocr_service._extract_employee_name(text)
        assert name == "山田太郎"

        text = "社員名: 鈴木花子｜ID: 99999"
        name = timer_card_ocr_service._extract_employee_name(text)
        assert name == "鈴木花子"

    def test_validation_valid_record(self):
        """Test validación de registro válido"""
        record = {
            'work_date': '2025-10-15',
            'clock_in': '08:00',
            'clock_out': '17:00',
            'break_minutes': 60
        }
        errors = timer_card_ocr_service._validate_timer_record(record)
        assert len(errors) == 0

    def test_validation_night_shift(self):
        """Test validación de turnos nocturnos (debe ser válido)"""
        record = {
            'work_date': '2025-10-15',
            'clock_in': '22:00',
            'clock_out': '06:00',
            'break_minutes': 60
        }
        errors = timer_card_ocr_service._validate_timer_record(record)
        # Turno nocturno debería ser válido
        assert "Hora de salida debe ser posterior" not in errors

    def test_validation_break_minutes_out_of_range(self):
        """Test validación de minutos de descanso fuera de rango"""
        record = {
            'work_date': '2025-10-15',
            'clock_in': '08:00',
            'clock_out': '17:00',
            'break_minutes': 200  # Fuera de rango
        }
        errors = timer_card_ocr_service._validate_timer_record(record)
        # Should contain the specific error message for excessive break time
        assert any("excesivo" in str(e) or "fuera de rango" in str(e) for e in errors)

    def test_extract_daily_records_flexible_format(self):
        """Test extracción de formato flexible"""
        text = """
        タイムカード記録
        15日 出勤8:00 退勤17:00 休憩60分
        16日 出勤8:30 退勤18:00 休憩60分
        """

        records = timer_card_ocr_service._extract_daily_records(text, 2025, 10)

        assert len(records) >= 1
        # Verificar que se extrajo al menos un registro válido
        assert records[0]['work_date'] == '2025-10-15'
        assert records[0]['clock_in'] == '08:00'
        assert records[0]['clock_out'] == '17:00'
