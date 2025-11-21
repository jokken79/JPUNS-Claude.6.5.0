'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apartmentsV2Service } from '@/lib/api';
import type { ApartmentListParams } from '@/types/apartments-v2';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  MapPinIcon,
  CurrencyYenIcon,
  UserGroupIcon,
  EyeIcon,
  PencilIcon,
  BuildingOfficeIcon,
  HomeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const PREFECTURES = [
  '東京都', '神奈川県', '埼玉県', '千葉県', '大阪府', '京都府', '兵庫県',
  '愛知県', '福岡県', '北海道', '宮城県', '広島県', '静岡県', '茨城県',
  '栃木県', '群馬県', '新潟県', '長野県', '岐阜県', '三重県', '滋賀県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '山口県', '徳島県',
  '香川県', '愛媛県', '高知県', '佐賀県', '長崎県', '熊本県', '大分県',
  '宮崎県', '鹿児島県', '沖縄県'
];

const ROOM_TYPES = ['R', 'K', 'DK', 'LDK', 'S'];

export default function SearchApartmentsPage() {
  const router = useRouter();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const [filters, setFilters] = useState<ApartmentListParams>({
    page: currentPage,
    page_size: pageSize,
    search: '',
    status: '',
    available_only: false,
    prefecture: '',
    min_rent: undefined,
    max_rent: undefined,
    sort_by: 'name',
    sort_order: 'asc',
  });

  // Fetch apartments with filters
  const { data: apartmentsResponse, isLoading, error } = useQuery({
    queryKey: ['apartments-v2-search', filters],
    queryFn: async () => {
      try {
        return await apartmentsV2Service.listApartments({
          ...filters,
          page: currentPage,
        });
      } catch (err: any) {
        toast.error('Error al buscar apartamentos');
        throw err;
      }
    },
  });

  const apartments = apartmentsResponse?.items || [];
  const totalItems = apartmentsResponse?.total || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  const handleFilterChange = (field: keyof ApartmentListParams, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Reset to page 1 when filters change
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      page_size: pageSize,
      search: '',
      status: '',
      available_only: false,
      prefecture: '',
      min_rent: undefined,
      max_rent: undefined,
      sort_by: 'name',
      sort_order: 'asc',
    });
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Status badge component
  const getStatusBadge = (apartment: any) => {
    const isAvailable = apartment.is_available;
    const occupancyRate = apartment.occupancy_rate || 0;

    if (isAvailable) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          Disponible
        </span>
      );
    } else if (occupancyRate >= 100) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          Lleno
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
          Parcial
        </span>
      );
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Búsqueda Avanzada de Apartamentos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Encuentra apartamentos usando múltiples filtros y criterios
          </p>
        </div>
        <Button
          onClick={() => router.push('/apartments/create')}
        >
          <BuildingOfficeIcon className="h-4 w-4 mr-2" />
          Nuevo Apartamento
        </Button>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-5 w-5" />
              <CardTitle>Criterios de Búsqueda</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Ocultar' : 'Mostrar'} filtros avanzados
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nombre o dirección..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Basic filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="available_only"
                checked={filters.available_only}
                onCheckedChange={(checked) => handleFilterChange('available_only', checked)}
              />
              <Label htmlFor="available_only" className="cursor-pointer">
                Solo disponibles
              </Label>
            </div>

            <div>
              <Label htmlFor="status">Estado</Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="maintenance">Mantenimiento</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sort">Ordenar por</Label>
              <div className="flex gap-2">
                <Select
                  value={filters.sort_by || 'name'}
                  onValueChange={(value) => handleFilterChange('sort_by', value)}
                >
                  <SelectTrigger id="sort" className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nombre</SelectItem>
                    <SelectItem value="base_rent">Renta</SelectItem>
                    <SelectItem value="prefecture">Prefectura</SelectItem>
                    <SelectItem value="created_at">Fecha creación</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.sort_order || 'asc'}
                  onValueChange={(value) => handleFilterChange('sort_order', value as 'asc' | 'desc')}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">↑</SelectItem>
                    <SelectItem value="desc">↓</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Advanced filters */}
          {showAdvanced && (
            <div className="pt-4 border-t space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prefecture">
                    <MapPinIcon className="inline h-4 w-4 mr-1" />
                    Prefectura
                  </Label>
                  <Select
                    value={filters.prefecture || 'all'}
                    onValueChange={(value) => handleFilterChange('prefecture', value === 'all' ? '' : value)}
                  >
                    <SelectTrigger id="prefecture">
                      <SelectValue placeholder="Todas las prefecturas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las prefecturas</SelectItem>
                      {PREFECTURES.map((pref) => (
                        <SelectItem key={pref} value={pref}>
                          {pref}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    value={filters.city || ''}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    placeholder="ej. 新宿区"
                  />
                </div>

                <div>
                  <Label htmlFor="min_rent">
                    <CurrencyYenIcon className="inline h-4 w-4 mr-1" />
                    Renta Mínima (¥)
                  </Label>
                  <Input
                    id="min_rent"
                    type="number"
                    value={filters.min_rent || ''}
                    onChange={(e) => handleFilterChange('min_rent', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="ej. 30000"
                    min="0"
                  />
                </div>

                <div>
                  <Label htmlFor="max_rent">Renta Máxima (¥)</Label>
                  <Input
                    id="max_rent"
                    type="number"
                    value={filters.max_rent || ''}
                    onChange={(e) => handleFilterChange('max_rent', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="ej. 100000"
                    min="0"
                  />
                </div>

                <div>
                  <Label htmlFor="min_size">Tamaño Mínimo (m²)</Label>
                  <Input
                    id="min_size"
                    type="number"
                    value={filters.min_size_sqm || ''}
                    onChange={(e) => handleFilterChange('min_size_sqm', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="ej. 20"
                    min="0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={clearFilters}
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              Limpiar filtros
            </Button>
            <div className="text-sm text-muted-foreground">
              {isLoading ? 'Buscando...' : `${totalItems} resultados encontrados`}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Resultados de Búsqueda</h2>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Buscando apartamentos...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-500">Error al buscar apartamentos. Por favor, intenta de nuevo.</p>
          </div>
        )}

        {!isLoading && !error && apartments.length === 0 && (
          <div className="text-center py-12">
            <BuildingOfficeIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No se encontraron apartamentos con los criterios especificados.</p>
          </div>
        )}

        {!isLoading && !error && apartments.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {apartments.map((apartment) => (
                <Card key={apartment.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <HomeIcon className="h-5 w-5 text-primary" />
                          {apartment.name}
                        </CardTitle>
                        {apartment.building_name && (
                          <CardDescription className="mt-1">
                            {apartment.building_name}
                          </CardDescription>
                        )}
                      </div>
                      {getStatusBadge(apartment)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPinIcon className="h-4 w-4" />
                      <span className="truncate">
                        {apartment.full_address || 'Sin dirección'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <CurrencyYenIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">
                        ¥{apartment.base_rent.toLocaleString()}/mes
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <UserGroupIcon className="h-4 w-4" />
                      <span>
                        Ocupación: {apartment.current_occupancy}/{apartment.max_occupancy} ({apartment.occupancy_rate?.toFixed(0) || 0}%)
                      </span>
                    </div>

                    {apartment.room_type && (
                      <div className="text-sm text-muted-foreground">
                        Tipo: {apartment.room_type}
                        {apartment.size_sqm && ` • ${apartment.size_sqm}m²`}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/apartments/${apartment.id}`)}
                      >
                        <EyeIcon className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/apartments/${apartment.id}/edit`)}
                      >
                        <PencilIcon className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  Anterior
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first, last, current, and adjacent pages
                      return page === 1 ||
                             page === totalPages ||
                             Math.abs(page - currentPage) <= 1;
                    })
                    .map((page, idx, arr) => (
                      <React.Fragment key={page}>
                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                          <span className="px-2 text-muted-foreground">...</span>
                        )}
                        <Button
                          variant={page === currentPage ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      </React.Fragment>
                    ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="text-center text-sm text-muted-foreground mt-4">
              Página {currentPage} de {totalPages} • Total: {totalItems} apartamentos
            </div>
          </>
        )}
      </div>
    </div>
  );
}
