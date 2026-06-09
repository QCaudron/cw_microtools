import { test, expect } from '@playwright/test';

async function loadPage(page) {
  await page.goto('/sentence_generator.html');
  await page.waitForFunction('sentenceList.length > 0');
}

async function getGeneratedItems(page) {
  return page.$$eval('#generatedSentenceList li', els => els.map(e => e.textContent.trim()));
}

function onlyContains(text, letters) {
  const allowed = new Set(letters.map(l => l.toUpperCase()));
  // sentence_generator always permits spaces and common punctuation alongside letter checks
  const alwaysAllowed = new Set([' ', '.', ',', '!', '?']);
  return text.toUpperCase().split('').every(ch => alwaysAllowed.has(ch) || allowed.has(ch));
}

// Checkbox inputs have display:none — set via evaluate to bypass visibility requirement.
async function checkLetter(page, letter) {
  await page.evaluate(l => {
    const cb = document.getElementById('checkbox' + l);
    cb.checked = true;
    cb.dispatchEvent(new Event('change', { bubbles: true }));
  }, letter);
}

// Koch BC1 = REA + TIN + PSG + LCD + HOF + UWB (18 letters, no K/M/Y/Q/X/V/Z/J)
const BC1 = ['R','E','A','T','I','N','P','S','G','L','C','D','H','O','F','U','W','B'];
// Each subset selects its own group plus BC1 (cumulative):
//   KMY  → KMY + all BC1
//   QXV  → QXV + all BC1
//   ZJ   → ZJ  + all BC1
const KMY_ALLOWED = ['K','M','Y',...BC1];
const QXV_ALLOWED = ['Q','X','V',...BC1];
const ZJ_ALLOWED  = ['Z','J',...BC1];

// ── Letter selection ──────────────────────────────────────────────────────────

test.describe('Letter selection', () => {
  test('select H, I, O, P — output uses only those letters', async ({ page }) => {
    // "I hop hop." is in the sentence list and uses only H, I, O, P (+ space/punctuation)
    await loadPage(page);
    await page.click('button:has-text("Select None")');
    for (const l of ['H', 'I', 'O', 'P']) await checkLetter(page, l);
    await page.click('.button-go');
    const items = await getGeneratedItems(page);
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(onlyContains(item, ['H', 'I', 'O', 'P']), `"${item}" contains disallowed letters`).toBe(true);
    }
  });

  test('select H, I, O, S, T — output uses only those letters', async ({ page }) => {
    // "It is hot." is in the sentence list and uses only H, I, O, S, T (+ space/punctuation)
    await loadPage(page);
    await page.click('button:has-text("Select None")');
    for (const l of ['H', 'I', 'O', 'S', 'T']) await checkLetter(page, l);
    await page.click('.button-go');
    const items = await getGeneratedItems(page);
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(onlyContains(item, ['H', 'I', 'O', 'S', 'T']), `"${item}" contains disallowed letters`).toBe(true);
    }
  });

  test('select none then generate — produces no results', async ({ page }) => {
    await loadPage(page);
    await page.click('button:has-text("Select None")');
    await page.click('.button-go');
    const items = await getGeneratedItems(page);
    expect(items.length).toBe(0);
  });

  test('select all then generate — produces results', async ({ page }) => {
    await loadPage(page);
    await page.click('button:has-text("Select All")');
    await page.click('.button-go');
    const items = await getGeneratedItems(page);
    expect(items.length).toBeGreaterThan(0);
  });
});

// ── Subset preset buttons ─────────────────────────────────────────────────────

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

  test('KMY subset generates output using only KMY+BC1 letters', async ({ page }) => {
    await loadPage(page);
    await page.click('button:has-text("Select None")');
    await page.click('button:has-text("KMY")');
    await page.click('.button-go');
    const items = await getGeneratedItems(page);
    for (const item of items) {
      expect(onlyContains(item, KMY_ALLOWED), `"${item}" contains disallowed letters`).toBe(true);
    }
  });

  test('QXV subset generates output using only QXV+BC1 letters', async ({ page }) => {
    await loadPage(page);
    await page.click('button:has-text("Select None")');
    await page.click('button:has-text("QXV")');
    await page.click('.button-go');
    const items = await getGeneratedItems(page);
    for (const item of items) {
      expect(onlyContains(item, QXV_ALLOWED), `"${item}" contains disallowed letters`).toBe(true);
    }
  });

  test('ZJ subset generates output using only ZJ+BC1 letters', async ({ page }) => {
    await loadPage(page);
    await page.click('button:has-text("Select None")');
    await page.click('button:has-text("ZJ")');
    await page.click('.button-go');
    const items = await getGeneratedItems(page);
    for (const item of items) {
      expect(onlyContains(item, ZJ_ALLOWED), `"${item}" contains disallowed letters`).toBe(true);
    }
  });
});

// ── Count limit ───────────────────────────────────────────────────────────────

test.describe('Count limit', () => {
  test('max 3 sentences — returns at most 3 results', async ({ page }) => {
    await loadPage(page);
    await page.click('button:has-text("Select All")');
    await page.fill('#maxSentences', '3');
    await page.click('.button-go');
    const items = await getGeneratedItems(page);
    expect(items.length).toBeLessThanOrEqual(3);
  });

  test('max 1 sentence — returns exactly 1 result', async ({ page }) => {
    await loadPage(page);
    await page.click('button:has-text("Select All")');
    await page.fill('#maxSentences', '1');
    await page.click('.button-go');
    const items = await getGeneratedItems(page);
    expect(items.length).toBe(1);
  });

  test('results are sorted shortest to longest', async ({ page }) => {
    await loadPage(page);
    await page.click('button:has-text("Select All")');
    await page.fill('#maxSentences', '10');
    await page.click('.button-go');
    const items = await getGeneratedItems(page);
    for (let i = 1; i < items.length; i++) {
      expect(items[i].length).toBeGreaterThanOrEqual(items[i - 1].length);
    }
  });
});
