"""
AI Matching Service para Corporate Housing
Algoritmo inteligente de matching empleados-apartamentos
"""
from typing import List, Dict, Tuple
from datetime import datetime, date

class ApartmentMatchingService:
    """
    Servicio de matching inteligente basado en múltiples factores
    """
    
    def calculate_match_score(self, employee: dict, apartment: dict) -> float:
        """
        Calcular score de match (0.0 a 1.0)
        
        Factores:
        - Distancia a fábrica: 30%
        - Compatibilidad ocupación: 25%
        - Capacidad de pago: 20%
        - Flexibilidad fechas: 15%
        - Preferencias: 10%
        """
        score = 0.0
        
        # 1. Distance Score (30%)
        distance_score = self._calculate_distance_score(
            employee.get('factory_location'),
            apartment.get('location')
        )
        score += distance_score * 0.30
        
        # 2. Occupancy Score (25%)
        occupancy_score = self._calculate_occupancy_score(apartment)
        score += occupancy_score * 0.25
        
        # 3. Rent Affordability (20%)
        rent_score = self._calculate_rent_score(employee, apartment)
        score += rent_score * 0.20
        
        # 4. Date Flexibility (15%)
        date_score = self._calculate_date_score(employee, apartment)
        score += date_score * 0.15
        
        # 5. Preferences (10%)
        preference_score = self._calculate_preference_score(employee, apartment)
        score += preference_score * 0.10
        
        return min(1.0, max(0.0, score))
    
    def _calculate_distance_score(self, factory_loc, apt_loc) -> float:
        """Score basado en distancia"""
        if not factory_loc or not apt_loc:
            return 0.5
        # Calcular distancia en km
        distance_km = self._calculate_distance(factory_loc, apt_loc)
        
        if distance_km <= 5:
            return 1.0
        elif distance_km <= 10:
            return 0.8
        elif distance_km <= 20:
            return 0.6
        else:
            return 0.3
    
    def _calculate_occupancy_score(self, apartment: dict) -> float:
        """Score basado en ocupación actual"""
        current = apartment.get('current_occupants', 0)
        capacity = apartment.get('capacity', 1)
        
        if current == 0:
            return 1.0
        elif current < capacity:
            return 1.0 - (current / capacity) * 0.5
        else:
            return 0.0
    
    def _calculate_rent_score(self, employee: dict, apartment: dict) -> float:
        """Score de capacidad de pago"""
        rent = apartment.get('monthly_rent', 0)
        salary = employee.get('monthly_salary', 1)
        
        ratio = rent / salary if salary > 0 else 1.0
        
        if ratio <= 0.20:
            return 1.0
        elif ratio <= 0.30:
            return 0.8
        elif ratio <= 0.40:
            return 0.5
        else:
            return 0.2
    
    def _calculate_date_score(self, employee: dict, apartment: dict) -> float:
        """Score basado en flexibilidad de fechas"""
        # Placeholder - usar preferencias reales
        return 0.7
    
    def _calculate_preference_score(self, employee: dict, apartment: dict) -> float:
        """Score basado en preferencias"""
        # Placeholder - usar preferencias reales
        return 0.7
    
    def _calculate_distance(self, loc1, loc2) -> float:
        """Calcular distancia entre dos puntos"""
        # Placeholder - usar geopy o PostGIS
        return 0.0
    
    def recommend_apartments(self, employee_id: int, limit: int = 5) -> List[Dict]:
        """
        Obtener top recomendaciones para un empleado
        """
        # Placeholder - obtener datos de DB
        employee = {'id': employee_id, 'factory_location': (0, 0), 'monthly_salary': 100000}
        apartments = [
            {'id': 1, 'monthly_rent': 85000, 'capacity': 4, 'current_occupants': 2, 'location': (0, 0)}
        ]
        
        # Score cada apartamento
        scored = []
        for apt in apartments:
            score = self.calculate_match_score(employee, apt)
            scored.append({
                'apartment_id': apt['id'],
                'match_score': round(score * 100, 1),
                'apartment_code': f"APT-{apt['id']}",
                'monthly_rent': apt['monthly_rent'],
                'capacity': apt['capacity'],
                'current_occupants': apt['current_occupants']
            })
        
        # Ordenar por score
        scored.sort(key=lambda x: x['match_score'], reverse=True)
        
        return scored[:limit]

# Ejemplo de uso
if __name__ == "__main__":
    service = ApartmentMatchingService()
    recommendations = service.recommend_apartments(employee_id=1, limit=5)
    
    print("Top 5 Apartment Recommendations:")
    for rec in recommendations:
        print(f"Apartment: {rec['apartment_code']}")
        print(f"Score: {rec['match_score']}%")
        print(f"Rent: ¥{rec['monthly_rent']:,}/month")
        print(f"Occupancy: {rec['current_occupants']}/{rec['capacity']}")
        print()
