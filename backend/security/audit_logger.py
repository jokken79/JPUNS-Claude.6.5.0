"""
Security Audit Logger Module
UNS-CLAUDEJP 5.4 - Production Security Hardening

This module provides comprehensive security auditing, tamper-evident logging,
and compliance tracking for all security-relevant operations.
"""

import json
import hashlib
import hmac
import threading
import time
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Union, Callable
from dataclasses import dataclass, asdict
from pathlib import Path
from enum import Enum
import sqlite3
import gzip
import base64

from ..utils.logging_utils import PhotoExtractionLogger


class AuditEventType(Enum):
    """Audit event types"""
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    DATA_ACCESS = "data_access"
    DATA_MODIFICATION = "data_modification"
    SYSTEM_CONFIG = "system_config"
    SECURITY_VIOLATION = "security_violation"
    FILE_OPERATION = "file_operation"
    DATABASE_OPERATION = "database_operation"
    NETWORK_ACCESS = "network_access"
    CREDENTIAL_ACCESS = "credential_access"
    ERROR_EVENT = "error_event"
    SYSTEM_EVENT = "system_event"


class AuditSeverity(Enum):
    """Audit event severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class AuditEvent:
    """Audit event structure"""
    event_id: str
    timestamp: datetime
    event_type: AuditEventType
    severity: AuditSeverity
    user_id: Optional[str]
    session_id: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]
    action: str
    resource: Optional[str]
    outcome: str  # success, failure, error
    details: Dict[str, Any]
    risk_score: float = 0.0
    previous_hash: Optional[str] = None
    current_hash: Optional[str] = None
    signature: Optional[str] = None


@dataclass
class AuditConfiguration:
    """Audit system configuration"""
    enable_file_logging: bool = True
    enable_database_logging: bool = True
    enable_tamper_detection: bool = True
    enable_compression: bool = True
    log_retention_days: int = 90
    max_log_file_size_mb: int = 100
    hash_algorithm: str = "SHA256"
    signature_key: Optional[str] = None
    database_path: str = "./audit.db"
    log_directory: str = "./audit_logs"
    real_time_monitoring: bool = True
    alert_thresholds: Dict[str, int] = None
    
    def __post_init__(self):
        if self.alert_thresholds is None:
            self.alert_thresholds = {
                'failed_logins_per_minute': 5,
                'security_violations_per_hour': 10,
                'high_risk_events_per_hour': 5,
                'data_access_anomalies_per_hour': 15
            }


class SecurityAuditLogger:
    """
    Enterprise-grade security audit logger with tamper detection.
    
    Features:
    - Tamper-evident logging with cryptographic hashes
    - Real-time monitoring and alerting
    - Structured audit trails
    - Compliance reporting
    - Chain of custody tracking
    - Secure log storage
    - Event correlation
    - Risk assessment
    """
    
    def __init__(self, logger: PhotoExtractionLogger, config: AuditConfiguration):
        self.logger = logger
        self.config = config
        self._lock = threading.RLock()
        self._event_callbacks: List[Callable[[AuditEvent], None]] = []
        self._event_buffer: List[AuditEvent] = []
        self._buffer_lock = threading.Lock()
        self._monitoring_active = False
        self._monitor_thread: Optional[threading.Thread] = None
        
        # Initialize storage
        self._init_storage()
        
        # Load previous hash for chain integrity
        self._previous_hash = self._get_last_hash()
        
        # Start monitoring if enabled
        if config.real_time_monitoring:
            self._start_monitoring()
        
        self.logger.info("Security audit logger initialized", component="audit_logger")
    
    def _init_storage(self):
        """Initialize audit storage backends"""
        try:
            # Initialize file storage
            if self.config.enable_file_logging:
                log_dir = Path(self.config.log_directory)
                log_dir.mkdir(parents=True, exist_ok=True)
                log_dir.chmod(0o700)  # Secure permissions
            
            # Initialize database storage
            if self.config.enable_database_logging:
                self._init_database()
        
        except Exception as e:
            self.logger.error(f"Failed to initialize audit storage: {e}",
                            component="audit_logger")
            raise
    
    def _init_database(self):
        """Initialize audit database"""
        try:
            db_path = Path(self.config.database_path)
            
            with sqlite3.connect(str(db_path)) as conn:
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS audit_events (
                        event_id TEXT PRIMARY KEY,
                        timestamp TEXT NOT NULL,
                        event_type TEXT NOT NULL,
                        severity TEXT NOT NULL,
                        user_id TEXT,
                        session_id TEXT,
                        ip_address TEXT,
                        user_agent TEXT,
                        action TEXT NOT NULL,
                        resource TEXT,
                        outcome TEXT NOT NULL,
                        details TEXT,
                        risk_score REAL DEFAULT 0.0,
                        previous_hash TEXT,
                        current_hash TEXT,
                        signature TEXT
                    )
                """)
                
                conn.execute("""
                    CREATE INDEX IF NOT EXISTS idx_timestamp ON audit_events(timestamp)
                """)
                
                conn.execute("""
                    CREATE INDEX IF NOT EXISTS idx_event_type ON audit_events(event_type)
                """)
                
                conn.execute("""
                    CREATE INDEX IF NOT EXISTS idx_user_id ON audit_events(user_id)
                """)
                
                conn.execute("""
                    CREATE INDEX IF NOT EXISTS idx_severity ON audit_events(severity)
                """)
                
                conn.commit()
            
            # Secure database file permissions
            db_path.chmod(0o600)
        
        except Exception as e:
            self.logger.error(f"Failed to initialize audit database: {e}",
                            component="audit_logger")
            raise
    
    def _get_last_hash(self) -> Optional[str]:
        """Get hash of last audit event for chain integrity"""
        try:
            if self.config.enable_database_logging:
                with sqlite3.connect(self.config.database_path) as conn:
                    cursor = conn.execute("""
                        SELECT current_hash FROM audit_events 
                        ORDER BY timestamp DESC, event_id DESC 
                        LIMIT 1
                    """)
                    result = cursor.fetchone()
                    return result[0] if result else None
            else:
                # Check file storage
                log_dir = Path(self.config.log_directory)
                log_files = sorted(log_dir.glob("audit_*.json*"))
                
                if log_files:
                    last_file = log_files[-1]
                    with open(last_file, 'r', encoding='utf-8') as f:
                        lines = f.readlines()
                        if lines:
                            last_event = json.loads(lines[-1])
                            return last_event.get('current_hash')
        
        except Exception as e:
            self.logger.warning(f"Failed to get last hash: {e}",
                             component="audit_logger")
        
        return None
    
    def _calculate_event_hash(self, event: AuditEvent) -> str:
        """Calculate hash for audit event"""
        try:
            # Create event data for hashing
            event_data = {
                'timestamp': event.timestamp.isoformat(),
                'event_type': event.event_type.value,
                'severity': event.severity.value,
                'user_id': event.user_id,
                'session_id': event.session_id,
                'ip_address': event.ip_address,
                'action': event.action,
                'resource': event.resource,
                'outcome': event.outcome,
                'details': event.details,
                'risk_score': event.risk_score,
                'previous_hash': self._previous_hash
            }
            
            # Serialize and hash
            event_json = json.dumps(event_data, sort_keys=True, separators=(',', ':'))
            
            if self.config.hash_algorithm == "SHA256":
                return hashlib.sha256(event_json.encode()).hexdigest()
            elif self.config.hash_algorithm == "SHA512":
                return hashlib.sha512(event_json.encode()).hexdigest()
            else:
                return hashlib.sha256(event_json.encode()).hexdigest()
        
        except Exception as e:
            self.logger.error(f"Failed to calculate event hash: {e}",
                            component="audit_logger")
            return ""
    
    def _sign_event(self, event: AuditEvent) -> Optional[str]:
        """Sign audit event for integrity verification"""
        if not self.config.signature_key:
            return None
        
        try:
            event_data = json.dumps(asdict(event), sort_keys=True, separators=(',', ':'))
            signature = hmac.new(
                self.config.signature_key.encode(),
                event_data.encode(),
                hashlib.sha256
            ).digest()
            
            return base64.b64encode(signature).decode()
        
        except Exception as e:
            self.logger.error(f"Failed to sign event: {e}",
                            component="audit_logger")
            return None
    
    def _write_to_file(self, event: AuditEvent):
        """Write audit event to file"""
        try:
            log_dir = Path(self.config.log_directory)
            
            # Create daily log file
            date_str = event.timestamp.strftime("%Y%m%d")
            log_file = log_dir / f"audit_{date_str}.json"
            
            # Check file size and rotate if necessary
            if log_file.exists() and log_file.stat().st_size > self.config.max_log_file_size_mb * 1024 * 1024:
                log_file = log_dir / f"audit_{date_str}_{int(time.time())}.json"
            
            # Prepare event data
            event_data = asdict(event)
            event_data['timestamp'] = event.timestamp.isoformat()
            event_data['event_type'] = event.event_type.value
            event_data['severity'] = event.severity.value
            
            # Write event
            with open(log_file, 'a', encoding='utf-8') as f:
                json.dump(event_data, f, separators=(',', ':'))
                f.write('\n')
            
            # Compress old files if enabled
            if self.config.enable_compression:
                self._compress_old_logs()
            
            # Secure file permissions
            log_file.chmod(0o600)
        
        except Exception as e:
            self.logger.error(f"Failed to write audit event to file: {e}",
                            component="audit_logger")
    
    def _write_to_database(self, event: AuditEvent):
        """Write audit event to database"""
        try:
            with sqlite3.connect(self.config.database_path) as conn:
                conn.execute("""
                    INSERT INTO audit_events (
                        event_id, timestamp, event_type, severity, user_id, session_id,
                        ip_address, user_agent, action, resource, outcome, details,
                        risk_score, previous_hash, current_hash, signature
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    event.event_id,
                    event.timestamp.isoformat(),
                    event.event_type.value,
                    event.severity.value,
                    event.user_id,
                    event.session_id,
                    event.ip_address,
                    event.user_agent,
                    event.action,
                    event.resource,
                    event.outcome,
                    json.dumps(event.details),
                    event.risk_score,
                    event.previous_hash,
                    event.current_hash,
                    event.signature
                ))
                conn.commit()
        
        except Exception as e:
            self.logger.error(f"Failed to write audit event to database: {e}",
                            component="audit_logger")
    
    def _compress_old_logs(self):
        """Compress old audit log files"""
        try:
            log_dir = Path(self.config.log_directory)
            cutoff_date = datetime.now() - timedelta(days=7)  # Compress files older than 7 days
            
            for log_file in log_dir.glob("audit_*.json"):
                if not log_file.name.endswith('.gz'):
                    # Extract date from filename
                    try:
                        date_part = log_file.stem.split('_')[1]
                        file_date = datetime.strptime(date_part, "%Y%m%d")
                        
                        if file_date < cutoff_date:
                            # Compress file
                            with open(log_file, 'rb') as f_in:
                                with gzip.open(f"{log_file}.gz", 'wb') as f_out:
                                    f_out.writelines(f_in)
                            
                            # Remove original file
                            log_file.unlink()
                    
                    except (ValueError, IndexError):
                        continue
        
        except Exception as e:
            self.logger.warning(f"Failed to compress old logs: {e}",
                             component="audit_logger")
    
    def _start_monitoring(self):
        """Start real-time monitoring thread"""
        if self._monitoring_active:
            return
        
        self._monitoring_active = True
        self._monitor_thread = threading.Thread(target=self._monitoring_loop, daemon=True)
        self._monitor_thread.start()
    
    def _monitoring_loop(self):
        """Real-time monitoring loop"""
        while self._monitoring_active:
            try:
                # Process buffered events
                with self._buffer_lock:
                    if self._event_buffer:
                        events = self._event_buffer.copy()
                        self._event_buffer.clear()
                    
                    # Check for alert conditions
                    self._check_alert_conditions(events)
                
                # Sleep for monitoring interval
                time.sleep(60)  # Check every minute
            
            except Exception as e:
                self.logger.error(f"Error in monitoring loop: {e}",
                                component="audit_logger")
                time.sleep(60)
    
    def _check_alert_conditions(self, events: List[AuditEvent]):
        """Check for alert conditions"""
        if not events:
            return
        
        now = datetime.now()
        
        # Check failed logins
        failed_logins = [
            e for e in events
            if e.event_type == AuditEventType.AUTHENTICATION and e.outcome == "failure"
            and (now - e.timestamp).seconds <= 60
        ]
        
        if len(failed_logins) >= self.config.alert_thresholds['failed_logins_per_minute']:
            self._trigger_alert("HIGH_LOGIN_FAILURE_RATE", {
                'count': len(failed_logins),
                'time_window': '1 minute'
            })
        
        # Check security violations
        security_violations = [
            e for e in events
            if e.event_type == AuditEventType.SECURITY_VIOLATION
            and (now - e.timestamp).seconds <= 3600
        ]
        
        if len(security_violations) >= self.config.alert_thresholds['security_violations_per_hour']:
            self._trigger_alert("HIGH_SECURITY_VIOLATION_RATE", {
                'count': len(security_violations),
                'time_window': '1 hour'
            })
        
        # Check high risk events
        high_risk_events = [
            e for e in events
            if e.risk_score >= 7.0
            and (now - e.timestamp).seconds <= 3600
        ]
        
        if len(high_risk_events) >= self.config.alert_thresholds['high_risk_events_per_hour']:
            self._trigger_alert("HIGH_RISK_EVENTS", {
                'count': len(high_risk_events),
                'time_window': '1 hour'
            })
    
    def _trigger_alert(self, alert_type: str, details: Dict[str, Any]):
        """Trigger security alert"""
        self.logger.warning(f"SECURITY ALERT: {alert_type} - {details}",
                          component="audit_logger", alert_type=alert_type)
        
        # Log alert as audit event
        self.log_event(
            event_type=AuditEventType.SECURITY_VIOLATION,
            severity=AuditSeverity.HIGH,
            action="security_alert",
            resource="audit_system",
            outcome="alert_triggered",
            details={
                'alert_type': alert_type,
                'alert_details': details,
                'timestamp': datetime.now().isoformat()
            },
            risk_score=8.0
        )
    
    def log_event(self, event_type: AuditEventType, severity: AuditSeverity,
                  action: str, outcome: str, user_id: Optional[str] = None,
                  session_id: Optional[str] = None, ip_address: Optional[str] = None,
                  user_agent: Optional[str] = None, resource: Optional[str] = None,
                  details: Optional[Dict[str, Any]] = None, risk_score: float = 0.0) -> str:
        """
        Log a security audit event
        
        Args:
            event_type: Type of audit event
            severity: Severity level
            action: Action performed
            outcome: Outcome of action (success, failure, error)
            user_id: User identifier
            session_id: Session identifier
            ip_address: IP address
            user_agent: User agent string
            resource: Resource being accessed
            details: Additional event details
            risk_score: Risk score (0-10)
            
        Returns:
            Event ID
        """
        try:
            # Generate event ID
            event_id = hashlib.sha256(
                f"{datetime.now().isoformat()}{action}{user_id or 'anonymous'}".encode()
            ).hexdigest()[:16]
            
            # Create audit event
            event = AuditEvent(
                event_id=event_id,
                timestamp=datetime.now(),
                event_type=event_type,
                severity=severity,
                user_id=user_id,
                session_id=session_id,
                ip_address=ip_address,
                user_agent=user_agent,
                action=action,
                resource=resource,
                outcome=outcome,
                details=details or {},
                risk_score=risk_score,
                previous_hash=self._previous_hash
            )
            
            # Calculate hash and signature
            event.current_hash = self._calculate_event_hash(event)
            
            if self.config.enable_tamper_detection:
                event.signature = self._sign_event(event)
            
            # Store event
            with self._lock:
                if self.config.enable_file_logging:
                    self._write_to_file(event)
                
                if self.config.enable_database_logging:
                    self._write_to_database(event)
                
                # Update previous hash for chain integrity
                self._previous_hash = event.current_hash
            
            # Add to monitoring buffer
            if self.config.real_time_monitoring:
                with self._buffer_lock:
                    self._event_buffer.append(event)
            
            # Call event callbacks
            for callback in self._event_callbacks:
                try:
                    callback(event)
                except Exception as e:
                    self.logger.error(f"Error in event callback: {e}",
                                    component="audit_logger")
            
            return event_id
        
        except Exception as e:
            self.logger.error(f"Failed to log audit event: {e}",
                            component="audit_logger")
            return ""
    
    def verify_integrity(self, start_date: Optional[datetime] = None,
                       end_date: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Verify audit log integrity
        
        Args:
            start_date: Start date for verification
            end_date: End date for verification
            
        Returns:
            Integrity verification results
        """
        try:
            if self.config.enable_database_logging:
                return self._verify_database_integrity(start_date, end_date)
            else:
                return self._verify_file_integrity(start_date, end_date)
        
        except Exception as e:
            self.logger.error(f"Failed to verify integrity: {e}",
                            component="audit_logger")
            return {'verified': False, 'error': str(e)}
    
    def _verify_database_integrity(self, start_date: Optional[datetime],
                                  end_date: Optional[datetime]) -> Dict[str, Any]:
        """Verify database integrity"""
        query = "SELECT * FROM audit_events ORDER BY timestamp, event_id"
        params = []
        
        if start_date:
            query += " WHERE timestamp >= ?"
            params.append(start_date.isoformat())
        
        if end_date:
            query += " AND timestamp <= ?"
            params.append(end_date.isoformat())
        
        with sqlite3.connect(self.config.database_path) as conn:
            cursor = conn.execute(query, params)
            events = cursor.fetchall()
        
        return self._verify_event_chain(events)
    
    def _verify_file_integrity(self, start_date: Optional[datetime],
                              end_date: Optional[datetime]) -> Dict[str, Any]:
        """Verify file integrity"""
        events = []
        log_dir = Path(self.config.log_directory)
        
        for log_file in sorted(log_dir.glob("audit_*.json*")):
            try:
                with open(log_file, 'r', encoding='utf-8') as f:
                    for line in f:
                        event_data = json.loads(line.strip())
                        event_time = datetime.fromisoformat(event_data['timestamp'])
                        
                        # Filter by date range
                        if start_date and event_time < start_date:
                            continue
                        if end_date and event_time > end_date:
                            continue
                        
                        events.append(event_data)
            
            except Exception as e:
                self.logger.warning(f"Error reading log file {log_file}: {e}",
                                 component="audit_logger")
        
        return self._verify_event_chain(events)
    
    def _verify_event_chain(self, events: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Verify chain of custody for events"""
        if not events:
            return {'verified': True, 'message': 'No events to verify'}
        
        verified_count = 0
        total_count = len(events)
        violations = []
        
        previous_hash = None
        
        for i, event_data in enumerate(events):
            current_hash = event_data.get('current_hash')
            expected_previous_hash = event_data.get('previous_hash')
            
            # Verify hash chain
            if i > 0 and expected_previous_hash != previous_hash:
                violations.append({
                    'event_id': event_data.get('event_id'),
                    'timestamp': event_data.get('timestamp'),
                    'violation': 'hash_chain_break',
                    'expected_previous': expected_previous_hash,
                    'actual_previous': previous_hash
                })
            else:
                verified_count += 1
            
            # Verify signature if present
            signature = event_data.get('signature')
            if signature and self.config.signature_key:
                # Recreate event without signature
                event_copy = event_data.copy()
                event_copy.pop('signature', None)
                
                event_json = json.dumps(event_copy, sort_keys=True, separators=(',', ':'))
                expected_signature = hmac.new(
                    self.config.signature_key.encode(),
                    event_json.encode(),
                    hashlib.sha256
                ).digest()
                
                actual_signature = base64.b64decode(signature)
                
                if not hmac.compare_digest(expected_signature, actual_signature):
                    violations.append({
                        'event_id': event_data.get('event_id'),
                        'timestamp': event_data.get('timestamp'),
                        'violation': 'signature_invalid'
                    })
            
            previous_hash = current_hash
        
        return {
            'verified': len(violations) == 0,
            'total_events': total_count,
            'verified_events': verified_count,
            'violations': violations,
            'verification_rate': (verified_count / total_count * 100) if total_count > 0 else 0
        }
    
    def search_events(self, event_type: Optional[AuditEventType] = None,
                    user_id: Optional[str] = None,
                    start_date: Optional[datetime] = None,
                    end_date: Optional[datetime] = None,
                    severity: Optional[AuditSeverity] = None,
                    limit: int = 1000) -> List[Dict[str, Any]]:
        """
        Search audit events
        
        Args:
            event_type: Filter by event type
            user_id: Filter by user ID
            start_date: Filter by start date
            end_date: Filter by end date
            severity: Filter by severity
            limit: Maximum number of results
            
        Returns:
            List of matching audit events
        """
        try:
            if self.config.enable_database_logging:
                return self._search_database_events(event_type, user_id, start_date, end_date, severity, limit)
            else:
                return self._search_file_events(event_type, user_id, start_date, end_date, severity, limit)
        
        except Exception as e:
            self.logger.error(f"Failed to search events: {e}",
                            component="audit_logger")
            return []
    
    def _search_database_events(self, event_type: Optional[AuditEventType],
                              user_id: Optional[str], start_date: Optional[datetime],
                              end_date: Optional[datetime], severity: Optional[AuditSeverity],
                              limit: int) -> List[Dict[str, Any]]:
        """Search events in database"""
        query = "SELECT * FROM audit_events WHERE 1=1"
        params = []
        
        if event_type:
            query += " AND event_type = ?"
            params.append(event_type.value)
        
        if user_id:
            query += " AND user_id = ?"
            params.append(user_id)
        
        if start_date:
            query += " AND timestamp >= ?"
            params.append(start_date.isoformat())
        
        if end_date:
            query += " AND timestamp <= ?"
            params.append(end_date.isoformat())
        
        if severity:
            query += " AND severity = ?"
            params.append(severity.value)
        
        query += " ORDER BY timestamp DESC LIMIT ?"
        params.append(limit)
        
        with sqlite3.connect(self.config.database_path) as conn:
            cursor = conn.execute(query, params)
            events = cursor.fetchall()
        
        # Convert to dictionaries
        columns = [desc[0] for desc in cursor.description]
        return [dict(zip(columns, event)) for event in events]
    
    def _search_file_events(self, event_type: Optional[AuditEventType],
                         user_id: Optional[str], start_date: Optional[datetime],
                         end_date: Optional[datetime], severity: Optional[AuditSeverity],
                         limit: int) -> List[Dict[str, Any]]:
        """Search events in files"""
        matching_events = []
        log_dir = Path(self.config.log_directory)
        
        for log_file in sorted(log_dir.glob("audit_*.json*"), reverse=True):
            try:
                with open(log_file, 'r', encoding='utf-8') as f:
                    for line in f:
                        event_data = json.loads(line.strip())
                        
                        # Apply filters
                        if event_type and event_data.get('event_type') != event_type.value:
                            continue
                        
                        if user_id and event_data.get('user_id') != user_id:
                            continue
                        
                        if severity and event_data.get('severity') != severity.value:
                            continue
                        
                        event_time = datetime.fromisoformat(event_data['timestamp'])
                        
                        if start_date and event_time < start_date:
                            continue
                        
                        if end_date and event_time > end_date:
                            continue
                        
                        matching_events.append(event_data)
                        
                        if len(matching_events) >= limit:
                            return matching_events
            
            except Exception as e:
                self.logger.warning(f"Error reading log file {log_file}: {e}",
                                 component="audit_logger")
        
        return matching_events[:limit]
    
    def add_event_callback(self, callback: Callable[[AuditEvent], None]):
        """Add callback for real-time event processing"""
        self._event_callbacks.append(callback)
    
    def get_audit_statistics(self, days: int = 30) -> Dict[str, Any]:
        """Get audit statistics for specified period"""
        try:
            start_date = datetime.now() - timedelta(days=days)
            events = self.search_events(start_date=start_date, limit=10000)
            
            if not events:
                return {'period_days': days, 'total_events': 0}
            
            # Calculate statistics
            stats = {
                'period_days': days,
                'total_events': len(events),
                'events_by_type': {},
                'events_by_severity': {},
                'events_by_outcome': {},
                'unique_users': len(set(e.get('user_id') for e in events if e.get('user_id'))),
                'unique_ips': len(set(e.get('ip_address') for e in events if e.get('ip_address'))),
                'average_risk_score': sum(e.get('risk_score', 0) for e in events) / len(events),
                'high_risk_events': len([e for e in events if e.get('risk_score', 0) >= 7.0]),
                'failed_operations': len([e for e in events if e.get('outcome') == 'failure']),
                'security_violations': len([e for e in events if e.get('event_type') == 'security_violation'])
            }
            
            # Count by type
            for event in events:
                event_type = event.get('event_type', 'unknown')
                stats['events_by_type'][event_type] = stats['events_by_type'].get(event_type, 0) + 1
            
            # Count by severity
            for event in events:
                severity = event.get('severity', 'unknown')
                stats['events_by_severity'][severity] = stats['events_by_severity'].get(severity, 0) + 1
            
            # Count by outcome
            for event in events:
                outcome = event.get('outcome', 'unknown')
                stats['events_by_outcome'][outcome] = stats['events_by_outcome'].get(outcome, 0) + 1
            
            return stats
        
        except Exception as e:
            self.logger.error(f"Failed to get audit statistics: {e}",
                            component="audit_logger")
            return {'error': str(e)}
    
    def cleanup_old_events(self, retention_days: Optional[int] = None) -> int:
        """Clean up old audit events"""
        try:
            retention_days = retention_days or self.config.log_retention_days
            cutoff_date = datetime.now() - timedelta(days=retention_days)
            deleted_count = 0
            
            # Clean up database
            if self.config.enable_database_logging:
                with sqlite3.connect(self.config.database_path) as conn:
                    cursor = conn.execute(
                        "DELETE FROM audit_events WHERE timestamp < ?",
                        (cutoff_date.isoformat(),)
                    )
                    deleted_count = cursor.rowcount
                    conn.commit()
            
            # Clean up old files
            if self.config.enable_file_logging:
                log_dir = Path(self.config.log_directory)
                for log_file in log_dir.glob("audit_*.json*"):
                    try:
                        # Extract date from filename
                        date_part = log_file.stem.split('_')[1]
                        file_date = datetime.strptime(date_part, "%Y%m%d")
                        
                        if file_date < cutoff_date:
                            log_file.unlink()
                            deleted_count += 1
                    
                    except (ValueError, IndexError):
                        continue
            
            self.logger.info(f"Cleaned up {deleted_count} old audit events",
                           component="audit_logger")
            
            return deleted_count
        
        except Exception as e:
            self.logger.error(f"Failed to cleanup old events: {e}",
                            component="audit_logger")
            return 0
    
    def shutdown(self):
        """Shutdown audit logger gracefully"""
        try:
            self._monitoring_active = False
            
            if self._monitor_thread:
                self._monitor_thread.join(timeout=10.0)
            
            self.logger.info("Security audit logger shutdown completed",
                           component="audit_logger")
        
        except Exception as e:
            self.logger.error(f"Error during shutdown: {e}",
                            component="audit_logger")


def create_security_audit_logger(logger: PhotoExtractionLogger,
                             config: Optional[AuditConfiguration] = None) -> SecurityAuditLogger:
    """Factory function to create security audit logger"""
    if config is None:
        config = AuditConfiguration()
    
    return SecurityAuditLogger(logger, config)