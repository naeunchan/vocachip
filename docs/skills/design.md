# AGENTS.md

## Product UI/UX rules

When editing user-facing screens, always optimize for clarity, usability, and accessibility.

### Core principles

- Prioritize comprehension over visual minimalism.
- Prefer clear text labels over ambiguous icon-only UI.
- Use action-oriented button labels.
- Do not rely on placeholder-only form fields.
- Make clickable/tappable elements visually obvious.
- Preserve important information in visible content, not hidden behind tooltips.
- Maintain consistent spacing, typography, and component behavior.
- Keep the AI example action button theme-invariant and blue-family: its color, border, and background must stay identical in light and dark modes.
- Improve accessibility by default.

### Forms

- Every input must have a visible label.
- Clearly distinguish required and optional fields.
- Error messages must explain what to fix.
- Helper text should be concise and useful.

### Navigation and actions

- Important actions should not be icon-only unless universally recognized.
- Navigation labels should be easy to scan.
- Primary and secondary actions must be visually distinct.

### Accessibility

- Ensure readable contrast.
- Preserve focus states where applicable.
- Use semantic labels/roles when supported.
- Use touch-friendly target sizes.

### Engineering constraints

- Reuse shared components when possible.
- Avoid unnecessary dependencies.
- Do not alter business logic unless required for UX correctness.
- Keep changes incremental and production-ready.

### Expected response format

When finishing a UI task, report:

1. UX issues found
2. Files changed
3. What was improved
4. Remaining UX debt
