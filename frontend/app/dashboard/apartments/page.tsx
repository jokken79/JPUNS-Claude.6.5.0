'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apartmentsV2Service } from '@/lib/api';
import type { ApartmentWithStats, ApartmentListParams } from '@/types/apartments-v2';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ChartBarIcon,
  CurrencyYenIcon,
  XMarkIcon,
  PencilIcon,
  EyeIcon,
  MapPinIcon,
  HomeIcon,
  MapIcon,
} from '@heroicons/react/24/outline';

export default function ApartmentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [prefecture, setPrefecture] = useState<string>('');
  const [minRent, setMinRent] = useState<number | ''>('');
  const [maxRent, setMaxRent] = useState<number | ''>('');
  const [factoryId, setFactoryId] = useState<number | ''>('');
  const [regionId, setRegionId] = useState<number | ''>('');
  const [zone, setZone] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Build query params
  const queryParams: ApartmentListParams = {
    page,
    page_size: pageSize,
    search: search || undefined,
    available_only: availableOnly || undefined,
    status: status || undefined,
    prefecture: prefecture || undefined,
    min_rent: minRent ? Number(minRent) : undefined,
    max_rent: maxRent ? Number(maxRent) : undefined,
    factory_id: factoryId ? Number(factoryId) : undefined,
    region_id: regionId ? Number(regionId) : undefined,
    zone: zone || undefined,
    has_factory: undefined,
    sort_by: 'name',
    sort_order: 'asc',
  };

  // Fetch apartments list with pagination
  const { data: apartmentsResponse, isLoading: apartmentsLoading, error: apartmentsError } = useQuery({
    queryKey: ['apartments-v2', queryParams],
    queryFn: () => apartmentsV2Service.listApartments(queryParams),
  });

  const apartments = apartmentsResponse?.items || [];
  const totalApartments = apartmentsResponse?.total || 0;
  const totalPages = apartmentsResponse?.total_pages || 1;

  // Calculate stats from current page data
  const stats = {
    total_apartments: totalApartments,
    total_capacity: apartments.reduce((sum, apt) => sum + apt.max_occupancy, 0),
    total_occupied: apartments.reduce((sum, apt) => sum + apt.current_occupancy, 0),
    apartments_available: apartments.filter(apt => apt.is_available).length,
    apartments_full: apartments.filter(apt => apt.current_occupancy >= apt.max_occupancy).length,
    average_rent: apartments.length > 0
      ? apartments.reduce((sum, apt) => sum + apt.base_rent, 0) / apartments.length
      : 0,
    average_occupancy: apartments.length > 0
      ? apartments.reduce((sum, apt) => sum + apt.occupancy_rate, 0) / apartments.length
      : 0,
  };

  // Status badge component
  const StatusBadge = ({ apartment }: { apartment: ApartmentWithStats }) => {
    let bgColor, textColor, label;

    if (apartment.current_occupancy === 0) {
      bgColor = 'bg-muted';
      textColor = 'text-muted-foreground';
      label = 'Vacío';
    } else if (apartment.is_available) {
      bgColor = 'bg-success';
      textColor = 'text-success-foreground';
      label = 'Disponible';
    } else if (apartment.current_occupancy < apartment.max_occupancy) {
      bgColor = 'bg-warning';
      textColor = 'text-warning-foreground';
      label = 'Parcial';
    } else {
      bgColor = 'bg-destructive';
      textColor = 'text-destructive-foreground';
      label = 'Lleno';
    }

    return (
      <span className={`px-2.5 py-1.5 text-xs font-medium rounded-md ${bgColor} ${textColor}`}>
        {label}
      </span>
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    setAvailableOnly(false);
    setStatus('');
    setPrefecture('');
    setMinRent('');
    setMaxRent('');
    setFactoryId('');
    setRegionId('');
    setZone('');
    setPage(1);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Apartamentos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administra los apartamentos de la empresa - Sistema V2
          </p>
        </div>
        <button
          onClick={() => router.push('/apartments/create')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Nuevo Apartamento
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Apartamentos</p>
              <p className="text-2xl font-bold mt-1">{stats.total_apartments}</p>
            </div>
            <BuildingOfficeIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Capacidad Total</p>
              <p className="text-2xl font-bold mt-1">{stats.total_capacity}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ocupados: {stats.total_occupied}
              </p>
            </div>
            <UserGroupIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ocupación Promedio</p>
              <p className="text-2xl font-bold mt-1">{stats.average_occupancy.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                Disponibles: {stats.apartments_available}
              </p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Renta Promedio</p>
              <p className="text-2xl font-bold mt-1">¥{Math.round(stats.average_rent).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Llenos: {stats.apartments_full}
              </p>
            </div>
            <CurrencyYenIcon className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5" />
            <h2 className="font-semibold">Filtros</h2>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm text-primary hover:underline"
          >
            {showFilters ? 'Ocultar' : 'Mostrar'} filtros
          </button>
        </div>

        {/* Search bar always visible */}
        <div className="relative mb-4">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre, dirección, edificio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <input
                    type="checkbox"
                    checked={availableOnly}
                    onChange={(e) => setAvailableOnly(e.target.checked)}
                    className="mr-2"
                  />
                  Solo disponibles
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Estado</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Todos</option>
                  <option value="active">Activo</option>
                  <option value="maintenance">Mantenimiento</option>
                  <option value="unavailable">No disponible</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Prefectura</label>
                <input
                  type="text"
                  placeholder="Ej: 東京都"
                  value={prefecture}
                  onChange={(e) => setPrefecture(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Fábrica (ID)</label>
                <input
                  type="number"
                  placeholder="ID de fábrica..."
                  value={factoryId}
                  onChange={(e) => setFactoryId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Región (ID)</label>
                <input
                  type="number"
                  placeholder="ID de región..."
                  value={regionId}
                  onChange={(e) => setRegionId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Zona</label>
                <input
                  type="text"
                  placeholder="Nombre de zona..."
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Renta Mínima (¥)</label>
                <input
                  type="number"
                  placeholder="Ej: 30000"
                  value={minRent}
                  onChange={(e) => setMinRent(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Renta Máxima (¥)</label>
                <input
                  type="number"
                  placeholder="Ej: 80000"
                  value={maxRent}
                  onChange={(e) => setMaxRent(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-accent transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Apartments Grid */}
      <div className="bg-card border rounded-lg">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">
            Apartamentos ({totalApartments} total, {apartments.length} en esta página)
          </h2>
          {totalPages > 1 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Página {page} de {totalPages}</span>
            </div>
          )}
        </div>

        {apartmentsLoading && (
          <div className="p-8 text-center text-muted-foreground">
            Cargando apartamentos...
          </div>
        )}

        {apartmentsError && (
          <div className="p-8 text-center text-red-500">
            Error al cargar apartamentos. Por favor, intenta de nuevo.
          </div>
        )}

        {!apartmentsLoading && !apartmentsError && apartments.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No se encontraron apartamentos con los filtros aplicados.
          </div>
        )}

        {!apartmentsLoading && !apartmentsError && apartments.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {apartments.map((apartment) => (
                <div
                  key={apartment.id}
                  className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/apartments/${apartment.id}`)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 mr-2">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <HomeIcon className="h-5 w-5 text-primary" />
                        {apartment.name}
                      </h3>
                      {apartment.building_name && (
                        <p className="text-xs text-muted-foreground">{apartment.building_name}</p>
                      )}
                      {apartment.full_address && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPinIcon className="h-3 w-3" />
                          {apartment.full_address.substring(0, 40)}...
                        </p>
                      )}
                    </div>
                    <StatusBadge apartment={apartment} />
                  </div>

                  {/* Factory and Region Context */}
                  {(apartment.primary_factory || apartment.region_id || apartment.zone) && (
                    <div className="mb-3 space-y-1 text-sm">
                      {apartment.primary_factory && (
                        <div className="flex items-start gap-1.5 text-muted-foreground">
                          <BuildingOfficeIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="font-medium">
                              {apartment.primary_factory.company_name}
                              {apartment.primary_factory.plant_name && ` - ${apartment.primary_factory.plant_name}`}
                            </span>
                            {apartment.factory_associations && apartment.factory_associations.length > 1 && (
                              <span className="text-xs ml-1">
                                (+{apartment.factory_associations.length - 1} más)
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      {(apartment.region_id || apartment.zone) && (
                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                          <MapIcon className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>
                            {apartment.region_id && `Región: ${apartment.region_id}`}
                            {apartment.region_id && apartment.zone && ' | '}
                            {apartment.zone && `Zona: ${apartment.zone}`}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                    <div className="bg-accent/50 rounded p-2">
                      <span className="text-muted-foreground text-xs">Ocupación</span>
                      <p className="font-medium text-base">
                        {apartment.current_occupancy}/{apartment.max_occupancy}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {apartment.occupancy_rate.toFixed(0)}%
                      </p>
                    </div>
                    <div className="bg-accent/50 rounded p-2">
                      <span className="text-muted-foreground text-xs">Renta Base</span>
                      <p className="font-medium text-base">
                        ¥{apartment.base_rent.toLocaleString()}
                      </p>
                      {apartment.management_fee > 0 && (
                        <p className="text-xs text-muted-foreground">
                          +¥{apartment.management_fee.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          apartment.occupancy_rate === 0
                            ? 'bg-gray-400'
                            : apartment.is_available
                            ? 'bg-green-500'
                            : apartment.occupancy_rate < 100
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(apartment.occupancy_rate, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/apartments/${apartment.id}`);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm border rounded hover:bg-accent transition-colors"
                    >
                      <EyeIcon className="h-4 w-4" />
                      Ver
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/apartments/${apartment.id}/edit`);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm border rounded hover:bg-accent transition-colors"
                    >
                      <PencilIcon className="h-4 w-4" />
                      Editar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t flex items-center justify-between">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="text-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
