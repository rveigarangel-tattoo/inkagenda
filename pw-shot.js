const { chromium } = require('@playwright/test');
(async () => {
  const TOKEN = process.env.SESSION_TOKEN;
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addCookies([{ name: 'next-auth.session-token', value: TOKEN, domain: 'localhost', path: '/', httpOnly: true, secure: false }]);
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'C:/Users/User/ss-dashboard.png' });
  const mob = await ctx.newPage();
  await mob.setViewportSize({ width: 390, height: 844 });
  await mob.goto('http://localhost:3000/dashboard');
  await mob.waitForTimeout(2000);
  await mob.screenshot({ path: 'C:/Users/User/ss-mobile.png' });
  await browser.close();
  console.log('done');
})().catch(e => { console.error(e.message); process.exit(1); });
