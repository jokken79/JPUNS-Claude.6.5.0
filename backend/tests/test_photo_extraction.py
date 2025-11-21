"""
Tests unitarios para el sistema de extracción de fotos optimizado v2.

Cubre todos los componentes críticos:
- Configuración
- Estrategias de extracción
- Procesamiento por chunks
- Caching
- Validación
- Optimización de rendimiento
"""

import pytest
import os
import sys
import json
import tempfile
import shutil
from unittest.mock import Mock, patch, MagicMock, call
from pathlib import Path
from datetime import datetime
import threading
import time

# Agregar rutas para importar módulos del sistema
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'config'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'extractors'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'processors'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'cache'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'validation'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'performance'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'utils'))

try:
    from photo_extraction_config import PhotoExtractionConfig, ConfigError
    from photo_extraction_strategies import (
        PhotoExtractionStrategy, PyODBCStrategy, PyWin32Strategy, PandasStrategy,
        StrategySelector, ExtractionError
    )
    from chunk_processor import ChunkProcessor, ProcessingState
    from photo_cache import PhotoCache, CacheBackend
    from photo_validator import PhotoValidator, ValidationResult
    from optimization import (
        ConnectionPool, ParallelProcessor, MemoryOptimizer,
        ResourceMonitor, PerformanceOptimizer
    )
    from logging_utils import setup_logger, PerformanceLogger, retry_with_backoff
except ImportError as e:
    pytest.skip(f"No se pueden importar los módulos del sistema: {e}", allow_module_level=True)


class TestPhotoExtractionConfig:
    """Tests para el módulo de configuración."""
    
    def test_config_default_values(self):
        """Prueba valores por defecto de configuración."""
        config = PhotoExtractionConfig()
        
        assert config.database_type == 'access'
        assert config.chunk_size == 100
        assert config.max_retries == 3
        assert config.cache_enabled is True
        assert config.parallel_workers == 4
    
    def test_config_from_dict(self):
        """Prueba creación de configuración desde diccionario."""
        config_dict = {
            'database_type': 'mysql',
            'chunk_size': 200,
            'cache_enabled': False
        }
        
        config = PhotoExtractionConfig.from_dict(config_dict)
        
        assert config.database_type == 'mysql'
        assert config.chunk_size == 200
        assert config.cache_enabled is False
    
    def test_config_validation(self):
        """Prueba validación de configuración."""
        # Configuración inválida
        with pytest.raises(ConfigError):
            PhotoExtractionConfig(chunk_size=-1)
        
        with pytest.raises(ConfigError):
            PhotoExtractionConfig(max_retries=0)
        
        with pytest.raises(ConfigError):
            PhotoExtractionConfig(parallel_workers=0)
    
    def test_config_environment_override(self):
        """Prueba sobrescritura de variables de entorno."""
        with patch.dict(os.environ, {
            'PHOTO_EXTRACTION_CHUNK_SIZE': '300',
            'PHOTO_EXTRACTION_CACHE_ENABLED': 'false'
        }):
            config = PhotoExtractionConfig()
            assert config.chunk_size == 300
            assert config.cache_enabled is False
    
    def test_config_to_dict(self):
        """Prueba conversión a diccionario."""
        config = PhotoExtractionConfig(chunk_size=150)
        config_dict = config.to_dict()
        
        assert isinstance(config_dict, dict)
        assert config_dict['chunk_size'] == 150
        assert 'database_type' in config_dict


class TestPhotoExtractionStrategies:
    """Tests para las estrategias de extracción."""
    
    def test_strategy_selector_preferred_strategy(self):
        """Prueba selector de estrategia con método preferido."""
        config = PhotoExtractionConfig(preferred_strategy='pyodbc')
        selector = StrategySelector(config)
        
        strategy = selector.select_strategy()
        assert isinstance(strategy, PyODBCStrategy)
    
    def test_strategy_selector_fallback(self):
        """Prueba fallback automático de estrategia."""
        config = PhotoExtractionConfig(preferred_strategy='nonexistent')
        selector = StrategySelector(config)
        
        # Debe seleccionar una estrategia disponible
        strategy = selector.select_strategy()
        assert isinstance(strategy, PhotoExtractionStrategy)
    
    @patch('pyodbc.connect')
    def test_pyodbc_strategy_connection(self, mock_connect):
        """Prueba conexión con estrategia PyODBC."""
        mock_connection = Mock()
        mock_connect.return_value = mock_connection
        
        config = PhotoExtractionConfig()
        strategy = PyODBCStrategy(config)
        
        connection = strategy._create_connection()
        assert connection == mock_connection
        mock_connect.assert_called_once()
    
    @patch('win32com.client.Dispatch')
    def test_pywin32_strategy_connection(self, mock_dispatch):
        """Prueba conexión con estrategia PyWin32."""
        mock_connection = Mock()
        mock_dispatch.return_value = mock_connection
        
        config = PhotoExtractionConfig()
        strategy = PyWin32Strategy(config)
        
        connection = strategy._create_connection()
        assert connection == mock_connection
        mock_dispatch.assert_called_once_with("DAO.DBEngine.120")
    
    def test_strategy_error_handling(self):
        """Prueba manejo de errores en estrategias."""
        config = PhotoExtractionConfig()
        strategy = PyODBCStrategy(config)
        
        # Simular error de conexión
        with patch('pyodbc.connect', side_effect=Exception("Connection failed")):
            with pytest.raises(ExtractionError):
                strategy._create_connection()


class TestChunkProcessor:
    """Tests para el procesador de chunks."""
    
    def setup_method(self):
        """Configuración para cada test."""
        self.temp_dir = tempfile.mkdtemp()
        self.config = PhotoExtractionConfig(
            chunk_size=10,
            checkpoint_file=os.path.join(self.temp_dir, 'checkpoint.json')
        )
        self.processor = ChunkProcessor(self.config)
    
    def teardown_method(self):
        """Limpieza después de cada test."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def test_chunk_processor_initialization(self):
        """Prueba inicialización del procesador."""
        assert self.processor.config.chunk_size == 10
        assert self.processor.state.processed_chunks == 0
        assert self.processor.state.total_processed == 0
    
    def test_create_chunks(self):
        """Prueba creación de chunks."""
        data = list(range(25))  # 25 elementos
        chunks = list(self.processor._create_chunks(data))
        
        assert len(chunks) == 3  # 10, 10, 5
        assert len(chunks[0]) == 10
        assert len(chunks[1]) == 10
        assert len(chunks[2]) == 5
    
    def test_process_chunk_success(self):
        """Prueba procesamiento exitoso de chunk."""
        chunk_data = list(range(5))
        process_func = Mock(return_value=[f"processed_{i}" for i in chunk_data])
        
        result = self.processor._process_chunk(chunk_data, process_func)
        
        assert len(result) == 5
        assert result[0] == "processed_0"
        process_func.assert_called_once_with(chunk_data)
    
    def test_process_chunk_with_retry(self):
        """Prueba procesamiento con reintentos."""
        chunk_data = list(range(3))
        process_func = Mock(side_effect=[Exception("Error"), ["success"]])
        
        result = self.processor._process_chunk(chunk_data, process_func)
        
        assert result == ["success"]
        assert process_func.call_count == 2
    
    def test_checkpoint_save_and_load(self):
        """Prueba guardado y carga de checkpoint."""
        # Actualizar estado
        self.processor.state.processed_chunks = 5
        self.processor.state.total_processed = 50
        self.processor.state.start_time = datetime.now()
        
        # Guardar checkpoint
        self.processor._save_checkpoint()
        
        # Crear nuevo procesador y cargar checkpoint
        new_processor = ChunkProcessor(self.config)
        new_processor._load_checkpoint()
        
        assert new_processor.state.processed_chunks == 5
        assert new_processor.state.total_processed == 50
        assert new_processor.state.start_time is not None
    
    def test_progress_callback(self):
        """Prueba callback de progreso."""
        progress_calls = []
        
        def progress_callback(current, total, percentage):
            progress_calls.append((current, total, percentage))
        
        # Simular procesamiento
        self.processor._update_progress(25, 100, progress_callback)
        
        assert len(progress_calls) == 1
        assert progress_calls[0] == (25, 100, 25.0)


class TestPhotoCache:
    """Tests para el sistema de caching."""
    
    def setup_method(self):
        """Configuración para cada test."""
        self.temp_dir = tempfile.mkdtemp()
        self.config = PhotoExtractionConfig(
            cache_enabled=True,
            cache_backend='memory',
            cache_ttl=3600
        )
        self.cache = PhotoCache(self.config)
    
    def teardown_method(self):
        """Limpieza después de cada test."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def test_cache_set_and_get(self):
        """Prueba almacenamiento y recuperación de cache."""
        key = "test_key"
        value = {"data": "test_value"}
        
        # Almacenar
        self.cache.set(key, value)
        
        # Recuperar
        result = self.cache.get(key)
        assert result == value
    
    def test_cache_miss(self):
        """Prueba cache miss."""
        result = self.cache.get("nonexistent_key")
        assert result is None
    
    def test_cache_delete(self):
        """Prueba eliminación de cache."""
        key = "test_key"
        value = {"data": "test"}
        
        self.cache.set(key, value)
        assert self.cache.get(key) == value
        
        self.cache.delete(key)
        assert self.cache.get(key) is None
    
    def test_cache_clear(self):
        """Prueba limpieza completa de cache."""
        self.cache.set("key1", "value1")
        self.cache.set("key2", "value2")
        
        self.cache.clear()
        
        assert self.cache.get("key1") is None
        assert self.cache.get("key2") is None
    
    def test_cache_statistics(self):
        """Prueba estadísticas de cache."""
        # Realizar operaciones
        self.cache.set("key1", "value1")
        self.cache.get("key1")  # Hit
        self.cache.get("key2")  # Miss
        
        stats = self.cache.get_statistics()
        
        assert stats['hits'] == 1
        assert stats['misses'] == 1
        assert stats['sets'] == 1
        assert stats['hit_rate'] == 0.5


class TestPhotoValidator:
    """Tests para el validador de fotos."""
    
    def setup_method(self):
        """Configuración para cada test."""
        self.config = PhotoExtractionConfig()
        self.validator = PhotoValidator(self.config)
    
    def test_validate_valid_photo(self):
        """Prueba validación de foto válida."""
        # Crear una imagen de prueba válida
        valid_photo_data = b'\xff\xd8\xff\xe0\x00\x10JFIF'  # Header JPEG
        
        result = self.validator.validate_photo(valid_photo_data, "test.jpg")
        
        assert result.is_valid is True
        assert result.format == 'jpeg'
        assert result.file_size > 0
        assert len(result.errors) == 0
    
    def test_validate_invalid_photo(self):
        """Prueba validación de foto inválida."""
        invalid_photo_data = b"not_an_image"
        
        result = self.validator.validate_photo(invalid_photo_data, "test.txt")
        
        assert result.is_valid is False
        assert len(result.errors) > 0
    
    def test_validate_empty_photo(self):
        """Prueba validación de foto vacía."""
        result = self.validator.validate_photo(b"", "empty.jpg")
        
        assert result.is_valid is False
        assert any("vacío" in error.lower() for error in result.errors)
    
    def test_validate_corrupted_photo(self):
        """Prueba detección de foto corrupta."""
        # Simular JPEG con header inválido
        corrupted_data = b'\xff\xd8\xff\xff' + b'\x00' * 100
        
        result = self.validator.validate_photo(corrupted_data, "corrupted.jpg")
        
        assert result.is_valid is False
        assert any("corrupt" in error.lower() or "inválido" in error.lower() 
                  for error in result.errors)
    
    def test_batch_validation(self):
        """Prueba validación por lotes."""
        photos = [
            ("valid1.jpg", b'\xff\xd8\xff\xe0\x00\x10JFIF'),
            ("invalid.txt", b"not_an_image"),
            ("valid2.jpg", b'\xff\xd8\xff\xe0\x00\x10JFIF')
        ]
        
        results = self.validator.validate_batch(photos)
        
        assert len(results) == 3
        assert results[0].is_valid is True
        assert results[1].is_valid is False
        assert results[2].is_valid is True


class TestPerformanceOptimization:
    """Tests para optimización de rendimiento."""
    
    def test_connection_pool_creation(self):
        """Prueba creación de pool de conexiones."""
        config = PhotoExtractionConfig(
            max_connections=5,
            connection_timeout=30
        )
        
        pool = ConnectionPool(config)
        
        assert pool.max_connections == 5
        assert pool.timeout == 30
        assert pool.current_connections == 0
    
    def test_connection_pool_get_and_return(self):
        """Prueba obtención y devolución de conexiones."""
        config = PhotoExtractionConfig()
        pool = ConnectionPool(config)
        
        # Mock de conexión
        mock_connection = Mock()
        
        # Devolver conexión al pool
        pool.return_connection(mock_connection)
        
        # Obtener conexión del pool
        connection = pool.get_connection()
        
        assert connection == mock_connection
        assert pool.current_connections == 0  # La conexión fue "prestada"
    
    def test_parallel_processor(self):
        """Prueba procesador paralelo."""
        config = PhotoExtractionConfig(parallel_workers=2)
        processor = ParallelProcessor(config)
        
        # Función de prueba
        def process_item(item):
            return item * 2
        
        items = [1, 2, 3, 4, 5]
        results = processor.process_items(items, process_item)
        
        assert len(results) == 5
        assert results == [2, 4, 6, 8, 10]
    
    def test_memory_optimizer(self):
        """Prueba optimizador de memoria."""
        config = PhotoExtractionConfig()
        optimizer = MemoryOptimizer(config)
        
        # Obtener estado inicial
        initial_stats = optimizer.get_memory_stats()
        
        # Realizar limpieza
        optimizer.cleanup()
        
        # Verificar que se obtienen estadísticas
        stats = optimizer.get_memory_stats()
        assert 'rss' in stats
        assert 'vms' in stats
    
    def test_resource_monitor(self):
        """Prueba monitor de recursos."""
        config = PhotoExtractionConfig()
        monitor = ResourceMonitor(config)
        
        # Iniciar monitoreo
        monitor.start_monitoring()
        
        # Simular trabajo
        time.sleep(0.1)
        
        # Obtener estadísticas
        stats = monitor.get_current_stats()
        
        assert 'cpu_percent' in stats
        assert 'memory_percent' in stats
        assert 'timestamp' in stats
        
        # Detener monitoreo
        monitor.stop_monitoring()


class TestLoggingUtils:
    """Tests para utilidades de logging."""
    
    def test_setup_logger(self):
        """Prueba configuración de logger."""
        logger = setup_logger("test_logger", level="DEBUG")
        
        assert logger.name == "test_logger"
        assert logger.level == 10  # DEBUG level
    
    def test_performance_logger(self):
        """Prueba logger de rendimiento."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.log', delete=False) as f:
            log_file = f.name
        
        try:
            config = PhotoExtractionConfig(log_file=log_file)
            perf_logger = PerformanceLogger(config)
            
            # Registrar operación
            perf_logger.log_operation("test_operation", 1.5, {"items": 100})
            
            # Verificar que se escribió en el archivo
            with open(log_file, 'r') as f:
                log_content = f.read()
                assert "test_operation" in log_content
                assert "1.5" in log_content
        
        finally:
            os.unlink(log_file)
    
    def test_retry_with_backoff(self):
        """Prueba retry con backoff exponencial."""
        call_count = 0
        
        def failing_function():
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise Exception("Temporary failure")
            return "success"
        
        result = retry_with_backoff(failing_function, max_retries=3, delay=0.01)
        
        assert result == "success"
        assert call_count == 3
    
    def test_retry_max_attempts_exceeded(self):
        """Prueba retry cuando se exceden los intentos máximos."""
        def always_failing_function():
            raise Exception("Permanent failure")
        
        with pytest.raises(Exception):
            retry_with_backoff(always_failing_function, max_retries=2, delay=0.01)


class TestIntegration:
    """Tests de integración entre componentes."""
    
    def setup_method(self):
        """Configuración para tests de integración."""
        self.temp_dir = tempfile.mkdtemp()
        self.config = PhotoExtractionConfig(
            chunk_size=5,
            cache_enabled=True,
            cache_backend='memory',
            checkpoint_file=os.path.join(self.temp_dir, 'checkpoint.json')
        )
    
    def teardown_method(self):
        """Limpieza después de tests de integración."""
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def test_end_to_end_processing(self):
        """Prueba completa de procesamiento end-to-end."""
        # Crear componentes
        processor = ChunkProcessor(self.config)
        cache = PhotoCache(self.config)
        validator = PhotoValidator(self.config)
        
        # Datos de prueba
        test_data = list(range(20))
        
        # Función de procesamiento que usa cache y validación
        def process_chunk(chunk):
            results = []
            for item in chunk:
                # Verificar cache
                cache_key = f"item_{item}"
                cached_result = cache.get(cache_key)
                
                if cached_result:
                    results.append(cached_result)
                else:
                    # Procesar y validar
                    photo_data = f"photo_data_{item}".encode()
                    validation = validator.validate_photo(photo_data, f"photo_{item}.jpg")
                    
                    if validation.is_valid:
                        result = f"processed_{item}"
                        cache.set(cache_key, result)
                        results.append(result)
                    else:
                        results.append(f"invalid_{item}")
            
            return results
        
        # Procesar todos los datos
        all_results = []
        for chunk in processor._create_chunks(test_data):
            chunk_results = processor._process_chunk(chunk, process_chunk)
            all_results.extend(chunk_results)
        
        # Verificar resultados
        assert len(all_results) == 20
        assert all(result.startswith(('processed_', 'invalid_')) for result in all_results)
    
    def test_error_recovery_with_checkpoint(self):
        """Prueba recuperación de errores con checkpoint."""
        processor = ChunkProcessor(self.config)
        
        # Simular procesamiento parcial
        processor.state.processed_chunks = 2
        processor.state.total_processed = 10
        processor._save_checkpoint()
        
        # Crear nuevo procesador y verificar recuperación
        new_processor = ChunkProcessor(self.config)
        new_processor._load_checkpoint()
        
        assert new_processor.state.processed_chunks == 2
        assert new_processor.state.total_processed == 10
    
    def test_performance_monitoring_integration(self):
        """Prueba integración de monitoreo de rendimiento."""
        config = PhotoExtractionConfig(
            enable_performance_monitoring=True,
            parallel_workers=2
        )
        
        monitor = ResourceMonitor(config)
        processor = ParallelProcessor(config)
        
        # Iniciar monitoreo
        monitor.start_monitoring()
        
        # Realizar procesamiento
        def cpu_intensive_task(item):
            total = 0
            for i in range(1000):
                total += i * item
            return total
        
        items = list(range(10))
        results = processor.process_items(items, cpu_intensive_task)
        
        # Obtener estadísticas
        stats = monitor.get_current_stats()
        monitor.stop_monitoring()
        
        # Verificar resultados
        assert len(results) == 10
        assert stats['cpu_percent'] >= 0
        assert stats['memory_percent'] >= 0


# Fixtures para tests
@pytest.fixture
def sample_config():
    """Fixture que proporciona una configuración de prueba."""
    return PhotoExtractionConfig(
        chunk_size=10,
        cache_enabled=True,
        max_retries=2,
        parallel_workers=2
    )


@pytest.fixture
def temp_directory():
    """Fixture que proporciona un directorio temporal."""
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture
def mock_database_connection():
    """Fixture que proporciona una conexión de base de datos mock."""
    connection = Mock()
    cursor = Mock()
    connection.cursor.return_value = cursor
    cursor.fetchall.return_value = [
        (1, "Employee 1", b"photo_data_1"),
        (2, "Employee 2", b"photo_data_2")
    ]
    return connection


# Tests parametrizados
@pytest.mark.parametrize("strategy_name,expected_class", [
    ("pyodbc", PyODBCStrategy),
    ("pywin32", PyWin32Strategy),
    ("pandas", PandasStrategy)
])
def test_strategy_instantiation(strategy_name, expected_class):
    """Prueba instanciación de diferentes estrategias."""
    config = PhotoExtractionConfig(preferred_strategy=strategy_name)
    selector = StrategySelector(config)
    
    strategy = selector.select_strategy()
    assert isinstance(strategy, expected_class)


@pytest.mark.parametrize("chunk_size,total_items,expected_chunks", [
    (5, 20, 4),
    (10, 25, 3),
    (3, 10, 4),
    (100, 50, 1)
])
def test_chunk_creation(chunk_size, total_items, expected_chunks):
    """Prueba creación de chunks con diferentes tamaños."""
    config = PhotoExtractionConfig(chunk_size=chunk_size)
    processor = ChunkProcessor(config)
    
    data = list(range(total_items))
    chunks = list(processor._create_chunks(data))
    
    assert len(chunks) == expected_chunks


# Tests de rendimiento
@pytest.mark.performance
def test_large_dataset_processing_performance():
    """Test de rendimiento para procesamiento de grandes datasets."""
    config = PhotoExtractionConfig(
        chunk_size=100,
        parallel_workers=4,
        cache_enabled=True
    )
    
    processor = ChunkProcessor(config)
    cache = PhotoCache(config)
    
    # Generar dataset grande
    large_dataset = list(range(10000))
    
    start_time = time.time()
    
    # Procesar en chunks
    processed_count = 0
    for chunk in processor._create_chunks(large_dataset):
        # Simular procesamiento
        for item in chunk:
            cache_key = f"item_{item}"
            if not cache.get(cache_key):
                cache.set(cache_key, f"processed_{item}")
                processed_count += 1
    
    end_time = time.time()
    processing_time = end_time - start_time
    
    # Verificar rendimiento (debe procesar en tiempo razonable)
    assert processing_time < 10.0  # Máximo 10 segundos
    assert processed_count == 10000
    
    # Verificar estadísticas de cache
    cache_stats = cache.get_statistics()
    assert cache_stats['hits'] == 0  # Primer procesamiento
    assert cache_stats['sets'] == 10000


if __name__ == "__main__":
    # Ejecutar tests
    pytest.main([__file__, "-v", "--tb=short"])