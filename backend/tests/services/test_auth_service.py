"""
Unit tests for AuthService
Tests authentication, password hashing, and JWT token operations
"""

import pytest
from datetime import datetime, timedelta
from jose import jwt
from sqlalchemy.orm import Session

from app.services.auth_service import AuthService
from app.models.models import User
from app.core.config import settings
from tests.factories import UserFactory


@pytest.mark.unit
class TestPasswordHashing:
    """Test password hashing and verification."""
    
    def test_hash_password(self):
        """Test password hashing produces valid bcrypt hash."""
        # Arrange
        password = "TestPassword123!"
        
        # Act
        hashed = AuthService.get_password_hash(password)
        
        # Assert
        assert hashed is not None
        assert hashed != password
        assert hashed.startswith("$2b$")  # bcrypt format
    
    def test_verify_password_correct(self):
        """Test password verification with correct password."""
        # Arrange
        password = "TestPassword123!"
        hashed = AuthService.get_password_hash(password)
        
        # Act
        result = AuthService.verify_password(password, hashed)
        
        # Assert
        assert result is True
    
    def test_verify_password_incorrect(self):
        """Test password verification with incorrect password."""
        # Arrange
        correct_password = "TestPassword123!"
        wrong_password = "WrongPassword456!"
        hashed = AuthService.get_password_hash(correct_password)
        
        # Act
        result = AuthService.verify_password(wrong_password, hashed)
        
        # Assert
        assert result is False
    
    def test_hash_produces_different_hashes(self):
        """Test that same password produces different hashes (salt)."""
        # Arrange
        password = "TestPassword123!"
        
        # Act
        hash1 = AuthService.get_password_hash(password)
        hash2 = AuthService.get_password_hash(password)
        
        # Assert
        assert hash1 != hash2
        assert AuthService.verify_password(password, hash1)
        assert AuthService.verify_password(password, hash2)


@pytest.mark.unit
class TestJWTTokens:
    """Test JWT token creation and validation."""
    
    def test_create_access_token(self):
        """Test creating a valid JWT access token."""
        # Arrange
        user_id = "123"
        data = {"sub": user_id}
        
        # Act
        token = AuthService.create_access_token(data=data)
        
        # Assert
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0
        
        # Decode and verify
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        assert payload["sub"] == user_id
        assert "exp" in payload
    
    def test_create_token_with_custom_expiry(self):
        """Test creating token with custom expiration time."""
        # Arrange
        user_id = "123"
        data = {"sub": user_id}
        expires_delta = timedelta(minutes=15)
        
        # Act
        token = AuthService.create_access_token(
            data=data,
            expires_delta=expires_delta
        )
        
        # Assert
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        
        # Check expiration is approximately 15 minutes from now
        exp_timestamp = payload["exp"]
        expected_exp = datetime.utcnow() + expires_delta
        actual_exp = datetime.fromtimestamp(exp_timestamp)
        
        # Allow 5 second difference for test execution time
        assert abs((actual_exp - expected_exp).total_seconds()) < 5
    
    def test_token_contains_required_claims(self):
        """Test that token contains all required claims."""
        # Arrange
        user_id = "123"
        data = {"sub": user_id, "role": "user"}
        
        # Act
        token = AuthService.create_access_token(data=data)
        
        # Assert
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        
        assert "sub" in payload
        assert "exp" in payload
        assert "role" in payload
        assert payload["sub"] == user_id
        assert payload["role"] == "user"
    
    def test_decode_invalid_token(self):
        """Test decoding an invalid token raises error."""
        # Arrange
        invalid_token = "invalid.token.here"
        
        # Act & Assert
        with pytest.raises(Exception):  # jwt.JWTError
            jwt.decode(
                invalid_token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM]
            )
    
    def test_decode_expired_token(self):
        """Test decoding an expired token raises error."""
        # Arrange
        user_id = "123"
        data = {"sub": user_id}
        expires_delta = timedelta(seconds=-1)  # Already expired
        
        token = AuthService.create_access_token(
            data=data,
            expires_delta=expires_delta
        )
        
        # Act & Assert
        with pytest.raises(Exception):  # jwt.ExpiredSignatureError
            jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM]
            )


@pytest.mark.unit
class TestUserAuthentication:
    """Test user authentication methods."""
    
    def test_authenticate_user_success(self, db_session: Session):
        """Test successful user authentication."""
        # Arrange
        user_data = UserFactory.build()
        password = user_data["password"]
        
        # Create user with hashed password
        user = User(
            email=user_data["email"],
            username=user_data["username"],
            full_name=user_data["full_name"],
            hashed_password=AuthService.get_password_hash(password),
            is_active=True,
            is_superuser=False
        )
        db_session.add(user)
        db_session.commit()
        
        # Act
        authenticated_user = AuthService.authenticate_user(
            db=db_session,
            username=user_data["username"],
            password=password
        )
        
        # Assert
        assert authenticated_user is not None
        assert authenticated_user.username == user_data["username"]
        assert authenticated_user.email == user_data["email"]
    
    def test_authenticate_user_wrong_password(self, db_session: Session):
        """Test authentication fails with wrong password."""
        # Arrange
        user_data = UserFactory.build()
        password = user_data["password"]
        wrong_password = "WrongPassword123!"
        
        user = User(
            email=user_data["email"],
            username=user_data["username"],
            full_name=user_data["full_name"],
            hashed_password=AuthService.get_password_hash(password),
            is_active=True,
            is_superuser=False
        )
        db_session.add(user)
        db_session.commit()
        
        # Act
        authenticated_user = AuthService.authenticate_user(
            db=db_session,
            username=user_data["username"],
            password=wrong_password
        )
        
        # Assert
        assert authenticated_user is False
    
    def test_authenticate_user_not_found(self, db_session: Session):
        """Test authentication fails for non-existent user."""
        # Act
        authenticated_user = AuthService.authenticate_user(
            db=db_session,
            username="nonexistent_user",
            password="SomePassword123!"
        )
        
        # Assert
        assert authenticated_user is False
    
    def test_authenticate_inactive_user(self, db_session: Session):
        """Test authentication fails for inactive user."""
        # Arrange
        user_data = UserFactory.build(is_active=False)
        password = user_data["password"]
        
        user = User(
            email=user_data["email"],
            username=user_data["username"],
            full_name=user_data["full_name"],
            hashed_password=AuthService.get_password_hash(password),
            is_active=False,
            is_superuser=False
        )
        db_session.add(user)
        db_session.commit()
        
        # Act
        authenticated_user = AuthService.authenticate_user(
            db=db_session,
            username=user_data["username"],
            password=password
        )
        
        # Assert
        assert authenticated_user is False


@pytest.mark.unit
class TestTokenValidation:
    """Test token validation and user retrieval."""
    
    def test_get_current_user_from_valid_token(self, db_session: Session):
        """Test retrieving user from valid token."""
        # Arrange
        user_data = UserFactory.build()
        user = User(
            email=user_data["email"],
            username=user_data["username"],
            full_name=user_data["full_name"],
            hashed_password=AuthService.get_password_hash(user_data["password"]),
            is_active=True,
            is_superuser=False
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        token = AuthService.create_access_token(data={"sub": str(user.id)})
        
        # Act
        current_user = AuthService.get_current_user_from_token(
            token=token,
            db=db_session
        )
        
        # Assert
        assert current_user is not None
        assert current_user.id == user.id
        assert current_user.username == user.username
    
    def test_get_current_user_invalid_token(self, db_session: Session):
        """Test retrieving user from invalid token fails."""
        # Arrange
        invalid_token = "invalid.jwt.token"
        
        # Act & Assert
        with pytest.raises(Exception):
            AuthService.get_current_user_from_token(
                token=invalid_token,
                db=db_session
            )
    
    def test_get_current_user_token_missing_sub(self, db_session: Session):
        """Test token without 'sub' claim fails."""
        # Arrange
        token = AuthService.create_access_token(data={"user": "123"})  # No 'sub'
        
        # Act & Assert
        with pytest.raises(Exception):
            AuthService.get_current_user_from_token(
                token=token,
                db=db_session
            )


@pytest.mark.unit  
class TestPasswordReset:
    """Test password reset functionality."""
    
    def test_create_password_reset_token(self):
        """Test creating password reset token."""
        # Arrange
        email = "test@example.com"
        
        # Act
        token = AuthService.create_password_reset_token(email=email)
        
        # Assert
        assert token is not None
        assert isinstance(token, str)
        
        # Verify token contains email
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        assert payload["sub"] == email
        assert "exp" in payload
    
    def test_verify_password_reset_token_valid(self):
        """Test verifying valid password reset token."""
        # Arrange
        email = "test@example.com"
        token = AuthService.create_password_reset_token(email=email)
        
        # Act
        decoded_email = AuthService.verify_password_reset_token(token)
        
        # Assert
        assert decoded_email == email
    
    def test_verify_password_reset_token_invalid(self):
        """Test verifying invalid password reset token."""
        # Arrange
        invalid_token = "invalid.token.here"
        
        # Act
        result = AuthService.verify_password_reset_token(invalid_token)
        
        # Assert
        assert result is None
    
    def test_verify_password_reset_token_expired(self):
        """Test verifying expired password reset token."""
        # Arrange
        email = "test@example.com"
        token = AuthService.create_password_reset_token(
            email=email,
            expires_delta=timedelta(seconds=-1)
        )
        
        # Act
        result = AuthService.verify_password_reset_token(token)
        
        # Assert
        assert result is None
