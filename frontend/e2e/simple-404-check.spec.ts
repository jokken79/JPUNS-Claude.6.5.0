import { test, expect } from '@playwright/test';

test.describe('Dashboard Routes 404 Check', () => {
  const routes = [
    '/dashboard',
    '/dashboard/candidates',
    '/dashboard/employees',
    '/dashboard/factories',
    '/dashboard/timercards',
    '/dashboard/salary',
    '/dashboard/requests',
    '/dashboard/admin/control-panel',
    '/dashboard/profile',
    '/dashboard/settings',
    '/search?q=test',
  ];

  for (const route of routes) {
    test(route + ' should not return 404', async ({ page }) => {
      const response = await page.goto(route, { timeout: 30000 });
      const status = response?.status() || 0;
      
      console.log('Testing ' + route + ' - Status: ' + status);
      
      expect(status).not.toBe(404);
      
      const has404 = await page.locator('text=/404|not found|page not found/i')
        .isVisible()
        .catch(() => false);
      
      expect(has404).toBe(false);
      
      const screenshotName = route.replace(/\//g, '-').replace(/\?/g, '_').substring(1) || 'root';
      await page.screenshot({ 
        path: '/home/user/JPUNS-Claude.6.5.0/frontend/screenshots/' + screenshotName + '.png'
      });
    });
  }
});
