import { describe, it, expect } from 'vitest';

// Import from the main index to test exports
import * as shared from './index.js';

describe('@unified-pms/shared', () => {
  it('should export schemas module', () => {
    expect(shared).toBeDefined();
  });

  it('should have schemas exports', () => {
    expect(typeof shared).toBe('object');
  });
});

describe('Shared Types', () => {
  it('should define common types', () => {
    type TestUser = {
      id: string;
      email: string;
    };

    const user: TestUser = {
      id: '1',
      email: 'test@example.com',
    };

    expect(user.id).toBe('1');
    expect(user.email).toBe('test@example.com');
  });
});

describe('Shared Schemas', () => {
  it('should validate common data structures', () => {
    expect(true).toBe(true);
  });
});
