'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apartmentsV2Service } from '@/lib/api';
import type { ApartmentWithStats, AssignmentResponse } from '@/types/apartments-v2';
import {
  ArrowLeftIcon,
  PencilIcon,
  UserPlusIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CurrencyYenIcon,
  UserGroupIcon,
  CalendarIcon,
  PhoneIcon,
  UserIcon,
  HomeIcon,
  ChartBarIcon,
  ClockIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

export default function ApartmentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const apartmentId = Number(params.id);

  // Fetch apartment details with stats
  const { data: apartment, isLoading: apartmentLoading, error: apartmentError } = useQuery({
    queryKey: ['apartment-v2', apartmentId],
    queryFn: () => apartmentsV2Service.getApartment(apartmentId),
  });

  // Fetch active assignments
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['apartment-assignments', apartmentId],
    queryFn: () => apartmentsV2Service.getActiveAssignmentsByApartment(apartmentId),
    enabled: !!apartment,
  });

  // Status badge component
  const StatusBadge = ({ apartment }: { apartment: ApartmentWithStats }) => {
    let bgColor, textColor, label;

    if (apartment.current_occupancy === 0) {
      bgColor = 'bg-gray-100 dark:bg-gray-800';
      textColor = 'text-gray-800 dark:text-gray-400';
      label = 'Vacío';
    } else if (apartment.is_available) {
      bgColor = 'bg-green-100 dark:bg-green-900/30';
      textColor = 'text-green-800 dark:text-green-400';
      label = 'Disponible';
    } else if (apartment.current_occupancy < apartment.max_occupancy) {
      bgColor = 'bg-yellow-100 dark:bg-yellow-900/30';
      textColor = 'text-yellow-800 dark:text-yellow-400';
      label = 'Parcial';
    } else {
      bgColor = 'bg-red-100 dark:bg-red-900/30';
      textColor = 'text-red-800 dark:text-red-400';
      label = 'Lleno';
    }

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${bgColor} ${textColor}`}>
        {label}
      </span>
    );
  };

  // Format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (apartmentLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Cargando detalles del apartamento...</div>
      </div>
    );
  }

  if (apartmentError || !apartment) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-red-500">
          Error al cargar el apartamento. Por favor, intenta de nuevo.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <HomeIcon className="h-8 w-8 text-primary" />
              {apartment.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {apartment.full_address || 'Sin dirección completa'}
            </p>
          </div>
          <StatusBadge apartment={apartment} />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/apartments/${apartmentId}/edit`)}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent transition-colors"
          >
            <PencilIcon className="h-5 w-5" />
            Editar
          </button>
          {apartment.is_available && (
            <button
              onClick={() => router.push(`/apartments/${apartmentId}/assign`)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <UserPlusIcon className="h-5 w-5" />
              Asignar Empleado
            </button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ocupación</p>
              <p className="text-2xl font-bold mt-1">
                {apartment.current_occupancy}/{apartment.max_occupancy}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {apartment.occupancy_rate.toFixed(0)}%
              </p>
            </div>
            <UserGroupIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Renta Base</p>
              <p className="text-2xl font-bold mt-1">
                ¥{apartment.base_rent.toLocaleString()}
              </p>
              {apartment.management_fee > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  +¥{apartment.management_fee.toLocaleString()} gestión
                </p>
              )}
            </div>
            <CurrencyYenIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Costo Total</p>
              <p className="text-2xl font-bold mt-1">
                ¥{(apartment.total_monthly_cost || 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                por mes
              </p>
            </div>
            <BanknotesIcon className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Disponibilidad</p>
              <p className="text-2xl font-bold mt-1">
                {apartment.is_available ? 'Sí' : 'No'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Espacios: {apartment.max_occupancy - apartment.current_occupancy}
              </p>
            </div>
            <ChartBarIcon className={`h-8 w-8 ${apartment.is_available ? 'text-green-500' : 'text-red-500'}`} />
          </div>
        </div>
      </div>

      {/* Main Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details Card */}
        <div className="lg:col-span-2 bg-card border rounded-lg p-6 space-y-6">
          <h2 className="text-xl font-semibold">Información del Apartamento</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {apartment.building_name && (
              <div className="flex items-start gap-3">
                <BuildingOfficeIcon className="h-6 w-6 text-primary mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Edificio</p>
                  <p className="font-medium">{apartment.building_name}</p>
                  {apartment.room_number && (
                    <p className="text-sm text-muted-foreground">Habitación: {apartment.room_number}</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <MapPinIcon className="h-6 w-6 text-primary mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Ubicación</p>
                {apartment.prefecture && (
                  <p className="font-medium">{apartment.prefecture}</p>
                )}
                {apartment.city && (
                  <p className="text-sm">{apartment.city}</p>
                )}
                {apartment.address_line1 && (
                  <p className="text-sm text-muted-foreground">{apartment.address_line1}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CurrencyYenIcon className="h-6 w-6 text-primary mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Desglose de Costos</p>
                <div className="space-y-1">
                  <p className="font-medium">Renta: ¥{apartment.base_rent.toLocaleString()}</p>
                  {apartment.management_fee > 0 && (
                    <p className="text-sm">Gestión: ¥{apartment.management_fee.toLocaleString()}</p>
                  )}
                  {apartment.deposit > 0 && (
                    <p className="text-sm">Depósito: ¥{apartment.deposit.toLocaleString()}</p>
                  )}
                  {apartment.key_money > 0 && (
                    <p className="text-sm">Key Money: ¥{apartment.key_money.toLocaleString()}</p>
                  )}
                  {apartment.parking_spaces && apartment.parking_spaces > 0 && (
                    <p className="text-sm">
                      Estacionamientos: {apartment.parking_spaces} espacio{apartment.parking_spaces > 1 ? 's' : ''}
                      {apartment.parking_price_per_unit && apartment.parking_price_per_unit > 0 && (
                        <> a ¥{apartment.parking_price_per_unit.toLocaleString()} c/u</>
                      )}
                    </p>
                  )}
                  {apartment.initial_plus && apartment.initial_plus > 0 && (
                    <p className="text-sm">Plus Adicional: ¥{apartment.initial_plus.toLocaleString()}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <HomeIcon className="h-6 w-6 text-primary mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Características</p>
                <div className="space-y-1">
                  <p className="font-medium">Capacidad: {apartment.max_occupancy} personas</p>
                  {apartment.property_type && (
                    <p className="text-sm">Tipo de Propiedad: {apartment.property_type}</p>
                  )}
                  {apartment.size_sqm && (
                    <p className="text-sm">Tamaño: {apartment.size_sqm} m²</p>
                  )}
                  {apartment.room_type && (
                    <p className="text-sm">Tipo de Habitación: {apartment.room_type}</p>
                  )}
                </div>
              </div>
            </div>

            {(apartment.landlord_name || apartment.real_estate_agency) && (
              <div className="flex items-start gap-3">
                <UserIcon className="h-6 w-6 text-primary mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Información de Contacto</p>
                  {apartment.landlord_name && (
                    <p className="font-medium">{apartment.landlord_name}</p>
                  )}
                  {apartment.real_estate_agency && (
                    <p className="text-sm text-muted-foreground">{apartment.real_estate_agency}</p>
                  )}
                  {apartment.landlord_contact && (
                    <p className="text-sm">{apartment.landlord_contact}</p>
                  )}
                </div>
              </div>
            )}

            {(apartment.contract_start_date || apartment.contract_end_date) && (
              <div className="flex items-start gap-3">
                <CalendarIcon className="h-6 w-6 text-primary mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Contrato</p>
                  {apartment.contract_start_date && (
                    <p className="text-sm">Inicio: {formatDate(apartment.contract_start_date)}</p>
                  )}
                  {apartment.contract_end_date && (
                    <p className="text-sm">Fin: {formatDate(apartment.contract_end_date)}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          {apartment.notes && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Notas</p>
              <p className="text-sm">{apartment.notes}</p>
            </div>
          )}

          {/* Cleaning Fee */}
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">Cargo de Limpieza al Salir</p>
            <p className="text-lg font-medium">
              ¥{(apartment.default_cleaning_fee || 20000).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Se aplica automáticamente cuando un empleado deja el apartamento
            </p>
          </div>
        </div>

        {/* Stats & Info Card */}
        <div className="space-y-4">
          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-semibold mb-4">Estadísticas</h3>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Ocupación</span>
                  <span className="text-sm font-medium">{apartment.occupancy_rate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      apartment.occupancy_rate === 0
                        ? 'bg-gray-400'
                        : apartment.is_available
                        ? 'bg-green-500'
                        : apartment.occupancy_rate < 100
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(apartment.occupancy_rate, 100)}%` }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Espacios Disponibles</p>
                <p className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">
                  {apartment.max_occupancy - apartment.current_occupancy}
                </p>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Costo por Persona</p>
                <p className="text-2xl font-bold mt-1">
                  ¥{Math.round(apartment.base_rent / apartment.max_occupancy).toLocaleString()}
                </p>
              </div>

              {apartment.last_assignment_date && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Última Asignación</p>
                  <p className="text-sm font-medium mt-1">
                    {formatDate(apartment.last_assignment_date)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active Assignments */}
      <div className="bg-card border rounded-lg">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">
            Asignaciones Activas ({assignments.length})
          </h2>
        </div>

        {assignmentsLoading && (
          <div className="p-8 text-center text-muted-foreground">
            Cargando asignaciones...
          </div>
        )}

        {!assignmentsLoading && assignments.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No hay empleados asignados actualmente a este apartamento.
          </div>
        )}

        {!assignmentsLoading && assignments.length > 0 && (
          <div className="divide-y">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="p-4 hover:bg-accent cursor-pointer transition-colors"
                onClick={() => router.push(`/employees/${assignment.employee_id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        Empleado ID: {assignment.employee_id}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          Desde: {formatDate(assignment.start_date)}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          {assignment.is_prorated ? 'Prorrateado' : 'Mes completo'}
                        </span>
                        {assignment.pays_parking && (
                          <span className="text-xs font-medium text-green-600 flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded">
                            🅿️ Paga estacionamiento
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Deducción Mensual</p>
                    <p className="text-lg font-bold text-primary">
                      ¥{assignment.total_deduction.toLocaleString()}
                    </p>
                    {assignment.is_prorated && (
                      <p className="text-xs text-muted-foreground">
                        {assignment.days_occupied} de {assignment.days_in_month} días
                      </p>
                    )}
                  </div>
                </div>

                {assignment.notes && (
                  <div className="mt-2 pl-16">
                    <p className="text-sm text-muted-foreground">{assignment.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
