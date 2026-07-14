"use client";
import { useClerk, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SignInPage() {
  const clerk = useClerk();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in (e.g. logout didn't fully clear, or opened directly)?
  // Send them into the app instead of showing a dead sign-in screen.
  useEffect(() => {
    if (authLoaded && isSignedIn) router.replace("/");
  }, [authLoaded, isSignedIn, router]);

  const signInWithGoogle = async () => {
    // Use the Clerk client directly — the useSignIn() hook's `isLoaded` never
    // flips true in this setup, but clerk.client.signIn is available once loaded.
    const signIn = clerk?.client?.signIn;
    if (!signIn) {
      setError("Autentikasi belum siap. Tunggu sebentar lalu coba lagi.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
        // Always show Google's account chooser so a different Gmail can be picked.
        oidcPrompt: "select_account",
      });
    } catch (err) {
      console.error("Google sign-in error", err);
      setError("Gagal memulai login. Coba lagi.");
      setLoading(false);
    }
  };

  const redirecting = authLoaded && isSignedIn;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="max-w-md w-full p-8 rounded-3xl shadow-xl bg-white dark:bg-slate-800 text-center">
        <img src="/logo-yes.png" alt="YES Logo" className="h-12 mx-auto mb-6 object-contain" />
        <h1 className="text-2xl font-bold mb-2 text-slate-800 dark:text-white">Welcome to Elix</h1>
        <p className="text-sm mb-8 text-slate-500 dark:text-slate-400">
          Platform Evaluasi dan Pembelajaran Interaktif. Silakan login untuk melanjutkan.
        </p>

        {error && <p className="text-xs font-semibold text-rose-500 mb-4">{error}</p>}

        <button
          onClick={signInWithGoogle}
          disabled={loading || redirecting}
          className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-2xl cursor-pointer shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading ? "Mengalihkan ke Google..." : "Login dengan Akun Google"}
        </button>

        {/* Mount point for Clerk's Smart CAPTCHA (bot protection). Required in
            custom auth flows — without it Clerk logs a "clerk-captcha not found"
            error and falls back to the invisible widget. */}
        <div id="clerk-captcha" className="mt-4 flex justify-center empty:mt-0" />
      </div>
    </div>
  );
}
