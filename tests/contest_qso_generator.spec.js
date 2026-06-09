import { test, expect } from '@playwright/test';

const YOUR   = { call: 'K7DRQ', name: 'QUENTIN', qth: 'CO',  nr: '1234' };
const THEIR  = { call: 'W1AW',  name: 'HIRAM',   qth: 'CT',  nr: '5678' };
const YOUR_FD  = { call: 'K7DRQ', name: 'QUENTIN', qth: 'WNY', nr: '2A' };
const THEIR_FD = { call: 'W1AW',  name: 'HIRAM',   qth: 'KS',  nr: '3B' };

async function loadPage(page) {
  await page.goto('/contest_qso_generator.html');
  // Wait until DOMContentLoaded async fetches have populated the globals
  await page.waitForFunction('allProtocols != null && fdSections != null');
}

async function fillForm(page, contest, leading, your, their) {
  await page.selectOption('#qsoType', contest);
  await page.selectOption('#leading', leading);
  await page.fill('#yourCall',    your.call);
  await page.fill('#yourName',    your.name);
  await page.fill('#yourQTH',     your.qth);
  await page.fill('#yourNumber',  your.nr);
  await page.fill('#theirCall',   their.call);
  await page.fill('#theirName',   their.name);
  await page.fill('#theirQTH',    their.qth);
  await page.fill('#theirNumber', their.nr);
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

// ── LICW Challenge ────────────────────────────────────────────────────────────

test.describe('LICW Challenge', () => {
  test('leading — all tokens substituted correctly', async ({ page }) => {
    await loadPage(page);
    await fillForm(page, 'licw_challenge', 'me', YOUR, THEIR);
    const ls = await getLines(page);

    expect(ls[0]).toContain('CQ CQ LICW');
    expect(ls[0]).toContain('K7DRQ');
    expect(ls[1]).toContain('K7DRQ');
    expect(ls[1]).toContain('W1AW');
    expect(ls[2]).toContain('W1AW');
    expect(ls[4]).toContain('QTH CO CO');
    expect(ls[5]).toContain('NAME QUENTIN QUENTIN');
    expect(ls[6]).toContain('LICW NR 1234 1234');
    expect(ls[10]).toContain('QTH CT CT');
    expect(ls[11]).toContain('NAME HIRAM HIRAM');
    expect(ls[12]).toContain('LICW NR 5678 5678');
    expect(ls[15]).toContain('K7DRQ');
    expect(ls[17]).toContain('W1AW');
    assertNoRawTokens(ls);
  });

  test('answering — roles swapped correctly', async ({ page }) => {
    await loadPage(page);
    await fillForm(page, 'licw_challenge', 'other', YOUR, THEIR);
    const ls = await getLines(page);

    expect(ls[0]).toContain('W1AW');
    expect(ls[0]).not.toContain('K7DRQ');
    expect(ls[4]).toContain('CT CT');   // CQ QTH = their QTH
    expect(ls[6]).toContain('5678');    // CQ nr  = their nr
    expect(ls[10]).toContain('CO CO');  // caller QTH = your QTH
    expect(ls[12]).toContain('1234');   // caller nr  = your nr
  });
});

// ── SKCC WES ──────────────────────────────────────────────────────────────────

test.describe('SKCC WES', () => {
  test('leading — all tokens substituted correctly', async ({ page }) => {
    await loadPage(page);
    await fillForm(page, 'skcc_wes', 'me', YOUR, THEIR);
    const ls = await getLines(page);

    expect(ls[0]).toContain('CQ WES');
    expect(ls[0]).toContain('K7DRQ K7DRQ');
    expect(ls[1]).toContain('W1AW');
    expect(ls[3]).toContain('CO CO');
    expect(ls[4]).toContain('OP QUENTIN QUENTIN');
    expect(ls[5]).toContain('NR 1234 1234');
    expect(ls[8]).toContain('CT CT');
    expect(ls[9]).toContain('NAME HIRAM HIRAM');
    expect(ls[10]).toContain('NR 5678 5678');
    assertNoRawTokens(ls);
  });

  test('answering — roles swapped correctly', async ({ page }) => {
    await loadPage(page);
    await fillForm(page, 'skcc_wes', 'other', YOUR, THEIR);
    const ls = await getLines(page);

    expect(ls[0]).toContain('W1AW');
    expect(ls[0]).not.toContain('K7DRQ');
    expect(ls[3]).toContain('CT CT');
    expect(ls[8]).toContain('CO CO');
  });
});

// ── K1USN SST ─────────────────────────────────────────────────────────────────

test.describe('K1USN SST', () => {
  test('leading — all tokens substituted correctly', async ({ page }) => {
    await loadPage(page);
    await fillForm(page, 'k1usn_sst', 'me', YOUR, THEIR);
    const ls = await getLines(page);

    expect(ls[0]).toContain('CQ SST');
    expect(ls[0]).toContain('K7DRQ');
    expect(ls[1]).toContain('W1AW');
    expect(ls[2]).toContain('W1AW');
    expect(ls[2]).toContain('QUENTIN');
    expect(ls[2]).toContain('CO');
    expect(ls[3]).toContain('QUENTIN');
    expect(ls[3]).toContain('HIRAM');
    expect(ls[3]).toContain('CT');
    expect(ls[4]).toContain('GL HIRAM TU');
    expect(ls[5]).toContain('K7DRQ SST');
    assertNoRawTokens(ls);
  });

  test('answering — roles swapped correctly', async ({ page }) => {
    await loadPage(page);
    await fillForm(page, 'k1usn_sst', 'other', YOUR, THEIR);
    const ls = await getLines(page);

    expect(ls[0]).toContain('W1AW');
    expect(ls[0]).not.toContain('K7DRQ');
    expect(ls[2]).toContain('K7DRQ');
    expect(ls[2]).toContain('HIRAM');
    expect(ls[2]).toContain('CT');
    expect(ls[3]).toContain('HIRAM');
    expect(ls[3]).toContain('QUENTIN');
    expect(ls[3]).toContain('CO');
  });
});

// ── SOTA ──────────────────────────────────────────────────────────────────────

test.describe('SOTA', () => {
  test('leading — all tokens substituted correctly', async ({ page }) => {
    await loadPage(page);
    await fillForm(page, 'sota', 'me', YOUR, THEIR);
    const ls = await getLines(page);

    expect(ls[0]).toContain('CQ CQ SOTA');
    expect(ls[0]).toContain('K7DRQ K7DRQ');
    expect(ls[1]).toContain('W1AW');
    expect(ls[4]).toContain('CT BK');
    expect(ls[5]).toContain('TU 73 E E');
    expect(ls[6]).toContain('E E');
    assertNoRawTokens(ls);
  });

  test('answering — roles swapped correctly', async ({ page }) => {
    await loadPage(page);
    await fillForm(page, 'sota', 'other', YOUR, THEIR);
    const ls = await getLines(page);

    expect(ls[0]).toContain('W1AW');
    expect(ls[0]).not.toContain('K7DRQ');
    expect(ls[4]).toContain('CO BK');
  });
});

// ── Field Day ─────────────────────────────────────────────────────────────────

test.describe('Field Day', () => {
  test('leading — class and section from form fields', async ({ page }) => {
    await loadPage(page);
    await fillForm(page, 'field_day', 'me', YOUR_FD, THEIR_FD);
    const ls = await getLines(page);

    expect(ls[0]).toContain('CQ FD K7DRQ K7DRQ K');
    expect(ls[1]).toContain('W1AW');
    expect(ls[2]).toContain('W1AW TU 2A WNY');
    expect(ls[3]).toContain('RR TNX 3B KS');
    expect(ls[4]).toContain('TU K7DRQ FD');
    assertNoRawTokens(ls);
  });

  test('answering — class and section swapped correctly', async ({ page }) => {
    await loadPage(page);
    await fillForm(page, 'field_day', 'other', YOUR_FD, THEIR_FD);
    const ls = await getLines(page);

    expect(ls[0]).toContain('W1AW');
    expect(ls[0]).not.toContain('K7DRQ');
    expect(ls[2]).toContain('K7DRQ TU 3B KS');
    expect(ls[3]).toContain('RR TNX 2A WNY');
  });

  test('placeholder text changes when Field Day is selected', async ({ page }) => {
    await loadPage(page);
    await page.selectOption('#qsoType', 'field_day');
    await expect(page.locator('#yourNumber')).toHaveAttribute('placeholder', /FD Designation/i);
    await expect(page.locator('#theirNumber')).toHaveAttribute('placeholder', /FD Designation/i);
  });

  test('placeholder reverts when switching away from Field Day', async ({ page }) => {
    await loadPage(page);
    await page.selectOption('#qsoType', 'field_day');
    await page.selectOption('#qsoType', 'licw_challenge');
    await expect(page.locator('#yourNumber')).toHaveAttribute('placeholder', 'Your Number');
    await expect(page.locator('#theirNumber')).toHaveAttribute('placeholder', 'Their Number');
  });

  test('partial FD designation — number only gets random letter appended', async ({ page }) => {
    await loadPage(page);
    await fillForm(page, 'field_day', 'me', { ...YOUR_FD, nr: '3' }, { ...THEIR_FD, nr: '' });
    const ls = await getLines(page);
    // Line 2: CQ sends their class — should start with "3" followed by a letter A-F
    expect(ls[2]).toMatch(/TU 3[A-F] /);
    assertNoRawTokens(ls);
  });

  test('blank FD fields — random class and section generated', async ({ page }) => {
    await loadPage(page);
    await fillForm(page, 'field_day', 'me', { ...YOUR_FD, nr: '' }, { ...THEIR_FD, nr: '', qth: '' });
    const ls = await getLines(page);
    assertNoRawTokens(ls);
    // Both class+section lines must be non-empty
    expect(ls[2].trim().length).toBeGreaterThan(0);
    expect(ls[3].trim().length).toBeGreaterThan(0);
  });
});

// ── Blank "their" fields — random fill ───────────────────────────────────────

test.describe('Blank their-side fields', () => {
  test('all modes generate valid output with only your info filled', async ({ page }) => {
    const modes = ['licw_challenge', 'skcc_wes', 'k1usn_sst', 'sota', 'field_day'];
    for (const mode of modes) {
      await loadPage(page);
      await page.fill('#yourCall',   'K7DRQ');
      await page.fill('#yourName',   'QUENTIN');
      await page.fill('#yourQTH',    'CO');
      await page.fill('#yourNumber', '1234');
      await page.fill('#theirCall',   '');
      await page.fill('#theirName',   '');
      await page.fill('#theirQTH',    '');
      await page.fill('#theirNumber', '');
      await page.selectOption('#qsoType', mode);
      await page.click('.button-go');
      const ls = await getLines(page);
      assertNoRawTokens(ls);
      expect(ls.length, `${mode}: expected output rows`).toBeGreaterThan(0);
    }
  });
});
