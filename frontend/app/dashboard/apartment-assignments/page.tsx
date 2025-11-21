'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api, { apartmentsV2Service } from '@/lib/api';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  UserIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ClockIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

interface Assignment {
  id: number;
  employee_id: number;
  apartment_id: number;
  employee: {
    full_name_kanji: string;
    hakenmoto_id: number;
  };
  apartment: {
    apartment_code: string;
    address: string;
  };
  assignment_date: string;
  end_date: string | null;
  status: 'active' | 'ended';
  is_active: boolean;
}

interface AssignmentStats {
  total_assignments: number;
  active_assignments: number;
  ended_assignments: number;
  this_month: number;
}

export default function ApartmentAssignmentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showInactive, setShowInactive] = useState(false);

  // Fetch assignments
  const { data: assignments = [], isLoading, error } = useQuery({
    queryKey: ['apartment-assignments', { search, statusFilter, showInactive }],
    queryFn: async () => {
      const data = await apartmentsV2Service.listAssignments({
        search: search || undefined,
        status: statusFilter || undefined,
      });
      return data.items as Assignment[];
    },
  });

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ['apartment-assignments-stats'],
    queryFn: async () => {
      const allData = await apartmentsV2Service.listAssignments({});
      return {
        total_assignments: allData.total,
        active_assignments: allData.items.filter(a => a.status === 'active').length,
        ended_assignments: allData.items.filter(a => a.status === 'ended').length,
        this_month: allData.items.filter(a => {
          const assignmentDate = new Date(a.start_date);
          const now = new Date();
          return assignmentDate.getMonth() === now.getMonth() &&
                 assignmentDate.getFullYear() === now.getFullYear();
        }).length
      } as AssignmentStats;
    },
  });

  // Status badge component
  const StatusBadge = ({ status, isActive }: { status: string; isActive: boolean }) => {
    const label = isActive ? 'Activa' : 'Finalizada';
    const style = isActive
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${style}`}>
        {label}
      </span>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Asignaciones de Apartamentos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona las asignaciones de empleados a apartamentos
          </p>
        </div>
        <button
          onClick={() => router.push('/apartment-assignments/create')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Nueva Asignación
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Asignaciones</p>
                <p className="text-2xl font-bold mt-1">{stats.total_assignments}</p>
              </div>
              <UserIcon className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Activas</p>
                <p className="text-2xl font-bold mt-1 text-green-600">{stats.active_assignments}</p>
              </div>
              <ClockIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Finalizadas</p>
                <p className="text-2xl font-bold mt-1 text-gray-600">{stats.ended_assignments}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-gray-500" />
            </div>
          </div>

          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Este Mes</p>
                <p className="text-2xl font-bold mt-1 text-purple-600">{stats.this_month}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por empleado o apartamento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activas</option>
              <option value="ended">Finalizadas</option>
            </select>

            <label className="flex items-center gap-2 px-3 py-2 border rounded-lg">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
              <span className="text-sm">Mostrar finalizadas</span>
            </label>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      <div className="bg-card border rounded-lg">
        <div className="p-4 border-b">
          <h2 className="font-semibold">
            Asignaciones ({assignments.length})
          </h2>
        </div>

        {isLoading && (
          <div className="p-8 text-center text-muted-foreground">
            Cargando asignaciones...
          </div>
        )}

        {error && (
          <div className="p-8 text-center text-red-500">
            Error al cargar las asignaciones. Por favor, intenta de nuevo.
          </div>
        )}

        {!isLoading && !error && assignments.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No se encontraron asignaciones.
          </div>
        )}

        {!isLoading && !error && assignments.length > 0 && (
          <div className="divide-y">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="p-4 hover:bg-accent cursor-pointer transition-colors"
                onClick={() => router.push(`/apartment-assignments/${assignment.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">
                        {assignment.employee.full_name_kanji}
                      </h3>
                      <StatusBadge status={assignment.status} isActive={assignment.is_active} />
                      <span className="text-xs text-muted-foreground">
                        ID: {assignment.employee.hakenmoto_id}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <BuildingOfficeIcon className="h-4 w-4" />
                        {assignment.apartment.apartment_code}
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        Desde: {formatDate(assignment.assignment_date)}
                      </div>
                      {assignment.end_date && (
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          Hasta: {formatDate(assignment.end_date)}
                        </div>
                      )}
                    </div>
                  </div>

                  <ArrowRightIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
