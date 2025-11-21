"""
Redis Client - Singleton para conexión Redis
Proporciona cache rápido en memoria para endpoints frecuentes
"""
import logging
import json
from typing import Any, Optional
from functools import wraps
import redis
from app.core.config import settings

logger = logging.getLogger(__name__)


class RedisClient:
    """Cliente Redis singleton con manejo de errores graceful.

    Si Redis no está disponible, los métodos fallan silenciosamente
    y la aplicación continúa funcionando normalmente sin cache.
    """

    _instance: Optional[redis.Redis] = None
    _available: bool = False

    @classmethod
    def get_client(cls) -> Optional[redis.Redis]:
        """Obtiene o crea la instancia de Redis."""
        if cls._instance is None:
            try:
                redis_url = getattr(settings, 'REDIS_URL', 'redis://localhost:6379/0')
                cls._instance = redis.from_url(
                    redis_url,
                    decode_responses=True,
                    socket_connect_timeout=2,
                    socket_timeout=2
                )
                # Test de conexión
                cls._instance.ping()
                cls._available = True
                logger.info(f"✅ Redis conectado: {redis_url}")
            except Exception as e:
                logger.warning(f"⚠️  Redis no disponible: {e} - App funcionará sin cache")
                cls._available = False
                cls._instance = None

        return cls._instance

    @classmethod
    def is_available(cls) -> bool:
        """Verifica si Redis está disponible."""
        if not cls._available:
            cls.get_client()  # Intenta reconectar
        return cls._available

    @classmethod
    def get(cls, key: str) -> Optional[Any]:
        """Obtiene valor del cache."""
        if not cls.is_available():
            return None

        try:
            client = cls.get_client()
            if client:
                data = client.get(key)
                if data:
                    return json.loads(data)
        except Exception as e:
            logger.warning(f"Redis GET error: {e}")

        return None

    @classmethod
    def set(cls, key: str, value: Any, ttl: int = 300) -> bool:
        """Guarda valor en cache con TTL (segundos)."""
        if not cls.is_available():
            return False

        try:
            client = cls.get_client()
            if client:
                data = json.dumps(value, default=str)  # default=str maneja datetime
                client.setex(key, ttl, data)
                return True
        except Exception as e:
            logger.warning(f"Redis SET error: {e}")

        return False

    @classmethod
    def delete(cls, pattern: str) -> int:
        """Elimina claves que coincidan con el patrón."""
        if not cls.is_available():
            return 0

        try:
            client = cls.get_client()
            if client:
                keys = client.keys(pattern)
                if keys:
                    return client.delete(*keys)
        except Exception as e:
            logger.warning(f"Redis DELETE error: {e}")

        return 0

    @classmethod
    def clear_all(cls) -> bool:
        """Limpia TODO el cache (usar con cuidado)."""
        if not cls.is_available():
            return False

        try:
            client = cls.get_client()
            if client:
                client.flushdb()
                logger.info("Redis cache limpiado completamente")
                return True
        except Exception as e:
            logger.warning(f"Redis FLUSH error: {e}")

        return False


# Instancia global
redis_client = RedisClient()


def cache_response(ttl: int = 300, key_prefix: str = ""):
    """
    Decorador para cachear respuestas de endpoints.

    Args:
        ttl: Tiempo de vida del cache en segundos (default: 5 minutos)
        key_prefix: Prefijo para la clave de cache (default: nombre de función)

    Usage:
        @cache_response(ttl=600, key_prefix="factories")
        def get_factories(db: Session):
            return db.query(Factory).all()
    """
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Genera clave de cache
            func_name = key_prefix or func.__name__
            cache_key = f"{func_name}:{str(args)}:{str(kwargs)}"

            # Intenta obtener del cache
            cached = redis_client.get(cache_key)
            if cached is not None:
                logger.debug(f"✅ Cache HIT: {cache_key}")
                return cached

            # Si no está en cache, ejecuta función
            logger.debug(f"❌ Cache MISS: {cache_key}")
            result = await func(*args, **kwargs)

            # Guarda en cache
            redis_client.set(cache_key, result, ttl)

            return result

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            # Genera clave de cache
            func_name = key_prefix or func.__name__
            cache_key = f"{func_name}:{str(args)}:{str(kwargs)}"

            # Intenta obtener del cache
            cached = redis_client.get(cache_key)
            if cached is not None:
                logger.debug(f"✅ Cache HIT: {cache_key}")
                return cached

            # Si no está en cache, ejecuta función
            logger.debug(f"❌ Cache MISS: {cache_key}")
            result = func(*args, **kwargs)

            # Guarda en cache
            redis_client.set(cache_key, result, ttl)

            return result

        # Detecta si es función async o sync
        import inspect
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator


def invalidate_cache(pattern: str):
    """
    Invalida cache que coincida con el patrón.

    Usage:
        # Después de crear/actualizar/eliminar factory
        invalidate_cache("get_factories:*")
        invalidate_cache("factories:*")
    """
    deleted = redis_client.delete(pattern)
    if deleted > 0:
        logger.info(f"🗑️  Cache invalidado: {pattern} ({deleted} claves)")
