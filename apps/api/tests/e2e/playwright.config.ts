import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';
const API_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3001';
const CI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: !CI,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'playwright-report/junit.xml' }],
    ['list'],
  ],
  use: {
    baseURL: BASE_URL,
    apiURL: API_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, dependencies: ['setup'] },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, dependencies: ['setup'] },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, dependencies: ['setup'] },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] }, dependencies: ['setup'] },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] }, dependencies: ['setup'] },
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
  ],
  globalSetup: require.resolve('./e2e/global-setup.ts'),
  globalTeardown: require.resolve('./e2e/global-teardown.ts'),
});
