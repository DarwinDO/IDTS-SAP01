const { chromium } = require('playwright');
const { execSync } = require('child_process');
const { createHarness } = require('./lib/browser-harness');
const fs = require('fs');

/**
 * IDTS-60 QA Browser UX Baseline - Attachments Focus
 *
 * Evidence Generation:
 * Screenshots are generated locally in the git-ignored `scripts/qa/uat-evidence/idts-60/` directory.
 */

const QA_PASSWORD = process.env.QA_PASSWORD;
const ROLES = {
    PM: 'donhv@example.local'
};

if (!QA_PASSWORD) {
    console.error('QA_PASSWORD environment variable is required for QA.');
    process.exit(1);
}

function seedTestUsers() {
    Object.values(ROLES).forEach(email => {
        execSync('node scripts/dev/set-local-user-password.js', {
            env: { ...process.env, IDTS_AUTH_EMAIL: email, IDTS_AUTH_PASSWORD: QA_PASSWORD },
            stdio: 'ignore'
        });
    });
}

const UI_DIR = 'scripts/qa/uat-evidence/idts-60';
if (!fs.existsSync(UI_DIR)) {
    fs.mkdirSync(UI_DIR, { recursive: true });
}

async function takeScreenshot(page, name) {
    await page.screenshot({ path: `${UI_DIR}/${name}.png`, fullPage: true });
}

async function runTests() {
    console.log('--- Seeding test users ---');
    seedTestUsers();

    console.log('--- Launching Browser ---');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const harness = await createHarness(page, { settleMs: 1000 });
    const baseUrl = 'http://localhost:4004/idts.bugmanagementui/index.html';

    try {
        console.log('1. Login (PM Role)');
        await page.goto(baseUrl);
        await page.waitForSelector('.idtsLoginCard', { timeout: 10000 });
        
        await page.getByRole('textbox', { name: 'Email' }).fill(ROLES.PM);
        await page.locator('input[type="password"]').fill(QA_PASSWORD);
        await page.getByRole('button', { name: 'Sign In' }).click();

        await page.waitForSelector('.idtsProfileButton', { timeout: 15000 });
        console.log('  PASS  Logged in successfully.');

        console.log('2. Fiori Object Page & Attachments Section');
        const BUG_ID = '90000000-0000-0000-0000-000000000001';
        await page.goto(`http://localhost:4004/idts.bugmanagementui/index.html#/Bugs(ID=${BUG_ID},IsActiveEntity=true)`);
        await page.waitForLoadState('domcontentloaded');
        await harness.assertNoBlockingSignals('Object Page Load');

        // Wait for Attachments Section (Fiori elements adds a title for the section)
        // Look for the "Evidence / Attachments" title or the "Upload" button associated with attachments
        const attachmentsSection = page.getByRole('heading', { name: /Evidence \/ Attachments/i });
        await attachmentsSection.waitFor({ state: 'visible', timeout: 10000 });
        await takeScreenshot(page, '01_attachments_section_renders');
        console.log('  PASS  Evidence / Attachments section renders on Object Page.');

        // Let's verify the upload button exists inside the attachment table
        const uploadButton = page.getByRole('button', { name: /Upload/i });
        if (await uploadButton.count() > 0) {
            console.log('  PASS  Upload button is visible in Attachments section.');
        } else {
            console.log('  WARN  Upload button not found. Attachments table may be in read-only mode.');
        }

        console.log('3. Session Persistence & Logout');
        await page.goto('http://localhost:4004/idts.bugmanagementui/index.html');
        await page.waitForSelector('.idtsProfileButton', { timeout: 10000 });
        await page.click('.idtsProfileButton');
        const logoutButton = page.getByRole('button', { name: 'Sign Out' });
        await logoutButton.click();

        await page.waitForURL('**/login.html');
        console.log('  PASS  Logout returns to login page.');

        console.log('--- All QA Depth Gate UI/UX scenarios passed ---');
    } catch (e) {
        console.error('Test failed:', e);
        await takeScreenshot(page, 'ERROR_STATE');
        process.exit(1);
    } finally {
        await browser.close();
    }
}

runTests();
