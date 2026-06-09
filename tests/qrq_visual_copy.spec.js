import { test, expect } from '@playwright/test';

async function loadPage(page) {
  await page.goto('/qrq_visual_copy.html');
  await page.waitForFunction('wordList.length > 0');
}

async function setSlider(page, id, value) {
  await page.evaluate(({ id, value }) => {
    const el = document.getElementById(id);
    el.value = value;
    el.dispatchEvent(new Event('input'));
  }, { id, value });
}

// Use the fastest possible timings to keep tests quick
async function setMinTimings(page) {
  await setSlider(page, 'charDuration', 25);   // min: 25 ms per character
  await setSlider(page, 'charSpace',    0);    // min: 0 ms between characters
  await setSlider(page, 'reveal',       200);  // min: 200 ms before word reveal
}

async function sendAndWaitForReveal(page, wordLength) {
  // Budget: wordLength × 25ms (chars) + 200ms (reveal) + generous overhead
  const timeout = wordLength * 25 + 200 + 2000;
  await page.click('.button-go');
  await page.waitForFunction(
    wordLen => document.getElementById('sentWord').textContent.trim().length === wordLen,
    wordLength,
    { timeout },
  );
  return page.$eval('#sentWord', el => el.textContent.trim());
}

// ── Basic behaviour ───────────────────────────────────────────────────────────

test.describe('Basic behaviour', () => {
  test('clicking Send a word reveals a word', async ({ page }) => {
    await loadPage(page);
    await setMinTimings(page);
    await page.fill('#minChars', '4');
    await page.fill('#maxChars', '4');
    const word = await sendAndWaitForReveal(page, 4);
    expect(word.length).toBe(4);
  });

  test('revealed word contains only A–Z characters', async ({ page }) => {
    await loadPage(page);
    await setMinTimings(page);
    await page.fill('#minChars', '4');
    await page.fill('#maxChars', '4');
    const word = await sendAndWaitForReveal(page, 4);
    expect(word).toMatch(/^[A-Z]+$/i);
  });
});

// ── Word length constraints ───────────────────────────────────────────────────

test.describe('Word length constraints', () => {
  test('min=max=3 — reveals exactly a 3-character word', async ({ page }) => {
    await loadPage(page);
    await setMinTimings(page);
    await page.fill('#minChars', '3');
    await page.fill('#maxChars', '3');
    const word = await sendAndWaitForReveal(page, 3);
    expect(word.length).toBe(3);
  });

  test('min=max=5 — reveals exactly a 5-character word', async ({ page }) => {
    await loadPage(page);
    await setMinTimings(page);
    await page.fill('#minChars', '5');
    await page.fill('#maxChars', '5');
    const word = await sendAndWaitForReveal(page, 5);
    expect(word.length).toBe(5);
  });

  test('min=3 max=6 — revealed word length within range', async ({ page }) => {
    await loadPage(page);
    await setMinTimings(page);
    await page.fill('#minChars', '3');
    await page.fill('#maxChars', '6');
    await page.click('.button-go');
    // Wait for any non-empty reveal
    await page.waitForFunction(
      () => document.getElementById('sentWord').textContent.trim().length >= 3,
      { timeout: 4000 },
    );
    const word = await page.$eval('#sentWord', el => el.textContent.trim());
    expect(word.length).toBeGreaterThanOrEqual(3);
    expect(word.length).toBeLessThanOrEqual(6);
  });
});

// ── Slider display values ─────────────────────────────────────────────────────

test.describe('Slider labels update', () => {
  test('charDuration slider updates its display value', async ({ page }) => {
    await loadPage(page);
    await setSlider(page, 'charDuration', 150);
    await expect(page.locator('#charDurationValue')).toHaveText('150');
  });

  test('charSpace slider updates its display value', async ({ page }) => {
    await loadPage(page);
    await setSlider(page, 'charSpace', 80);
    await expect(page.locator('#charSpaceValue')).toHaveText('80');
  });

  test('reveal slider updates its display value', async ({ page }) => {
    await loadPage(page);
    await setSlider(page, 'reveal', 1000);
    await expect(page.locator('#revealValue')).toHaveText('1000');
  });
});
