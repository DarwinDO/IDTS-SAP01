import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));
const normalizePath = (value) => value.split(path.sep).join('/');
const sha256 = async (file) => crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex').toUpperCase();
const exists = async (file) => fs.stat(file).then((stat) => stat.isFile()).catch(() => false);

async function verifiedEvidence(repoRoot, absoluteFile, entry, options = {}) {
  if (!(await exists(absoluteFile))) return null;
  const actual = await sha256(absoluteFile);
  const recorded = entry?.sha256?.toUpperCase();
  if (recorded && recorded !== actual) return null;
  return {
    path: normalizePath(path.relative(repoRoot, absoluteFile)),
    sha256: actual,
    caption: entry?.description || entry?.caption || path.basename(absoluteFile),
    reviewBlocked: Boolean(options.reviewBlocked)
  };
}

function normalizeCatalogCase(item, status) {
  return {
    id: item.caseId,
    area: item.domain || item.journey || 'General',
    title: item.title,
    preconditions: item.preconditions || '',
    steps: Array.isArray(item.steps) ? item.steps.join('\n') : String(item.steps || ''),
    expected: item.expectedResult || '',
    catalogStatus: status,
    reviewDisposition: status,
    reviewNote: '',
    evidence: []
  };
}

export async function loadUnitCases(repoRoot) {
  const catalog = await readJson(path.join(repoRoot, 'docs/qa/idts-110-unit-test-catalog.json'));
  const taxonomy = await readJson(path.join(repoRoot, 'docs/pm/evidence/idts-110/donhv-case-taxonomy.json'));
  const reviews = new Map(taxonomy.cases.map((item) => [item.caseId, item]));
  const rows = [];
  for (const item of catalog.cases) {
    const row = normalizeCatalogCase(item, item.execution?.status || 'NOT_RUN');
    const review = reviews.get(item.caseId);
    if (review) {
      row.reviewDisposition = review.reviewDecision;
      row.reviewNote = review.reviewRationale;
      const manifestFile = path.join(repoRoot, 'docs/pm/evidence/idts-110/cases', item.caseId, 'case-manifest.json');
      if (await exists(manifestFile)) {
        const manifest = await readJson(manifestFile);
        const manifestNames = new Set(manifest.evidenceFiles || []);
        for (const name of review.evidenceFiles || []) {
          if (!manifestNames.has(name)) continue;
          const evidence = await verifiedEvidence(repoRoot, path.join(path.dirname(manifestFile), name), { caption: name }, {
            reviewBlocked: review.reviewDecision !== 'ACCEPTED_CANDIDATE'
          });
          if (evidence) row.evidence.push(evidence);
        }
      }
    }
    if (!row.evidence.length) row.reviewNote = [row.reviewNote, 'No valid case-specific image evidence'].filter(Boolean).join(' ');
    rows.push(row);
  }
  return rows;
}

export async function loadUatCases(repoRoot) {
  const catalog = await readJson(path.join(repoRoot, 'docs/qa/idts-111-uat-catalog.json'));
  const rows = [];
  for (const item of catalog.cases) {
    const row = normalizeCatalogCase(item, item.execution?.status || 'PREPARED');
    const manifestFile = path.join(repoRoot, 'docs/pm/evidence/idts-111/uat', item.caseId, 'manifest.json');
    if (await exists(manifestFile)) {
      const manifest = await readJson(manifestFile);
      const outcome = String(manifest.candidateOutcome || '').toUpperCase();
      row.reviewDisposition = outcome.includes('DOES_NOT_MEET') ? 'DOES_NOT_MEET_EXPECTED_RESULT'
        : outcome.includes('MEETS') ? 'MEETS_EXPECTED_RESULT'
          : outcome.includes('BLOCK') ? 'BLOCKED'
            : manifest.donhvLatestReview?.currentStatus || 'EXECUTED_PENDING_REVIEW';
      if (manifest.donhvLatestReview?.category === 'VALID_PRECONDITION_BLOCKER') row.reviewDisposition = 'BLOCKED';
      row.reviewNote = [manifest.actualResult, manifest.reviewBoundary, ...(manifest.limitations || [])].filter(Boolean).join(' ');
      const reviewBlocked = !['MEETS_EXPECTED_RESULT'].includes(row.reviewDisposition)
        || manifest.donhvLatestReview?.category === 'FIXTURE_PROVENANCE_INCONSISTENT';
      for (const entry of manifest.evidence || []) {
        const evidence = await verifiedEvidence(repoRoot, path.join(path.dirname(manifestFile), entry.file), entry, { reviewBlocked });
        if (evidence) row.evidence.push(evidence);
      }
    }
    if (!row.evidence.length) row.reviewNote = [row.reviewNote, 'No valid case-specific image evidence'].filter(Boolean).join(' ');
    rows.push(row);
  }
  return rows;
}
