'use client';

import EmployeeForm from '@/components/EmployeeForm';

export default function NewEmployeePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            新規従業員登録
          </h1>
          <p className="text-muted-foreground">
            従業員の情報を入力して登録してください
          </p>
        </div>

        {/* Form */}
        <EmployeeForm />
      </div>
    </div>
  );
}
