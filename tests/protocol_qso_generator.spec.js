import { test, expect } from '@playwright/test';

const YOUR  = { call: 'K7DRQ', name: 'QUENTIN', qth: 'CO' };
const THEIR = { call: 'W1AW',  name: 'HIRAM',   qth: 'CT' };

async function loadPage(page) {
  await page.goto('/protocol_qso_generator.html');
  await page.waitForFunction(
    'allProtocols != null && typeof usCities !== "undefined" && usCities != null',
  );
}

async function fillForm(page, protocol, leading, your, their) {
  await page.selectOption('#qsoType', protocol);
  await page.selectOption('#leading', leading);
  await page.fill('#yourCall',  your.call);
  await page.fill('#yourName',  your.name);
  await page.fill('#yourQTH',   your.qth);
  await page.fill('#theirCall', their.call);
  await page.fill('#theirName', their.name);
  await page.fill('#theirQTH',  their.qth);
  await page.click('.button-go');
}

async function getLines(page) {
  return page.$$eval(
    '#qsoTable tr.lineRow',
    rows => rows.map(r => r.textContent.trim().toUpperCase()),
  );
}

function assertNoRawTokens(lines) {
  const joined = lines.join(' ');
  for (const token of ['<CQ', '<CALLER', '<GREETING']) {
    expect(joined, `Unreplaced token ${token}`).not.toContain(token);
  }
}

// ── Protocol 1 ────────────────────────────────────────────────────────────────

test.describe('Protocol 1', () => {
  test('leading — callsigns, QTH, name, RST all substituted', async ({ page }) => {
    await loadPage(page);
    await fillForm(page, 'protocol1', 'me', YOUR, THEIR);
    const ls = await getLines(page);

    expect(ls[0]).toContain('CQ CQ DE K7DRQ K7DRQ K');
    expect(ls[1]).toContain('K7DRQ');
    expect(ls[1]).toContain('W1AW');
    expect(ls[2]).toContain('W1AW');
    expect(ls[2]).toContain('K7DRQ');
    expect(ls[5]).toContain('QTH CO CO');
    expect(ls[6]).toContain('NAME QUENTIN QUENTIN');
    expect(ls[7]).toContain('W1AW');
    expect(ls[7]).toContain('K7DRQ');
    expect(ls[11]).toContain('QTH CT CT');
    expect(ls[12]).toContain('NAME HIRAM HIRAM');
    expect(ls[13]).toContain('K7DRQ');
    expect(ls[13]).toContain('W1AW');
    assertNoRawTokens(ls);
  });

  test('answering — roles swapped correctly', async ({ page }) => {
    await loadPage(page);
    await fillForm(page, 'protocol1', 'other', YOUR, THEIR);
    const ls = await getLines(page);

    expect(ls[0]).toContain('W1AW');
    expect(ls[0]).not.toContain('K7DRQ');
    expect(ls[5]).toContain('CT CT');
    expect(ls[6]).toContain('HIRAM HIRAM');
    expect(ls[11]).toContain('CO CO');
    expect(ls[12]).toContain('QUENTIN QUENTIN');
  });
});

// ── Protocol 2 ────────────────────────────────────────────────────────────────

test.describe('Protocol 2', () => {
  test('leading — rig, antenna, WX tokens all substituted', async ({ page }) => {
    await loadPage(page);
    await fillForm(page, 'protocol2', 'me', YOUR, THEIR);
    const ls = await getLines(page);

    expect(ls[0]).toContain('HIRAM');
    expect(ls[1]).toContain('RIG ');
    expect(ls[1]).toContain('PWR ');
    expect(ls[1]).toContain('W');
    expect(ls[2]).toContain('ANT ');
    expect(ls[2]).toContain('FT');
    expect(ls[3]).toContain('WX ');
    expect(ls[3]).toContain('TEMP ');
    expect(ls[3]).toContain('F');
    expect(ls[4]).toContain('W1AW');
    expect(ls[4]).toContain('K7DRQ');
    assertNoRawTokens(ls);
  });

  test('answering — CQ and caller rigs swapped', async ({ page }) => {
    await loadPage(page);
    await fillForm(page, 'protocol2', 'other', YOUR, THEIR);
    const ls = await getLines(page);

    expect(ls[0]).toContain('QUENTIN');
    expect(ls[4]).toContain('K7DRQ');
    expect(ls[4]).toContain('W1AW');
    assertNoRawTokens(ls);
  });
});

// ── Protocol 3 ────────────────────────────────────────────────────────────────

test.describe('Protocol 3', () => {
  test('leading — ham career, age, occupation tokens substituted', async ({ page }) => {
    await loadPage(page);
    await fillForm(page, 'protocol3', 'me', YOUR, THEIR);
    const ls = await getLines(page);

    expect(ls[0]).toContain('HIRAM');
    expect(ls[1]).toMatch(/BEEN HAM \d+ YRS/);
    expect(ls[2]).toMatch(/AGE HR \d+ YRS/);
    expect(ls[3]).toContain('WRK AS ');
    expect(ls[4]).toContain('W1AW');
    expect(ls[4]).toContain('K7DRQ');
    assertNoRawTokens(ls);
  });

  test('answering — names swapped', async ({ page }) => {
    await loadPage(page);
    await fillForm(page, 'protocol3', 'other', YOUR, THEIR);
    const ls = await getLines(page);

    expect(ls[0]).toContain('QUENTIN');
    expect(ls[5]).toContain('HIRAM');
    assertNoRawTokens(ls);
  });
});

// ── Protocol 4 ────────────────────────────────────────────────────────────────

test.describe('Protocol 4', () => {
  test('leading — closing exchange substituted', async ({ page }) => {
    await loadPage(page);
    await fillForm(page, 'protocol4', 'me', YOUR, THEIR);
    const ls = await getLines(page);

    expect(ls[0]).toContain('HIRAM');
    expect(ls[0]).toContain('TNX FER FB QSO');
    expect(ls[2]).toContain('W1AW');
    expect(ls[2]).toContain('K7DRQ');
    expect(ls[3]).toContain('QUENTIN');
    expect(ls[5]).toContain('K7DRQ');
    expect(ls[5]).toContain('W1AW');
    expect(ls[6]).toContain('E E');
    assertNoRawTokens(ls);
  });

  test('answering — closing exchange swapped', async ({ page }) => {
    await loadPage(page);
    await fillForm(page, 'protocol4', 'other', YOUR, THEIR);
    const ls = await getLines(page);

    expect(ls[0]).toContain('QUENTIN');
    expect(ls[3]).toContain('HIRAM');
    assertNoRawTokens(ls);
  });
});

// ── Minimal QSO (P1 + P4) ─────────────────────────────────────────────────────

test.describe('Minimal QSO', () => {
  test('leading — contains protocol 1 opener and protocol 4 closer', async ({ page }) => {
    await loadPage(page);
    await fillForm(page, 'minimalQSO', 'me', YOUR, THEIR);
    const ls = await getLines(page);

    // P1 opener
    expect(ls[0]).toContain('CQ CQ DE K7DRQ K7DRQ K');
    expect(ls[5]).toContain('QTH CO CO');
    expect(ls[6]).toContain('NAME QUENTIN QUENTIN');
    // P4 closer — should be at the end
    const joined = ls.join(' ');
    expect(joined).toContain('TNX FER FB QSO');
    expect(joined).toContain('E E');
    assertNoRawTokens(ls);
  });

  test('answering — roles swapped throughout', async ({ page }) => {
    await loadPage(page);
    await fillForm(page, 'minimalQSO', 'other', YOUR, THEIR);
    const ls = await getLines(page);

    expect(ls[0]).toContain('W1AW');
    expect(ls[0]).not.toContain('K7DRQ');
    expect(ls[5]).toContain('CT CT');
    assertNoRawTokens(ls);
  });
});

// ── Full QSO (P1 + P2 + P3 + P4) ─────────────────────────────────────────────

test.describe('Full QSO', () => {
  test('leading — all four protocol segments present', async ({ page }) => {
    await loadPage(page);
    await fillForm(page, 'fullQSO', 'me', YOUR, THEIR);
    const ls = await getLines(page);

    const joined = ls.join(' ');
    // P1: opener + QTH + name
    expect(ls[0]).toContain('CQ CQ DE K7DRQ');
    expect(joined).toContain('QTH CO CO');
    expect(joined).toContain('NAME QUENTIN QUENTIN');
    // P2: rig/antenna/weather
    expect(joined).toContain('RIG ');
    expect(joined).toContain('ANT ');
    expect(joined).toContain('WX ');
    // P3: ham career / age / occupation
    expect(joined).toMatch(/BEEN HAM \d+ YRS/);
    expect(joined).toMatch(/AGE HR \d+ YRS/);
    expect(joined).toContain('WRK AS ');
    // P4: closing
    expect(joined).toContain('TNX FER FB QSO');
    expect(joined).toContain('E E');
    assertNoRawTokens(ls);
  });

  test('answering — roles swapped across all segments', async ({ page }) => {
    await loadPage(page);
    await fillForm(page, 'fullQSO', 'other', YOUR, THEIR);
    const ls = await getLines(page);

    expect(ls[0]).toContain('W1AW');
    expect(ls[0]).not.toContain('K7DRQ');
    const joined = ls.join(' ');
    expect(joined).toContain('CT CT');
    expect(joined).toContain('HIRAM HIRAM');
    assertNoRawTokens(ls);
  });
});

// ── Blank their-side fields ───────────────────────────────────────────────────

test.describe('Blank their-side fields', () => {
  test('all protocols generate valid output with only your info filled', async ({ page }) => {
    const protocols = ['protocol1', 'protocol2', 'protocol3', 'protocol4', 'minimalQSO', 'fullQSO'];
    for (const protocol of protocols) {
      await loadPage(page);
      await page.fill('#yourCall',  'K7DRQ');
      await page.fill('#yourName',  'QUENTIN');
      await page.fill('#yourQTH',   'CO');
      await page.fill('#theirCall', '');
      await page.fill('#theirName', '');
      await page.fill('#theirQTH',  '');
      await page.selectOption('#qsoType', protocol);
      await page.click('.button-go');
      const ls = await getLines(page);
      assertNoRawTokens(ls);
      expect(ls.length, `${protocol}: expected output rows`).toBeGreaterThan(0);
    }
  });
});
