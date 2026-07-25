# IDTS-98: QA: Build deterministic AI quality and safety evaluation dataset

## Context
Functional tests prove the actions run; a controlled evaluation set is needed to measure whether four AI features are useful, grounded, and safe.

**Owner:** NhanT
**Support:** DatDT, SangVN, DonHV
**Status:** DONE
**Due date:** 2026-08-02

## Scope
* Build a small version-controlled, sanitized evaluation dataset for Similar Bugs, Classification, Handoff Summary, and Smart Assign explanation.
* Include English, Vietnamese, mixed-language, sparse/no-result, malformed, provider-unavailable, and prompt-injection scenarios.
* Define simple metrics: Top-K relevance, catalog accuracy, groundedness, acceptance/rejection/ignore rate, abstention, and safety failure.
* Produce a repeatable QA report without building a generic evaluation platform.

## Acceptance Criteria
- [x] All four features have positive and adversarial cases.
- [x] Expected outcomes are explicit and reviewable.
- [x] Metrics are reproducible across mock runs.
- [x] Provider unavailable and unsafe input degrade safely.
- [x] AI cannot mutate workflow during evaluation.
- [x] EN/VI/mixed-language coverage is present.
- [x] Evidence and known limitations are documented.

## Resolution
The evaluation dataset was successfully created with synthetic scenarios. A deterministic mock test was scripted and successfully covered all edge, negative, prompt-injection, sparse, and positive multi-lingual scenarios. The generated evidence report demonstrates perfect fallback mechanisms for unsafe/unavailable cases. Task is complete.
