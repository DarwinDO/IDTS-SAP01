/**
 * Gợi ý học/debug: module này chỉ đổi dữ liệu AI thành text/trạng thái an toàn cho UI, không quyết định nghiệp vụ.
 * Reusable user-facing UI state mapping for IDTS AI suggestions.
 *
 * Keep this module presentation-focused. Backend actions still own AI
 * generation, validation, auditing, and workflow safety.
 */
sap.ui.define([], function () {
    "use strict";

    var LOW_CONFIDENCE_THRESHOLD = 0.6;
    var INTERNAL_COPY_PATTERN = /\b(prompt|token|model|provider|architecture|debug|stack|sql|password|credential|secret|api key|bearer|endpoint)\b/i;

    function numberOrNull(value) {
        if (value === null || value === undefined || value === "") {
            return null;
        }
        var number = Number(value);
        return Number.isFinite(number) ? number : null;
    }

    function cleanText(value, fallback) {
        var text = typeof value === "string" ? value.trim() : "";
        if (!text || INTERNAL_COPY_PATTERN.test(text)) {
            return fallback || "";
        }
        return text;
    }

    function statusText(status, confidence, getText) {
        var code = String(status || "").toUpperCase();
        if (code === "SUCCESS" || code === "EXPLAINED" || code === "SUGGESTED" || code === "GROUNDED") {
            if (confidence !== null && confidence < LOW_CONFIDENCE_THRESHOLD) {
                return getText("aiReviewStatusLowConfidence");
            }
            return getText("aiReviewStatusReady");
        }
        if (code === "AI_DISABLED" || code === "DISABLED") {
            return getText("aiReviewStatusDisabled");
        }
        if (code === "AI_TIMEOUT" || code === "AI_PROVIDER_ERROR" || code === "AI_OUTPUT_UNSAFE" || code === "AI_PROVIDER_UNSUPPORTED") {
            return getText("aiReviewStatusUnavailable");
        }
        return getText("aiReviewStatusReviewRequired");
    }

    function stateFor(status, confidence, warnings) {
        var code = String(status || "").toUpperCase();
        if (code === "AI_TIMEOUT" || code === "AI_PROVIDER_ERROR" || code === "AI_OUTPUT_UNSAFE" || code === "AI_PROVIDER_UNSUPPORTED") {
            return "Warning";
        }
        if (code === "AI_DISABLED" || code === "DISABLED") {
            return "Information";
        }
        if ((confidence !== null && confidence < LOW_CONFIDENCE_THRESHOLD) || warnings) {
            return "Warning";
        }
        return "Information";
    }

    function decorateResult(row, getText) {
        var confidence = numberOrNull(row && row.confidence);
        var warnings = cleanText(row && row.warnings, "");
        var providerStatus = row && row.providerStatus;
        var status = providerStatus || (row && row.status);
        var explanation = cleanText(row && row.explanation, getText("aiReviewExplanationUnavailable"));
        var reviewText = statusText(status, confidence, getText);

        return {
            explanation: explanation,
            meta: confidence !== null
                ? getText("aiReviewConfidence", [Math.round(confidence * 100), reviewText])
                : reviewText,
            state: stateFor(status, confidence, warnings),
            warnings: warnings,
            hasWarnings: Boolean(warnings),
            decisionHint: getText("aiReviewDecisionHint"),
            requiresReview: true
        };
    }

    function loading(getText) {
        return {
            explanation: getText("aiReviewLoading"),
            meta: getText("aiReviewStatusReviewRequired"),
            state: "Information",
            warnings: "",
            hasWarnings: false,
            decisionHint: getText("aiReviewDecisionHint"),
            requiresReview: true
        };
    }

    function unavailable(getText) {
        return decorateResult({
            explanation: getText("aiReviewExplanationUnavailable"),
            providerStatus: "AI_PROVIDER_ERROR",
            confidence: null,
            warnings: ""
        }, getText);
    }

    function hasInternalCopy(value) {
        return INTERNAL_COPY_PATTERN.test(String(value || ""));
    }

    return {
        decorateResult: decorateResult,
        loading: loading,
        unavailable: unavailable,
        hasInternalCopy: hasInternalCopy
    };
});
