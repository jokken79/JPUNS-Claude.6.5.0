# Test Coverage Improvement Plan
## Objetivo: Aumentar cobertura de 30% a 80%+

**Estado Actual:**
- Backend: ~30% (48 archivos de test, pero 22 servicios sin tests)
- Frontend: ~5% (16 E2E tests, CERO unit tests)
- Target Global: 80%+

**Gaps Críticos Identificados:**
1. Backend: 22 servicios sin unit tests
2. Frontend: NO existen unit tests (solo E2E)
3. Áreas críticas sin cobertura: Auth, Payroll calculations, OCR, Notifications

---

## 1. BACKEND TEST STRATEGY (Target: 85%+)

### 1.1 Servicios Críticos SIN Tests (Prioridad ALTA)

#### A) Authentication Service (auth_service.py)
**Cobertura Necesaria:** 90%+
- Login/Logout flows
- Password hashing/verification
- JWT token generation/validation
- Session management
- Role-based access control

**Técnicas:**
```python
# Mock: JWT encoding/decoding
# Mock: Database queries
# Test: Password validation rules
# Test: Token expiration
```

#### B) Notification Service (notification_service.py)
**Cobertura Necesaria:** 85%+
- Email sending (SMTP)
- LINE notifications
- Error handling (network failures)
- Retry logic

**Técnicas:**
```python
# Mock: smtplib.SMTP
# Mock: requests (LINE API)
# Test: Email formatting (HTML/plain)
# Test: Attachment handling
```

#### C) Timer Card OCR Service (timer_card_ocr_service.py)
**Cobertura Necesaria:** 80%+
- Azure Vision API integration
- OCR result parsing
- Data validation
- Error handling (invalid images)

**Técnicas:**
```python
# Mock: Azure Computer Vision client
# Test: Different image formats
# Test: OCR confidence thresholds
# Test: Data extraction accuracy
```

#### D) Payroll Service (payroll_service.py - AMPLIAR)
**Cobertura Necesaria:** 95%+ (crítico para negocio)
- Cálculos de horas extras
- Bonificaciones y deducciones
- Impuestos y seguro social
- Edge cases (festivos, trabajo nocturno)

**Tests Adicionales Necesarios:**
```python
# Test: Overtime calculation edge cases
# Test: Night shift premiums (22:00-05:00)
# Test: Holiday pay (135%)
# Test: Multiple deductions per employee
# Test: Tax brackets
# Test: Net pay calculation accuracy
```

#### E) Yukyu Service (yukyu_service.py)
**Cobertura Necesaria:** 85%+
- Vacation request creation/approval
- Balance calculations
- Conflict detection (overlapping requests)
- Expiration rules

**Técnicas:**
```python
# Mock: Database operations
# Test: Balance deduction logic
# Test: Approval workflow states
# Test: Date validation (past dates, holidays)
```

### 1.2 Servicios con Tests Parciales (Ampliar)

| Servicio | Test Actual | Coverage Estimada | Target |
|----------|-------------|-------------------|--------|
| payroll_service | test_payroll_service.py | ~60% | 95% |
| ai_gateway | test_ai_gateway.py | ~70% | 85% |
| timer_card parsers | test_timer_card_parsers.py | ~75% | 90% |

**Ampliar con:**
- Edge cases
- Error handling paths
- Integration scenarios
- Performance tests

### 1.3 Servicios con Cobertura Baja Prioridad

```
- additional_charge_service (crud básico)
- ai_budget_service (tracking simple)
- ai_usage_service (logging)
- analytics_service (reporting)
- audit_service (logging)
- batch_optimizer (performance)
- cache_service (redis wrapper)
- candidate_service (crud)
- config_service (config reader)
- employee_matching_service (algoritmo)
- face_detection_service (Azure API)
- hybrid_ocr_service (wrapper)
- import_service (file processing)
- ocr_cache_service (cache wrapper)
- photo_service (file handling)
- prompt_optimizer (AI prompting)
- report_service (PDF generation)
- streaming_service (SSE)
```

**Target:** 70% (tests básicos de happy path + error handling)

---

## 2. FRONTEND TEST STRATEGY (Target: 75%+)

### 2.1 Configuración Inicial

**CRÍTICO:** Actualmente NO existen unit tests en frontend.

**Acción Requerida:**
1. Instalar Vitest + Testing Library
2. Configurar vitest.config.ts
3. Setup test utilities (mocks, helpers)
4. Crear primeros tests como ejemplos

### 2.2 Stores (Zustand) - Prioridad ALTA

#### A) auth-store.ts
**Cobertura Necesaria:** 90%+
```typescript
// Tests necesarios:
- login() sets token and user
- logout() clears state and cookie
- setUser() updates user data
- Cookie persistence
- Rehydration from localStorage
- clearPermissionCache on logout
```

**Técnicas:**
```typescript
// Mock: localStorage
// Mock: document.cookie
// Mock: clearPermissionCache
// Test: State mutations
// Test: Persistence middleware
```

#### B) payroll-store.ts
**Cobertura Necesaria:** 85%+
```typescript
// Tests necesarios:
- setFilters() updates filter state
- clearFilters() resets to defaults
- setSelectedEmployee()
- Date range validation
```

#### C) salary-store.ts
**Cobertura Necesaria:** 85%+
```typescript
// Tests necesarios:
- setSalaryData()
- setDateRange()
- State initialization
```

#### D) Otros Stores (70%+)
- fonts-store.ts (font preferences)
- layout-store.ts (UI layout)
- settings-store.ts (user settings)
- themeStore.ts (theme management)

### 2.3 Components Críticos - Prioridad ALTA

#### A) SalaryReportFilters.tsx
**Cobertura Necesaria:** 85%+
```typescript
// Tests necesarios:
- Renders all filter inputs
- Date range selection works
- Checkbox toggles (paid/unpaid)
- onApplyFilters called with correct data
- onClearFilters resets state
- Preset buttons set correct dates
- Loading state disables buttons
```

**Técnicas:**
```typescript
// Mock: onApplyFilters callback
// Mock: onClearFilters callback
// Test: User interactions (fireEvent)
// Test: Form validation
// Test: Date calculations
```

#### B) PayrollSummaryCard.tsx
**Cobertura Necesaria:** 80%+
```typescript
// Tests necesarios:
- Displays payroll data correctly
- Formats currency (¥)
- Shows loading state
- Handles missing data gracefully
- Click interactions
```

**Técnicas:**
```typescript
// Mock: payroll data
// Test: Number formatting
// Test: Conditional rendering
// Test: Loading skeleton
```

#### C) OCRUploader.tsx / AzureOCRUploader.tsx
**Cobertura Necesaria:** 80%+
```typescript
// Tests necesarios:
- File selection triggers upload
- Validates file types (image only)
- Shows upload progress
- Displays OCR results
- Error handling (network, invalid file)
- Retry mechanism
```

**Técnicas:**
```typescript
// Mock: fetch (API calls)
// Mock: FileReader
// Mock: File object
// Test: Drag & drop
// Test: Progress indicators
// Test: Error messages
```

#### D) EmployeeForm.tsx (componente grande)
**Cobertura Necesaria:** 75%+
```typescript
// Tests necesarios:
- All form fields render
- Validation works (required fields)
- Submit calls onSubmit with data
- Edit mode pre-fills data
- Cancel button works
- Photo upload integration
```

### 2.4 Components con Prioridad Media

```
- QuickActions.tsx (dashboard actions)
- ReportsChart.tsx (recharts wrapper)
- ErrorBoundary.tsx (error handling)
- LoadingSkeletons.tsx (UI states)
- Data tables (pagination, sorting)
- Metric cards (display components)
```

**Target:** 70%

### 2.5 Hooks Personalizados

Si existen custom hooks:
```
- useAuth
- useFetch
- useDebounce
- etc.
```

**Target:** 80%+

---

## 3. INTEGRATION TESTS (Target: 50 tests)

### 3.1 Backend API Integration

**Ya existen algunos:**
- test_payroll_api_integration.py
- test_employee_payroll_integration.py
- test_timer_card_ocr_integration.py

**Ampliar con:**
```python
# Auth flow completo
test_login_to_protected_endpoint()

# Payroll calculation end-to-end
test_timer_card_to_salary_calculation()

# OCR to database
test_ocr_upload_creates_timer_card()

# Notification triggers
test_payroll_approved_sends_email()

# Yukyu approval workflow
test_yukyu_request_approval_flow()
```

### 3.2 Frontend E2E (Playwright)

**Ya existen 16 tests E2E** - Mantener y ampliar:
- payroll.spec.ts
- yukyu-all.spec.ts
- navigation.spec.ts
- etc.

**Ampliar con:**
```typescript
// Cross-component workflows
test('salary calculation and report generation')
test('OCR upload and payroll creation')
test('multi-step form completion')

// Error recovery
test('recovers from network errors')
test('handles session timeout')

// Accessibility
test('keyboard navigation works')
test('screen reader compatibility')
```

---

## 4. TEST EXAMPLES (READY TO COPY)

### 4.1 Backend Example 1: Auth Service Unit Test

```python
# backend/tests/test_auth_service.py
"""Unit tests for auth_service.py"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timedelta
from jose import jwt

from app.services.auth_service import auth_service
from app.core.config import settings


class TestAuthService:
    """Test suite for authentication service"""

    def test_password_hashing_and_verification(self):
        """Test password hashing and verification"""
        password = "SecurePassword123!"
        
        # Hash password
        hashed = auth_service.get_password_hash(password)
        
        # Verify correct password
        assert auth_service.verify_password(password, hashed) is True
        
        # Verify incorrect password
        assert auth_service.verify_password("WrongPassword", hashed) is False
        
        # Ensure hash is different each time
        hashed2 = auth_service.get_password_hash(password)
        assert hashed != hashed2

    def test_create_access_token(self):
        """Test JWT token creation"""
        user_data = {
            "sub": "testuser@example.com",
            "user_id": 123,
            "role": "admin"
        }
        
        # Create token
        token = auth_service.create_access_token(data=user_data)
        
        # Decode and verify
        decoded = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        
        assert decoded["sub"] == user_data["sub"]
        assert decoded["user_id"] == user_data["user_id"]
        assert decoded["role"] == user_data["role"]
        assert "exp" in decoded

    def test_create_access_token_with_expiration(self):
        """Test token creation with custom expiration"""
        user_data = {"sub": "user@example.com"}
        expires_delta = timedelta(minutes=30)
        
        token = auth_service.create_access_token(
            data=user_data,
            expires_delta=expires_delta
        )
        
        decoded = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        
        # Check expiration is approximately 30 minutes from now
        exp_time = datetime.fromtimestamp(decoded["exp"])
        expected_exp = datetime.utcnow() + expires_delta
        
        # Allow 5 seconds tolerance
        assert abs((exp_time - expected_exp).total_seconds()) < 5

    def test_verify_token_expired(self):
        """Test token verification with expired token"""
        user_data = {"sub": "user@example.com"}
        
        # Create token that expires immediately
        token = auth_service.create_access_token(
            data=user_data,
            expires_delta=timedelta(seconds=-1)  # Already expired
        )
        
        # Verify token fails
        with pytest.raises(Exception):  # Adjust to your exception type
            auth_service.verify_token(token)

    @patch('app.services.auth_service.SessionLocal')
    def test_authenticate_user_success(self, mock_session):
        """Test successful user authentication"""
        # Mock database session
        mock_db = MagicMock()
        mock_session.return_value = mock_db
        
        # Mock user
        mock_user = Mock()
        mock_user.username = "testuser"
        mock_user.password_hash = auth_service.get_password_hash("password123")
        mock_user.is_active = True
        
        mock_db.query().filter().first.return_value = mock_user
        
        # Test authentication
        result = auth_service.authenticate_user("testuser", "password123")
        
        assert result is not None
        assert result.username == "testuser"

    @patch('app.services.auth_service.SessionLocal')
    def test_authenticate_user_wrong_password(self, mock_session):
        """Test authentication fails with wrong password"""
        mock_db = MagicMock()
        mock_session.return_value = mock_db
        
        mock_user = Mock()
        mock_user.username = "testuser"
        mock_user.password_hash = auth_service.get_password_hash("password123")
        
        mock_db.query().filter().first.return_value = mock_user
        
        # Test with wrong password
        result = auth_service.authenticate_user("testuser", "wrongpassword")
        
        assert result is None

    @patch('app.services.auth_service.SessionLocal')
    def test_authenticate_user_not_found(self, mock_session):
        """Test authentication fails when user doesn't exist"""
        mock_db = MagicMock()
        mock_session.return_value = mock_db
        
        mock_db.query().filter().first.return_value = None
        
        result = auth_service.authenticate_user("nonexistent", "password")
        
        assert result is None


# Run with: pytest backend/tests/test_auth_service.py -v
```

### 4.2 Backend Example 2: Notification Service Unit Test

```python
# backend/tests/test_notification_service.py
"""Unit tests for notification_service.py"""
import pytest
from unittest.mock import Mock, patch, MagicMock, call
import smtplib

from app.services.notification_service import NotificationService


class TestNotificationService:
    """Test suite for notification service"""

    @pytest.fixture
    def notification_service(self):
        """Create notification service instance"""
        with patch('app.services.notification_service.settings') as mock_settings:
            mock_settings.SMTP_SERVER = "smtp.test.com"
            mock_settings.SMTP_PORT = 587
            mock_settings.SMTP_USER = "test@test.com"
            mock_settings.SMTP_PASSWORD = "testpass"
            mock_settings.SMTP_FROM = "noreply@test.com"
            mock_settings.LINE_CHANNEL_ACCESS_TOKEN = "test-line-token"
            
            service = NotificationService()
            return service

    @patch('app.services.notification_service.smtplib.SMTP')
    def test_send_email_success(self, mock_smtp, notification_service):
        """Test successful email sending"""
        # Mock SMTP server
        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server
        
        # Send email
        result = notification_service.send_email(
            to="recipient@example.com",
            subject="Test Subject",
            body="<h1>Test Body</h1>",
            is_html=True
        )
        
        # Verify success
        assert result is True
        
        # Verify SMTP calls
        mock_smtp.assert_called_once_with("smtp.test.com", 587)
        mock_server.starttls.assert_called_once()
        mock_server.login.assert_called_once_with("test@test.com", "testpass")
        mock_server.send_message.assert_called_once()

    @patch('app.services.notification_service.smtplib.SMTP')
    def test_send_email_with_attachment(self, mock_smtp, notification_service):
        """Test email with attachment"""
        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server
        
        # Create test file path
        test_file = "/tmp/test_attachment.pdf"
        
        with patch('pathlib.Path.exists', return_value=True):
            with patch('builtins.open', create=True) as mock_open:
                mock_open.return_value.__enter__.return_value.read.return_value = b'PDF content'
                
                result = notification_service.send_email(
                    to="recipient@example.com",
                    subject="Report",
                    body="See attachment",
                    attachments=[test_file]
                )
        
        assert result is True
        mock_server.send_message.assert_called_once()

    @patch('app.services.notification_service.smtplib.SMTP')
    def test_send_email_smtp_error(self, mock_smtp, notification_service):
        """Test email sending handles SMTP errors"""
        # Mock SMTP to raise exception
        mock_smtp.side_effect = smtplib.SMTPException("Connection failed")
        
        result = notification_service.send_email(
            to="recipient@example.com",
            subject="Test",
            body="Test body"
        )
        
        # Should return False on error
        assert result is False

    @patch('app.services.notification_service.requests.post')
    def test_send_line_notification_success(self, mock_post, notification_service):
        """Test successful LINE notification"""
        # Mock successful response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response
        
        result = notification_service.send_line_notification(
            user_id="U1234567890abcdef",
            message="Test notification"
        )
        
        assert result is True
        
        # Verify API call
        mock_post.assert_called_once()
        call_args = mock_post.call_args
        
        assert "https://api.line.me/v2/bot/message/push" in call_args[0][0]
        assert call_args[1]['headers']['Authorization'] == "Bearer test-line-token"
        assert call_args[1]['json']['to'] == "U1234567890abcdef"

    @patch('app.services.notification_service.requests.post')
    def test_send_line_notification_api_error(self, mock_post, notification_service):
        """Test LINE notification handles API errors"""
        # Mock failed response
        mock_response = Mock()
        mock_response.status_code = 400
        mock_response.text = "Invalid request"
        mock_post.return_value = mock_response
        
        result = notification_service.send_line_notification(
            user_id="invalid",
            message="Test"
        )
        
        assert result is False

    @patch('app.services.notification_service.requests.post')
    def test_send_line_notification_network_error(self, mock_post, notification_service):
        """Test LINE notification handles network errors"""
        # Mock network exception
        mock_post.side_effect = Exception("Network error")
        
        result = notification_service.send_line_notification(
            user_id="U1234567890",
            message="Test"
        )
        
        assert result is False


# Run with: pytest backend/tests/test_notification_service.py -v --cov=app.services.notification_service
```

### 4.3 Backend Example 3: Payroll Calculation Edge Cases

```python
# backend/tests/test_payroll_edge_cases.py
"""Edge case tests for payroll calculations"""
import pytest
from decimal import Decimal
from datetime import datetime, time

from app.services.payroll_service import PayrollService


class TestPayrollEdgeCases:
    """Test edge cases in payroll calculations"""

    @pytest.fixture
    def payroll_service(self):
        """Create payroll service instance"""
        return PayrollService()

    def test_night_shift_premium_calculation(self, payroll_service):
        """Test night shift premium (22:00-05:00)"""
        timer_cards = [
            {
                "work_date": "2024-01-15",
                "clock_in": "20:00",
                "clock_out": "02:00"  # 6 hours, 4 during night (22:00-02:00)
            }
        ]
        
        factory_config = {"jikyu_tanka": 1500}
        
        result = payroll_service.calculate_monthly_payroll(
            employee_id=1,
            year=2024,
            month=1,
            timer_cards=timer_cards,
            factory_config=factory_config
        )
        
        # 2 hours normal (20:00-22:00) + 4 hours night (22:00-02:00)
        assert result["hours"]["night_hours"] == 4.0
        assert result["hours"]["total_hours"] == 6.0
        
        # Night premium: 4 hours * 1500 * 0.25 = ¥1,500
        assert result["payments"]["night_premium"] == pytest.approx(1500)

    def test_overtime_on_holiday(self, payroll_service):
        """Test overtime hours on a holiday (both premiums apply)"""
        timer_cards = [
            {
                "work_date": "2024-01-01",  # New Year's Day (holiday)
                "clock_in": "09:00",
                "clock_out": "19:00"  # 10 hours (2 overtime)
            }
        ]
        
        factory_config = {"jikyu_tanka": 1500}
        
        result = payroll_service.calculate_monthly_payroll(
            employee_id=1,
            year=2024,
            month=1,
            timer_cards=timer_cards,
            factory_config=factory_config,
            holidays=["2024-01-01"]
        )
        
        # All hours count as holiday hours
        assert result["hours"]["holiday_hours"] == 10.0
        
        # Holiday rate is 1.35 (135%)
        # 10 hours * 1500 * 1.35 = ¥20,250
        assert result["payments"]["holiday_pay"] == pytest.approx(20250)

    def test_multiple_deductions(self, payroll_service):
        """Test multiple deductions from gross pay"""
        timer_cards = [
            {
                "work_date": "2024-01-15",
                "clock_in": "09:00",
                "clock_out": "18:00"
            }
        ]
        
        factory_config = {"jikyu_tanka": 1500}
        
        deductions = [
            {"type": "insurance", "amount": 5000},
            {"type": "tax", "amount": 3000},
            {"type": "apartment", "amount": 30000},
            {"type": "pension", "amount": 8000}
        ]
        
        result = payroll_service.calculate_monthly_payroll(
            employee_id=1,
            year=2024,
            month=1,
            timer_cards=timer_cards,
            factory_config=factory_config,
            deductions=deductions
        )
        
        total_deductions = sum(d["amount"] for d in deductions)
        assert result["deductions"]["total"] == total_deductions
        
        # Net pay = gross - total deductions
        expected_net = result["gross_pay"] - total_deductions
        assert result["net_pay"] == pytest.approx(expected_net)

    def test_zero_hours_worked(self, payroll_service):
        """Test payroll when no hours worked"""
        timer_cards = []
        factory_config = {"jikyu_tanka": 1500}
        
        result = payroll_service.calculate_monthly_payroll(
            employee_id=1,
            year=2024,
            month=1,
            timer_cards=timer_cards,
            factory_config=factory_config
        )
        
        assert result["hours"]["total_hours"] == 0
        assert result["gross_pay"] == 0
        assert result["net_pay"] == 0

    def test_cross_midnight_shift(self, payroll_service):
        """Test shift that crosses midnight"""
        timer_cards = [
            {
                "work_date": "2024-01-15",
                "clock_in": "23:00",
                "clock_out": "07:00"  # Next day, 8 hours total
            }
        ]
        
        factory_config = {"jikyu_tanka": 1500}
        
        result = payroll_service.calculate_monthly_payroll(
            employee_id=1,
            year=2024,
            month=1,
            timer_cards=timer_cards,
            factory_config=factory_config
        )
        
        # 8 hours total: 23:00-05:00 (6 hours night) + 05:00-07:00 (2 hours normal)
        assert result["hours"]["total_hours"] == 8.0
        assert result["hours"]["night_hours"] == 6.0

    def test_rounding_precision(self, payroll_service):
        """Test decimal rounding in calculations"""
        timer_cards = [
            {
                "work_date": "2024-01-15",
                "clock_in": "09:00",
                "clock_out": "17:30"  # 8.5 hours
            }
        ]
        
        factory_config = {"jikyu_tanka": 1333}  # Odd number
        
        result = payroll_service.calculate_monthly_payroll(
            employee_id=1,
            year=2024,
            month=1,
            timer_cards=timer_cards,
            factory_config=factory_config
        )
        
        # Ensure calculations use proper decimal precision
        assert isinstance(result["gross_pay"], (int, float, Decimal))
        
        # 8.5 * 1333 = 11,330.5 -> should round to 11,331
        expected_pay = 8.5 * 1333
        assert abs(result["gross_pay"] - expected_pay) < 1  # Within ¥1


# Run with: pytest backend/tests/test_payroll_edge_cases.py -v
```

### 4.4 Frontend Example 1: Auth Store Test

```typescript
// frontend/stores/__tests__/auth-store.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '../auth-store';

// Mock clearPermissionCache
vi.mock('@/lib/cache/permission-cache', () => ({
  clearPermissionCache: vi.fn()
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Clear cookies
    document.cookie.split(";").forEach(c => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // Reset store state
    useAuthStore.setState({
      token: null,
      user: null,
      isAuthenticated: false,
      isHydrated: false
    });
  });

  it('initializes with unauthenticated state', () => {
    const { result } = renderHook(() => useAuthStore());
    
    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('login sets token, user, and authenticated state', () => {
    const { result } = renderHook(() => useAuthStore());
    
    const mockToken = 'test-jwt-token';
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      role: 'admin'
    };

    act(() => {
      result.current.login(mockToken, mockUser);
    });

    expect(result.current.token).toBe(mockToken);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('login persists to localStorage', () => {
    const { result } = renderHook(() => useAuthStore());
    
    const mockToken = 'test-token';
    const mockUser = { id: 1, username: 'test' };

    act(() => {
      result.current.login(mockToken, mockUser);
    });

    // Check localStorage persistence
    const stored = localStorage.getItem('auth-storage');
    expect(stored).toBeTruthy();
    
    const parsed = JSON.parse(stored!);
    expect(parsed.state.token).toBe(mockToken);
    expect(parsed.state.user).toEqual(mockUser);
  });

  it('login writes auth cookie', () => {
    const { result } = renderHook(() => useAuthStore());
    
    const mockToken = 'test-token';
    const mockUser = { id: 1, username: 'test' };

    act(() => {
      result.current.login(mockToken, mockUser);
    });

    // Check cookie was set
    expect(document.cookie).toContain('uns-auth-token=');
    expect(document.cookie).toContain(encodeURIComponent(mockToken));
  });

  it('logout clears state and storage', async () => {
    const { result } = renderHook(() => useAuthStore());
    const { clearPermissionCache } = await import('@/lib/cache/permission-cache');
    
    // First login
    act(() => {
      result.current.login('token', { id: 1, username: 'test' });
    });

    // Then logout
    act(() => {
      result.current.logout();
    });

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    
    // Check localStorage cleared
    const stored = localStorage.getItem('auth-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      expect(parsed.state.token).toBeNull();
    }
    
    // Check permission cache was cleared
    expect(clearPermissionCache).toHaveBeenCalled();
  });

  it('logout clears auth cookie', () => {
    const { result } = renderHook(() => useAuthStore());
    
    // Login first
    act(() => {
      result.current.login('token', { id: 1, username: 'test' });
    });

    // Logout
    act(() => {
      result.current.logout();
    });

    // Cookie should be cleared (Max-Age=0)
    const cookies = document.cookie;
    const authCookie = cookies.split(';').find(c => c.includes('uns-auth-token'));
    
    // Either cookie is gone or has empty value
    expect(!authCookie || authCookie.includes('uns-auth-token=')).toBe(true);
  });

  it('setUser updates user data without changing token', () => {
    const { result } = renderHook(() => useAuthStore());
    
    // Initial login
    act(() => {
      result.current.login('token', { id: 1, username: 'old' });
    });

    const newUser = { id: 1, username: 'updated', email: 'new@example.com' };

    // Update user
    act(() => {
      result.current.setUser(newUser);
    });

    expect(result.current.user).toEqual(newUser);
    expect(result.current.token).toBe('token'); // Token unchanged
  });

  it('rehydrate restores state from localStorage', () => {
    // Manually set localStorage
    const storedState = {
      state: {
        token: 'stored-token',
        user: { id: 2, username: 'stored' },
        isAuthenticated: true
      },
      version: 0
    };
    localStorage.setItem('auth-storage', JSON.stringify(storedState));

    // Create new hook instance (simulates page reload)
    const { result } = renderHook(() => useAuthStore());

    act(() => {
      result.current.rehydrate();
    });

    // Should restore from localStorage
    expect(result.current.token).toBe('stored-token');
    expect(result.current.user).toEqual({ id: 2, username: 'stored' });
  });

  it('handles missing user gracefully', () => {
    const { result } = renderHook(() => useAuthStore());
    
    act(() => {
      result.current.login('token', null as any);
    });

    expect(result.current.token).toBe('token');
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(true); // Still authenticated with token
  });
});

// Run with: npm run test -- auth-store.test.ts
```

### 4.5 Frontend Example 2: SalaryReportFilters Component Test

```typescript
// frontend/components/salary/__tests__/SalaryReportFilters.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SalaryReportFiltersComponent } from '../SalaryReportFilters';

describe('SalaryReportFilters', () => {
  const mockOnApplyFilters = vi.fn();
  const mockOnClearFilters = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all filter inputs', () => {
    render(
      <SalaryReportFiltersComponent
        onApplyFilters={mockOnApplyFilters}
        onClearFilters={mockOnClearFilters}
      />
    );

    // Check date inputs exist
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
    
    // Check checkboxes
    expect(screen.getByLabelText(/paid only/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/include unpaid/i)).toBeInTheDocument();
    
    // Check buttons
    expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('applies filters with correct data', async () => {
    const user = userEvent.setup();
    
    render(
      <SalaryReportFiltersComponent
        onApplyFilters={mockOnApplyFilters}
        onClearFilters={mockOnClearFilters}
      />
    );

    // Set date range
    const startInput = screen.getByLabelText(/start date/i);
    const endInput = screen.getByLabelText(/end date/i);
    
    await user.type(startInput, '2024-01-01');
    await user.type(endInput, '2024-01-31');
    
    // Check paid only
    const paidCheckbox = screen.getByLabelText(/paid only/i);
    await user.click(paidCheckbox);

    // Apply filters
    const applyButton = screen.getByRole('button', { name: /apply/i });
    await user.click(applyButton);

    // Verify callback
    expect(mockOnApplyFilters).toHaveBeenCalledWith({
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      include_paid_only: true
    });
  });

  it('clears all filters when clear button clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <SalaryReportFiltersComponent
        onApplyFilters={mockOnApplyFilters}
        onClearFilters={mockOnClearFilters}
      />
    );

    // Set some filters
    const startInput = screen.getByLabelText(/start date/i);
    await user.type(startInput, '2024-01-01');
    
    const paidCheckbox = screen.getByLabelText(/paid only/i);
    await user.click(paidCheckbox);

    // Clear filters
    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    // Verify state reset
    expect(startInput).toHaveValue('');
    expect(paidCheckbox).not.toBeChecked();
    
    // Verify callback
    expect(mockOnClearFilters).toHaveBeenCalled();
  });

  it('disables buttons when loading', () => {
    render(
      <SalaryReportFiltersComponent
        onApplyFilters={mockOnApplyFilters}
        onClearFilters={mockOnClearFilters}
        loading={true}
      />
    );

    const applyButton = screen.getByRole('button', { name: /apply/i });
    const clearButton = screen.getByRole('button', { name: /clear/i });

    expect(applyButton).toBeDisabled();
    expect(clearButton).toBeDisabled();
  });

  it('preset "This Month" sets correct dates', async () => {
    const user = userEvent.setup();
    
    render(
      <SalaryReportFiltersComponent
        onApplyFilters={mockOnApplyFilters}
        onClearFilters={mockOnClearFilters}
      />
    );

    // Click "This Month" preset
    const thisMonthButton = screen.getByRole('button', { name: /this month/i });
    await user.click(thisMonthButton);

    // Get current month dates
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const expectedStart = firstDay.toISOString().split('T')[0];
    const expectedEnd = lastDay.toISOString().split('T')[0];

    // Verify dates set correctly
    const startInput = screen.getByLabelText(/start date/i);
    const endInput = screen.getByLabelText(/end date/i);
    
    expect(startInput).toHaveValue(expectedStart);
    expect(endInput).toHaveValue(expectedEnd);
  });

  it('preset "Last Month" sets correct dates', async () => {
    const user = userEvent.setup();
    
    render(
      <SalaryReportFiltersComponent
        onApplyFilters={mockOnApplyFilters}
        onClearFilters={mockOnClearFilters}
      />
    );

    const lastMonthButton = screen.getByRole('button', { name: /last month/i });
    await user.click(lastMonthButton);

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const expectedStart = firstDay.toISOString().split('T')[0];
    const expectedEnd = lastDay.toISOString().split('T')[0];

    const startInput = screen.getByLabelText(/start date/i);
    const endInput = screen.getByLabelText(/end date/i);
    
    expect(startInput).toHaveValue(expectedStart);
    expect(endInput).toHaveValue(expectedEnd);
  });

  it('handles multiple checkbox selections', async () => {
    const user = userEvent.setup();
    
    render(
      <SalaryReportFiltersComponent
        onApplyFilters={mockOnApplyFilters}
        onClearFilters={mockOnClearFilters}
      />
    );

    // Select both checkboxes
    await user.click(screen.getByLabelText(/paid only/i));
    await user.click(screen.getByLabelText(/include unpaid/i));
    
    await user.click(screen.getByRole('button', { name: /apply/i }));

    expect(mockOnApplyFilters).toHaveBeenCalledWith({
      include_paid_only: true,
      include_unpaid: true
    });
  });

  it('does not include empty filters in applied data', async () => {
    const user = userEvent.setup();
    
    render(
      <SalaryReportFiltersComponent
        onApplyFilters={mockOnApplyFilters}
        onClearFilters={mockOnClearFilters}
      />
    );

    // Only set start date, leave end date empty
    const startInput = screen.getByLabelText(/start date/i);
    await user.type(startInput, '2024-01-01');
    
    await user.click(screen.getByRole('button', { name: /apply/i }));

    // Should only include start_date, not end_date
    expect(mockOnApplyFilters).toHaveBeenCalledWith({
      start_date: '2024-01-01'
    });
  });
});

// Run with: npm run test -- SalaryReportFilters.test.tsx
```

### 4.6 Frontend Example 3: OCRUploader Component Test

```typescript
// frontend/components/__tests__/OCRUploader.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OCRUploader } from '../OCRUploader';

// Mock fetch globally
global.fetch = vi.fn();

describe('OCRUploader', () => {
  const mockOnUploadComplete = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockReset();
  });

  it('renders upload zone', () => {
    render(
      <OCRUploader
        onUploadComplete={mockOnUploadComplete}
        onError={mockOnError}
      />
    );

    expect(screen.getByText(/drag.*drop/i)).toBeInTheDocument();
    expect(screen.getByText(/click to upload/i)).toBeInTheDocument();
  });

  it('accepts image files', async () => {
    render(
      <OCRUploader
        onUploadComplete={mockOnUploadComplete}
        onError={mockOnError}
      />
    );

    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/upload/i);

    // Mock successful upload
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          text: 'Extracted text from OCR',
          confidence: 0.95
        }
      })
    });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/ocr'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData)
        })
      );
    });

    await waitFor(() => {
      expect(mockOnUploadComplete).toHaveBeenCalledWith({
        text: 'Extracted text from OCR',
        confidence: 0.95
      });
    });
  });

  it('rejects non-image files', async () => {
    render(
      <OCRUploader
        onUploadComplete={mockOnUploadComplete}
        onError={mockOnError}
      />
    );

    const file = new File(['dummy'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/upload/i);

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('image')
      );
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('shows upload progress', async () => {
    render(
      <OCRUploader
        onUploadComplete={mockOnUploadComplete}
        onError={mockOnError}
      />
    );

    const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/upload/i);

    // Mock slow upload
    (global.fetch as any).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    fireEvent.change(input, { target: { files: [file] } });

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText(/uploading/i)).toBeInTheDocument();
    });
  });

  it('displays OCR results', async () => {
    render(
      <OCRUploader
        onUploadComplete={mockOnUploadComplete}
        onError={mockOnError}
      />
    );

    const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/upload/i);

    const mockOCRResult = {
      text: 'Employee Name: John Doe\nDate: 2024-01-15',
      confidence: 0.92
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockOCRResult })
    });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
      expect(screen.getByText(/92%/)).toBeInTheDocument(); // Confidence
    });
  });

  it('handles upload errors gracefully', async () => {
    render(
      <OCRUploader
        onUploadComplete={mockOnUploadComplete}
        onError={mockOnError}
      />
    );

    const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/upload/i);

    // Mock failed upload
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'OCR service unavailable' })
    });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('OCR service unavailable')
      );
    });

    // Should show error message
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });

  it('handles network errors', async () => {
    render(
      <OCRUploader
        onUploadComplete={mockOnUploadComplete}
        onError={mockOnError}
      />
    );

    const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/upload/i);

    // Mock network error
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalled();
    });
  });

  it('supports retry after error', async () => {
    render(
      <OCRUploader
        onUploadComplete={mockOnUploadComplete}
        onError={mockOnError}
      />
    );

    const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/upload/i);

    // First attempt fails
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });

    // Retry button appears
    const retryButton = screen.getByRole('button', { name: /retry/i });
    
    // Second attempt succeeds
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { text: 'Success', confidence: 0.9 }
      })
    });

    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(mockOnUploadComplete).toHaveBeenCalled();
    });
  });

  it('validates file size', async () => {
    render(
      <OCRUploader
        onUploadComplete={mockOnUploadComplete}
        onError={mockOnError}
        maxFileSize={1024 * 1024} // 1MB
      />
    );

    // Create large file (2MB)
    const largeFile = new File(
      [new ArrayBuffer(2 * 1024 * 1024)],
      'large.jpg',
      { type: 'image/jpeg' }
    );
    
    const input = screen.getByLabelText(/upload/i);
    fireEvent.change(input, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('size')
      );
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });
});

// Run with: npm run test -- OCRUploader.test.tsx
```

---

## 5. CONFIGURATION FILES

### 5.1 Updated pytest.ini

```ini
# backend/pytest.ini
[pytest]
# Test discovery
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*

# Output and reporting
addopts =
    -v
    --strict-markers
    --tb=short
    --disable-warnings
    -p no:cacheprovider
    # Coverage options
    --cov=app
    --cov-report=html:coverage_html
    --cov-report=term-missing
    --cov-report=json:coverage.json
    # Fail if coverage below threshold
    --cov-fail-under=80

# Markers for test categorization
markers =
    slow: marks tests as slow (deselect with '-m "not slow"')
    integration: marks tests as integration tests (interact with real services)
    unit: marks tests as unit tests (isolated, fast)
    api: marks tests as API endpoint tests
    service: marks tests as service layer tests
    db: marks tests that require database
    asyncio: marks tests as async
    critical: marks critical business logic tests (auth, payroll)

# Asyncio configuration
asyncio_mode = auto

# Coverage configuration
[coverage:run]
source = app
omit =
    */tests/*
    */migrations/*
    */__pycache__/*
    */venv/*
    */site-packages/*
    app/main.py

[coverage:report]
precision = 2
exclude_lines =
    pragma: no cover
    def __repr__
    raise AssertionError
    raise NotImplementedError
    if __name__ == .__main__.:
    if TYPE_CHECKING:
    @abstractmethod

# Per-module coverage thresholds
[coverage:paths]
source =
    app/
    */app/

# Module-specific thresholds (enforced in CI)
# auth_service: 90%
# payroll_service: 95%
# notification_service: 85%
# ocr services: 80%
# yukyu_service: 85%
# other services: 70%

# Logging
log_cli = false
log_cli_level = INFO
log_cli_format = %(asctime)s [%(levelname)8s] %(message)s
log_cli_date_format = %Y-%m-%d %H:%M:%S

# Timeout for tests (requires pytest-timeout)
timeout = 300

# Parallel execution (requires pytest-xdist)
# Run with: pytest -n auto
```

### 5.2 New vitest.config.ts (Frontend)

```typescript
// frontend/vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Setup files
    setupFiles: ['./tests/setup.ts'],
    
    // Global test utilities
    globals: true,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      
      // Coverage thresholds
      thresholds: {
        lines: 75,
        functions: 75,
        branches: 70,
        statements: 75
      },
      
      // Files to include in coverage
      include: [
        'components/**/*.{ts,tsx}',
        'stores/**/*.{ts,tsx}',
        'hooks/**/*.{ts,tsx}',
        'lib/**/*.{ts,tsx}',
        'utils/**/*.{ts,tsx}'
      ],
      
      // Files to exclude from coverage
      exclude: [
        'node_modules/**',
        'tests/**',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/*.d.ts',
        '**/types/**',
        'e2e/**',
        'playwright.config.ts',
        'next.config.ts',
        'tailwind.config.ts'
      ],
      
      // Per-file thresholds
      perFile: true,
      
      // Critical files require higher coverage
      watermarks: {
        statements: [70, 90],
        functions: [70, 90],
        branches: [65, 85],
        lines: [70, 90]
      }
    },
    
    // Test file patterns
    include: [
      '**/__tests__/**/*.{test,spec}.{ts,tsx}',
      '**/*.{test,spec}.{ts,tsx}'
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules/**',
      'dist/**',
      '.next/**',
      'e2e/**'
    ],
    
    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Reporters
    reporters: ['verbose', 'json', 'html'],
    
    // Mock configuration
    mockReset: true,
    clearMocks: true,
    restoreMocks: true
  },
  
  // Path aliases (match tsconfig.json)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@/components': path.resolve(__dirname, 'components'),
      '@/lib': path.resolve(__dirname, 'lib'),
      '@/stores': path.resolve(__dirname, 'stores'),
      '@/hooks': path.resolve(__dirname, 'hooks'),
      '@/utils': path.resolve(__dirname, 'utils'),
      '@/types': path.resolve(__dirname, 'types')
    }
  }
});
```

### 5.3 Frontend Test Setup File

```typescript
// frontend/tests/setup.ts
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: '/',
    query: {},
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Setup localStorage mock
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Setup sessionStorage mock
global.sessionStorage = localStorageMock as any;

// Console error/warn suppression for known issues
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Not implemented: HTMLFormElement.prototype.submit')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
  
  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('useLayoutEffect')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
```

---

## 6. CI/CD INTEGRATION

### 6.1 GitHub Actions Workflow

```yaml
# .github/workflows/test-coverage.yml
name: Test Coverage

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend-tests:
    name: Backend Tests & Coverage
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install pytest-cov
      
      - name: Run tests with coverage
        run: |
          cd backend
          pytest --cov=app --cov-report=xml --cov-report=term --cov-fail-under=80
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
      
      - name: Upload backend coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage.xml
          flags: backend
          name: backend-coverage
      
      - name: Check critical module coverage
        run: |
          cd backend
          # Fail if critical modules below threshold
          pytest tests/test_auth_service.py --cov=app.services.auth_service --cov-fail-under=90
          pytest tests/test_payroll_*.py --cov=app.services.payroll_service --cov-fail-under=95
          pytest tests/test_notification_service.py --cov=app.services.notification_service --cov-fail-under=85

  frontend-tests:
    name: Frontend Tests & Coverage
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Run unit tests with coverage
        run: |
          cd frontend
          npm run test:coverage
      
      - name: Check coverage thresholds
        run: |
          cd frontend
          npm run test:coverage -- --coverage.thresholds.lines=75
      
      - name: Upload frontend coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/coverage-final.json
          flags: frontend
          name: frontend-coverage
      
      - name: Run E2E tests
        run: |
          cd frontend
          npx playwright install --with-deps
          npm run test:e2e
      
      - name: Upload E2E test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/playwright-report

  coverage-report:
    name: Combined Coverage Report
    needs: [backend-tests, frontend-tests]
    runs-on: ubuntu-latest
    
    steps:
      - name: Download coverage reports
        uses: actions/download-artifact@v3
      
      - name: Display coverage summary
        run: |
          echo "## Coverage Summary" >> $GITHUB_STEP_SUMMARY
          echo "Backend: See Codecov" >> $GITHUB_STEP_SUMMARY
          echo "Frontend: See Codecov" >> $GITHUB_STEP_SUMMARY
      
      - name: Comment PR with coverage
        if: github.event_name == 'pull_request'
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
```

### 6.2 Package.json Scripts (Frontend)

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test:coverage && npm run test:e2e"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/react": "^14.1.2",
    "@testing-library/user-event": "^14.5.1",
    "@vitest/ui": "^1.0.4",
    "@vitejs/plugin-react": "^4.2.1",
    "vitest": "^1.0.4",
    "@vitest/coverage-v8": "^1.0.4",
    "jsdom": "^23.0.1"
  }
}
```

---

## 7. IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Week 1)
- [ ] Install Vitest and testing dependencies (frontend)
- [ ] Create vitest.config.ts
- [ ] Create test setup files
- [ ] Update pytest.ini with coverage settings
- [ ] Create test utility functions/helpers

### Phase 2: Critical Services (Week 2)
- [ ] test_auth_service.py (90%+)
- [ ] test_notification_service.py (85%+)
- [ ] Expand test_payroll_service.py (95%+)
- [ ] test_timer_card_ocr_service.py (80%+)
- [ ] test_yukyu_service.py (85%+)

### Phase 3: Frontend Stores & Critical Components (Week 3)
- [ ] auth-store.test.ts (90%+)
- [ ] payroll-store.test.ts (85%+)
- [ ] salary-store.test.ts (85%+)
- [ ] SalaryReportFilters.test.tsx (85%+)
- [ ] OCRUploader.test.tsx (80%+)
- [ ] PayrollSummaryCard.test.tsx (80%+)

### Phase 4: Remaining Services (Week 4)
- [ ] Test remaining 17 backend services (70%+ each)
- [ ] Focus on happy path + error handling
- [ ] Mock external dependencies (Redis, Azure APIs)

### Phase 5: Frontend Components (Week 5)
- [ ] Component tests (70%+ coverage)
- [ ] Form validation tests
- [ ] User interaction tests
- [ ] Loading/error state tests

### Phase 6: Integration & E2E (Week 6)
- [ ] API integration tests
- [ ] Expand E2E test scenarios
- [ ] Cross-component workflows
- [ ] Error recovery tests

### Phase 7: CI/CD & Documentation (Week 7)
- [ ] Setup GitHub Actions workflow
- [ ] Configure Codecov
- [ ] Coverage badges
- [ ] Testing documentation
- [ ] Developer testing guide

---

## 8. SUCCESS METRICS

### Coverage Targets
- **Backend Global:** 85%+
- **Frontend Global:** 75%+
- **Combined:** 80%+

### Critical Module Targets
- auth_service: 90%+
- payroll_service: 95%+
- notification_service: 85%+
- OCR services: 80%+
- yukyu_service: 85%+
- Auth store: 90%+
- Critical components: 80%+

### Quality Metrics
- All tests pass in CI/CD
- No flaky tests (>99% consistency)
- Test execution time < 5 min (backend), < 3 min (frontend)
- Zero critical bugs in production after implementation

### Developer Experience
- Clear test examples for all patterns
- Easy to run tests locally
- Fast feedback loop
- Comprehensive documentation

---

## 9. MAINTENANCE PLAN

### Ongoing Activities
1. **Weekly:** Review coverage reports, identify gaps
2. **Monthly:** Update test examples with new patterns
3. **Quarterly:** Review and refactor flaky tests
4. **Per PR:** Require tests for new features (enforced in CI)

### Coverage Rules
- New code must have 80%+ coverage
- Bug fixes must include regression tests
- Refactoring should not decrease coverage
- Critical paths require 90%+ coverage

### Documentation
- Keep TEST_COVERAGE_PLAN.md updated
- Document new testing patterns
- Share test examples in team wiki
- Onboarding guide for new developers

---

## APPENDIX A: Quick Reference Commands

### Backend
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific module with threshold
pytest tests/test_auth_service.py --cov=app.services.auth_service --cov-fail-under=90

# Run only unit tests
pytest -m unit

# Run only integration tests
pytest -m integration

# Run in parallel
pytest -n auto
```

### Frontend
```bash
# Run all unit tests
npm run test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run with UI
npm run test:ui

# Run E2E tests
npm run test:e2e

# Run all tests
npm run test:all
```

---

## APPENDIX B: Common Mock Patterns

### Backend Mocking

```python
# Mock database session
@patch('app.services.some_service.SessionLocal')
def test_something(mock_session):
    mock_db = MagicMock()
    mock_session.return_value = mock_db
    # ...

# Mock external API
@patch('requests.post')
def test_api_call(mock_post):
    mock_post.return_value = Mock(status_code=200)
    # ...

# Mock datetime
@patch('app.services.some_service.datetime')
def test_time_based(mock_datetime):
    mock_datetime.now.return_value = datetime(2024, 1, 1)
    # ...
```

### Frontend Mocking

```typescript
// Mock API calls
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: 'mocked' })
  })
);

// Mock Zustand store
vi.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({
    user: { id: 1, username: 'test' },
    isAuthenticated: true
  })
}));

// Mock React hooks
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useState: vi.fn()
  };
});
```

---

**END OF TEST COVERAGE PLAN**

