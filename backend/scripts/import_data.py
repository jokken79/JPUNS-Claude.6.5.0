"""
Script to import factory and employee data to PostgreSQL
"""
import json
import sys
from pathlib import Path
from datetime import datetime
import pandas as pd
import re
import unicodedata
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add parent directory to path
sys.path.insert(0, '/app')

from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import SessionLocal
from app.models.models import Factory, Employee, ContractWorker, Staff, SocialInsuranceRate, Candidate, Apartment


def normalize_text(text: str) -> str:
    """
    Normalize Japanese text for better matching:
    - Convert to lowercase
    - Remove extra whitespace
    - Normalize unicode (半角/全角)
    - Remove common suffixes
    """
    if not text:
        return ""

    # Normalize unicode characters (NFKC handles 半角/全角)
    text = unicodedata.normalize('NFKC', text)

    # Convert to lowercase (for ASCII)
    text = text.lower()

    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()

    # Remove common company suffixes for better matching
    suffixes = ['株式会社', '(株)', '有限会社', '(有)']
    for suffix in suffixes:
        text = text.replace(suffix, '')

    return text.strip()


def get_manual_factory_mapping():
    """
    Manual mapping for factory names that require special handling.
    UPDATED: Using new factory_id format with double underscore (Company__Plant)
    CVJ and HUB factories consolidated into 岡山工場
    """
    return {
        # 高雄工業 factories
        '高雄工業 本社': '高雄工業株式会社__本社工場',
        '高雄工業 岡山': '高雄工業株式会社__岡山工場',  # Consolidated
        '高雄工業 静岡': '高雄工業株式会社__本社工場',
        '高雄工業 海南第一': '高雄工業株式会社__海南第一工場',
        '高雄工業 海南第二': '高雄工業株式会社__海南第二工場',
        '高雄工業 第一': '高雄工業株式会社__第一工場',
        '高雄工業 第二': '高雄工業株式会社__第二工場',
        '高雄工業 CVJ': '高雄工業株式会社__岡山工場',  # Consolidated
        '高雄工業 HUB': '高雄工業株式会社__岡山工場',  # Consolidated
        # Other factories
        'ﾌｪﾆﾃｯｸｾﾐｺﾝﾀﾞｸﾀｰ 岡山': 'フェニテックセミコンダクター(株)__鹿児島工場',
        'ﾌｪﾆﾃｯｸｾﾐｺﾝﾀﾞｸﾀｰ 鹿児島': 'フェニテックセミコンダクター(株)__鹿児島工場',
        'オーツカ': '株式会社オーツカ__関ケ原工場',
        'アサヒフォージ': 'アサヒフォージ株式会社__真庭工場',
        '瑞陵精機': '瑞陵精機株式会社__恵那工場',
        '加藤木材 本社': '加藤木材工業株式会社__本社工場',
        '加藤木材 春日井': '加藤木材工業株式会社__春日井工場',
        'ユアサ工機 本社': 'ユアサ工機株式会社__本社工場',
        'ユアサ工機 新城': 'ユアサ工機株式会社__新城工場',
    }


def find_factory_match(factory_name_excel: str, db: Session) -> str:
    """
    Find the best matching factory in the database using multiple strategies.

    Strategies (in order):
    0. Manual mapping (for known problematic cases)
    1. Exact match (normalized)
    2. Bidirectional substring match (Excel name in DB or vice versa)
    3. Word-based matching (split by spaces, match significant words)
    4. Company name fallback (NEW! - if factory not found, match by company only)

    Strategy 4 Example:
    Excel: "高雄工業 Nueva Planta" (fábrica no existe en JSON)
    → Extrae empresa: "高雄工業"
    → Busca todas las fábricas de 高雄工業
    → Asigna: 本社工場 (si existe) o primera disponible

    Args:
        factory_name_excel: Factory name from Excel file (simplified name)
        db: Database session

    Returns:
        factory_id if match found, None otherwise
    """
    if not factory_name_excel:
        return None

    excel_norm = normalize_text(factory_name_excel)

    # Strategy 0: Check manual mapping first
    manual_map = get_manual_factory_mapping()
    for excel_pattern, factory_id in manual_map.items():
        if normalize_text(excel_pattern) == excel_norm or normalize_text(excel_pattern) in excel_norm:
            # Verify the factory exists
            factory = db.query(Factory).filter(Factory.factory_id == factory_id).first()
            if factory:
                return factory.factory_id

    # Get all factories from DB (cache this if performance is an issue)
    all_factories = db.query(Factory).all()

    # Strategy 1: Exact match (normalized)
    for factory in all_factories:
        db_norm = normalize_text(factory.name)
        if excel_norm == db_norm:
            return factory.factory_id

    # Strategy 2: Bidirectional substring match
    for factory in all_factories:
        db_norm = normalize_text(factory.name)

        # Check if Excel name is in DB name (e.g., "ユアサ工機 本社" in "ユアサ工機株式会社 - 本社工場")
        if excel_norm in db_norm:
            return factory.factory_id

        # Check if DB name is in Excel name (rare but possible)
        if db_norm in excel_norm:
            return factory.factory_id

    # Strategy 3: Word-based matching for Japanese factories
    # Split both names into words and check if key words match
    excel_words = set(excel_norm.split())

    best_match = None
    best_score = 0

    for factory in all_factories:
        db_norm = normalize_text(factory.name)
        db_words = set(db_norm.split())

        # Count matching words (excluding very short words)
        matching_words = excel_words.intersection(db_words)
        significant_matches = [w for w in matching_words if len(w) >= 2]

        if len(significant_matches) >= 2:  # At least 2 significant words match
            score = len(significant_matches)
            if score > best_score:
                best_score = score
                best_match = factory.factory_id

    if best_match:
        return best_match

    # Strategy 4: FALLBACK by company name (NEW!)
    # If specific factory not found, try to match by company name only
    # and assign to the first available factory of that company (prefer 本社工場)

    # Extract company name (usually first part before space or numbers)
    company_patterns = [
        r'^([^\s\d]+)',  # Everything before first space or number
        r'^(.{3,})',     # At least 3 characters
    ]

    excel_company = None
    for pattern in company_patterns:
        match = re.search(pattern, excel_norm)
        if match:
            excel_company = match.group(1).strip()
            if len(excel_company) >= 3:  # Minimum 3 characters for company name
                break

    if excel_company:
        # Find all factories from this company
        company_factories = []
        honsha_factory = None  # 本社工場 (headquarters factory)

        for factory in all_factories:
            db_norm = normalize_text(factory.name)

            # Check if company name is in factory name
            if excel_company in db_norm:
                company_factories.append(factory)

                # Check if this is 本社工場 (headquarters)
                if '本社' in db_norm or 'honsha' in db_norm:
                    honsha_factory = factory

        # If found factories from this company
        if company_factories:
            # Priority 1: 本社工場 (headquarters factory)
            if honsha_factory:
                print(f"  [FALLBACK] '{factory_name_excel}' → {honsha_factory.factory_id} (本社工場)")
                return honsha_factory.factory_id

            # Priority 2: First factory found
            first_factory = company_factories[0]
            print(f"  [FALLBACK] '{factory_name_excel}' → {first_factory.factory_id} (primera de {len(company_factories)})")
            return first_factory.factory_id

    return None


def import_factories(db: Session):
    """Import factories from JSON files"""
    print("=" * 50)
    print("IMPORTANDO FÁBRICAS")
    print("=" * 50)

    try:
        # Load factories index
        with open('/app/config/factories_index.json', 'r', encoding='utf-8') as f:
            index = json.load(f)

        imported = 0
        skipped = 0

        for factory_info in index['factories']:
            try:
                factory_id = factory_info['factory_id']

                # Check if exists
                existing = db.query(Factory).filter(Factory.factory_id == factory_id).first()
                if existing:
                    skipped += 1
                    continue

                # Find the correct factory file by prefix
                # NOTE: factory_id uses double underscore '__' but filenames use single underscore '_'
                factory_dir = Path('/app/config/factories')
                factory_id_search = factory_id.replace('__', '_')  # Convert __ to _ for file matching
                found_files = list(factory_dir.glob(f'{factory_id_search}*.json'))

                if not found_files:
                    raise FileNotFoundError(f"No JSON file found starting with '{factory_id_search}' in {factory_dir}")

                # Use the first file found
                factory_file = found_files[0]

                # Load full factory config
                with open(factory_file, 'r', encoding='utf-8') as f:
                    config = json.load(f)

                # Create factory record
                # Make contact_person optional (some factories don't have 'assignment' field)
                contact_person = None
                if 'assignment' in config and 'supervisor' in config['assignment']:
                    contact_person = config['assignment']['supervisor'].get('name')

                factory = Factory(
                    factory_id=factory_id,
                    name=f"{config['client_company']['name']} - {config['plant']['name']}".strip(),
                    address=config['plant']['address'],
                    phone=config['plant']['phone'],
                    contact_person=contact_person,
                    config=config,
                    is_active=True
                )

                db.add(factory)
                db.commit()  # Commit individually
                imported += 1

                if imported % 20 == 0:
                    print(f"  Procesadas {imported} fábricas...")

            except Exception as e:
                db.rollback()
                print(f"  ✗ Error en {factory_id}: {e}")

        print(f"✓ Importadas {imported} fábricas a PostgreSQL")
        if skipped > 0:
            print(f"  ⚠ {skipped} duplicados omitidos\n")
        return imported

    except Exception as e:
        print(f"✗ Error importando fábricas: {e}\n")
        return 0


def import_haken_employees(db: Session):
    """Import 派遣社員 (Dispatch employees)"""
    print("=" * 50)
    print("IMPORTANDO 派遣社員 (DISPATCH EMPLOYEES)")
    print("=" * 50)

    try:
        df = pd.read_excel('/app/config/employee_master.xlsm', sheet_name='派遣社員', header=1)

        imported = 0
        updated = 0
        errors = 0

        for idx, row in df.iterrows():
            try:
                # Skip if no employee number
                if pd.isna(row['社員№']):
                    continue

                hakenmoto_id = int(row['社員№'])

                # Helper function to parse dates safely
                def parse_date(value):
                    if pd.notna(value):
                        try:
                            return pd.to_datetime(value).date()
                        except (ValueError, TypeError):
                            # Return None for unparseable dates
                            pass
                    return None

                # Helper function to parse integers safely
                def parse_int(value):
                    if pd.notna(value):
                        try:
                            return int(float(value))
                        except (ValueError, TypeError):
                            # Return None for non-numeric values
                            pass
                    return None

                # Helper function to parse strings safely
                def get_str(key):
                    val = row.get(key)
                    return str(val) if pd.notna(val) else None

                # Parse dates
                hire_date = parse_date(row.get('入社日'))
                current_hire_date = parse_date(row.get('現入社'))
                termination_date = parse_date(row.get('退社日'))
                zairyu_expire = parse_date(row.get('ビザ期限'))
                dob = parse_date(row.get('生年月日'))
                jikyu_revision_date = parse_date(row.get('時給改定'))
                billing_revision_date = parse_date(row.get('請求改定'))
                social_insurance_date = parse_date(row.get('社保加入'))
                entry_request_date = parse_date(row.get('入社依頼'))
                license_expire_date = parse_date(row.get('免許期限'))
                optional_insurance_expire = parse_date(row.get('任意保険期限'))
                apartment_start_date = parse_date(row.get('入居'))
                apartment_move_out_date = parse_date(row.get('退去'))

                # Parse apartment name and lookup apartment_id
                apartment_name = get_str('ｱﾊﾟｰﾄ')
                apartment_id = None

                if apartment_name:
                    # Buscar el apartamento en la tabla apartments
                    apartment = db.query(Apartment).filter(
                        Apartment.apartment_code == apartment_name
                    ).first()

                    if apartment:
                        apartment_id = apartment.id
                    else:
                        # Auto-crear apartamento si no existe
                        new_apartment = Apartment(
                            apartment_code=apartment_name,
                            name=apartment_name,  # FIX: usar apartment_code como name
                            address='(Auto-creado desde importación)',
                            base_rent=45000,  # FIX: campo obligatorio
                            monthly_rent=45000,  # Valor por defecto
                            capacity=4,
                            is_available=True,
                            notes='Creado automáticamente durante importación de empleados'
                        )
                        db.add(new_apartment)
                        db.commit()
                        apartment_id = new_apartment.id
                        print(f"  [AUTO-CREADO] Apartamento: {apartment_name}")

                # Parse status
                status_text = row.get('現在')
                current_status = 'active' # Default
                is_active = True

                if pd.notna(status_text):
                    if status_text == '退社':
                        current_status = 'terminated'
                        is_active = False
                    elif status_text == '待機中':
                        current_status = 'suspended'
                    # '在職中' maps to the default 'active'


                # Parse integers
                jikyu = parse_int(row.get('時給')) or 0
                hourly_rate_charged = parse_int(row.get('請求単価'))
                profit_difference = parse_int(row.get('差額利益'))
                standard_compensation = parse_int(row.get('標準報酬'))
                health_insurance = parse_int(row.get('健康保険'))
                nursing_insurance = parse_int(row.get('介護保険'))
                pension_insurance = parse_int(row.get('厚生年金'))

                # Find factory_id by looking up the factory name from '派遣先'
                factory_name_from_excel = get_str('派遣先')
                db_factory_id = None
                company_name = None
                plant_name = None

                if factory_name_from_excel:
                    # Use improved matching function
                    db_factory_id = find_factory_match(factory_name_from_excel, db)
                    if not db_factory_id:
                        print(f"  [WARN] Factory '{factory_name_from_excel}' not found for employee {hakenmoto_id}. Skipping factory link.")
                    else:
                        # Extract company_name and plant_name from factory config
                        factory = db.query(Factory).filter(Factory.factory_id == db_factory_id).first()
                        if factory and factory.config:
                            company_name = factory.config.get('client_company', {}).get('name')
                            plant_name = factory.config.get('plant', {}).get('name')

                # Search for related candidate by name AND date of birth (robust matching)
                candidate = None
                employee_name = get_str('氏名')
                employee_kana = get_str('カナ')

                if employee_name and dob:
                    # Try exact match with name + DOB (most reliable)
                    candidate = db.query(Candidate).filter(
                        Candidate.full_name_kanji == employee_name,
                        Candidate.date_of_birth == dob
                    ).first()

                    # Fallback: try kana + DOB
                    if not candidate and employee_kana:
                        candidate = db.query(Candidate).filter(
                            Candidate.full_name_kana == employee_kana,
                            Candidate.date_of_birth == dob
                        ).first()

                    # Last resort: name only (less reliable)
                    if not candidate:
                        candidate = db.query(Candidate).filter(
                            or_(
                                Candidate.full_name_kanji == employee_name,
                                Candidate.full_name_kana == employee_name
                            )
                        ).first()

                # Check if employee already exists
                existing = db.query(Employee).filter(Employee.hakenmoto_id == hakenmoto_id).first()

                # FIX: Leer dirección del Excel (columna real: 住所)
                # El Excel NO tiene columnas divididas (現住所, 番地, 物件名)
                # Solo tiene UNA columna completa: 住所
                address_from_excel = get_str('住所')  # Dirección completa del Excel

                if existing:
                    # UPDATE existing employee with new data
                    existing.factory_id = db_factory_id
                    existing.company_name = company_name
                    existing.plant_name = plant_name
                    existing.hakensaki_shain_id = get_str('派遣先ID')  # FIX: Columna correcta del Excel
                    existing.full_name_kanji = get_str('氏名') or ''
                    existing.full_name_kana = get_str('カナ') or ''
                    existing.date_of_birth = dob
                    existing.gender = get_str('性別')
                    existing.nationality = get_str('国籍')
                    existing.zairyu_expire_date = zairyu_expire
                    existing.visa_type = get_str('ビザ種類')
                    # FIX: Usar dirección real del Excel (住所)
                    existing.postal_code = get_str('〒')
                    existing.address = address_from_excel  # Dirección completa del Excel
                    existing.current_address = address_from_excel  # Mismo valor (compatibilidad)
                    existing.address_banchi = None  # Excel no tiene esta columna dividida
                    existing.address_building = None  # Excel no tiene esta columna
                    existing.hire_date = hire_date
                    existing.current_hire_date = current_hire_date
                    existing.jikyu = jikyu
                    existing.jikyu_revision_date = jikyu_revision_date
                    existing.position = get_str('職種')
                    existing.assignment_location = get_str('配属先')
                    existing.assignment_line = get_str('配属ライン')
                    existing.job_description = get_str('仕事内容')
                    existing.hourly_rate_charged = hourly_rate_charged
                    existing.billing_revision_date = billing_revision_date
                    existing.profit_difference = profit_difference
                    existing.standard_compensation = standard_compensation
                    existing.health_insurance = health_insurance
                    existing.nursing_insurance = nursing_insurance
                    existing.pension_insurance = pension_insurance
                    existing.social_insurance_date = social_insurance_date
                    existing.license_type = get_str('免許種類')
                    existing.license_expire_date = license_expire_date
                    existing.commute_method = get_str('通勤方法')
                    existing.optional_insurance_expire = optional_insurance_expire
                    existing.japanese_level = get_str('日本語検定')
                    existing.career_up_5years = get_str('キャリアアップ5年目') == 'はい'
                    existing.apartment_id = apartment_id
                    existing.apartment_start_date = apartment_start_date
                    existing.apartment_move_out_date = apartment_move_out_date
                    existing.entry_request_date = entry_request_date
                    existing.notes = get_str('備考')

                    # CRITICAL: Update status fields
                    existing.is_active = is_active
                    existing.current_status = current_status
                    existing.termination_date = termination_date

                    # Update candidate link and photos if found
                    if candidate:
                        existing.rirekisho_id = candidate.rirekisho_id
                        existing.photo_url = candidate.photo_url
                        existing.photo_data_url = candidate.photo_data_url

                    db.commit()
                    updated += 1

                else:
                    # CREATE new employee record
                    employee = Employee(
                        hakenmoto_id=hakenmoto_id,
                        rirekisho_id=candidate.rirekisho_id if candidate else None,
                        factory_id=db_factory_id,
                        company_name=company_name,
                        plant_name=plant_name,
                        hakensaki_shain_id=get_str('派遣先ID'),  # FIX: Columna correcta del Excel
                        full_name_kanji=get_str('氏名') or '',
                        full_name_kana=get_str('カナ') or '',
                        date_of_birth=dob,
                        gender=get_str('性別'),
                        nationality=get_str('国籍'),
                        zairyu_expire_date=zairyu_expire,
                        visa_type=get_str('ビザ種類'),
                        # FIX: Usar dirección real del Excel (住所)
                        postal_code=get_str('〒'),
                        address=address_from_excel,  # Dirección completa del Excel
                        current_address=address_from_excel,  # Mismo valor (compatibilidad)
                        address_banchi=None,  # Excel no tiene esta columna dividida
                        address_building=None,  # Excel no tiene esta columna
                        phone=None,
                        email=None,
                        # Photos from candidate
                        photo_url=candidate.photo_url if candidate else None,
                        photo_data_url=candidate.photo_data_url if candidate else None,
                        # Employment
                        hire_date=hire_date,
                        current_hire_date=current_hire_date,
                        jikyu=jikyu,
                        jikyu_revision_date=jikyu_revision_date,
                        position=get_str('職種'),
                        contract_type='派遣',
                        # Assignment
                        assignment_location=get_str('配属先'),
                        assignment_line=get_str('配属ライン'),
                        job_description=get_str('仕事内容'),
                        # Financial
                        hourly_rate_charged=hourly_rate_charged,
                        billing_revision_date=billing_revision_date,
                        profit_difference=profit_difference,
                        standard_compensation=standard_compensation,
                        health_insurance=health_insurance,
                        nursing_insurance=nursing_insurance,
                        pension_insurance=pension_insurance,
                        social_insurance_date=social_insurance_date,
                        # License
                        license_type=get_str('免許種類'),
                        license_expire_date=license_expire_date,
                        commute_method=get_str('通勤方法'),
                        optional_insurance_expire=optional_insurance_expire,
                        # Skills
                        japanese_level=get_str('日本語検定'),
                        career_up_5years=get_str('キャリアアップ5年目') == 'はい',
                        # Apartment
                        apartment_id=apartment_id,
                        apartment_start_date=apartment_start_date,
                        apartment_move_out_date=apartment_move_out_date,
                        # Other
                        entry_request_date=entry_request_date,
                        notes=get_str('備考'),
                        is_active=is_active,
                        current_status=current_status,
                        termination_date=termination_date
                    )

                    db.add(employee)
                    db.commit()
                    imported += 1

                if (imported + updated) % 100 == 0:
                    print(f"  Procesados {imported + updated} empleados...")

            except Exception as e:
                db.rollback()
                errors += 1
                if errors < 10:  # Only show first 10 errors
                    print(f"  ✗ Error en fila {idx}: {e}")

        print(f"✓ 派遣社員: {imported} nuevos, {updated} actualizados (Total: {imported + updated})")
        if errors > 0:
            print(f"  ⚠ {errors} errores encontrados\n")
        return imported + updated

    except Exception as e:
        db.rollback()
        print(f"✗ Error importando 派遣社員: {e}\n")
        return 0


def import_ukeoi_employees(db: Session):
    """Import 請負社員 (Contract employees) - TODOS son de 高雄工業 岡山工場"""
    print("=" * 50)
    print("IMPORTANDO 請負社員 (CONTRACT EMPLOYEES)")
    print("=" * 50)

    # FIXED FACTORY: Todos los 請負 son de 高雄工業 岡山工場
    UKEOI_FACTORY_ID = "高雄工業株式会社__岡山工場"
    UKEOI_COMPANY_NAME = "高雄工業株式会社"
    UKEOI_PLANT_NAME = "岡山工場"

    try:
        df = pd.read_excel('/app/config/employee_master.xlsm', sheet_name='請負社員', header=2)

        imported = 0
        errors = 0
        skipped = 0

        for idx, row in df.iterrows():
            try:
                # Helper functions
                def parse_date(value):
                    if pd.notna(value):
                        try:
                            return pd.to_datetime(value).date()
                        except (ValueError, TypeError):
                            # Return None for unparseable dates
                            pass
                    return None

                def parse_int(value):
                    if pd.notna(value):
                        try:
                            return int(float(value))
                        except (ValueError, TypeError):
                            # Return None for non-numeric values
                            pass
                    return None

                def get_str(index_or_key):
                    try:
                        if isinstance(index_or_key, int):
                            val = row.iloc[index_or_key] if len(row) > index_or_key else None
                        else:
                            val = row.get(index_or_key)
                        return str(val).strip() if pd.notna(val) else None
                    except (KeyError, AttributeError, TypeError, IndexError):
                        # Return None if field access or conversion fails
                        return None

                # Get column by index since names might be problematic
                status = row.iloc[0] if len(row) > 0 else None
                shain_no = row.iloc[1] if len(row) > 1 else None

                # Skip if no employee number
                if pd.isna(shain_no):
                    continue

                hakenmoto_id = int(shain_no)

                # Check if already exists
                existing = db.query(ContractWorker).filter(ContractWorker.hakenmoto_id == hakenmoto_id).first()
                if existing:
                    skipped += 1
                    continue

                # Basic info (by index - más confiable)
                name = get_str(3) or ''
                kana = get_str(4) or ''
                gender = get_str(5)
                nationality = get_str(6)

                # Try to get date of birth (common column positions)
                date_of_birth = parse_date(row.iloc[7]) if len(row) > 7 else None

                # Jikyu
                jikyu = parse_int(row.iloc[9]) if len(row) > 9 else 0

                # Dates
                hire_date = parse_date(row.iloc[25]) if len(row) > 25 else None
                termination_date = parse_date(row.iloc[26]) if len(row) > 26 else None
                current_hire_date = parse_date(row.iloc[27]) if len(row) > 27 else None
                jikyu_revision_date = parse_date(row.iloc[28]) if len(row) > 28 else None

                # Status
                is_active = status != '退社' if pd.notna(status) else True
                current_status = 'terminated' if status == '退社' else 'active'

                # Financial info (common positions)
                hourly_rate_charged = parse_int(row.iloc[10]) if len(row) > 10 else None
                profit_difference = parse_int(row.iloc[11]) if len(row) > 11 else None
                standard_compensation = parse_int(row.iloc[12]) if len(row) > 12 else None
                health_insurance = parse_int(row.iloc[13]) if len(row) > 13 else None
                nursing_insurance = parse_int(row.iloc[14]) if len(row) > 14 else None
                pension_insurance = parse_int(row.iloc[15]) if len(row) > 15 else None

                # Position/assignment (try common positions)
                position = get_str(20) if len(row) > 20 else None
                assignment_location = get_str(21) if len(row) > 21 else None
                assignment_line = get_str(22) if len(row) > 22 else None
                job_description = get_str(23) if len(row) > 23 else None

                # Search for related candidate by name AND date of birth (robust matching)
                candidate = None
                if pd.notna(name) and date_of_birth:
                    search_name = str(name).strip()
                    search_kana = str(kana).strip() if pd.notna(kana) else None

                    # Try exact match with name + DOB (most reliable)
                    candidate = db.query(Candidate).filter(
                        Candidate.full_name_kanji == search_name,
                        Candidate.date_of_birth == date_of_birth
                    ).first()

                    # Fallback: try kana + DOB
                    if not candidate and search_kana:
                        candidate = db.query(Candidate).filter(
                            Candidate.full_name_kana == search_kana,
                            Candidate.date_of_birth == date_of_birth
                        ).first()

                    # Last resort: name only (less reliable)
                    if not candidate:
                        candidate = db.query(Candidate).filter(
                            or_(
                                Candidate.full_name_kanji == search_name,
                                Candidate.full_name_kana == search_name
                            )
                        ).first()

                contract_worker = ContractWorker(
                    # IDs
                    hakenmoto_id=hakenmoto_id,
                    rirekisho_id=candidate.rirekisho_id if candidate else None,

                    # FIXED FACTORY - Todos son de 高雄工業 岡山工場
                    factory_id=UKEOI_FACTORY_ID,
                    company_name=UKEOI_COMPANY_NAME,
                    plant_name=UKEOI_PLANT_NAME,

                    # Photos
                    photo_url=candidate.photo_url if candidate else None,
                    photo_data_url=candidate.photo_data_url if candidate else None,

                    # Basic info
                    full_name_kanji=name,
                    full_name_kana=kana,
                    date_of_birth=date_of_birth,
                    gender=gender,
                    nationality=nationality,

                    # Employment
                    hire_date=hire_date,
                    current_hire_date=current_hire_date,
                    jikyu=jikyu,
                    jikyu_revision_date=jikyu_revision_date,
                    position=position,
                    contract_type='請負',

                    # Assignment
                    assignment_location=assignment_location,
                    assignment_line=assignment_line,
                    job_description=job_description,

                    # Financial
                    hourly_rate_charged=hourly_rate_charged,
                    profit_difference=profit_difference,
                    standard_compensation=standard_compensation,
                    health_insurance=health_insurance,
                    nursing_insurance=nursing_insurance,
                    pension_insurance=pension_insurance,

                    # Status
                    is_active=is_active,
                    termination_date=termination_date
                )

                db.add(contract_worker)
                db.commit()  # Commit individually
                imported += 1

                # Log synchronization status
                if candidate:
                    print(f"  ✓ [{hakenmoto_id}] {name} → {UKEOI_FACTORY_ID} | Foto: {bool(candidate.photo_data_url)}")
                else:
                    print(f"  ⚠ [{hakenmoto_id}] {name} → {UKEOI_FACTORY_ID} | Sin candidate")

                if imported % 50 == 0:
                    print(f"  Procesados {imported} empleados...")

            except Exception as e:
                db.rollback()
                errors += 1
                if errors < 10:
                    print(f"  ✗ Error en fila {idx}: {e}")

        print(f"✓ Importados {imported} empleados 請負社員")
        print(f"  Todos asignados a: {UKEOI_FACTORY_ID}")
        if skipped > 0:
            print(f"  ⚠ {skipped} duplicados omitidos")
        if errors > 0:
            print(f"  ⚠ {errors} errores encontrados\n")
        return imported

    except Exception as e:
        db.rollback()
        print(f"✗ Error importando 請負社員: {e}\n")
        return 0


def import_staff_employees(db: Session):
    """Import スタッフ (Staff employees) - Office/HR Personnel"""
    print("=" * 50)
    print("IMPORTANDO スタッフ (STAFF)")
    print("=" * 50)

    try:
        df = pd.read_excel('/app/config/employee_master.xlsm', sheet_name='スタッフ', header=2)

        imported = 0
        errors = 0
        skipped = 0

        for idx, row in df.iterrows():
            try:
                # Helper functions
                def parse_date(value):
                    if pd.notna(value):
                        try:
                            return pd.to_datetime(value).date()
                        except (ValueError, TypeError):
                            # Return None for unparseable dates
                            pass
                    return None

                def parse_int(value):
                    if pd.notna(value):
                        try:
                            return int(float(value))
                        except (ValueError, TypeError):
                            # Return None for non-numeric values
                            pass
                    return None

                def get_str(index_or_key):
                    try:
                        if isinstance(index_or_key, int):
                            val = row.iloc[index_or_key] if len(row) > index_or_key else None
                        else:
                            val = row.get(index_or_key)
                        return str(val).strip() if pd.notna(val) else None
                    except (KeyError, AttributeError, TypeError, IndexError):
                        # Return None if field access or conversion fails
                        return None

                # Get by index
                status = row.iloc[0] if len(row) > 0 else None
                shain_no = row.iloc[1] if len(row) > 1 else None

                if pd.isna(shain_no):
                    continue

                staff_id = int(shain_no)

                # Check if already exists
                existing = db.query(Staff).filter(Staff.staff_id == staff_id).first()
                if existing:
                    skipped += 1
                    continue

                # Basic info
                name = get_str(2) or ''
                kana = get_str(3) or ''
                gender = get_str(4)
                date_of_birth = parse_date(row.iloc[5]) if len(row) > 5 else None
                nationality = get_str(6)

                # Monthly salary (staff typically have monthly salary, not hourly)
                monthly_salary = parse_int(row.iloc[7]) if len(row) > 7 else 0

                # Dates
                hire_date = parse_date(row.iloc[8]) if len(row) > 8 else None
                termination_date = parse_date(row.iloc[9]) if len(row) > 9 else None
                social_insurance_date = parse_date(row.iloc[10]) if len(row) > 10 else None

                # Contact info
                postal_code = get_str(11)
                address = get_str(12)
                phone = get_str(13)
                email = get_str(14)

                # Emergency contact
                emergency_contact_name = get_str(15)
                emergency_contact_phone = get_str(16)
                emergency_contact_relationship = get_str(17)

                # Position
                position = get_str(18)
                department = get_str(19)

                # Social insurance
                health_insurance = parse_int(row.iloc[20]) if len(row) > 20 else None
                nursing_insurance = parse_int(row.iloc[21]) if len(row) > 21 else None
                pension_insurance = parse_int(row.iloc[22]) if len(row) > 22 else None

                # Status
                is_active = status != '退社' if pd.notna(status) else True
                termination_reason = get_str(23) if status == '退社' else None

                # Notes
                notes = get_str(24)

                # Search for related candidate by name AND date of birth (robust matching)
                candidate = None
                if pd.notna(name) and date_of_birth:
                    search_name = str(name).strip()
                    search_kana = str(kana).strip() if pd.notna(kana) else None

                    # Try exact match with name + DOB (most reliable)
                    candidate = db.query(Candidate).filter(
                        Candidate.full_name_kanji == search_name,
                        Candidate.date_of_birth == date_of_birth
                    ).first()

                    # Fallback: try kana + DOB
                    if not candidate and search_kana:
                        candidate = db.query(Candidate).filter(
                            Candidate.full_name_kana == search_kana,
                            Candidate.date_of_birth == date_of_birth
                        ).first()

                    # Last resort: name only (less reliable)
                    if not candidate:
                        candidate = db.query(Candidate).filter(
                            or_(
                                Candidate.full_name_kanji == search_name,
                                Candidate.full_name_kana == search_name
                            )
                        ).first()

                staff = Staff(
                    # IDs
                    staff_id=staff_id,
                    rirekisho_id=candidate.rirekisho_id if candidate else None,

                    # Photos
                    photo_url=candidate.photo_url if candidate else None,
                    photo_data_url=candidate.photo_data_url if candidate else None,

                    # Basic info
                    full_name_kanji=name,
                    full_name_kana=kana,
                    date_of_birth=date_of_birth,
                    gender=gender,
                    nationality=nationality,

                    # Contact info
                    postal_code=postal_code,
                    address=address,
                    phone=phone,
                    email=email,
                    emergency_contact_name=emergency_contact_name,
                    emergency_contact_phone=emergency_contact_phone,
                    emergency_contact_relationship=emergency_contact_relationship,

                    # Employment
                    hire_date=hire_date,
                    position=position,
                    department=department,
                    monthly_salary=monthly_salary,

                    # Social insurance
                    health_insurance=health_insurance,
                    nursing_insurance=nursing_insurance,
                    pension_insurance=pension_insurance,
                    social_insurance_date=social_insurance_date,

                    # Yukyu defaults
                    yukyu_total=0,
                    yukyu_used=0,
                    yukyu_remaining=0,

                    # Status
                    is_active=is_active,
                    termination_date=termination_date,
                    termination_reason=termination_reason,
                    notes=notes
                )

                db.add(staff)
                db.commit()  # Commit individually
                imported += 1

                # Log synchronization status
                if candidate:
                    print(f"  ✓ [{staff_id}] {name} | Foto: {bool(candidate.photo_data_url)}")
                else:
                    print(f"  ⚠ [{staff_id}] {name} | Sin candidate")

                if imported % 25 == 0:
                    print(f"  Procesados {imported} staff...")

            except Exception as e:
                db.rollback()
                errors += 1
                if errors < 10:
                    print(f"  ✗ Error en fila {idx}: {e}")

        print(f"✓ Importados {imported} empleados スタッフ")
        if skipped > 0:
            print(f"  ⚠ {skipped} duplicados omitidos")
        if errors > 0:
            print(f"  ⚠ {errors} errores encontrados\n")
        return imported

    except Exception as e:
        db.rollback()
        print(f"✗ Error importando スタッフ: {e}\n")
        return 0


def import_taisha_employees(db: Session):
    """Import 退社社員 (Resigned employees) from DBTaishaX hidden sheet"""
    print("=" * 50)
    print("IMPORTANDO 退社社員 (RESIGNED EMPLOYEES)")
    print("=" * 50)

    try:
        df = pd.read_excel('/app/config/employee_master.xlsm', sheet_name='DBTaishaX', header=0)

        # Filter out rows where all values are NaN
        df = df.dropna(how='all')

        if len(df) == 0:
            print("ℹ No hay empleados renunciados registrados aún.\n")
            return 0

        imported = 0
        errors = 0

        for idx, row in df.iterrows():
            try:
                if pd.isna(row.get('社員№')):
                    continue

                hakenmoto_id = int(row['社員№'])

                # Check if employee exists and update to inactive
                employee = db.query(Employee).filter(Employee.hakenmoto_id == hakenmoto_id).first()

                if employee:
                    # Update existing employee to mark as resigned
                    employee.is_active = False
                    employee.current_status = 'terminated'
                    if pd.notna(row.get('退社日')):
                        try:
                            employee.termination_date = pd.to_datetime(row['退社日']).date()
                        except (ValueError, TypeError):
                            # Skip invalid termination dates
                            pass

                    db.commit()
                    imported += 1

            except Exception as e:
                db.rollback()
                errors += 1
                if errors < 5:
                    print(f"  ✗ Error en fila {idx}: {e}")

        print(f"✓ Actualizados {imported} empleados renunciados")
        if errors > 0:
            print(f"  ⚠ {errors} errores encontrados\n")
        return imported

    except Exception as e:
        db.rollback()
        print(f"✗ Error importando 退社社員: {e}\n")
        return 0


def import_insurance_rates(db: Session):
    """Import social insurance rates from 愛知23 sheet"""
    print("=" * 50)
    print("IMPORTANDO TARIFAS DE SEGUROS (愛知23)")
    print("=" * 50)

    try:
        # Note: This sheet has a complex format, needs special parsing
        # For now, we'll skip it and add a TODO comment
        print("ℹ Importación de tarifas de seguros pendiente de implementación.")
        print("  (Requiere parsing manual de la tabla compleja)\n")
        return 0

    except Exception as e:
        print(f"✗ Error importando tarifas: {e}\n")
        return 0


def validate_config_files():
    """Validate that required config files exist before starting import"""
    required_files = {
        '/app/config/factories_index.json': 'Índice de fábricas',
        '/app/config/employee_master.xlsm': 'Datos maestros de empleados'
    }

    missing = []
    for filepath, description in required_files.items():
        if not Path(filepath).exists():
            missing.append((filepath, description))

    if missing:
        print("\n" + "="*60)
        print("❌ ERROR: Archivos de configuración faltantes")
        print("="*60)
        for filepath, description in missing:
            print(f"\n❌ {description}")
            print(f"   Ruta: {filepath}")

        print("\n" + "="*60)
        print("SOLUCIÓN:")
        print("="*60)
        print("1. Verifica que el volumen Docker esté montado correctamente:")
        print("   docker-compose.yml debe tener:")
        print("   volumes:")
        print("     - ./config:/app/config")
        print("\n2. Verifica que los archivos existan en tu máquina:")
        print("   - D:\\JPUNS-CLAUDE5.1\\config\\factories_index.json")
        print("   - D:\\JPUNS-CLAUDE5.1\\config\\employee_master.xlsm")
        print("\n3. Si los archivos no existen, créalos o restaura desde backup")
        print("="*60 + "\n")

        raise FileNotFoundError(
            f"Config files missing. Cannot proceed with import. "
            f"Missing files: {', '.join([fp for fp, _ in missing])}"
        )

    print("✓ Archivos de configuración encontrados:")
    for filepath, description in required_files.items():
        size_mb = Path(filepath).stat().st_size / (1024 * 1024)
        print(f"  ✓ {description}: {size_mb:.2f} MB")
    print()


def main():
    """Main import function"""
    # Validate config files before starting
    validate_config_files()

    db = SessionLocal()

    try:
        print("\n" + "=" * 50)
        print("INICIANDO IMPORTACIÓN DE DATOS")
        print("=" * 50 + "\n")

        # Import factories
        factories_count = import_factories(db)

        # Import employees
        haken_count = import_haken_employees(db)
        ukeoi_count = import_ukeoi_employees(db)
        staff_count = import_staff_employees(db)
        taisha_count = import_taisha_employees(db)
        insurance_count = import_insurance_rates(db)

        total_employees = haken_count + ukeoi_count + staff_count

        # Summary
        print("=" * 50)
        print("RESUMEN DE IMPORTACIÓN")
        print("=" * 50)
        print(f"Fábricas:          {factories_count:4d}")
        print(f"派遣社員:          {haken_count:4d}")
        print(f"請負社員:          {ukeoi_count:4d}")
        print(f"スタッフ:          {staff_count:4d}")
        print(f"退社社員:          {taisha_count:4d}")
        print(f"Tarifas seguros:   {insurance_count:4d}")
        print(f"{'─' * 50}")
        print(f"TOTAL Empleados:   {total_employees:4d}")
        print("=" * 50)

    except Exception as e:
        print(f"\n✗ Error general: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
