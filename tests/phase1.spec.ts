import { expect, test } from '@playwright/test';

test('phase 1 arena renders with HUD and debug toggle', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#hud-root')).toContainText('Vix');
  await expect(page.locator('#hud-root')).toContainText('Carter');
  await page.keyboard.press('KeyH');
  await expect(page.locator('#debug-log')).toBeVisible();
  await expect(page.locator('#debug-log')).toContainText('Proof Log');
  await expect(page.locator('canvas')).toBeVisible();
  await page.screenshot({ path: 'test-results/phase1-arena.png', fullPage: true });
});
