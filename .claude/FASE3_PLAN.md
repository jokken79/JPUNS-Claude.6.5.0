# FASE 3: VALIDACIÓN MEJORADA EN BACKEND
## Plan de Implementación

Basado en el análisis exhaustivo, se implementarán las 4 brechas CRÍTICAS/ALTAS:

### BRECHAS A RESOLVER

#### 1. 🔴 CRÍTICA: No valida relación TANTOSHA-Factory
**Ubicación:** `backend/app/services/yukyu_service.py:create_request()`
**Problema:** TANTOSHA podría crear solicitudes para cualquier factory
**Solución:** Validar que TANTOSHA pertenece a la factory especificada
**Cambios:**
```python
# En create_request, después de línea 444 (validar empleado)
if current_user.role == "TANTOSHA":
    # TANTOSHA debe pertenecer a la factory del empleado
    if not request_data.factory_id:
        raise HTTPException(status_code=400, detail="factory_id requerido")
    # Validar que TANTOSHA está asignado a esa factory
    tantosha_factory = db.query(Employee).filter(
        Employee.user_id == current_user.id,
        Employee.factory_id == request_data.factory_id
    ).first()
    if not tantosha_factory:
        raise HTTPException(status_code=403, detail="No perteneces a esa factory")
```

#### 2. 🟠 ALTA: No valida fechas pasadas
**Ubicación:** `backend/app/services/yukyu_service.py:create_request()`
**Problema:** Crear solicitudes retroactivas
**Solución:** Validar `start_date >= today` y `start_date <= end_date`
**Cambios:**
```python
# En create_request, después de línea 432 (recibir datos)
today = date.today()
if request_data.start_date < today:
    raise HTTPException(status_code=400, detail="start_date no puede ser en el pasado")
if request_data.start_date > request_data.end_date:
    raise HTTPException(status_code=400, detail="start_date debe ser <= end_date")
```

#### 3. 🟠 ALTA: No valida overlap de solicitudes
**Ubicación:** `backend/app/services/yukyu_service.py:create_request()`
**Problema:** Aprobar múltiples solicitudes para mismo período
**Solución:** Verificar que no hay solicitudes PENDING/APPROVED en ese rango
**Cambios:**
```python
# En create_request, después de línar 464 (validar días disponibles)
# Validar que no hay overlap
overlapping = db.query(YukyuRequest).filter(
    YukyuRequest.employee_id == request_data.employee_id,
    YukyuRequest.status.in_(["PENDING", "APPROVED"]),
    YukyuRequest.start_date <= request_data.end_date,
    YukyuRequest.end_date >= request_data.start_date
).first()
if overlapping:
    raise HTTPException(status_code=400, detail="Ya existe solicitud en ese período")
```

#### 4. 🟠 ALTA: Sin transacción atómica en LIFO
**Ubicación:** `backend/app/services/yukyu_service.py:_deduct_yukyus_lifo()`
**Problema:** Inconsistencia DB si falla a mitad
**Solución:** Usar try/except y rollback si algo falla
**Cambios:**
```python
# En _deduct_yukyus_lifo, línea 699
try:
    # Toda la lógica LIFO aquí
    ...
    db.commit()
except Exception as e:
    db.rollback()
    raise HTTPException(status_code=500, detail=f"Error deduciendo días: {str(e)}")
```

### BRECHAS DOCUMENTADAS PERO NO IMPLEMENTADAS EN ESTA FASE

Las siguientes se documentarán para FASE 4/5:

- 🟡 Request_type sin validación enum
- 🟡 Falta auditoría de aprobación
- 🟡 Status conversion sin try/except
- 🟡 Rejection_reason sin validación
- 🟡 Employee_id sin validación rango
- 🟡 Sin rate limiting

### IMPACTO

- ✅ Cierra vulnerabilidad CRÍTICA (TANTOSHA-Factory)
- ✅ Cierra 2 vulnerabilidades ALTAS (Fechas, Overlap)
- ✅ Mejora consistencia BD (Transacción atómica)
- ✅ Mantiene compatibilidad con código existente

**Tiempo estimado:** 1-1.5 horas para tests e implementación
**Riesgo:** BAJO (cambios localizados, no afectan APIs)
