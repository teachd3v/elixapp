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

# React-PDF Document Generation
- **Standard Core Fonts**: Saat membuat komponen dokumen menggunakan `@react-pdf/renderer`, selalu gunakan standard PDF core fonts (`Helvetica`, `Helvetica-Bold`) daripada mendaftarkan font eksternal/remote (seperti Roboto melalui CDN). Hal ini mencegah error runtime `Font family not registered` dan memastikan dokumen dapat di-generate offline secara instan dan andal.
- **Handling Unconducted Evaluation Cycles**: Pada laporan multi-siklus/komparatif (misal Baseline -> Mid-Review -> End-Review), jika ada siklus mendatang yang belum terlaksana (`!isActive` dan belum ada nilai pengisian SA/MA), JANGAN merender tabel kosong atau error. Selalu sediakan halaman informasi status khusus berpenampilan rapi dengan keterangan resmi bahwa siklus tersebut "Belum Dilaksanakan" beserta jadwal tanggalnya.

# PWA & Service Worker Best Practices
- **Synchronous Response Cloning**: Saat mengimplementasikan strategi caching di Service Worker (`sw.js`), `response.clone()` WAJIB dipanggil secara **sinkron** segera setelah menerima `networkResponse`, SEBELUM fungsi asinkron (seperti `caches.open`) dan sebelum mengembalikan respons ke browser. Menaruh `.clone()` di dalam callback asinkron setelah respons diserahkan ke browser akan mengunci stream body dan memicu `TypeError: Failed to execute 'clone' on 'Response': Response body is already used`.
- **Navigation & Auth Route Isolation**:
  1. Untuk navigasi dokumen HTML (`request.mode === 'navigate'`), selalu gunakan strategi **Network-First** agar sesi login, token Clerk, dan otorisasi role selalu sinkron dengan server.
  2. Selalu lewati (bypass) request API (`/api/`), halaman autentikasi (`/sign-in`, `/sign-up`, `/sso-callback`), dynamic RSC payload (`_rsc`), dan request domain eksternal agar langsung menuju jaringan tanpa campur tangan Service Worker.

