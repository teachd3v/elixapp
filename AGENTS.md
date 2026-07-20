<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# UI/UX Best Practices
- **No Native Browser Dialogs**: NEVER use native browser dialogs like `window.prompt`, `window.alert`, or `window.confirm` when building features or UI elements. Always build and use custom React modal components (e.g., using state and proper styling) to ensure a modern, professional, and seamless user experience.
- **Mobile Nav Clearances (Sticky Elements)**: When adding `fixed` or `sticky` action buttons at the bottom of a mobile screen, always place them above the main MobileNav to avoid overlapping. Use `bottom-24` (or similar) for the button, and ensure the main scrollable container has at least `pb-32` padding so content isn't obscured.
# Next.js Turbopack & Prisma Caching Troubleshooting
- **Turbopack Panics & Cache Invalidation**: If the Next.js app (using Turbopack) fails to recognize newly added Prisma models, OR if Turbopack throws a Rust panic (e.g., `thread 'tokio-runtime-worker' panicked`) / browser hangs on a white screen after mass file changes (like ESLint auto-fix), it is due to a corrupt or aggressive cache in the `.next` directory. To resolve this:
  1. Run `npx prisma generate` to ensure the client is generated.
  2. Stop the dev server (`npm run dev`).
  3. Delete the `.next` folder entirely (`Remove-Item -Recurse -Force .next` on Windows, or `rm -rf .next` on Unix).
  4. Restart the dev server to force a clean build and reload the new Prisma Client in memory.

# Prisma Database & Query Practices
- **Nested Relation Filtering**: When querying nested relations in Prisma (e.g., fetching `AssessmentRecord` but filtering by `awardee.wilayahId`), avoid using deep `include: { relation: { where: ... } }` as it may silently fail and return empty arrays. Instead, include the necessary relation fields and filter the array in JavaScript memory.

# ELIX Domain Logic
- **Assessment Data (Live vs Historical)**: Assessment data lives in two places depending on the cycle state. 
  1. **Live Data**: The currently active `AssessmentPeriod` (`isActive: true`) has its scores stored in `AwardeeProfile` (`saScore`, `maScore`, `elix`, etc.).
  2. **Historical Data**: Closed/inactive `AssessmentPeriod`s have their frozen scores stored in `AssessmentRecord`.
  When calculating or charting trends (e.g. Tren Siklus ELIX), you MUST dynamically check if the period `isActive`. If active, pull values from the live `AwardeeProfile`. If inactive, pull from `AssessmentRecord`. Do NOT create dummy "Saat Ini" periods for live data.
