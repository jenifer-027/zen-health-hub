# Fitzen login, meal guidance, and sharing

## User experience
- Fix signup and login feedback, keep email confirmation enabled, add password recovery by email, and provide a page for choosing a replacement password.
- Add contextual meal suggestions to the existing wellness chat, using logged meal data when available without repeatedly naming health conditions.
- Add progress report downloads in CSV and print-friendly formats, plus grocery-list copy/share/download actions.
- Verify public auth screens and the relevant signed-in flows where the current Cloud state permits.

## Technical details
- Keep auth session handling and recovery links aligned with the existing React Router and Cloud Auth setup; do not auto-confirm accounts.
- Use existing progress and saved-plan data; avoid adding tables or schema changes.
- Preserve the existing weekly plan lock and existing app design tokens.
