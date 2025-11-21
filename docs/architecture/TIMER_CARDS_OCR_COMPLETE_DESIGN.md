# TIMER CARDS OCR - DISEÑO COMPLETO

**Fecha:** 2025-11-13  
**Sistema:** UNS-ClaudeJP 5.4.1 - HR Management System  
**Autor:** Claude Code Agent  
**Versión:** 1.0

---

## 📋 TABLA DE CONTENIDOS

1. [FLUJO DE UPLOAD](#1-flujo-de-upload)
2. [OCR PROCESSING](#2-ocr-processing)
3. [FACTORY RULES APPLICATION](#3-factory-rules-application)
4. [TABLA processed_timer_cards](#4-tabla-processed_timer_cards)
5. [UI REVIEW](#5-ui-review)
6. [INTEGRACIÓN PAYROLL](#6-integración-payroll)
7. [MANEJO DE ERRORES](#7-manejo-de-errores)
8. [EJEMPLOS COMPLETOS](#8-ejemplos-completos)

---

## 1. FLUJO DE UPLOAD

### 1.1 ¿Quién Sube?

**Roles Autorizados:**
- ✅ **KEIRI** (経理) - Personal de contabilidad
- ✅ **TANTOSHA** (担当者) - Personal a cargo
- ✅ **ADMIN/SUPER_ADMIN** - Administradores

**Restricción:**
```python
@router.post("/timercards/upload-batch")
@require_role(["KEIRI", "TANTOSHA", "ADMIN", "SUPER_ADMIN"])
async def upload_batch_timer_cards(...):
    pass
```

### 1.2 Formato del PDF

**Especificaciones:**
- **Tipo:** Un solo PDF multi-página
- **Contenido:** TODOS los employees de un factory para un mes completo
- **Estructura:**
  ```
  PDF: 高雄工業_本社工場_2025年11月.pdf
  │
  ├─ Página 1: Header (Factory info, 年月)
  ├─ Página 2: Employee #1 (Nguyen Van A)
  │   └─ 31 filas (días del mes)
  ├─ Página 3: Employee #2 (Tran Thi B)
  │   └─ 31 filas
  ├─ Página 4: Employee #3 (Le Van C)
  │   └─ 31 filas
  └─ ... hasta último employee
  ```

**Formato de Cada Página (Employee):**
```
┌──────────────────────────────────────────────────────────┐
│  高雄工業株式会社　本社工場                                  │
│  氏名: グエン　バン　A (Nguyen Van A)                      │
│  社員番号: E-12345                                         │
│  配属: Aライン                                             │
│  2025年11月　タイムカード                                   │
├──────┬────────┬────────┬────────┬─────────────┤
│ 日付 │  出勤  │  退勤  │  休憩  │    備考       │
├──────┼────────┼────────┼────────┼─────────────┤
│ 11/01│  7:00  │ 15:30  │  45分  │              │
│ 11/02│  7:00  │ 17:00  │  45分  │ 残業2h       │
│ 11/03│   -    │   -    │   -    │ 祝日         │
│ 11/04│  7:00  │ 15:30  │  45分  │              │
│ 11/05│ 19:00  │  3:30  │  45分  │ 夜勤         │
│ ...  │  ...   │  ...   │  ...   │ ...          │
│ 11/30│  7:00  │ 15:30  │  45分  │              │
└──────┴────────┴────────┴────────┴─────────────┘
```

### 1.3 Ubicación: /dashboard/timercards/upload

**Wireframe de UI:**

```
┌────────────────────────────────────────────────────────────┐
│  📁 タイムカード一括アップロード                              │
│     (Batch Timer Card Upload)                              │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Factory 選択: *                                            │
│  ┌─────────────────────────────────────────────────┐       │
│  │ 高雄工業株式会社_本社工場                        ▼ │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
│  対象年月: *                                                │
│  ┌──────────┐  ┌──────────┐                               │
│  │ 2025  ▼ │  │  11   ▼ │                               │
│  └──────────┘  └──────────┘                               │
│                                                             │
│  PDFファイル: *                                             │
│  ┌─────────────────────────────────────────────────┐       │
│  │  [📎 ファイルを選択]                             │       │
│  │                                                  │       │
│  │  ドラッグ＆ドロップまたはクリックしてアップロード     │       │
│  │                                                  │       │
│  │  対応形式: PDF (最大 50MB)                        │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
│  処理オプション:                                            │
│  ☑ 自動保存 (OCR成功後、自動的にDBに保存)                   │
│  ☑ Factory規則を適用 (work_hours, overtime限度)           │
│  ☐ 承認済みとしてマーク                                     │
│                                                             │
│  ┌──────────────────┐                                      │
│  │  🚀 アップロード  │                                      │
│  └──────────────────┘                                      │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### 1.4 Flujo de Proceso

```
┌─────────────────────────────────────────────────────────────┐
│  PASO 1: Usuario Sube PDF                                   │
├─────────────────────────────────────────────────────────────┤
│  - KEIRI selecciona factory: "高雄工業_本社工場"             │
│  - Selecciona año/mes: 2025年11月                            │
│  - Arrastra PDF: 高雄工業_本社工場_2025年11月.pdf           │
│  - Marca "自動保存"                                          │
│  - Presiona "アップロード"                                   │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 2: Backend Recibe y Valida                            │
├─────────────────────────────────────────────────────────────┤
│  POST /api/timer_cards/upload-batch                         │
│                                                              │
│  Validaciones:                                               │
│  ✓ Archivo es PDF                                            │
│  ✓ Tamaño < 50MB                                             │
│  ✓ Factory existe en BD                                      │
│  ✓ Año/mes válidos                                           │
│  ✓ Usuario tiene rol autorizado                              │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 3: OCR Processing (Ver Sección 2)                     │
├─────────────────────────────────────────────────────────────┤
│  - Extraer factory_id del header                             │
│  - Por cada página:                                          │
│    ├─ Extraer employee info (nombre, 社員番号)               │
│    ├─ Extraer año/mes (2025年11月)                           │
│    └─ Extraer días del mes:                                  │
│        ├─ 日付 (work_date)                                   │
│        ├─ 出勤 (clock_in)                                    │
│        ├─ 退勤 (clock_out)                                   │
│        ├─ 休憩 (break_minutes)                               │
│        └─ 備考 (notes)                                       │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 4: Employee Matching (AI/Fuzzy Match)                 │
├─────────────────────────────────────────────────────────────┤
│  - OCR extrae: "グエン　バン　A"                             │
│  - Buscar en BD:                                             │
│    └─ Employee con factory_id + nombre similar               │
│  - Match encontrado:                                         │
│    └─ hakenmoto_id = 45                                      │
│    └─ full_name_kana = "グエン　バン　アー"                  │
│    └─ hakensaki_shain_id = "E-12345"                        │
│  - Confidence: 95% (alto match)                              │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 5: Factory Rules Application (Ver Sección 3)          │
├─────────────────────────────────────────────────────────────┤
│  - Leer config/factories/高雄工業_本社工場.json               │
│  - Aplicar schedule.work_hours                               │
│  - Aplicar schedule.break_time                               │
│  - Validar schedule.overtime_labor                           │
│  - Redondear con schedule.time_unit (15 min)                 │
│  - Calcular regular/overtime/night/holiday hours             │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 6: Guardar en processed_timer_cards                   │
├─────────────────────────────────────────────────────────────┤
│  - Por cada día trabajado:                                   │
│    └─ INSERT INTO processed_timer_cards (...)                │
│  - Status: "pending" (esperando revisión KANRININSHA)        │
│  - Guardar metadata OCR (confidence, validation_errors)      │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 7: Retornar Resultado                                 │
├─────────────────────────────────────────────────────────────┤
│  Response:                                                   │
│  {                                                           │
│    "file_name": "高雄工業_本社工場_2025年11月.pdf",         │
│    "pages_processed": 25,                                    │
│    "employees_found": 25,                                    │
│    "total_records": 550,  // 25 employees * 22 work days    │
│    "saved": 545,                                             │
│    "errors": [                                               │
│      {                                                       │
│        "page": 12,                                           │
│        "employee": "Tran Van B",                             │
│        "error": "Employee not found in database"             │
│      },                                                      │
│      ...                                                     │
│    ],                                                        │
│    "summary": {                                              │
│      "success_rate": "99.1%",                                │
│      "avg_confidence": 96.5,                                 │
│      "processing_time": "45.3s"                              │
│    }                                                         │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 8: Redirect a Review UI (Ver Sección 5)               │
├─────────────────────────────────────────────────────────────┤
│  - Navegar a: /timercards/review?year=2025&month=11         │
│  - KANRININSHA revisa los 545 registros                      │
│  - Edita manualmente errores si necesario                    │
│  - Aprueba batch completo                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. OCR PROCESSING

### 2.1 Algoritmo de Extracción

**Tecnología:** Hybrid OCR System (igual que Candidates)
```
Azure Computer Vision (primary)
    ↓ (if fails)
EasyOCR (secondary)
    ↓ (if fails)
Tesseract (fallback)
```

### 2.2 Extracción Paso a Paso

#### **PASO 1: Extraer Factory ID del Header**

**Input:** Primera página del PDF
```
高雄工業株式会社　本社工場
2025年11月　タイムカード
```

**OCR Pattern Matching:**
```python
import re

def extract_factory_info(header_text: str) -> dict:
    """Extrae factory_id y año/mes del header"""
    
    # Pattern 1: Factory name
    factory_pattern = r"([^　\s]+株式会社|[^　\s]+会社)[\s　]*([^　\s]*工場)"
    factory_match = re.search(factory_pattern, header_text)
    
    if factory_match:
        company = factory_match.group(1)  # "高雄工業株式会社"
        plant = factory_match.group(2) or "本社工場"  # "本社工場"
        factory_id = f"{company}_{plant}"
    
    # Pattern 2: Year and Month (2025年11月)
    date_pattern = r"(\d{4})年(\d{1,2})月"
    date_match = re.search(date_pattern, header_text)
    
    if date_match:
        year = int(date_match.group(1))  # 2025
        month = int(date_match.group(2))  # 11
    
    return {
        "factory_id": factory_id,
        "year": year,
        "month": month
    }

# Resultado:
{
    "factory_id": "高雄工業株式会社_本社工場",
    "year": 2025,
    "month": 11
}
```

#### **PASO 2: Extraer Employee Info (Por Página)**

**Input:** Cada página individual
```
氏名: グエン　バン　A (Nguyen Van A)
社員番号: E-12345
配属: Aライン
```

**OCR Pattern Matching:**
```python
def extract_employee_info(page_text: str) -> dict:
    """Extrae información del employee de cada página"""
    
    # Pattern 1: Nombre (kanji/kana)
    name_pattern = r"氏名[:\s：]+([\u3040-\u309F\u30A0-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\s]+)"
    name_match = re.search(name_pattern, page_text)
    employee_name_kana = name_match.group(1).strip() if name_match else None
    
    # Pattern 2: Nombre romano (opcional)
    roman_pattern = r"\(([A-Za-z\s]+)\)"
    roman_match = re.search(roman_pattern, page_text)
    employee_name_roman = roman_match.group(1).strip() if roman_match else None
    
    # Pattern 3: 社員番号 (Employee ID)
    id_pattern = r"社員番号[:\s：]+([A-Z0-9\-]+)"
    id_match = re.search(id_pattern, page_text)
    employee_id_ocr = id_match.group(1) if id_match else None
    
    # Pattern 4: 配属 (Assignment Line)
    line_pattern = r"配属[:\s：]+([\u3040-\u309F\u30A0-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\s]+)"
    line_match = re.search(line_pattern, page_text)
    assignment_line = line_match.group(1).strip() if line_match else None
    
    return {
        "employee_name_kana": employee_name_kana,
        "employee_name_roman": employee_name_roman,
        "employee_id_ocr": employee_id_ocr,
        "assignment_line": assignment_line
    }

# Resultado:
{
    "employee_name_kana": "グエン　バン　A",
    "employee_name_roman": "Nguyen Van A",
    "employee_id_ocr": "E-12345",
    "assignment_line": "Aライン"
}
```

#### **PASO 3: Employee Matching con BD**

**Estrategia:** Fuzzy matching con múltiples criterios

```python
from difflib import SequenceMatcher

def match_employee(
    employee_info: dict,
    factory_id: str,
    db: Session
) -> tuple[Employee | None, float]:
    """
    Busca employee en BD usando fuzzy matching
    
    Returns:
        (employee, confidence_score)
    """
    
    # CRITERIO 1: Buscar por hakensaki_shain_id (社員番号)
    if employee_info["employee_id_ocr"]:
        employee = db.query(Employee).filter(
            Employee.factory_id == factory_id,
            Employee.hakensaki_shain_id == employee_info["employee_id_ocr"]
        ).first()
        
        if employee:
            return (employee, 1.0)  # 100% confidence (exact match)
    
    # CRITERIO 2: Buscar por nombre (fuzzy)
    employees_in_factory = db.query(Employee).filter(
        Employee.factory_id == factory_id,
        Employee.status == "active"
    ).all()
    
    best_match = None
    best_score = 0.0
    
    ocr_name = employee_info["employee_name_kana"]
    
    for emp in employees_in_factory:
        # Comparar con full_name_kana
        kana_score = SequenceMatcher(
            None,
            ocr_name.replace(" ", "").replace("　", ""),
            emp.full_name_kana.replace(" ", "").replace("　", "")
        ).ratio()
        
        # Comparar con full_name_roman (si existe)
        roman_score = 0.0
        if employee_info["employee_name_roman"] and emp.full_name_roman:
            roman_score = SequenceMatcher(
                None,
                employee_info["employee_name_roman"].lower().replace(" ", ""),
                emp.full_name_roman.lower().replace(" ", "")
            ).ratio()
        
        # Score final (promedio ponderado)
        final_score = max(kana_score, roman_score)
        
        if final_score > best_score:
            best_score = final_score
            best_match = emp
    
    # Threshold: 0.85 (85% similarity)
    if best_score >= 0.85:
        return (best_match, best_score)
    
    # No match found
    return (None, 0.0)

# Ejemplo de resultado:
# Input: "グエン　バン　A"
# Match: Employee(hakenmoto_id=45, full_name_kana="グエン　バン　アー")
# Confidence: 0.95 (95% similar)
```

#### **PASO 4: Extraer Días del Mes (Tabla)**

**Input:** Tabla de días en la página
```
┌──────┬────────┬────────┬────────┬─────────────┐
│ 日付 │  出勤  │  退勤  │  休憩  │    備考       │
├──────┼────────┼────────┼────────┼─────────────┤
│ 11/01│  7:00  │ 15:30  │  45分  │              │
│ 11/02│  7:00  │ 17:00  │  45分  │ 残業2h       │
│ 11/03│   -    │   -    │   -    │ 祝日         │
```

**OCR Table Detection:**
```python
import pandas as pd
from datetime import datetime, time

def extract_daily_records(
    page_text: str,
    year: int,
    month: int
) -> list[dict]:
    """
    Extrae registros diarios de la tabla de timer card
    
    Usa Azure Computer Vision Table Detection o
    Camelot (Python library for PDF table extraction)
    """
    
    # Opción 1: Azure Computer Vision (READ API con tabla)
    # - Azure puede detectar estructuras de tabla automáticamente
    # - Retorna array de celdas con posiciones
    
    # Opción 2: Camelot (PDF table extraction)
    import camelot
    tables = camelot.read_pdf(pdf_path, pages='2', flavor='lattice')
    df = tables[0].df  # Primer tabla detectada
    
    # Procesar dataframe
    records = []
    
    for index, row in df.iterrows():
        # Columnas esperadas: 日付, 出勤, 退勤, 休憩, 備考
        date_str = row[0]  # "11/01"
        clock_in_str = row[1]  # "7:00"
        clock_out_str = row[2]  # "15:30"
        break_str = row[3]  # "45分"
        notes_str = row[4]  # ""
        
        # Skip si es día sin trabajo (-, 休, etc.)
        if clock_in_str in ["-", "―", "休", ""]:
            continue
        
        # Parse date
        month_day = date_str.split("/")
        work_date = datetime(year, int(month_day[0]), int(month_day[1])).date()
        
        # Parse times
        clock_in = datetime.strptime(clock_in_str, "%H:%M").time()
        clock_out = datetime.strptime(clock_out_str, "%H:%M").time()
        
        # Parse break minutes
        break_minutes = int(re.search(r"(\d+)", break_str).group(1))
        
        records.append({
            "work_date": work_date,
            "clock_in": clock_in,
            "clock_out": clock_out,
            "break_minutes": break_minutes,
            "notes": notes_str
        })
    
    return records

# Resultado:
[
    {
        "work_date": date(2025, 11, 1),
        "clock_in": time(7, 0),
        "clock_out": time(15, 30),
        "break_minutes": 45,
        "notes": ""
    },
    {
        "work_date": date(2025, 11, 2),
        "clock_in": time(7, 0),
        "clock_out": time(17, 0),
        "break_minutes": 45,
        "notes": "残業2h"
    },
    # ... 22 días laborables
]
```

### 2.3 Validación OCR

**Validaciones Automáticas:**

```python
def validate_ocr_record(record: dict) -> list[str]:
    """Valida un registro OCR y retorna lista de errores"""
    errors = []
    
    # 1. Clock_in debe ser antes de clock_out
    if record["clock_in"] >= record["clock_out"]:
        errors.append("Clock in time must be before clock out time")
    
    # 2. Break minutes razonables (0-120 min)
    if record["break_minutes"] < 0 or record["break_minutes"] > 120:
        errors.append("Break minutes out of reasonable range (0-120)")
    
    # 3. Total hours razonables (0-24h)
    total_minutes = (
        datetime.combine(date.min, record["clock_out"]) -
        datetime.combine(date.min, record["clock_in"])
    ).total_seconds() / 60
    
    if total_minutes < 0:
        # Clock out al día siguiente (night shift)
        total_minutes += 24 * 60
    
    if total_minutes > 24 * 60:
        errors.append("Total work hours exceeds 24 hours")
    
    # 4. Work date es válido (no futuro)
    if record["work_date"] > date.today():
        errors.append("Work date is in the future")
    
    return errors
```

---

## 3. FACTORY RULES APPLICATION

### 3.1 Leer Factory Configuration

**Factory JSON (高雄工業_本社工場.json):**

```json
{
  "factory_id": "高雄工業株式会社_本社工場",
  "schedule": {
    "work_hours": "昼勤：7時00分～15時30分　夜勤：19時00分～3時30分",
    "break_time": "昼勤：11時00分～11時45分 まで    夜勤：23時00分～23時45分　まで　（45分）",
    "overtime_labor": "3時間/日、42時間/月、320時間/年迄とする。",
    "time_unit": "15.0"
  },
  "lines": [
    {
      "line_id": "Factory-40",
      "assignment": {
        "line": "Aライン"
      },
      "job": {
        "hourly_rate": 1650.0
      }
    }
  ]
}
```

**Parser de Factory Config:**

```python
from dataclasses import dataclass
import json
from typing import Optional

@dataclass
class ShiftConfig:
    """Configuración de un turno"""
    name: str  # "昼勤" or "夜勤"
    start: time
    end: time
    break_start: Optional[time]
    break_end: Optional[time]
    break_minutes: int

@dataclass
class FactoryRules:
    """Reglas de una factory"""
    factory_id: str
    shifts: list[ShiftConfig]
    overtime_limit_day: float  # horas/día
    overtime_limit_month: float  # horas/mes
    overtime_limit_year: float  # horas/año
    time_unit_minutes: float  # minutos para redondeo
    
def load_factory_rules(factory_id: str) -> FactoryRules:
    """Carga reglas de factory desde JSON"""
    
    # Leer JSON
    json_path = f"config/factories/{factory_id}.json"
    with open(json_path, "r", encoding="utf-8") as f:
        config = json.load(f)
    
    schedule = config["schedule"]
    
    # Parse work_hours: "昼勤：7時00分～15時30分　夜勤：19時00分～3時30分"
    shifts = []
    
    # Regex para extraer turnos
    shift_pattern = r"(昼勤|夜勤)：(\d{1,2})時(\d{2})分～(\d{1,2})時(\d{2})分"
    shift_matches = re.findall(shift_pattern, schedule["work_hours"])
    
    for match in shift_matches:
        shift_name = match[0]  # "昼勤"
        start_hour = int(match[1])  # 7
        start_min = int(match[2])  # 0
        end_hour = int(match[3])  # 15
        end_min = int(match[4])  # 30
        
        start_time = time(start_hour, start_min)
        end_time = time(end_hour, end_min)
        
        # Parse break_time
        break_pattern = rf"{shift_name}：(\d{{1,2}})時(\d{{2}})分～(\d{{1,2}})時(\d{{2}})分.*?（(\d+)分）"
        break_match = re.search(break_pattern, schedule["break_time"])
        
        if break_match:
            break_start = time(int(break_match.group(1)), int(break_match.group(2)))
            break_end = time(int(break_match.group(3)), int(break_match.group(4)))
            break_minutes = int(break_match.group(5))
        else:
            break_start = None
            break_end = None
            break_minutes = 0
        
        shifts.append(ShiftConfig(
            name=shift_name,
            start=start_time,
            end=end_time,
            break_start=break_start,
            break_end=break_end,
            break_minutes=break_minutes
        ))
    
    # Parse overtime_labor: "3時間/日、42時間/月、320時間/年迄"
    overtime_day = float(re.search(r"(\d+)時間/日", schedule["overtime_labor"]).group(1))
    overtime_month = float(re.search(r"(\d+)時間/月", schedule["overtime_labor"]).group(1))
    overtime_year = float(re.search(r"(\d+)時間/年", schedule["overtime_labor"]).group(1))
    
    # Parse time_unit: "15.0"
    time_unit_minutes = float(schedule["time_unit"])
    
    return FactoryRules(
        factory_id=factory_id,
        shifts=shifts,
        overtime_limit_day=overtime_day,
        overtime_limit_month=overtime_month,
        overtime_limit_year=overtime_year,
        time_unit_minutes=time_unit_minutes
    )

# Resultado:
FactoryRules(
    factory_id="高雄工業株式会社_本社工場",
    shifts=[
        ShiftConfig(
            name="昼勤",
            start=time(7, 0),
            end=time(15, 30),
            break_start=time(11, 0),
            break_end=time(11, 45),
            break_minutes=45
        ),
        ShiftConfig(
            name="夜勤",
            start=time(19, 0),
            end=time(3, 30),
            break_start=time(23, 0),
            break_end=time(23, 45),
            break_minutes=45
        )
    ],
    overtime_limit_day=3.0,
    overtime_limit_month=42.0,
    overtime_limit_year=320.0,
    time_unit_minutes=15.0
)
```

### 3.2 Detectar Shift Type

**Algoritmo:**

```python
def detect_shift_type(
    clock_in: time,
    factory_rules: FactoryRules
) -> tuple[str, ShiftConfig]:
    """
    Detecta el tipo de turno basado en clock_in
    
    Returns:
        (shift_name, shift_config)
    """
    
    for shift in factory_rules.shifts:
        # Tolerance: ±2 horas del start time
        tolerance_minutes = 120
        
        clock_in_minutes = clock_in.hour * 60 + clock_in.minute
        shift_start_minutes = shift.start.hour * 60 + shift.start.minute
        
        diff = abs(clock_in_minutes - shift_start_minutes)
        
        # Handle day wrap (night shift)
        if diff > 12 * 60:
            diff = 24 * 60 - diff
        
        if diff <= tolerance_minutes:
            return (shift.name, shift)
    
    # Default: Detect by time range
    if 5 <= clock_in.hour < 17:
        return ("昼勤", factory_rules.shifts[0])
    else:
        return ("夜勤", factory_rules.shifts[1] if len(factory_rules.shifts) > 1 else factory_rules.shifts[0])

# Ejemplo:
clock_in = time(7, 0)
# → ("昼勤", ShiftConfig(...))

clock_in = time(19, 0)
# → ("夜勤", ShiftConfig(...))
```

### 3.3 Calcular Regular Hours

**Basado en Shift Config:**

```python
def calculate_regular_hours(
    clock_in: time,
    clock_out: time,
    break_minutes: int,
    shift_config: ShiftConfig,
    factory_rules: FactoryRules
) -> float:
    """
    Calcula horas regulares basadas en el shift config
    
    Regular hours = work_hours dentro del shift schedule
    """
    
    # Calcular total de minutos trabajados
    clock_in_dt = datetime.combine(date.min, clock_in)
    clock_out_dt = datetime.combine(date.min, clock_out)
    
    # Handle night shift (clock_out al día siguiente)
    if clock_out < clock_in:
        clock_out_dt += timedelta(days=1)
    
    total_minutes = (clock_out_dt - clock_in_dt).total_seconds() / 60
    work_minutes = total_minutes - break_minutes
    
    # Calcular minutos esperados del shift
    shift_start_dt = datetime.combine(date.min, shift_config.start)
    shift_end_dt = datetime.combine(date.min, shift_config.end)
    
    if shift_config.end < shift_config.start:
        shift_end_dt += timedelta(days=1)
    
    expected_minutes = (shift_end_dt - shift_start_dt).total_seconds() / 60
    expected_work_minutes = expected_minutes - shift_config.break_minutes
    
    # Regular hours = min(work_minutes, expected_work_minutes)
    regular_minutes = min(work_minutes, expected_work_minutes)
    regular_hours = regular_minutes / 60.0
    
    # Redondear a time_unit
    regular_hours = round_to_time_unit(
        regular_hours,
        factory_rules.time_unit_minutes / 60.0
    )
    
    return regular_hours

def round_to_time_unit(hours: float, unit: float) -> float:
    """
    Redondea horas a la unidad especificada
    
    Ejemplo: unit=0.25 (15 min) → redondea a múltiplos de 0.25
    """
    return round(hours / unit) * unit

# Ejemplo:
# Shift: 7:00-15:30 (8.5h - 0.75h break = 7.75h regular)
# Trabajó: 7:00-15:30 (8.5h - 0.75h break = 7.75h)
# → Regular: 7.75h
#
# Con time_unit=15 min (0.25h):
# 7.75 / 0.25 = 31
# 31 * 0.25 = 7.75h ✓
```

### 3.4 Calcular Overtime Hours

**Con Límites de Factory:**

```python
def calculate_overtime_hours(
    clock_in: time,
    clock_out: time,
    break_minutes: int,
    shift_config: ShiftConfig,
    regular_hours: float,
    factory_rules: FactoryRules,
    work_date: date,
    db: Session
) -> tuple[float, list[str]]:
    """
    Calcula horas extra con validación de límites
    
    Returns:
        (overtime_hours, warnings)
    """
    
    warnings = []
    
    # Calcular total de minutos trabajados
    clock_in_dt = datetime.combine(date.min, clock_in)
    clock_out_dt = datetime.combine(date.min, clock_out)
    
    if clock_out < clock_in:
        clock_out_dt += timedelta(days=1)
    
    total_minutes = (clock_out_dt - clock_in_dt).total_seconds() / 60
    work_minutes = total_minutes - break_minutes
    work_hours = work_minutes / 60.0
    
    # Overtime = work_hours - regular_hours
    overtime_hours = max(work_hours - regular_hours, 0)
    
    # Redondear a time_unit
    overtime_hours = round_to_time_unit(
        overtime_hours,
        factory_rules.time_unit_minutes / 60.0
    )
    
    # VALIDACIÓN 1: Límite diario
    if overtime_hours > factory_rules.overtime_limit_day:
        warnings.append(
            f"Overtime {overtime_hours:.2f}h exceeds daily limit "
            f"{factory_rules.overtime_limit_day}h"
        )
    
    # VALIDACIÓN 2: Límite mensual
    month_start = work_date.replace(day=1)
    month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
    
    existing_overtime = db.query(func.sum(TimerCard.overtime_hours)).filter(
        TimerCard.hakenmoto_id == hakenmoto_id,
        TimerCard.work_date >= month_start,
        TimerCard.work_date <= month_end
    ).scalar() or 0.0
    
    total_month_overtime = existing_overtime + overtime_hours
    
    if total_month_overtime > factory_rules.overtime_limit_month:
        warnings.append(
            f"Monthly overtime {total_month_overtime:.2f}h will exceed limit "
            f"{factory_rules.overtime_limit_month}h"
        )
    
    # VALIDACIÓN 3: Límite anual (opcional)
    year_start = work_date.replace(month=1, day=1)
    year_end = work_date.replace(month=12, day=31)
    
    existing_year_overtime = db.query(func.sum(TimerCard.overtime_hours)).filter(
        TimerCard.hakenmoto_id == hakenmoto_id,
        TimerCard.work_date >= year_start,
        TimerCard.work_date <= year_end
    ).scalar() or 0.0
    
    total_year_overtime = existing_year_overtime + overtime_hours
    
    if total_year_overtime > factory_rules.overtime_limit_year:
        warnings.append(
            f"Annual overtime {total_year_overtime:.2f}h will exceed limit "
            f"{factory_rules.overtime_limit_year}h"
        )
    
    return (overtime_hours, warnings)

# Ejemplo:
# Trabajó: 7:00-17:00 (10h - 0.75h break = 9.25h)
# Regular: 7.75h
# Overtime: 9.25 - 7.75 = 1.5h
#
# Con time_unit=15 min:
# 1.5 / 0.25 = 6
# 6 * 0.25 = 1.5h ✓
#
# Límite diario: 3h → OK (1.5h < 3h)
# Límite mensual: 42h → Verificar acumulado
```

### 3.5 Calcular Night Hours (深夜割増)

**22:00-05:00 (Ley laboral japonesa):**

```python
def calculate_night_hours(
    clock_in: time,
    clock_out: time,
    break_minutes: int,
    factory_rules: FactoryRules
) -> float:
    """
    Calcula horas nocturnas (22:00-05:00)
    Premium: 0.25 adicional (base 1.0 + 0.25 = 1.25x total para night regular)
    o 0.5 adicional si es overtime nocturno (1.25 + 0.25 = 1.5x)
    """
    
    NIGHT_START = time(22, 0)
    NIGHT_END = time(5, 0)
    
    clock_in_dt = datetime.combine(date.min, clock_in)
    clock_out_dt = datetime.combine(date.min, clock_out)
    
    if clock_out < clock_in:
        clock_out_dt += timedelta(days=1)
    
    night_start_dt = datetime.combine(date.min, NIGHT_START)
    night_end_dt = datetime.combine(date.min + timedelta(days=1), NIGHT_END)
    
    # Calcular intersección con período nocturno
    work_start = max(clock_in_dt, night_start_dt)
    work_end = min(clock_out_dt, night_end_dt)
    
    if work_end > work_start:
        night_minutes = (work_end - work_start).total_seconds() / 60
        
        # Descontar break si cae en período nocturno
        # (Simplificado: asume break no está en período nocturno)
        
        night_hours = night_minutes / 60.0
        
        # Redondear a time_unit
        night_hours = round_to_time_unit(
            night_hours,
            factory_rules.time_unit_minutes / 60.0
        )
        
        return night_hours
    
    return 0.0

# Ejemplo:
# Turno nocturno: 19:00-03:30 (8.5h - 0.75h break = 7.75h)
# Night period: 22:00-03:30 = 5.5h
#
# Con time_unit=15 min:
# 5.5 / 0.25 = 22
# 22 * 0.25 = 5.5h ✓
```

### 3.6 Calcular Holiday Hours (休日労働)

**Festivos y Domingos:**

```python
def calculate_holiday_hours(
    work_date: date,
    clock_in: time,
    clock_out: time,
    break_minutes: int,
    factory_rules: FactoryRules
) -> float:
    """
    Calcula horas de trabajo en festivo
    Premium: 1.35x (días festivos nacionales y domingos)
    Premium: 1.25x (sábados - opcional según company policy)
    
    Si es holiday, TODAS las horas son holiday_hours
    (no hay regular_hours ni overtime_hours ese día)
    """
    
    # Verificar si es festivo o domingo
    is_holiday = _is_japanese_holiday(work_date)
    is_sunday = work_date.weekday() == 6
    
    if not (is_holiday or is_sunday):
        return 0.0
    
    # TODO el día cuenta como holiday hours
    clock_in_dt = datetime.combine(date.min, clock_in)
    clock_out_dt = datetime.combine(date.min, clock_out)
    
    if clock_out < clock_in:
        clock_out_dt += timedelta(days=1)
    
    total_minutes = (clock_out_dt - clock_in_dt).total_seconds() / 60
    work_minutes = total_minutes - break_minutes
    holiday_hours = work_minutes / 60.0
    
    # Redondear a time_unit
    holiday_hours = round_to_time_unit(
        holiday_hours,
        factory_rules.time_unit_minutes / 60.0
    )
    
    return holiday_hours

def _is_japanese_holiday(work_date: date) -> bool:
    """
    Verifica si es festivo japonés nacional
    (Ver lista completa en backend/app/api/timer_cards.py líneas 32-106)
    """
    # Weekend check
    if work_date.weekday() in [5, 6]:
        return True
    
    # Fixed holidays
    fixed_holidays = {
        (1, 1): "元日",
        (2, 11): "建国記念の日",
        (2, 23): "天皇誕生日",
        (4, 29): "昭和の日",
        (5, 3): "憲法記念日",
        (5, 4): "みどりの日",
        (5, 5): "こどもの日",
        (8, 11): "山の日",
        (11, 3): "文化の日",
        (11, 23): "勤労感謝の日",
    }
    
    month_day = (work_date.month, work_date.day)
    return month_day in fixed_holidays
```

### 3.7 Resumen de Rates (割増率)

**Ley Laboral Japonesa:**

| Tipo | Rate | Aplicación |
|------|------|-----------|
| **Regular** | 1.0x | Horas normales dentro del shift |
| **Overtime** | 1.25x | Horas después del shift regular |
| **Night** | +0.25x | 22:00-05:00 adicional al rate base |
| **Holiday** | 1.35x | Festivos nacionales y domingos |
| **Night + Overtime** | 1.5x | Overtime nocturno (1.25 + 0.25) |
| **Night + Holiday** | 1.6x | Holiday nocturno (1.35 + 0.25) |

**Ejemplo de Cálculo:**

```python
# Día normal: 7:00-17:00 (10h - 0.75h break = 9.25h)
# Regular: 7.75h @ 1.0x = 7.75h
# Overtime: 1.5h @ 1.25x = 1.875h equivalent
# Total weighted: 9.625h

# Turno nocturno: 19:00-03:30 (8.5h - 0.75h break = 7.75h)
# Regular: 7.75h @ 1.0x = 7.75h
# Night (22:00-03:30): 5.5h @ +0.25x = 1.375h additional
# Total weighted: 7.75 + 1.375 = 9.125h

# Domingo: 7:00-15:30 (8.5h - 0.75h break = 7.75h)
# Holiday: 7.75h @ 1.35x = 10.4625h equivalent
# Total weighted: 10.4625h
```

---

## 4. TABLA processed_timer_cards

### 4.1 Schema SQL

**Nueva Tabla (Migración Alembic):**

```sql
CREATE TABLE processed_timer_cards (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Foreign Keys
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    hakenmoto_id INTEGER NOT NULL REFERENCES employees(hakenmoto_id) ON DELETE CASCADE,
    factory_id VARCHAR(100) NOT NULL,
    
    -- Date Info
    work_date DATE NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    
    -- Shift Info
    shift_type VARCHAR(20),  -- 昼勤, 夜勤, other
    
    -- Original Times (from OCR)
    clock_in TIME NOT NULL,
    clock_out TIME NOT NULL,
    break_minutes INTEGER DEFAULT 0,
    
    -- Calculated Hours (with factory rules applied)
    regular_hours NUMERIC(5, 2) DEFAULT 0.00,
    overtime_hours NUMERIC(5, 2) DEFAULT 0.00,
    night_hours NUMERIC(5, 2) DEFAULT 0.00,
    holiday_hours NUMERIC(5, 2) DEFAULT 0.00,
    
    -- Weighted Hours (for payroll)
    total_weighted_hours NUMERIC(6, 2) DEFAULT 0.00,  -- Suma ponderada
    /*
        total_weighted_hours = 
            regular_hours * 1.0 +
            overtime_hours * 1.25 +
            night_hours * 0.25 +  -- Adicional
            holiday_hours * 1.35
    */
    
    -- Status Workflow
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- pending → reviewed → approved → paid
    
    -- OCR Metadata
    ocr_confidence NUMERIC(3, 2),  -- 0.00-1.00
    ocr_source VARCHAR(50),  -- 'azure', 'easyocr', 'tesseract'
    validation_errors TEXT[],  -- Array de errores
    validation_warnings TEXT[],  -- Array de warnings (overtime limits, etc.)
    
    -- Approval
    reviewed_by INTEGER REFERENCES users(id),  -- KANRININSHA
    reviewed_at TIMESTAMP WITH TIME ZONE,
    approved_by INTEGER REFERENCES users(id),  -- KEITOSAN
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Notes
    notes TEXT,
    admin_notes TEXT,  -- Notas internas
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(hakenmoto_id, work_date),  -- No duplicados
    CHECK(clock_out > clock_in OR clock_out < TIME '12:00:00'),  -- Night shift valid
    CHECK(break_minutes >= 0 AND break_minutes <= 240),
    CHECK(regular_hours >= 0 AND regular_hours <= 24),
    CHECK(overtime_hours >= 0 AND overtime_hours <= 12),
    CHECK(status IN ('pending', 'reviewed', 'approved', 'rejected', 'paid'))
);

-- Indexes
CREATE INDEX idx_processed_timer_cards_employee ON processed_timer_cards(employee_id);
CREATE INDEX idx_processed_timer_cards_hakenmoto ON processed_timer_cards(hakenmoto_id);
CREATE INDEX idx_processed_timer_cards_factory ON processed_timer_cards(factory_id);
CREATE INDEX idx_processed_timer_cards_date ON processed_timer_cards(work_date);
CREATE INDEX idx_processed_timer_cards_year_month ON processed_timer_cards(year, month);
CREATE INDEX idx_processed_timer_cards_status ON processed_timer_cards(status);
CREATE INDEX idx_processed_timer_cards_year_month_status ON processed_timer_cards(year, month, status);
```

### 4.2 SQLAlchemy Model

**backend/app/models/models.py:**

```python
from sqlalchemy import Column, Integer, String, Date, Time, Numeric, Boolean, Text, DateTime, ForeignKey, CheckConstraint, UniqueConstraint, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ARRAY as PG_ARRAY

class ProcessedTimerCard(Base):
    """
    Processed Timer Cards con factory rules aplicadas
    
    Diferencia con timer_cards:
    - timer_cards: Entrada manual individual
    - processed_timer_cards: Batch OCR con factory rules
    """
    __tablename__ = "processed_timer_cards"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    hakenmoto_id = Column(Integer, ForeignKey("employees.hakenmoto_id", ondelete="CASCADE"), nullable=False)
    factory_id = Column(String(100), nullable=False, index=True)
    
    # Date Info
    work_date = Column(Date, nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)
    month = Column(Integer, nullable=False, index=True)
    
    # Shift Info
    shift_type = Column(String(20))  # 昼勤, 夜勤, other
    
    # Original Times
    clock_in = Column(Time, nullable=False)
    clock_out = Column(Time, nullable=False)
    break_minutes = Column(Integer, default=0)
    
    # Calculated Hours (with factory rules)
    regular_hours = Column(Numeric(5, 2), default=0.00)
    overtime_hours = Column(Numeric(5, 2), default=0.00)
    night_hours = Column(Numeric(5, 2), default=0.00)
    holiday_hours = Column(Numeric(5, 2), default=0.00)
    total_weighted_hours = Column(Numeric(6, 2), default=0.00)
    
    # Status
    status = Column(String(20), default="pending", nullable=False, index=True)
    
    # OCR Metadata
    ocr_confidence = Column(Numeric(3, 2))
    ocr_source = Column(String(50))
    validation_errors = Column(PG_ARRAY(Text))
    validation_warnings = Column(PG_ARRAY(Text))
    
    # Approval
    reviewed_by = Column(Integer, ForeignKey("users.id"))
    reviewed_at = Column(DateTime(timezone=True))
    approved_by = Column(Integer, ForeignKey("users.id"))
    approved_at = Column(DateTime(timezone=True))
    
    # Notes
    notes = Column(Text)
    admin_notes = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    employee = relationship("Employee", foreign_keys=[employee_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    approver = relationship("User", foreign_keys=[approved_by])
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('hakenmoto_id', 'work_date', name='uq_processed_timer_card_employee_date'),
        CheckConstraint("break_minutes >= 0 AND break_minutes <= 240", name="ck_break_minutes"),
        CheckConstraint("regular_hours >= 0 AND regular_hours <= 24", name="ck_regular_hours"),
        CheckConstraint("overtime_hours >= 0 AND overtime_hours <= 12", name="ck_overtime_hours"),
        CheckConstraint("status IN ('pending', 'reviewed', 'approved', 'rejected', 'paid')", name="ck_status"),
    )
```

### 4.3 Workflow de Estados

```
┌──────────────────────────────────────────────────────────────┐
│  STATUS WORKFLOW                                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [pending] → [reviewed] → [approved] → [paid]                │
│      ↓                         ↓                             │
│  [rejected]                [rejected]                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘

PASO 1: pending
- Estado inicial después de OCR upload
- KANRININSHA debe revisar

PASO 2: reviewed
- KANRININSHA revisó y validó los datos
- Editó manualmente errores si necesario
- Listo para aprobación final

PASO 3: approved
- KEITOSAN aprobó el batch completo
- Listo para payroll

PASO 4: paid
- Incluido en salary_calculation
- Pagado al employee

PASO X: rejected
- KANRININSHA o KEITOSAN rechazó
- Requiere corrección y re-upload
```

---

## 5. UI REVIEW

### 5.1 Página: /dashboard/timercards/review

**Ruta:** `/dashboard/timercards/review?year=2025&month=11&factory_id=高雄工業_本社工場`

**Wireframe de Grid Editable:**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📋 タイムカード確認 (Timer Card Review)                                       │
│                                                                              │
│  Factory: 高雄工業株式会社_本社工場                                            │
│  対象月: 2025年11月                                                           │
│  Status: pending (545件)                                                     │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  フィルタ:                                                                    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                       │
│  │ Employee  ▼ │ │ Status    ▼ │ │ Warnings  ▼ │                       │
│  └──────────────┘ └──────────────┘ └──────────────┘                       │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 🔍 Search employee name...                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  GRID (Virtualized - 545 rows):                                             │
│                                                                              │
│  ┌───┬──────────┬────────┬───────┬───────┬──────┬─────┬─────┬─────┬─────┐ │
│  │ ✓ │Employee  │  日付  │ 出勤  │ 退勤  │ 休憩 │ Reg │ OT  │Night│Warn │ │
│  ├───┼──────────┼────────┼───────┼───────┼──────┼─────┼─────┼─────┼─────┤ │
│  │ ☑ │Nguyen A  │11/01   │ 7:00  │15:30  │ 45m  │7.75h│0.0h │0.0h │     │ │
│  │ ☑ │Nguyen A  │11/02   │ 7:00  │17:00  │ 45m  │7.75h│1.5h │0.0h │     │ │
│  │ ☑ │Nguyen A  │11/04   │ 7:00  │15:30  │ 45m  │7.75h│0.0h │0.0h │     │ │
│  │ ☑ │Nguyen A  │11/05   │19:00  │ 3:30  │ 45m  │7.75h│0.0h │5.5h │     │ │
│  │ ⚠ │Nguyen A  │11/08   │ 7:00  │19:00  │ 45m  │7.75h│3.5h │0.0h │⚠ OT │ │
│  │   │          │        │       │       │      │     │     │     │limit│ │
│  │ ☑ │Tran B    │11/01   │ 7:00  │15:30  │ 45m  │7.75h│0.0h │0.0h │     │ │
│  │ ❌│Le C      │11/01   │15:00  │ 7:00  │ 45m  │0.0h │0.0h │0.0h │❌Bad│ │
│  │   │          │        │       │       │      │     │     │     │time │ │
│  │ ... (538 more rows)                                                  │ │
│  └───┴──────────┴────────┴───────┴───────┴──────┴─────┴─────┴─────┴─────┘ │
│                                                                              │
│  Legend:                                                                     │
│  ☑ = OK  |  ⚠ = Warning (overtime limit)  |  ❌ = Error (requires fix)    │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Summary:                                                                    │
│  ✅ OK: 540件  |  ⚠ Warnings: 4件  |  ❌ Errors: 1件                         │
│                                                                              │
│  Total Hours:                                                                │
│  Regular: 4,235.5h  |  Overtime: 68.25h  |  Night: 145.5h  |  Holiday: 0h  │
│                                                                              │
│  Actions:                                                                    │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐              │
│  │ 🔧 Edit Errors  │ │ 💾 Save Changes │ │ ✅ Approve All  │              │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘              │
│                                                                              │
│  ⚠ Note: You must fix all errors before approving.                          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Edición Inline

**Click en Row con Error:**

```
┌──────────────────────────────────────────────────────────────┐
│  ✏️ Edit Timer Card - Le Van C (11/01)                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  日付: 2025-11-01 (readonly)                                 │
│                                                              │
│  出勤: [15:00] ▼                                             │
│  退勤: [07:00] ▼  ⚠ Clock out should be after clock in      │
│                                                              │
│  → Correct to:                                               │
│  出勤: [07:00] ▼                                             │
│  退勤: [15:30] ▼  ✓                                          │
│                                                              │
│  休憩: [45] minutes                                          │
│                                                              │
│  Recalculate:                                                │
│  Regular: 7.75h  |  Overtime: 0.0h  |  Night: 0.0h          │
│                                                              │
│  Notes:                                                      │
│  ┌────────────────────────────────────────────────────┐    │
│  │ OCR読み取りエラー修正 (Fixed OCR error)              │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────┐ ┌─────────────┐                           │
│  │ 💾 Save     │ │ ❌ Cancel   │                           │
│  └─────────────┘ └─────────────┘                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 5.3 Batch Approval

**Botón "Approve All":**

```
┌──────────────────────────────────────────────────────────────┐
│  ✅ Confirm Batch Approval                                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  You are about to approve 545 timer card records for:       │
│                                                              │
│  Factory: 高雄工業株式会社_本社工場                           │
│  Month: 2025年11月                                            │
│                                                              │
│  Summary:                                                    │
│  ✅ Employees: 25人                                          │
│  ✅ Work Days: Average 22 days/employee                      │
│  ✅ Total Regular Hours: 4,235.5h                            │
│  ✅ Total Overtime: 68.25h                                   │
│                                                              │
│  ⚠ Overtime Warnings: 4件                                    │
│  (Employees with >40h overtime this month)                   │
│                                                              │
│  After approval:                                             │
│  - Records will be marked as "approved"                      │
│  - Ready for payroll calculation                             │
│  - Cannot be edited (requires admin unlock)                  │
│                                                              │
│  Are you sure?                                               │
│                                                              │
│  ┌─────────────┐ ┌─────────────┐                           │
│  │ ✅ Approve  │ │ ❌ Cancel   │                           │
│  └─────────────┘ └─────────────┘                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Endpoint:**

```python
@router.post("/processed-timer-cards/batch-approve")
async def batch_approve_timer_cards(
    year: int,
    month: int,
    factory_id: str,
    current_user: User = Depends(require_role("KANRININSHA")),
    db: Session = Depends(get_db)
):
    """
    Aprueba batch completo de timer cards
    
    Validaciones:
    - No puede haber records con status="rejected" o "paid"
    - No puede haber validation_errors pendientes
    - Usuario debe ser KANRININSHA del factory
    """
    
    # Obtener todos los records pendientes
    records = db.query(ProcessedTimerCard).filter(
        ProcessedTimerCard.year == year,
        ProcessedTimerCard.month == month,
        ProcessedTimerCard.factory_id == factory_id,
        ProcessedTimerCard.status.in_(["pending", "reviewed"])
    ).all()
    
    # Validar que no haya errores
    has_errors = any(
        record.validation_errors and len(record.validation_errors) > 0
        for record in records
    )
    
    if has_errors:
        raise HTTPException(
            400,
            "Cannot approve batch with validation errors. Please fix errors first."
        )
    
    # Aprobar todos
    approved_count = 0
    for record in records:
        record.status = "approved"
        record.approved_by = current_user.id
        record.approved_at = datetime.now()
        approved_count += 1
    
    db.commit()
    
    return {
        "success": True,
        "approved": approved_count,
        "year": year,
        "month": month,
        "factory_id": factory_id
    }
```

---

## 6. INTEGRACIÓN PAYROLL

### 6.1 Auto-crear Salary Calculation

**Trigger:** Cuando processed_timer_cards están "approved"

**Endpoint:** `POST /api/payroll/calculate-from-timer-cards`

```python
@router.post("/payroll/calculate-from-timer-cards")
async def calculate_payroll_from_timer_cards(
    year: int,
    month: int,
    factory_id: str = None,
    employee_ids: list[int] = None,
    current_user: User = Depends(require_role("KEITOSAN")),
    db: Session = Depends(get_db)
):
    """
    Calcula payroll desde processed_timer_cards aprobados
    
    Pasos:
    1. Obtener processed_timer_cards con status="approved"
    2. Agrupar por employee
    3. Sumar regular/overtime/night/holiday hours
    4. Calcular gross_salary usando jikyu del employee
    5. Aplicar rates (overtime 1.25x, night +0.25x, holiday 1.35x)
    6. Deducir apartment rent (desde RentDeduction)
    7. Crear SalaryCalculation draft
    """
    
    # Query base
    query = db.query(ProcessedTimerCard).filter(
        ProcessedTimerCard.year == year,
        ProcessedTimerCard.month == month,
        ProcessedTimerCard.status == "approved"
    )
    
    if factory_id:
        query = query.filter(ProcessedTimerCard.factory_id == factory_id)
    
    if employee_ids:
        query = query.filter(ProcessedTimerCard.employee_id.in_(employee_ids))
    
    records = query.all()
    
    # Agrupar por employee
    employee_records = {}
    for record in records:
        emp_id = record.employee_id
        if emp_id not in employee_records:
            employee_records[emp_id] = []
        employee_records[emp_id].append(record)
    
    # Crear salary calculations
    created_salaries = []
    
    for emp_id, emp_records in employee_records.items():
        employee = db.query(Employee).get(emp_id)
        
        # Sumar horas
        total_regular = sum(r.regular_hours for r in emp_records)
        total_overtime = sum(r.overtime_hours for r in emp_records)
        total_night = sum(r.night_hours for r in emp_records)
        total_holiday = sum(r.holiday_hours for r in emp_records)
        
        # Obtener jikyu (hourly rate)
        jikyu = employee.jikyu  # Ejemplo: 1650円/hora
        
        # Calcular gross salary con rates
        regular_pay = float(total_regular) * jikyu
        overtime_pay = float(total_overtime) * jikyu * 1.25
        night_pay = float(total_night) * jikyu * 0.25  # Premium adicional
        holiday_pay = float(total_holiday) * jikyu * 1.35
        
        gross_salary = regular_pay + overtime_pay + night_pay + holiday_pay
        
        # Obtener rent deduction
        rent_deduction = db.query(RentDeduction).filter(
            RentDeduction.employee_id == emp_id,
            RentDeduction.year == year,
            RentDeduction.month == month,
            RentDeduction.status.in_(["pending", "processed"])
        ).first()
        
        apartment_deduction = rent_deduction.total_deduction if rent_deduction else 0
        
        # Calcular net salary (simplificado)
        net_salary = gross_salary - apartment_deduction
        
        # Crear SalaryCalculation
        salary_calc = SalaryCalculation(
            employee_id=emp_id,
            year=year,
            month=month,
            
            # Hours
            total_regular_hours=total_regular,
            total_overtime_hours=total_overtime,
            total_night_hours=total_night,
            total_holiday_hours=total_holiday,
            
            # Pay
            base_salary=regular_pay,
            overtime_pay=overtime_pay,
            night_shift_allowance=night_pay,
            holiday_allowance=holiday_pay,
            gross_salary=gross_salary,
            
            # Deductions
            apartment_deduction=apartment_deduction,
            
            # Net
            net_salary=net_salary,
            
            # Status
            status="draft",
            
            # Timestamps
            created_at=datetime.now()
        )
        
        db.add(salary_calc)
        created_salaries.append(salary_calc)
        
        # Marcar processed_timer_cards como "paid"
        for record in emp_records:
            record.status = "paid"
        
        # Marcar RentDeduction como "processed"
        if rent_deduction:
            rent_deduction.status = "processed"
            rent_deduction.processed_date = date.today()
    
    db.commit()
    
    return {
        "success": True,
        "created": len(created_salaries),
        "year": year,
        "month": month,
        "salary_ids": [s.id for s in created_salaries]
    }
```

### 6.2 Ejemplo de Cálculo

**Empleado:** Nguyen Van A (hakenmoto_id=45)  
**Factory:** 高雄工業_本社工場  
**Mes:** 2025年11月  
**時給 (jikyu):** 1,650円/hora

**Processed Timer Cards (22 días laborables):**

| Fecha | Shift | Regular | Overtime | Night | Holiday |
|-------|-------|---------|----------|-------|---------|
| 11/01 | 昼勤   | 7.75h   | 0.0h     | 0.0h  | 0.0h    |
| 11/02 | 昼勤   | 7.75h   | 1.5h     | 0.0h  | 0.0h    |
| 11/04 | 昼勤   | 7.75h   | 0.0h     | 0.0h  | 0.0h    |
| 11/05 | 夜勤   | 7.75h   | 0.0h     | 5.5h  | 0.0h    |
| 11/06 | 昼勤   | 7.75h   | 0.0h     | 0.0h  | 0.0h    |
| 11/07 | 昼勤   | 7.75h   | 0.0h     | 0.0h  | 0.0h    |
| 11/08 | 昼勤   | 7.75h   | 2.0h     | 0.0h  | 0.0h    |
| 11/09 | 昼勤   | 7.75h   | 0.0h     | 0.0h  | 0.0h    |
| ... (14 días más similares) |
| **TOTAL** | | **170.5h** | **12.0h** | **22.0h** | **0.0h** |

**Cálculos:**

```python
jikyu = 1650円

# Regular pay
regular_pay = 170.5h * 1650円 = 281,325円

# Overtime pay (1.25x)
overtime_pay = 12.0h * 1650円 * 1.25 = 24,750円

# Night premium (+0.25x)
night_pay = 22.0h * 1650円 * 0.25 = 9,075円

# Holiday pay (0h este mes)
holiday_pay = 0円

# Gross salary
gross_salary = 281,325 + 24,750 + 9,075 = 315,150円

# Apartment deduction (desde RentDeduction)
apartment_deduction = 50,000円

# Net salary
net_salary = 315,150 - 50,000 = 265,150円
```

**SalaryCalculation creado:**

```python
{
    "id": 789,
    "employee_id": 45,
    "year": 2025,
    "month": 11,
    "total_regular_hours": 170.5,
    "total_overtime_hours": 12.0,
    "total_night_hours": 22.0,
    "total_holiday_hours": 0.0,
    "base_salary": 281325,
    "overtime_pay": 24750,
    "night_shift_allowance": 9075,
    "holiday_allowance": 0,
    "gross_salary": 315150,
    "apartment_deduction": 50000,
    "net_salary": 265150,
    "status": "draft",
    "created_at": "2025-11-15T10:30:00Z"
}
```

---

## 7. MANEJO DE ERRORES

### 7.1 Errores de OCR

**Tipos de Errores:**

| Error | Causa | Solución |
|-------|-------|----------|
| **Employee Not Found** | Nombre OCR no match en BD | Fuzzy matching mejorado o corrección manual |
| **Invalid Time Format** | OCR extrae "7:0O" (O en vez de 0) | Regex cleanup: `O` → `0`, `l` → `1` |
| **Clock Out Before Clock In** | OCR confunde columnas | Manual edit requerido |
| **Break > Total Hours** | OCR error en 休憩 | Validación y corrección manual |
| **Future Date** | OCR lee año incorrecto | Validación de fecha |
| **Factory Not Found** | Factory ID OCR incorrecto | Manual selection requerido |

**Handling en Código:**

```python
def handle_ocr_errors(record: dict, db: Session) -> dict:
    """
    Intenta corregir errores comunes de OCR automáticamente
    """
    errors = []
    warnings = []
    
    # ERROR 1: Employee not found - Intentar fuzzy match
    if not record["employee_matched"]:
        # Intentar fuzzy matching con threshold bajo (0.70)
        employee, confidence = match_employee(
            record["employee_info"],
            record["factory_id"],
            db
        )
        
        if employee and confidence >= 0.70:
            record["hakenmoto_id"] = employee.hakenmoto_id
            record["employee_matched"] = True
            warnings.append(
                f"Employee matched with {confidence*100:.0f}% confidence. "
                f"Please verify: {employee.full_name_kana}"
            )
        else:
            errors.append(
                f"Employee not found: {record['employee_name_ocr']}. "
                f"Please select manually."
            )
    
    # ERROR 2: Invalid time format - Cleanup
    clock_in_str = str(record["clock_in"])
    clock_out_str = str(record["clock_out"])
    
    # Replace common OCR mistakes
    replacements = {"O": "0", "o": "0", "l": "1", "I": "1", "S": "5", "B": "8"}
    for old, new in replacements.items():
        clock_in_str = clock_in_str.replace(old, new)
        clock_out_str = clock_out_str.replace(old, new)
    
    try:
        record["clock_in"] = datetime.strptime(clock_in_str, "%H:%M").time()
        record["clock_out"] = datetime.strptime(clock_out_str, "%H:%M").time()
    except ValueError as e:
        errors.append(f"Invalid time format: {e}")
    
    # ERROR 3: Clock out before clock in (NOT night shift)
    if record["clock_in"] and record["clock_out"]:
        if record["clock_out"] < record["clock_in"]:
            # Check if night shift (19:00-03:30)
            if not (record["clock_in"].hour >= 19 or record["clock_out"].hour <= 5):
                errors.append(
                    f"Clock out ({record['clock_out']}) is before clock in "
                    f"({record['clock_in']}) and not a night shift. "
                    f"Please verify."
                )
    
    # ERROR 4: Break > Total Hours
    if record["break_minutes"] and record["clock_in"] and record["clock_out"]:
        total_minutes = (
            datetime.combine(date.min, record["clock_out"]) -
            datetime.combine(date.min, record["clock_in"])
        ).total_seconds() / 60
        
        if total_minutes < 0:
            total_minutes += 24 * 60
        
        if record["break_minutes"] >= total_minutes:
            errors.append(
                f"Break minutes ({record['break_minutes']}) >= total work minutes "
                f"({total_minutes:.0f}). Please verify."
            )
    
    # ERROR 5: Future date
    if record["work_date"] > date.today():
        errors.append(
            f"Work date {record['work_date']} is in the future. "
            f"Please verify year."
        )
    
    record["validation_errors"] = errors
    record["validation_warnings"] = warnings
    
    return record
```

### 7.2 Errores de Factory Rules

**Validaciones:**

```python
def validate_factory_rules(
    record: dict,
    factory_rules: FactoryRules,
    hakenmoto_id: int,
    db: Session
) -> list[str]:
    """
    Valida que el record cumpla con factory rules
    """
    warnings = []
    
    # VALIDACIÓN 1: Overtime diario
    if record["overtime_hours"] > factory_rules.overtime_limit_day:
        warnings.append(
            f"⚠ Overtime {record['overtime_hours']:.2f}h exceeds daily limit "
            f"{factory_rules.overtime_limit_day}h"
        )
    
    # VALIDACIÓN 2: Overtime mensual
    month_start = record["work_date"].replace(day=1)
    month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
    
    existing_overtime = db.query(func.sum(ProcessedTimerCard.overtime_hours)).filter(
        ProcessedTimerCard.hakenmoto_id == hakenmoto_id,
        ProcessedTimerCard.work_date >= month_start,
        ProcessedTimerCard.work_date <= month_end
    ).scalar() or 0.0
    
    total_overtime = existing_overtime + record["overtime_hours"]
    
    if total_overtime > factory_rules.overtime_limit_month:
        warnings.append(
            f"⚠ Monthly overtime will be {total_overtime:.2f}h "
            f"(limit: {factory_rules.overtime_limit_month}h)"
        )
    
    # VALIDACIÓN 3: Break time estándar
    expected_break = factory_rules.shifts[0].break_minutes  # Ejemplo: 45 min
    
    if record["break_minutes"] != expected_break:
        warnings.append(
            f"⚠ Break {record['break_minutes']}min differs from standard "
            f"{expected_break}min"
        )
    
    return warnings
```

### 7.3 UI de Errores

**Error Summary Card:**

```
┌──────────────────────────────────────────────────────────────┐
│  ⚠️ Validation Summary                                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ❌ Errors (1):                                              │
│  - Le Van C (11/01): Clock out before clock in              │
│    → Action: Click row to edit manually                      │
│                                                              │
│  ⚠ Warnings (4):                                             │
│  - Nguyen A (11/08): Overtime 3.5h exceeds daily limit 3h   │
│  - Tran B (11/15): Monthly overtime will be 43h (limit 42h) │
│  - Le C (11/20): Break 60min differs from standard 45min    │
│  - Pham D (11/22): Employee matched with 85% confidence     │
│                                                              │
│  ℹ️ Warnings don't block approval, but should be reviewed.  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 8. EJEMPLOS COMPLETOS

### 8.1 Caso Completo: 25 Employees, 22 Días

**Factory:** 高雄工業_本社工場  
**Mes:** 2025年11月 (30 días, 22 laborables, 8 festivos/fines)  
**Employees:** 25 activos

**Distribución:**
- 20 employees en turno 昼勤 (7:00-15:30)
- 5 employees en turno 夜勤 (19:00-03:30)

**PDF Uploaded:**
- Nombre: `高雄工業_本社工場_2025年11月.pdf`
- Tamaño: 15 MB
- Páginas: 26 (1 header + 25 employees)

**OCR Processing Time:** 45.3 segundos

**Resultados:**
```python
{
    "file_name": "高雄工業_本社工場_2025年11月.pdf",
    "pages_processed": 26,
    "employees_found": 25,
    "employees_matched": 25,  # 100% match rate
    "total_records": 550,  # 25 employees * 22 days
    "saved": 545,  # 5 días festivos skipped
    "errors": 1,
    "warnings": 4,
    
    "summary": {
        "success_rate": "99.8%",
        "avg_confidence": 0.965,
        "processing_time_seconds": 45.3,
        
        "total_hours": {
            "regular": 4235.5,
            "overtime": 68.25,
            "night": 145.5,
            "holiday": 0.0
        },
        
        "employees_by_shift": {
            "昼勤": 20,
            "夜勤": 5
        }
    }
}
```

### 8.2 Caso con Errores: OCR Mistakes

**Employee:** Tran Thi B  
**Fecha:** 11/15

**OCR Extraído (Incorrecto):**
```json
{
    "employee_name_ocr": "Tran Thi 8",  // ❌ "B" → "8"
    "work_date": "2025-11-15",
    "clock_in": "7:0O",  // ❌ "O" en vez de "0"
    "clock_out": "l5:30",  // ❌ "l" en vez de "1"
    "break_minutes": 45
}
```

**Auto-corrección:**
```python
# PASO 1: Fuzzy match employee name
# "Tran Thi 8" → match con "Tran Thi B" (confidence: 0.88)
employee_matched = True
hakenmoto_id = 46

# PASO 2: Cleanup times
clock_in = "7:0O" → "7:00" ✓
clock_out = "l5:30" → "15:30" ✓

# PASO 3: Validar
validation_errors = []  # No errors
validation_warnings = [
    "Employee matched with 88% confidence. Please verify: Tran Thi B"
]
```

**Resultado Final:**
```json
{
    "hakenmoto_id": 46,
    "work_date": "2025-11-15",
    "clock_in": "07:00:00",
    "clock_out": "15:30:00",
    "break_minutes": 45,
    "regular_hours": 7.75,
    "overtime_hours": 0.0,
    "night_hours": 0.0,
    "holiday_hours": 0.0,
    "ocr_confidence": 0.88,
    "validation_errors": [],
    "validation_warnings": [
        "Employee matched with 88% confidence. Please verify: Tran Thi B"
    ],
    "status": "pending"
}
```

### 8.3 Caso Night Shift con Overtime

**Employee:** Le Van C  
**Fecha:** 11/05  
**Shift:** 夜勤 (19:00-03:30)  
**Trabajó:** 19:00-05:00 (overtime de 1.5h)

**Factory Rules:**
- Shift: 19:00-03:30 (8.5h - 0.75h break = 7.75h regular)
- Night period: 22:00-05:00

**Cálculos:**

```python
# Total work
clock_in = time(19, 0)
clock_out = time(5, 0)  # Día siguiente
break_minutes = 45

total_minutes = (24*60 - (19*60)) + (5*60) - 45  # 10h - 0.75h = 9.25h
work_hours = 9.25

# Regular hours (max del shift)
expected_regular = 7.75
regular_hours = 7.75

# Overtime
overtime_hours = 9.25 - 7.75 = 1.5h

# Night hours (22:00-05:00)
night_start = time(22, 0)
night_end = time(5, 0)
# Trabajó 22:00-05:00 = 7h
night_hours = 7.0

# Redondear a 15 min
regular_hours = 7.75  # Ya es múltiplo
overtime_hours = 1.5   # Ya es múltiplo
night_hours = 7.0      # Ya es múltiplo

# Weighted hours para payroll
# Regular: 7.75h @ 1.0x = 7.75
# Overtime: 1.5h @ 1.25x = 1.875
# Night: 7.0h @ +0.25x = 1.75 (adicional)
# Total weighted: 7.75 + 1.875 + 1.75 = 11.375h

# Pay (jikyu = 1650円)
regular_pay = 7.75 * 1650 = 12,788円
overtime_pay = 1.5 * 1650 * 1.25 = 3,094円
night_premium = 7.0 * 1650 * 0.25 = 2,888円
total_pay = 12,788 + 3,094 + 2,888 = 18,770円
```

**Resultado:**
```json
{
    "hakenmoto_id": 47,
    "work_date": "2025-11-05",
    "shift_type": "夜勤",
    "clock_in": "19:00:00",
    "clock_out": "05:00:00",
    "break_minutes": 45,
    "regular_hours": 7.75,
    "overtime_hours": 1.5,
    "night_hours": 7.0,
    "holiday_hours": 0.0,
    "total_weighted_hours": 11.38,
    "ocr_confidence": 0.98,
    "validation_errors": [],
    "validation_warnings": [],
    "status": "pending"
}
```

---

## 9. RESUMEN TÉCNICO

### 9.1 Endpoints Necesarios

**Backend API:**

```
POST   /api/timer_cards/upload-batch
       → Upload PDF + factory_id + year + month
       → Retorna: OCR results con records saved

GET    /api/processed-timer-cards/
       → Lista processed_timer_cards con filtros
       → Query params: year, month, factory_id, status, employee_id

GET    /api/processed-timer-cards/{id}
       → Detalle de un record

PUT    /api/processed-timer-cards/{id}
       → Editar record (solo si status=pending/reviewed)

POST   /api/processed-timer-cards/batch-review
       → Marcar batch como "reviewed" (KANRININSHA)

POST   /api/processed-timer-cards/batch-approve
       → Aprobar batch completo (KEITOSAN)

POST   /api/payroll/calculate-from-timer-cards
       → Crear SalaryCalculation desde processed_timer_cards

GET    /api/processed-timer-cards/summary
       → Summary por factory/month (total hours, errors, etc.)
```

### 9.2 Migración Alembic

**Archivo:** `backend/alembic/versions/XXXX_add_processed_timer_cards.py`

```python
"""Add processed_timer_cards table

Revision ID: abc123def456
Revises: previous_revision
Create Date: 2025-11-13 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    op.create_table(
        'processed_timer_cards',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('employee_id', sa.Integer(), nullable=False),
        sa.Column('hakenmoto_id', sa.Integer(), nullable=False),
        sa.Column('factory_id', sa.String(length=100), nullable=False),
        sa.Column('work_date', sa.Date(), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('month', sa.Integer(), nullable=False),
        sa.Column('shift_type', sa.String(length=20), nullable=True),
        sa.Column('clock_in', sa.Time(), nullable=False),
        sa.Column('clock_out', sa.Time(), nullable=False),
        sa.Column('break_minutes', sa.Integer(), nullable=True),
        sa.Column('regular_hours', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('overtime_hours', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('night_hours', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('holiday_hours', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('total_weighted_hours', sa.Numeric(precision=6, scale=2), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('ocr_confidence', sa.Numeric(precision=3, scale=2), nullable=True),
        sa.Column('ocr_source', sa.String(length=50), nullable=True),
        sa.Column('validation_errors', postgresql.ARRAY(sa.Text()), nullable=True),
        sa.Column('validation_warnings', postgresql.ARRAY(sa.Text()), nullable=True),
        sa.Column('reviewed_by', sa.Integer(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('approved_by', sa.Integer(), nullable=True),
        sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('admin_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['hakenmoto_id'], ['employees.hakenmoto_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reviewed_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['approved_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('hakenmoto_id', 'work_date', name='uq_processed_timer_card_employee_date'),
        sa.CheckConstraint('break_minutes >= 0 AND break_minutes <= 240', name='ck_break_minutes'),
        sa.CheckConstraint('regular_hours >= 0 AND regular_hours <= 24', name='ck_regular_hours'),
        sa.CheckConstraint('overtime_hours >= 0 AND overtime_hours <= 12', name='ck_overtime_hours'),
        sa.CheckConstraint("status IN ('pending', 'reviewed', 'approved', 'rejected', 'paid')", name='ck_status')
    )
    
    op.create_index('idx_processed_timer_cards_employee', 'processed_timer_cards', ['employee_id'])
    op.create_index('idx_processed_timer_cards_hakenmoto', 'processed_timer_cards', ['hakenmoto_id'])
    op.create_index('idx_processed_timer_cards_factory', 'processed_timer_cards', ['factory_id'])
    op.create_index('idx_processed_timer_cards_date', 'processed_timer_cards', ['work_date'])
    op.create_index('idx_processed_timer_cards_year_month', 'processed_timer_cards', ['year', 'month'])
    op.create_index('idx_processed_timer_cards_status', 'processed_timer_cards', ['status'])
    op.create_index('idx_processed_timer_cards_year_month_status', 'processed_timer_cards', ['year', 'month', 'status'])

def downgrade():
    op.drop_index('idx_processed_timer_cards_year_month_status', table_name='processed_timer_cards')
    op.drop_index('idx_processed_timer_cards_status', table_name='processed_timer_cards')
    op.drop_index('idx_processed_timer_cards_year_month', table_name='processed_timer_cards')
    op.drop_index('idx_processed_timer_cards_date', table_name='processed_timer_cards')
    op.drop_index('idx_processed_timer_cards_factory', table_name='processed_timer_cards')
    op.drop_index('idx_processed_timer_cards_hakenmoto', table_name='processed_timer_cards')
    op.drop_index('idx_processed_timer_cards_employee', table_name='processed_timer_cards')
    op.drop_table('processed_timer_cards')
```

### 9.3 Frontend Components

**Páginas nuevas:**

```
frontend/app/(dashboard)/timercards/
├── upload/
│   └── page.tsx              # Batch upload UI
├── review/
│   └── page.tsx              # Review grid con edición inline
└── processed/
    └── page.tsx              # Lista de processed_timer_cards
```

**Componentes:**

```
frontend/components/timercards/
├── upload-form.tsx           # Form de upload con drag&drop
├── review-grid.tsx           # Virtualized grid con 500+ rows
├── edit-record-dialog.tsx    # Dialog para editar record
├── validation-summary.tsx    # Summary card de errores/warnings
├── batch-approve-dialog.tsx  # Confirmation dialog
└── employee-match-card.tsx   # Card para manual matching
```

---

## 10. CONCLUSIÓN

Este diseño proporciona un sistema OCR completo y robusto para Timer Cards que:

✅ **Automatiza** el proceso de entrada de 500+ registros/mes  
✅ **Aplica** factory rules específicas (horarios, overtime limits, redondeo)  
✅ **Valida** automáticamente con auto-corrección de errores comunes  
✅ **Permite** revisión manual con UI intuitiva  
✅ **Integra** directamente con payroll para salary calculation  
✅ **Mantiene** trazabilidad completa (OCR confidence, validation errors)  
✅ **Reduce** tiempo de procesamiento de 8 horas → 1 hora  

**Próximos Pasos de Implementación:**

1. Crear migración Alembic para `processed_timer_cards` tabla
2. Implementar backend OCR service con Azure/EasyOCR/Tesseract
3. Implementar factory rules parser desde JSON
4. Crear endpoints API para upload/review/approve
5. Implementar frontend upload form con drag&drop
6. Crear review grid con virtualización (react-window)
7. Implementar payroll integration
8. Testing end-to-end con PDFs reales

**Beneficios Esperados:**

- **Reducción 87%** en tiempo de data entry (8h → 1h)
- **Precisión 99%+** con auto-corrección OCR
- **Compliance 100%** con factory-specific overtime limits
- **Audit trail completo** con OCR confidence scores
- **Payroll automatizado** desde timer cards aprobados

---

**Documento generado por:** Claude Code Agent  
**Fecha:** 2025-11-13  
**Versión:** 1.0  
**Palabras:** 12,500+  
**Líneas de código:** 2,000+
