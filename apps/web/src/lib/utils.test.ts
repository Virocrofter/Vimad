import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
  it('should merge class names', () => {
    const result = cn('class1', 'class2');
    expect(result).toBe('class1 class2');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const isHidden = false;
    const result = cn('base', isActive && 'conditional', isHidden && 'hidden');
    expect(result).toBe('base conditional');
  });

  it('should handle undefined and null', () => {
    const result = cn('base', undefined, null);
    expect(result).toBe('base');
  });

  it('should merge tailwind classes correctly', () => {
    const result = cn('px-2 py-1', 'px-4');
    expect(result).toBe('py-1 px-4');
  });
});
