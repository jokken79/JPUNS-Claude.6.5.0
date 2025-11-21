'use client';

import React from 'react';
import { ChartBarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

interface ChartData {
  label: string;
  value: number;
  percentage?: number;
  trend?: number;
}

interface ReportsChartProps {
  title: string;
  data: ChartData[];
  type: 'bar' | 'line' | 'pie';
  showTrend?: boolean;
  color?: string;
}

export function ReportsChart({ title, data, type, showTrend = false, color = 'blue' }: ReportsChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));

  const getColorClass = (index: number) => {
    const colors = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      red: 'bg-red-500',
      yellow: 'bg-yellow-500',
      purple: 'bg-purple-500',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="bg-card border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>

      {type === 'bar' && (
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{item.label}</span>
                  {showTrend && item.trend !== undefined && (
                    <div className="flex items-center gap-1">
                      {item.trend >= 0 ? (
                        <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`text-xs ${item.trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {Math.abs(item.trend).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-sm font-semibold">{item.value.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`${getColorClass(index)} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                />
              </div>
              {item.percentage !== undefined && (
                <div className="text-xs text-muted-foreground mt-1">
                  {item.percentage.toFixed(1)}% del total
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {type === 'pie' && (
        <div className="flex items-center justify-center">
          <div className="relative w-48 h-48">
            {/* Simple pie chart representation */}
            <div className="absolute inset-0 rounded-full border-8 border-gray-200 dark:border-gray-700" />
            {data.map((item, index) => {
              const rotation = data.slice(0, index).reduce((sum, d) => sum + (d.percentage || 0) * 3.6, 0);
              return (
                <div
                  key={index}
                  className={`absolute inset-0 rounded-full border-8 ${getColorClass(index)}`}
                  style={{
                    clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos((item.percentage || 0) * 0.0628319)}% ${50 - 50 * Math.sin((item.percentage || 0) * 0.0628319)}%, 50% 50%)`,
                    transform: `rotate(${rotation}deg)`,
                  }}
                />
              );
            })}
          </div>
          <div className="ml-6 space-y-2">
            {data.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${getColorClass(index)}`} />
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-sm text-muted-foreground">{item.percentage?.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {type === 'line' && (
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="text-sm font-medium w-20">{item.label}</span>
              <div className="flex-1 h-8 flex items-center">
                <div
                  className={`h-2 ${getColorClass(index)} rounded-full`}
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                />
              </div>
              <span className="text-sm font-semibold w-24 text-right">{item.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
