"""
Verification script to ensure migration enum types match model definitions
"""

import sys
from app.models.models import (
    UserRole, CandidateStatus, InterviewResult, DocumentType,
    RequestType, RequestStatus, YukyuStatus, ShiftType,
    RoomType, ApartmentStatus, AssignmentStatus, ChargeType,
    DeductionStatus, AdminActionType, ResourceType, AIProvider
)

# Define expected enum values in migration
migration_enums = {
    'user_role': ['SUPER_ADMIN', 'ADMIN', 'KEITOSAN', 'TANTOSHA', 'COORDINATOR', 'KANRININSHA', 'EMPLOYEE', 'CONTRACT_WORKER'],
    'candidate_status': ['pending', 'approved', 'rejected', 'hired'],
    'interviewresult': ['passed', 'failed', 'pending'],
    'document_type': ['rirekisho', 'zairyu_card', 'license', 'contract', 'other'],
    'request_type': ['yukyu', 'hankyu', 'ikkikokoku', 'taisha', 'nyuusha'],
    'request_status': ['pending', 'approved', 'rejected', 'completed'],
    'yukyu_status': ['active', 'expired'],
    'shift_type': ['asa', 'hiru', 'yoru', 'other'],
    'room_type': ['1K', '1DK', '1LDK', '2K', '2DK', '2LDK', '3LDK', 'studio', 'other'],
    'apartment_status': ['active', 'inactive', 'maintenance', 'reserved'],
    'assignment_status': ['active', 'ended', 'cancelled', 'transferred'],
    'charge_type': ['cleaning', 'repair', 'deposit', 'penalty', 'key_replacement', 'other'],
    'deduction_status': ['pending', 'processed', 'paid', 'cancelled'],
    'admin_action_type': ['PAGE_VISIBILITY_CHANGE', 'ROLE_PERMISSION_CHANGE', 'BULK_OPERATION', 'CONFIG_CHANGE', 'CACHE_CLEAR', 'USER_MANAGEMENT', 'SYSTEM_SETTINGS'],
    'resource_type': ['PAGE', 'ROLE', 'SYSTEM', 'USER', 'PERMISSION'],
    'ai_provider': ['gemini', 'openai', 'claude_api', 'local_cli']
}

# Map model classes to migration enum names
model_to_migration = {
    UserRole: ('user_role', [e.value for e in UserRole]),
    CandidateStatus: ('candidate_status', [e.value for e in CandidateStatus]),
    InterviewResult: ('interviewresult', [e.value for e in InterviewResult]),
    DocumentType: ('document_type', [e.value for e in DocumentType]),
    RequestType: ('request_type', [e.value for e in RequestType]),
    RequestStatus: ('request_status', [e.value for e in RequestStatus]),
    YukyuStatus: ('yukyu_status', [e.value for e in YukyuStatus]),
    ShiftType: ('shift_type', [e.value for e in ShiftType]),
    RoomType: ('room_type', [e.value for e in RoomType]),
    ApartmentStatus: ('apartment_status', [e.value for e in ApartmentStatus]),
    AssignmentStatus: ('assignment_status', [e.value for e in AssignmentStatus]),
    ChargeType: ('charge_type', [e.value for e in ChargeType]),
    DeductionStatus: ('deduction_status', [e.value for e in DeductionStatus]),
    AdminActionType: ('admin_action_type', [e.value for e in AdminActionType]),
    ResourceType: ('resource_type', [e.value for e in ResourceType]),
    AIProvider: ('ai_provider', [e.value for e in AIProvider])
}

def verify_enums():
    """Verify all enum definitions match between models and migration"""
    all_match = True
    
    for model_enum, (enum_name, model_values) in model_to_migration.items():
        migration_values = migration_enums[enum_name]
        
        if set(model_values) != set(migration_values):
            all_match = False
            print(f"❌ MISMATCH: {model_enum.__name__} ({enum_name})")
            print(f"   Model values: {sorted(model_values)}")
            print(f"   Migration values: {sorted(migration_values)}")
            
            missing_in_migration = set(model_values) - set(migration_values)
            if missing_in_migration:
                print(f"   Missing in migration: {missing_in_migration}")
            
            extra_in_migration = set(migration_values) - set(model_values)
            if extra_in_migration:
                print(f"   Extra in migration: {extra_in_migration}")
            print()
        else:
            print(f"✅ MATCH: {model_enum.__name__} ({enum_name})")
    
    return all_match

if __name__ == "__main__":
    print("Verifying enum definitions between models and migration...\n")
    if verify_enums():
        print("\n✅ All enum definitions match!")
        sys.exit(0)
    else:
        print("\n❌ Some enum definitions do not match!")
        sys.exit(1)
