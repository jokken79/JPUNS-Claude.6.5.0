'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MouseEvent, ReactNode, useState } from 'react';

export interface AnimatedLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  prefetchOnHover?: boolean;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * AnimatedLink - Link component with hover prefetching and smooth animations
 * 
 * Features:
 * - Prefetch on hover for faster navigation
 * - Smooth transitions
 * - Next.js Link wrapper with enhanced UX
 */
export function AnimatedLink({
  href,
  children,
  className = '',
  prefetchOnHover = false,
  onClick,
}: AnimatedLinkProps) {
  const router = useRouter();
  const [isPrefetching, setIsPrefetching] = useState(false);

  const handleMouseEnter = () => {
    if (prefetchOnHover && !isPrefetching) {
      setIsPrefetching(true);
      router.prefetch(href);
    }
  };

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Link
      href={href}
      className={`animated-link ${className}`}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      prefetch={false} // We handle prefetching manually
    >
      {children}
    </Link>
  );
}

export default AnimatedLink;
