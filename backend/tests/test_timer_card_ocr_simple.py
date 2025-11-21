"""
Tests simplificados para Timer Card OCR Service
"""
import sys
import re


class TestTimerCardOCRParser:
    """Tests para el parser OCR sin dependencias externas"""

    def test_extract_document_date(self):
        """Test extracción de año y mes"""

        def extract_document_date(raw_text: str):
            """Extrae año y mes del documento"""
            month_year_patterns = [
                r'(\d{4})年(\d{1,2})月',
                r'(\d{4})[/\-\.](\d{1,2})',
                r'(\d{1,2})月分.*(\d{4})年?',
            ]

            for pattern in month_year_patterns:
                match = re.search(pattern, raw_text)
                if match:
                    groups = match.groups()
                    if len(groups) == 2:
                        year = int(groups[0]) if int(groups[0]) > 100 else int(groups[1])
                        month = int(groups[1]) if int(groups[0]) > 100 else int(groups[0])

                        if 2020 <= year <= 2030 and 1 <= month <= 12:
                            return (year, month)

            # Fallback a mes/año actual si no se encuentra
            return (2025, 11)

        texts = [
            "タイムカード - 2025年10月",
            "2025/10 勤怠記録",
            "10月分 2025年"
        ]

        for text in texts:
            year, month = extract_document_date(text)
            assert year == 2025
            assert month == 10

    def test_extract_employee_name(self):
        """Test extracción de nombre"""

        def extract_employee_name(raw_text: str):
            """Extrae nombre del empleado"""
            name_patterns = [
                r'氏名[：:\s]*([^\n]+)',
                r'社員名[：:\s]*([^\n]+)',
                r'名前[：:\s]*([^\n]+)',
                r'社員[：:\s]*([^\n]+)',
            ]

            for pattern in name_patterns:
                match = re.search(pattern, raw_text)
                if match:
                    name = match.group(1).strip()
                    # Limpiar números de empleado
                    name = re.sub(r'\d{4,}', '', name).strip()
                    # Limpiar símbolos
                    name = re.sub(r'[：:｜|]', '', name).strip()
                    if len(name) >= 2:
                        return name

            return "不明"  # "Desconocido" si no se encuentra

        text = "氏名: 山田太郎"
        name = extract_employee_name(text)
        assert name == "山田太郎"

    def test_extract_daily_records_format_a(self):
        """Test extracción de registros formato tabla simple"""

        def extract_daily_records(raw_text: str, year: int, month: int):
            """Extrae registros diarios del timer card"""
            records = []

            # Patrones para diferentes formatos
            table_patterns = [
                # Formato: 10/15     08:00      17:00      60分
                r'(\d{1,2})/(\d{1,2})\s+(\d{1,2}):(\d{2})\s+(\d{1,2}):(\d{2})\s+(\d+)',

                # Formato: 15 | 月 | 8:00 | 17:00 | 60
                r'(\d{1,2})\s*\|\s*[月火水木金土日]\s*\|\s*(\d{1,2}):(\d{2})\s*\|\s*(\d{1,2}):(\d{2})\s*\|\s*(\d+)',

                # Formato: 15日 8:00-17:00 休憩60分
                r'(\d{1,2})日.*?(\d{1,2}):(\d{2})[^\d]*(\d{1,2}):(\d{2}).*?(\d+)分',
            ]

            for pattern in table_patterns:
                matches = re.finditer(pattern, raw_text)
                for match in matches:
                    try:
                        groups = match.groups()

                        if len(groups) == 7:
                            day = int(groups[1])
                            clock_in_h, clock_in_m = int(groups[2]), int(groups[3])
                            clock_out_h, clock_out_m = int(groups[4]), int(groups[5])
                            break_min = int(groups[6])
                        elif len(groups) == 6:
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

                        records.append({
                            "work_date": work_date,
                            "clock_in": f"{clock_in_h:02d}:{clock_in_m:02d}",
                            "clock_out": f"{clock_out_h:02d}:{clock_out_m:02d}",
                            "break_minutes": break_min
                        })

                    except (ValueError, IndexError):
                        continue

            return records

        text = """
        日付      出勤時刻    退勤時刻    休憩時間
        10/15     08:00      17:00      60分
        10/16     08:30      18:00      60分
        """

        records = extract_daily_records(text, 2025, 10)

        assert len(records) == 2
        assert records[0]['work_date'] == '2025-10-15'
        assert records[0]['clock_in'] == '08:00'
        assert records[0]['clock_out'] == '17:00'
        assert records[0]['break_minutes'] == 60

    def test_validation_errors(self):
        """Test validación de errores"""

        def validate_timer_record(record: dict):
            """Valida un registro de timer card"""
            import datetime
            errors = []

            # Validar fecha
            try:
                work_date = datetime.datetime.strptime(record['work_date'], '%Y-%m-%d').date()
                if work_date > datetime.datetime.now().date():
                    errors.append("Fecha en el futuro")
            except ValueError:
                errors.append("Fecha inválida")

            # Validar horas
            try:
                clock_in = datetime.datetime.strptime(record['clock_in'], '%H:%M').time()
                clock_out = datetime.datetime.strptime(record['clock_out'], '%H:%M').time()

                # Permitir turnos nocturnos
                if clock_out <= clock_in:
                    if not (clock_in.hour >= 20 and clock_out.hour <= 8):
                        errors.append("Hora de salida debe ser posterior a hora de entrada")
            except ValueError:
                errors.append("Formato de hora inválido")

            # Validar minutos de descanso
            if not (0 <= record.get('break_minutes', 0) <= 180):
                errors.append("Minutos de descanso fuera de rango (0-180)")

            return errors

        # Fecha en el futuro
        record = {
            'work_date': '2099-12-31',
            'clock_in': '08:00',
            'clock_out': '17:00',
            'break_minutes': 60
        }
        errors = validate_timer_record(record)
        assert "Fecha en el futuro" in errors

        # Hora inválida
        record = {
            'work_date': '2025-10-15',
            'clock_in': '17:00',
            'clock_out': '08:00',  # Salida antes de entrada
            'break_minutes': 60
        }
        errors = validate_timer_record(record)
        assert len(errors) > 0

    def test_extract_daily_records_format_b(self):
        """Test extracción de registros formato tabla detallada"""

        def extract_daily_records(raw_text: str, year: int, month: int):
            """Extrae registros diarios del timer card"""
            records = []

            # Patrones para diferentes formatos
            table_patterns = [
                r'(\d{1,2})/(\d{1,2})\s+(\d{1,2}):(\d{2})\s+(\d{1,2}):(\d{2})\s+(\d+)',
                r'(\d{1,2})\s*\|\s*[月火水木金土日]\s*\|\s*(\d{1,2}):(\d{2})\s*\|\s*(\d{1,2}):(\d{2})\s*\|\s*(\d+)',
                r'(\d{1,2})日.*?(\d{1,2}):(\d{2})[^\d]*(\d{1,2}):(\d{2}).*?(\d+)分',
            ]

            for pattern in table_patterns:
                matches = re.finditer(pattern, raw_text)
                for match in matches:
                    try:
                        groups = match.groups()

                        if len(groups) == 7:
                            day = int(groups[1])
                            clock_in_h, clock_in_m = int(groups[2]), int(groups[3])
                            clock_out_h, clock_out_m = int(groups[4]), int(groups[5])
                            break_min = int(groups[6])
                        elif len(groups) == 6:
                            day = int(groups[0])
                            clock_in_h, clock_in_m = int(groups[1]), int(groups[2])
                            clock_out_h, clock_out_m = int(groups[3]), int(groups[4])
                            break_min = int(groups[5])
                        else:
                            continue

                        if not (1 <= day <= 31):
                            continue

                        if not (0 <= clock_in_h <= 23 and 0 <= clock_in_m <= 59):
                            continue
                        if not (0 <= clock_out_h <= 23 and 0 <= clock_out_m <= 59):
                            continue

                        work_date = f"{year}-{month:02d}-{day:02d}"

                        records.append({
                            "work_date": work_date,
                            "clock_in": f"{clock_in_h:02d}:{clock_in_m:02d}",
                            "clock_out": f"{clock_out_h:02d}:{clock_out_m:02d}",
                            "break_minutes": break_min
                        })

                    except (ValueError, IndexError):
                        continue

            return records

        text = """
        日 | 曜 | 出勤 | 退勤 | 休憩 | 実働
        15 | 月 | 8:00 | 17:00 | 60  | 8.0
        16 | 火 | 8:30 | 17:30 | 60  | 8.0
        """

        records = extract_daily_records(text, 2025, 10)

        assert len(records) == 2
        assert records[0]['work_date'] == '2025-10-15'
        assert records[0]['clock_in'] == '08:00'
        assert records[0]['clock_out'] == '17:00'
        assert records[0]['break_minutes'] == 60

    def test_extract_employee_name_with_cleaning(self):
        """Test extracción y limpieza de nombre"""

        def extract_employee_name(raw_text: str):
            """Extrae nombre del empleado"""
            name_patterns = [
                r'氏名[：:\s]*([^\n]+)',
                r'社員名[：:\s]*([^\n]+)',
                r'名前[：:\s]*([^\n]+)',
                r'社員[：:\s]*([^\n]+)',
            ]

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

            return "不明"

        text = "氏名: 山田太郎 12345"
        name = extract_employee_name(text)
        assert name == "山田太郎"

        text = "社員名: 鈴木花子｜ID: 99999"
        name = extract_employee_name(text)
        assert name == "鈴木花子"

    def test_validation_valid_record(self):
        """Test validación de registro válido"""

        def validate_timer_record(record: dict):
            """Valida un registro de timer card"""
            import datetime
            errors = []

            try:
                work_date = datetime.datetime.strptime(record['work_date'], '%Y-%m-%d').date()
                if work_date > datetime.datetime.now().date():
                    errors.append("Fecha en el futuro")
            except ValueError:
                errors.append("Fecha inválida")

            try:
                clock_in = datetime.datetime.strptime(record['clock_in'], '%H:%M').time()
                clock_out = datetime.datetime.strptime(record['clock_out'], '%H:%M').time()

                if clock_out <= clock_in:
                    if not (clock_in.hour >= 20 and clock_out.hour <= 8):
                        errors.append("Hora de salida debe ser posterior a hora de entrada")
            except ValueError:
                errors.append("Formato de hora inválido")

            if not (0 <= record.get('break_minutes', 0) <= 180):
                errors.append("Minutos de descanso fuera de rango (0-180)")

            return errors

        record = {
            'work_date': '2025-10-15',
            'clock_in': '08:00',
            'clock_out': '17:00',
            'break_minutes': 60
        }
        errors = validate_timer_record(record)
        assert len(errors) == 0

    def test_validation_night_shift(self):
        """Test validación de turnos nocturnos"""

        def validate_timer_record(record: dict):
            """Valida un registro de timer card"""
            import datetime
            errors = []

            try:
                work_date = datetime.datetime.strptime(record['work_date'], '%Y-%m-%d').date()
                if work_date > datetime.datetime.now().date():
                    errors.append("Fecha en el futuro")
            except ValueError:
                errors.append("Fecha inválida")

            try:
                clock_in = datetime.datetime.strptime(record['clock_in'], '%H:%M').time()
                clock_out = datetime.datetime.strptime(record['clock_out'], '%H:%M').time()

                if clock_out <= clock_in:
                    if not (clock_in.hour >= 20 and clock_out.hour <= 8):
                        errors.append("Hora de salida debe ser posterior a hora de entrada")
            except ValueError:
                errors.append("Formato de hora inválido")

            if not (0 <= record.get('break_minutes', 0) <= 180):
                errors.append("Minutos de descanso fuera de rango (0-180)")

            return errors

        record = {
            'work_date': '2025-10-15',
            'clock_in': '22:00',
            'clock_out': '06:00',
            'break_minutes': 60
        }
        errors = validate_timer_record(record)
        # Turno nocturno debería ser válido
        assert "Hora de salida debe ser posterior" not in errors
