const { chromium } = require('@playwright/test');
(async () => {
  const TOKEN = process.env.SESSION_TOKEN;
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  
  // Desktop: sidebar collapsed
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addCookies([{ name: 'next-auth.session-token', value: TOKEN, domain: 'localhost', path: '/', httpOnly: true, secure: false }]);
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForTimeout(2500);
  // Click the collapse button
  await page.click('button:has-text("Recolher")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'C:/Users/User/ss-sidebar-collapsed.png' });
  
  await browser.close();
  console.log('done');
})().catch(e => { console.error(e.message); process.exit(1); });
