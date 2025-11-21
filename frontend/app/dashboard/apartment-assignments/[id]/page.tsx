'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apartmentsV2Service } from '@/lib/api';
import type { AssignmentResponse, AdditionalChargeResponse, DeductionResponse } from '@/types/apartments-v2';
import {
  ArrowLeftIcon,
  UserIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CurrencyYenIcon,
  PencilIcon,
  StopIcon,
  PlusIcon,
  BanknotesIcon,
  ClockIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

export default function AssignmentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = Number(params.id);

  // Fetch assignment details with related data
  const { data: assignment, isLoading, error } = useQuery({
    queryKey: ['assignment-v2', assignmentId],
    queryFn: () => apartmentsV2Service.getAssignment(assignmentId),
  });

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const isActive = status === 'active';
    const label = isActive ? 'Activa' : status === 'ended' ? 'Finalizada' : 'Cancelada';
    const style = isActive
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : status === 'ended'
      ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${style}`}>
        {label}
      </span>
    );
  };

  // Charge type labels
  const chargeTypeLabels: Record<string, string> = {
    cleaning: 'Limpieza',
    repair: 'Reparación',
    deposit: 'Depósito',
    penalty: 'Penalización',
    other: 'Otro',
  };

  // Charge status labels
  const chargeStatusLabels: Record<string, string> = {
    pending: 'Pendiente',
    approved: 'Aprobado',
    cancelled: 'Cancelado',
    paid: 'Pagado',
  };

  // Deduction status labels
  const deductionStatusLabels: Record<string, string> = {
    pending: 'Pendiente',
    processed: 'Procesado',
    paid: 'Pagado',
    cancelled: 'Cancelado',
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

  // Format currency
  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Cargando asignación...</div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-red-500">
          Error al cargar la asignación. Por favor, intenta de nuevo.
        </div>
      </div>
    );
  }

  const isActive = assignment.status === 'active';
  const additionalCharges = assignment.additional_charges || [];
  const deductions = assignment.deductions || [];

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
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Asignación #{assignment.id}</h1>
              <StatusBadge status={assignment.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {assignment.employee?.full_name_kanji || `Empleado #${assignment.employee_id}`} → {assignment.apartment?.name || `Apartamento #${assignment.apartment_id}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isActive && (
            <>
              <button
                onClick={() => router.push(`/apartment-assignments/${assignmentId}/edit`)}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent transition-colors"
              >
                <PencilIcon className="h-5 w-5" />
                Editar
              </button>
              <button
                onClick={() => router.push(`/apartment-assignments/${assignmentId}/add-charge`)}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                Agregar Cargo
              </button>
              <button
                onClick={() => router.push(`/apartment-assignments/${assignmentId}/end`)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <StopIcon className="h-5 w-5" />
                Finalizar Asignación
              </button>
            </>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Deducción Total</p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(assignment.total_deduction)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {assignment.is_prorated ? 'Prorrateado' : 'Mes completo'}
              </p>
            </div>
            <BanknotesIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Días Ocupados</p>
              <p className="text-2xl font-bold mt-1">
                {assignment.days_occupied} / {assignment.days_in_month}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {((assignment.days_occupied / assignment.days_in_month) * 100).toFixed(0)}% del mes
              </p>
            </div>
            <ClockIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Renta Mensual</p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(assignment.monthly_rent)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Base del apartamento
              </p>
            </div>
            <CurrencyYenIcon className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Main Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee Card */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Información del Empleado</h2>

          {assignment.employee ? (
            <>
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <UserIcon className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{assignment.employee.full_name_kanji}</h3>
                  {assignment.employee.full_name_kana && (
                    <p className="text-sm text-muted-foreground">{assignment.employee.full_name_kana}</p>
                  )}
                  <p className="text-sm text-muted-foreground">ID: {assignment.employee.hakenmoto_id}</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                {assignment.employee.phone && (
                  <div>
                    <p className="text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{assignment.employee.phone}</p>
                  </div>
                )}
                {assignment.employee.email && (
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{assignment.employee.email}</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => router.push(`/employees/${assignment.employee.id}`)}
                className="w-full mt-4 px-4 py-2 border rounded-lg hover:bg-accent transition-colors text-sm"
              >
                Ver Perfil Completo
              </button>
            </>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>Empleado ID: {assignment.employee_id}</p>
              <button
                onClick={() => router.push(`/employees/${assignment.employee_id}`)}
                className="mt-4 px-4 py-2 border rounded-lg hover:bg-accent transition-colors text-sm"
              >
                Ver Perfil
              </button>
            </div>
          )}
        </div>

        {/* Apartment Card */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Información del Apartamento</h2>

          {assignment.apartment ? (
            <>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <BuildingOfficeIcon className="h-6 w-6 text-primary mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Nombre</p>
                    <p className="font-medium">{assignment.apartment.name}</p>
                  </div>
                </div>

                {assignment.apartment.full_address && (
                  <div className="flex items-start gap-3">
                    <BuildingOfficeIcon className="h-6 w-6 text-primary mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Dirección</p>
                      <p className="font-medium text-sm">{assignment.apartment.full_address}</p>
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Renta Mensual</p>
                    <p className="font-medium text-lg">{formatCurrency(assignment.apartment.base_rent)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ocupación Actual</p>
                    <p className="font-medium">
                      {assignment.apartment.active_assignments || 0} personas
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => router.push(`/apartments/${assignment.apartment.id}`)}
                className="w-full mt-4 px-4 py-2 border rounded-lg hover:bg-accent transition-colors text-sm"
              >
                Ver Apartamento
              </button>
            </>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>Apartamento ID: {assignment.apartment_id}</p>
              <button
                onClick={() => router.push(`/apartments/${assignment.apartment_id}`)}
                className="mt-4 px-4 py-2 border rounded-lg hover:bg-accent transition-colors text-sm"
              >
                Ver Apartamento
              </button>
            </div>
          )}
        </div>

        {/* Assignment Details Card */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Detalles de la Asignación</h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CalendarIcon className="h-6 w-6 text-primary mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Inicio</p>
                <p className="font-medium">{formatDate(assignment.start_date)}</p>
              </div>
            </div>

            {assignment.end_date && (
              <div className="flex items-start gap-3">
                <CalendarIcon className="h-6 w-6 text-primary mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Finalización</p>
                  <p className="font-medium">{formatDate(assignment.end_date)}</p>
                </div>
              </div>
            )}

            {!assignment.end_date && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Duración</p>
                <p className="font-medium text-lg">
                  {Math.floor(
                    (new Date().getTime() - new Date(assignment.start_date).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}{' '}
                  días
                </p>
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Cálculo de Renta</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Renta mensual:</span>
                  <span className="font-medium">{formatCurrency(assignment.monthly_rent)}</span>
                </div>
                {assignment.is_prorated && (
                  <>
                    <div className="flex justify-between">
                      <span>Días ocupados:</span>
                      <span className="font-medium">{assignment.days_occupied} / {assignment.days_in_month}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Renta prorrateada:</span>
                      <span className="font-medium">{formatCurrency(assignment.prorated_rent)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between pt-2 border-t font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(assignment.total_deduction)}</span>
                </div>
              </div>
            </div>

            {assignment.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Notas</p>
                <p className="text-sm">{assignment.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Charges */}
      <div className="bg-card border rounded-lg">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">
            Cargos Adicionales ({additionalCharges.length})
          </h2>
          {isActive && (
            <button
              onClick={() => router.push(`/apartment-assignments/${assignmentId}/add-charge`)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Agregar Cargo
            </button>
          )}
        </div>

        {additionalCharges.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No hay cargos adicionales registrados para esta asignación.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Tipo</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Descripción</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Monto</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Fecha</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {additionalCharges.map((charge) => (
                  <tr key={charge.id} className="hover:bg-accent transition-colors">
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded text-xs font-medium">
                        {chargeTypeLabels[charge.charge_type] || charge.charge_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {charge.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {formatCurrency(charge.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(charge.charge_date)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          charge.status === 'approved'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : charge.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : charge.status === 'paid'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                        }`}
                      >
                        {chargeStatusLabels[charge.status] || charge.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/50 border-t">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-sm font-semibold">
                    Total de Cargos Adicionales
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-bold">
                    {formatCurrency(additionalCharges.reduce((sum, charge) => sum + charge.amount, 0))}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Monthly Deductions */}
      <div className="bg-card border rounded-lg">
        <div className="p-4 border-b">
          <h2 className="font-semibold">
            Deducciones Mensuales ({deductions.length})
          </h2>
        </div>

        {deductions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No hay deducciones mensuales generadas para esta asignación.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Periodo</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Renta Base</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Cargos Adicionales</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Total</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Estado</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Prorrateado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {deductions.map((deduction) => (
                  <tr key={deduction.id} className="hover:bg-accent transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">
                      {deduction.year}/{deduction.month < 10 ? `0${deduction.month}` : deduction.month}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {formatCurrency(deduction.base_rent)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {formatCurrency(deduction.additional_charges)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold">
                      {formatCurrency(deduction.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          deduction.status === 'paid'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : deduction.status === 'processed'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : deduction.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                        }`}
                      >
                        {deductionStatusLabels[deduction.status] || deduction.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {deduction.was_prorated ? (
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          {deduction.days_occupied}/{deduction.days_in_month} días
                        </span>
                      ) : (
                        'Mes completo'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/50 border-t">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-sm font-semibold">
                    Total Acumulado
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-bold">
                    {formatCurrency(deductions.reduce((sum, deduction) => sum + deduction.total_amount, 0))}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Historial</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
              <CalendarIcon className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Asignación creada</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(assignment.start_date)}
              </p>
            </div>
          </div>

          {assignment.end_date && (
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                <CalendarIcon className="h-5 w-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Asignación finalizada</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(assignment.end_date)}
                </p>
              </div>
            </div>
          )}

          {!assignment.end_date && (
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
                <ChartBarIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Asignación activa</p>
                <p className="text-sm text-muted-foreground">
                  Actualmente en curso
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
