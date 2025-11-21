'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { apartmentsV2Service } from '@/lib/api';
import {
  ArrowLeftIcon,
  UserIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface CreateAssignmentForm {
  employee_id: number | '';
  apartment_id: number | '';
  assignment_date: string;
  notes: string;
}

interface Employee {
  id: number;
  hakenmoto_id: number;
  full_name_kanji: string;
  full_name_kana: string | null;
}

interface Apartment {
  id: number;
  apartment_code: string;
  address: string;
  capacity: number;
  employees_count: number;
  is_available: boolean;
  monthly_rent: number;
}

export default function CreateAssignmentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateAssignmentForm>({
    employee_id: '',
    apartment_id: '',
    assignment_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch available employees
  const { data: employees = [] } = useQuery({
    queryKey: ['available-employees'],
    queryFn: async () => {
      const response = await api.get('/employees/?unassigned_only=true');
      return response.data as Employee[];
    },
  });

  // Fetch available apartments
  const { data: apartments = [] } = useQuery({
    queryKey: ['available-apartments'],
    queryFn: async () => {
      const response = await api.get('/apartments-v2/apartments?available_only=true');
      return response.data as Apartment[];
    },
  });

  // Create assignment mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateAssignmentForm) => {
      return await apartmentsV2Service.createAssignment({
        employee_id: Number(data.employee_id),
        apartment_id: Number(data.apartment_id),
        start_date: data.assignment_date,
        notes: data.notes || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartment-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['apartment-assignments-stats'] });
      router.push('/apartment-assignments');
    },
    onError: (error: any) => {
      if (error.response?.data?.detail) {
        setErrors({ general: error.response.data.detail });
      }
    },
  });

  const handleChange = (field: keyof CreateAssignmentForm, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!form.employee_id) newErrors.employee_id = 'Debes seleccionar un empleado';
    if (!form.apartment_id) newErrors.apartment_id = 'Debes seleccionar un apartamento';
    if (!form.assignment_date) newErrors.assignment_date = 'La fecha es requerida';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    createMutation.mutate(form);
  };

  const selectedEmployee = employees.find(e => e.id === form.employee_id);
  const selectedApartment = apartments.find(a => a.id === form.apartment_id);

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
          <h1 className="text-3xl font-bold">Nueva Asignación</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Asignar un empleado a un apartamento
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-card border rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {errors.general}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Employee Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <UserIcon className="inline h-4 w-4 mr-1" />
                Empleado *
              </label>
              <select
                value={form.employee_id}
                onChange={(e) => handleChange('employee_id', e.target.value ? Number(e.target.value) : '')}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.employee_id ? 'border-red-500' : ''
                }`}
              >
                <option value="">Seleccionar empleado</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.full_name_kanji} (ID: {employee.hakenmoto_id})
                  </option>
                ))}
              </select>
              {errors.employee_id && (
                <p className="text-sm text-red-500 mt-1">{errors.employee_id}</p>
              )}
              {selectedEmployee && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded text-sm">
                  <CheckCircleIcon className="inline h-4 w-4 text-green-600 mr-1" />
                  Empleado sin apartamento asignado
                </div>
              )}
            </div>

            {/* Apartment Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <BuildingOfficeIcon className="inline h-4 w-4 mr-1" />
                Apartamento *
              </label>
              <select
                value={form.apartment_id}
                onChange={(e) => handleChange('apartment_id', e.target.value ? Number(e.target.value) : '')}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.apartment_id ? 'border-red-500' : ''
                }`}
              >
                <option value="">Seleccionar apartamento</option>
                {apartments.map((apartment) => (
                  <option key={apartment.id} value={apartment.id}>
                    {apartment.apartment_code} - {apartment.address}
                    {' '}({apartment.employees_count}/{apartment.capacity})
                  </option>
                ))}
              </select>
              {errors.apartment_id && (
                <p className="text-sm text-red-500 mt-1">{errors.apartment_id}</p>
              )}
              {selectedApartment && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                  <CheckCircleIcon className="inline h-4 w-4 text-blue-600 mr-1" />
                  Disponible • {selectedApartment.employees_count}/{selectedApartment.capacity} ocupados
                  <br />
                  Renta: ¥{selectedApartment.monthly_rent.toLocaleString()}/mes
                </div>
              )}
            </div>

            {/* Assignment Date */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <CalendarIcon className="inline h-4 w-4 mr-1" />
                Fecha de Asignación *
              </label>
              <input
                type="date"
                value={form.assignment_date}
                onChange={(e) => handleChange('assignment_date', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.assignment_date ? 'border-red-500' : ''
                }`}
              />
              {errors.assignment_date && (
                <p className="text-sm text-red-500 mt-1">{errors.assignment_date}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">Notas</label>
            <textarea
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Información adicional sobre la asignación"
              rows={4}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Summary */}
          {selectedEmployee && selectedApartment && (
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-3">Resumen de la Asignación</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Empleado:</p>
                  <p className="font-medium">{selectedEmployee.full_name_kanji}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Apartamento:</p>
                  <p className="font-medium">{selectedApartment.apartment_code}</p>
                  <p className="text-xs text-muted-foreground">{selectedApartment.address}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fecha de inicio:</p>
                  <p className="font-medium">
                    {new Date(form.assignment_date).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Renta mensual:</p>
                  <p className="font-medium">¥{selectedApartment.monthly_rent.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={createMutation.isPending || !selectedEmployee || !selectedApartment}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creando...' : 'Crear Asignación'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
