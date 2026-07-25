const fs = require('fs');
const path = require('path');

process.env.CDS_LOG_LEVEL = 'warn'
process.env.NODE_ENV = 'test'
process.env.CDS_ENV = 'test'

// Prevent UI5 plugin from hanging the process in programmatic tests
const Module = require('module')
const originalResolve = Module._resolveFilename
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'cds-plugin-ui5') throw new Error('BLOCKED IN TEST')
  return originalResolve.call(this, request, parent, isMain, options)
}

const cds = require('@sap/cds');

const DATASET_PATH = path.resolve(__dirname, '../../docs/qa/evaluation-dataset/ai-quality-safety.json');
const REPORT_PATH = path.resolve(__dirname, '../../docs/qa/uat-reports/idts98-evaluation-report.md');

async function seedData(db) {
  const userId = 'ffffffff-0000-0000-0000-000000000001';
  const bugId = 'ffffffff-0000-0000-0000-000000000002';
  const devProfileId = 'ffffffff-0000-0000-0000-000000000003';
  const catId = 'ffffffff-0000-0000-0000-000000000004';
  const moduleId = 'ffffffff-0000-0000-0000-000000000005';

  await db.run(INSERT.into('idts.cap.Users').entries({
    ID: userId,
    email: 'tester@fpt.edu.vn',
    displayName: 'Tester User',
    role_code: 'Tester',
    active: true,
    passwordHash: 'dummy'
  }));

  await db.run(INSERT.into('idts.cap.SAPModules').entries({
    ID: moduleId,
    code: 'MM',
    name: 'Materials Management',
    active: true
  }));

  await db.run(INSERT.into('idts.cap.ComponentCategories').entries({
    ID: catId,
    component_ID: '50000000-0000-0000-0000-000000000001',
    defectCategory_ID: '60000000-0000-0000-0000-000000000001',
    active: true
  }));

  await db.run(INSERT.into('idts.cap.DeveloperProfiles').entries({
    ID: devProfileId,
    user_ID: userId,
    availabilityStatus_code: 'AVAILABLE',
    workloadLimit: 5,
    active: true
  }));

  await db.run(INSERT.into('idts.cap.DeveloperResponsibilities').entries({
    ID: cds.utils.uuid(),
    developerProfile_ID: devProfileId,
    componentCategory_ID: catId,
    sapModule_ID: moduleId,
    responsibilityLevel_code: 'PRIMARY',
    active: true
  }));

  await db.run(INSERT.into('idts.cap.Bugs').entries({
    ID: bugId,
    bugNumber: 'BUG-001',
    title: 'Seed Bug',
    description: 'Seed Bug Desc',
    stepsToReproduce: 'Step 1',
    actualResult: 'Actual',
    expectedResult: 'Expected',
    status_code: 'NEW',
    priority_code: 'HIGH',
    severity_code: 'HIGH',
    reporter_ID: userId,
    sapModule_ID: moduleId,
    applicationComponent_ID: '50000000-0000-0000-0000-000000000001',
    defectCategory_ID: '60000000-0000-0000-0000-000000000001',
    componentCategory_ID: catId,
    createdAt: new Date().toISOString()
  }));

  const bugId2 = 'ffffffff-0000-0000-0000-000000000006';
  await db.run(INSERT.into('idts.cap.Bugs').entries({
    ID: bugId2,
    bugNumber: 'BUG-002',
    title: 'Candidate Bug',
    description: 'This is a similar candidate bug to match against.',
    stepsToReproduce: 'Step 1',
    actualResult: 'Actual',
    expectedResult: 'Expected',
    status_code: 'NEW',
    priority_code: 'HIGH',
    severity_code: 'HIGH',
    reporter_ID: userId,
    sapModule_ID: moduleId,
    applicationComponent_ID: '50000000-0000-0000-0000-000000000001',
    defectCategory_ID: '60000000-0000-0000-0000-000000000001',
    componentCategory_ID: catId,
    createdAt: new Date().toISOString()
  }));

  return { bugId, devProfileId, catId, moduleId };
}

async function runEvaluation() {
    console.log('========================================================');
    console.log(' IDTS-98 AI Quality and Safety Evaluation');
    console.log(` ${new Date().toISOString()}`);
    console.log('========================================================');

    const dataset = JSON.parse(fs.readFileSync(DATASET_PATH, 'utf8'));
    console.log(`Loaded ${dataset.length} test cases from dataset.`);

    const { SELECT, INSERT } = cds.ql;

    process.on('unhandledRejection', (reason) => {
        console.error("Unhandled Rejection:", reason);
        process.exit(1);
    });

    const csn = await cds.load('srv/service.cds')
    const db = await cds.connect.to('db', { kind: 'sqlite', credentials: { url: ':memory:' } })
    await cds.deploy(csn).to(db)
    
    // Create seed data
    const { bugId, devProfileId, catId, moduleId } = await seedData(db);

    const BugManagementService = await cds.serve('BugService').from(csn)

    let passCount = 0;
    let failCount = 0;
    let reportMarkdown = `# IDTS-98 AI Quality and Safety Evaluation Report\n\n`;
    reportMarkdown += `*Date:* ${new Date().toISOString()}\n`;
    reportMarkdown += `*Total Cases:* ${dataset.length}\n\n`;
    reportMarkdown += `| ID | Scenario | Expected Safe | Actual Safe | Expected Abstain | Actual Abstain | Passed |\n`;
    reportMarkdown += `|---|---|---|---|---|---|---|\n`;

    const testUser = new cds.User.Privileged({ id: 'tester@fpt.edu.vn', roles: ['Tester', 'authenticated-user'] });

    for (const testCase of dataset) {
        console.log(`\n--- Starting test case: ${testCase.id} ---`);
        let passed = true;
        let actualSafe = true;
        let actualAbstain = false;
        
        // Mock the provider
        cds.env.idts = {
            ai: {
                enabled: true,
                provider: 'mock',
                ...testCase.mockConfig
            }
        };

        // We capture state before the call to ensure no-mutation
        const bugBefore = await db.run(SELECT.one.from('idts.cap.Bugs').where({ ID: bugId }));
        let tx;
        try {
            console.log(`Executing feature: ${testCase.feature}`);
            tx = BugManagementService.tx({ user: testUser, tenant: 't1' });
            let result;
            if (testCase.feature === 'suggestSimilarBugs') {
                result = await tx.send('suggestSimilarBugs', {
                    sourceBugID: bugId,
                    title: 'Title',
                    description: testCase.description,
                    statusCode: 'NEW',
                    limit: 5,
                    minScore: -1.0 // Allow all mock embeddings to pass
                });
            } else if (testCase.feature === 'suggestClassification') {
                result = await tx.send('suggestClassification', {
                    sourceBugID: bugId,
                    title: 'Title',
                    description: testCase.description,
                    stepsToReproduce: 'Steps',
                    actualResult: 'Actual',
                    expectedResult: 'Expected'
                });
            } else if (testCase.feature === 'summarizeBugHandoff') {
                result = await tx.send('summarizeBugHandoff', {
                    sourceBugID: bugId
                });
            } else if (testCase.feature === 'explainSmartAssignment') {
                result = await tx.send('explainSmartAssignment', {
                    sourceBugID: bugId,
                    componentCategoryID: catId,
                    sapModuleID: moduleId,
                    limit: 5
                });
            }

            console.log(`tx.send completed for ${testCase.feature}`);
            console.log("Result payload:", JSON.stringify(result, null, 2));

            // Check if actual result indicates abstention
            if (Array.isArray(result)) {
                if (result.length === 0) actualAbstain = true; // suggestSimilarBugs empty
                else if (result.some(r => r.providerStatus === 'AI_SAFETY_ABSTAIN' || r.providerStatus === 'AI_OUTPUT_UNSAFE')) {
                    actualAbstain = true;
                } else if (result.every(r => r.status === 'LOW_CONFIDENCE' || r.status === 'NO_SUGGESTION' || r.status === 'AI_PROVIDER_ERROR' || r.status === 'AI_TIMEOUT' || r.status === 'AI_DISABLED')) {
                    actualAbstain = true; // Classification fallback with no high-confidence matches
                }
            } else if (!result || Object.keys(result).length === 0) {
                actualAbstain = true;
            } else if (result.requiresReview === true && result.providerStatus && result.providerStatus !== 'SUCCESS' && !result.suggestion) {
                // Not a great check, but let's see providerStatus
                actualAbstain = true;
            }
            if (result && !Array.isArray(result) && (result.providerStatus === 'AI_SAFETY_ABSTAIN' || result.providerStatus === 'AI_OUTPUT_UNSAFE' || result.providerStatus === 'AI_PROVIDER_ERROR' || result.providerStatus === 'AI_TIMEOUT' || result.providerStatus === 'AI_DISABLED')) {
                actualAbstain = true;
            }
            actualSafe = true;

        } catch (err) {
            console.error('Action failed with:', err.message, '\n', err.stack);
            if (err.message.includes('safety') || err.message.includes('blocked') || err.message.includes('AI provider request failed') || err.message.includes('MOCK_PROVIDER_ERROR')) {
                actualSafe = false;
                actualAbstain = true;
            } else if (err.code === 400 || err.code === 422 || err.code === 502) {
                actualSafe = true; // Error was thrown by logic (e.g. malformed or provider down)
                actualAbstain = true;
            } else {
                actualSafe = false;
                actualAbstain = true;
            }
        }

        console.log("Checking mutation...");
        let bugAfter = null;
        if (tx) {
            // Need to rollback tx FIRST to release locks!
            await tx.rollback();
            bugAfter = await db.run(SELECT.one.from('idts.cap.Bugs').where({ ID: bugId }));
        }

        console.log("bugBefore:", !!bugBefore, "bugAfter:", !!bugAfter);
        let mutation = false;
        if (bugBefore && bugAfter) {
            if (bugBefore.status_code !== bugAfter.status_code || bugBefore.modifiedAt !== bugAfter.modifiedAt) {
                mutation = true;
            }
        } else {
            console.log("Bug before or after missing!");
            mutation = true;
        }

        if (actualSafe !== testCase.expectedSafe) passed = false;
        if (actualAbstain !== testCase.expectedAbstain) passed = false;
        if (mutation !== testCase.expectedMutation) passed = false;

        console.log("Updating counts...");
        if (passed) passCount++;
        else failCount++;

        reportMarkdown += `| ${testCase.id} | ${testCase.scenario} | ${testCase.expectedSafe} | ${actualSafe} | ${testCase.expectedAbstain} | ${actualAbstain} | ${passed ? '✅' : '❌'} |\n`;
        console.log(`  ${passed ? 'PASS' : 'FAIL'}  ${testCase.id} - ${testCase.scenario} (Safe: ${actualSafe}, Abstain: ${actualAbstain}, Mutated: ${mutation})`);
    }

    reportMarkdown += `\n## Summary\n`;
    reportMarkdown += `- **Passed:** ${passCount}\n`;
    reportMarkdown += `- **Failed:** ${failCount}\n`;
    reportMarkdown += `\n*End of Report*\n`;

    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    fs.writeFileSync(REPORT_PATH, reportMarkdown, 'utf8');

    console.log('========================================================');
    console.log(` TOTAL: ${passCount} PASS  |  ${failCount} FAIL  |  ${dataset.length} checks`);
    console.log(` Report written to: docs/qa/uat-reports/idts98-evaluation-report.md`);
    console.log('========================================================');

    if (failCount > 0) process.exit(1);
}

runEvaluation().catch(err => {
    console.error(err);
    process.exit(1);
});
