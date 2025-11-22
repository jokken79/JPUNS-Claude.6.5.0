#!/usr/bin/env python3
"""
DI Migration Script - FASE 4 Task #1

This script helps migrate route files to use the new DI container.
It analyzes route files and suggests/applies DI patterns.

Usage:
    python scripts/migrate_to_di.py --analyze app/api/candidates.py
    python scripts/migrate_to_di.py --migrate app/api/candidates.py
    python scripts/migrate_to_di.py --all --dry-run
"""
import re
import sys
from pathlib import Path
from typing import Dict, List, Tuple
import argparse

# Service mapping: old import -> DI function name
SERVICE_MAPPING = {
    'AuthService': 'get_auth_service',
    'CandidateService': 'get_candidate_service',
    'ApartmentService': 'get_apartment_service',
    'AuditService': 'get_audit_service',
    'NotificationService': 'get_notification_service',
    'PayrollService': 'get_payroll_service',
    'AssignmentService': 'get_assignment_service',
    'AdditionalChargeService': 'get_additional_charge_service',
    'PhotoService': 'get_photo_service',
    'ReportService': 'get_report_service',
    'CacheService': 'get_cache_service',
    'AnalyticsService': 'get_analytics_service',
    'ImportService': 'get_import_service',
    'PayrollConfigService': 'get_payroll_config_service',
    'EmployeeMatchingService': 'get_employee_matching_service',
    'HybridOCRService': 'get_hybrid_ocr_service',
    'AIGatewayService': 'get_ai_gateway_service',
    'AIUsageService': 'get_ai_usage_service',
    'AIBudgetService': 'get_ai_budget_service',
    'YukyuService': 'get_yukyu_service',
    'OCRCacheService': 'get_ocr_cache_service',
    'FaceDetectionService': 'get_face_detection_service',
    'TimerCardOCRService': 'get_timer_card_ocr_service',
}


def analyze_file(file_path: Path) -> Dict:
    """Analyze a route file for DI migration opportunities."""
    content = file_path.read_text()
    
    results = {
        'file': str(file_path),
        'service_imports': [],
        'manual_instantiations': [],
        'singleton_instances': [],
        'recommendations': []
    }
    
    # Find service imports
    for service_class, di_function in SERVICE_MAPPING.items():
        # Pattern: from app.services.X import XService
        pattern = rf'from app\.services\.\w+ import {service_class}'
        if re.search(pattern, content):
            results['service_imports'].append({
                'class': service_class,
                'di_function': di_function,
                'current_import': re.search(pattern, content).group()
            })
    
    # Find manual instantiations
    for service_class in SERVICE_MAPPING.keys():
        # Pattern: service = XService(...)
        pattern = rf'\w+\s*=\s*{service_class}\([^)]*\)'
        matches = re.finditer(pattern, content)
        for match in matches:
            results['manual_instantiations'].append({
                'class': service_class,
                'line': match.group(),
                'di_function': SERVICE_MAPPING[service_class]
            })
    
    # Find singleton instances (module-level)
    for service_class in SERVICE_MAPPING.keys():
        # Pattern: service_name = XService() at module level
        pattern = rf'^(\w+_service)\s*=\s*{service_class}\(\)'
        matches = re.finditer(pattern, content, re.MULTILINE)
        for match in matches:
            results['singleton_instances'].append({
                'class': service_class,
                'instance_name': match.group(1),
                'di_function': SERVICE_MAPPING[service_class]
            })
    
    # Generate recommendations
    if results['service_imports']:
        results['recommendations'].append(
            f"📦 Add DI import: from app.core.di import {', '.join(s['di_function'] for s in results['service_imports'])}"
        )
    
    if results['manual_instantiations']:
        results['recommendations'].append(
            f"🔧 Replace {len(results['manual_instantiations'])} manual instantiations with DI"
        )
    
    if results['singleton_instances']:
        results['recommendations'].append(
            f"⚠️  Remove {len(results['singleton_instances'])} singleton instances, use DI instead"
        )
    
    return results


def generate_migration_diff(file_path: Path, analysis: Dict) -> str:
    """Generate a diff showing what changes are needed."""
    diff_lines = []
    
    diff_lines.append(f"\n{'='*80}")
    diff_lines.append(f"Migration Plan: {file_path.name}")
    diff_lines.append(f"{'='*80}\n")
    
    if analysis['service_imports']:
        diff_lines.append("📦 Step 1: Update Imports")
        diff_lines.append("-" * 40)
        
        # Show DI imports to add
        di_functions = [s['di_function'] for s in analysis['service_imports']]
        diff_lines.append(f"+ from app.core.di import {', '.join(di_functions)}")
        diff_lines.append("")
    
    if analysis['singleton_instances']:
        diff_lines.append("⚠️  Step 2: Remove Singleton Instances")
        diff_lines.append("-" * 40)
        for instance in analysis['singleton_instances']:
            diff_lines.append(f"- {instance['instance_name']} = {instance['class']}()  # Remove this")
        diff_lines.append("")
    
    if analysis['manual_instantiations']:
        diff_lines.append("🔧 Step 3: Update Route Signatures")
        diff_lines.append("-" * 40)
        diff_lines.append("Replace manual instantiation with dependency injection:")
        diff_lines.append("")
        diff_lines.append("Before:")
        diff_lines.append("  @router.post('/endpoint')")
        diff_lines.append("  async def endpoint(db: Session = Depends(get_db)):")
        diff_lines.append("      service = CandidateService(db=db)  # Manual")
        diff_lines.append("")
        diff_lines.append("After:")
        diff_lines.append("  @router.post('/endpoint')")
        diff_lines.append("  async def endpoint(")
        diff_lines.append("      candidate_service: CandidateService = Depends(get_candidate_service)")
        diff_lines.append("  ):")
        diff_lines.append("      # Use candidate_service directly")
        diff_lines.append("")
    
    if analysis['recommendations']:
        diff_lines.append("📋 Recommendations:")
        diff_lines.append("-" * 40)
        for rec in analysis['recommendations']:
            diff_lines.append(f"  {rec}")
        diff_lines.append("")
    
    return "\n".join(diff_lines)


def main():
    parser = argparse.ArgumentParser(description='DI Migration Helper')
    parser.add_argument('--analyze', type=str, help='Analyze a specific file')
    parser.add_argument('--all', action='store_true', help='Analyze all route files')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be done')
    
    args = parser.parse_args()
    
    if args.analyze:
        file_path = Path(args.analyze)
        if not file_path.exists():
            print(f"❌ File not found: {file_path}")
            sys.exit(1)
        
        print(f"\n🔍 Analyzing {file_path.name}...")
        analysis = analyze_file(file_path)
        
        print(f"\n📊 Analysis Results:")
        print(f"  - Service imports found: {len(analysis['service_imports'])}")
        print(f"  - Manual instantiations: {len(analysis['manual_instantiations'])}")
        print(f"  - Singleton instances: {len(analysis['singleton_instances'])}")
        
        if any([analysis['service_imports'], analysis['manual_instantiations'], analysis['singleton_instances']]):
            print(generate_migration_diff(file_path, analysis))
        else:
            print(f"\n✅ No migration needed - file already uses DI or has no services")
    
    elif args.all:
        backend_path = Path(__file__).parent.parent
        api_path = backend_path / 'app' / 'api'
        
        print(f"\n🔍 Scanning all route files in {api_path}...")
        
        route_files = list(api_path.glob('*.py'))
        route_files = [f for f in route_files if f.name not in ['__init__.py', 'deps.py']]
        
        files_needing_migration = []
        
        for route_file in sorted(route_files):
            analysis = analyze_file(route_file)
            
            needs_migration = any([
                analysis['service_imports'],
                analysis['manual_instantiations'],
                analysis['singleton_instances']
            ])
            
            if needs_migration:
                files_needing_migration.append((route_file, analysis))
        
        print(f"\n📊 Summary:")
        print(f"  Total route files: {len(route_files)}")
        print(f"  Need migration: {len(files_needing_migration)}")
        print(f"  Already migrated: {len(route_files) - len(files_needing_migration)}")
        
        if files_needing_migration:
            print(f"\n📝 Files needing migration:")
            for file_path, analysis in files_needing_migration:
                print(f"\n  {file_path.name}:")
                print(f"    Services: {len(analysis['service_imports'])}")
                print(f"    Manual instantiations: {len(analysis['manual_instantiations'])}")
                print(f"    Singletons: {len(analysis['singleton_instances'])}")
                
                if args.dry_run:
                    print(generate_migration_diff(file_path, analysis))
    
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
