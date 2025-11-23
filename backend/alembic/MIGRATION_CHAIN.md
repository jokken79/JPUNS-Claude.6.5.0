# Alembic Migration Chain - Fixed Structure

## Migration Tree

```
001 (base)
├── add_search_indexes
│   ├── 002 (add_parking_and_plus_fields) [HEAD]
│   ├── add_timer_cards_indexes
│   │   └── 2025_11_12_2015 (add_timer_card_consistency_triggers)
│   │       └── 2025_11_12_2100 (add_admin_audit_log_table)
│   │           └── add_additional_indexes [HEAD]
│   ├── add_ai_usage_log
│   │   └── add_ai_budget [HEAD]
│   └── 642bced75435 (add_property_type_field_to_apartments) [HEAD]
├── add_tax_rates_payroll [HEAD]
└── 5e6575b9bf1b (add_apartment_system_v2)
    └── 68534af764e0 (add_additional_charges_and_rent_deductions) [HEAD]
```

## All Migrations (in order)

| # | Revision ID | Parent | File |
|---|------------|---------|------|
| 1 | 001 | None (base) | 001_create_all_tables.py |
| 2 | add_search_indexes | 001 | 2025_11_11_1200_add_search_indexes.py |
| 3 | 002 | add_search_indexes | 2025_11_12_1804_add_parking_and_plus_fields.py |
| 4 | add_timer_cards_indexes | add_search_indexes | 2025_11_12_1900_add_timer_cards_indexes_constraints.py |
| 5 | 2025_11_12_2015 | add_timer_cards_indexes | 2025_11_12_2015_add_timer_card_consistency_triggers.py |
| 6 | 2025_11_12_2100 | 2025_11_12_2015 | 2025_11_12_2100_add_admin_audit_log_table.py |
| 7 | add_additional_indexes | 2025_11_12_2100 | 2025_11_12_2200_add_additional_search_indexes.py |
| 8 | add_ai_usage_log | add_search_indexes | 2025_11_16_add_ai_usage_log_table.py |
| 9 | add_ai_budget | add_ai_usage_log | 2025_11_16_add_ai_budget_table.py |
| 10 | 642bced75435 | add_search_indexes | 642bced75435_add_property_type_field_to_apartments.py |
| 11 | add_tax_rates_payroll | 001 | 2025_11_12_1900_add_tax_rates_to_payroll_settings.py |
| 12 | 5e6575b9bf1b | 001 | 5e6575b9bf1b_add_apartment_system_v2_assignments_charges_deductions.py |
| 13 | 68534af764e0 | 5e6575b9bf1b | 68534af764e0_add_additional_charges_and_rent_deductions_tables.py |

## What Was Fixed

### Problem 1: Broken reference in `2025_11_12_2015_add_timer_card_consistency_triggers.py`
- **Before**: `down_revision = '2025_11_12_2000'` (referenced DISABLED migration)
- **After**: `down_revision = 'add_timer_cards_indexes'`
- **Reason**: The parent migration `2025_11_12_2000_remove_redundant_employee_id_from_timer_cards.py` was disabled

### Previous Fix: Broken reference in `2025_11_12_1900_add_tax_rates_to_payroll_settings.py`
- **Before**: `down_revision = '43b6cf501eed'` (non-existent)
- **After**: `down_revision = '001'`

## Disabled Migrations

The following migration is disabled and should not be used:
- `2025_11_12_2000_remove_redundant_employee_id_from_timer_cards.py.DISABLED`

## Verification

All migration references have been verified and are valid. Run:

```bash
cd backend
alembic history
```

To see the complete migration tree, or:

```bash
alembic upgrade head
```

To apply all migrations (requires database connection).

## Notes

- The migration structure has **branching** from `001` and `add_search_indexes`
- Multiple HEAD migrations exist (this is valid in Alembic)
- All references now point to existing migrations
- No broken links remain in the chain
