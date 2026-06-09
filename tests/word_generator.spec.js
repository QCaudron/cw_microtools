import { test, expect } from '@playwright/test';

async function loadPage(page) {
  await page.goto('/word_generator.html');
  await page.waitForFunction('wordList.length > 0');
}

async function getGeneratedItems(page) {
  return page.$$eval('#generatedWordList li', els => els.map(e => e.textContent.trim()));
}

function onlyContains(word, letters) {
  const allowed = new Set(letters.map(l => l.toUpperCase()));
  return word.toUpperCase().split('').every(ch => allowed.has(ch));
}

// Checkbox inputs have display:none — set via evaluate to bypass visibility requirement.
async function checkLetter(page, letter) {
  await page.evaluate(l => {
    const cb = document.getElementById('checkbox' + l);
    cb.checked = true;
    cb.dispatchEvent(new Event('change', { bubbles: true }));
  }, letter);
}

// ── Letter selection ──────────────────────────────────────────────────────────

test.describe('Letter selection', () => {
  test('select A, T — all words contain only A or T', async ({ page }) => {
    // "at" is the only 2+ char word in the default top-1000 list made from just A and T
    await loadPage(page);
    await page.click('button:has-text("Select None")');
    await checkLetter(page, 'A');
    await checkLetter(page, 'T');
    await page.click('.button-go');
    const items = await getGeneratedItems(page);
    expect(items.length).toBeGreaterThan(0);
    for (const word of items) {
      expect(onlyContains(word, ['A', 'T']), `"${word}" contains disallowed letters`).toBe(true);
    }
  });

  test('select T, H, E — all words use only those letters', async ({ page }) => {
    await loadPage(page);
    await page.click('button:has-text("Select None")');
    await checkLetter(page, 'T');
    await checkLetter(page, 'H');
    await checkLetter(page, 'E');
    await page.click('.button-go');
    const items = await getGeneratedItems(page);
    expect(items.length).toBeGreaterThan(0);
    for (const word of items) {
      expect(onlyContains(word, ['T', 'H', 'E']), `"${word}" contains disallowed letters`).toBe(true);
    }
  });

  test('select none — produces no results', async ({ page }) => {
    await loadPage(page);
    await page.click('button:has-text("Select None")');
    await page.click('.button-go');
    const items = await getGeneratedItems(page);
    expect(items.length).toBe(0);
  });

  test('select all — produces results', async ({ page }) => {
    await loadPage(page);
    await page.click('button:has-text("Select All")');
    await page.click('.button-go');
    const items = await getGeneratedItems(page);
    expect(items.length).toBeGreaterThan(0);
  });
});

// ── Length filter ─────────────────────────────────────────────────────────────

test.describe('Length filter', () => {
  test('min=3 max=4 — all words are 3 or 4 characters', async ({ page }) => {
    await loadPage(page);
    await page.click('button:has-text("Select All")');
    await page.fill('#minChars', '3');
    await page.fill('#maxChars', '4');
    await page.click('.button-go');
    const items = await getGeneratedItems(page);
    expect(items.length).toBeGreaterThan(0);
    for (const word of items) {
      expect(word.length, `"${word}" length out of range`).toBeGreaterThanOrEqual(3);
      expect(word.length, `"${word}" length out of range`).toBeLessThanOrEqual(4);
    }
  });

  test('min=5 max=5 — all words are exactly 5 characters', async ({ page }) => {
    await loadPage(page);
    await page.click('button:has-text("Select All")');
    await page.fill('#minChars', '5');
    await page.fill('#maxChars', '5');
    await page.click('.button-go');
    const items = await getGeneratedItems(page);
    expect(items.length).toBeGreaterThan(0);
    for (const word of items) {
      expect(word.length, `"${word}" is not 5 chars`).toBe(5);
    }
  });
});

// ── Subset preset buttons ─────────────────────────────────────────────────────

// Koch BC1 = REA + TIN + PSG + LCD + HOF + UWB (18 letters, no K/M/Y/Q/X/V/Z/J)
const BC1 = ['R','E','A','T','I','N','P','S','G','L','C','D','H','O','F','U','W','B'];
// Each subset selects its own group plus earlier groups (cumulative Koch order):
//   REA  → REA + UWB + HOF
//   TIN  → TIN + REA + UWB
//   KMY  → KMY + all BC1
const REA_ALLOWED = ['R','E','A','U','W','B','H','O','F'];
const TIN_ALLOWED = ['T','I','N','R','E','A','U','W','B'];
const KMY_ALLOWED = ['K','M','Y',...BC1];

test.describe('Subset buttons', () => {
  test('BC1 button checks correct letters', async ({ page }) => {
    await loadPage(page);
    await page.click('button:has-text("Select None")');
    await page.click('button:has-text("All BC1")');
    for (const letter of BC1) {
      await expect(page.locator(`#checkbox${letter}`)).toBeChecked();
    }
    // K, M, Y are not in BC1
    for (const letter of ['K', 'M', 'Y']) {
      await expect(page.locator(`#checkbox${letter}`)).not.toBeChecked();
    }
  });

  test('REA subset — output uses only REA+UWB+HOF letters', async ({ page }) => {
    await loadPage(page);
    await page.click('button:has-text("Select None")');
    await page.click('button:has-text("REA")');
    await page.click('.button-go');
    const items = await getGeneratedItems(page);
    for (const word of items) {
      expect(onlyContains(word, REA_ALLOWED), `"${word}" contains disallowed letters`).toBe(true);
    }
  });

  test('TIN subset — output uses only TIN+REA+UWB letters', async ({ page }) => {
    await loadPage(page);
    await page.click('button:has-text("Select None")');
    await page.click('button:has-text("TIN")');
    await page.click('.button-go');
    const items = await getGeneratedItems(page);
    for (const word of items) {
      expect(onlyContains(word, TIN_ALLOWED), `"${word}" contains disallowed letters`).toBe(true);
    }
  });

  test('KMY subset — output uses only KMY+BC1 letters', async ({ page }) => {
    await loadPage(page);
    await page.click('button:has-text("Select None")');
    await page.click('button:has-text("KMY")');
    await page.click('.button-go');
    const items = await getGeneratedItems(page);
    for (const word of items) {
      expect(onlyContains(word, KMY_ALLOWED), `"${word}" contains disallowed letters`).toBe(true);
    }
  });
});

// ── Count limit ───────────────────────────────────────────────────────────────

test.describe('Count limit', () => {
  test('max 5 words — returns at most 5 results', async ({ page }) => {
    await loadPage(page);
    await page.click('button:has-text("Select All")');
    await page.fill('#maxWords', '5');
    await page.click('.button-go');
    const items = await getGeneratedItems(page);
    expect(items.length).toBeLessThanOrEqual(5);
  });

  test('max 1 word — returns at most 1 result', async ({ page }) => {
    await loadPage(page);
    await page.click('button:has-text("Select All")');
    await page.fill('#maxWords', '1');
    await page.click('.button-go');
    const items = await getGeneratedItems(page);
    expect(items.length).toBeLessThanOrEqual(1);
  });
});
