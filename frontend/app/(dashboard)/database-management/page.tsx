'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { databaseService } from '@/lib/api/database';
import {
  Database,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Table as TableIcon,
  FileSpreadsheet,
  ArrowLeft,
  Eye
} from 'lucide-react';
import TableDataViewer from './components/table-data-viewer';

interface TableInfo {
  name: string;
  rowCount: number;
  columns: {
    name: string;
    type: string;
    nullable: boolean;
  }[];
}

export default function DatabaseManagementPage() {
  const router = useRouter();
  const [showTruncateConfirm, setShowTruncateConfirm] = useState(false);
  const [tableToTruncate, setTableToTruncate] = useState<string | null>(null);
  const [viewingTable, setViewingTable] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch all tables
  const { data: tables, isLoading, refetch } = useQuery<TableInfo[]>({
    queryKey: ['database-tables'],
    queryFn: () => databaseService.getTables()
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: (tableName: string) => databaseService.exportTable(tableName),
    onSuccess: (data: { success: boolean }) => {
      alert('✅ Tabla exportada exitosamente');
    },
    onError: (error: any) => {
      alert(`❌ Error al exportar: ${error.response?.data?.detail || error.message}`);
    }
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: ({ tableName, file }: { tableName: string; file: File }) =>
      databaseService.importTable(tableName, file),
    onSuccess: (data: { message: string; insertedCount: number }) => {
      alert(`✅ ${data.message}`);
      queryClient.invalidateQueries({ queryKey: ['database-tables'] });
    },
    onError: (error: any) => {
      alert(`❌ Error al importar: ${error.response?.data?.detail || error.message}`);
    }
  });

  // Truncate mutation
  const truncateMutation = useMutation({
    mutationFn: (tableName: string) => databaseService.truncateTable(tableName),
    onSuccess: (data: { message: string; rowsDeleted: number }) => {
      alert(`✅ ${data.message}\n📊 Filas eliminadas: ${data.rowsDeleted}`);
      queryClient.invalidateQueries({ queryKey: ['database-tables'] });
      setShowTruncateConfirm(false);
      setTableToTruncate(null);
    },
    onError: (error: any) => {
      alert(`❌ Error al borrar: ${error.response?.data?.detail || error.message}`);
      setShowTruncateConfirm(false);
    }
  });

  const handleExport = (tableName: string) => {
    exportMutation.mutate(tableName);
  };

  const handleImport = (tableName: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls,.xlsm';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        importMutation.mutate({ tableName, file });
      }
    };
    input.click();
  };

  const handleTruncate = (tableName: string) => {
    setTableToTruncate(tableName);
    setShowTruncateConfirm(true);
  };

  const confirmTruncate = () => {
    if (tableToTruncate) {
      truncateMutation.mutate(tableToTruncate);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Volver</span>
      </button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Database className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Gestión de Base de Datos</h1>
        </div>
        <p className="text-muted-foreground">
          Control completo de todas las tablas: importar, exportar y borrar datos
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex gap-4">
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tables?.map((table) => (
          <div
            key={table.name}
            className="bg-card rounded-lg shadow-lg p-6 border border-border hover:shadow-xl transition"
          >
            {/* Table Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <TableIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{table.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {table.rowCount.toLocaleString()} filas
                  </p>
                </div>
              </div>
            </div>

            {/* Columns Info */}
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                COLUMNAS ({table.columns.length}):
              </p>
              <div className="flex flex-wrap gap-1">
                {table.columns.slice(0, 5).map((col) => (
                  <span
                    key={col.name}
                    className="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded"
                  >
                    {col.name}
                  </span>
                ))}
                {table.columns.length > 5 && (
                  <span className="text-xs px-2 py-1 text-muted-foreground">
                    +{table.columns.length - 5} más
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {/* View */}
              <button
                onClick={() => setViewingTable(table.name)}
                className="flex flex-col items-center gap-1 p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition"
                title="Ver datos de la tabla"
              >
                <Eye className="w-5 h-5" />
                <span className="text-xs font-medium">Ver</span>
              </button>

              {/* Export */}
              <button
                onClick={() => handleExport(table.name)}
                disabled={exportMutation.isPending}
                className="flex flex-col items-center gap-1 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition disabled:opacity-50"
                title="Exportar como CSV"
              >
                <Download className="w-5 h-5" />
                <span className="text-xs font-medium">Exportar</span>
              </button>

              {/* Import */}
              <button
                onClick={() => handleImport(table.name)}
                disabled={importMutation.isPending}
                className="flex flex-col items-center gap-1 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition disabled:opacity-50"
                title="Importar CSV/Excel"
              >
                <Upload className="w-5 h-5" />
                <span className="text-xs font-medium">Importar</span>
              </button>

              {/* Truncate */}
              <button
                onClick={() => handleTruncate(table.name)}
                disabled={truncateMutation.isPending}
                className="flex flex-col items-center gap-1 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition disabled:opacity-50"
                title="Borrar todas las filas"
              >
                <Trash2 className="w-5 h-5" />
                <span className="text-xs font-medium">Borrar</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Truncate Confirmation Modal */}
      {showTruncateConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-2xl font-bold">¿Confirmar borrado?</h3>
            </div>

            <div className="mb-6">
              <p className="text-foreground mb-3">
                Estás a punto de <strong className="text-red-600">borrar TODAS las filas</strong> de la tabla:
              </p>
              <p className="text-xl font-bold text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-center">
                {tableToTruncate}
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                ⚠️ Esta acción NO se puede deshacer. La estructura de la tabla se mantendrá, pero todos los datos se perderán.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTruncateConfirm(false);
                  setTableToTruncate(null);
                }}
                className="flex-1 px-4 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmTruncate}
                disabled={truncateMutation.isPending}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50"
              >
                {truncateMutation.isPending ? 'Borrando...' : 'Sí, borrar todo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Data Viewer Modal */}
      {viewingTable && (
        <TableDataViewer
          tableName={viewingTable}
          onClose={() => setViewingTable(null)}
        />
      )}

      {/* Info Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
          <FileSpreadsheet className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
          <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2">Exportar</h4>
          <p className="text-sm text-blue-700 dark:text-blue-400">
            Descarga los datos de cualquier tabla en formato CSV para usar en Excel
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
          <Upload className="w-8 h-8 text-green-600 dark:text-green-400 mb-3" />
          <h4 className="font-bold text-green-900 dark:text-green-300 mb-2">Importar</h4>
          <p className="text-sm text-green-700 dark:text-green-400">
            Sube archivos CSV o Excel (incluso con macros .xlsm) para agregar datos. Importa todas las columnas, incluyendo las ocultas.
          </p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
          <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400 mb-3" />
          <h4 className="font-bold text-red-900 dark:text-red-300 mb-2">Borrar</h4>
          <p className="text-sm text-red-700 dark:text-red-400">
            Elimina todos los datos de una tabla cuando necesites limpiarla completamente
          </p>
        </div>
      </div>
    </div>
  );
}
