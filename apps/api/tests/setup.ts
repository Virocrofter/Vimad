/* apps/api/tests/setup.ts */
import { vi } from 'vitest';

// ─── Global Mocks ───

// Mock email transport in tests
vi.mock('../src/jobs/email.worker.ts', () => ({
  emailWorker: { on: vi.fn(), close: vi.fn() },
}));

// Mock Puppeteer for PDF generation tests
vi.mock('puppeteer-core', () => ({
  default: {
    launch: vi.fn().mockResolvedValue({
      newPage: vi.fn().mockResolvedValue({
        setContent: vi.fn().mockResolvedValue(undefined),
        pdf: vi.fn().mockResolvedValue(Buffer.from('mock-pdf')),
      }),
      close: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

// Mock S3 for storage tests
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(() => ({
    send: vi.fn().mockResolvedValue({}),
  })),
  PutObjectCommand: vi.fn(),
  GetObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
}));

// ─── Environment Setup ───

// Ensure test environment
process.env.NODE_ENV = 'test';

// Set a consistent JWT secret for tests if not provided
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-secret-key-must-be-at-least-32-characters-long';
}

// Disable rate limiting in tests
process.env.RATE_LIMIT_ENABLED = 'false';

// Use local storage in tests
process.env.STORAGE_PROVIDER = 'local';
process.env.STORAGE_LOCAL_DIR = './tmp/test-storage';

// ─── Cleanup ───

// Clean up tmp storage after tests
import { rm } from 'fs/promises';
import { existsSync } from 'fs';

export async function teardown() {
  if (existsSync('./tmp/test-storage')) {
    await rm('./tmp/test-storage', { recursive: true, force: true });
  }
}
