'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, AlertCircle, CheckCircle, Clock, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { timerCardService } from '@/lib/api';
import { toast } from 'sonner';
import axios from 'axios';

// Constantes de validación
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB en bytes
const FACTORY_ID_PATTERN = /^[a-zA-Z0-9\-_]{1,50}$/; // Formato básico de factory_id

interface EmployeeMatchInfo {
  hakenmoto_id: number | null;
  full_name_kanji: string;
  confidence: number;
}

interface TimerCardOCRData {
  page_number: number;
  work_date: string;
  employee_name_ocr: string;
  employee_matched: EmployeeMatchInfo | null;
  clock_in: string;
  clock_out: string;
  break_minutes: number;
  validation_errors: string[];
  confidence_score: number;
}

interface ProcessingError {
  page: number;
  error: string;
}

interface TimerCardUploadResponse {
  records_found: number;
  ocr_data: TimerCardOCRData[];
  processing_errors: ProcessingError[];
}

export default function TimerCardUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileSizeError, setFileSizeError] = useState<string>('');
  const [factoryId, setFactoryId] = useState<string>('');
  const [factoryIdError, setFactoryIdError] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [ocrData, setOcrData] = useState<TimerCardOCRData[]>([]);
  const [processingErrors, setProcessingErrors] = useState<ProcessingError[]>([]);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<TimerCardOCRData>>({});
  const router = useRouter();

  // BUG #3 FIX: Validar tamaño máximo de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileSizeError('');

    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Validar tipo
      if (selectedFile.type !== 'application/pdf') {
        toast.error('Solo se aceptan archivos PDF');
        setFile(null);
        return;
      }

      // Validar tamaño máximo (10MB)
      if (selectedFile.size > MAX_FILE_SIZE) {
        const fileSizeMB = (selectedFile.size / 1024 / 1024).toFixed(2);
        const errorMsg = `Archivo demasiado grande. Tu archivo: ${fileSizeMB}MB, máximo permitido: 10MB`;
        setFileSizeError(errorMsg);
        toast.error(errorMsg);
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setFileSizeError('');
      toast.success(`Archivo seleccionado: ${selectedFile.name}`);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // BUG #3 FIX: También validar en drag & drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFileSizeError('');

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles[0]) {
      const selectedFile = droppedFiles[0];

      // Validar tipo
      if (selectedFile.type !== 'application/pdf') {
        toast.error('Solo se aceptan archivos PDF');
        setFile(null);
        return;
      }

      // Validar tamaño máximo (10MB)
      if (selectedFile.size > MAX_FILE_SIZE) {
        const fileSizeMB = (selectedFile.size / 1024 / 1024).toFixed(2);
        const errorMsg = `Archivo demasiado grande. Tu archivo: ${fileSizeMB}MB, máximo permitido: 10MB`;
        setFileSizeError(errorMsg);
        toast.error(errorMsg);
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setFileSizeError('');
      toast.success(`Archivo seleccionado: ${selectedFile.name}`);
    }
  }, []);

  // BUG #4 FIX: Validar factory_id cuando cambia
  const handleFactoryIdChange = (value: string) => {
    setFactoryId(value);
    setFactoryIdError('');

    if (value && !FACTORY_ID_PATTERN.test(value)) {
      setFactoryIdError('Formato de fábrica inválido. Solo letras, números, guiones y guiones bajos.');
    }
  };

  // BUG #5 FIX: Error handling mejorado
  const handleUpload = async () => {
    if (!file) return;

    // Validar factory_id si fue proporcionado
    if (factoryId && !FACTORY_ID_PATTERN.test(factoryId)) {
      toast.error('Por favor corrige el ID de fábrica antes de continuar');
      return;
    }

    setUploading(true);
    setProcessingErrors([]);
    setOcrData([]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (factoryId) {
        formData.append('factory_id', factoryId);
      }

      const result: TimerCardUploadResponse = await timerCardService.uploadTimerCardPDF(formData);
      setOcrData(result.ocr_data);
      setProcessingErrors(result.processing_errors || []);

      if (result.records_found === 0) {
        toast.warning('No se encontraron registros en el PDF');
      } else {
        toast.success(`Se encontraron ${result.records_found} registros en el PDF`);
      }
    } catch (error: any) {
      console.error('Error uploading PDF:', error);

      // Mensajes de error específicos
      let errorMessage = 'Error desconocido al procesar el PDF';

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 413) {
          errorMessage = 'Archivo demasiado grande (máximo 10MB)';
        } else if (error.response?.status === 400) {
          errorMessage = error.response.data?.detail || 'Formato de archivo inválido. Solo se aceptan PDFs.';
        } else if (error.response?.status === 500) {
          errorMessage = 'Error en el servidor al procesar el PDF. Por favor intenta de nuevo.';
        } else if (error.response?.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.message) {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (index: number) => {
    setEditingRow(index);
    setEditData({ ...ocrData[index] });
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    setEditData({});
  };

  const handleSaveEdit = () => {
    if (editingRow !== null) {
      const updatedData = [...ocrData];
      updatedData[editingRow] = { ...updatedData[editingRow], ...editData };
      setOcrData(updatedData);
      setEditingRow(null);
      setEditData({});
    }
  };

  const handleFieldChange = (field: keyof TimerCardOCRData, value: string | number) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConfirmAll = async () => {
    // Filtrar solo registros válidos (sin errores y con empleado asignado)
    const validRecords = ocrData.filter(
      (record) => record.validation_errors.length === 0 && record.employee_matched?.hakenmoto_id
    );

    if (validRecords.length === 0) {
      alert('No hay registros válidos para guardar');
      return;
    }

    try {
      // Preparar datos para bulk create
      const records = validRecords.map((record) => ({
        hakenmoto_id: record.employee_matched!.hakenmoto_id!,
        work_date: record.work_date,
        clock_in: record.clock_in,
        clock_out: record.clock_out,
        break_minutes: record.break_minutes,
        factory_id: factoryId || undefined,
      }));

      await timerCardService.createBulkTimerCards(records);

      alert(`${records.length} registros guardados exitosamente`);
      router.push('/dashboard/timercards');
    } catch (error: any) {
      console.error('Error saving records:', error);

      // BUG #5 FIX: Mejorar error handling con mensajes específicos
      let errorMessage = 'Error desconocido al guardar registros';

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 413) {
          errorMessage = 'Datos demasiado grandes para procesar';
        } else if (error.response?.status === 400) {
          errorMessage = error.response.data?.detail || 'Datos inválidos en uno o más registros';
        } else if (error.response?.status === 401 || error.response?.status === 403) {
          errorMessage = 'No tienes permisos para guardar registros. Por favor inicia sesión nuevamente.';
        } else if (error.response?.status === 500) {
          errorMessage = 'Error del servidor. Por favor contacta al administrador.';
        } else if (error.response?.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.message) {
          errorMessage = error.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    }
  };

  const validRecordsCount = ocrData.filter(
    (record) => record.validation_errors.length === 0 && record.employee_matched?.hakenmoto_id
  ).length;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Subir Timer Cards (PDF)</h1>
        <p className="text-gray-600">Procesa archivos PDF de tarjetas de tiempo usando OCR</p>
      </div>

      {/* Upload Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Archivo
          </CardTitle>
          <CardDescription>
            Arrastra un archivo PDF o selecciónalo desde tu computadora
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Drag & Drop Area */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              {file ? (
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600">Arrastra tu archivo PDF aquí o haz clic para seleccionar</p>
                  <p className="text-xs text-gray-500 mt-1">Solo archivos PDF, máximo 10MB</p>
                </div>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              id="file-input"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* File Size Error Message */}
            {fileSizeError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">Error de validación</p>
                  <p className="text-sm text-red-700 mt-1">{fileSizeError}</p>
                </div>
              </div>
            )}

            {/* Factory ID Field */}
            <div>
              <Label htmlFor="factory-id">Fábrica (opcional)</Label>
              <Input
                id="factory-id"
                type="text"
                value={factoryId}
                onChange={(e) => handleFactoryIdChange(e.target.value)}
                placeholder="ID de fábrica (ej: Factory-01)"
                className={`mt-1 ${factoryIdError ? 'border-red-500' : ''}`}
              />
              {factoryIdError && (
                <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {factoryIdError}
                </p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleUpload}
            disabled={!file || uploading || !!factoryIdError}
            className="w-full"
            size="lg"
          >
            {uploading ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Procesando PDF con OCR...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Procesar PDF con OCR
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Processing Errors */}
      {processingErrors.length > 0 && (
        <Card className="mb-6 bg-yellow-50 border-yellow-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              Errores de Procesamiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-yellow-700">
              {processingErrors.map((error, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-medium">Página {error.page}:</span>
                  <span>{error.error}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* OCR Results Table */}
      {ocrData.length > 0 && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Registros Extraídos</CardTitle>
                  <CardDescription>
                    Total: {ocrData.length} registros | Válidos: {validRecordsCount}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Página</TableHead>
                      <TableHead className="w-32">Fecha</TableHead>
                      <TableHead>Empleado</TableHead>
                      <TableHead className="w-24">Entrada</TableHead>
                      <TableHead className="w-24">Salida</TableHead>
                      <TableHead className="w-24">Descanso</TableHead>
                      <TableHead className="w-48">Estado</TableHead>
                      <TableHead className="w-24">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ocrData.map((record, idx) => {
                      const hasErrors = record.validation_errors.length > 0;
                      const noEmployeeMatch = !record.employee_matched?.hakenmoto_id;
                      const isEditing = editingRow === idx;

                      return (
                        <TableRow
                          key={idx}
                          className={
                            hasErrors || noEmployeeMatch
                              ? 'bg-red-50 hover:bg-red-100'
                              : 'bg-green-50 hover:bg-green-100'
                          }
                        >
                          <TableCell>{record.page_number}</TableCell>

                          <TableCell>
                            {isEditing ? (
                              <Input
                                type="text"
                                value={editData.work_date || ''}
                                onChange={(e) => handleFieldChange('work_date', e.target.value)}
                                className="h-8"
                              />
                            ) : (
                              record.work_date
                            )}
                          </TableCell>

                          <TableCell>
                            {isEditing ? (
                              <Input
                                type="text"
                                value={editData.employee_name_ocr || ''}
                                onChange={(e) => handleFieldChange('employee_name_ocr', e.target.value)}
                                className="h-8"
                              />
                            ) : (
                              <div>
                                <div>{record.employee_name_ocr}</div>
                                {record.employee_matched && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    <span className="font-medium">Match:</span>{' '}
                                    {record.employee_matched.full_name_kanji} (
                                    {(record.employee_matched.confidence * 100).toFixed(0)}%)
                                  </div>
                                )}
                              </div>
                            )}
                          </TableCell>

                          <TableCell>
                            {isEditing ? (
                              <Input
                                type="text"
                                value={editData.clock_in || ''}
                                onChange={(e) => handleFieldChange('clock_in', e.target.value)}
                                className="h-8"
                                placeholder="HH:MM"
                              />
                            ) : (
                              record.clock_in
                            )}
                          </TableCell>

                          <TableCell>
                            {isEditing ? (
                              <Input
                                type="text"
                                value={editData.clock_out || ''}
                                onChange={(e) => handleFieldChange('clock_out', e.target.value)}
                                className="h-8"
                                placeholder="HH:MM"
                              />
                            ) : (
                              record.clock_out
                            )}
                          </TableCell>

                          <TableCell>
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editData.break_minutes || 0}
                                onChange={(e) => handleFieldChange('break_minutes', parseInt(e.target.value) || 0)}
                                className="h-8"
                              />
                            ) : (
                              `${record.break_minutes} min`
                            )}
                          </TableCell>

                          <TableCell>
                            {hasErrors ? (
                              <div className="text-red-600 text-sm">
                                <div className="font-medium mb-1">Errores:</div>
                                <ul className="list-disc list-inside space-y-1">
                                  {record.validation_errors.map((error, i) => (
                                    <li key={i}>{error}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : noEmployeeMatch ? (
                              <div className="text-yellow-600 text-sm flex items-center gap-1">
                                <AlertCircle className="h-4 w-4" />
                                Sin match de empleado
                              </div>
                            ) : (
                              <div className="text-green-600 text-sm flex items-center gap-1">
                                <CheckCircle className="h-4 w-4" />
                                Válido
                              </div>
                            )}
                            {record.confidence_score > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                Confianza: {(record.confidence_score * 100).toFixed(0)}%
                              </div>
                            )}
                          </TableCell>

                          <TableCell>
                            {isEditing ? (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={handleSaveEdit}
                                  className="h-8 px-2"
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelEdit}
                                  className="h-8 px-2"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(idx)}
                                className="h-8 px-2"
                                disabled={hasErrors}
                              >
                                Editar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmAll}
              disabled={validRecordsCount === 0}
              variant="success"
              size="lg"
            >
              <Save className="mr-2 h-4 w-4" />
              Guardar {validRecordsCount} Registros Válidos
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
