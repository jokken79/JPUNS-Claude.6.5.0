'use client';

import { UnderConstruction } from '@/components/ui/under-construction';

export default function UnderConstructionPage() {
  return (
    <UnderConstruction
      pageName="サンプル機能"
      customMessage="この機能は現在開発中です。自動的に有効化されるまでしばらくお待ちください。"
      estimatedDate="2025年12月予定"
    />
  );
}
