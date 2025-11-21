'use client';

import Image from 'next/image';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CandidatePhotoProps {
  photoDataUrl?: string | null;
  photoUrl?: string | null;
  candidateName?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-16 h-16 min-w-16 min-h-16',
  md: 'w-24 h-24 min-w-24 min-h-24',
  lg: 'w-48 h-64 min-w-48 min-h-64'
};

const iconSizes = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-24 h-32'
};

export function CandidatePhoto({
  photoDataUrl,
  photoUrl,
  candidateName = '候補者',
  className,
  size = 'md'
}: CandidatePhotoProps) {
  const imageSource = photoDataUrl || photoUrl;

  if (!imageSource) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted rounded-lg border border-dashed',
          sizeClasses[size],
          className
        )}
      >
        <User className={cn('text-muted-foreground', iconSizes[size])} />
      </div>
    );
  }

  // Check if it's a data URL or regular URL
  if (photoDataUrl?.startsWith('data:image')) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-lg border border-border',
          sizeClasses[size],
          className
        )}
      >
        <img
          src={photoDataUrl}
          alt={candidateName}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Regular image URL using Next.js Image
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-border',
        sizeClasses[size],
        className
      )}
    >
      <Image
        src={photoUrl || photoDataUrl || ''}
        alt={candidateName}
        fill
        className="object-cover"
        sizes={
          size === 'sm' ? '64px' : size === 'md' ? '96px' : '192px'
        }
        priority={false}
      />
    </div>
  );
}
