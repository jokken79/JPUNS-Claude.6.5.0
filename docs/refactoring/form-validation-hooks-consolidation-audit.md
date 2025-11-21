# Form Validation Hooks Consolidation Audit Report

**Date**: 2025-11-21
**Status**: ✅ AUDIT COMPLETED
**FASE**: FASE 3 #2
**Priority**: MEDIUM RISK
**Lines Affected**: 570 lines (260 + 310)

---

## Executive Summary

Two form validation hooks with different approaches found:

1. **use-form-validation.ts** (260 lines) - Advanced Zod + custom rules
2. **useFormValidation.ts** (310 lines) - Simple validator with predefined rules

**Key Finding**:
- ⚠️ Different APIs and use cases (not duplicates)
- ⚠️ Neither hook appears to be in active use (zero imports found)
- ✅ Can be consolidated with unified interface supporting both patterns
- ⚠️ Medium Risk: Validation logic is critical, needs testing

---

## Current State Analysis

### File 1: use-form-validation.ts (260 lines) - ADVANCED

**Features**:
- Zod schema validation support
- Custom validation rules
- Debouncing (configurable)
- validateOnChange/validateOnBlur options
- Touch tracking for fields
- Field-level and full form validation
- Error clearing operations
- Returns: errors, touched, isValidating, isValid, validateField, validateAll, handleFieldChange, handleFieldBlur, clearFieldError, clearAllErrors, getFieldError, reset

**Use Case**: Type-safe validation with Zod schemas + custom rules

---

### File 2: useFormValidation.ts (310 lines) - SIMPLE + PREDEFINED

**Features**:
- Three hooks exported: useFormValidation, useFieldValidation, commonRules
- No Zod support (simpler)
- Custom validation rules
- Predefined commonRules: required, email, phone, minLength, maxLength, number, positiveNumber, range, dateNotPast, dateNotFuture, validAge
- Field-level and multi-field validation
- Returns: errors, validate, validateMultiple, validateForm, setError, clearError, clearAllErrors, hasErrors, getError

**Use Case**: Simple validation with predefined rule set

---

## Key Differences

| Feature | use-form-validation | useFormValidation |
|---------|-----------------|-------------------|
| Zod Support | ✅ Yes | ❌ No |
| Debouncing | ✅ Yes | ❌ No |
| Touched Tracking | ✅ Yes | ❌ No |
| Predefined Rules | ❌ No | ✅ Yes |
| Single Field Hook | ❌ No | ✅ useFieldValidation |
| Active Usage | ❌ None found | ❌ None found |

---

## Consolidation Strategy

**Recommended Approach**: Create unified `useFormValidation` hook that supports both patterns

```typescript
// frontend/hooks/use-form-validation.ts (consolidated)

interface UseFormValidationOptions<T extends Record<string, any>> {
  // New: Support both Zod and simple validator mode
  mode?: 'zod' | 'simple'; // default: 'simple'

  // Zod mode options
  schema?: ZodSchema<T>;

  // Simple mode options
  rules?: FieldValidationRules<T>;

  // Common options
  initialValues?: T;
  debounceMs?: number;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

// Single hook that handles both cases
export function useFormValidation<T extends Record<string, any>>(
  options: UseFormValidationOptions<T> = {}
) { /* ... */ }

// Separate hook for single field (from useFormValidation)
export function useFieldValidation(
  initialValue: string = '',
  rules: ValidationRule<string>[] = []
) { /* ... */ }

// Export predefined rules
export const commonRules = { /* ... */ }

// Backward compatibility
export default useFormValidation
```

**Why This Works**:
1. ✅ Unifies both hooks into one flexible tool
2. ✅ Maintains backward compatibility
3. ✅ Supports both Zod and simple validators
4. ✅ Provides predefined rules
5. ✅ Keeps specialized useFieldValidation

---

## Risk Assessment

**Risk Level**: 🟡 **MEDIUM**

**Risks**:
- ⚠️ Validation is critical path (form submission)
- ⚠️ Complex merging required (different patterns)
- ⚠️ Needs comprehensive testing

**Mitigation**:
- ✅ Maintain both patterns (no forced conversion)
- ✅ Extensive unit tests
- ✅ Test with real forms before deployment

---

## Current Usage Status

**IMPORTANT FINDING**: Neither hook appears to have any imports in the codebase!

```bash
grep -r "useFormValidation\|use-form-validation" /frontend --include="*.tsx" --include="*.ts"
# Result: No matches found
```

**Implications**:
- Both hooks may be legacy/unused
- Could be removed entirely (not consolidation, but deletion)
- If found to be unused: delete both, recommend alternative validation pattern

---

## Recommendation

Given that neither hook is currently used, there are 3 options:

1. **CONSOLIDATE**: Merge both into unified hook for future use
2. **DELETE**: Remove both if not needed (274 lines saved)
3. **REFACTOR**: Create modern validation hook using existing @/lib/validations

**Recommendation**: DELETE both hooks if validation is handled elsewhere

If consolidation is preferred, unified `use-form-validation.ts` takes ~2 hours of development + testing.

---

## Timeline (if consolidating)

| Task | Time | Notes |
|------|------|-------|
| Design unified API | 30 min | Combine both interfaces |
| Implement merged hook | 60 min | Support both modes |
| Write tests | 60 min | Critical validation logic |
| Verify no regressions | 30 min | Full test suite |
| **TOTAL** | **~3 hours** | Medium risk |

---

**Audit Status**: ✅ AUDIT COMPLETE - AWAITING DECISION
**Finding**: Neither hook has active usage - recommend deletion over consolidation

