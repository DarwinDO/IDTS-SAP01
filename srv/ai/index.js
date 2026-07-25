// Public entry point của AI modules. `srv/service.js` chỉ import từ đây để wiring không phụ thuộc file feature cụ thể.
// File không gọi provider hay ghi DB; nó chỉ re-export contract nội bộ đã được safety/audit module bảo vệ.
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
const {
  acceptAiSuggestion,
  rejectAiSuggestion,
  ignoreAiSuggestion
} = require('./review')
const { applyClassificationSuggestion } = require('./classification-apply')
const { confirmDuplicateSuggestion } = require('./duplicate-confirmation')
const { redactSensitiveText, sanitizeErrorSummary } = require('./safety')

// Nhóm export gồm config/provider/audit dùng chung, bốn feature entry point và các pure builder để test.
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
  buildAssignmentExplanations,
  acceptAiSuggestion,
  rejectAiSuggestion,
  ignoreAiSuggestion,
  applyClassificationSuggestion,
  confirmDuplicateSuggestion
}
