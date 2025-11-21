"""
Tests de API para timer cards endpoints
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, MagicMock
import json
import tempfile

from app.main import app
from app.models.models import TimerCard, Employee, User
from app.core.database import SessionLocal

# Mock para el usuario admin
@pytest.fixture
def mock_admin_user():
    user = Mock(spec=User)
    user.id = 1
    user.email = "admin@test.com"
    user.username = "admin"
    user.role = "admin"
    return user

# Client de test con auth
@pytest.fixture
def client_with_auth(mock_admin_user):
    def _get_mock_user():
        return mock_admin_user
    
    app.dependency_overrides[get_mock_user] = _get_mock_user
    
    # Mock the auth service
    with patch('app.services.auth_service.auth_service.require_role') as mock_auth:
        mock_auth.return_value = mock_admin_user
        with TestClient(app) as c:
            yield c
    
    app.dependency_overrides.clear()

def get_mock_user():
    return Mock(spec=User)

class TestTimerCardsAPI:
    """Tests para endpoints de timer cards API"""

    def test_upload_timer_card_success(self, client_with_auth):
        """Test upload de PDF exitoso"""
        # Crear PDF mock
        pdf_content = b"PDF CONTENT"
        
        # Mock del OCR service
        with patch('app.api.timer_cards.timer_card_ocr_service') as mock_service:
            mock_service.process_pdf.return_value = {
                'success': True,
                'pages_processed': 1,
                'records_found': 3,
                'records': [
                    {
                        'work_date': '2025-10-01',
                        'clock_in': '08:00',
                        'clock_out': '17:00',
                        'break_minutes': 60,
                        'employee_matched': {
                            'hakenmoto_id': 1,
                            'full_name_kanji': '山田太郎',
                            'confidence': 0.95
                        }
                    }
                ],
                'processing_errors': []
            }
            
            response = client_with_auth.post(
                '/api/timer-cards/upload',
                files={'file': ('timer_card.pdf', pdf_content, 'application/pdf')},
                data={'factory_id': 'FACTORY_A'}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data['success'] is True
            assert data['pages_processed'] == 1
            assert data['records_found'] == 3
            assert len(data['records']) > 0
            assert data['records'][0]['employee_matched']['hakenmoto_id'] == 1

    def test_upload_timer_card_ocr_failure(self, client_with_auth):
        """Test falla del OCR"""
        pdf_content = b"PDF CONTENT"
        
        with patch('app.api.timer_cards.timer_card_ocr_service') as mock_service:
            mock_service.process_pdf.return_value = {
                'success': False,
                'error': 'OCR processing failed',
                'records': []
            }
            
            response = client_with_auth.post(
                '/api/timer-cards/upload',
                files={'file': ('timer_card.pdf', pdf_content, 'application/pdf')},
                data={'factory_id': 'FACTORY_A'}
            )
            
            assert response.status_code == 500
            data = response.json()
            assert 'error' in data

    def test_bulk_create_success(self, client_with_auth):
        """Test creación batch exitosa"""
        bulk_data = {
            'records': [
                {
                    'employee_id': 1,
                    'work_date': '2025-10-01',
                    'clock_in': '08:00:00',
                    'clock_out': '17:00:00',
                    'break_minutes': 60
                },
                {
                    'employee_id': 2,
                    'work_date': '2025-10-02',
                    'clock_in': '08:30:00',
                    'clock_out': '18:00:00',
                    'break_minutes': 60
                }
            ]
        }
        
        with patch('app.api.timer_cards.get_db') as mock_db:
            mock_db_instance = MagicMock()
            mock_db.return_value = mock_db_instance
            
            response = client_with_auth.post(
                '/api/timer-cards/bulk',
                json=bulk_data
            )
            
            assert response.status_code == 200
            data = response.json()
            assert 'successful' in data
            assert 'failed' in data
            assert 'created_ids' in data

    def test_unauthorized_access(self):
        """Test acceso sin autorización"""
        with TestClient(app) as c:
            response = c.post(
                '/api/timer-cards/bulk',
                json={'records': []}
            )
            
            assert response.status_code == 401 or response.status_code == 422
