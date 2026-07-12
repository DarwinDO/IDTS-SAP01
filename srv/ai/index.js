// Học nhanh (DonHV): public entry point của AI modules. `srv/service.js` chỉ import từ đây để wiring không phụ thuộc implementation từng feature.
'use strict'

const { getAiConfig, normalizeAiConfig } = require('./config')
const { createAiSuggestion, serializeSuggestionPayload } = require('./audit')
const { createAiProvider } = require('./provider')
const {
  suggestSimilarBugs,
  rankSimilarBugCandidates
} = require('./duplicate-detection')
const {
  suggestClassification,
  buildClassificationSuggestions
} = require('./classification-suggestion')
const {
  summarizeBugHandoff,
  buildBugHandoffSummary
} = require('./bug-summary')
const {
  explainSmartAssignment,
  buildAssignmentExplanations
} = require('./assignment-explanation')
const { redactSensitiveText, sanitizeErrorSummary } = require('./safety')

module.exports = {
  createAiSuggestion,
  createAiProvider,
  getAiConfig,
  normalizeAiConfig,
  redactSensitiveText,
  serializeSuggestionPayload,
  sanitizeErrorSummary,
  suggestSimilarBugs,
  rankSimilarBugCandidates,
  suggestClassification,
  buildClassificationSuggestions,
  summarizeBugHandoff,
  buildBugHandoffSummary,
  explainSmartAssignment,
  buildAssignmentExplanations
}
