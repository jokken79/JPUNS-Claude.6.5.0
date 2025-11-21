'use client';

import { useParams } from 'next/navigation';
import EmployeeForm from '@/components/EmployeeForm';

export default function EditEmployeePage() {
  const params = useParams();
  const id = params?.id as string;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            従業員情報編集
          </h1>
          <p className="text-muted-foreground">
            従業員ID: {id}
          </p>
        </div>

        {/* Form */}
        <EmployeeForm employeeId={id} isEdit={true} />
      </div>
    </div>
  );
}
