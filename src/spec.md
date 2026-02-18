# Specification

## Summary
**Goal:** Make roll numbers shown in the Subject Analysis “Backlog Distribution” panel clickable so selecting one opens the existing Student Data Sheet for that student.

**Planned changes:**
- Render each roll number in the Backlog Distribution panel as an interactive control with clear hover/focus states.
- Add a roll-number selection callback prop (e.g., `onRollNumberSelect`) to `BacklogDistributionPanel` and invoke it when a roll number is clicked.
- Wire `SemesterDashboardView` to pass its existing roll-number selection handler to `BacklogDistributionPanel`, keeping `StudentDataSheetPanel` rendered/controlled only in `SemesterDashboardView`.
- Reuse existing Student Data Sheet behavior: show the student’s sheet when found, or the existing “Student Not Found” state when not found, without breaking the failed-students dropdown behavior.

**User-visible outcome:** In Dashboard > Subject Analysis, clicking any roll number in Backlog Distribution opens the same Student Data Sheet panel as selecting a roll number from the failed-students dropdown, including the existing “Student Not Found” behavior when applicable.
