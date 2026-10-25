// Actual immutable Git Preview regression; never starts a local server.
// node scripts/revelation-contrast.preview.mjs /private/config.json /private/report.json
// Config mode0600: {origin, shareUrl, commit}. Revoke temporary access after QA.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';

const file = process.argv[2];
const stat = fs.statSync(file);
assert.ok(stat.isFile() && stat.size <= 16_384);
assert.equal(stat.mode & 0o777, 0o600);
const cfg = JSON.parse(fs.readFileSync(file, 'utf8'));
const address = new URL(cfg.origin);
assert.equal(address.origin, cfg.origin);
assert.equal(new URL(cfg.shareUrl).origin, cfg.origin);
assert.equal(address.protocol, 'https:');
assert.match(address.hostname, /^[a-z0-9-]+-[a-z0-9]{9}-[a-z0-9-]+\.vercel\.app$/);
assert.ok(!address.hostname.includes('-git-'));
assert.match(cfg.commit, /^[a-f0-9]{40}$/);
const result = { commit: cfg.commit, result: 'running', checks: [], errors: [], writes: 0, permissions: 0, subscriptions: 0 };
const paths = ['/revelation', '/revelation/jesus-and-worship', '/revelation/jesus-and-worship/verses/revelation-1-17-18'];
function luminance(color) {
  const channels = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(v => v / 255)
    .map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return channels.reduce((sum, value, i) => sum + value * [.2126, .7152, .0722][i], 0);
}
function contrast(a, b) {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
}
function safe(error) {
  return String(error.message).split(cfg.shareUrl).join('[private access]')
    .replace(/([?&]_vercel_share=)[^&\s)]+/gi, '$1[redacted]');
}
let browser;
try {
  const executablePath = process.env.REVELATION_CHROMIUM_EXECUTABLE || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  browser = await chromium.launch({ headless: true, chromiumSandbox: false,
    ...(executablePath ? { executablePath } : {}),
    ...(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {}) });
  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 900 }, colorScheme: theme });
    context.setDefaultTimeout(15_000);
    context.setDefaultNavigationTimeout(30_000);
    try {
      const auth = await context.request.get(cfg.shareUrl);
      assert.ok(auth.ok() && new URL(auth.url()).origin === cfg.origin);
      const response = await context.request.get(cfg.origin + '/health');
      assert.equal(response.status(), 200);
      const health = await response.json();
      assert.equal(health.commit, cfg.commit);
      assert.equal(health.surface, 'preview');
      await context.route(cfg.origin + '/api/**', route => {
        if (!['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())) {
          result.writes++;
          return route.abort();
        }
        return route.continue();
      });
      context.on('page', page => page.on('pageerror', error => result.errors.push(safe(error))));
      await context.exposeFunction('__contrastPermission', () => { result.permissions++; });
      await context.exposeFunction('__contrastSubscription', () => { result.subscriptions++; });
      await context.addInitScript(({ origin, theme }) => {
        if (location.origin !== origin) return;
        localStorage.setItem('bible-compass-theme', theme);
        sessionStorage.setItem('bible-compass-splash-seen', '1');
        if ('Notification' in window) Notification.requestPermission = async () => {
          await window.__contrastPermission(); return 'denied';
        };
        if ('PushManager' in window) PushManager.prototype.subscribe = async () => {
          await window.__contrastSubscription(); throw new Error('Contrast QA blocks subscriptions');
        };
      }, { origin: cfg.origin, theme });
      const page = await context.newPage();
      for (const path of paths) {
        const response = await page.goto(cfg.origin + path, { waitUntil: 'domcontentloaded' });
        assert.equal(response.status(), 200);
        const links = page.locator('article a.text-link');
        await expect(links.first()).toBeVisible();
        await page.keyboard.press('Tab');
        let measured = 0;
        for (const link of await links.all()) {
          if (!await link.isVisible()) continue;
          await link.focus();
          const css = await link.evaluate(node => {
            let parent = node;
            while (parent && getComputedStyle(parent).backgroundColor === 'rgba(0, 0, 0, 0)') parent = parent.parentElement;
            const style = getComputedStyle(node);
            return { color: style.color, outline: style.outlineColor, outlineStyle: style.outlineStyle,
              outlineWidth: parseFloat(style.outlineWidth), bg: getComputedStyle(parent || document.documentElement).backgroundColor };
          });
          result.checks.push({ theme, path, ...css, textRatio: contrast(css.color, css.bg), focusRatio: contrast(css.outline, css.bg) });
          measured++;
        }
        assert.ok(measured > 0, 'Each page must expose measured reading links');
        const captions = page.locator('article .bc-kicker');
        await expect(captions).toHaveCount(1);
        const css = await captions.evaluate(node => {
          let parent = node;
          while (parent && getComputedStyle(parent).backgroundColor === 'rgba(0, 0, 0, 0)') parent = parent.parentElement;
          return { color: getComputedStyle(node).color, bg: getComputedStyle(parent || document.documentElement).backgroundColor };
        });
        result.checks.push({ kind: 'caption', theme, path, ...css, textRatio: contrast(css.color, css.bg) });
      }
    } finally { await context.close(); }
  }
  assert.deepEqual(result.errors, []);
  assert.equal(result.writes + result.permissions + result.subscriptions, 0);
  result.result = result.checks.every(x => x.textRatio >= 4.5 && (x.kind === 'caption' ||
    (x.focusRatio >= 3 && x.outlineStyle !== 'none' && x.outlineWidth >= 2))) ? 'passed' : 'failed';
  if (result.result !== 'passed') process.exitCode = 1;
} catch (error) {
  result.result = 'failed'; result.errors.push(safe(error)); process.exitCode = 1;
} finally {
  await browser?.close();
  fs.writeFileSync(process.argv[3], JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ commit: result.commit, result: result.result, checks: result.checks.length, errors: result.errors }));
}
