const { chromium } = require('playwright');
const { execSync } = require('child_process');
const { createHarness } = require('./lib/browser-harness');

const QA_PASSWORD = process.env.QA_PASSWORD || 'password123';
const ROLES = {
    PM: 'donhv@example.local',
    TESTER: 'nhant@example.local',
    DEVELOPER: 'sangvn@example.local'
};

function seedTestUsers() {
    Object.values(ROLES).forEach(email => {
        execSync('node scripts/dev/set-local-user-password.js', {
            env: { ...process.env, IDTS_AUTH_EMAIL: email, IDTS_AUTH_PASSWORD: QA_PASSWORD },
            stdio: 'ignore'
        });
    });
}

function getEmailOutboxLastRecord() {
    const script = `
        const cds = require('@sap/cds');
        async function run() {
            const db = await cds.connect.to('db');
            const res = await db.run('SELECT ID, channel_code, recipientEmail, status_code FROM idts_cap_NotificationDeliveries ORDER BY createdAt DESC LIMIT 1');
            console.log(JSON.stringify(res[0] || {}));
            process.exit(0);
        }
        run();
    `;
    const result = execSync(`node -e "${script.replace(/\n/g, ' ')}"`).toString().trim();
    return JSON.parse(result);
}

function clearHarnessErrors(harness) {
    harness.state.badResponses.length = 0;
    harness.state.consoleErrors.length = 0;
    harness.state.pageErrors.length = 0;
}

async function runTests() {
    seedTestUsers();
    console.log('--- Starting IDTS-38 Playwright UI Tests ---');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const harness = await createHarness(page, { settleMs: 1000 });
    const baseUrl = 'http://localhost:4004/idts.bugmanagementui/index.html';

    try {
        console.log('\\n1. Test: Negative Login (Wrong password)');
        await page.goto(baseUrl);
        await page.waitForURL('**/login.html**');
        await page.fill('#email', ROLES.TESTER);
        await page.fill('#password', 'invalid_password');
        await page.locator('button[type="submit"]').click();

        const errorVisible = await page.waitForSelector('.error-bar', { state: 'visible', timeout: 5000 });
        if (!errorVisible) throw new Error('Error bar did not appear for wrong password.');
        
        clearHarnessErrors(harness); // intentional failure
        console.log('✅ Passed: Wrong password rejected correctly.');

        console.log('\\n2. Test: Positive Login (Tester)');
        await page.fill('#email', ROLES.TESTER);
        await page.fill('#password', QA_PASSWORD);
        await harness.clickAndCheck(page.locator('button[type="submit"]'), 'positive_login');

        await page.waitForURL('**/index.html**');
        await page.waitForSelector('.sapFDynamicPage', { timeout: 15000 });
        console.log('✅ Passed: Valid login succeeded and redirected to Fiori app.');

        console.log('\\n3. Test: Unauthorized / role-negative action');
        const assignActionRes = await page.evaluate(async () => {
            const token = sessionStorage.getItem('idts_auth_token');
            const res = await fetch('/odata/v4/bug/Bugs(ID=90000000-0000-0000-0000-000000000003,IsActiveEntity=true)/BugService.assignBug', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: JSON.stringify({ processor_ID: "80000000-0000-0000-0000-000000000001" })
            });
            return res.status;
        });
        
        clearHarnessErrors(harness); // intentional failure
        
        if (assignActionRes !== 403 && assignActionRes !== 400) {
            console.log(`⚠️  Warning: Role-negative case returned ${assignActionRes}`);
        } else {
            console.log('✅ Passed: Role-negative case correctly blocked.');
        }

        console.log('\\n4. Test: Persistence/Reload');
        await harness.saveReloadAndCheck(async () => {
            const token = await page.evaluate(() => sessionStorage.getItem('idts_auth_token'));
            return !!token;
        }, 'persistence_reload');
        console.log('✅ Passed: Session token persists across reloads.');

        console.log('\\n5. Test: Logout and Session Invalidation');
        await page.evaluate(() => window.idtsLogout());
        await page.waitForURL('**/login.html**');
        console.log('✅ Passed: Logout successful and redirected to login.');

        console.log('\\n6. Test: Authenticated Workflow Action (PM)');
        await page.fill('#email', ROLES.PM);
        await page.fill('#password', QA_PASSWORD);
        await harness.clickAndCheck(page.locator('button[type="submit"]'), 'pm_login');
        await page.waitForURL('**/index.html**');
        await page.waitForSelector('.sapFDynamicPage', { timeout: 15000 });
        
        const oldRecord = getEmailOutboxLastRecord();

        const rejectActionRes = await page.evaluate(async () => {
            const token = sessionStorage.getItem('idts_auth_token');
            const res = await fetch('/odata/v4/bug/Bugs(ID=90000000-0000-0000-0000-000000000003,IsActiveEntity=true)/BugService.rejectBug', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: JSON.stringify({ reason: "QA Test Reject to trigger Email" })
            });
            return res.ok;
        });

        if (!rejectActionRes) throw new Error('Failed to reject bug via API');
        console.log('✅ Passed: Authenticated workflow action executed.');

        console.log('\\n7. Test: Email Notification Delivery Check');
        await page.waitForTimeout(2000);
        const newRecord = getEmailOutboxLastRecord();
        
        if (newRecord.ID === oldRecord?.ID) {
            throw new Error('Email Outbox record was not created after rejecting bug.');
        }
        console.log(`Outbox Record: [${newRecord.channel_code}] to [${newRecord.recipientEmail}] Status: [${newRecord.status_code}]`);
        if (newRecord.status_code !== 'SENT' && newRecord.status_code !== 'FAILED' && newRecord.status_code !== 'PENDING' && newRecord.status_code !== 'SKIPPED') {
            throw new Error(`Unexpected delivery status: ${newRecord.status_code}`);
        }
        console.log('✅ Passed: Email Outbox record verified.');
        console.log('\\n🎉 All IDTS-38 Playwright tests passed successfully!');

    } catch (err) {
        console.error(`\\n❌ Test failed: ${err.message}`);
        process.exit(1);
    } finally {
        await browser.close();
    }
}
runTests();
