#!/usr/bin/env python3
"""
Security Monitoring Script
UNS-CLAUDEJP 5.4 - Production Security Hardening

This script provides comprehensive security monitoring for the production environment,
including intrusion detection, anomaly detection, and automated response.
"""

import sys
import os
import json
import time
import argparse
import threading
import signal
import smtplib
import requests
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass, asdict
from pathlib import Path
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'backend'))

try:
    from backend.security import create_security_audit_logger
    from backend.utils.logging_utils import create_logger
    from config.production_config import load_production_config
    from config.security_policies import create_security_policy_manager
except ImportError as e:
    print(f"Error importing modules: {e}")
    sys.exit(1)


@dataclass
class SecurityAlert:
    """Security alert structure"""
    alert_id: str
    timestamp: datetime
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    category: str  # AUTHENTICATION, AUTHORIZATION, DATA_ACCESS, SYSTEM, NETWORK
    title: str
    description: str
    source: str
    details: Dict[str, Any]
    acknowledged: bool = False
    resolved: bool = False
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None


@dataclass
class MonitoringConfig:
    """Security monitoring configuration"""
    enable_authentication_monitoring: bool = True
    enable_authorization_monitoring: bool = True
    enable_data_access_monitoring: bool = True
    enable_system_monitoring: bool = True
    enable_network_monitoring: bool = True
    enable_file_integrity_monitoring: bool = True
    enable_process_monitoring: bool = True
    enable_log_monitoring: bool = True
    enable_vulnerability_scanning: bool = True
    enable_anomaly_detection: bool = True
    
    # Alert thresholds
    failed_login_threshold: int = 5
    failed_login_window_minutes: int = 15
    privileged_access_threshold: int = 10
    privileged_access_window_hours: int = 24
    data_export_threshold: int = 1000
    data_export_window_hours: int = 1
    error_rate_threshold: float = 5.0
    error_rate_window_minutes: int = 10
    cpu_threshold: float = 80.0
    memory_threshold: float = 85.0
    disk_threshold: float = 90.0
    
    # Notification settings
    enable_email_notifications: bool = True
    enable_webhook_notifications: bool = True
    email_recipients: List[str] = None
    webhook_urls: List[str] = None
    
    # Scanning intervals
    authentication_scan_interval_seconds: int = 60
    authorization_scan_interval_seconds: int = 60
    data_access_scan_interval_seconds: int = 300
    system_scan_interval_seconds: int = 120
    network_scan_interval_seconds: int = 300
    file_integrity_scan_interval_seconds: int = 600
    process_scan_interval_seconds: int = 120
    log_scan_interval_seconds: int = 60
    vulnerability_scan_interval_seconds: int = 3600
    anomaly_detection_interval_seconds: int = 300
    
    def __post_init__(self):
        if self.email_recipients is None:
            self.email_recipients = []
        
        if self.webhook_urls is None:
            self.webhook_urls = []


class SecurityMonitor:
    """Enterprise-grade security monitoring system"""
    
    def __init__(self, config: MonitoringConfig):
        self.config = config
        self.logger = self._setup_logger()
        self.production_config = load_production_config()
        self.security_policy_manager = create_security_policy_manager()
        self.audit_logger = create_security_audit_logger(self.logger)
        
        # Monitoring state
        self.monitoring_active = False
        self.monitor_threads: List[threading.Thread] = []
        self.alerts: List[SecurityAlert] = []
        self.alerts_lock = threading.Lock()
        
        # Metrics tracking
        self.metrics: Dict[str, Any] = {
            'failed_logins': [],
            'privileged_access': [],
            'data_exports': [],
            'errors': [],
            'system_resources': {},
            'network_connections': {},
            'file_changes': [],
            'processes': {},
            'vulnerabilities': []
        }
        self.metrics_lock = threading.Lock()
        
        # Alert callbacks
        self.alert_callbacks: List[Callable[[SecurityAlert], None]] = []
        
        self.logger.info("Security monitor initialized", component="security_monitor")
    
    def _setup_logger(self) -> logging.Logger:
        """Setup logger for security monitoring"""
        logger = logging.getLogger('security_monitor')
        logger.setLevel(logging.INFO)
        
        # Clear existing handlers
        logger.handlers.clear()
        
        # Console handler
        console_handler = logging.StreamHandler()
        console_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        console_handler.setFormatter(console_formatter)
        logger.addHandler(console_handler)
        
        # File handler
        log_dir = Path("./logs/security_monitor")
        log_dir.mkdir(parents=True, exist_ok=True)
        
        file_handler = logging.handlers.RotatingFileHandler(
            log_dir / "security_monitor.log",
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=5,
            encoding='utf-8'
        )
        file_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)
        
        return logger
    
    def start_monitoring(self):
        """Start security monitoring"""
        if self.monitoring_active:
            self.logger.warning("Security monitoring is already active")
            return
        
        self.monitoring_active = True
        self.logger.info("Starting security monitoring", component="security_monitor")
        
        # Start monitoring threads
        self._start_monitoring_threads()
        
        # Add alert callbacks
        self._setup_alert_callbacks()
        
        self.logger.info("Security monitoring started", component="security_monitor")
    
    def stop_monitoring(self):
        """Stop security monitoring"""
        if not self.monitoring_active:
            return
        
        self.logger.info("Stopping security monitoring", component="security_monitor")
        
        self.monitoring_active = False
        
        # Wait for threads to finish
        for thread in self.monitor_threads:
            thread.join(timeout=10.0)
        
        self.logger.info("Security monitoring stopped", component="security_monitor")
    
    def _start_monitoring_threads(self):
        """Start all monitoring threads"""
        # Authentication monitoring
        if self.config.enable_authentication_monitoring:
            thread = threading.Thread(
                target=self._monitor_authentication,
                daemon=True
            )
            thread.start()
            self.monitor_threads.append(thread)
        
        # Authorization monitoring
        if self.config.enable_authorization_monitoring:
            thread = threading.Thread(
                target=self._monitor_authorization,
                daemon=True
            )
            thread.start()
            self.monitor_threads.append(thread)
        
        # Data access monitoring
        if self.config.enable_data_access_monitoring:
            thread = threading.Thread(
                target=self._monitor_data_access,
                daemon=True
            )
            thread.start()
            self.monitor_threads.append(thread)
        
        # System monitoring
        if self.config.enable_system_monitoring:
            thread = threading.Thread(
                target=self._monitor_system,
                daemon=True
            )
            thread.start()
            self.monitor_threads.append(thread)
        
        # Network monitoring
        if self.config.enable_network_monitoring:
            thread = threading.Thread(
                target=self._monitor_network,
                daemon=True
            )
            thread.start()
            self.monitor_threads.append(thread)
        
        # File integrity monitoring
        if self.config.enable_file_integrity_monitoring:
            thread = threading.Thread(
                target=self._monitor_file_integrity,
                daemon=True
            )
            thread.start()
            self.monitor_threads.append(thread)
        
        # Process monitoring
        if self.config.enable_process_monitoring:
            thread = threading.Thread(
                target=self._monitor_processes,
                daemon=True
            )
            thread.start()
            self.monitor_threads.append(thread)
        
        # Log monitoring
        if self.config.enable_log_monitoring:
            thread = threading.Thread(
                target=self._monitor_logs,
                daemon=True
            )
            thread.start()
            self.monitor_threads.append(thread)
        
        # Vulnerability scanning
        if self.config.enable_vulnerability_scanning:
            thread = threading.Thread(
                target=self._scan_vulnerabilities,
                daemon=True
            )
            thread.start()
            self.monitor_threads.append(thread)
        
        # Anomaly detection
        if self.config.enable_anomaly_detection:
            thread = threading.Thread(
                target=self._detect_anomalies,
                daemon=True
            )
            thread.start()
            self.monitor_threads.append(thread)
    
    def _setup_alert_callbacks(self):
        """Setup alert callbacks"""
        # Email notification callback
        if self.config.enable_email_notifications:
            self.add_alert_callback(self._send_email_alert)
        
        # Webhook notification callback
        if self.config.enable_webhook_notifications:
            self.add_alert_callback(self._send_webhook_alert)
    
    def add_alert_callback(self, callback: Callable[[SecurityAlert], None]):
        """Add alert callback function"""
        self.alert_callbacks.append(callback)
    
    def _monitor_authentication(self):
        """Monitor authentication events"""
        self.logger.info("Starting authentication monitoring", component="security_monitor")
        
        while self.monitoring_active:
            try:
                # Get recent authentication events
                now = datetime.now()
                window_start = now - timedelta(minutes=self.config.failed_login_window_minutes)
                
                events = self.audit_logger.search_events(
                    event_type=self.audit_logger.AuditEventType.AUTHENTICATION,
                    start_date=window_start,
                    end_date=now,
                    limit=1000
                )
                
                # Count failed logins
                failed_logins = [
                    e for e in events
                    if e.get('outcome') == 'failure'
                ]
                
                # Update metrics
                with self.metrics_lock:
                    self.metrics['failed_logins'] = failed_logins
                
                # Check threshold
                if len(failed_logins) >= self.config.failed_login_threshold:
                    self._create_alert(
                        severity="HIGH",
                        category="AUTHENTICATION",
                        title="High Failed Login Rate",
                        description=f"{len(failed_logins)} failed login attempts in {self.config.failed_login_window_minutes} minutes",
                        source="authentication_monitor",
                        details={
                            'failed_count': len(failed_logins),
                            'window_minutes': self.config.failed_login_window_minutes,
                            'events': failed_logins[-10:]  # Last 10 events
                        }
                    )
                
                # Sleep until next scan
                time.sleep(self.config.authentication_scan_interval_seconds)
            
            except Exception as e:
                self.logger.error(f"Error in authentication monitoring: {e}",
                                component="security_monitor")
                time.sleep(60)  # Wait before retrying
    
    def _monitor_authorization(self):
        """Monitor authorization events"""
        self.logger.info("Starting authorization monitoring", component="security_monitor")
        
        while self.monitoring_active:
            try:
                # Get recent authorization events
                now = datetime.now()
                window_start = now - timedelta(hours=self.config.privileged_access_window_hours)
                
                events = self.audit_logger.search_events(
                    event_type=self.audit_logger.AuditEventType.AUTHORIZATION,
                    start_date=window_start,
                    end_date=now,
                    limit=1000
                )
                
                # Count privileged access
                privileged_access = [
                    e for e in events
                    if e.get('action', '').lower() in ['admin', 'root', 'sudo', 'privilege']
                    and e.get('outcome') == 'success'
                ]
                
                # Update metrics
                with self.metrics_lock:
                    self.metrics['privileged_access'] = privileged_access
                
                # Check threshold
                if len(privileged_access) >= self.config.privileged_access_threshold:
                    self._create_alert(
                        severity="HIGH",
                        category="AUTHORIZATION",
                        title="High Privileged Access Rate",
                        description=f"{len(privileged_access)} privileged access attempts in {self.config.privileged_access_window_hours} hours",
                        source="authorization_monitor",
                        details={
                            'privileged_count': len(privileged_access),
                            'window_hours': self.config.privileged_access_window_hours,
                            'events': privileged_access[-10:]  # Last 10 events
                        }
                    )
                
                # Sleep until next scan
                time.sleep(self.config.authorization_scan_interval_seconds)
            
            except Exception as e:
                self.logger.error(f"Error in authorization monitoring: {e}",
                                component="security_monitor")
                time.sleep(60)  # Wait before retrying
    
    def _monitor_data_access(self):
        """Monitor data access events"""
        self.logger.info("Starting data access monitoring", component="security_monitor")
        
        while self.monitoring_active:
            try:
                # Get recent data access events
                now = datetime.now()
                window_start = now - timedelta(hours=self.config.data_export_window_hours)
                
                events = self.audit_logger.search_events(
                    event_type=self.audit_logger.AuditEventType.DATA_ACCESS,
                    start_date=window_start,
                    end_date=now,
                    limit=1000
                )
                
                # Count data exports
                data_exports = [
                    e for e in events
                    if e.get('action', '').lower() in ['export', 'download', 'backup']
                    and e.get('outcome') == 'success'
                ]
                
                # Update metrics
                with self.metrics_lock:
                    self.metrics['data_exports'] = data_exports
                
                # Check threshold
                if len(data_exports) >= self.config.data_export_threshold:
                    self._create_alert(
                        severity="MEDIUM",
                        category="DATA_ACCESS",
                        title="High Data Export Rate",
                        description=f"{len(data_exports)} data export attempts in {self.config.data_export_window_hours} hours",
                        source="data_access_monitor",
                        details={
                            'export_count': len(data_exports),
                            'window_hours': self.config.data_export_window_hours,
                            'events': data_exports[-10:]  # Last 10 events
                        }
                    )
                
                # Sleep until next scan
                time.sleep(self.config.data_access_scan_interval_seconds)
            
            except Exception as e:
                self.logger.error(f"Error in data access monitoring: {e}",
                                component="security_monitor")
                time.sleep(60)  # Wait before retrying
    
    def _monitor_system(self):
        """Monitor system resources and events"""
        self.logger.info("Starting system monitoring", component="security_monitor")
        
        while self.monitoring_active:
            try:
                # Get system resource metrics
                import psutil
                
                # CPU usage
                cpu_percent = psutil.cpu_percent(interval=1)
                
                # Memory usage
                memory = psutil.virtual_memory()
                memory_percent = memory.percent
                
                # Disk usage
                disk = psutil.disk_usage('/')
                disk_percent = (disk.used / disk.total) * 100
                
                # Update metrics
                with self.metrics_lock:
                    self.metrics['system_resources'] = {
                        'cpu_percent': cpu_percent,
                        'memory_percent': memory_percent,
                        'disk_percent': disk_percent,
                        'timestamp': datetime.now().isoformat()
                    }
                
                # Check thresholds
                if cpu_percent >= self.config.cpu_threshold:
                    self._create_alert(
                        severity="MEDIUM",
                        category="SYSTEM",
                        title="High CPU Usage",
                        description=f"CPU usage is {cpu_percent:.1f}%",
                        source="system_monitor",
                        details={
                            'cpu_percent': cpu_percent,
                            'threshold': self.config.cpu_threshold
                        }
                    )
                
                if memory_percent >= self.config.memory_threshold:
                    self._create_alert(
                        severity="MEDIUM",
                        category="SYSTEM",
                        title="High Memory Usage",
                        description=f"Memory usage is {memory_percent:.1f}%",
                        source="system_monitor",
                        details={
                            'memory_percent': memory_percent,
                            'threshold': self.config.memory_threshold
                        }
                    )
                
                if disk_percent >= self.config.disk_threshold:
                    self._create_alert(
                        severity="HIGH",
                        category="SYSTEM",
                        title="High Disk Usage",
                        description=f"Disk usage is {disk_percent:.1f}%",
                        source="system_monitor",
                        details={
                            'disk_percent': disk_percent,
                            'threshold': self.config.disk_threshold
                        }
                    )
                
                # Sleep until next scan
                time.sleep(self.config.system_scan_interval_seconds)
            
            except Exception as e:
                self.logger.error(f"Error in system monitoring: {e}",
                                component="security_monitor")
                time.sleep(60)  # Wait before retrying
    
    def _monitor_network(self):
        """Monitor network connections and traffic"""
        self.logger.info("Starting network monitoring", component="security_monitor")
        
        while self.monitoring_active:
            try:
                # Get network connections
                import psutil
                
                connections = []
                for conn in psutil.net_connections():
                    if conn.status == 'ESTABLISHED':
                        connections.append({
                            'local_address': conn.laddr,
                            'remote_address': conn.raddr,
                            'status': conn.status,
                            'pid': conn.pid
                        })
                
                # Update metrics
                with self.metrics_lock:
                    self.metrics['network_connections'] = {
                        'count': len(connections),
                        'connections': connections[:100],  # First 100 connections
                        'timestamp': datetime.now().isoformat()
                    }
                
                # Check for suspicious connections
                suspicious_connections = [
                    conn for conn in connections
                    if conn.get('remote_address') and self._is_suspicious_ip(conn['remote_address'][0])
                ]
                
                if suspicious_connections:
                    self._create_alert(
                        severity="MEDIUM",
                        category="NETWORK",
                        title="Suspicious Network Connections",
                        description=f"{len(suspicious_connections)} suspicious network connections detected",
                        source="network_monitor",
                        details={
                            'suspicious_count': len(suspicious_connections),
                            'connections': suspicious_connections[:10]  # First 10 connections
                        }
                    )
                
                # Sleep until next scan
                time.sleep(self.config.network_scan_interval_seconds)
            
            except Exception as e:
                self.logger.error(f"Error in network monitoring: {e}",
                                component="security_monitor")
                time.sleep(60)  # Wait before retrying
    
    def _monitor_file_integrity(self):
        """Monitor file integrity for critical files"""
        self.logger.info("Starting file integrity monitoring", component="security_monitor")
        
        # Define critical files and directories to monitor
        critical_paths = [
            '/etc/passwd',
            '/etc/shadow',
            '/etc/sudoers',
            '/etc/hosts',
            '/etc/ssh/sshd_config',
            '/var/log/auth.log',
            '/var/log/secure',
            './config/production_config.json',
            './.env.production'
        ]
        
        # Calculate initial hashes
        file_hashes = {}
        for path in critical_paths:
            if os.path.exists(path):
                try:
                    with open(path, 'rb') as f:
                        file_hashes[path] = hashlib.sha256(f.read()).hexdigest()
                except Exception as e:
                    self.logger.warning(f"Could not hash file {path}: {e}",
                                     component="security_monitor")
        
        while self.monitoring_active:
            try:
                # Check for file changes
                changed_files = []
                for path, original_hash in file_hashes.items():
                    if os.path.exists(path):
                        try:
                            with open(path, 'rb') as f:
                                current_hash = hashlib.sha256(f.read()).hexdigest()
                            
                            if current_hash != original_hash:
                                changed_files.append({
                                    'path': path,
                                    'original_hash': original_hash,
                                    'current_hash': current_hash,
                                    'timestamp': datetime.now().isoformat()
                                })
                                
                                # Update hash
                                file_hashes[path] = current_hash
                        except Exception as e:
                            self.logger.warning(f"Could not check file {path}: {e}",
                                             component="security_monitor")
                    else:
                        # File deleted
                        changed_files.append({
                            'path': path,
                            'original_hash': original_hash,
                            'current_hash': None,
                            'timestamp': datetime.now().isoformat(),
                            'status': 'deleted'
                        })
                
                # Update metrics
                with self.metrics_lock:
                    self.metrics['file_changes'] = changed_files
                
                # Create alert for changes
                if changed_files:
                    self._create_alert(
                        severity="HIGH",
                        category="SYSTEM",
                        title="Critical File Integrity Violation",
                        description=f"{len(changed_files)} critical files have been modified",
                        source="file_integrity_monitor",
                        details={
                            'changed_files': changed_files
                        }
                    )
                
                # Sleep until next scan
                time.sleep(self.config.file_integrity_scan_interval_seconds)
            
            except Exception as e:
                self.logger.error(f"Error in file integrity monitoring: {e}",
                                component="security_monitor")
                time.sleep(60)  # Wait before retrying
    
    def _monitor_processes(self):
        """Monitor system processes for suspicious activity"""
        self.logger.info("Starting process monitoring", component="security_monitor")
        
        while self.monitoring_active:
            try:
                # Get running processes
                import psutil
                
                processes = []
                for proc in psutil.process_iter(['pid', 'name', 'username', 'cmdline']):
                    try:
                        processes.append({
                            'pid': proc.info['pid'],
                            'name': proc.info['name'],
                            'username': proc.info['username'],
                            'cmdline': proc.info['cmdline']
                        })
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        continue
                
                # Update metrics
                with self.metrics_lock:
                    self.metrics['processes'] = {
                        'count': len(processes),
                        'processes': processes[:100],  # First 100 processes
                        'timestamp': datetime.now().isoformat()
                    }
                
                # Check for suspicious processes
                suspicious_processes = [
                    proc for proc in processes
                    if self._is_suspicious_process(proc)
                ]
                
                if suspicious_processes:
                    self._create_alert(
                        severity="MEDIUM",
                        category="SYSTEM",
                        title="Suspicious Processes Detected",
                        description=f"{len(suspicious_processes)} suspicious processes detected",
                        source="process_monitor",
                        details={
                            'suspicious_count': len(suspicious_processes),
                            'processes': suspicious_processes[:10]  # First 10 processes
                        }
                    )
                
                # Sleep until next scan
                time.sleep(self.config.process_scan_interval_seconds)
            
            except Exception as e:
                self.logger.error(f"Error in process monitoring: {e}",
                                component="security_monitor")
                time.sleep(60)  # Wait before retrying
    
    def _monitor_logs(self):
        """Monitor log files for security events"""
        self.logger.info("Starting log monitoring", component="security_monitor")
        
        # Define log files to monitor
        log_files = [
            '/var/log/auth.log',
            '/var/log/secure',
            './logs/security_monitor/security_monitor.log',
            './audit_logs/audit.db'
        ]
        
        while self.monitoring_active:
            try:
                # Check for new log entries
                security_events = []
                
                for log_file in log_files:
                    if os.path.exists(log_file):
                        try:
                            # Get file size
                            file_size = os.path.getsize(log_file)
                            
                            # Read last 1KB of file
                            with open(log_file, 'rb') as f:
                                f.seek(max(0, file_size - 1024))
                                last_kb = f.read().decode('utf-8', errors='ignore')
                            
                            # Look for security events
                            security_patterns = [
                                r'authentication failure',
                                r'permission denied',
                                r'invalid user',
                                r'sudo.*failed',
                                r'root.*login',
                                r'unauthorized access',
                                r'security violation',
                                r'intrusion attempt',
                                r'malware detected',
                                r'virus detected'
                            ]
                            
                            for pattern in security_patterns:
                                import re
                                matches = re.findall(pattern, last_kb, re.IGNORECASE)
                                for match in matches:
                                    security_events.append({
                                        'log_file': log_file,
                                        'pattern': pattern,
                                        'match': match,
                                        'timestamp': datetime.now().isoformat()
                                    })
                        except Exception as e:
                            self.logger.warning(f"Could not monitor log file {log_file}: {e}",
                                             component="security_monitor")
                
                # Update metrics
                with self.metrics_lock:
                    self.metrics['security_events'] = security_events
                
                # Create alert for security events
                if security_events:
                    self._create_alert(
                        severity="MEDIUM",
                        category="SYSTEM",
                        title="Security Events Detected in Logs",
                        description=f"{len(security_events)} security events detected in logs",
                        source="log_monitor",
                        details={
                            'event_count': len(security_events),
                            'events': security_events[:10]  # First 10 events
                        }
                    )
                
                # Sleep until next scan
                time.sleep(self.config.log_scan_interval_seconds)
            
            except Exception as e:
                self.logger.error(f"Error in log monitoring: {e}",
                                component="security_monitor")
                time.sleep(60)  # Wait before retrying
    
    def _scan_vulnerabilities(self):
        """Scan for vulnerabilities"""
        self.logger.info("Starting vulnerability scanning", component="security_monitor")
        
        while self.monitoring_active:
            try:
                # Scan Docker images for vulnerabilities
                vulnerabilities = []
                
                try:
                    import subprocess
                    result = subprocess.run(
                        ['docker', 'images', '--format', '{{.Repository}}:{{.Tag}}'],
                        capture_output=True,
                        text=True,
                        timeout=60
                    )
                    
                    images = result.stdout.split('\n')
                    
                    for image in images:
                        if image.strip():
                            # Run Trivy scan if available
                            try:
                                trivy_result = subprocess.run(
                                    ['trivy', 'image', '--format', 'json', image],
                                    capture_output=True,
                                    text=True,
                                    timeout=300
                                )
                                
                                if trivy_result.returncode == 0:
                                    trivy_data = json.loads(trivy_result.stdout)
                                    
                                    for result in trivy_data.get('Results', []):
                                        for vuln in result.get('Vulnerabilities', []):
                                            if vuln.get('Severity') in ['HIGH', 'CRITICAL']:
                                                vulnerabilities.append({
                                                    'image': image,
                                                    'vulnerability_id': vuln.get('VulnerabilityID'),
                                                    'severity': vuln.get('Severity'),
                                                    'title': vuln.get('Title'),
                                                    'description': vuln.get('Description'),
                                                    'timestamp': datetime.now().isoformat()
                                                })
                            except Exception as e:
                                self.logger.warning(f"Could not scan image {image} with Trivy: {e}",
                                                 component="security_monitor")
                except Exception as e:
                    self.logger.warning(f"Could not scan Docker images: {e}",
                                     component="security_monitor")
                
                # Update metrics
                with self.metrics_lock:
                    self.metrics['vulnerabilities'] = vulnerabilities
                
                # Create alert for vulnerabilities
                if vulnerabilities:
                    self._create_alert(
                        severity="HIGH",
                        category="SYSTEM",
                        title="Security Vulnerabilities Detected",
                        description=f"{len(vulnerabilities)} security vulnerabilities detected",
                        source="vulnerability_scanner",
                        details={
                            'vulnerability_count': len(vulnerabilities),
                            'vulnerabilities': vulnerabilities[:10]  # First 10 vulnerabilities
                        }
                    )
                
                # Sleep until next scan
                time.sleep(self.config.vulnerability_scan_interval_seconds)
            
            except Exception as e:
                self.logger.error(f"Error in vulnerability scanning: {e}",
                                component="security_monitor")
                time.sleep(60)  # Wait before retrying
    
    def _detect_anomalies(self):
        """Detect anomalies in system behavior"""
        self.logger.info("Starting anomaly detection", component="security_monitor")
        
        while self.monitoring_active:
            try:
                anomalies = []
                
                # Check for anomalies in metrics
                with self.metrics_lock:
                    # Anomaly in failed logins
                    failed_logins = self.metrics.get('failed_logins', [])
                    if len(failed_logins) > 100:  # Unusual spike
                        anomalies.append({
                            'type': 'failed_login_spike',
                            'description': f"Unusual spike in failed logins: {len(failed_logins)}",
                            'timestamp': datetime.now().isoformat()
                        })
                    
                    # Anomaly in privileged access
                    privileged_access = self.metrics.get('privileged_access', [])
                    if len(privileged_access) > 50:  # Unusual spike
                        anomalies.append({
                            'type': 'privileged_access_spike',
                            'description': f"Unusual spike in privileged access: {len(privileged_access)}",
                            'timestamp': datetime.now().isoformat()
                        })
                    
                    # Anomaly in system resources
                    system_resources = self.metrics.get('system_resources', {})
                    if system_resources:
                        cpu_percent = system_resources.get('cpu_percent', 0)
                        if cpu_percent > 95:  # Unusually high CPU
                            anomalies.append({
                                'type': 'high_cpu',
                                'description': f"Unusually high CPU usage: {cpu_percent}%",
                                'timestamp': datetime.now().isoformat()
                            })
                        
                        memory_percent = system_resources.get('memory_percent', 0)
                        if memory_percent > 95:  # Unusually high memory
                            anomalies.append({
                                'type': 'high_memory',
                                'description': f"Unusually high memory usage: {memory_percent}%",
                                'timestamp': datetime.now().isoformat()
                            })
                
                # Update metrics
                with self.metrics_lock:
                    self.metrics['anomalies'] = anomalies
                
                # Create alert for anomalies
                if anomalies:
                    self._create_alert(
                        severity="MEDIUM",
                        category="SYSTEM",
                        title="Anomalies Detected",
                        description=f"{len(anomalies)} anomalies detected in system behavior",
                        source="anomaly_detector",
                        details={
                            'anomaly_count': len(anomalies),
                            'anomalies': anomalies[:10]  # First 10 anomalies
                        }
                    )
                
                # Sleep until next scan
                time.sleep(self.config.anomaly_detection_interval_seconds)
            
            except Exception as e:
                self.logger.error(f"Error in anomaly detection: {e}",
                                component="security_monitor")
                time.sleep(60)  # Wait before retrying
    
    def _is_suspicious_ip(self, ip_address: str) -> bool:
        """Check if IP address is suspicious"""
        # Define suspicious IP ranges
        suspicious_ranges = [
            '10.0.0.0/8',      # Private network
            '172.16.0.0/12',    # Private network
            '192.168.0.0/16',    # Private network
            '127.0.0.0/8',       # Loopback
            '169.254.0.0/16',    # Link-local
            '224.0.0.0/4'       # Multicast
        ]
        
        import ipaddress
        try:
            ip = ipaddress.ip_address(ip_address)
            
            for range_str in suspicious_ranges:
                network = ipaddress.ip_network(range_str)
                if ip in network:
                    return True
            
            return False
        except ValueError:
            return True  # Invalid IP is suspicious
    
    def _is_suspicious_process(self, process: Dict[str, Any]) -> bool:
        """Check if process is suspicious"""
        name = process.get('name', '').lower()
        cmdline = process.get('cmdline', [])
        
        # Suspicious process names
        suspicious_names = [
            'nc', 'netcat', 'nmap', 'wireshark', 'tcpdump',
            'john', 'hashcat', 'hydra', 'medusa',
            'msfconsole', 'metasploit', 'burpsuite',
            'sqlmap', 'nikto', 'dirb', 'gobuster',
            'cryptominer', 'xmrig', 'kawpow'
        ]
        
        # Check process name
        if any(sus_name in name for sus_name in suspicious_names):
            return True
        
        # Check command line arguments
        if cmdline:
            cmdline_str = ' '.join(cmdline).lower()
            suspicious_args = [
                '-reverse', '-e', '/bin/sh', '/bin/bash',
                'download', 'upload', 'execute', 'command',
                'inject', 'exploit', 'payload', 'shell'
            ]
            
            if any(sus_arg in cmdline_str for sus_arg in suspicious_args):
                return True
        
        return False
    
    def _create_alert(self, severity: str, category: str, title: str,
                   description: str, source: str, details: Dict[str, Any]):
        """Create and process security alert"""
        # Generate alert ID
        import uuid
        alert_id = str(uuid.uuid4())
        
        # Create alert
        alert = SecurityAlert(
            alert_id=alert_id,
            timestamp=datetime.now(),
            severity=severity,
            category=category,
            title=title,
            description=description,
            source=source,
            details=details
        )
        
        # Store alert
        with self.alerts_lock:
            self.alerts.append(alert)
        
        # Log alert
        self.logger.warning(f"SECURITY ALERT: {title} - {description}",
                          component="security_monitor", alert_id=alert_id)
        
        # Call alert callbacks
        for callback in self.alert_callbacks:
            try:
                callback(alert)
            except Exception as e:
                self.logger.error(f"Error in alert callback: {e}",
                                component="security_monitor")
    
    def _send_email_alert(self, alert: SecurityAlert):
        """Send email alert"""
        try:
            # Get email configuration
            smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
            smtp_port = int(os.getenv('SMTP_PORT', '587'))
            smtp_user = os.getenv('SMTP_USER')
            smtp_password = os.getenv('SMTP_PASSWORD')
            smtp_from = os.getenv('SMTP_FROM', 'security@uns-kikaku.com')
            
            if not smtp_user or not smtp_password:
                self.logger.warning("SMTP credentials not configured, skipping email alert",
                                 component="security_monitor")
                return
            
            # Create email message
            msg = MIMEMultipart()
            msg['From'] = smtp_from
            msg['To'] = ', '.join(self.config.email_recipients)
            msg['Subject'] = f"[SECURITY ALERT] {alert.title}"
            
            # Email body
            body = f"""
Security Alert Details:

Alert ID: {alert.alert_id}
Timestamp: {alert.timestamp}
Severity: {alert.severity}
Category: {alert.category}
Title: {alert.title}
Description: {alert.description}
Source: {alert.source}

Details:
{json.dumps(alert.details, indent=2)}

This is an automated security alert from UNS-CLAUDEJP Security Monitor.
"""
            
            msg.attach(MIMEText(body, 'plain'))
            
            # Send email
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
            
            self.logger.info(f"Email alert sent: {alert.alert_id}",
                           component="security_monitor")
        
        except Exception as e:
            self.logger.error(f"Failed to send email alert: {e}",
                            component="security_monitor")
    
    def _send_webhook_alert(self, alert: SecurityAlert):
        """Send webhook alert"""
        try:
            # Create webhook payload
            payload = {
                'alert_id': alert.alert_id,
                'timestamp': alert.timestamp.isoformat(),
                'severity': alert.severity,
                'category': alert.category,
                'title': alert.title,
                'description': alert.description,
                'source': alert.source,
                'details': alert.details,
                'service': 'uns-claudejp-security-monitor'
            }
            
            # Send to all webhook URLs
            for webhook_url in self.config.webhook_urls:
                try:
                    response = requests.post(
                        webhook_url,
                        json=payload,
                        timeout=10
                    )
                    
                    if response.status_code == 200:
                        self.logger.info(f"Webhook alert sent to {webhook_url}: {alert.alert_id}",
                                       component="security_monitor")
                    else:
                        self.logger.warning(f"Webhook alert failed for {webhook_url}: {response.status_code}",
                                         component="security_monitor")
                except Exception as e:
                    self.logger.error(f"Failed to send webhook alert to {webhook_url}: {e}",
                                    component="security_monitor")
        
        except Exception as e:
            self.logger.error(f"Failed to send webhook alert: {e}",
                            component="security_monitor")
    
    def get_alerts(self, hours: int = 24) -> List[SecurityAlert]:
        """Get alerts from specified time period"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        with self.alerts_lock:
            return [
                alert for alert in self.alerts
                if alert.timestamp > cutoff_time
            ]
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current monitoring metrics"""
        with self.metrics_lock:
            return self.metrics.copy()
    
    def acknowledge_alert(self, alert_id: str, acknowledged_by: str) -> bool:
        """Acknowledge a security alert"""
        with self.alerts_lock:
            for alert in self.alerts:
                if alert.alert_id == alert_id:
                    alert.acknowledged = True
                    self.logger.info(f"Alert acknowledged: {alert_id}",
                                   component="security_monitor", acknowledged_by=acknowledged_by)
                    return True
        
        return False
    
    def resolve_alert(self, alert_id: str, resolved_by: str) -> bool:
        """Resolve a security alert"""
        with self.alerts_lock:
            for alert in self.alerts:
                if alert.alert_id == alert_id:
                    alert.resolved = True
                    alert.resolved_at = datetime.now()
                    alert.resolved_by = resolved_by
                    self.logger.info(f"Alert resolved: {alert_id}",
                                   component="security_monitor", resolved_by=resolved_by)
                    return True
        
        return False


def create_monitoring_config(config_file: Optional[str] = None) -> MonitoringConfig:
    """Create monitoring configuration from file or defaults"""
    if config_file and Path(config_file).exists():
        try:
            with open(config_file, 'r') as f:
                config_data = json.load(f)
            
            return MonitoringConfig(**config_data)
        except Exception as e:
            print(f"Error loading monitoring config: {e}")
            return MonitoringConfig()
    else:
        return MonitoringConfig()


def signal_handler(signum, frame):
    """Handle interrupt signals"""
    print("\nSecurity monitoring interrupted by user")
    sys.exit(130)


def main():
    """Main security monitoring execution"""
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    parser = argparse.ArgumentParser(
        description="Security Monitoring for UNS-CLAUDEJP 5.4",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    %(prog)s                                    # Start monitoring with default config
    %(prog)s --config monitoring.json          # Use custom config
    %(prog)s --dry-run                          # Show what would be monitored
        """
    )
    
    parser.add_argument(
        '--config',
        type=str,
        help='Configuration file path'
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be monitored without executing'
    )
    
    args = parser.parse_args()
    
    try:
        # Load configuration
        config = create_monitoring_config(args.config)
        
        print("UNS-CLAUDEJP 5.4 - Security Monitoring")
        print("=" * 60)
        print(f"Configuration: {args.config or 'default'}")
        print(f"Dry run: {args.dry_run}")
        print()
        
        # Create security monitor
        monitor = SecurityMonitor(config)
        
        if args.dry_run:
            print("Dry run mode - showing what would be monitored:")
            print(f"  Authentication monitoring: {config.enable_authentication_monitoring}")
            print(f"  Authorization monitoring: {config.enable_authorization_monitoring}")
            print(f"  Data access monitoring: {config.enable_data_access_monitoring}")
            print(f"  System monitoring: {config.enable_system_monitoring}")
            print(f"  Network monitoring: {config.enable_network_monitoring}")
            print(f"  File integrity monitoring: {config.enable_file_integrity_monitoring}")
            print(f"  Process monitoring: {config.enable_process_monitoring}")
            print(f"  Log monitoring: {config.enable_log_monitoring}")
            print(f"  Vulnerability scanning: {config.enable_vulnerability_scanning}")
            print(f"  Anomaly detection: {config.enable_anomaly_detection}")
            return 0
        
        # Start monitoring
        monitor.start_monitoring()
        
        try:
            # Keep running until interrupted
            while True:
                time.sleep(10)
        
        except KeyboardInterrupt:
            print("\nStopping security monitoring...")
            monitor.stop_monitoring()
            return 0
    
    except KeyboardInterrupt:
        print("\nSecurity monitoring interrupted by user")
        return 130
    except Exception as e:
        print(f"ERROR: {e}")
        return 1


if __name__ == '__main__':
    exit_code = main()
    sys.exit(exit_code)