'use client';

import React, { useState } from 'react';
import { CurrencyYenIcon, CalendarIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface AdditionalCharge {
  apartment_id: number | '';
  employee_id: number | '';
  charge_type: string;
  description: string;
  amount: number | '';
  charge_date: string;
  is_recurring: boolean;
  notes: string;
}

interface AdditionalChargeFormProps {
  apartments: any[];
  employees?: any[];
  onSubmit: (charge: AdditionalCharge) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function AdditionalChargeForm({
  apartments,
  employees = [],
  onSubmit,
  onCancel,
  isLoading = false,
}: AdditionalChargeFormProps) {
  const [form, setForm] = useState<AdditionalCharge>({
    apartment_id: '',
    employee_id: '',
    charge_type: '',
    description: '',
    amount: '',
    charge_date: new Date().toISOString().split('T')[0],
    is_recurring: false,
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof AdditionalCharge, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
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

    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
            {apartments.map((apt) => (
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
            {employees.map((emp) => (
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
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Creando...' : 'Crear Cargo'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
