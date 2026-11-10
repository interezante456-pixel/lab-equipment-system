import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tools/playwright',
  timeout: 30_000,
  use: {
    browserName: 'chromium',
    headless: true,
    screenshot: 'only-on-failure',
  },
});
