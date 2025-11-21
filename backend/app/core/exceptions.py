"""
Excepciones personalizadas para UNS-ClaudeJP 2.0
"""
from fastapi import HTTPException, status


class UNSException(Exception):
    """Excepción base para UNS-ClaudeJP"""
    def __init__(self, message: str, details: dict | None = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class DatabaseError(UNSException):
    """Errores de base de datos"""
    pass


class ValidationError(UNSException):
    """Errores de validación"""
    pass


class AuthenticationError(UNSException):
    """Errores de autenticación"""
    pass


class AuthorizationError(UNSException):
    """Errores de autorización"""
    pass


class NotFoundError(UNSException):
    """Recursos no encontrados"""
    pass


class ConflictError(UNSException):
    """Conflictos de datos"""
    pass


class OCRError(UNSException):
    """Errores en procesamiento OCR"""
    pass


class ImportExportError(UNSException):
    """Errores en importación/exportación"""
    pass


class ImportError(ImportExportError):
    """Errores específicos de importación"""
    pass


class ExportError(ImportExportError):
    """Errores específicos de exportación"""
    pass


class NotificationError(UNSException):
    """Errores en notificaciones"""
    pass


class FileUploadError(UNSException):
    """Errores en carga de archivos"""
    pass


class ConfigurationError(UNSException):
    """Errores de configuración"""
    pass


# Alias for compatibility
AppException = UNSException


# Funciones para convertir excepciones a HTTPException
def http_exception_from_uns(exc: UNSException) -> HTTPException:
    """Convertir excepción UNS a HTTPException"""
    if isinstance(exc, AuthenticationError):
        return HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": exc.message, "details": exc.details}
        )
    elif isinstance(exc, AuthorizationError):
        return HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"message": exc.message, "details": exc.details}
        )
    elif isinstance(exc, NotFoundError):
        return HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": exc.message, "details": exc.details}
        )
    elif isinstance(exc, ConflictError):
        return HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"message": exc.message, "details": exc.details}
        )
    elif isinstance(exc, ValidationError):
        return HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": exc.message, "details": exc.details}
        )
    else:
        return HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": exc.message, "details": exc.details}
        )