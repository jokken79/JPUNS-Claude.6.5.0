'use client';

/**
 * Payroll Settings - Página de configuración
 */
import { useEffect, useState } from 'react';
import { payrollAPI, PayrollSettings } from '@/lib/payroll-api';
import { usePayrollStore } from '@/stores/payroll-store';

// Disable static generation for this page (requires runtime data)
export const dynamic = 'force-dynamic';

export default function PayrollSettingsPage() {
  const { payrollSettings, setPayrollSettings, setLoading, setError } = usePayrollStore();

  const [formData, setFormData] = useState({
    overtime_rate: 1.25,
    night_shift_rate: 1.25,
    holiday_rate: 1.35,
    sunday_rate: 1.35,
    standard_hours_per_month: 160,
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (payrollSettings) {
      setFormData({
        overtime_rate: payrollSettings.overtime_rate,
        night_shift_rate: payrollSettings.night_shift_rate,
        holiday_rate: payrollSettings.holiday_rate,
        sunday_rate: payrollSettings.sunday_rate,
        standard_hours_per_month: payrollSettings.standard_hours_per_month,
      });
    }
  }, [payrollSettings]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const settings = await payrollAPI.getPayrollSettings();
      setPayrollSettings(settings);
    } catch (err: any) {
      setError(err.message || 'Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setSaved(false);

      const updatedSettings = await payrollAPI.updatePayrollSettings(formData);
      setPayrollSettings(updatedSettings);
      setSaved(true);

      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al guardar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: number) => {
    setFormData({ ...formData, [field]: value });
  };

  const rateToPercentage = (rate: number) => {
    return (rate * 100).toFixed(0);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configuración de Payroll</h1>
        <p className="text-gray-600 mt-2">
          Configure las tasas y parámetros para cálculos de payroll según las leyes laborales japonesas
        </p>
      </div>

      {/* Saved Message */}
      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6">
          ✅ Configuración guardada exitosamente
        </div>
      )}

      {/* Error Alert */}
      {/* Error handling is done in the store */}

      <div className="max-w-4xl">
        {/* Rate Settings */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Tasas de Recargo</h2>
          <p className="text-gray-600 mb-6">
            Estas tasas se aplican sobre la tarifa base por hora según la legislación laboral japonesa.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overtime Rate */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tasa de Horas Extras
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  step="0.01"
                  min="1.0"
                  max="2.0"
                  value={formData.overtime_rate}
                  onChange={(e) => handleChange('overtime_rate', parseFloat(e.target.value))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-gray-600">({rateToPercentage(formData.overtime_rate)}%)</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Horas extras: 25% de recargo sobre tarifa base (estándar japonés)
              </p>
            </div>

            {/* Night Shift Rate */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tasa de Turno Nocturno
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  step="0.01"
                  min="1.0"
                  max="2.0"
                  value={formData.night_shift_rate}
                  onChange={(e) => handleChange('night_shift_rate', parseFloat(e.target.value))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <span className="text-gray-600">({rateToPercentage(formData.night_shift_rate)}%)</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Trabajo nocturno: 25% de recargo (22:00 - 05:00)
              </p>
            </div>

            {/* Holiday Rate */}
            <div className="bg-red-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tasa de Días Festivos
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  step="0.01"
                  min="1.0"
                  max="2.0"
                  value={formData.holiday_rate}
                  onChange={(e) => handleChange('holiday_rate', parseFloat(e.target.value))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <span className="text-gray-600">({rateToPercentage(formData.holiday_rate)}%)</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Días festivos: 35% de recargo sobre tarifa base
              </p>
            </div>

            {/* Sunday Rate */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tasa de Domingos
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  step="0.01"
                  min="1.0"
                  max="2.0"
                  value={formData.sunday_rate}
                  onChange={(e) => handleChange('sunday_rate', parseFloat(e.target.value))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
                <span className="text-gray-600">({rateToPercentage(formData.sunday_rate)}%)</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Trabajo en domingo: 35% de recargo
              </p>
            </div>
          </div>
        </div>

        {/* Standard Hours */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Horas Estándar</h2>
          <p className="text-gray-600 mb-6">
            Horas mensuales estándar para cálculos de payroll.
          </p>

          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Horas Estándar por Mes
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                step="1"
                min="100"
                max="300"
                value={formData.standard_hours_per_month}
                onChange={(e) => handleChange('standard_hours_per_month', parseFloat(e.target.value))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-gray-600">horas/mes</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Estándar japonés: 160 horas por mes (8 horas × 20 días)
            </p>
          </div>
        </div>

        {/* Current Configuration Display */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Configuración Actual</h2>

          {payrollSettings ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Creado:</p>
                  <p className="font-medium">{new Date(payrollSettings.created_at).toLocaleDateString('ja-JP')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Última Actualización:</p>
                  <p className="font-medium">{new Date(payrollSettings.updated_at).toLocaleDateString('ja-JP')}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-medium text-gray-900 mb-3">Vista Previa de Cálculos</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Para un empleado con tarifa base de ¥1,000/h:</p>
                  <ul className="space-y-1 text-sm">
                    <li className="flex justify-between">
                      <span>Hora regular:</span>
                      <span className="font-medium">¥1,000</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Hora extra ({rateToPercentage(formData.overtime_rate)}%):</span>
                      <span className="font-medium">¥{Math.round(1000 * formData.overtime_rate).toLocaleString()}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Turno nocturno ({rateToPercentage(formData.night_shift_rate)}%):</span>
                      <span className="font-medium">¥{Math.round(1000 * formData.night_shift_rate).toLocaleString()}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Día festivo ({rateToPercentage(formData.holiday_rate)}%):</span>
                      <span className="font-medium">¥{Math.round(1000 * formData.holiday_rate).toLocaleString()}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Domingo ({rateToPercentage(formData.sunday_rate)}%):</span>
                      <span className="font-medium">¥{Math.round(1000 * formData.sunday_rate).toLocaleString()}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">Cargando configuración...</p>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={formData.overtime_rate === 0 || formData.night_shift_rate === 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
}
