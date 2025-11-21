"""
Authentication and Security Service for UNS-ClaudeJP 1.0
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import uuid4
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from fastapi.security.utils import get_authorization_scheme_param
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.audit import update_audit_context
from app.models.models import User, RefreshToken

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme (fallback for compatibility)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


class OAuth2PasswordBearerCookie(OAuth2PasswordBearer):
    """Custom OAuth2 scheme that reads tokens from HttpOnly cookies.

    Falls back to Authorization header if cookie not present (for API clients).
    Priority:
    1. HttpOnly cookie (preferred for browser clients)
    2. Authorization header (for API clients like Postman, mobile apps)
    """

    async def __call__(self, request: Request) -> Optional[str]:
        """Extract token from cookie or Authorization header.

        Args:
            request: FastAPI Request object

        Returns:
            str: JWT token if found, None otherwise

        Raises:
            HTTPException: 401 if no valid token found
        """
        # Try to get token from cookie first (HttpOnly - secure)
        token = request.cookies.get(settings.ACCESS_TOKEN_COOKIE_NAME)

        if token:
            return token

        # Fallback to Authorization header (for API clients)
        authorization = request.headers.get("Authorization")
        if authorization:
            scheme, param = get_authorization_scheme_param(authorization)
            if scheme.lower() == "bearer":
                return param

        # No token found
        if self.auto_error:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return None


# Updated OAuth2 scheme that reads from cookies
oauth2_scheme_cookie = OAuth2PasswordBearerCookie(tokenUrl="/api/auth/login")


class AuthService:
    """Servicio de autenticación y seguridad para el sistema UNS-ClaudeJP.

    Proporciona funcionalidades de:
    - Hashing seguro de contraseñas con bcrypt
    - Generación y validación de tokens JWT
    - Autenticación de usuarios
    - Verificación de roles y permisos

    Note:
        - Usa bcrypt para hashing de contraseñas (resistente a ataques de fuerza bruta)
        - JWT con algoritmo HS256 y claims completos
        - Jerarquía de roles completa (incluyendo legacy):
          SUPER_ADMIN (100) > ADMIN (80) > KEITOSAN (70) > TANTOSHA (60) >
          COORDINATOR (50) > KANRININSHA (40) > EMPLOYEE (20) > CONTRACT_WORKER (10)
        - Tokens expiran según configuración (default: 480 minutos)
        - Ver app.core.permissions para funciones de verificación de roles
    """

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verifica que una contraseña en texto plano coincida con su hash.

        Args:
            plain_password (str): Contraseña en texto plano
            hashed_password (str): Hash bcrypt de la contraseña

        Returns:
            bool: True si la contraseña coincide, False en caso contrario

        Note:
            Usa bcrypt para verificación segura resistente a timing attacks
        """
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def get_password_hash(password: str) -> str:
        """Genera un hash bcrypt seguro de una contraseña.

        Args:
            password (str): Contraseña en texto plano

        Returns:
            str: Hash bcrypt de la contraseña

        Examples:
            >>> hash = AuthService.get_password_hash("mypassword123")
            >>> assert hash.startswith("$2b$")  # Formato bcrypt

        Note:
            - Usa bcrypt con salt automático
            - El hash es diferente cada vez (por el salt único)
            - No es reversible (one-way hash)
        """
        return pwd_context.hash(password)

    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Crea un token JWT de acceso con claims completos.

        Args:
            data (dict): Datos a incluir en el token. DEBE contener 'sub' (subject/username)
            expires_delta (Optional[timedelta]): Tiempo de expiración custom.
                Si es None, usa settings.ACCESS_TOKEN_EXPIRE_MINUTES

        Returns:
            str: Token JWT firmado

        Raises:
            ValueError: Si data no contiene el campo 'sub' (subject)

        Examples:
            >>> token = AuthService.create_access_token(
            ...     data={"sub": "admin", "role": "ADMIN"}
            ... )
            >>> assert isinstance(token, str)

        Note:
            El token incluye claims estándar:
            - exp: Tiempo de expiración
            - iat: Tiempo de emisión
            - nbf: Not before (mismo que iat)
            - iss: Issuer (emisor del token)
            - aud: Audience (audiencia del token)
            - jti: JWT ID (único por token)
            - type: Tipo de token ("access")
        """
        if "sub" not in data:
            raise ValueError("Token payload must include subject")

        issued_at = datetime.now(timezone.utc)
        expire = issued_at + (
            expires_delta if expires_delta else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )

        to_encode = {
            **data,
            "exp": expire,
            "iat": issued_at,
            "nbf": issued_at,
            "iss": settings.JWT_ISSUER,
            "aud": settings.JWT_AUDIENCE,
            "jti": str(uuid4()),
            "type": "access",
        }

        return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    @staticmethod
    def create_refresh_token(
        db: Session,
        user: User,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> str:
        """Crea un refresh token para el usuario.

        Args:
            db: Sesión de base de datos
            user: Usuario para el cual crear el token
            user_agent: User-Agent del cliente (para auditoría)
            ip_address: Dirección IP del cliente (para auditoría)

        Returns:
            str: Refresh token JWT

        Note:
            - El refresh token se guarda en la base de datos
            - Expira después de REFRESH_TOKEN_EXPIRE_DAYS días
            - Incluye información de dispositivo para seguridad
        """
        # Generate refresh token
        issued_at = datetime.now(timezone.utc)
        expire = issued_at + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        token_data = {
            "sub": user.username,
            "type": "refresh",
            "exp": expire,
            "iat": issued_at,
            "nbf": issued_at,
            "iss": settings.JWT_ISSUER,
            "aud": settings.JWT_AUDIENCE,
            "jti": str(uuid4()),
        }

        token = jwt.encode(token_data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

        # Store in database
        refresh_token_record = RefreshToken(
            token=token,
            user_id=user.id,
            expires_at=expire,
            user_agent=user_agent,
            ip_address=ip_address
        )

        db.add(refresh_token_record)
        db.commit()

        return token

    @staticmethod
    def verify_refresh_token(db: Session, token: str) -> User:
        """Verifica un refresh token y retorna el usuario.

        Args:
            db: Sesión de base de datos
            token: Refresh token a verificar

        Returns:
            User: Usuario asociado al token

        Raises:
            HTTPException: 401 si token inválido, expirado o revocado

        Note:
            - Verifica firma JWT y expiración
            - Verifica que token existe en base de datos
            - Verifica que token no está revocado
        """
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

        try:
            # Decode JWT
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM],
                audience=settings.JWT_AUDIENCE,
                issuer=settings.JWT_ISSUER,
            )

            username = payload.get("sub")
            token_type = payload.get("type")

            if username is None or token_type != "refresh":
                raise credentials_exception

        except JWTError:
            raise credentials_exception

        # Check if token exists in database and is not revoked
        token_record = db.query(RefreshToken).filter(
            RefreshToken.token == token
        ).first()

        if not token_record:
            raise credentials_exception

        if token_record.revoked:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has been revoked"
            )

        # Check if token is expired (additional check)
        if token_record.expires_at < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has expired"
            )

        # Get user
        user = db.query(User).filter(User.username == username).first()
        if not user:
            raise credentials_exception

        return user

    @staticmethod
    def revoke_refresh_token(db: Session, token: str) -> bool:
        """Revoca un refresh token.

        Args:
            db: Sesión de base de datos
            token: Token a revocar

        Returns:
            bool: True si se revocó, False si no existía

        Note:
            - Marca el token como revocado en la base de datos
            - No elimina el token (para auditoría)
        """
        token_record = db.query(RefreshToken).filter(
            RefreshToken.token == token
        ).first()

        if not token_record:
            return False

        token_record.revoked = True
        token_record.revoked_at = datetime.now(timezone.utc)
        db.commit()

        return True

    @staticmethod
    def revoke_all_user_tokens(db: Session, user_id: int):
        """Revoca todos los refresh tokens de un usuario.

        Args:
            db: Sesión de base de datos
            user_id: ID del usuario

        Note:
            - Útil para logout global
            - Útil cuando se detecta actividad sospechosa
        """
        db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked == False
        ).update({
            "revoked": True,
            "revoked_at": datetime.now(timezone.utc)
        })
        db.commit()

    @staticmethod
    def cleanup_expired_tokens(db: Session) -> int:
        """Elimina tokens expirados y revocados de la base de datos.

        Args:
            db: Sesión de base de datos

        Returns:
            int: Número de tokens eliminados

        Note:
            - Debe ejecutarse periódicamente (ej: cron job)
            - Elimina tokens con expires_at < now() OR revoked = true
        """
        now = datetime.now(timezone.utc)

        # Delete expired or revoked tokens
        deleted = db.query(RefreshToken).filter(
            (RefreshToken.expires_at < now) | (RefreshToken.revoked == True)
        ).delete(synchronize_session=False)

        db.commit()

        return deleted

    @staticmethod
    def authenticate_user(db: Session, username: str, password: str):
        """Autentica un usuario con nombre de usuario y contraseña.

        Args:
            db (Session): Sesión de base de datos SQLAlchemy
            username (str): Nombre de usuario
            password (str): Contraseña en texto plano

        Returns:
            User | bool: Objeto User si autenticación exitosa, False si falla

        Note:
            - Verifica primero que el usuario existe
            - Luego valida la contraseña con bcrypt
            - Retorna False (no None) para compatibilidad con validaciones
        """
        user = db.query(User).filter(User.username == username).first()

        if not user:
            return False
        if not AuthService.verify_password(password, str(user.password_hash)):
            return False

        return user

    @staticmethod
    async def get_current_user(
        token: str = Depends(oauth2_scheme_cookie),
        db: Session = Depends(get_db)
    ):
        """Obtiene el usuario actual desde el token JWT.

        Valida el token JWT y retorna el usuario correspondiente desde la base de datos.

        Args:
            token (str): Token JWT de acceso (automático desde OAuth2 scheme)
            db (Session): Sesión de base de datos (automático desde dependency injection)

        Returns:
            User: Objeto User del usuario autenticado

        Raises:
            HTTPException: 401 Unauthorized si:
                - Token inválido o expirado
                - Token no contiene 'sub' (username)
                - Tipo de token incorrecto
                - Usuario no existe en base de datos

        Examples:
            >>> # En un endpoint protegido:
            >>> @router.get("/protected")
            >>> async def protected_route(
            ...     current_user: User = Depends(AuthService.get_current_user)
            ... ):
            ...     return {"username": current_user.username}

        Note:
            - Verifica firma, expiración, issuer y audience del JWT
            - Requiere que tipo de token sea "access"
            - Usuario debe existir en base de datos
        """
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM],
                audience=settings.JWT_AUDIENCE,
                issuer=settings.JWT_ISSUER,
            )
            username = payload.get("sub")
            token_type = payload.get("type")
            if username is None or token_type != "access":
                raise credentials_exception
        except JWTError:
            raise credentials_exception

        user = db.query(User).filter(User.username == username).first()
        if user is None:
            raise credentials_exception

        update_audit_context(user_id=user.id, username=user.username, role=user.role.name if user.role else None)

        return user
    
    @staticmethod
    async def get_current_active_user(
        token: str = Depends(oauth2_scheme_cookie),
        db: Session = Depends(get_db)
    ):
        """Obtiene el usuario actual verificando que esté activo.

        Wrapper sobre get_current_user que además verifica is_active=True.

        Args:
            token (str): Token JWT de acceso
            db (Session): Sesión de base de datos

        Returns:
            User: Usuario activo autenticado

        Raises:
            HTTPException: 401 si token inválido
            HTTPException: 400 si usuario está inactivo (is_active=False)

        Note:
            - Primero valida el token (get_current_user)
            - Luego verifica que is_active sea True
            - Usuarios inactivos no pueden acceder aunque tengan token válido
        """
        current_user = await AuthService.get_current_user(token, db)
        if not bool(current_user.is_active):
            raise HTTPException(status_code=400, detail="Inactive user")
        return current_user

    @staticmethod
    def require_role(required_role: str):
        """Crea un dependency que verifica el rol del usuario.

        Genera una función de validación que puede usarse como dependency
        en endpoints de FastAPI para requerir roles específicos.

        Args:
            required_role (str): Rol mínimo requerido. Opciones (de mayor a menor):
                - 'super_admin': Solo SUPER_ADMIN
                - 'admin': SUPER_ADMIN, ADMIN
                - 'coordinator': SUPER_ADMIN, ADMIN, COORDINATOR
                - 'kanrininsha': SUPER_ADMIN, ADMIN, COORDINATOR, KANRININSHA
                - 'employee': SUPER_ADMIN, ADMIN, COORDINATOR, KANRININSHA, EMPLOYEE
                - 'contract_worker': Todos los roles

        Returns:
            Callable: Función async que valida el rol del usuario

        Raises:
            HTTPException: 403 Forbidden si usuario no tiene rol suficiente

        Examples:
            >>> # Endpoint que requiere rol ADMIN o superior:
            >>> @router.post("/admin-only")
            >>> async def admin_endpoint(
            ...     current_user: User = Depends(AuthService.require_role('admin'))
            ... ):
            ...     return {"message": "Admin access granted"}

            >>> # Endpoint que requiere COORDINATOR o superior:
            >>> @router.get("/coordinators")
            >>> async def coordinator_endpoint(
            ...     user: User = Depends(AuthService.require_role('coordinator'))
            ... ):
            ...     return {"user": user.username}

        Note:
            - Jerarquía de roles: SUPER_ADMIN > ADMIN > COORDINATOR > KANRININSHA > EMPLOYEE > CONTRACT_WORKER
            - Roles superiores tienen permisos de roles inferiores
            - Verifica contra user.role.name en base de datos
        """
        async def role_checker(current_user: User = Depends(AuthService.get_current_active_user)):
            allowed_roles = {
                'super_admin': ['SUPER_ADMIN'],
                'admin': ['SUPER_ADMIN', 'ADMIN'],
                'coordinator': ['SUPER_ADMIN', 'ADMIN', 'COORDINATOR'],
                'kanrininsha': ['SUPER_ADMIN', 'ADMIN', 'COORDINATOR', 'KANRININSHA'],
                'employee': ['SUPER_ADMIN', 'ADMIN', 'COORDINATOR', 'KANRININSHA', 'EMPLOYEE'],
                'contract_worker': ['SUPER_ADMIN', 'ADMIN', 'COORDINATOR', 'KANRININSHA', 'EMPLOYEE', 'CONTRACT_WORKER']
            }

            if current_user.role.name not in allowed_roles.get(required_role, []):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not enough permissions"
                )
            return current_user

        return role_checker

    @staticmethod
    def require_yukyu_access():
        """Crea un dependency que permite acceso a TODOS EXCEPTO EMPLOYEE y CONTRACT_WORKER.

        Permite acceso para: SUPER_ADMIN, ADMIN, COORDINATOR, KANRININSHA, KEITOSAN, TANTOSHA
        Rechaza acceso para: EMPLOYEE, CONTRACT_WORKER

        Returns:
            Callable: Función async que valida el acceso

        Raises:
            HTTPException: 403 Forbidden si usuario es EMPLOYEE o CONTRACT_WORKER

        Examples:
            >>> @router.get("/api/yukyu/...")
            >>> async def yukyu_endpoint(
            ...     current_user: User = Depends(AuthService.require_yukyu_access())
            ... ):
            ...     return {"message": "Yukyu access granted"}
        """
        async def yukyu_access_checker(
            current_user: User = Depends(AuthService.get_current_active_user)
        ):
            # Roles permitidos (todos EXCEPTO EMPLOYEE y CONTRACT_WORKER)
            allowed_roles = [
                'SUPER_ADMIN',
                'ADMIN',
                'COORDINATOR',
                'KANRININSHA',
                'KEITOSAN',
                'TANTOSHA',
            ]

            if current_user.role.name not in allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Employees and contractors cannot access yukyu management. "
                    f"Current role: {current_user.role.name}"
                )
            return current_user

        return yukyu_access_checker


# Global instance
auth_service = AuthService()
