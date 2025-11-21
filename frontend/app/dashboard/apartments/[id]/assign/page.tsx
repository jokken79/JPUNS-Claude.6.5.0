'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apartmentsV2Service, employeeService } from '@/lib/api';
import type {
  ApartmentWithStats,
  AssignmentCreate,
  ProratedCalculationResponse
} from '@/types/apartments-v2';
import { AssignmentStatus } from '@/types/apartments-v2';
import type { Employee } from '@/types/api';
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  BuildingOfficeIcon,
  UserIcon,
  PhoneIcon,
  BriefcaseIcon,
  CalendarIcon,
  CurrencyYenIcon,
  CalculatorIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function AssignEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const apartmentId = Number(params.id);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [calculation, setCalculation] = useState<ProratedCalculationResponse | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [paysParking, setPaysParking] = useState(false);

  // Fetch apartment details with stats
  const { data: apartment, isLoading: apartmentLoading, error: apartmentError } = useQuery({
    queryKey: ['apartment-v2', apartmentId],
    queryFn: () => apartmentsV2Service.getApartment(apartmentId),
  });

  // Fetch available employees and contract workers (not assigned to any apartment)
  const { data: employeesResponse, isLoading: employeesLoading } = useQuery({
    queryKey: ['workers-available', search],
    queryFn: async () => {
      return await employeeService.getAvailableForApartment({
        page: 1,
        page_size: 1000,
        search: search || undefined,
      });
    },
  });

  // No need to filter - backend already returns only workers without apartments
  const employees = employeesResponse?.items || [];

  // Auto-calculate prorated rent when start date changes
  useEffect(() => {
    if (!apartment || !startDate) return;

    const calculateRent = async () => {
      setIsCalculating(true);
      try {
        // Parse year and month from start date
        const startDateObj = new Date(startDate);
        const year = startDateObj.getFullYear();
        const month = startDateObj.getMonth() + 1; // JavaScript months are 0-indexed

        // Calculate end of month for this period
        const endOfMonth = new Date(year, month, 0); // Day 0 of next month = last day of current month
        const endDateStr = endOfMonth.toISOString().split('T')[0];

        const result = await apartmentsV2Service.calculateProratedRent({
          monthly_rent: apartment.base_rent,
          start_date: startDate,
          end_date: endDateStr,
          year: year,
          month: month,
        });
        setCalculation(result);
      } catch (err: any) {
        console.error('Error calculating prorated rent:', err);
        toast.error('Error al calcular la renta prorrateada');
        setCalculation(null);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateRent();
  }, [apartment, startDate, apartmentId]);

  // Mutation to create assignment
  const assignMutation = useMutation({
    mutationFn: async (data: AssignmentCreate) => {
      return await apartmentsV2Service.createAssignment(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartment-v2', apartmentId] });
      queryClient.invalidateQueries({ queryKey: ['apartments-v2'] });
      queryClient.invalidateQueries({ queryKey: ['employees-available'] });
      toast.success('Empleado asignado exitosamente');
      router.push(`/apartments/${apartmentId}`);
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.detail || 'Error al asignar empleado al apartamento';
      toast.error(errorMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployeeId) {
      toast.error('Por favor, selecciona un empleado');
      return;
    }

    if (!calculation) {
      toast.error('Error al calcular la renta prorrateada. Por favor, verifica la fecha.');
      return;
    }

    // Create assignment with prorated calculation
    const assignmentData: AssignmentCreate = {
      apartment_id: apartmentId,
      employee_id: selectedEmployeeId,
      start_date: startDate,
      end_date: null, // Active assignment
      monthly_rent: calculation.monthly_rent,
      days_in_month: calculation.days_in_month,
      days_occupied: calculation.days_occupied,
      prorated_rent: calculation.prorated_rent,
      is_prorated: calculation.is_prorated,
      total_deduction: calculation.prorated_rent,
      pays_parking: paysParking,
      status: AssignmentStatus.ACTIVE,
      notes: calculation.is_prorated
        ? `Asignación con prorrateo (${calculation.days_occupied} de ${calculation.days_in_month} días)`
        : 'Asignación mes completo',
    };

    assignMutation.mutate(assignmentData);
  };

  if (apartmentLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando detalles del apartamento...</p>
        </div>
      </div>
    );
  }

  if (apartmentError || !apartment) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-500 font-medium mb-4">Apartamento no encontrado</p>
          <button
            onClick={() => router.push('/apartments')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Volver a Apartamentos
          </button>
        </div>
      </div>
    );
  }

  // Check if apartment is available
  if (!apartment.is_available) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <h1 className="text-3xl font-bold">Asignar Empleado</h1>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <p className="text-red-800 dark:text-red-400 font-medium">
              El apartamento {apartment.name} no está disponible para asignaciones.
            </p>
            <p className="text-red-600 dark:text-red-500 text-sm mt-2">
              Ocupación actual: {apartment.current_occupancy}/{apartment.max_occupancy}
            </p>
            <button
              onClick={() => router.push(`/apartments/${apartmentId}`)}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Volver al apartamento
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold">Asignar Empleado</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {apartment.name} - {apartment.full_address || 'Sin dirección'}
          </p>
        </div>
      </div>

      {/* Apartment Info Card */}
      <div className="bg-card border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <BuildingOfficeIcon className="h-6 w-6 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Apartamento</p>
              <p className="font-medium">{apartment.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <UserIcon className="h-6 w-6 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Ocupación</p>
              <p className="font-medium">
                {apartment.current_occupancy}/{apartment.max_occupancy}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CurrencyYenIcon className="h-6 w-6 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Renta Base</p>
              <p className="font-medium">¥{apartment.base_rent.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <UserIcon className="h-6 w-6 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Disponibles</p>
              <p className="font-medium text-green-600 dark:text-green-400">
                {apartment.max_occupancy - apartment.current_occupancy}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee Selection */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border rounded-lg">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Seleccionar Empleado</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Solo se muestran empleados activos sin asignación de apartamento
              </p>
            </div>

            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Employee List */}
            <div className="divide-y max-h-96 overflow-y-auto">
              {employeesLoading && (
                <div className="p-8 text-center text-muted-foreground">
                  Cargando empleados...
                </div>
              )}

              {!employeesLoading && employees.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No se encontraron empleados disponibles.
                  <p className="text-sm mt-2">
                    Todos los empleados activos están asignados a apartamentos o no hay empleados que coincidan con la búsqueda.
                  </p>
                </div>
              )}

              {!employeesLoading &&
                employees.map((employee) => (
                  <div
                    key={employee.id}
                    className={`p-4 cursor-pointer transition-colors hover:bg-accent ${
                      selectedEmployeeId === employee.id
                        ? 'bg-primary/10 border-l-4 border-primary'
                        : ''
                    }`}
                    onClick={() => setSelectedEmployeeId(employee.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`h-12 w-12 rounded-full flex items-center justify-center ${
                          selectedEmployeeId === employee.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-accent'
                        }`}
                      >
                        <UserIcon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{employee.full_name_roman}</p>
                        {employee.full_name_kanji && (
                          <p className="text-sm text-muted-foreground">
                            {employee.full_name_kanji}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-muted-foreground">
                            ID: {employee.employee_id}
                          </span>
                          {employee.phone && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <PhoneIcon className="h-3 w-3" />
                              {employee.phone}
                            </span>
                          )}
                          {employee.factory_id && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <BriefcaseIcon className="h-3 w-3" />
                              Fábrica #{employee.factory_id}
                            </span>
                          )}
                        </div>
                      </div>
                      {selectedEmployeeId === employee.id && (
                        <div className="h-6 w-6 bg-primary rounded-full flex items-center justify-center">
                          <CheckCircleIcon className="h-5 w-5 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Assignment Form */}
        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="bg-card border rounded-lg p-6 space-y-4">
            <h2 className="font-semibold">Detalles de Asignación</h2>

            <div>
              <label className="block text-sm font-medium mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Fecha de Entrada
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Fecha en que el empleado comenzará a residir
              </p>
            </div>

            {/* Prorated Calculation Display */}
            {calculation && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-800 dark:text-blue-400">
                  <CalculatorIcon className="h-4 w-4" />
                  Cálculo de Renta
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Renta mensual:</span>
                    <span className="font-medium">¥{calculation.monthly_rent.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Días en el mes:</span>
                    <span className="font-medium">{calculation.days_in_month} días</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Días ocupados:</span>
                    <span className="font-medium">{calculation.days_occupied} días</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tarifa diaria:</span>
                    <span className="font-medium">¥{Math.round(calculation.daily_rate).toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-blue-800 dark:text-blue-400">Total a descontar:</span>
                      <span className="text-lg font-bold text-blue-800 dark:text-blue-400">
                        ¥{calculation.prorated_rent.toLocaleString()}
                      </span>
                    </div>
                    {calculation.is_prorated && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ⚠️ Renta prorrateada (entrada a medio mes)
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 border-t pt-2">
                    <p className="font-mono">{calculation.calculation_formula}</p>
                  </div>
                </div>
              </div>
            )}

            {isCalculating && (
              <div className="text-center text-sm text-muted-foreground py-2">
                <CalculatorIcon className="h-4 w-4 inline animate-spin mr-2" />
                Calculando renta prorrateada...
              </div>
            )}

            {/* Parking payment checkbox */}
            {apartment && apartment.parking_spaces > 0 && (
              <div className="pt-4 border-t">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={paysParking}
                    onChange={(e) => setPaysParking(e.target.checked)}
                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">
                    ¿Este empleado paga estacionamiento?
                  </span>
                </label>
                <p className="text-xs text-muted-foreground mt-1 ml-7">
                  Marcar si este empleado será responsable del pago de estacionamiento
                </p>
              </div>
            )}

            <div className="pt-4 border-t space-y-2">
              <button
                type="submit"
                disabled={!selectedEmployeeId || !calculation || assignMutation.isPending || isCalculating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {assignMutation.isPending ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Asignando...
                  </>
                ) : (
                  <>
                    <UserPlusIcon className="h-5 w-5" />
                    Asignar Empleado
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="w-full px-4 py-2 border rounded-lg hover:bg-accent transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>

          {/* Selected Employee Info */}
          {selectedEmployeeId && (
            <div className="bg-card border rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-2">Empleado Seleccionado</h3>
              {(() => {
                const selectedEmployee = employees.find(
                  (emp) => emp.id === selectedEmployeeId
                );
                if (!selectedEmployee) return null;
                return (
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Nombre:</span>{' '}
                      <span className="font-medium">
                        {selectedEmployee.full_name_roman}
                      </span>
                    </p>
                    {selectedEmployee.full_name_kanji && (
                      <p>
                        <span className="text-muted-foreground">漢字:</span>{' '}
                        <span className="font-medium">{selectedEmployee.full_name_kanji}</span>
                      </p>
                    )}
                    <p>
                      <span className="text-muted-foreground">ID:</span>{' '}
                      <span className="font-medium">{selectedEmployee.employee_id}</span>
                    </p>
                    {selectedEmployee.phone && (
                      <p>
                        <span className="text-muted-foreground">Teléfono:</span>{' '}
                        <span className="font-medium">{selectedEmployee.phone}</span>
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
