import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'./examples/page-archetypes/tests', testMatch:'dashboard.spec.ts', timeout:45000,
  fullyParallel:false, workers:1,
  use:{baseURL:'http://127.0.0.1:4188',browserName:'chromium',trace:'retain-on-failure'},
  outputDir:'test-results/dashboards',
  webServer:{command:'python3 -m http.server 4188 --bind 127.0.0.1 --directory dashboard-test-dist',port:4188,reuseExistingServer:false}
});
