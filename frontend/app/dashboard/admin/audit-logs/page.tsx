'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Shield, TrendingUp, Users, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { AuditLogTable, type AdminAuditLog } from '@/components/admin/audit-log-table';
import { AuditLogDetail } from '@/components/admin/audit-log-detail';
import { AuditLogFilters, type AuditLogFilters as Filters } from '@/components/admin/audit-log-filters';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface PaginatedResponse {
  items: AdminAuditLog[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

interface AuditStats {
  total_changes_24h: number;
  total_changes_7d: number;
  total_changes_30d: number;
  total_changes_all: number;
  top_admins: Array<{ user_id: number; username: string; full_name?: string; change_count: number }>;
  most_modified_pages: Array<{ page_key: string; change_count: number }>;
  most_modified_roles: Array<{ role_key: string; change_count: number }>;
  changes_by_action_type: Record<string, number>;
  changes_by_resource_type: Record<string, number>;
}

export default function AuditLogsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [selectedLog, setSelectedLog] = useState<AdminAuditLog | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<Filters>({});

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const params: any = {
        skip: (currentPage - 1) * pageSize,
        limit: pageSize,
        sort_by: 'created_at',
        sort_order: 'desc',
      };

      // Add filters
      if (filters.action_type) params.action_type = filters.action_type;
      if (filters.resource_type) params.resource_type = filters.resource_type;
      if (filters.resource_key) params.resource_key = filters.resource_key;
      if (filters.admin_id) params.admin_id = filters.admin_id;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.search) params.search = filters.search;

      const response = await axios.get<PaginatedResponse>(`${API_BASE_URL}/api/admin/audit-log`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setLogs(response.data.items);
      setTotalCount(response.data.total);
      setTotalPages(response.data.total_pages);
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to fetch audit logs',
        variant: 'destructive',
      });
      if (error.response?.status === 401 || error.response?.status === 403) {
        router.push('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get<AuditStats>(`${API_BASE_URL}/api/admin/audit-log/stats/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStats(response.data);
    } catch (error: any) {
      console.error('Error fetching audit stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Export audit logs
  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/admin/audit-log/export`,
        {
          format: 'csv',
          filters: filters,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast({
        title: 'Export successful',
        description: 'Audit logs have been exported',
      });
    } catch (error: any) {
      console.error('Error exporting audit logs:', error);
      toast({
        title: 'Export failed',
        description: error.response?.data?.detail || 'Failed to export audit logs',
        variant: 'destructive',
      });
    }
  };

  // Effects
  useEffect(() => {
    fetchAuditLogs();
  }, [currentPage]);

  useEffect(() => {
    fetchStats();
  }, []);

  // Handlers
  const handleSearch = () => {
    setCurrentPage(1);
    fetchAuditLogs();
  };

  const handleReset = () => {
    setFilters({});
    setCurrentPage(1);
  };

  const handleRowClick = (log: AdminAuditLog) => {
    setSelectedLog(log);
    setDetailOpen(true);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Audit Logs</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track and monitor all admin permission changes
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/admin/control-panel')}>
          Back to Control Panel
        </Button>
      </div>

      {/* Statistics Cards */}
      {!isLoadingStats && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last 24 Hours</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_changes_24h}</div>
              <p className="text-xs text-muted-foreground">changes recorded</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last 7 Days</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_changes_7d}</div>
              <p className="text-xs text-muted-foreground">changes recorded</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last 30 Days</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_changes_30d}</div>
              <p className="text-xs text-muted-foreground">changes recorded</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">All Time</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_changes_all}</div>
              <p className="text-xs text-muted-foreground">total changes</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <AuditLogFilters
        filters={filters}
        onFiltersChange={setFilters}
        onSearch={handleSearch}
        onReset={handleReset}
        onExport={handleExport}
      />

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          Showing {logs.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
        </span>
        <span>Page {currentPage} of {totalPages}</span>
      </div>

      {/* Table */}
      <AuditLogTable logs={logs} onRowClick={handleRowClick} isLoading={isLoading} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }

                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNumber)}
                      isActive={currentPage === pageNumber}
                      className="cursor-pointer"
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Detail Dialog */}
      <AuditLogDetail log={selectedLog} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </div>
  );
}
