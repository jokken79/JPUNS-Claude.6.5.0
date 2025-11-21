'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';

export interface OccupancyData {
  apartmentName: string;
  occupied: number;
  capacity: number;
  occupancyRate: number;
}

export interface OccupancyChartProps {
  data: OccupancyData[];
  title?: string;
  description?: string;
  loading?: boolean;
}

/**
 * OccupancyChart - Apartment Occupancy Visualization
 *
 * Displays apartment occupancy rates with:
 * - Bar chart showing occupied vs capacity
 * - Color-coded bars based on occupancy rate
 * - Tooltips with detailed information
 * - Loading state with skeleton
 */
export function OccupancyChart({
  data,
  title = 'Apartment Occupancy',
  description = 'Current occupancy rates across all apartments',
  loading = false
}: OccupancyChartProps) {
  // Color logic based on occupancy rate
  const getBarColor = (occupancyRate: number) => {
    if (occupancyRate >= 90) return '#ef4444'; // Red - very high
    if (occupancyRate >= 75) return '#f59e0b'; // Orange - high
    if (occupancyRate >= 50) return '#10b981'; // Green - good
    return '#3b82f6'; // Blue - low
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{data.apartmentName}</p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-600">
              Occupied: <span className="font-medium text-gray-900">{data.occupied}</span>
            </p>
            <p className="text-gray-600">
              Capacity: <span className="font-medium text-gray-900">{data.capacity}</span>
            </p>
            <p className="text-gray-600">
              Rate: <span className="font-medium text-gray-900">{data.occupancyRate}%</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-2">
          <BuildingOfficeIcon className="h-6 w-6 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <p className="text-sm text-gray-500 mb-6">{description}</p>
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <BuildingOfficeIcon className="h-16 w-16 mb-4" />
          <p className="text-sm">No occupancy data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-blue-500 rounded-full p-2">
          <BuildingOfficeIcon className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-sm text-gray-500 mb-6">{description}</p>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="apartmentName"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 12 }}
            label={{ value: 'Occupants', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          <Bar dataKey="occupied" fill="#3b82f6" name="Occupied" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.occupancyRate)} />
            ))}
          </Bar>
          <Bar dataKey="capacity" fill="#d1d5db" name="Capacity" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Summary Statistics */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {data.reduce((sum, apt) => sum + apt.occupied, 0)}
            </p>
            <p className="text-xs text-gray-500">Total Occupied</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {data.reduce((sum, apt) => sum + apt.capacity, 0)}
            </p>
            <p className="text-xs text-gray-500">Total Capacity</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {Math.round(
                (data.reduce((sum, apt) => sum + apt.occupied, 0) /
                  data.reduce((sum, apt) => sum + apt.capacity, 0)) *
                  100
              )}%
            </p>
            <p className="text-xs text-gray-500">Overall Rate</p>
          </div>
        </div>
      </div>

      {/* Legend for colors */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-2">Occupancy Rate Legend:</p>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span className="text-gray-600">&lt; 50% (Low)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span className="text-gray-600">50-74% (Good)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-orange-500"></div>
            <span className="text-gray-600">75-89% (High)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span className="text-gray-600">≥ 90% (Very High)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
