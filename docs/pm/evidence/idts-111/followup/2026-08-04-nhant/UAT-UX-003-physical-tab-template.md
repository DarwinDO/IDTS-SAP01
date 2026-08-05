# UAT-UX-003 physical Tab-key confirmation — NhanT

This file is a member-owned template, not completed evidence. NhanT must perform and fill it personally.

- Runtime SHA: `67b1bf86169e9696c9365ef4846b99ffae30d4e2`
- Executed at: 2026-08-05 9:38 AM ICT
- Browser/device: Chrome / Windows / physical keyboard
- Start control: Create button; Comment area; Find Similar Bugs button
- Observed Tab sequence: List Report Create flow and Object Page comment/actions followed a logical order. In the Find Similar Bugs dialog, keyboard focus reached only the first similar-bug result and skipped the remaining similar-bug results.
- Focus indicator visible at each step: YES
- Dialog closed with Escape: YES
- Focus returned to trigger: YES
- Actual result: Create form, comment area, action controls, dialog opening, Escape closing, and focus return behaved correctly. However, the focus order inside the Find Similar Bugs dialog was incomplete: Tab navigated through only the first similar-bug result and did not reach the remaining similar-bug results.
- Candidate outcome: DOES_NOT_MEET_EXPECTED_RESULT
- Sanitized screenshot filenames: `UAT-UX-003-trigger-focus.png`; `UAT-UX-003-first-result-focus.png`
- Questions or limitation: Accessibility defect candidate: remaining similar-bug results are skipped during physical Tab-key navigation. DonHV review is required for final disposition.
