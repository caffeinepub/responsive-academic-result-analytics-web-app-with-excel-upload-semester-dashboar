# Specification

## Summary
**Goal:** Improve the Dashboard UI by consistently showing subject-name abbreviations next to subject codes, and make the “View failed students” list scrollable for long lists.

**Planned changes:**
- Derive a short abbreviation from each subject’s name in the existing subject catalog and display it alongside the subject code across the Dashboard (Subject Analysis list, Student Data Sheet backlog badges, Subject-wise Results table, and visualization labels), with a safe fallback when the subject name is missing.
- Update the “View failed students” list in Dashboard > Subject Analysis to have a fixed maximum height with an internal vertical scrollbar, without breaking existing click/selection behavior.

**User-visible outcome:** Subject codes throughout the Dashboard show a consistent subject-name abbreviation (e.g., “Digital Electronics (DE)”), and the “View failed students” list can be scrolled to access and select all roll numbers.
