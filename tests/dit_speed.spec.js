import { test, expect } from '@playwright/test';

// PARIS: 50 dits/word  → dit = 60000 / (wpm × 50) = 1200 / wpm
// CODEX: 60 dits/word  → dit = 60000 / (wpm × 60) = 1000 / wpm
// dah = weight × dit   (default weight = 3)

async function loadPage(page) {
  await page.goto('/dit_speed.html');
}

async function getValue(page, id) {
  return page.$eval(`#${id}`, el => el.value);
}

async function clear(page) {
  await page.click('button:has-text("Clear")');
}

// ── WPM → dit / dah ───────────────────────────────────────────────────────────

test.describe('From WPM', () => {
  test('20 WPM, PARIS → dit 60.0 ms, dah 180.0 ms', async ({ page }) => {
    await loadPage(page);
    await page.fill('#wpm', '20');
    await page.click('button:has-text("Calculate")');
    expect(await getValue(page, 'dit')).toBe('60.0');
    expect(await getValue(page, 'dah')).toBe('180.0');
  });

  test('25 WPM, PARIS → dit 48.0 ms, dah 144.0 ms', async ({ page }) => {
    await loadPage(page);
    await page.fill('#wpm', '25');
    await page.click('button:has-text("Calculate")');
    expect(await getValue(page, 'dit')).toBe('48.0');
    expect(await getValue(page, 'dah')).toBe('144.0');
  });

  test('20 WPM, CODEX → dit 50.0 ms, dah 150.0 ms', async ({ page }) => {
    await loadPage(page);
    await page.selectOption('#word', 'CODEX');
    await page.fill('#wpm', '20');
    await page.click('button:has-text("Calculate")');
    expect(await getValue(page, 'dit')).toBe('50.0');
    expect(await getValue(page, 'dah')).toBe('150.0');
  });

  test('30 WPM, PARIS → dit 40.0 ms, dah 120.0 ms', async ({ page }) => {
    await loadPage(page);
    await page.fill('#wpm', '30');
    await page.click('button:has-text("Calculate")');
    expect(await getValue(page, 'dit')).toBe('40.0');
    expect(await getValue(page, 'dah')).toBe('120.0');
  });
});

// ── dit → WPM / dah ──────────────────────────────────────────────────────────

test.describe('From dit', () => {
  test('dit 60 ms, PARIS → WPM 20.0, dah 180.0 ms', async ({ page }) => {
    await loadPage(page);
    await page.fill('#dit', '60');
    await page.click('button:has-text("Calculate")');
    expect(await getValue(page, 'wpm')).toBe('20.0');
    expect(await getValue(page, 'dah')).toBe('180.0');
  });

  test('dit 50 ms, CODEX → WPM 20.0, dah 150.0 ms', async ({ page }) => {
    await loadPage(page);
    await page.selectOption('#word', 'CODEX');
    await page.fill('#dit', '50');
    await page.click('button:has-text("Calculate")');
    expect(await getValue(page, 'wpm')).toBe('20.0');
    expect(await getValue(page, 'dah')).toBe('150.0');
  });

  test('dit 48 ms, PARIS → WPM 25.0, dah 144.0 ms', async ({ page }) => {
    await loadPage(page);
    await page.fill('#dit', '48');
    await page.click('button:has-text("Calculate")');
    expect(await getValue(page, 'wpm')).toBe('25.0');
    expect(await getValue(page, 'dah')).toBe('144.0');
  });
});

// ── dah → WPM / dit ──────────────────────────────────────────────────────────

test.describe('From dah', () => {
  test('dah 180 ms, PARIS, weight 3 → WPM 20.0, dit 60.0 ms', async ({ page }) => {
    await loadPage(page);
    await page.fill('#dah', '180');
    await page.click('button:has-text("Calculate")');
    expect(await getValue(page, 'wpm')).toBe('20.0');
    expect(await getValue(page, 'dit')).toBe('60.0');
  });

  test('dah 144 ms, PARIS, weight 3 → WPM 25.0, dit 48.0 ms', async ({ page }) => {
    await loadPage(page);
    await page.fill('#dah', '144');
    await page.click('button:has-text("Calculate")');
    expect(await getValue(page, 'wpm')).toBe('25.0');
    expect(await getValue(page, 'dit')).toBe('48.0');
  });
});

// ── Custom weight ─────────────────────────────────────────────────────────────

test.describe('Custom weight', () => {
  test('WPM 20, PARIS, weight 4 → dit 60.0, dah 240.0', async ({ page }) => {
    await loadPage(page);
    await page.fill('#weight', '4');
    await page.fill('#wpm', '20');
    await page.click('button:has-text("Calculate")');
    expect(await getValue(page, 'dit')).toBe('60.0');
    expect(await getValue(page, 'dah')).toBe('240.0');
  });

  test('dit 60, PARIS, weight 4 → WPM 20.0, dah 240.0', async ({ page }) => {
    await loadPage(page);
    await page.fill('#weight', '4');
    await page.fill('#dit', '60');
    await page.click('button:has-text("Calculate")');
    expect(await getValue(page, 'wpm')).toBe('20.0');
    expect(await getValue(page, 'dah')).toBe('240.0');
  });
});

// ── Input validation ──────────────────────────────────────────────────────────

test.describe('Input validation', () => {
  test('two fields filled → shows alert', async ({ page }) => {
    await loadPage(page);
    let alerted = false;
    page.on('dialog', async dialog => { alerted = true; await dialog.dismiss(); });
    await page.fill('#wpm', '20');
    await page.fill('#dit', '60');
    await page.click('button:has-text("Calculate")');
    expect(alerted).toBe(true);
  });

  test('clear button resets all fields to defaults', async ({ page }) => {
    await loadPage(page);
    await page.fill('#wpm', '20');
    await page.fill('#dit', '60');
    await page.fill('#dah', '180');
    await page.fill('#weight', '5');
    await page.click('button:has-text("Clear")');
    expect(await getValue(page, 'wpm')).toBe('');
    expect(await getValue(page, 'dit')).toBe('');
    expect(await getValue(page, 'dah')).toBe('');
    expect(await getValue(page, 'weight')).toBe('3');
    expect(await getValue(page, 'word')).toBe('PARIS');
  });

  test('empty weight defaults to 3 and still calculates', async ({ page }) => {
    await loadPage(page);
    await page.fill('#weight', '');
    await page.fill('#wpm', '20');
    await page.click('button:has-text("Calculate")');
    expect(await getValue(page, 'dit')).toBe('60.0');
    expect(await getValue(page, 'dah')).toBe('180.0');
  });
});
