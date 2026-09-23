import * as React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

function Skeleton({ className, ...props }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}

function SkeletonText({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn('h-4 w-full animate-pulse rounded-md bg-muted', className)} {...props} />
  );
}

export { Skeleton, SkeletonText };
