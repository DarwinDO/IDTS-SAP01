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
  buildClassificationSuggestions
}
