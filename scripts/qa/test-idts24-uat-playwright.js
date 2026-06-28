const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.IDTS_UAT_BASE_URL || 'http://localhost:4004';
const APP_URL = `${BASE_URL}/idts.bugmanagementui/index.html`;
const BUG_0003_ID = '90000000-0000-0000-0000-000000000003';
const BUG_0003_URL = `${APP_URL}#/Bugs(ID=${BUG_0003_ID},IsActiveEntity=true)`;
const BUG_0003_ODATA = `${BASE_URL}/odata/v4/bug/Bugs(ID=${BUG_0003_ID},IsActiveEntity=true)`;
const UAT_DIR = path.join(__dirname, 'uat-evidence');

function prepareEvidenceDir() {
    fs.mkdirSync(UAT_DIR, { recursive: true });

    for (const fileName of fs.readdirSync(UAT_DIR)) {
        if (fileName.toLowerCase().endsWith('.png')) {
            fs.unlinkSync(path.join(UAT_DIR, fileName));
        }
    }
}

async function launchBrowser() {
    try {
        return await chromium.launch({ channel: 'msedge' });
    } catch (edgeError) {
        console.log('Edge not found, trying Chrome...');
        return chromium.launch({ channel: 'chrome' });
    }
}

async function assertNoVisibleError(page, checkpoint) {
    const dialogs = page.locator('[role="dialog"], .sapMDialog');
    const dialogCount = await dialogs.count();

    for (let index = 0; index < dialogCount; index += 1) {
        const dialog = dialogs.nth(index);
        if (!(await dialog.isVisible().catch(() => false))) {
            continue;
        }

        const text = await dialog.innerText().catch(() => '');
        if (/error|no such table|sqlite|failed|cannot|exception/i.test(text)) {
            const evidencePath = path.join(UAT_DIR, `error_${checkpoint.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}.png`);
            await page.screenshot({ path: evidencePath, fullPage: true }).catch(() => {});
            throw new Error(`Visible UI error detected after ${checkpoint}: ${text.replace(/\s+/g, ' ').trim()}`);
        }
    }

    if (page.idtsRuntimeErrors?.length) {
        const evidencePath = path.join(UAT_DIR, `error_${checkpoint.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}_console.png`);
        await page.screenshot({ path: evidencePath, fullPage: true }).catch(() => {});
        throw new Error(`Browser runtime error detected after ${checkpoint}: ${page.idtsRuntimeErrors.join(' | ')}`);
    }
}

async function waitForFioriApp(page, checkpoint) {
    await waitForAnyVisibleText(page, /^Bugs$/i, checkpoint);
    await page.waitForTimeout(2500);
    await assertNoVisibleError(page, checkpoint);
}

async function waitForBugObjectPage(page, checkpoint) {
    await waitForAnyVisibleText(page, /^BUG-0003$/i, checkpoint);
    await page.waitForTimeout(2500);
    await assertNoVisibleError(page, checkpoint);
}

async function waitForAnyVisibleText(page, labelPattern, checkpoint, timeoutMs = 60000) {
    const startedAt = Date.now();
    const target = page.getByText(labelPattern);

    while (Date.now() - startedAt < timeoutMs) {
        const count = await target.count();
        for (let index = 0; index < count; index += 1) {
            if (await target.nth(index).isVisible().catch(() => false)) {
                return;
            }
        }
        await page.waitForTimeout(500);
    }

    await page.screenshot({ path: path.join(UAT_DIR, `missing_${checkpoint.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}.png`), fullPage: true }).catch(() => {});
    throw new Error(`Timed out waiting for visible text at ${checkpoint}: ${labelPattern}`);
}

async function clickGoIfPresent(page) {
    const goButton = page.getByRole('button', { name: /^Go$/ }).first();
    if (await goButton.isVisible().catch(() => false)) {
        await goButton.click();
        await page.waitForTimeout(3000);
        await assertNoVisibleError(page, 'Go button');
    }
}

async function clickRequiredText(page, labelPattern, checkpoint) {
    const target = page.getByText(labelPattern).first();
    if (!(await target.isVisible().catch(() => false))) {
        await page.screenshot({ path: path.join(UAT_DIR, `missing_${checkpoint.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}.png`), fullPage: true });
        throw new Error(`Required UI target was not visible: ${checkpoint}`);
    }

    await target.click();
    await page.waitForTimeout(3000);
    await assertNoVisibleError(page, checkpoint);
}

async function addCommentForHistoryEvidence(page) {
    console.log('Creating UAT history evidence comment...');
    const response = await page.request.post(`${BUG_0003_ODATA}/BugService.addComment`, {
        data: {
            content: `IDTS-24 UAT history evidence marker ${new Date().toISOString()}`
        }
    });

    if (!response.ok()) {
        const text = await response.text().catch(() => '');
        throw new Error(`Failed to create UAT history evidence comment: HTTP ${response.status()} ${text}`);
    }

    console.log('UAT history evidence comment created.');
    await page.waitForTimeout(1500);
}

async function openPersonaPage(browser, username) {
    const context = await browser.newContext({
        httpCredentials: { username, password: '' }
    });
    const page = await context.newPage();
    page.idtsRuntimeErrors = [];

    page.on('console', msg => {
        const text = msg.text();
        if (/error|failed|exception/i.test(text)) {
            console.log(`BROWSER CONSOLE [${username}]:`, text);
        }
        if (/FormatException|no such table|not a valid boolean|Illegal sap\.ui\.model|Uncaught|TypeError/i.test(text)) {
            page.idtsRuntimeErrors.push(text.replace(/\s+/g, ' ').trim());
        }
    });
    page.on('pageerror', err => {
        console.log(`BROWSER ERROR [${username}]:`, err.message);
        page.idtsRuntimeErrors.push(err.message);
    });

    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    await waitForFioriApp(page, `${username} app load`);
    await clickGoIfPresent(page);

    return { context, page };
}

async function runTesterUat(browser) {
    console.log('Running UAT for Tester (NhanT)...');
    const { context, page } = await openPersonaPage(browser, 'NhanT');

    await page.screenshot({ path: path.join(UAT_DIR, '01_tester_list_report.png'), fullPage: true });

    await page.goto(BUG_0003_URL, { waitUntil: 'domcontentloaded' });
    await waitForBugObjectPage(page, 'Tester Object Page load');
    await page.screenshot({ path: path.join(UAT_DIR, '02_tester_object_page_ownership.png'), fullPage: true });

    await addCommentForHistoryEvidence(page);
    await page.goto(BUG_0003_URL, { waitUntil: 'domcontentloaded' });
    await waitForBugObjectPage(page, 'Tester Object Page reload after comment');
    await clickRequiredText(page, /^History Timeline$/i, 'Tester History Timeline tab');
    await page.screenshot({ path: path.join(UAT_DIR, '03_tester_history_timeline.png'), fullPage: true });
    await context.close();
}

async function runDeveloperUat(browser) {
    console.log('Running UAT for Developer (SangVN)...');
    const { context, page } = await openPersonaPage(browser, 'SangVN');

    await page.screenshot({ path: path.join(UAT_DIR, '04_developer_list_report.png'), fullPage: true });

    await page.goto(BUG_0003_URL, { waitUntil: 'domcontentloaded' });
    await waitForBugObjectPage(page, 'Developer Object Page load');
    await page.screenshot({ path: path.join(UAT_DIR, '05_developer_object_page_actions.png'), fullPage: true });
    await context.close();
}

async function runPmUat(browser) {
    console.log('Running UAT for PM (DonHV)...');
    const { context, page } = await openPersonaPage(browser, 'DonHV');

    await clickRequiredText(page, /^Pending Assignment\s*(\(\d+\))?$/i, 'PM Pending Assignment tab');
    await page.screenshot({ path: path.join(UAT_DIR, '06_pm_pending_assignment_monitoring.png'), fullPage: true });

    await clickRequiredText(page, /^PM Action Queue\s*(\(\d+\))?$/i, 'PM Action Queue tab');
    await page.screenshot({ path: path.join(UAT_DIR, '07_pm_action_queue_monitoring.png'), fullPage: true });
    await context.close();
}

async function runUat() {
    prepareEvidenceDir();

    const browser = await launchBrowser();

    try {
        await runTesterUat(browser);
        await runDeveloperUat(browser);
        await runPmUat(browser);
    } finally {
        await browser.close();
    }

    console.log('UAT Execution completed. Evidence saved in scripts/qa/uat-evidence/.');
}

runUat().catch(err => {
    console.error(err);
    process.exit(1);
});
