#!/usr/bin/env python3
"""
Optimization Recommendations for UNS-CLAUDEJP 5.4 Photo Extraction System v2.0

This module analyzes test results and provides optimization recommendations
for improving system performance, scalability, and reliability.

Usage:
    python optimization_recommendations.py [--results-dir PATH] [--output PATH]
"""

import sys
import os
import json
import time
import argparse
import traceback
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, asdict
import statistics

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'backend'))

try:
    from config.photo_extraction_config import PhotoExtractionConfig, load_config
    from utils.logging_utils import create_logger
except ImportError as e:
    print(f"Error importing modules: {e}")
    sys.exit(1)


@dataclass
class OptimizationRecommendation:
    """Optimization recommendation with priority and impact"""
    category: str
    title: str
    description: str
    priority: str  # low, medium, high, critical
    impact: str  # low, medium, high, critical
    effort: str  # low, medium, high
    implementation: str
    expected_improvement: str
    code_example: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return asdict(self)


@dataclass
class OptimizationReport:
    """Comprehensive optimization report"""
    timestamp: datetime
    test_results_summary: Dict[str, Any]
    recommendations: List[OptimizationRecommendation]
    implementation_roadmap: Dict[str, List[OptimizationRecommendation]]
    performance_projections: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return asdict(self)


class OptimizationAnalyzer:
    """Analyzes test results and generates optimization recommendations"""
    
    def __init__(self, config: PhotoExtractionConfig, output_dir: Path = None):
        self.config = config
        self.output_dir = output_dir or Path("optimization_recommendations")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize logger
        self.logger = create_logger("OptimizationAnalyzer", config)
        
        # Test results data
        self.test_results = {}
        
        self.logger.info("Optimization analyzer initialized")
    
    def load_test_results(self, results_dir: Path) -> bool:
        """Load test results from directory"""
        self.logger.info(f"Loading test results from: {results_dir}")
        
        try:
            # Look for result files
            result_files = list(results_dir.glob("**/*.json"))
            
            if not result_files:
                self.logger.error("No test result files found")
                return False
            
            # Load each result file
            for result_file in result_files:
                try:
                    with open(result_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    # Categorize result file
                    file_name = result_file.name.lower()
                    
                    if 'performance' in file_name and 'benchmark' in file_name:
                        self.test_results['performance_benchmarks'] = data
                    elif 'scalability' in file_name:
                        self.test_results['scalability_tests'] = data
                    elif 'load' in file_name:
                        self.test_results['load_tests'] = data
                    elif 'data_quality' in file_name:
                        self.test_results['data_quality_validation'] = data
                    elif 'component' in file_name:
                        self.test_results['component_validation'] = data
                    elif 'baseline' in file_name:
                        self.test_results['baseline_tests'] = data
                    elif 'comprehensive' in file_name:
                        self.test_results['comprehensive_tests'] = data
                
                except Exception as e:
                    self.logger.error(f"Error loading result file {result_file}: {e}")
            
            self.logger.info(f"Loaded {len(self.test_results)} test result categories")
            return True
        
        except Exception as e:
            self.logger.error(f"Failed to load test results: {e}")
            return False
    
    def analyze_performance_benchmarks(self) -> List[OptimizationRecommendation]:
        """Analyze performance benchmark results and generate recommendations"""
        recommendations = []
        
        if 'performance_benchmarks' not in self.test_results:
            return recommendations
        
        data = self.test_results['performance_benchmarks']
        summary = data.get('summary', {})
        
        # Analyze extraction performance
        if 'extraction_performance' in summary.get('categories', {}):
            extraction_perf = summary['categories']['extraction_performance']
            avg_throughput = extraction_perf.get('avg_throughput', 0)
            
            if avg_throughput < 50:  # Less than 50 records/sec
                recommendations.append(OptimizationRecommendation(
                    category="Performance",
                    title="Improve Extraction Throughput",
                    description=f"Current extraction throughput is {avg_throughput:.1f} records/sec, which is below optimal levels.",
                    priority="high",
                    impact="high",
                    effort="medium",
                    implementation="Optimize database queries, increase chunk size, and enable parallel processing",
                    expected_improvement="50-100% increase in extraction throughput",
                    code_example="""
# Increase chunk size for better throughput
config.processing.chunk_size = 1000

# Enable parallel processing
config.processing.enable_parallel_processing = True
config.processing.max_workers = 8
"""
                ))
        
        # Analyze cache performance
        if 'cache_performance' in summary.get('categories', {}):
            cache_perf = summary['categories']['cache_performance']
            hit_rate = cache_perf.get('avg_hit_rate', 0)
            
            if hit_rate < 70:  # Less than 70% hit rate
                recommendations.append(OptimizationRecommendation(
                    category="Caching",
                    title="Improve Cache Hit Rate",
                    description=f"Current cache hit rate is {hit_rate:.1f}%, which indicates inefficient caching.",
                    priority="medium",
                    impact="medium",
                    effort="low",
                    implementation="Increase cache TTL, implement cache warming, and optimize cache key strategy",
                    expected_improvement="20-30% increase in cache hit rate",
                    code_example="""
# Increase cache TTL for better hit rates
config.cache.cache_ttl_seconds = 7200  # 2 hours

# Implement cache warming
def warm_cache(extractor):
    # Pre-populate cache with frequently accessed data
    pass
"""
                ))
        
        # Analyze parallel processing
        if 'parallel_processing' in summary.get('categories', {}):
            parallel_perf = summary['categories']['parallel_processing']
            avg_throughput = parallel_perf.get('avg_throughput', 0)
            
            if avg_throughput < 100:  # Less than 100 ops/sec
                recommendations.append(OptimizationRecommendation(
                    category="Parallel Processing",
                    title="Optimize Parallel Processing",
                    description=f"Current parallel processing throughput is {avg_throughput:.1f} ops/sec, which can be improved.",
                    priority="medium",
                    impact="medium",
                    effort="medium",
                    implementation="Increase worker count, optimize task distribution, and reduce contention",
                    expected_improvement="30-50% increase in parallel processing throughput",
                    code_example="""
# Optimize worker count based on system resources
import psutil

cpu_count = psutil.cpu_count()
config.processing.max_workers = min(cpu_count * 2, 16)

# Implement work stealing for better load balancing
config.processing.enable_work_stealing = True
"""
                ))
        
        return recommendations
    
    def analyze_scalability_tests(self) -> List[OptimizationRecommendation]:
        """Analyze scalability test results and generate recommendations"""
        recommendations = []
        
        if 'scalability_tests' not in self.test_results:
            return recommendations
        
        data = self.test_results['scalability_tests']
        summary = data.get('summary', {})
        
        # Analyze dataset scalability
        if 'dataset_scalability' in summary.get('categories', {}):
            dataset_scalability = summary['categories']['dataset_scalability']
            scalability_factor = dataset_scalability.get('scalability_factor', 1.0)
            
            if scalability_factor < 0.7:  # Significant performance degradation
                recommendations.append(OptimizationRecommendation(
                    category="Scalability",
                    title="Improve Dataset Scalability",
                    description=f"Current scalability factor is {scalability_factor:.2f}, indicating significant performance degradation with larger datasets.",
                    priority="high",
                    impact="high",
                    effort="high",
                    implementation="Implement streaming processing, optimize memory usage, and use pagination for large datasets",
                    expected_improvement="40-60% improvement in scalability factor",
                    code_example="""
# Implement streaming for large datasets
def process_dataset_streaming(dataset_path):
    for chunk in read_dataset_in_chunks(dataset_path, chunk_size=1000):
        process_chunk(chunk)
        # Release memory after each chunk
        gc.collect()

# Use pagination for large datasets
def process_dataset_pagination(dataset_path, page_size=1000):
    offset = 0
    while True:
        chunk = read_dataset_page(dataset_path, offset, page_size)
        if not chunk:
            break
        process_chunk(chunk)
        offset += page_size
"""
                ))
        
        # Analyze memory scalability
        if 'memory_scalability' in summary.get('categories', {}):
            memory_scalability = summary['categories']['memory_scalability']
            memory_growth = memory_scalability.get('memory_growth_mb', 0)
            
            if memory_growth > 500:  # More than 500MB growth
                recommendations.append(OptimizationRecommendation(
                    category="Memory Management",
                    title="Reduce Memory Growth",
                    description=f"Current memory growth is {memory_growth:.1f}MB, indicating potential memory leaks.",
                    priority="critical",
                    impact="critical",
                    effort="high",
                    implementation="Implement memory pooling, optimize object lifecycle, and add memory monitoring",
                    expected_improvement="60-80% reduction in memory growth",
                    code_example="""
# Implement memory pooling
class PhotoDataPool:
    def __init__(self, pool_size=100):
        self.pool = [create_photo_data_object() for _ in range(pool_size)]
        self.available = list(range(pool_size))
    
    def get_object(self):
        if self.available:
            idx = self.available.pop()
            return self.pool[idx]
        return create_photo_data_object()
    
    def return_object(self, obj):
        # Find object in pool and mark as available
        for i, pooled_obj in enumerate(self.pool):
            if pooled_obj is obj:
                self.available.append(i)
                break

# Optimize object lifecycle
def process_photo_optimized(photo_data):
    # Use context managers for resource cleanup
    with PhotoProcessingContext(photo_data):
        # Process photo
        result = extract_photo_data(photo_data)
        return result
"""
                ))
        
        return recommendations
    
    def analyze_load_tests(self) -> List[OptimizationRecommendation]:
        """Analyze load test results and generate recommendations"""
        recommendations = []
        
        if 'load_tests' not in self.test_results:
            return recommendations
        
        data = self.test_results['load_tests']
        summary = data.get('summary', {})
        
        # Analyze breaking points
        if 'stress' in summary.get('categories', {}):
            stress_results = summary['categories']['stress']
            breaking_points = stress_results.get('breaking_points', [])
            
            if breaking_points:
                # Find lowest breaking point
                lowest_breaking = min(breaking_points, key=lambda x: x[0] if x else float('inf'))
                
                if lowest_breaking and lowest_breaking[0] < 50:  # Breaking at less than 50 users
                    recommendations.append(OptimizationRecommendation(
                        category="Load Handling",
                        title="Increase System Capacity",
                        description=f"System breaks at {lowest_breaking[0]} users, which is below expected capacity.",
                        priority="high",
                        impact="high",
                        effort="high",
                        implementation="Increase connection pool size, optimize resource usage, and implement auto-scaling",
                        expected_improvement="100-200% increase in concurrent user capacity",
                        code_example="""
# Increase connection pool size
config.database.max_connections = 100

# Implement connection pooling
class ConnectionPool:
    def __init__(self, max_connections=100):
        self.pool = []
        self.max_connections = max_connections
        self.active_connections = 0
    
    def get_connection(self):
        if self.pool:
            return self.pool.pop()
        elif self.active_connections < self.max_connections:
            self.active_connections += 1
            return create_new_connection()
        raise Exception("Connection limit reached")
    
    def return_connection(self, conn):
        self.pool.append(conn)
        self.active_connections -= 1

# Implement auto-scaling
def auto_scale_resources(current_load):
    if current_load > 0.8:  # 80% capacity
        scale_up_resources()
    elif current_load < 0.3:  # 30% capacity
        scale_down_resources()
"""
                    ))
        
        # Analyze error rates
        if 'constant_load' in summary.get('categories', {}):
            constant_load = summary['categories']['constant_load']
            avg_error_rate = constant_load.get('avg_error_rate', 0)
            
            if avg_error_rate > 5:  # More than 5% error rate
                recommendations.append(OptimizationRecommendation(
                    category="Error Handling",
                    title="Reduce Error Rate",
                    description=f"Current error rate is {avg_error_rate:.1f}%, which is above acceptable levels.",
                    priority="high",
                    impact="high",
                    effort="medium",
                    implementation="Implement better error handling, retry mechanisms, and circuit breakers",
                    expected_improvement="80-90% reduction in error rate",
                    code_example="""
# Implement retry mechanism with exponential backoff
import time
import random

def retry_with_backoff(func, max_retries=3, base_delay=1.0, max_delay=60.0):
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise e
            
            # Calculate delay with jitter
            delay = min(base_delay * (2 ** attempt) + random.uniform(0, 1), max_delay)
            time.sleep(delay)

# Implement circuit breaker
class CircuitBreaker:
    def __init__(self, failure_threshold=5, timeout=60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = 'CLOSED'  # CLOSED, OPEN, HALF-OPEN
    
    def call(self, func, *args, **kwargs):
        if self.state == 'OPEN':
            raise Exception("Circuit breaker is OPEN")
        
        try:
            result = func(*args, **kwargs)
            self.reset()
            return result
        except Exception as e:
            self.record_failure()
            raise e
    
    def reset(self):
        self.failure_count = 0
        self.last_failure_time = None
        if self.state == 'OPEN':
            self.state = 'HALF-OPEN'
    
    def record_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        if self.failure_count >= self.failure_threshold:
            self.state = 'OPEN'
"""
                ))
        
        return recommendations
    
    def analyze_data_quality_validation(self) -> List[OptimizationRecommendation]:
        """Analyze data quality validation results and generate recommendations"""
        recommendations = []
        
        if 'data_quality_validation' not in self.test_results:
            return recommendations
        
        data = self.test_results['data_quality_validation']
        summary = data.get('validation_summary', {})
        
        # Analyze overall quality score
        overall_quality_score = summary.get('overall_quality_score', 100)
        
        if overall_quality_score < 80:  # Less than 80% quality score
            recommendations.append(OptimizationRecommendation(
                category="Data Quality",
                title="Improve Data Quality",
                description=f"Current overall quality score is {overall_quality_score:.1f}%, which is below optimal levels.",
                priority="medium",
                impact="medium",
                effort="medium",
                implementation="Implement better validation, data cleaning, and quality monitoring",
                expected_improvement="15-25% improvement in data quality score",
                code_example="""
# Implement enhanced data validation
def validate_photo_enhanced(photo_data, record_id):
    # Basic validation
    if not photo_data:
        return False, "Empty photo data"
    
    # Advanced validation
    if photo_data.startswith('data:image/'):
        # Validate base64 encoding
        try:
            comma_index = photo_data.find(',')
            if comma_index == -1:
                return False, "Invalid base64 data URL"
            
            base64_part = photo_data[comma_index + 1:]
            image_bytes = base64.b64decode(base64_part)
            
            # Validate image format
            if not is_valid_image_format(image_bytes):
                return False, "Invalid image format"
            
            # Validate image quality
            if not is_acceptable_image_quality(image_bytes):
                return False, "Poor image quality"
            
            return True, ""
        except Exception as e:
            return False, f"Validation error: {str(e)}"
    
    return False, "Unknown photo data format"

# Implement data cleaning
def clean_photo_data(photo_data):
    # Remove unnecessary whitespace
    photo_data = photo_data.strip()
    
    # Normalize data format
    if photo_data.startswith('data:image/'):
        # Ensure consistent format
        photo_data = normalize_data_url(photo_data)
    
    return photo_data
"""
                ))
        
        # Analyze common errors
        common_errors = summary.get('common_errors', {})
        
        if 'empty_photo_data' in common_errors and common_errors['empty_photo_data'] > 10:
            recommendations.append(OptimizationRecommendation(
                category="Data Completeness",
                title="Reduce Empty Photo Data",
                description=f"Found {common_errors['empty_photo_data']} records with empty photo data.",
                priority="high",
                impact="high",
                effort="low",
                implementation="Implement data validation checks and improve data entry processes",
                expected_improvement="90-95% reduction in empty photo data",
                code_example="""
# Implement data validation checks
def validate_photo_data(photo_data, record_id):
    if not photo_data or photo_data.strip() == '':
        log_error(f"Empty photo data for record {record_id}")
        return False
    
    return True

# Improve data entry processes
def improve_data_entry_processes():
    # Implement frontend validation
    # Add required field indicators
    # Provide better error messages
    pass
"""
                ))
        
        if 'corrupted_data' in common_errors and common_errors['corrupted_data'] > 5:
            recommendations.append(OptimizationRecommendation(
                category="Data Integrity",
                title="Reduce Corrupted Data",
                description=f"Found {common_errors['corrupted_data']} records with corrupted data.",
                priority="high",
                impact="high",
                effort="medium",
                implementation="Implement data integrity checks and improve data transfer processes",
                expected_improvement="80-90% reduction in corrupted data",
                code_example="""
# Implement data integrity checks
def verify_data_integrity(photo_data, record_id):
    # Calculate checksum
    checksum = calculate_checksum(photo_data)
    
    # Verify against stored checksum
    stored_checksum = get_stored_checksum(record_id)
    if stored_checksum and checksum != stored_checksum:
        log_error(f"Data integrity check failed for record {record_id}")
        return False
    
    return True

# Improve data transfer processes
def improve_data_transfer():
    # Use reliable transfer protocols
    # Implement transfer verification
    # Add retry mechanisms
    pass
"""
                ))
        
        return recommendations
    
    def analyze_component_validation(self) -> List[OptimizationRecommendation]:
        """Analyze component validation results and generate recommendations"""
        recommendations = []
        
        if 'component_validation' not in self.test_results:
            return recommendations
        
        data = self.test_results['component_validation']
        summary = data.get('summary', {})
        
        # Analyze overall success rate
        overall_success_rate = summary.get('overall_success_rate', 100)
        
        if overall_success_rate < 90:  # Less than 90% success rate
            recommendations.append(OptimizationRecommendation(
                category="Component Reliability",
                title="Improve Component Reliability",
                description=f"Current overall success rate is {overall_success_rate:.1f}%, which indicates component reliability issues.",
                priority="high",
                impact="high",
                effort="high",
                implementation="Implement better error handling, component testing, and monitoring",
                expected_improvement="10-20% improvement in component success rate",
                code_example="""
# Implement better error handling
def robust_component_operation():
    try:
        return perform_operation()
    except Exception as e:
        log_error(f"Component operation failed: {str(e)}")
        # Implement fallback
        return fallback_operation()

# Implement component testing
def test_component(component):
    # Unit tests
    run_unit_tests(component)
    
    # Integration tests
    run_integration_tests(component)
    
    # Performance tests
    run_performance_tests(component)

# Implement component monitoring
def monitor_component(component):
    # Health checks
    if not is_component_healthy(component):
        alert_component_failure(component)
    
    # Performance metrics
    collect_performance_metrics(component)
"""
                ))
        
        # Analyze component-specific issues
        component_results = summary.get('components', {})
        
        # Strategy Pattern issues
        if 'Strategy Pattern' in component_results:
            strategy_results = component_results['Strategy Pattern']
            if strategy_results.get('success_rate', 100) < 95:
                recommendations.append(OptimizationRecommendation(
                    category="Strategy Pattern",
                    title="Improve Strategy Pattern Implementation",
                    description=f"Strategy Pattern success rate is {strategy_results.get('success_rate', 100):.1f}%, indicating implementation issues.",
                    priority="medium",
                    impact="medium",
                    effort="medium",
                    implementation="Fix strategy selection logic, improve fallback mechanisms, and add better error handling",
                    expected_improvement="5-10% improvement in strategy pattern success rate",
                    code_example="""
# Fix strategy selection logic
class ImprovedStrategySelector:
    def __init__(self, config):
        self.config = config
        self.strategies = self._initialize_strategies()
    
    def get_best_strategy(self, db_path):
        # Score strategies based on multiple factors
        strategy_scores = {}
        
        for strategy in self.strategies:
            score = 0
            
            # Availability score
            if strategy.is_available():
                score += 30
            
            # Performance score
            perf_score = self._benchmark_strategy(strategy)
            score += perf_score * 0.5
            
            # Compatibility score
            compat_score = self._check_compatibility(strategy, db_path)
            score += compat_score * 0.2
            
            strategy_scores[strategy.__class__.__name__] = score
        
        # Select strategy with highest score
        best_strategy_name = max(strategy_scores.keys(), key=lambda k: strategy_scores[k])
        return self.strategies[best_strategy_name]
"""
                ))
        
        # Caching System issues
        if 'Caching System' in component_results:
            cache_results = component_results['Caching System']
            if cache_results.get('success_rate', 100) < 95:
                recommendations.append(OptimizationRecommendation(
                    category="Caching System",
                    title="Improve Caching System Implementation",
                    description=f"Caching System success rate is {cache_results.get('success_rate', 100):.1f}%, indicating implementation issues.",
                    priority="medium",
                    impact="medium",
                    effort="medium",
                    implementation="Fix cache initialization, improve error handling, and optimize cache operations",
                    expected_improvement="5-15% improvement in cache system success rate",
                    code_example="""
# Fix cache initialization
class RobustCacheManager:
    def __init__(self, config):
        self.config = config
        self.backends = {}
        self.primary_backend = None
        self._initialize_backends()
    
    def _initialize_backends(self):
        try:
            # Initialize memory backend
            self.backends['memory'] = MemoryCacheBackend(self.config)
            
            # Initialize Redis backend if available
            if self.config.cache.enable_redis:
                try:
                    self.backends['redis'] = RedisCacheBackend(self.config)
                except Exception as e:
                    self.logger.warning(f"Redis backend initialization failed: {e}")
            
            # Initialize file backend if available
            if self.config.cache.enable_file_cache:
                try:
                    self.backends['file'] = FileCacheBackend(self.config)
                except Exception as e:
                    self.logger.warning(f"File backend initialization failed: {e}")
            
            # Select primary backend
            self.primary_backend = self._select_primary_backend()
            
        except Exception as e:
            self.logger.error(f"Cache initialization failed: {e}")
            raise e
"""
                ))
        
        return recommendations
    
    def generate_all_recommendations(self) -> List[OptimizationRecommendation]:
        """Generate all optimization recommendations"""
        self.logger.info("Generating optimization recommendations")
        
        all_recommendations = []
        
        # Analyze each test result category
        if self.test_results:
            # Performance benchmarks
            perf_recs = self.analyze_performance_benchmarks()
            all_recommendations.extend(perf_recs)
            
            # Scalability tests
            scalability_recs = self.analyze_scalability_tests()
            all_recommendations.extend(scalability_recs)
            
            # Load tests
            load_recs = self.analyze_load_tests()
            all_recommendations.extend(load_recs)
            
            # Data quality validation
            quality_recs = self.analyze_data_quality_validation()
            all_recommendations.extend(quality_recs)
            
            # Component validation
            component_recs = self.analyze_component_validation()
            all_recommendations.extend(component_recs)
        
        # Add general recommendations based on configuration
        general_recs = self._generate_general_recommendations()
        all_recommendations.extend(general_recs)
        
        # Sort recommendations by priority and impact
        priority_order = {'critical': 4, 'high': 3, 'medium': 2, 'low': 1}
        impact_order = {'critical': 4, 'high': 3, 'medium': 2, 'low': 1}
        
        all_recommendations.sort(key=lambda r: (
            priority_order.get(r.priority, 0),
            impact_order.get(r.impact, 0)
        ), reverse=True)
        
        self.logger.info(f"Generated {len(all_recommendations)} optimization recommendations")
        return all_recommendations
    
    def _generate_general_recommendations(self) -> List[OptimizationRecommendation]:
        """Generate general optimization recommendations based on configuration"""
        recommendations = []
        
        # Configuration-based recommendations
        if self.config.processing.chunk_size < 500:
            recommendations.append(OptimizationRecommendation(
                category="Configuration",
                title="Increase Chunk Size",
                description=f"Current chunk size is {self.config.processing.chunk_size}, which may be too small for optimal performance.",
                priority="medium",
                impact="medium",
                effort="low",
                implementation="Increase chunk size to 1000-5000 for better throughput",
                expected_improvement="20-40% improvement in processing throughput",
                code_example=f"""
# Increase chunk size
config.processing.chunk_size = 2000
"""
            ))
        
        if self.config.processing.max_workers < 4:
            recommendations.append(OptimizationRecommendation(
                category="Configuration",
                title="Increase Max Workers",
                description=f"Current max workers is {self.config.processing.max_workers}, which may limit parallel processing.",
                priority="medium",
                impact="medium",
                effort="low",
                implementation="Increase max workers to 8-16 for better parallel processing",
                expected_improvement="30-50% improvement in parallel processing throughput",
                code_example=f"""
# Increase max workers
config.processing.max_workers = 8
"""
            ))
        
        if not self.config.cache.enable_cache:
            recommendations.append(OptimizationRecommendation(
                category="Configuration",
                title="Enable Caching",
                description="Caching is currently disabled, which can significantly improve performance.",
                priority="high",
                impact="high",
                effort="low",
                implementation="Enable caching with appropriate backend (Redis, file, or memory)",
                expected_improvement="50-70% improvement in repeated operations",
                code_example="""
# Enable caching
config.cache.enable_cache = True
config.cache.cache_backend = 'redis'  # or 'file' or 'memory'
config.cache.cache_ttl_seconds = 3600  # 1 hour
"""
            ))
        
        return recommendations
    
    def create_implementation_roadmap(self, recommendations: List[OptimizationRecommendation]) -> Dict[str, List[OptimizationRecommendation]]:
        """Create implementation roadmap with phases"""
        roadmap = {
            'immediate': [],  # 0-2 weeks
            'short_term': [],  # 2-6 weeks
            'medium_term': [],  # 6-12 weeks
            'long_term': []  # 3+ months
        }
        
        for rec in recommendations:
            if rec.priority == 'critical':
                roadmap['immediate'].append(rec)
            elif rec.priority == 'high':
                if rec.effort == 'low':
                    roadmap['immediate'].append(rec)
                else:
                    roadmap['short_term'].append(rec)
            elif rec.priority == 'medium':
                if rec.effort == 'low':
                    roadmap['short_term'].append(rec)
                elif rec.effort == 'medium':
                    roadmap['medium_term'].append(rec)
                else:
                    roadmap['long_term'].append(rec)
            elif rec.priority == 'low':
                if rec.effort == 'low':
                    roadmap['medium_term'].append(rec)
                else:
                    roadmap['long_term'].append(rec)
        
        return roadmap
    
    def generate_performance_projections(self, recommendations: List[OptimizationRecommendation]) -> Dict[str, Any]:
        """Generate performance projections based on recommendations"""
        projections = {
            'current_performance': self._get_current_performance_metrics(),
            'projected_performance': {},
            'improvement_potential': {}
        }
        
        # Calculate potential improvements
        throughput_improvement = 0
        memory_improvement = 0
        error_rate_improvement = 0
        
        for rec in recommendations:
            if 'throughput' in rec.expected_improvement.lower():
                throughput_improvement += 25  # Estimated 25% improvement
            if 'memory' in rec.expected_improvement.lower():
                memory_improvement += 30  # Estimated 30% improvement
            if 'error rate' in rec.expected_improvement.lower():
                error_rate_improvement += 40  # Estimated 40% improvement
        
        # Apply improvements to current metrics
        current_metrics = projections['current_performance']
        
        if 'extraction_throughput' in current_metrics:
            projected_throughput = current_metrics['extraction_throughput'] * (1 + throughput_improvement / 100)
            projections['projected_performance']['extraction_throughput'] = projected_throughput
            projections['improvement_potential']['extraction_throughput'] = throughput_improvement
        
        if 'memory_usage' in current_metrics:
            projected_memory = current_metrics['memory_usage'] * (1 - memory_improvement / 100)
            projections['projected_performance']['memory_usage'] = projected_memory
            projections['improvement_potential']['memory_usage'] = memory_improvement
        
        if 'error_rate' in current_metrics:
            projected_error_rate = current_metrics['error_rate'] * (1 - error_rate_improvement / 100)
            projections['projected_performance']['error_rate'] = projected_error_rate
            projections['improvement_potential']['error_rate'] = error_rate_improvement
        
        return projections
    
    def _get_current_performance_metrics(self) -> Dict[str, Any]:
        """Get current performance metrics from test results"""
        metrics = {}
        
        # Extract metrics from test results
        if 'performance_benchmarks' in self.test_results:
            data = self.test_results['performance_benchmarks']
            summary = data.get('summary', {})
            
            if 'extraction_performance' in summary.get('categories', {}):
                extraction_perf = summary['categories']['extraction_performance']
                metrics['extraction_throughput'] = extraction_perf.get('avg_throughput', 0)
                metrics['extraction_success_rate'] = extraction_perf.get('avg_success_rate', 0)
        
        if 'load_tests' in self.test_results:
            data = self.test_results['load_tests']
            summary = data.get('summary', {})
            
            if 'constant_load' in summary.get('categories', {}):
                constant_load = summary['categories']['constant_load']
                metrics['max_concurrent_users'] = constant_load.get('max_concurrent_users', 0)
                metrics['error_rate'] = constant_load.get('avg_error_rate', 0)
        
        return metrics
    
    def generate_optimization_report(self, recommendations: List[OptimizationRecommendation]) -> OptimizationReport:
        """Generate comprehensive optimization report"""
        self.logger.info("Generating optimization report")
        
        # Create implementation roadmap
        roadmap = self.create_implementation_roadmap(recommendations)
        
        # Generate performance projections
        projections = self.generate_performance_projections(recommendations)
        
        # Create test results summary
        test_results_summary = {
            'categories_loaded': list(self.test_results.keys()),
            'total_recommendations': len(recommendations),
            'priority_distribution': {
                'critical': len([r for r in recommendations if r.priority == 'critical']),
                'high': len([r for r in recommendations if r.priority == 'high']),
                'medium': len([r for r in recommendations if r.priority == 'medium']),
                'low': len([r for r in recommendations if r.priority == 'low'])
            },
            'category_distribution': {
                'Performance': len([r for r in recommendations if r.category == 'Performance']),
                'Scalability': len([r for r in recommendations if r.category == 'Scalability']),
                'Caching': len([r for r in recommendations if r.category == 'Caching']),
                'Load Handling': len([r for r in recommendations if r.category == 'Load Handling']),
                'Data Quality': len([r for r in recommendations if r.category == 'Data Quality']),
                'Component Reliability': len([r for r in recommendations if r.category == 'Component Reliability']),
                'Configuration': len([r for r in recommendations if r.category == 'Configuration'])
            }
        }
        
        # Create report
        report = OptimizationReport(
            timestamp=datetime.now(),
            test_results_summary=test_results_summary,
            recommendations=recommendations,
            implementation_roadmap=roadmap,
            performance_projections=projections
        )
        
        self.logger.info("Optimization report generated")
        return report
    
    def save_report(self, report: OptimizationReport, filename: str = None) -> bool:
        """Save optimization report to file"""
        if filename is None:
            timestamp = report.timestamp.strftime("%Y%m%d_%H%M%S")
            filename = f"optimization_recommendations_{timestamp}.json"
        
        output_file = self.output_dir / filename
        
        try:
            # Convert report to serializable format
            serializable_report = report.to_dict()
            
            # Convert datetime objects to ISO strings
            serializable_report['timestamp'] = report.timestamp.isoformat()
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(serializable_report, f, indent=2, ensure_ascii=False)
            
            self.logger.info(f"Optimization report saved to: {output_file}")
            return True
        
        except Exception as e:
            self.logger.error(f"Failed to save report: {e}")
            return False
    
    def generate_html_report(self, report: OptimizationReport, filename: str = None) -> bool:
        """Generate HTML report for better visualization"""
        if filename is None:
            timestamp = report.timestamp.strftime("%Y%m%d_%H%M%S")
            filename = f"optimization_recommendations_{timestamp}.html"
        
        output_file = self.output_dir / filename
        
        try:
            # Generate HTML content
            html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UNS-CLAUDEJP 5.4 - Optimization Recommendations</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        .container {{
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 30px;
            margin-bottom: 30px;
        }}
        h1, h2, h3 {{
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }}
        h1 {{
            font-size: 2.5em;
            text-align: center;
        }}
        h2 {{
            font-size: 1.8em;
            margin-top: 30px;
        }}
        h3 {{
            font-size: 1.4em;
            margin-top: 25px;
        }}
        .summary {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }}
        .summary-item {{
            background-color: #f8f9fa;
            border-left: 4px solid #3498db;
            padding: 15px;
            border-radius: 4px;
        }}
        .summary-item h3 {{
            margin-top: 0;
            color: #2c3e50;
            border-bottom: none;
            padding-bottom: 5px;
        }}
        .recommendation {{
            margin-bottom: 30px;
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
        }}
        .recommendation-header {{
            background-color: #f8f9fa;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}
        .recommendation-header h2 {{
            margin: 0;
            border: none;
            padding: 0;
            font-size: 1.4em;
        }}
        .priority-critical {{
            border-left: 4px solid #e74c3c;
        }}
        .priority-high {{
            border-left: 4px solid #e67e22;
        }}
        .priority-medium {{
            border-left: 4px solid #f39c12;
        }}
        .priority-low {{
            border-left: 4px solid #2ecc71;
        }}
        .recommendation-content {{
            padding: 20px;
        }}
        .priority-badge {{
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            color: white;
            font-weight: bold;
            font-size: 0.8em;
            margin-left: 10px;
        }}
        .priority-critical {{
            background-color: #e74c3c;
        }}
        .priority-high {{
            background-color: #e67e22;
        }}
        .priority-medium {{
            background-color: #f39c12;
        }}
        .priority-low {{
            background-color: #2ecc71;
        }}
        .impact-badge {{
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            color: white;
            font-weight: bold;
            font-size: 0.8em;
            margin-left: 10px;
        }}
        .impact-critical {{
            background-color: #e74c3c;
        }}
        .impact-high {{
            background-color: #e67e22;
        }}
        .impact-medium {{
            background-color: #f39c12;
        }}
        .impact-low {{
            background-color: #2ecc71;
        }}
        .roadmap {{
            margin-top: 30px;
        }}
        .roadmap-phase {{
            margin-bottom: 20px;
        }}
        .roadmap-phase h3 {{
            color: #2c3e50;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }}
        .roadmap-item {{
            background-color: #f8f9fa;
            border-left: 4px solid #3498db;
            padding: 10px 15px;
            margin-bottom: 10px;
            border-radius: 4px;
        }}
        .projections {{
            margin-top: 30px;
        }}
        .chart-container {{
            margin-top: 20px;
            height: 400px;
        }}
        .code-example {{
            background-color: #f8f9fa;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 15px;
            font-family: monospace;
            font-size: 0.9em;
            overflow-x: auto;
            white-space: pre-wrap;
            margin-top: 15px;
        }}
        .footer {{
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #7f8c8d;
            font-size: 0.9em;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>UNS-CLAUDEJP 5.4 - Optimization Recommendations</h1>
        <p style="text-align: center; font-size: 1.2em; color: #7f8c8d;">
            Generated on {report.timestamp.strftime("%Y-%m-%d %H:%M:%S")}
        </p>
        
        <div class="summary">
            <div class="summary-item">
                <h3>Test Results Summary</h3>
                <div>
                    <strong>Categories Loaded:</strong> {', '.join(report.test_results_summary['categories_loaded'])}<br>
                    <strong>Total Recommendations:</strong> {report.test_results_summary['total_recommendations']}<br>
                    <strong>Priority Distribution:</strong><br>
                    &nbsp;&nbsp;Critical: {report.test_results_summary['priority_distribution']['critical']}<br>
                    &nbsp;&nbsp;High: {report.test_results_summary['priority_distribution']['high']}<br>
                    &nbsp;&nbsp;Medium: {report.test_results_summary['priority_distribution']['medium']}<br>
                    &nbsp;&nbsp;Low: {report.test_results_summary['priority_distribution']['low']}
                </div>
            </div>
            
            <div class="summary-item">
                <h3>Category Distribution</h3>
                <div>
"""
            
            # Add category distribution
            for category, count in report.test_results_summary['category_distribution'].items():
                html_content += f"                    <strong>{category}:</strong> {count}<br>"
            
            html_content += f"""
                </div>
            </div>
        </div>
        
        <h2>Optimization Recommendations</h2>
"""
            
            # Add recommendations
            for rec in report.recommendations:
                priority_class = f"priority-{rec.priority}"
                impact_class = f"impact-{rec.impact}"
                
                html_content += f"""
        <div class="recommendation {priority_class}">
            <div class="recommendation-header">
                <h2>{rec.title}</h2>
                <div>
                    <span class="priority-badge {priority_class}">{rec.priority.upper()}</span>
                    <span class="impact-badge {impact_class}">{rec.impact.upper()} IMPACT</span>
                </div>
            </div>
            <div class="recommendation-content">
                <p><strong>Category:</strong> {rec.category}</p>
                <p><strong>Description:</strong> {rec.description}</p>
                <p><strong>Implementation:</strong> {rec.implementation}</p>
                <p><strong>Expected Improvement:</strong> {rec.expected_improvement}</p>
                <p><strong>Effort:</strong> {rec.effort}</p>
"""
                
                if rec.code_example:
                    html_content += f"""
                <div class="code-example">
                    <strong>Code Example:</strong>
                    <pre>{rec.code_example}</pre>
                </div>
"""
                
                html_content += """
            </div>
        </div>
"""
            
            # Add roadmap
            html_content += """
        <div class="roadmap">
            <h2>Implementation Roadmap</h2>
"""
            
            for phase, items in report.implementation_roadmap.items():
                phase_title = phase.replace('_', ' ').title()
                
                html_content += f"""
            <div class="roadmap-phase">
                <h3>{phase_title} ({len(items)} items)</h3>
"""
                
                for item in items:
                    html_content += f"""
                <div class="roadmap-item">
                    <strong>{item.title}</strong><br>
                    <em>{item.category} - {item.priority} priority</em>
                </div>
"""
                
                html_content += """
            </div>
"""
            
            # Add projections
            html_content += """
        <div class="projections">
            <h2>Performance Projections</h2>
            <div class="chart-container">
                <canvas id="performance-chart"></canvas>
            </div>
        </div>
"""
            
            html_content += f"""
    </div>
    
    <div class="footer">
        <p>UNS-CLAUDEJP 5.4 Photo Extraction System v2.0 - Optimization Recommendations</p>
        <p>Generated on {report.timestamp.strftime("%Y-%m-%d %H:%M:%S")}</p>
    </div>
    
    <script>
        // Performance projections data
        const performanceData = {{
            labels: ['Current', 'Projected'],
            datasets: [
                {{
                    label: 'Extraction Throughput (records/sec)',
                    data: [{report.performance_projections.get('current_performance', {}).get('extraction_throughput', 0)}, {report.performance_projections.get('projected_performance', {}).get('extraction_throughput', 0)}],
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }},
                {{
                    label: 'Memory Usage (MB)',
                    data: [{report.performance_projections.get('current_performance', {}).get('memory_usage', 0)}, {report.performance_projections.get('projected_performance', {}).get('memory_usage', 0)}],
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }},
                {{
                    label: 'Error Rate (%)',
                    data: [{report.performance_projections.get('current_performance', {}).get('error_rate', 0)}, {report.performance_projections.get('projected_performance', {}).get('error_rate', 0)}],
                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 1
                }}
            ]
        }};
        
        // Create chart
        const ctx = document.getElementById('performance-chart').getContext('2d');
        new Chart(ctx, {{
            type: 'bar',
            data: performanceData,
            options: {{
                responsive: true,
                maintainAspectRatio: false,
                scales: {{
                    y: {{
                        beginAtZero: true
                    }}
                }}
            }}
        }});
    </script>
</body>
</html>
"""
            
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            self.logger.info(f"HTML optimization report saved to: {output_file}")
            return True
        
        except Exception as e:
            self.logger.error(f"Failed to generate HTML report: {e}")
            return False


def main():
    """Main optimization analysis execution"""
    parser = argparse.ArgumentParser(
        description="Optimization Recommendations for UNS-CLAUDEJP 5.4 Photo Extraction System",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    %(prog)s --results-dir test_results/          # Analyze results from directory
    %(prog)s --output recommendations/             # Save to specific directory
        """
    )
    
    parser.add_argument(
        '--results-dir',
        type=str,
        required=True,
        help='Directory containing test results'
    )
    
    parser.add_argument(
        '--output',
        type=str,
        default='optimization_recommendations',
        help='Output directory for recommendations (default: optimization_recommendations)'
    )
    
    args = parser.parse_args()
    
    try:
        # Load configuration
        config = load_config()
        
        # Create output directory
        output_dir = Path(args.output)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        print("UNS-CLAUDEJP 5.4 - Optimization Recommendations")
        print("=" * 60)
        print(f"Results directory: {args.results_dir}")
        print(f"Output directory: {output_dir}")
        print()
        
        # Initialize analyzer
        analyzer = OptimizationAnalyzer(config, output_dir)
        
        # Load test results
        if not analyzer.load_test_results(Path(args.results_dir)):
            print("ERROR: Failed to load test results")
            return 1
        
        # Generate recommendations
        recommendations = analyzer.generate_all_recommendations()
        
        # Generate report
        report = analyzer.generate_optimization_report(recommendations)
        
        # Save reports
        json_success = analyzer.save_report(report)
        html_success = analyzer.generate_html_report(report)
        
        if json_success and html_success:
            print("\nOptimization recommendations generated successfully!")
            print(f"Reports saved to: {output_dir}")
            
            # Print summary
            summary = report.test_results_summary
            print(f"\nSummary:")
            print(f"  Total recommendations: {summary['total_recommendations']}")
            print(f"  Priority distribution:")
            print(f"    Critical: {summary['priority_distribution']['critical']}")
            print(f"    High: {summary['priority_distribution']['high']}")
            print(f"    Medium: {summary['priority_distribution']['medium']}")
            print(f"    Low: {summary['priority_distribution']['low']}")
            
            print(f"\nTop 5 Recommendations by Priority:")
            for i, rec in enumerate(recommendations[:5]):
                print(f"  {i+1}. {rec.title} ({rec.category}, {rec.priority} priority)")
            
            return 0
        else:
            print("ERROR: Failed to save optimization recommendations")
            return 1
    
    except KeyboardInterrupt:
        print("\nOptimization analysis interrupted by user")
        return 130
    except Exception as e:
        print(f"ERROR: {e}")
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    exit_code = main()
    sys.exit(exit_code)