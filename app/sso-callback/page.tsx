"use client";
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

// Handles the return from Google's OAuth redirect and completes the Clerk
// sign-in, then sends the user on to `/` (per redirectUrlComplete).
export default function SSOCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400">Menyelesaikan login...</p>
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
