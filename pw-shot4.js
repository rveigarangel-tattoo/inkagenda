const { chromium } = require('@playwright/test');
(async () => {
  const TOKEN = process.env.SESSION_TOKEN;
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addCookies([{ name: 'next-auth.session-token', value: TOKEN, domain: 'localhost', path: '/', httpOnly: true, secure: false }]);
  const page = await ctx.newPage();

  await page.goto('http://localhost:3000/dashboard/schedule');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // week view
  await page.screenshot({ path: 'C:/Users/User/ss-cal-week.png' });

  // team view
  const teamBtn = page.locator('button', { hasText: 'Equipe' });
  await teamBtn.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'C:/Users/User/ss-cal-team.png' });

  // back to week + block mode
  await page.locator('button', { hasText: 'Semana' }).click();
  await page.waitForTimeout(500);
  await page.locator('button', { hasText: 'Bloquear' }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'C:/Users/User/ss-cal-blockmode.png' });
  
  // turn off block mode and hover on first appointment
  await page.locator('button', { hasText: 'Bloqueando' }).click();
  await page.waitForTimeout(300);
  const firstAppt = page.locator('.absolute.rounded-md').first();
  await firstAppt.hover();
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'C:/Users/User/ss-cal-hover.png' });

  await browser.close();
  console.log('done');
})().catch(e => { console.error(e.message); process.exit(1); });
