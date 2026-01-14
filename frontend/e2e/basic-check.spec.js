import { test, expect } from '@playwright/test';

test('Homepage loads without errors', async ({ page }) => {
  // 1. Go to your app
  await page.goto('http://localhost:5173');
  
  // 2. Check the main title loads
  await expect(page.getByText('Incident Response Platform')).toBeVisible();
  
  // 3. Check system status shows
  await expect(page.getByText('System Status')).toBeVisible();
});