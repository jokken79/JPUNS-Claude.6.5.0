'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { apartmentsV2Service } from '@/lib/api';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  CurrencyYenIcon,
  CalendarIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

interface AdditionalCharge {
  id: number;
  apartment_id: number;
  employee_id: number | null;
  charge_type: string;
  description: string;
  amount: number;
  charge_date: string;
  period_start: string | null;
  period_end: string | null;
  is_recurring: boolean;
  apartment: {
    apartment_code: string;
    address: string;
  };
  employee: {
    full_name_kanji: string;
  } | null;
}

interface CreateChargeForm {
  apartment_id: number | '';
  employee_id: number | '';
  charge_type: string;
  description: string;
  amount: number | '';
  charge_date: string;
  period_start: string;
  period_end: string;
  is_recurring: boolean;
  notes: string;
}

export default function AdditionalChargesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateChargeForm>({
    apartment_id: '',
    employee_id: '',
    charge_type: '',
    description: '',
    amount: '',
    charge_date: new Date().toISOString().split('T')[0],
    period_start: '',
    period_end: '',
    is_recurring: false,
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingCharge, setEditingCharge] = useState<AdditionalCharge | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Fetch charges
  const { data: charges = [], isLoading } = useQuery({
    queryKey: ['additional-charges', { search }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const response = await api.get(`/additional-charges/?${params.toString()}`);
      return response.data as AdditionalCharge[];
    },
  });

  // Fetch apartments
  const { data: apartments = [] } = useQuery({
    queryKey: ['apartments-v2'],
    queryFn: async () => {
      const response = await api.get('/apartments-v2/apartments');
      return response.data.items || response.data;  // Handle paginated response
    },
  });

  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await api.get('/employees/');
      return response.data;
    },
  });

  // Create charge mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateChargeForm) => {
      const response = await api.post('/additional-charges/', {
        apartment_id: Number(data.apartment_id),
        employee_id: data.employee_id ? Number(data.employee_id) : null,
        charge_type: data.charge_type,
        description: data.description,
        amount: Number(data.amount),
        charge_date: data.charge_date,
        period_start: data.period_start || null,
        period_end: data.period_end || null,
        is_recurring: data.is_recurring,
        notes: data.notes || null,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['additional-charges'] });
      setShowForm(false);
      resetForm();
      toast.success('Cargo creado exitosamente');
    },
    onError: (error: any) => {
      if (error.response?.data?.detail) {
        setErrors({ general: error.response.data.detail });
      }
      toast.error('Error al crear el cargo');
    },
  });

  // Update charge mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apartmentsV2Service.updateCharge(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['additional-charges'] });
      setShowEditModal(false);
      setEditingCharge(null);
      resetForm();
      toast.success('Cargo actualizado exitosamente');
    },
    onError: (error: any) => {
      console.error('Update error:', error);
      toast.error('Error al actualizar el cargo');
    },
  });

  // Delete charge mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apartmentsV2Service.deleteCharge(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['additional-charges'] });
      toast.success('Cargo eliminado exitosamente');
    },
    onError: (error: any) => {
      console.error('Delete error:', error);
      toast.error('Error al eliminar el cargo');
    },
  });

  const handleChange = (field: keyof CreateChargeForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const resetForm = () => {
    setForm({
      apartment_id: '',
      employee_id: '',
      charge_type: '',
      description: '',
      amount: '',
      charge_date: new Date().toISOString().split('T')[0],
      period_start: '',
      period_end: '',
      is_recurring: false,
      notes: '',
    });
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!form.apartment_id) newErrors.apartment_id = 'El apartamento es requerido';
    if (!form.charge_type) newErrors.charge_type = 'El tipo de cargo es requerido';
    if (!form.description.trim()) newErrors.description = 'La descripción es requerida';
    if (!form.amount || Number(form.amount) <= 0) newErrors.amount = 'El monto debe ser mayor a 0';
    if (!form.charge_date) newErrors.charge_date = 'La fecha es requerida';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (editingCharge) {
      // Update existing charge
      updateMutation.mutate({
        id: editingCharge.id,
        data: {
          apartment_id: Number(form.apartment_id),
          employee_id: form.employee_id ? Number(form.employee_id) : null,
          charge_type: form.charge_type,
          description: form.description,
          amount: Number(form.amount),
          charge_date: form.charge_date,
          period_start: form.period_start || null,
          period_end: form.period_end || null,
          is_recurring: form.is_recurring,
          notes: form.notes || null,
        },
      });
    } else {
      // Create new charge
      createMutation.mutate(form);
    }
  };

  const handleEdit = (charge: AdditionalCharge) => {
    setEditingCharge(charge);
    setShowEditModal(true);
    setShowForm(true);
    setForm({
      apartment_id: charge.apartment_id,
      employee_id: charge.employee_id || '',
      charge_type: charge.charge_type,
      description: charge.description,
      amount: charge.amount,
      charge_date: charge.charge_date,
      period_start: charge.period_start || '',
      period_end: charge.period_end || '',
      is_recurring: charge.is_recurring,
      notes: '',
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este cargo? Esta acción no se puede deshacer.')) {
      return;
    }

    deleteMutation.mutate(id);
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingCharge(null);
    setShowForm(false);
    resetForm();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cargos Adicionales</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona cargos adicionales a apartamentos y empleados
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Nuevo Cargo
        </button>
      </div>

      {/* Search */}
      <div className="bg-card border rounded-lg p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por tipo, descripción o apartamento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingCharge ? 'Editar Cargo' : 'Crear Nuevo Cargo'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {errors.general}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Apartment */}
              <div>
                <label className="block text-sm font-medium mb-2">Apartamento *</label>
                <select
                  value={form.apartment_id}
                  onChange={(e) => handleChange('apartment_id', e.target.value ? Number(e.target.value) : '')}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.apartment_id ? 'border-red-500' : ''
                  }`}
                >
                  <option value="">Seleccionar apartamento</option>
                  {apartments.map((apt: any) => (
                    <option key={apt.id} value={apt.id}>
                      {apt.apartment_code} - {apt.address}
                    </option>
                  ))}
                </select>
                {errors.apartment_id && (
                  <p className="text-sm text-red-500 mt-1">{errors.apartment_id}</p>
                )}
              </div>

              {/* Employee (Optional) */}
              <div>
                <label className="block text-sm font-medium mb-2">Empleado (Opcional)</label>
                <select
                  value={form.employee_id}
                  onChange={(e) => handleChange('employee_id', e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Todos los empleados</option>
                  {employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name_kanji} (ID: {emp.hakenmoto_id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Charge Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Tipo de Cargo *</label>
                <select
                  value={form.charge_type}
                  onChange={(e) => handleChange('charge_type', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.charge_type ? 'border-red-500' : ''
                  }`}
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="utilities">Servicios</option>
                  <option value="maintenance">Mantenimiento</option>
                  <option value="cleaning">Limpieza</option>
                  <option value="repairs">Reparaciones</option>
                  <option value="furniture">Mobiliario</option>
                  <option value="internet">Internet</option>
                  <option value="other">Otro</option>
                </select>
                {errors.charge_type && (
                  <p className="text-sm text-red-500 mt-1">{errors.charge_type}</p>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <CurrencyYenIcon className="inline h-4 w-4 mr-1" />
                  Monto (¥) *
                </label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => handleChange('amount', e.target.value ? Number(e.target.value) : '')}
                  placeholder="Ej: 5000"
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.amount ? 'border-red-500' : ''
                  }`}
                />
                {errors.amount && (
                  <p className="text-sm text-red-500 mt-1">{errors.amount}</p>
                )}
              </div>

              {/* Charge Date */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <CalendarIcon className="inline h-4 w-4 mr-1" />
                  Fecha del Cargo *
                </label>
                <input
                  type="date"
                  value={form.charge_date}
                  onChange={(e) => handleChange('charge_date', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.charge_date ? 'border-red-500' : ''
                  }`}
                />
                {errors.charge_date && (
                  <p className="text-sm text-red-500 mt-1">{errors.charge_date}</p>
                )}
              </div>

              {/* Recurring */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_recurring}
                  onChange={(e) => handleChange('is_recurring', e.target.checked)}
                  className="h-4 w-4"
                />
                <label className="text-sm font-medium">Cargo recurrente</label>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <DocumentTextIcon className="inline h-4 w-4 mr-1" />
                Descripción *
              </label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Descripción detallada del cargo"
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.description ? 'border-red-500' : ''
                }`}
              />
              {errors.description && (
                <p className="text-sm text-red-500 mt-1">{errors.description}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">Notas</label>
              <textarea
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Información adicional"
                rows={2}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t">
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {editingCharge
                  ? (updateMutation.isPending ? 'Actualizando...' : 'Actualizar Cargo')
                  : (createMutation.isPending ? 'Creando...' : 'Crear Cargo')}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Charges List */}
      <div className="bg-card border rounded-lg">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Cargos ({charges.length})</h2>
        </div>

        {isLoading && (
          <div className="p-8 text-center text-muted-foreground">
            Cargando cargos...
          </div>
        )}

        {!isLoading && charges.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No se encontraron cargos adicionales.
          </div>
        )}

        {!isLoading && charges.length > 0 && (
          <div className="divide-y">
            {charges.map((charge) => (
              <div key={charge.id} className="p-4 hover:bg-accent transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{charge.charge_type}</h3>
                      <span className="text-sm font-medium text-green-600">
                        ¥{charge.amount.toLocaleString()}
                      </span>
                      {charge.is_recurring && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          Recurrente
                        </span>
                      )}
                    </div>

                    <p className="text-sm mb-2">{charge.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span>Apartamento: </span>
                        <span className="font-medium">{charge.apartment.apartment_code}</span>
                      </div>
                      {charge.employee && (
                        <div>
                          <span>Empleado: </span>
                          <span className="font-medium">{charge.employee.full_name_kanji}</span>
                        </div>
                      )}
                      <div>
                        <span>Fecha: </span>
                        <span className="font-medium">{formatDate(charge.charge_date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(charge)}
                      className="p-2 hover:bg-accent rounded-lg transition-colors"
                      title="Editar cargo"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(charge.id)}
                      disabled={deleteMutation.isPending}
                      className="p-2 hover:bg-accent rounded-lg transition-colors text-red-600 disabled:opacity-50"
                      title="Eliminar cargo"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
