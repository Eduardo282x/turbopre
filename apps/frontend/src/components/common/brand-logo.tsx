import logo from '@/assets/brand/logo.png';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  className?: string;
  alt?: string;
}

export function BrandLogo({ className, alt = 'TurboPre' }: BrandLogoProps) {
  return (
    <img
      src={logo}
      alt={alt}
      className={cn('h-9 w-auto object-contain dark:brightness-0 dark:invert', className)}
    />
  );
}
