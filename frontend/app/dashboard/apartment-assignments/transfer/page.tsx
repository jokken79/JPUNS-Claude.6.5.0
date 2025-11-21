'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apartmentsV2Service } from '@/lib/api';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BuildingOfficeIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CurrencyYenIcon,
} from '@heroicons/react/24/outline';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface TransferForm {
  employee_id: number | null;
  current_assignment_id: number | null;
  new_apartment_id: number | null;
  transfer_date: string;
  apply_cleaning_fee: boolean;
  cleaning_fee_amount: number;
  notes: string;
}

export default function TransferAssignmentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [form, setForm] = useState<TransferForm>({
    employee_id: null,
    current_assignment_id: null,
    new_apartment_id: null,
    transfer_date: new Date().toISOString().split('T')[0],
    apply_cleaning_fee: true,
    cleaning_fee_amount: 20000,
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [transferCalculation, setTransferCalculation] = useState<any>(null);

  // Fetch active assignments (employees with active assignments)
  const { data: activeAssignments, isLoading: loadingAssignments } = useQuery({
    queryKey: ['active-assignments-for-transfer'],
    queryFn: async () => {
      const response = await apartmentsV2Service.listAssignments({ status: 'active' });
      return response.items || [];
    },
  });

  // Fetch available apartments
  const { data: availableApartmentsData, isLoading: loadingApartments } = useQuery({
    queryKey: ['available-apartments-for-transfer'],
    queryFn: async () => {
      const response = await apartmentsV2Service.listApartments({ available_only: true });
      return response;
    },
  });

  const availableApartments = availableApartmentsData?.items || [];

  // Get current assignment details when employee is selected
  const currentAssignment = activeAssignments?.find(
    (assignment: any) => assignment.id === form.current_assignment_id
  );

  // Calculate transfer costs when inputs change
  useEffect(() => {
    const calculateTransferCost = async () => {
      if (
        form.current_assignment_id &&
        form.new_apartment_id &&
        form.transfer_date &&
        currentAssignment
      ) {
        try {
          const calculation = await apartmentsV2Service.calculateTransferCost({
            employee_id: currentAssignment.employee_id,
            current_apartment_id: currentAssignment.apartment_id,
            new_apartment_id: form.new_apartment_id,
            transfer_date: form.transfer_date,
            notes: form.notes || undefined,
          });
          setTransferCalculation(calculation);
        } catch (error) {
          console.error('Error calculating transfer cost:', error);
          setTransferCalculation(null);
        }
      } else {
        setTransferCalculation(null);
      }
    };

    calculateTransferCost();
  }, [form.current_assignment_id, form.new_apartment_id, form.transfer_date, currentAssignment]);

  // Transfer mutation
  const transferMutation = useMutation({
    mutationFn: async (data: TransferForm) => {
      if (!currentAssignment) throw new Error('No current assignment');

      return await apartmentsV2Service.transferEmployee({
        employee_id: currentAssignment.employee_id,
        current_apartment_id: currentAssignment.apartment_id,
        new_apartment_id: data.new_apartment_id!,
        transfer_date: data.transfer_date,
        notes: data.notes || undefined,
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['apartment-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['active-assignments-for-transfer'] });
      queryClient.invalidateQueries({ queryKey: ['available-apartments-for-transfer'] });

      // Redirect to the new assignment detail page
      if (response.new_assignment?.id) {
        router.push(`/apartment-assignments/${response.new_assignment.id}`);
      } else {
        router.push('/apartment-assignments');
      }
    },
    onError: (error: any) => {
      setErrors({
        general: error.response?.data?.detail || 'Error al transferir empleado'
      });
    },
  });

  const handleChange = (field: keyof TransferForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleAssignmentChange = (assignmentId: number) => {
    const assignment = activeAssignments?.find((a: any) => a.id === assignmentId);
    if (assignment) {
      setForm((prev) => ({
        ...prev,
        current_assignment_id: assignmentId,
        employee_id: assignment.employee_id,
        // Reset new apartment if it's the same as current
        new_apartment_id: prev.new_apartment_id === assignment.apartment_id ? null : prev.new_apartment_id,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.current_assignment_id) {
      newErrors.current_assignment_id = 'Debes seleccionar un empleado';
    }
    if (!form.new_apartment_id) {
      newErrors.new_apartment_id = 'Debes seleccionar un apartamento destino';
    }
    if (!form.transfer_date) {
      newErrors.transfer_date = 'La fecha de transferencia es requerida';
    }
    if (currentAssignment && form.new_apartment_id === currentAssignment.apartment_id) {
      newErrors.new_apartment_id = 'El apartamento destino debe ser diferente al actual';
    }
    if (currentAssignment?.start_date && form.transfer_date < currentAssignment.start_date) {
      newErrors.transfer_date = 'La fecha de transferencia no puede ser anterior a la fecha de inicio de la asignación actual';
    }
    if (form.transfer_date > new Date().toISOString().split('T')[0]) {
      newErrors.transfer_date = 'La fecha de transferencia no puede ser futura';
    }
    if (form.apply_cleaning_fee && form.cleaning_fee_amount < 0) {
      newErrors.cleaning_fee_amount = 'El monto de limpieza debe ser mayor o igual a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmTransfer = () => {
    setShowConfirmDialog(false);
    transferMutation.mutate(form);
  };

  const selectedNewApartment = availableApartments.find(
    (apt: any) => apt.id === form.new_apartment_id
  );

  // Filter out current apartment from available apartments
  const filteredApartments = availableApartments.filter(
    (apt: any) => apt.id !== currentAssignment?.apartment_id
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const daysOccupied = currentAssignment?.start_date
    ? Math.ceil(
        (new Date(form.transfer_date).getTime() - new Date(currentAssignment.start_date).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold">Transferir Empleado</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Transferir un empleado de un apartamento a otro
          </p>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <ExclamationTriangleIcon className="h-4 w-4" />
        <AlertDescription>
          Esta operación finalizará la asignación actual y creará una nueva asignación de forma
          atómica. Esta acción no se puede deshacer.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Error */}
        {errors.general && (
          <Alert variant="destructive">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertDescription>{errors.general}</AlertDescription>
          </Alert>
        )}

        {/* Employee Selection Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Seleccionar Empleado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Empleado con Asignación Activa *
              </label>
              <select
                value={form.current_assignment_id || ''}
                onChange={(e) => handleAssignmentChange(Number(e.target.value))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.current_assignment_id ? 'border-red-500' : ''
                }`}
                disabled={loadingAssignments}
              >
                <option value="">Seleccionar empleado</option>
                {activeAssignments?.map((assignment: any) => (
                  <option key={assignment.id} value={assignment.id}>
                    {assignment.employee_name_kanji} - {assignment.apartment_name}
                  </option>
                ))}
              </select>
              {errors.current_assignment_id && (
                <p className="text-sm text-red-500 mt-1">{errors.current_assignment_id}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Current Assignment Card */}
        {currentAssignment && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BuildingOfficeIcon className="h-5 w-5" />
                Asignación Actual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Apartamento Actual</p>
                  <p className="font-medium">{currentAssignment.apartment_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dirección</p>
                  <p className="font-medium text-sm">
                    {currentAssignment.apartment?.full_address || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Inicio</p>
                  <p className="font-medium">{formatDate(currentAssignment.start_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Días Ocupados</p>
                  <p className="font-medium">{daysOccupied} días</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Renta Mensual</p>
                  <p className="font-medium">{formatCurrency(currentAssignment.monthly_rent)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transfer Form Card */}
        {currentAssignment && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightIcon className="h-5 w-5" />
                Detalles de Transferencia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Transfer Date */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <CalendarIcon className="inline h-4 w-4 mr-1" />
                    Fecha de Transferencia *
                  </label>
                  <input
                    type="date"
                    value={form.transfer_date}
                    onChange={(e) => handleChange('transfer_date', e.target.value)}
                    min={currentAssignment.start_date}
                    max={new Date().toISOString().split('T')[0]}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.transfer_date ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.transfer_date && (
                    <p className="text-sm text-red-500 mt-1">{errors.transfer_date}</p>
                  )}
                </div>

                {/* New Apartment Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <BuildingOfficeIcon className="inline h-4 w-4 mr-1" />
                    Nuevo Apartamento *
                  </label>
                  <select
                    value={form.new_apartment_id || ''}
                    onChange={(e) => handleChange('new_apartment_id', Number(e.target.value))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.new_apartment_id ? 'border-red-500' : ''
                    }`}
                    disabled={loadingApartments}
                  >
                    <option value="">Seleccionar apartamento</option>
                    {filteredApartments.map((apartment: any) => (
                      <option key={apartment.id} value={apartment.id}>
                        {apartment.name} - {formatCurrency(apartment.base_rent)} ({apartment.current_occupancy || 0}/{apartment.max_occupancy || 0})
                      </option>
                    ))}
                  </select>
                  {errors.new_apartment_id && (
                    <p className="text-sm text-red-500 mt-1">{errors.new_apartment_id}</p>
                  )}
                </div>
              </div>

              {/* Cleaning Fee Section */}
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="apply_cleaning_fee"
                    checked={form.apply_cleaning_fee}
                    onChange={(e) => handleChange('apply_cleaning_fee', e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="apply_cleaning_fee" className="text-sm font-medium cursor-pointer">
                    Aplicar tarifa de limpieza al apartamento anterior
                  </label>
                </div>
                {form.apply_cleaning_fee && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <CurrencyYenIcon className="inline h-4 w-4 mr-1" />
                      Monto de Limpieza (¥)
                    </label>
                    <input
                      type="number"
                      value={form.cleaning_fee_amount}
                      onChange={(e) => handleChange('cleaning_fee_amount', Number(e.target.value))}
                      min="0"
                      step="1000"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                        errors.cleaning_fee_amount ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.cleaning_fee_amount && (
                      <p className="text-sm text-red-500 mt-1">{errors.cleaning_fee_amount}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <DocumentTextIcon className="inline h-4 w-4 mr-1" />
                  Notas
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Información adicional sobre la transferencia"
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* New Apartment Preview Card */}
        {selectedNewApartment && (
          <Card>
            <CardHeader>
              <CardTitle>Vista Previa - Nuevo Apartamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-medium">{selectedNewApartment.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dirección</p>
                  <p className="font-medium text-sm">{selectedNewApartment.full_address}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Renta Mensual</p>
                  <p className="font-medium">{formatCurrency(selectedNewApartment.base_rent)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ocupación</p>
                  <p className="font-medium">
                    {selectedNewApartment.current_occupancy || 0} / {selectedNewApartment.max_occupancy || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dual Calculation Preview */}
        {transferCalculation && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="text-primary">Cálculo de Costos de Transferencia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Old Apartment Cost */}
                <div className="space-y-2 p-4 bg-red-50 rounded-lg border border-red-200">
                  <h3 className="font-semibold text-red-900">Costo Final - Apartamento Anterior</h3>
                  <Separator />
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Renta Prorrateada:</span>
                      <span className="font-medium">
                        {formatCurrency(transferCalculation.breakdown?.old_prorated || 0)}
                      </span>
                    </div>
                    {form.apply_cleaning_fee && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tarifa de Limpieza:</span>
                        <span className="font-medium">{formatCurrency(form.cleaning_fee_amount)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-base">
                      <span>Subtotal:</span>
                      <span className="text-red-700">
                        {formatCurrency(transferCalculation.old_apartment_cost)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* New Apartment Cost */}
                <div className="space-y-2 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-900">Costo - Nuevo Apartamento</h3>
                  <Separator />
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Renta Prorrateada:</span>
                      <span className="font-medium">
                        {formatCurrency(transferCalculation.breakdown?.new_prorated || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tarifa de Limpieza:</span>
                      <span className="font-medium">{formatCurrency(0)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-base">
                      <span>Subtotal:</span>
                      <span className="text-green-700">
                        {formatCurrency(transferCalculation.new_apartment_cost)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Monthly Deduction */}
              <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Deducción Mensual Total:</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(transferCalculation.total_monthly_cost)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4">
          <Button
            type="submit"
            disabled={
              transferMutation.isPending ||
              !currentAssignment ||
              !selectedNewApartment ||
              !transferCalculation
            }
            className="px-6"
          >
            {transferMutation.isPending ? 'Transfiriendo...' : 'Transferir Empleado'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
        </div>
      </form>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
              Confirmar Transferencia
            </DialogTitle>
            <DialogDescription>
              Por favor, revisa los detalles antes de confirmar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Empleado:</div>
              <div className="font-medium">{currentAssignment?.employee_name_kanji}</div>

              <div className="text-muted-foreground">Desde:</div>
              <div className="font-medium">{currentAssignment?.apartment_name}</div>

              <div className="text-muted-foreground">Hacia:</div>
              <div className="font-medium">{selectedNewApartment?.name}</div>

              <div className="text-muted-foreground">Fecha:</div>
              <div className="font-medium">{formatDate(form.transfer_date)}</div>

              <Separator className="col-span-2 my-2" />

              <div className="text-muted-foreground">Costo Final Anterior:</div>
              <div className="font-medium">
                {transferCalculation && formatCurrency(transferCalculation.old_apartment_cost)}
              </div>

              <div className="text-muted-foreground">Costo Nuevo:</div>
              <div className="font-medium">
                {transferCalculation && formatCurrency(transferCalculation.new_apartment_cost)}
              </div>

              <div className="text-muted-foreground font-bold">Total Deducción:</div>
              <div className="font-bold text-primary">
                {transferCalculation && formatCurrency(transferCalculation.total_monthly_cost)}
              </div>
            </div>

            <Alert variant="destructive">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertDescription>
                Esta acción finalizará la asignación actual y creará una nueva. Esta operación no
                se puede deshacer.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmTransfer} disabled={transferMutation.isPending}>
              {transferMutation.isPending ? 'Transfiriendo...' : 'Confirmar Transferencia'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
