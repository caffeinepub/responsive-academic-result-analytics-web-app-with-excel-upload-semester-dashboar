# Specification

## Summary
**Goal:** Adjust subject abbreviation generation rules so abbreviations exclude the word "and" and apply a custom rule for the word "through", without breaking existing formatting behavior.

**Planned changes:**
- Update the subject abbreviation derivation logic to skip the word "and" (case-insensitive) when generating abbreviations.
- Add custom handling for the word "through" (case-insensitive) instead of the default “first letter of each word” behavior.
- Ensure existing callers of `formatSubjectCodeWithAbbreviation` continue to work, including fallback to code-only display when the subject name is missing/unavailable.
- Add lightweight frontend test coverage for `deriveSubjectAbbreviation` covering normal multi-word names, names containing "and", names containing "through", and mixed-case inputs.

**User-visible outcome:** Subject codes/labels that display abbreviations will no longer include letters derived from "and", and will apply the custom abbreviation behavior for "through", with no UI regressions or runtime errors.
