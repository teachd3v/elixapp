<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# UI/UX Best Practices
- **No Native Browser Dialogs**: NEVER use native browser dialogs like `window.prompt`, `window.alert`, or `window.confirm` when building features or UI elements. Always build and use custom React modal components (e.g., using state and proper styling) to ensure a modern, professional, and seamless user experience.

# Next.js Turbopack & Prisma Caching Troubleshooting
- **Prisma Client Cache Invalidation**: If the Next.js app (using Turbopack) fails to recognize newly added Prisma models or schema changes after running `npx prisma db push`, it is highly likely due to aggressive caching in the `.next` directory. To resolve this:
  1. Run `npx prisma generate` to ensure the client is generated.
  2. Stop the dev server (`npm run dev`).
  3. Delete the `.next` folder entirely (`Remove-Item -Recurse -Force .next` on Windows, or `rm -rf .next` on Unix).
  4. Restart the dev server to force a clean build and reload the new Prisma Client in memory.
