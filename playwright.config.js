import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://127.0.0.1:8765',
  },
  webServer: {
    command: 'npx http-server . -p 8765 --silent -c-1',
    url: 'http://127.0.0.1:8765',
    reuseExistingServer: true,
  },
});
