const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const UAT_DIR = path.join(__dirname, 'uat-evidence');

async function runUat() {
    if (!fs.existsSync(UAT_DIR)) {
        fs.mkdirSync(UAT_DIR);
    }

    // Try to use system Edge or Chrome since chromium download failed
    let browser;
    try {
        browser = await chromium.launch({ channel: 'msedge' });
    } catch (e) {
        console.log("Edge not found, trying Chrome...");
        browser = await chromium.launch({ channel: 'chrome' });
    }
    
    // Instead of waiting for text, we can use HTTP Basic Auth directly with Playwright
    // Or we go to the root / to see the CAP default page.
    
    // 1. Tester Persona (NhanT)
    console.log('Running UAT for Tester (NhanT)...');
    let context = await browser.newContext({
        httpCredentials: { username: 'NhanT', password: '' }
    });
    let page = await context.newPage();
    
    await page.goto('http://localhost:4004/idts.bugmanagementui/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: path.join(UAT_DIR, '00_debug_login.png'), fullPage: true });
    
    // Wait for the Fiori App to load
    await page.waitForSelector('text=Bugs', { timeout: 60000 });
    await page.waitForTimeout(3000); // Wait for list report to settle
    
    // Click Go
    const goButton = await page.$('bdi:has-text("Go")');
    if (goButton) await goButton.click();
    await page.waitForTimeout(3000); // Wait for data

    await page.screenshot({ path: path.join(UAT_DIR, '01_tester_list_report.png'), fullPage: true });

    // Open first bug (Click the row, not just the text to trigger navigation)
    const firstRow = await page.$('tr:has-text("BUG-0003")');
    if (firstRow) {
        await firstRow.click();
        await page.waitForTimeout(4000); // Wait for Object Page

        await page.screenshot({ path: path.join(UAT_DIR, '02_tester_object_page_ownership.png'), fullPage: true });

        // Click History tab
        const historyTab = await page.$('div:has-text("History")');
        if (historyTab) {
            await historyTab.click();
            await page.waitForTimeout(2000);
            await page.screenshot({ path: path.join(UAT_DIR, '03_tester_history_tab.png'), fullPage: true });
        }
    }
    await context.close();

    // 2. Developer Persona (SangVN)
    console.log('Running UAT for Developer (SangVN)...');
    context = await browser.newContext({
        httpCredentials: { username: 'SangVN', password: '' }
    });
    page = await context.newPage();
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err));
    
    await page.goto('http://localhost:4004/idts.bugmanagementui/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Bugs', { timeout: 60000 });
    await page.waitForTimeout(3000);
    
    if (await page.$('bdi:has-text("Go")')) await page.click('bdi:has-text("Go")');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: path.join(UAT_DIR, '04_developer_list_report.png'), fullPage: true });
    await context.close();

    // 3. PM Persona (DonHV)
    console.log('Running UAT for PM (DonHV)...');
    context = await browser.newContext({
        httpCredentials: { username: 'DonHV', password: '' }
    });
    page = await context.newPage();
    
    await page.goto('http://localhost:4004/idts.bugmanagementui/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Bugs', { timeout: 60000 });
    await page.waitForTimeout(3000);
    
    // Test PM Monitoring filters if possible
    if (await page.$('bdi:has-text("Go")')) await page.click('bdi:has-text("Go")');
    await page.waitForTimeout(3000);
    
    // Click Pending Assignment tab for PM
    const pendingTab = await page.$('div:has-text("Pending Assignment")');
    if (pendingTab) {
        await pendingTab.click();
        await page.waitForTimeout(3000); // Wait for table to filter
    }

    await page.screenshot({ path: path.join(UAT_DIR, '05_pm_list_report_monitoring.png'), fullPage: true });
    await context.close();

    await browser.close();
    console.log('UAT Execution completed. Evidence saved in scripts/qa/uat-evidence/');
}

runUat().catch(err => {
    console.error(err);
    process.exit(1);
});
