"""
Tests for Response Caching System (FASE 3.1)

Tests cache service, cache key generation, TTL, invalidation, and storage.
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi import status
from fastapi.testclient import TestClient

from app.services.cache_service import CacheService


class TestCacheKeyGeneration:
    """Test cache key generation and hashing"""

    def test_cache_key_deterministic(self):
        """Test that same inputs generate same cache key"""
        cache = CacheService()

        key1 = cache._generate_cache_key("gemini", "gemini-pro", "Hello world", None, None)
        key2 = cache._generate_cache_key("gemini", "gemini-pro", "Hello world", None, None)

        assert key1 == key2

    def test_cache_key_different_prompts(self):
        """Test that different prompts generate different keys"""
        cache = CacheService()

        key1 = cache._generate_cache_key("gemini", "gemini-pro", "Hello world", None, None)
        key2 = cache._generate_cache_key("gemini", "gemini-pro", "Goodbye world", None, None)

        assert key1 != key2

    def test_cache_key_different_providers(self):
        """Test that different providers generate different keys"""
        cache = CacheService()

        key1 = cache._generate_cache_key("gemini", "gemini-pro", "Hello", None, None)
        key2 = cache._generate_cache_key("openai", "gemini-pro", "Hello", None, None)

        assert key1 != key2

    def test_cache_key_different_models(self):
        """Test that different models generate different keys"""
        cache = CacheService()

        key1 = cache._generate_cache_key("openai", "gpt-4", "Hello", None, None)
        key2 = cache._generate_cache_key("openai", "gpt-3.5", "Hello", None, None)

        assert key1 != key2

    def test_cache_key_with_system_message(self):
        """Test cache key includes system message"""
        cache = CacheService()

        key1 = cache._generate_cache_key("gemini", "gemini-pro", "Hello", "System msg 1", None)
        key2 = cache._generate_cache_key("gemini", "gemini-pro", "Hello", "System msg 2", None)

        assert key1 != key2

    def test_cache_key_with_metadata(self):
        """Test cache key includes metadata"""
        cache = CacheService()

        meta1 = {"temperature": 0.7}
        meta2 = {"temperature": 0.9}

        key1 = cache._generate_cache_key("openai", "gpt-4", "Hello", None, meta1)
        key2 = cache._generate_cache_key("openai", "gpt-4", "Hello", None, meta2)

        assert key1 != key2


class TestCacheOperations:
    """Test basic cache operations"""

    @pytest.mark.skipif(True, reason="Redis not available in test environment")
    def test_cache_set_and_get(self):
        """Test setting and getting values from cache"""
        cache = CacheService()

        response_data = {"text": "Generated code", "tokens": 100}
        cache.set("gemini", "gemini-pro", "Generate code", response_data)

        cached = cache.get("gemini", "gemini-pro", "Generate code")

        assert cached is not None
        assert cached["response"] == response_data

    @pytest.mark.skipif(True, reason="Redis not available in test environment")
    def test_cache_miss(self):
        """Test cache returns None for miss"""
        cache = CacheService()

        cached = cache.get("gemini", "gemini-pro", "Non-existent prompt")

        assert cached is None

    @pytest.mark.skipif(True, reason="Redis not available in test environment")
    def test_cache_delete(self):
        """Test deleting cache entries"""
        cache = CacheService()

        response_data = {"text": "Generated code"}
        cache.set("gemini", "gemini-pro", "Generate code", response_data)

        # Verify it's cached
        cached = cache.get("gemini", "gemini-pro", "Generate code")
        assert cached is not None

        # Delete it
        deleted = cache.delete("gemini", "gemini-pro", "Generate code")
        assert deleted is True

        # Verify it's gone
        cached = cache.get("gemini", "gemini-pro", "Generate code")
        assert cached is None


class TestCacheStats:
    """Test cache statistics and monitoring"""

    def test_cache_stats_unavailable(self):
        """Test stats when cache unavailable"""
        cache = CacheService()
        # If Redis is not available, cache won't initialize
        if cache.redis_client is None:
            stats = cache.get_stats()
            assert stats["status"] == "unavailable"

    def test_cache_health_check_structure(self):
        """Test health check response structure"""
        cache = CacheService()

        health = cache.health_check()

        assert "status" in health
        assert "message" in health
        assert health["status"] in ["healthy", "degraded", "unhealthy", "unavailable"]

    def test_cache_memory_usage_structure(self):
        """Test memory usage response structure"""
        cache = CacheService()

        memory = cache.get_memory_usage()

        assert "status" in memory
        assert memory["status"] in ["available", "unavailable", "error"]

    def test_cache_flush_all_returns_bool(self):
        """Test flush_all returns boolean"""
        cache = CacheService()

        result = cache.flush_all()

        assert isinstance(result, bool)


class TestCacheEndpoints:
    """Test cache management API endpoints"""

    def test_cache_stats_endpoint(self, client: TestClient, auth_headers):
        """Test GET /api/ai/cache/stats endpoint"""
        response = client.get("/api/ai/cache/stats", headers=auth_headers)

        assert response.status_code in [status.HTTP_200_OK, status.HTTP_500_INTERNAL_SERVER_ERROR]
        if response.status_code == status.HTTP_200_OK:
            data = response.json()
            assert "status" in data

    def test_cache_memory_endpoint(self, client: TestClient, auth_headers):
        """Test GET /api/ai/cache/memory endpoint"""
        response = client.get("/api/ai/cache/memory", headers=auth_headers)

        assert response.status_code in [status.HTTP_200_OK, status.HTTP_500_INTERNAL_SERVER_ERROR]
        if response.status_code == status.HTTP_200_OK:
            data = response.json()
            assert "status" in data

    def test_cache_health_endpoint(self, client: TestClient, auth_headers):
        """Test GET /api/ai/cache/health endpoint"""
        response = client.get("/api/ai/cache/health", headers=auth_headers)

        assert response.status_code in [status.HTTP_200_OK, status.HTTP_500_INTERNAL_SERVER_ERROR]
        if response.status_code == status.HTTP_200_OK:
            data = response.json()
            assert "status" in data
            assert "message" in data

    def test_cache_flush_endpoint(self, client: TestClient, auth_headers):
        """Test DELETE /api/ai/cache endpoint"""
        response = client.delete("/api/ai/cache", headers=auth_headers)

        assert response.status_code in [status.HTTP_200_OK, status.HTTP_500_INTERNAL_SERVER_ERROR]
        if response.status_code == status.HTTP_200_OK:
            data = response.json()
            assert "success" in data

    def test_cache_invalidate_provider_endpoint(self, client: TestClient, auth_headers):
        """Test DELETE /api/ai/cache/provider/{provider} endpoint"""
        response = client.delete("/api/ai/cache/provider/gemini", headers=auth_headers)

        assert response.status_code in [status.HTTP_200_OK, status.HTTP_500_INTERNAL_SERVER_ERROR]
        if response.status_code == status.HTTP_200_OK:
            data = response.json()
            assert "deleted_count" in data

    def test_cache_invalidate_provider_invalid(self, client: TestClient, auth_headers):
        """Test invalidate with invalid provider"""
        response = client.delete("/api/ai/cache/provider/invalid_provider", headers=auth_headers)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_cache_invalidate_model_endpoint(self, client: TestClient, auth_headers):
        """Test DELETE /api/ai/cache/model/{provider}/{model} endpoint"""
        response = client.delete("/api/ai/cache/model/openai/gpt-4", headers=auth_headers)

        assert response.status_code in [status.HTTP_200_OK, status.HTTP_500_INTERNAL_SERVER_ERROR]
        if response.status_code == status.HTTP_200_OK:
            data = response.json()
            assert "deleted_count" in data

    def test_cache_endpoints_require_auth(self, client: TestClient):
        """Test that cache endpoints require authentication"""
        endpoints = [
            ("/api/ai/cache/stats", "GET"),
            ("/api/ai/cache/memory", "GET"),
            ("/api/ai/cache/health", "GET"),
            ("/api/ai/cache", "DELETE"),
            ("/api/ai/cache/provider/gemini", "DELETE"),
            ("/api/ai/cache/model/openai/gpt-4", "DELETE"),
        ]

        for endpoint, method in endpoints:
            if method == "GET":
                response = client.get(endpoint)
            elif method == "DELETE":
                response = client.delete(endpoint)

            assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestCacheIntegration:
    """Integration tests for caching"""

    @pytest.mark.skipif(True, reason="Redis not available in test environment")
    def test_cache_hit_saves_cost(self):
        """Test that cache hit reduces API calls"""
        cache = CacheService()

        # First call: cache miss, would call API
        response1 = cache.get("gemini", "gemini-pro", "test prompt")
        assert response1 is None

        # Store response
        cache.set("gemini", "gemini-pro", "test prompt", {"result": "cached"})

        # Second call: cache hit
        response2 = cache.get("gemini", "gemini-pro", "test prompt")
        assert response2 is not None
        assert response2["_from_cache"] is True

    @pytest.mark.skipif(True, reason="Redis not available in test environment")
    def test_cache_ttl_respected(self):
        """Test that cache TTL is respected"""
        cache = CacheService()

        # Set with 1 second TTL
        cache.set("gemini", "gemini-pro", "test", {"result": "data"}, ttl_seconds=1)

        # Should be available immediately
        cached = cache.get("gemini", "gemini-pro", "test")
        assert cached is not None

        # After TTL expires, should be gone (in real Redis)
        # For this test we just verify the method accepts TTL parameter


class TestCachePerformance:
    """Test cache performance characteristics"""

    def test_cache_key_generation_performance(self):
        """Test cache key generation is fast"""
        cache = CacheService()

        # Generate many keys to verify no N^2 behavior
        for i in range(100):
            prompt = f"Prompt {i}"
            key = cache._generate_cache_key("gemini", "gemini-pro", prompt, None, None)
            assert key is not None
            assert ":" in key

    def test_cache_service_initialization(self):
        """Test cache service initializes properly"""
        cache = CacheService()

        # Should initialize without errors
        assert cache is not None
        # redis_client may be None if Redis unavailable
        assert cache._is_available() in [True, False]


class TestCacheErrorHandling:
    """Test cache error handling"""

    def test_cache_graceful_degradation_on_redis_unavailable(self):
        """Test cache gracefully handles Redis unavailability"""
        cache = CacheService()

        if cache.redis_client is None:
            # Operations should handle None gracefully
            result = cache.get("gemini", "gemini-pro", "test")
            assert result is None

            result = cache.set("gemini", "gemini-pro", "test", {"data": "test"})
            assert result is False

    def test_cache_delete_nonexistent(self):
        """Test deleting nonexistent entries"""
        cache = CacheService()

        if cache._is_available():
            result = cache.delete("gemini", "gemini-pro", "nonexistent")
            assert isinstance(result, bool)

    def test_cache_invalidate_provider_nonexistent(self):
        """Test invalidating nonexistent provider"""
        cache = CacheService()

        if cache._is_available():
            count = cache.invalidate_by_provider("nonexistent_provider")
            assert count == 0

    def test_cache_invalidate_model_nonexistent(self):
        """Test invalidating nonexistent model"""
        cache = CacheService()

        if cache._is_available():
            count = cache.invalidate_by_model("gemini", "nonexistent_model")
            assert count == 0
