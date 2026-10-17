"use client";
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import AppLoadingScreen from "../../components/AppLoadingScreen";

// Handles the return from Google's OAuth redirect and completes the Clerk
// sign-in, then sends the user on to `/` (per redirectUrlComplete).
export default function SSOCallbackPage() {
  return (
    <>
      <AppLoadingScreen message="Menyelesaikan login..." />
      <AuthenticateWithRedirectCallback />
    </>
  );
}
