"""
Fixtures de datos para tests de timer card OCR
"""
import datetime

# Datos de ejemplo para diferentes tipos de timer cards
SAMPLE_TIMER_CARD_TEXTS = {
    "formato_tabla_simple": """
    タイムカード - 2025年10月
    工場: ファクトリーA
    氏名: 山田太郎

    日付      出勤時刻    退勤時刻    休憩時間
    10/01     08:00      17:00      60分
    10/02     08:30      18:00      60分
    10/03     09:00      17:30      60分
    10/04     08:00      17:00      60分
    10/05     08:00      17:00      60分
    """,
    
    "formato_estructura": """
    勤怠管理システム
    2025年10月度
    
    氏名: 山田 太郎
    所属: 第一工場
    
    日付    勤怠区分    出社時間    退社時間    休憩
    10/01  通常       08:00      17:00      01:00
    10/02  通常       08:30      18:00      01:00
    10/03  通常       09:00      17:30      01:00
    """,
    
    "formato_ingles_japones": """
    Timer Card - October 2025
    Factory: Factory A
    Employee: Yamada Taro
    
    Date    Clock In   Clock Out  Break
    2025/10/01  08:00     17:00     60min
    2025/10/02  08:30     18:00     60min
    """,
    
    "turno_nocturno": """
    タイムカード - 2025年10月
    工場: ファクトリーB
    氏名: 佐藤花子
    
    日付    出勤時刻    退勤時刻    休憩
    10/01   22:00      06:00      60分
    10/02   22:30      06:30      60分
    10/03   22:00      06:00      60分
    """,
    
    "con_error": """
    タイムカード - 2025年10月
    工場: ファクトリーC
    氏名: 不明ユーザー
    
    日付      出勤時刻    退勤時刻    休憩時間
    10/01     08:00      17:00      60分
    10/XX     25:00      30:00      100分  # Datos inválidos
    10/03     09:00      17:30      60分
    """,
    
    "multiempleado": """
    タイムカード - 2025年10月
    工場: ファクトリーA
    
    田中一郎
    10/01  08:00  17:00  60分
    10/02  08:30  18:00  60分
    
    山田太郎
    10/01  08:00  17:00  60分
    10/02  08:30  18:00  60分
    
    鈴木次郎
    10/01  09:00  18:00  60分
    10/02  09:30  18:30  60分
    """
}

# Datos esperados para validación
EXPECTED_RECORDS = {
    "formato_tabla_simple": [
        {
            "work_date": "2025-10-01",
            "clock_in": "08:00",
            "clock_out": "17:00",
            "break_minutes": 60,
            "employee_name": "山田太郎"
        },
        {
            "work_date": "2025-10-02",
            "clock_in": "08:30",
            "clock_out": "18:00",
            "break_minutes": 60,
            "employee_name": "山田太郎"
        },
        {
            "work_date": "2025-10-03",
            "clock_in": "09:00",
            "clock_out": "17:30",
            "break_minutes": 60,
            "employee_name": "山田太郎"
        }
    ],
    
    "formato_estructura": [
        {
            "work_date": "2025-10-01",
            "clock_in": "08:00",
            "clock_out": "17:00",
            "break_minutes": 60,
            "employee_name": "山田 太郎"
        },
        {
            "work_date": "2025-10-02",
            "clock_in": "08:30",
            "clock_out": "18:00",
            "break_minutes": 60,
            "employee_name": "山田 太郎"
        }
    ],
    
    "turno_nocturno": [
        {
            "work_date": "2025-10-01",
            "clock_in": "22:00",
            "clock_out": "06:00",
            "break_minutes": 60,
            "employee_name": "佐藤花子",
            "is_night_shift": True
        },
        {
            "work_date": "2025-10-02",
            "clock_in": "22:30",
            "clock_out": "06:30",
            "break_minutes": 60,
            "employee_name": "佐藤花子",
            "is_night_shift": True
        }
    ]
}

# Casos de test para employee matching
EMPLOYEE_MATCHING_CASES = {
    "exact_match": {
        "ocr_name": "山田太郎",
        "factory_employees": [
            {"hakenmoto_id": 1, "full_name_kanji": "山田太郎"},
            {"hakenmoto_id": 2, "full_name_kanji": "田中一郎"}
        ],
        "expected_match": {"hakenmoto_id": 1, "confidence": 1.0}
    },
    
    "fuzzy_match": {
        "ocr_name": "山岡",
        "factory_employees": [
            {"hakenmoto_id": 3, "full_name_kanji": "山田太郎"},
            {"hakenmoto_id": 4, "full_name_kanji": "山岡花子"}
        ],
        "expected_match": {"hakenmoto_id": 4, "confidence": 0.71}
    },
    
    "no_match": {
        "ocr_name": "不明ユーザー",
        "factory_employees": [
            {"hakenmoto_id": 1, "full_name_kanji": "山田太郎"},
            {"hakenmoto_id": 2, "full_name_kanji": "田中一郎"}
        ],
        "expected_match": None
    },
    
    "no_employees": {
        "ocr_name": "誰かの名前",
        "factory_employees": [],
        "expected_match": None
    }
}
