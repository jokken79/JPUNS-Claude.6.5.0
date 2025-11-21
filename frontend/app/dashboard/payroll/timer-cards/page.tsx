'use client';

/**
 * Timer Cards Upload - Página de carga y procesamiento de timer cards
 */
import { useState } from 'react';
import { payrollAPI } from '@/lib/payroll-api';

interface TimerCardData {
  success: boolean;
  pages_processed?: number;
  records_found?: number;
  records?: Array<{
    work_date: string;
    clock_in: string;
    clock_out: string;
    break_minutes: number;
  }>;
  employee_name?: string;
  employee_factory_id?: string;
  error?: string;
}

export default function TimerCardsPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [ocrResult, setOcrResult] = useState<TimerCardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setOcrResult(null);
      setError(null);
    }
  };

  const processTimerCard = async () => {
    if (!uploadedFile) return;

    try {
      setLoading(true);
      setError(null);

      // Simulate OCR processing
      // In real implementation, this would call the backend OCR API
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock OCR result
      const mockResult: TimerCardData = {
        success: true,
        pages_processed: 1,
        records_found: 5,
        records: [
          {
            work_date: '2025-10-01',
            clock_in: '09:00',
            clock_out: '18:00',
            break_minutes: 60,
          },
          {
            work_date: '2025-10-02',
            clock_in: '09:00',
            clock_out: '18:00',
            break_minutes: 60,
          },
          {
            work_date: '2025-10-03',
            clock_in: '09:00',
            clock_out: '18:00',
            break_minutes: 60,
          },
          {
            work_date: '2025-10-04',
            clock_in: '09:00',
            clock_out: '18:00',
            break_minutes: 60,
          },
          {
            work_date: '2025-10-05',
            clock_in: '09:00',
            clock_out: '18:00',
            break_minutes: 60,
          },
        ],
        employee_name: '山田太郎',
        employee_factory_id: '123',
      };

      setOcrResult(mockResult);
    } catch (err: any) {
      setError(err.message || 'Error al procesar timer card');
    } finally {
      setLoading(false);
    }
  };

  const calculatePayrollFromOCR = async () => {
    if (!ocrResult) return;

    try {
      setLoading(true);
      setError(null);

      const employeeData = {
        employee_id: 123,
        name: ocrResult.employee_name || 'Empleado',
        base_hourly_rate: 1200,
        factory_id: ocrResult.employee_factory_id || '123',
        prefecture: 'Tokyo',
        apartment_rent: 30000,
        dependents: 0,
      };

      const payrollResult = await payrollAPI.calculateEmployeePayroll({
        employee_data: employeeData,
        timer_records: ocrResult.records || [],
      });

      // Redirect to calculation page with result
      window.location.href = `/payroll/calculate?result=${encodeURIComponent(JSON.stringify(payrollResult))}`;
    } catch (err: any) {
      setError(err.message || 'Error al calcular payroll');
    } finally {
      setLoading(false);
    }
  };

  const calculatePayrollFromDB = async (employeeId: number, startDate: string, endDate: string) => {
    try {
      setLoading(true);
      setError(null);

      const payrollResult = await payrollAPI.calculatePayrollFromTimerCards(
        employeeId,
        startDate,
        endDate
      );

      // Redirect to calculation page with result
      window.location.href = `/payroll/calculate?result=${encodeURIComponent(JSON.stringify(payrollResult))}`;
    } catch (err: any) {
      setError(err.message || 'Error al calcular payroll desde la base de datos');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Payroll from DB Form Component
  function PayrollFromDBForm({ onCalculate }: { onCalculate: (employeeId: number, startDate: string, endDate: string) => void }) {
    const [employeeId, setEmployeeId] = useState('');
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (employeeId && startDate && endDate) {
        onCalculate(parseInt(employeeId), startDate, endDate);
      }
    };

    return (
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Calcular desde Base de Datos</h4>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Employee ID
            </label>
            <input
              type="number"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="Enter employee ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Fecha Fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!employeeId || !startDate || !endDate}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-medium transition-colors text-sm"
          >
            Calcular Payroll desde DB
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Timer Cards</h1>
        <p className="text-gray-600 mt-2">
          Suba y procese timer cards usando OCR para calcular automáticamente el payroll
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-6">
          {/* File Upload */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Subir Timer Card</h2>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="timer-card-upload"
              />
              <label
                htmlFor="timer-card-upload"
                className="cursor-pointer block"
              >
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <svg
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  <span className="font-medium">Haga clic para subir</span> o arrastre y suelte
                </p>
                <p className="text-xs text-gray-500">PDF, PNG, JPG (max. 10MB)</p>
              </label>
            </div>

            {uploadedFile && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{uploadedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={processTimerCard}
              disabled={!uploadedFile || loading}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Procesando...' : 'Procesar con OCR'}
            </button>
          </div>

          {/* OCR Instructions */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Instrucciones</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">1.</span>
                <span>Suba una imagen o PDF del timer card</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">2.</span>
                <span>El sistema OCR extraerá automáticamente las horas trabajadas</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">3.</span>
                <span>Revise los datos extraídos para verificar precisión</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">4.</span>
                <span>Haga clic en "Calcular Payroll" para generar el salario</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Results Section */}
        <div>
          {loading ? (
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Procesando timer card con OCR...</p>
                <p className="text-sm text-gray-500 mt-2">Esto puede tomar unos momentos</p>
              </div>
            </div>
          ) : ocrResult ? (
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Resultado del OCR</h2>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  ✅ Completado
                </span>
              </div>

              {/* Employee Info */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="font-medium text-gray-900 mb-2">Información del Empleado</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Nombre:</p>
                    <p className="font-medium">{ocrResult.employee_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">ID de Fábrica:</p>
                    <p className="font-medium">{ocrResult.employee_factory_id || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Records Summary */}
              <div className="mb-4">
                <h3 className="font-medium text-gray-900 mb-2">
                  Registros Encontrados: {ocrResult.records_found || 0}
                </h3>
              </div>

              {/* Records Table */}
              <div className="overflow-x-auto mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Fecha
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Entrada
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Salida
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Descanso
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {ocrResult.records?.map((record, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {formatDate(record.work_date)}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {record.clock_in}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {record.clock_out}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {record.break_minutes} min
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3">
                <button
                  onClick={calculatePayrollFromOCR}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Calcular Payroll con Estos Datos (OCR)
                </button>

                <PayrollFromDBForm onCalculate={calculatePayrollFromDB} />
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-600 text-center">
                Suba una timer card para comenzar el procesamiento OCR
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
