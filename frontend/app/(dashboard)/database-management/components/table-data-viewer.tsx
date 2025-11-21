'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databaseService } from '@/lib/api/database';
import {
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Save,
  XCircle,
  AlertTriangle
} from 'lucide-react';

interface TableDataViewerProps {
  tableName: string;
  onClose: () => void;
}

interface EditingCell {
  rowId: string;
  column: string;
  value: any;
}

interface TableRow {
  id: string;
  [key: string]: any;
}

export default function TableDataViewer({ tableName, onClose }: TableDataViewerProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch table data
  const { data, isLoading } = useQuery({
    queryKey: ['table-data', tableName, page, pageSize, search],
    queryFn: () => databaseService.getTableData(tableName, {
      limit: pageSize,
      offset: (page - 1) * pageSize,
      search: search || undefined
    })
  });

  // Update cell mutation
  const updateMutation = useMutation({
    mutationFn: ({ rowId, column, value }: { rowId: string; column: string; value: any }) =>
      databaseService.updateRow(tableName, rowId, column, value),
    onSuccess: (data: { message: string }) => {
      queryClient.invalidateQueries({ queryKey: ['table-data', tableName] });
      queryClient.invalidateQueries({ queryKey: ['database-tables'] });
      setEditingCell(null);
      alert('✅ Celda actualizada exitosamente');
    },
    onError: (error: any) => {
      alert(`❌ Error al actualizar: ${error.response?.data?.detail || error.message}`);
    }
  });

  // Delete row mutation
  const deleteMutation = useMutation({
    mutationFn: (rowId: string) => databaseService.deleteRow(tableName, rowId),
    onSuccess: (data: { message: string }) => {
      queryClient.invalidateQueries({ queryKey: ['table-data', tableName] });
      queryClient.invalidateQueries({ queryKey: ['database-tables'] });
      setShowDeleteConfirm(null);
      alert('✅ Fila eliminada exitosamente');
    },
    onError: (error: any) => {
      alert(`❌ Error al eliminar: ${error.response?.data?.detail || error.message}`);
      setShowDeleteConfirm(null);
    }
  });

  const handleCellEdit = (rowId: string, column: string, currentValue: any) => {
    setEditingCell({ rowId, column, value: currentValue });
  };

  const handleCellSave = () => {
    if (editingCell) {
      updateMutation.mutate(editingCell);
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
  };

  const handleDeleteRow = (rowId: string) => {
    setShowDeleteConfirm(rowId);
  };

  const confirmDeleteRow = () => {
    if (showDeleteConfirm) {
      deleteMutation.mutate(showDeleteConfirm);
    }
  };

  const totalPages = data ? Math.ceil(data.totalCount / pageSize) : 0;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-card rounded-lg p-8 border border-border">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-foreground">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold">Datos de: {tableName}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Total: {data?.totalCount.toLocaleString()} filas
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition"
          >
            <X className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1); // Reset to first page on search
              }}
              placeholder="Buscar en cualquier columna..."
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-auto p-4">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-muted z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b-2 border-border">
                  Acciones
                </th>
                {data?.columns.map((col: string) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b-2 border-border"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.rows.map((row: TableRow, rowIndex: number) => (
                <tr
                  key={row.id || rowIndex}
                  className="hover:bg-muted transition"
                >
                  {/* Actions Column */}
                  <td className="px-4 py-3 border-b border-border">
                    <button
                      onClick={() => handleDeleteRow(row.id)}
                      disabled={deleteMutation.isPending}
                      className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition disabled:opacity-50"
                      title="Eliminar fila"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>

                  {/* Data Columns */}
                  {data.columns.map((col: string) => {
                    const cellValue = row[col];
                    const isEditing = editingCell?.rowId === row.id && editingCell?.column === col;

                    return (
                      <td
                        key={col}
                        className="px-4 py-3 border-b border-border"
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingCell?.value ?? ''}
                              onChange={(e) => editingCell && setEditingCell({ ...editingCell, value: e.target.value })}
                              className="flex-1 px-2 py-1 border border-primary rounded focus:ring-2 focus:ring-primary bg-background text-foreground"
                              autoFocus
                            />
                            <button
                              onClick={handleCellSave}
                              disabled={updateMutation.isPending}
                              className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition disabled:opacity-50"
                              title="Guardar"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCellCancel}
                              className="p-1 text-muted-foreground hover:bg-muted rounded transition"
                              title="Cancelar"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between group">
                            <span className="text-sm text-foreground">
                              {cellValue !== null && cellValue !== undefined
                                ? String(cellValue)
                                : <span className="text-muted-foreground italic">null</span>}
                            </span>
                            {col !== 'id' && (
                              <button
                                onClick={() => handleCellEdit(row.id, col, cellValue)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                                title="Editar celda"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {data?.rows.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {search ? 'No se encontraron resultados' : 'No hay datos en esta tabla'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="text-sm text-muted-foreground">
              Filas por página:
            </label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="px-3 py-1 border border-input rounded bg-background text-foreground"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 border border-input rounded hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <span className="text-sm text-foreground px-4">
              Página {page} de {totalPages}
            </span>

            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-2 border border-input rounded hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold">¿Confirmar eliminación?</h3>
              </div>

              <p className="text-foreground mb-4">
                ¿Estás seguro de que deseas eliminar esta fila? Esta acción no se puede deshacer.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteRow}
                  disabled={deleteMutation.isPending}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50"
                >
                  {deleteMutation.isPending ? 'Eliminando...' : 'Sí, eliminar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
