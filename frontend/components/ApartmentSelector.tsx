'use client';

import React, { useState, useEffect } from 'react';
import { apartmentsV2Service } from '@/lib/api';

interface Apartment {
  id: number;
  name: string;
  building_name: string;
  room_number: string;
  prefecture: string;
  city: string;
  base_rent: number;
  status: string;
}

interface ApartmentSelectorProps {
  value: string;
  onChange: (apartmentId: string) => void;
  required?: boolean;
}

export default function ApartmentSelector({ value, onChange, required = false }: ApartmentSelectorProps) {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApartments = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await apartmentsV2Service.listApartments({
          available_only: true,
          limit: 500
        });

        setApartments(data.items || []);
      } catch (err: any) {
        console.error('Error fetching apartments:', err);
        setError('アパートの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchApartments();
  }, []);

  if (loading) {
    return (
      <div className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm bg-gray-50">
        <span className="text-gray-500">アパートを読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="block w-full px-4 py-2.5 border border-red-300 rounded-xl shadow-sm bg-red-50">
        <span className="text-red-600 text-sm">{error}</span>
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition appearance-none bg-white"
    >
      <option value="">-- アパートを選択 --</option>
      {apartments.map((apartment) => (
        <option key={apartment.id} value={apartment.id.toString()}>
          {apartment.name || `${apartment.building_name} ${apartment.room_number}`} - {apartment.prefecture} {apartment.city} - ¥{apartment.base_rent.toLocaleString()}/月
        </option>
      ))}
    </select>
  );
}
