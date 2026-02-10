# Specification

## Summary
**Goal:** Let users look up and view an individual student’s results by entering a Hallticket/Roll Number on the dashboard, using the currently loaded Excel data.

**Planned changes:**
- Add a "Hallticket No / Roll No" input and "Search" action to the Dashboard view, with Enter-to-search behavior.
- Implement client-side lookup against the currently parsed student records (matching `StudentRecord.rollNumber`) and show an inline “no results” message when there are no matches.
- Display matching record(s) (e.g., multiple semesters) with key details: student name (if available), roll number, semester, department (if available), overall status (pass/fail), backlog subjects (when present), and per-subject results (subject name/code, pass/fail, marks when available).
- Add a clear/dismiss mechanism to reset the displayed student results (e.g., Clear button and/or clearing input).
- Respect the currently selected Department filter by default when searching, and show a clear message when the roll number exists in the file but not under the current department selection (suggest switching to “All departments”), without changing the selection automatically.

**User-visible outcome:** On the dashboard, users can enter a hallticket/roll number to view that student’s result details from the uploaded Excel dataset, with clear messages when nothing matches (including under the selected department) and an easy way to clear results.
