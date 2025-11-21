'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { factoryService } from '@/lib/api';
import { BuildingOffice2Icon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';

interface Factory {
  id: number;
  factory_id: string;
  name: string;
  company_name?: string;  // 企業名 - Company name (from backend)
  plant_name?: string;    // 工場名 - Plant/Factory name (from backend)
  address?: string;
  phone?: string;
  contact_person?: string;
  is_active: boolean;
  config?: any;
}

interface FactorySelectorProps {
  value: string; // factory_id actual
  onChange: (factoryId: string) => void;
  required?: boolean;
  disabled?: boolean;
}

/**
 * FactorySelector Component
 *
 * Componente de selección en cascada para Empresa → Fábrica
 * Usa los campos company_name y plant_name del backend para la jerarquía
 * Filtra fábricas basado en la empresa seleccionada
 */
export default function FactorySelector({ value, onChange, required = false, disabled = false }: FactorySelectorProps) {
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [availableFactories, setAvailableFactories] = useState<Factory[]>([]);

  // Fetch all factories
  const { data: factoriesData, isLoading } = useQuery({
    queryKey: ['factories-all'],
    queryFn: () => factoryService.getFactories({ is_active: true }),
  });

  // El backend devuelve directamente un array, no un objeto con .items
  const allFactories = (factoriesData as any) || [];

  // Extraer nombres de empresas únicas (directamente del backend)
  const companies = (Array.from(
    new Set(
      allFactories
        .map((f: Factory) => f.company_name)
        .filter(Boolean)
    )
  ) as string[]).sort();

  /**
   * Filtrar fábricas por empresa seleccionada
   */
  function filterFactoriesByCompany(companyName: string): Factory[] {
    if (!companyName) return [];

    return allFactories.filter((factory: Factory) =>
      factory.company_name === companyName
    );
  }

  /**
   * Encontrar empresa de una fábrica específica
   */
  function findCompanyForFactory(factoryId: string): string {
    const factory = allFactories.find((f: Factory) => f.factory_id === factoryId);
    if (!factory) return '';
    return factory.company_name || '';
  }

  // Efecto: Cuando cambia el value (factory_id externo), actualizar empresa y fábricas
  useEffect(() => {
    if (value && allFactories.length > 0) {
      const company = findCompanyForFactory(value);
      if (company) {
        setSelectedCompany(company);
        setAvailableFactories(filterFactoriesByCompany(company));
      }
    }
  }, [value, allFactories]);

  // Handle: Cambio de empresa
  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const company = e.target.value;
    setSelectedCompany(company);

    if (company) {
      const factories = filterFactoriesByCompany(company);
      setAvailableFactories(factories);

      // Si solo hay una fábrica, seleccionarla automáticamente
      if (factories.length === 1) {
        onChange(factories[0].factory_id);
      } else {
        // Limpiar selección de fábrica
        onChange('');
      }
    } else {
      setAvailableFactories([]);
      onChange('');
    }
  };

  // Handle: Cambio de fábrica
  const handleFactoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-11 bg-gray-200 rounded"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-11 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Combobox 1: Empresa */}
      <div>
        <label htmlFor="company-select" className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
          <BuildingStorefrontIcon className="h-4 w-4 text-indigo-600" />
          会社名 {required && <span className="text-red-500">*</span>}
        </label>
        <select
          id="company-select"
          value={selectedCompany}
          onChange={handleCompanyChange}
          required={required}
          disabled={disabled}
          className="block w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">-- 会社を選択 --</option>
          {companies.map((company, index) => (
            <option key={index} value={company}>
              {company}
            </option>
          ))}
        </select>
        {!selectedCompany && (
          <p className="mt-1.5 text-xs text-gray-500">まず会社を選択してください</p>
        )}
      </div>

      {/* Combobox 2: Fábrica (filtrado por empresa) */}
      <div>
        <label htmlFor="factory-select" className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
          <BuildingOffice2Icon className="h-4 w-4 text-indigo-600" />
          工場 {required && <span className="text-red-500">*</span>}
        </label>
        <select
          id="factory-select"
          value={value}
          onChange={handleFactoryChange}
          required={required}
          disabled={disabled || !selectedCompany}
          className="block w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">
            {selectedCompany ? '-- 工場を選択 --' : '-- 会社を先に選択 --'}
          </option>
          {availableFactories.map((factory) => (
            <option key={factory.factory_id} value={factory.factory_id}>
              {factory.plant_name || factory.name} ({factory.factory_id})
            </option>
          ))}
        </select>
        {selectedCompany && availableFactories.length === 0 && (
          <p className="mt-1.5 text-xs text-amber-600">
            この会社には登録された工場がありません
          </p>
        )}
        {selectedCompany && availableFactories.length > 0 && !value && (
          <p className="mt-1.5 text-xs text-gray-500">
            {availableFactories.length}件の工場が利用可能
          </p>
        )}
      </div>
    </div>
  );
}
