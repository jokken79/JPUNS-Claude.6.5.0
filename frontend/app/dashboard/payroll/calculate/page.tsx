'use client';

/**
 * Calculate Payroll - Página de cálculo de payroll individual
 */
import { useState } from 'react';
import { payrollAPI } from '@/lib/payroll-api';
import { usePayrollStore } from '@/stores/payroll-store';

export default function CalculatePayrollPage() {
  const { setCurrentEmployeePayroll, setLoading, setError } = usePayrollStore();

  const [employeeData, setEmployeeData] = useState({
    employee_id: 123,
    name: '山田太郎',
    base_hourly_rate: 1200,
    factory_id: '123',
    prefecture: 'Tokyo',
    apartment_rent: 30000,
    dependents: 0,
  });

  const [timerRecords, setTimerRecords] = useState([
    {
      work_date: '2025-10-01',
      clock_in: '09:00',
      clock_out: '18:00',
      break_minutes: 60,
    },
    {
      work_date: '2025-10-02',
      clock_in: '09:00',
      clock_out: '19:00',
      break_minutes: 60,
    },
  ]);

  const [result, setResult] = useState<any>(null);

  const handleCalculate = async () => {
    try {
      setLoading(true);
      setError(null);

      const payrollResult = await payrollAPI.calculateEmployeePayroll({
        employee_data: employeeData,
        timer_records: timerRecords,
      });

      setResult(payrollResult);
      setCurrentEmployeePayroll(payrollResult);
    } catch (err: any) {
      setError(err.message || 'Error al calcular payroll');
    } finally {
      setLoading(false);
    }
  };

  const addTimerRecord = () => {
    setTimerRecords([
      ...timerRecords,
      {
        work_date: '2025-10-03',
        clock_in: '09:00',
        clock_out: '18:00',
        break_minutes: 60,
      },
    ]);
  };

  const updateTimerRecord = (index: number, field: string, value: any) => {
    const updated = [...timerRecords];
    updated[index] = { ...updated[index], [field]: value };
    setTimerRecords(updated);
  };

  const removeTimerRecord = (index: number) => {
    setTimerRecords(timerRecords.filter((_, i) => i !== index));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Calcular Payroll Individual</h1>
        <p className="text-gray-600 mt-2">
          Calcular el salario de un empleado basado en sus registros de tiempo
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="space-y-6">
          {/* Employee Data */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Datos del Empleado</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID del Empleado
                </label>
                <input
                  type="number"
                  value={employeeData.employee_id}
                  onChange={(e) =>
                    setEmployeeData({ ...employeeData, employee_id: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  value={employeeData.name}
                  onChange={(e) => setEmployeeData({ ...employeeData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tarifa por Hora (JPY)
                </label>
                <input
                  type="number"
                  value={employeeData.base_hourly_rate}
                  onChange={(e) =>
                    setEmployeeData({ ...employeeData, base_hourly_rate: parseFloat(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID de Fábrica
                </label>
                <input
                  type="text"
                  value={employeeData.factory_id}
                  onChange={(e) =>
                    setEmployeeData({ ...employeeData, factory_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prefectura
                </label>
                <select
                  value={employeeData.prefecture}
                  onChange={(e) =>
                    setEmployeeData({ ...employeeData, prefecture: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Tokyo">Tokyo</option>
                  <option value="Osaka">Osaka</option>
                  <option value="Kanagawa">Kanagawa</option>
                  <option value="Aichi">Aichi</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Renta de Apartamento (JPY)
                </label>
                <input
                  type="number"
                  value={employeeData.apartment_rent}
                  onChange={(e) =>
                    setEmployeeData({ ...employeeData, apartment_rent: parseFloat(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dependientes
                </label>
                <input
                  type="number"
                  value={employeeData.dependents}
                  onChange={(e) =>
                    setEmployeeData({ ...employeeData, dependents: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Timer Records */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Registros de Tiempo</h2>
              <button
                onClick={addTimerRecord}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                + Agregar Registro
              </button>
            </div>

            <div className="space-y-4">
              {timerRecords.map((record, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha
                      </label>
                      <input
                        type="date"
                        value={record.work_date}
                        onChange={(e) => updateTimerRecord(index, 'work_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descanso (min)
                      </label>
                      <input
                        type="number"
                        value={record.break_minutes}
                        onChange={(e) =>
                          updateTimerRecord(index, 'break_minutes', parseInt(e.target.value))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Entrada
                      </label>
                      <input
                        type="time"
                        value={record.clock_in}
                        onChange={(e) => updateTimerRecord(index, 'clock_in', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Salida
                      </label>
                      <input
                        type="time"
                        value={record.clock_out}
                        onChange={(e) => updateTimerRecord(index, 'clock_out', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => removeTimerRecord(index)}
                    className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleCalculate}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
          >
            Calcular Payroll
          </button>
        </div>

        {/* Results */}
        <div>
          {result ? (
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Resultado del Cálculo</h2>

              {/* Hours Breakdown */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Desglose de Horas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Horas Regulares</p>
                    <p className="text-xl font-bold text-gray-900">
                      {result.hours_breakdown.regular_hours}h
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Horas Extras</p>
                    <p className="text-xl font-bold text-gray-900">
                      {result.hours_breakdown.overtime_hours}h
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Turno Nocturno</p>
                    <p className="text-xl font-bold text-gray-900">
                      {result.hours_breakdown.night_shift_hours}h
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Holidays</p>
                    <p className="text-xl font-bold text-gray-900">
                      {result.hours_breakdown.holiday_hours}h
                    </p>
                  </div>
                </div>
              </div>

              {/* Amounts */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Montos</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pago Base:</span>
                    <span className="font-medium">{formatCurrency(result.amounts.base_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pago Extras:</span>
                    <span className="font-medium">{formatCurrency(result.amounts.overtime_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Turno Nocturno:</span>
                    <span className="font-medium">{formatCurrency(result.amounts.night_shift_amount)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-lg font-bold">
                    <span>Monto Bruto:</span>
                    <span className="text-green-600">{formatCurrency(result.amounts.gross_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Deducciones</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Impuesto sobre la Renta:</span>
                    <span className="font-medium">{formatCurrency(result.deductions_detail.income_tax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Impuesto Residencial:</span>
                    <span className="font-medium">{formatCurrency(result.deductions_detail.resident_tax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Seguro de Salud:</span>
                    <span className="font-medium">{formatCurrency(result.deductions_detail.health_insurance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pensión:</span>
                    <span className="font-medium">{formatCurrency(result.deductions_detail.pension)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-lg font-bold">
                    <span>Total Deducciones:</span>
                    <span className="text-red-600">{formatCurrency(result.amounts.total_deductions)}</span>
                  </div>
                </div>
              </div>

              {/* Net Pay */}
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">PAGO NETO</p>
                  <p className="text-4xl font-bold text-green-600">
                    {formatCurrency(result.amounts.net_amount)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-600 text-center">
                Ingrese los datos del empleado y los registros de tiempo, luego haga clic en "Calcular Payroll" para ver los resultados
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
