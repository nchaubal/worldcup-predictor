import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/World Cup/i);
});

test('predict page loads', async ({ page }) => {
  await page.goto('/predict');
  await expect(page.locator('body')).toBeVisible();
});

test('bracket page loads', async ({ page }) => {
  await page.goto('/bracket');
  await expect(page.locator('body')).toBeVisible();
});
