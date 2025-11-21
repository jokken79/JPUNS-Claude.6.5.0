'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

interface EmployeeLinkProps {
  rirekishoId: string
}

export function EmployeeLink({ rirekishoId }: EmployeeLinkProps) {
  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee-by-rirekisho', rirekishoId],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/employees/by-rirekisho/${rirekishoId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error('Failed to fetch employee')
      }
      return response.json()
    },
    retry: false,
  })

  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Verificando empleado...</span>
      </div>
    )
  }

  if (!employee) {
    return null
  }

  return (
    <Link
      href={`/employees/${employee.id}`}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
      <span className="font-medium">Empleado #{employee.hakenmoto_id}</span>
    </Link>
  )
}
