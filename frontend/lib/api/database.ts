import api from '../api';

export const databaseService = {
  // Get all tables with info
  getTables: async () => {
    const response = await api.get('/database/tables');
    return response.data;
  },

  // Get table data with pagination
  getTableData: async (tableName: string, params?: { limit?: number; offset?: number; search?: string }) => {
    const response = await api.get(`/database/tables/${tableName}/data`, { params });
    return response.data;
  },

  // Export table as CSV
  exportTable: async (tableName: string) => {
    const response = await api.get(`/database/tables/${tableName}/export`, {
      responseType: 'blob'
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${tableName}_export.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    return { success: true };
  },

  // Import data from CSV/Excel
  importTable: async (tableName: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/database/tables/${tableName}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Update a specific cell
  updateRow: async (tableName: string, rowId: string, column: string, value: any) => {
    const response = await api.put(`/database/tables/${tableName}/rows/${rowId}`, {
      column,
      value
    });
    return response.data;
  },

  // Delete a specific row
  deleteRow: async (tableName: string, rowId: string) => {
    const response = await api.delete(`/database/tables/${tableName}/rows/${rowId}`);
    return response.data;
  },

  // Truncate table (delete all rows)
  truncateTable: async (tableName: string) => {
    const response = await api.delete(`/database/tables/${tableName}/truncate`);
    return response.data;
  }
};
