'use client';

/**
 * Payroll Employee Table Component
 * Tabla de empleados con datos de nómina
 */
import * as React from 'react';
import { EmployeePayrollResult } from '@/lib/payroll-api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PayrollEmployeeTableProps {
  employees: EmployeePayrollResult[];
  onGeneratePayslip?: (employeeId: number) => void;
  loading?: boolean;
  className?: string;
}

export function PayrollEmployeeTable({
  employees,
  onGeneratePayslip,
  loading = false,
  className,
}: PayrollEmployeeTableProps) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [sortKey, setSortKey] = React.useState<keyof EmployeePayrollResult | null>(null);
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');
  const itemsPerPage = 10;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format hours
  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`;
  };

  // Sort employees
  const sortedEmployees = React.useMemo(() => {
    if (!sortKey) return employees;

    return [...employees].sort((a, b) => {
      let aValue: any = a;
      let bValue: any = b;

      // Handle nested properties
      if (sortKey === 'employee_id') {
        aValue = a.employee_id;
        bValue = b.employee_id;
      } else if (sortKey.includes('hours_breakdown')) {
        aValue = a.hours_breakdown.total_hours;
        bValue = b.hours_breakdown.total_hours;
      } else if (sortKey.includes('amounts')) {
        const key = sortKey.replace('amounts.', '') as keyof typeof a.amounts;
        aValue = a.amounts[key];
        bValue = b.amounts[key];
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [employees, sortKey, sortOrder]);

  // Paginate
  const paginatedEmployees = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return sortedEmployees.slice(start, end);
  }, [sortedEmployees, currentPage]);

  const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage);

  // Handle sort
  const handleSort = (key: keyof EmployeePayrollResult) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Empty state
  if (employees.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No hay empleados en este payroll run.
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleSort('employee_id')}
              >
                Empleado ID
                {sortKey === 'employee_id' && (
                  <span className="ml-2">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </TableHead>
              <TableHead>Horas Totales</TableHead>
              <TableHead>Monto Base</TableHead>
              <TableHead>Horas Extra</TableHead>
              <TableHead>Turno Nocturno</TableHead>
              <TableHead>Monto Bruto</TableHead>
              <TableHead>Deducciones</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleSort('amounts' as any)}
              >
                Monto Neto
                {sortKey === 'amounts' && (
                  <span className="ml-2">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEmployees.map((employee) => (
              <TableRow key={employee.employee_id}>
                <TableCell className="font-medium">
                  #{employee.employee_id}
                </TableCell>
                <TableCell>
                  {formatHours(employee.hours_breakdown.total_hours)}
                </TableCell>
                <TableCell>
                  {formatCurrency(employee.amounts.base_amount)}
                </TableCell>
                <TableCell>
                  {formatHours(employee.hours_breakdown.overtime_hours)}
                  <span className="text-xs text-muted-foreground ml-1">
                    ({formatCurrency(employee.amounts.overtime_amount)})
                  </span>
                </TableCell>
                <TableCell>
                  {formatHours(employee.hours_breakdown.night_shift_hours)}
                  <span className="text-xs text-muted-foreground ml-1">
                    ({formatCurrency(employee.amounts.night_shift_amount)})
                  </span>
                </TableCell>
                <TableCell className="font-semibold">
                  {formatCurrency(employee.amounts.gross_amount)}
                </TableCell>
                <TableCell className="text-red-600">
                  -{formatCurrency(employee.amounts.total_deductions)}
                </TableCell>
                <TableCell className="font-bold text-green-600">
                  {formatCurrency(employee.amounts.net_amount)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onGeneratePayslip?.(employee.employee_id)}
                    disabled={!onGeneratePayslip}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {(currentPage - 1) * itemsPerPage + 1} a{' '}
            {Math.min(currentPage * itemsPerPage, sortedEmployees.length)} de{' '}
            {sortedEmployees.length} empleados
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm">
              Página {currentPage} de {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
