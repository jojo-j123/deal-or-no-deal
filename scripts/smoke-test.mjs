/**
 * End-to-end smoke test: plays the demo games through to a result in a real
 * browser, exercises the creator, and fails on any page error or stalled phase.
 *
 *   npm run build && npm run preview   # in one shell
 *   npm run smoke                      # in another
 */
import { chromium } from 'playwright';

const BASE_URL = process.env.SMOKE_URL || 'http://localhost:4173/';
const SHOTS = process.env.SHOTS_DIR || null;
const HEADLESS = process.env.HEADED !== '1';

const problems = [];
let shotIndex = 0;

async function shot(page, name) {
  if (!SHOTS) return;
  shotIndex += 1;
  const file = `${SHOTS}/${String(shotIndex).padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path: file });
  console.log('    📸', file.split('/').pop());
}

const phaseOf = (page) => page.evaluate(() => document.documentElement.dataset.phase ?? 'none');

/**
 * Drives one game to its end. `strategy` decides what to do with an offer.
 * Fails loudly if the phase stops changing.
 */
async function playGame(page, { strategy = 'no-deal', finalChoice = 'keep', shots = false, label = '' } = {}) {
  const transcript = [];
  let lastPhase = null;
  let sameFor = 0;

  await page.waitForSelector('.case-grid');
  await page.waitForFunction(() => document.documentElement.dataset.phase === 'pick-own');
  if (shots) await shot(page, `${label}-pick-own`);

  await page.locator('.case-slot:not([disabled])').nth(7).click();

  for (let step = 0; step < 500; step++) {
    const phase = await phaseOf(page);
    if (phase === lastPhase) sameFor += 1;
    else {
      sameFor = 0;
      lastPhase = phase;
      transcript.push(phase);
    }
    if (sameFor > 120) {
      throw new Error(`stalled in phase "${phase}" — transcript: ${transcript.join(' → ')}`);
    }

    if (phase === 'ended') break;

    if (phase === 'reveal') {
      if (shots && !shots.reveal) {
        await page.waitForTimeout(1400);
        await shot(page, `${label}-reveal`);
        shots.reveal = true;
      }
      // The reveal advances itself; waiting is what a player experiences.
      await page
        .waitForFunction(() => document.documentElement.dataset.phase !== 'reveal', null, { timeout: 9000 })
        .catch(() => {
          throw new Error('reveal never finished');
        });
      continue;
    }

    if (phase === 'offer') {
      const value = (await page.locator('.offer__value, .offer__bundle').first().textContent())?.trim();
      const average = (await page.locator('.offer__stats dd').first().textContent())?.trim();
      console.log(`    💰 offer ${value} (board average ${average})`);
      if (shots && !shots.offer) {
        await shot(page, `${label}-offer`);
        shots.offer = true;
      }
      const takeIt =
        strategy === 'deal' || (strategy === 'deal-second' && transcript.filter((p) => p === 'offer').length >= 2);
      await page.waitForTimeout(950);
      await page.getByRole('button', { name: takeIt ? 'Deal' : 'No Deal', exact: true }).click();
      await page.waitForTimeout(200);
      continue;
    }

    if (phase === 'final-choice') {
      if (shots && !shots.final) {
        await shot(page, `${label}-final-two`);
        shots.final = true;
      }
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: finalChoice === 'swap' ? /Swap/ : /Keep/ }).click();
      await page.waitForTimeout(300);
      continue;
    }

    if (phase === 'banker-calling') {
      await page.waitForTimeout(300);
      continue;
    }

    if (phase === 'opening') {
      const openable = page.locator('.case-slot:not([disabled])');
      if (await openable.count()) {
        await openable.first().click();
        await page.waitForTimeout(140);
        continue;
      }
      throw new Error('phase is "opening" but no case can be opened');
    }

    await page.waitForTimeout(150);
  }

  await page.waitForSelector('.result__prize');
  const prize = (await page.locator('.result__prize').textContent())?.trim();
  const verdict = (await page.locator('.result__verdict').textContent())?.trim();
  const held = (await page.locator('.result__compare-value').first().textContent())?.trim();
  console.log(`    🏁 ${prize}  ·  held ${held}  ·  ${verdict}`);
  if (shots) await shot(page, `${label}-result`);
  return { prize, verdict, transcript };
}

async function openGame(page, title) {
  await page.locator('.game-card', { hasText: title }).getByRole('button', { name: 'Play' }).click();
}

async function backToMenu(page) {
  // While the result modal is open it covers the top bar, which is the point of
  // a modal — leave through the button the player can actually see.
  const inResult = page.locator('.result').getByRole('button', { name: /Back to/ });
  const target = (await inResult.count())
    ? inResult
    : page.locator('.topbar').getByRole('button', { name: /Back to/ });
  await target.click();
  await page.waitForSelector('.menu__title');
}

const run = async () => {
  const browser = await chromium.launch({
    headless: HEADLESS,
    executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
  });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  // Webfonts are a progressive enhancement — the themes fall back to system
  // stacks — so a blocked external request is a note, not a failure.
  page.on('requestfailed', (request) => {
    const url = request.url();
    if (!url.startsWith(BASE_URL)) {
      console.log('    ℹ️  external asset unavailable (falling back):', new URL(url).host);
    } else {
      problems.push(`request failed: ${url}`);
    }
  });
  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() !== 'error') return;
    if (/Failed to load resource/i.test(text)) return; // covered by requestfailed
    problems.push(`console error: ${text}`);
    console.log('    ⚠️  console error:', text);
  });
  page.on('pageerror', (err) => {
    problems.push(`page error: ${err.message}`);
    console.log('    ⚠️  page error:', err.message);
  });

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('.menu__title');
  console.log('▸ menu loaded:', (await page.locator('.menu__title').textContent())?.trim());
  await shot(page, 'menu');

  console.log('▸ classic money game — refusing every offer, swapping at the end');
  await openGame(page, 'Deal or No Deal');
  await playGame(page, { strategy: 'no-deal', finalChoice: 'swap', shots: {}, label: 'money' });

  console.log('▸ restart from the result screen');
  await page.getByRole('button', { name: 'Play again' }).click();
  await page.waitForFunction(() => document.documentElement.dataset.phase === 'pick-own');
  console.log('    ↻ back to', await phaseOf(page));
  await backToMenu(page);

  console.log('▸ custom prize game — taking the second bundle offer');
  await openGame(page, 'Ultimate Prize Box');
  await playGame(page, { strategy: 'deal-second', shots: {}, label: 'prizebox' });
  await backToMenu(page);

  console.log('▸ fantasy game (12 chests, values in gold) — keeping the final chest');
  await openGame(page, "Dragon's Hoard");
  await playGame(page, { strategy: 'no-deal', finalChoice: 'keep', shots: {}, label: 'hoard' });
  await backToMenu(page);

  console.log('▸ creator');
  await page.getByRole('button', { name: 'Create a game' }).click();
  await page.waitForSelector('.creator__title');
  await shot(page, 'creator-general');
  for (const tab of ['Prizes', 'Rounds', 'Banker', 'Theme', 'Audio', 'Dialogue']) {
    await page.getByRole('button', { name: tab, exact: true }).click();
    await page.waitForTimeout(260);
    await shot(page, `creator-${tab.toLowerCase()}`);
  }

  console.log('▸ creator → case count change → playtest');
  await page.getByRole('button', { name: 'General', exact: true }).click();
  await page.getByLabel('Case count', { exact: true }).selectOption('16');
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'Prizes', exact: true }).click();
  const prizeCount = await page.locator('.prize-item').count();
  console.log('    prizes after resize:', prizeCount);
  if (prizeCount !== 16) problems.push(`expected 16 prizes after resize, saw ${prizeCount}`);
  await page.getByRole('button', { name: 'Playtest' }).click();
  await playGame(page, { strategy: 'deal', label: 'custom' });
  await page.locator('.result').getByRole('button', { name: /Back to editor/ }).click();
  await page.waitForSelector('.creator__title');
  console.log('    ← returned to the editor');

  console.log('▸ mobile layout');
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  mobile.on('pageerror', (err) => problems.push(`mobile page error: ${err.message}`));
  await mobile.goto(BASE_URL, { waitUntil: 'networkidle' });
  await mobile.waitForSelector('.menu__title');
  await shot(mobile, 'mobile-menu');
  await openGame(mobile, 'Deal or No Deal');
  await mobile.waitForFunction(() => document.documentElement.dataset.phase === 'pick-own');
  await mobile.locator('.case-slot').nth(4).click();
  await mobile.waitForTimeout(900);
  await shot(mobile, 'mobile-game');
  const overflow = await mobile.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  console.log('    horizontal overflow:', overflow, 'px');
  if (overflow > 1) problems.push(`mobile layout overflows horizontally by ${overflow}px`);

  await browser.close();

  if (problems.length) {
    console.log(`\n❌ ${problems.length} problem(s):\n - ${problems.join('\n - ')}`);
    process.exit(1);
  }
  console.log('\n✅ all flows completed with no page errors');
};

run().catch((err) => {
  console.error('\n❌ FAILED:', err.message);
  process.exit(1);
});
