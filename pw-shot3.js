const { chromium } = require('@playwright/test');
(async () => {
  const TOKEN = process.env.SESSION_TOKEN;
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addCookies([{ name: 'next-auth.session-token', value: TOKEN, domain: 'localhost', path: '/', httpOnly: true, secure: false }]);
  const page = await ctx.newPage();

  // Dashboard - new skeleton + KPI hierarchy
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'C:/Users/User/ss-new-dashboard.png' });

  // Clients - sparklines + adaptive table + empty state
  await page.goto('http://localhost:3000/dashboard/clients');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'C:/Users/User/ss-new-clients.png' });

  // Finances - adaptive table + empty state skeleton
  await page.goto('http://localhost:3000/dashboard/finances');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'C:/Users/User/ss-new-finances.png' });

  // Command palette open
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForTimeout(1500);
  await page.keyboard.press('Meta+k');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'C:/Users/User/ss-command-palette.png' });

  // Type in command palette
  await page.keyboard.type('joão');
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'C:/Users/User/ss-command-search.png' });

  // Mobile clients with adaptive table
  const mob = await ctx.newPage();
  await mob.setViewportSize({ width: 390, height: 844 });
  await mob.goto('http://localhost:3000/dashboard/clients');
  await mob.waitForTimeout(2000);
  await mob.screenshot({ path: 'C:/Users/User/ss-mobile-clients.png' });

  await browser.close();
  console.log('done');
})().catch(e => { console.error(e.message); process.exit(1); });
