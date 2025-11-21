# EJEMPLOS PRÁCTICOS DE USO - API APARTAMENTOS V2.0

**Fecha:** 2025-11-10
**Documento complementario a:** APARTAMENTOS_API_V2_DISEÑO_COMPLETO.md

---

## 📚 ÍNDICE

1. [Ejemplos con curl](#1-ejemplos-con-curl)
2. [Ejemplos con Python](#2-ejemplos-con-python)
3. [Ejemplos con JavaScript](#3-ejemplos-con-javascript)
4. [Casos de Uso Reales](#4-casos-de-uso-reales)
5. [Manejo de Errores](#5-manejo-de-errores)
6. [Scripts de Automatización](#6-scripts-de-automatización)

---

## 1. EJEMPLOS CON CURL

### Autenticación

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'

# Respuesta:
# {
#   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "token_type": "bearer"
# }
```

### Apartamentos

```bash
# Crear token (guardar para siguientes requests)
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 1. Crear apartamento
curl -X POST http://localhost:8000/api/apartments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "サンシティ A-301",
    "building_name": "サンシティビル",
    "room_number": "A-301",
    "floor_number": 3,
    "postal_code": "100-0001",
    "prefecture": "東京都",
    "city": "千代田区",
    "address_line1": "千代田1-1-1",
    "room_type": "1K",
    "size_sqm": 25.5,
    "base_rent": 50000,
    "management_fee": 5000,
    "deposit": 100000,
    "key_money": 50000,
    "default_cleaning_fee": 20000
  }'

# 2. Listar apartamentos disponibles
curl -X GET "http://localhost:8000/api/apartments?available_only=true" \
  -H "Authorization: Bearer $TOKEN"

# 3. Búsqueda avanzada
curl -X GET "http://localhost:8000/api/apartments/search/advanced?min_rent=30000&max_rent=70000&prefectures=東京都&room_types=1K,1DK" \
  -H "Authorization: Bearer $TOKEN"

# 4. Obtener detalles de apartamento
curl -X GET http://localhost:8000/api/apartments/1 \
  -H "Authorization: Bearer $TOKEN"

# 5. Actualizar apartamento
curl -X PUT http://localhost:8000/api/apartments/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "base_rent": 55000,
    "management_fee": 6000,
    "notes": "Renta actualizada para 2025"
  }'
```

### Asignaciones

```bash
# 1. Asignar empleado (entrada a mitad de mes)
curl -X POST http://localhost:8000/api/apartments/assignments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "apartment_id": 1,
    "employee_id": 123,
    "start_date": "2025-11-09",
    "end_date": null,
    "monthly_rent": 50000,
    "year": 2025,
    "month": 11,
    "contract_type": "monthly",
    "notes": "Entrada a mitad de mes"
  }'

# 2. Listar asignaciones
curl -X GET "http://localhost:8000/api/apartments/assignments?status_filter=active" \
  -H "Authorization: Bearer $TOKEN"

# 3. Finalizar asignación (salida con cargo de limpieza)
curl -X PUT http://localhost:8000/api/apartments/assignments/1/end \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "end_date": "2025-12-15",
    "include_cleaning_fee": true,
    "cleaning_fee": 20000,
    "additional_charges": [
      {
        "charge_type": "repair",
        "description": "Reparación de pared dañada",
        "amount": 15000
      }
    ],
    "notes": "Salida a mitad de mes con daños"
  }'

# 4. Transferir empleado
curl -X POST http://localhost:8000/api/apartments/assignments/transfer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "employee_id": 789,
    "current_apartment_id": 12,
    "new_apartment_id": 34,
    "transfer_date": "2026-01-20",
    "notes": "Mudanza por mejora en ubicación"
  }'
```

### Cálculos

```bash
# 1. Calcular renta prorrateada
curl -X POST http://localhost:8000/api/apartments/calculate/prorated \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "monthly_rent": 50000,
    "start_date": "2025-11-09",
    "end_date": "2025-11-30",
    "year": 2025,
    "month": 11
  }'

# Respuesta:
# {
#   "monthly_rent": 50000,
#   "year": 2025,
#   "month": 11,
#   "days_in_month": 30,
#   "start_date": "2025-11-09",
#   "end_date": "2025-11-30",
#   "days_occupied": 22,
#   "daily_rate": 1666.67,
#   "prorated_rent": 36667,
#   "is_prorated": true
# }

# 2. Calcular total con cargos
curl -X POST http://localhost:8000/api/apartments/calculate/total \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "base_rent": 29032,
    "is_prorated": true,
    "additional_charges": [
      {"charge_type": "cleaning", "amount": 20000, "description": "Limpieza"},
      {"charge_type": "repair", "amount": 15000, "description": "Reparación"}
    ]
  }'

# Respuesta:
# {
#   "base_rent": 29032,
#   "additional_charges_total": 35000,
#   "total_deduction": 64032,
#   "breakdown": [
#     {"type": "rent", "amount": 29032, "description": "Renta prorrateada"},
#     {"type": "cleaning", "amount": 20000, "description": "Limpieza"},
#     {"type": "repair", "amount": 15000, "description": "Reparación"}
#   ]
# }
```

### Cargos Adicionales

```bash
# 1. Crear cargo
curl -X POST http://localhost:8000/api/apartments/charges \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "assignment_id": 1,
    "employee_id": 123,
    "apartment_id": 45,
    "charge_type": "repair",
    "description": "Reparación de pared dañada",
    "amount": 15000,
    "charge_date": "2025-11-09",
    "status": "pending",
    "notes": "Daño reportado por gerente de propiedad"
  }'

# 2. Aprobar cargo (requiere ADMIN)
curl -X PUT http://localhost:8000/api/apartments/charges/1/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "approved",
    "notes": "Aprobado - daño verificado"
  }'

# 3. Listar cargos por asignación
curl -X GET "http://localhost:8000/api/apartments/charges?assignment_id=1" \
  -H "Authorization: Bearer $TOKEN"
```

### Deducciones

```bash
# 1. Ver deducciones del mes
curl -X GET "http://localhost:8000/api/apartments/deductions/2025/12" \
  -H "Authorization: Bearer $TOKEN"

# 2. Generar deducciones automáticas
curl -X POST "http://localhost:8000/api/apartments/deductions/generate?year=2025&month=12" \
  -H "Authorization: Bearer $TOKEN"

# 3. Marcar deducción como pagada (requiere ADMIN)
curl -X PUT http://localhost:8000/api/apartments/deductions/1/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "paid",
    "paid_date": "2025-12-31",
    "notes": "Pago confirmado - nómina de diciembre"
  }'

# 4. Exportar a Excel
curl -X GET "http://localhost:8000/api/apartments/deductions/export/2025/12" \
  -H "Authorization: Bearer $TOKEN" \
  --output deducciones_2025_12.xlsx
```

### Reportes

```bash
# 1. Reporte de ocupación
curl -X GET "http://localhost:8000/api/apartments/reports/occupancy?prefecture=東京都" \
  -H "Authorization: Bearer $TOKEN"

# 2. Reporte de pagos pendientes
curl -X GET "http://localhost:8000/api/apartments/reports/arrears?year=2025&month=12" \
  -H "Authorization: Bearer $TOKEN"

# 3. Reporte de mantenimiento
curl -X GET http://localhost:8000/api/apartments/reports/maintenance \
  -H "Authorization: Bearer $TOKEN"

# 4. Análisis de costos (requiere ADMIN)
curl -X GET "http://localhost:8000/api/apartments/reports/costs?year=2025&month=12" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 2. EJEMPLOS CON PYTHON

### Cliente Python Completo

```python
import httpx
import asyncio
from datetime import date
from typing import Optional, Dict, Any


class ApartmentsClient:
    def __init__(self, base_url: str, username: str, password: str):
        self.base_url = base_url
        self.username = username
        self.password = password
        self.token: Optional[str] = None
        self.client = httpx.AsyncClient(timeout=30.0)

    async def __aenter__(self):
        await self.login()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()

    async def login(self):
        """Autenticarse y obtener token"""
        response = await self.client.post(
            f"{self.base_url}/api/auth/login",
            json={
                "username": self.username,
                "password": self.password
            }
        )
        response.raise_for_status()
        data = response.json()
        self.token = data["access_token"]
        self.client.headers.update({"Authorization": f"Bearer {self.token}"})

    async def create_apartment(self, apartment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Crear apartamento"""
        response = await self.client.post(
            f"{self.base_url}/api/apartments",
            json=apartment_data
        )
        response.raise_for_status()
        return response.json()

    async def list_apartments(self, available_only: bool = False) -> list:
        """Listar apartamentos"""
        params = {"available_only": available_only}
        response = await self.client.get(
            f"{self.base_url}/api/apartments",
            params=params
        )
        response.raise_for_status()
        return response.json()

    async def assign_employee(
        self,
        employee_id: int,
        apartment_id: int,
        start_date: date,
        monthly_rent: int
    ) -> Dict[str, Any]:
        """Asignar empleado"""
        response = await self.client.post(
            f"{self.base_url}/api/apartments/assignments",
            json={
                "employee_id": employee_id,
                "apartment_id": apartment_id,
                "start_date": start_date.isoformat(),
                "monthly_rent": monthly_rent,
                "year": start_date.year,
                "month": start_date.month
            }
        )
        response.raise_for_status()
        return response.json()

    async def end_assignment(
        self,
        assignment_id: int,
        end_date: date,
        include_cleaning_fee: bool = True
    ) -> Dict[str, Any]:
        """Finalizar asignación"""
        response = await self.client.put(
            f"{self.base_url}/api/apartments/assignments/{assignment_id}/end",
            json={
                "end_date": end_date.isoformat(),
                "include_cleaning_fee": include_cleaning_fee
            }
        )
        response.raise_for_status()
        return response.json()

    async def transfer_employee(
        self,
        employee_id: int,
        current_apartment_id: int,
        new_apartment_id: int,
        transfer_date: date
    ) -> Dict[str, Any]:
        """Transferir empleado"""
        response = await self.client.post(
            f"{self.base_url}/api/apartments/assignments/transfer",
            json={
                "employee_id": employee_id,
                "current_apartment_id": current_apartment_id,
                "new_apartment_id": new_apartment_id,
                "transfer_date": transfer_date.isoformat()
            }
        )
        response.raise_for_status()
        return response.json()

    async def calculate_prorated_rent(
        self,
        monthly_rent: int,
        start_date: date,
        end_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """Calcular renta prorrateada"""
        response = await self.client.post(
            f"{self.base_url}/api/apartments/calculate/prorated",
            json={
                "monthly_rent": monthly_rent,
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat() if end_date else None,
                "year": start_date.year,
                "month": start_date.month
            }
        )
        response.raise_for_status()
        return response.json()

    async def create_charge(
        self,
        assignment_id: int,
        charge_type: str,
        amount: int,
        description: str
    ) -> Dict[str, Any]:
        """Crear cargo adicional"""
        response = await self.client.post(
            f"{self.base_url}/api/apartments/charges",
            json={
                "assignment_id": assignment_id,
                "charge_type": charge_type,
                "amount": amount,
                "description": description,
                "charge_date": date.today().isoformat()
            }
        )
        response.raise_for_status()
        return response.json()

    async def get_monthly_deductions(
        self,
        year: int,
        month: int
    ) -> list:
        """Obtener deducciones del mes"""
        response = await self.client.get(
            f"{self.base_url}/api/apartments/deductions/{year}/{month}"
        )
        response.raise_for_status()
        return response.json()

    async def generate_deductions(
        self,
        year: int,
        month: int
    ) -> list:
        """Generar deducciones automáticas"""
        response = await self.client.post(
            f"{self.base_url}/api/apartments/deductions/generate",
            params={"year": year, "month": month}
        )
        response.raise_for_status()
        return response.json()

    async def get_occupancy_report(self) -> Dict[str, Any]:
        """Obtener reporte de ocupación"""
        response = await self.client.get(
            f"{self.base_url}/api/apartments/reports/occupancy"
        )
        response.raise_for_status()
        return response.json()

    async def get_arrears_report(
        self,
        year: int,
        month: int
    ) -> Dict[str, Any]:
        """Obtener reporte de pagos pendientes"""
        response = await self.client.get(
            f"{self.base_url}/api/apartments/reports/arrears",
            params={"year": year, "month": month}
        )
        response.raise_for_status()
        return response.json()


# Ejemplo de uso
async def main():
    async with ApartmentsClient(
        base_url="http://localhost:8000",
        username="admin",
        password="admin123"
    ) as client:

        # 1. Crear apartamento
        apartment = await client.create_apartment({
            "name": "サンシティ A-301",
            "building_name": "サンシティビル",
            "room_number": "A-301",
            "floor_number": 3,
            "postal_code": "100-0001",
            "prefecture": "東京都",
            "city": "千代田区",
            "address_line1": "千代田1-1-1",
            "room_type": "1K",
            "size_sqm": 25.5,
            "base_rent": 50000,
            "management_fee": 5000,
            "default_cleaning_fee": 20000
        })
        print(f"Apartamento creado: {apartment['id']}")

        # 2. Listar apartamentos disponibles
        apartments = await client.list_apartments(available_only=True)
        print(f"Apartamentos disponibles: {len(apartments)}")

        # 3. Calcular renta prorrateada
        calculation = await client.calculate_prorated_rent(
            monthly_rent=50000,
            start_date=date(2025, 11, 9)
        )
        print(f"Renta prorrateada: ¥{calculation['prorated_rent']}")

        # 4. Asignar empleado
        assignment = await client.assign_employee(
            employee_id=123,
            apartment_id=apartment['id'],
            start_date=date(2025, 11, 9),
            monthly_rent=50000
        )
        print(f"Asignación creada: {assignment['id']}")

        # 5. Crear cargo de reparación
        charge = await client.create_charge(
            assignment_id=assignment['id'],
            charge_type="repair",
            amount=15000,
            description="Reparación de pared dañada"
        )
        print(f"Cargo creado: {charge['id']}")

        # 6. Generar deducciones del mes
        deductions = await client.generate_deductions(2025, 11)
        print(f"Deducciones generadas: {len(deductions)}")

        # 7. Ver reporte de ocupación
        occupancy = await client.get_occupancy_report()
        print(f"Tasa de ocupación: {occupancy['occupancy_rate']}%")

        # 8. Ver reporte de pagos pendientes
        arrears = await client.get_arrears_report(2025, 11)
        print(f"Total pendiente: ¥{arrears['total_pending']}")


if __name__ == "__main__":
    asyncio.run(main())
```

---

## 3. EJEMPLOS CON JAVASCRIPT

### Cliente JavaScript con Fetch

```javascript
class ApartmentsAPI {
  constructor(baseUrl, username, password) {
    this.baseUrl = baseUrl;
    this.username = username;
    this.password = password;
    this.token = null;
  }

  async login() {
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: this.username,
        password: this.password
      })
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }

    const data = await response.json();
    this.token = data.access_token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Request failed: ${response.status} - ${error}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return await response.arrayBuffer();
  }

  // Apartamentos
  async createApartment(apartmentData) {
    return await this.request('/api/apartments', {
      method: 'POST',
      body: JSON.stringify(apartmentData)
    });
  }

  async listApartments(filters = {}) {
    const query = new URLSearchParams(filters);
    return await this.request(`/api/apartments?${query}`);
  }

  async getApartment(id) {
    return await this.request(`/api/apartments/${id}`);
  }

  // Asignaciones
  async assignEmployee(assignmentData) {
    return await this.request('/api/apartments/assignments', {
      method: 'POST',
      body: JSON.stringify(assignmentData)
    });
  }

  async endAssignment(assignmentId, endData) {
    return await this.request(`/api/apartments/assignments/${assignmentId}/end`, {
      method: 'PUT',
      body: JSON.stringify(endData)
    });
  }

  async transferEmployee(transferData) {
    return await this.request('/api/apartments/assignments/transfer', {
      method: 'POST',
      body: JSON.stringify(transferData)
    });
  }

  // Cálculos
  async calculateProratedRent(calculationData) {
    return await this.request('/api/apartments/calculate/prorated', {
      method: 'POST',
      body: JSON.stringify(calculationData)
    });
  }

  async calculateTotal(calculationData) {
    return await this.request('/api/apartments/calculate/total', {
      method: 'POST',
      body: JSON.stringify(calculationData)
    });
  }

  // Cargos
  async createCharge(chargeData) {
    return await this.request('/api/apartments/charges', {
      method: 'POST',
      body: JSON.stringify(chargeData)
    });
  }

  async approveCharge(chargeId, updateData) {
    return await this.request(`/api/apartments/charges/${chargeId}/approve`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }

  // Deducciones
  async getMonthlyDeductions(year, month, filters = {}) {
    const query = new URLSearchParams(filters);
    return await this.request(`/api/apartments/deductions/${year}/${month}?${query}`);
  }

  async generateDeductions(year, month) {
    return await this.request(`/api/apartments/deductions/generate?year=${year}&month=${month}`, {
      method: 'POST'
    });
  }

  async exportDeductions(year, month, filters = {}) {
    const query = new URLSearchParams(filters);
    return await this.request(`/api/apartments/deductions/export/${year}/${month}?${query}`);
  }

  // Reportes
  async getOccupancyReport(filters = {}) {
    const query = new URLSearchParams(filters);
    return await this.request(`/api/apartments/reports/occupancy?${query}`);
  }

  async getArrearsReport(year, month) {
    return await this.request(`/api/apartments/reports/arrears?year=${year}&month=${month}`);
  }
}

// Ejemplo de uso
async function ejemplo() {
  const api = new ApartmentsAPI('http://localhost:8000', 'admin', 'admin123');

  try {
    // 1. Login
    await api.login();
    console.log('Login exitoso');

    // 2. Crear apartamento
    const apartment = await api.createApartment({
      name: 'サンシティ A-301',
      building_name: 'サンシティビル',
      room_number: 'A-301',
      floor_number: 3,
      postal_code: '100-0001',
      prefecture: '東京都',
      city: '千代田区',
      address_line1: '千代田1-1-1',
      room_type: '1K',
      size_sqm: 25.5,
      base_rent: 50000,
      management_fee: 5000,
      default_cleaning_fee: 20000
    });
    console.log('Apartamento creado:', apartment);

    // 3. Calcular renta prorrateada
    const calculation = await api.calculateProratedRent({
      monthly_rent: 50000,
      start_date: '2025-11-09',
      year: 2025,
      month: 11
    });
    console.log('Renta prorrateada:', calculation.prorated_rent);

    // 4. Asignar empleado
    const assignment = await api.assignEmployee({
      employee_id: 123,
      apartment_id: apartment.id,
      start_date: '2025-11-09',
      monthly_rent: 50000,
      year: 2025,
      month: 11
    });
    console.log('Asignación creada:', assignment);

    // 5. Crear cargo
    const charge = await api.createCharge({
      assignment_id: assignment.id,
      employee_id: 123,
      apartment_id: apartment.id,
      charge_type: 'repair',
      description: 'Reparación de pared',
      amount: 15000,
      charge_date: '2025-11-09'
    });
    console.log('Cargo creado:', charge);

    // 6. Reporte de ocupación
    const occupancy = await api.getOccupancyReport();
    console.log('Reporte de ocupación:', occupancy);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Ejecutar ejemplo
ejemplo();
```

---

## 4. CASOS DE USO REALES

### Caso 1: Empleado Entra a Mitad de Mes

```bash
# Datos:
# - Empleado: Juan Pérez (ID: 123)
# - Apartamento: サンシティ A-301 (Renta: ¥50,000)
# - Fecha entrada: 9 de noviembre de 2025
# - Días en noviembre: 30

# 1. Calcular renta prorrateada
curl -X POST http://localhost:8000/api/apartments/calculate/prorated \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "monthly_rent": 50000,
    "start_date": "2025-11-09",
    "year": 2025,
    "month": 11
  }'

# Respuesta:
# {
#   "days_in_month": 30,
#   "days_occupied": 22,
#   "prorated_rent": 36667
# }

# 2. Asignar empleado
curl -X POST http://localhost:8000/api/apartments/assignments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "employee_id": 123,
    "apartment_id": 1,
    "start_date": "2025-11-09",
    "monthly_rent": 50000,
    "year": 2025,
    "month": 11,
    "days_in_month": 30,
    "days_occupied": 22,
    "prorated_rent": 36667,
    "is_prorated": true,
    "total_deduction": 36667
  }'

# 3. Al final del mes, generar deducciones
curl -X POST "http://localhost:8000/api/apartments/deductions/generate?year=2025&month=11" \
  -H "Authorization: Bearer $TOKEN"

# Resultado:
# - Deducción generada: ¥36,667
# - Empleado paga: ¥36,667
# - Empresa paga al propietario: ¥50,000
```

### Caso 2: Empleado Sale con Daños

```bash
# Datos:
# - Empleado: Ana López (ID: 456)
# - Apartamento: レジェンド 203 (Renta: ¥60,000)
# - Fecha salida: 15 de diciembre de 2025
# - Días en diciembre: 31
# - Daños: Reparación de pared ¥15,000

# 1. Finalizar asignación
curl -X PUT http://localhost:8000/api/apartments/assignments/2/end \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "end_date": "2025-12-15",
    "include_cleaning_fee": true,
    "cleaning_fee": 20000,
    "additional_charges": [
      {
        "charge_type": "repair",
        "description": "Reparación de pared dañada",
        "amount": 15000
      }
    ],
    "notes": "Salida por finalización de contrato"
  }'

# Cálculos automáticos:
# - Días ocupados: 15
# - Renta prorrateada: (¥60,000 ÷ 31) × 15 = ¥29,032
# - Cargo limpieza: ¥20,000
# - Cargo reparación: ¥15,000
# - Total a descontar: ¥64,032

# 2. Generar deducción final
curl -X POST "http://localhost:8000/api/apartments/deductions/generate?year=2025&month=12" \
  -H "Authorization: Bearer $TOKEN"

# Resultado:
# - Deducción final: ¥64,032
# - Descontado de nómina
```

### Caso 3: Transferencia entre Apartamentos

```bash
# Datos:
# - Empleado: Carlos Ruiz (ID: 789)
# - Apartamento A: グリーンハイツ 101 (¥45,000)
# - Apartamento B: サンライズ 305 (¥55,000)
# - Fecha mudanza: 20 de enero de 2026 (31 días)

# 1. Transferir empleado
curl -X POST http://localhost:8000/api/apartments/assignments/transfer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "employee_id": 789,
    "current_apartment_id": 12,
    "new_apartment_id": 34,
    "transfer_date": "2026-01-20"
  }'

# Cálculos automáticos:
# APARTAMENTO A (salida):
# - Días ocupados: 20
# - Renta prorrateada: (¥45,000 ÷ 31) × 20 = ¥29,032
# - Cargo limpieza: ¥20,000
# - Subtotal A: ¥49,032

# APARTAMENTO B (entrada):
# - Días ocupados: 11
# - Renta prorrateada: (¥55,000 ÷ 31) × 11 = ¥19,516
# - Sin cargo limpieza
# - Subtotal B: ¥19,516

# TOTAL ENERO: ¥49,032 + ¥19,516 = ¥68,548

# 2. Ver detalles de la transferencia
curl -X GET http://localhost:8000/api/apartments/assignments/3 \
  -H "Authorization: Bearer $TOKEN"

# 3. Ver nueva asignación activa
curl -X GET http://localhost:8000/api/apartments/assignments/active \
  -H "Authorization: Bearer $TOKEN"
```

### Caso 4: Reporte Mensual para Contabilidad

```bash
# Generar reporte completo del mes de diciembre 2025

# 1. Deducciones del mes
curl -X GET "http://localhost:8000/api/apartments/deductions/2025/12" \
  -H "Authorization: Bearer $TOKEN" \
  -o deducciones_dic_2025.json

# 2. Exportar a Excel
curl -X GET "http://localhost:8000/api/apartments/deductions/export/2025/12" \
  -H "Authorization: Bearer $TOKEN" \
  -o deducciones_dic_2025.xlsx

# 3. Reporte de pagos pendientes
curl -X GET "http://localhost:8000/api/apartments/reports/arrears?year=2025&month=12" \
  -H "Authorization: Bearer $TOKEN" \
  -o pagos_pendientes_dic_2025.json

# 4. Reporte de ocupación
curl -X GET "http://localhost:8000/api/apartments/reports/occupancy" \
  -H "Authorization: Bearer $TOKEN" \
  -o ocupacion_dic_2025.json

# 5. Análisis de costos (ADMIN)
curl -X GET "http://localhost:8000/api/apartments/reports/costs?year=2025&month=12" \
  -H "Authorization: Bearer $TOKEN" \
  -o analisis_costos_dic_2025.json

# 6. Ver apartments activos
curl -X GET "http://localhost:8000/api/apartments?available_only=false" \
  -H "Authorization: Bearer $TOKEN" \
  -o apartamentos_activos.json
```

---

## 5. MANEJO DE ERRORES

### Códigos de Estado HTTP

| Código | Significado | Uso en APIs |
|--------|-------------|-------------|
| 200 | OK | Operaciones exitosas (GET, PUT) |
| 201 | Created | Recurso creado exitosamente (POST) |
| 204 | No Content | Operación exitosa sin contenido (DELETE) |
| 400 | Bad Request | Error de validación |
| 401 | Unauthorized | Token no válido o expirado |
| 403 | Forbidden | Sin permisos suficientes |
| 404 | Not Found | Recurso no encontrado |
| 409 | Conflict | Recurso ya existe o conflicto de estado |
| 422 | Unprocessable Entity | Entidad no procesable |
| 429 | Too Many Requests | Rate limit excedido |
| 500 | Internal Server Error | Error del servidor |

### Ejemplos de Respuestas de Error

```json
// 404 - Not Found
{
  "detail": "Apartamento no encontrado"
}

// 400 - Bad Request (validación)
{
  "detail": [
    {
      "type": "value_error",
      "loc": ["body", "monthly_rent"],
      "msg": "ensure this value is greater than or equal to 0",
      "input": -1000
    }
  ]
}

// 403 - Forbidden
{
  "detail": "No tiene permisos para ver análisis financiero"
}

// 409 - Conflict
{
  "detail": "Ya existe un apartamento con el nombre 'サンシティ A-301'"
}
```

### Ejemplo de Manejo de Errores en Python

```python
import httpx
import asyncio

async def safe_create_apartment(client, apartment_data):
    try:
        response = await client.create_apartment(apartment_data)
        print(f"✅ Apartamento creado exitosamente: {response['id']}")
        return response
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 409:
            print("⚠️  El apartamento ya existe")
        elif e.response.status_code == 400:
            print(f"❌ Error de validación: {e.response.json()}")
        else:
            print(f"❌ Error {e.response.status_code}: {e.response.text}")
        return None
    except Exception as e:
        print(f"❌ Error inesperado: {str(e)}")
        return None

# Uso
async def main():
    async with ApartmentsClient(...) as client:
        apartment = await safe_create_apartment(client, {
            "name": "Test Apartment",
            "base_rent": 50000
        })
        if apartment:
            print("Continuando con siguiente paso...")
```

### Ejemplo de Manejo de Errores en JavaScript

```javascript
async function safeCreateApartment(api, apartmentData) {
  try {
    const response = await api.createApartment(apartmentData);
    console.log(`✅ Apartamento creado: ${response.id}`);
    return response;
  } catch (error) {
    if (error.message.includes('409')) {
      console.log('⚠️  El apartamento ya existe');
    } else if (error.message.includes('400')) {
      console.log('❌ Error de validación');
    } else if (error.message.includes('401')) {
      console.log('❌ Token expirado, re-autenticando...');
      await api.login();
      return await api.createApartment(apartmentData);
    } else {
      console.log(`❌ Error: ${error.message}`);
    }
    return null;
  }
}
```

---

## 6. SCRIPTS DE AUTOMATIZACIÓN

### Script de Sincronización Mensual

```bash
#!/bin/bash
# sync_monthly_deductions.sh
# Genera deducciones automáticamente cada mes

YEAR=$1
MONTH=$2

if [ -z "$YEAR" ] || [ -z "$MONTH" ]; then
  echo "Uso: $0 <YEAR> <MONTH>"
  echo "Ejemplo: $0 2025 12"
  exit 1
fi

echo "🔄 Generando deducciones para ${YEAR}-${MONTH}..."

# Login y obtener token
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

# Generar deducciones
curl -s -X POST "http://localhost:8000/api/apartments/deductions/generate?year=${YEAR}&month=${MONTH}" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# Exportar a Excel
curl -s -X GET "http://localhost:8000/api/apartments/deductions/export/${YEAR}/${MONTH}" \
  -H "Authorization: Bearer $TOKEN" \
  -o "deducciones_${YEAR}_${MONTH}.xlsx"

# Generar reporte
curl -s -X GET "http://localhost:8000/api/apartments/reports/arrears?year=${YEAR}&month=${MONTH}" \
  -H "Authorization: Bearer $TOKEN" | \
  python3 -c "import sys, json; data = json.load(sys.stdin); print(f'Total a cobrar: ¥{data[\"total_to_collect\"]}'); print(f'Total pendiente: ¥{data[\"total_pending\"]}')"

echo "✅ Proceso completado. Archivos generados:"
echo "  - deducciones_${YEAR}_${MONTH}.xlsx"
echo "  - Reporte mostrado arriba"
```

### Script de Verificación de Datos

```python
#!/usr/bin/env python3
"""
verify_apartment_data.py
Verificar integridad de datos de apartamentos
"""

import asyncio
import httpx
from datetime import date


async def verify_data():
    async with httpx.AsyncClient() as client:
        # Login
        response = await client.post(
            "http://localhost:8000/api/auth/login",
            json={"username": "admin", "password": "admin123"}
        )
        token = response.json()["access_token"]
        client.headers.update({"Authorization": f"Bearer {token}"})

        print("🔍 Verificando datos del sistema...\n")

        # 1. Verificar apartamentos
        response = await client.get("http://localhost:8000/api/apartments")
        apartments = response.json()
        print(f"📊 Total apartamentos: {len(apartments)}")
        print(f"   - Activos: {sum(1 for a in apartments if a['status'] == 'active')}")

        # 2. Verificar asignaciones activas
        response = await client.get("http://localhost:8000/api/apartments/assignments/active")
        assignments = response.json()
        print(f"\n👥 Asignaciones activas: {len(assignments)}")

        # 3. Verificar deducciones pendientes
        current_month = date.today().strftime("%Y-%m")
        year, month = map(int, current_month.split("-"))
        response = await client.get(
            f"http://localhost:8000/api/apartments/deductions/{year}/{month}?status=pending"
        )
        pending = response.json()
        print(f"\n💰 Deducciones pendientes ({current_month}): {len(pending)}")
        total_pending = sum(d["total_deduction"] for d in pending)
        print(f"   - Total: ¥{total_pending:,}")

        # 4. Verificar cargos pendientes
        response = await client.get(
            "http://localhost:8000/api/apartments/charges?status=pending"
        )
        charges = response.json()
        print(f"\n🔧 Cargos adicionales pendientes: {len(charges)}")

        # 5. Verificar reporte de ocupación
        response = await client.get("http://localhost:8000/api/apartments/reports/occupancy")
        occupancy = response.json()
        print(f"\n📈 Reporte de ocupación:")
        print(f"   - Tasa de ocupación: {occupancy['occupancy_rate']}%")
        print(f"   - Apartamentos ocupados: {occupancy['occupied_apartments']}/{occupancy['total_apartments']}")

        print("\n✅ Verificación completada")


if __name__ == "__main__":
    asyncio.run(verify_data())
```

### Script de Limpieza de Datos

```bash
#!/bin/bash
# cleanup_old_data.sh
# Limpiar datos antiguos (backup + delete)

DAYS_TO_KEEP=365  # Mantener datos de 1 año

echo "🧹 Limpiando datos antiguos (más de ${DAYS_TO_KEEP} días)..."

# 1. Backup antes de limpiar
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
echo "💾 Creando backup: ${BACKUP_FILE}"
docker exec uns-claudejp-db pg_dump -U uns_admin uns_claudejp > "${BACKUP_FILE}"

# 2. Obtener token
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

# 3. Listar asignaciones canceladas antiguas
echo "\n📋 Asignaciones canceladas antiguas:"
curl -s -X GET "http://localhost:8000/api/apartments/assignments?status_filter=cancelled" \
  -H "Authorization: Bearer $TOKEN" | \
  python3 -c "import sys, json; data = json.load(sys.stdin); [print(f'  - ID {a[\"id\"]}: {a[\"employee_name_kanji\"]}') for a in data[:5]]"

# 4. Listar cargos cancelados
echo "\n❌ Cargos cancelados:"
curl -s -X GET "http://localhost:8000/api/apartments/charges?status=cancelled" \
  -H "Authorization: Bearer $TOKEN" | \
  python3 -c "import sys, json; data = json.load(sys.stdin); print(f'  Total: {len(data)} cargos cancelados')"

# 5. Mostrar recomendaciones
echo "\n💡 Recomendaciones:"
echo "  - Los datos cancelados se pueden archivar"
echo "  - Verificar backup antes de eliminar"
echo "  - Mantener logs de auditoría"

echo "\n✅ Proceso completado"
```

---

## 📞 CONTACTO Y SOPORTE

Para dudas sobre la implementación:
- 📖 Documento principal: `APARTAMENTOS_API_V2_DISEÑO_COMPLETO.md`
- 📖 Especificación: `APARTAMENTOS_SISTEMA_COMPLETO_V2.md`
- 🔍 Verificar: Swagger UI en `http://localhost:8000/api/docs`
- 📊 Logs: `docker compose logs backend`

---

**Ejemplos creados el 2025-11-10** ✅
