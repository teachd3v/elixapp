"use client";
import { useClerk, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GraduationCap, UserCheck, Building } from "lucide-react";

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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white">
      {/* LEFT PANEL - Gradient Blue to Yellow */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#0f2942] via-sky-800 to-amber-400 p-12">
        <div className="absolute inset-0 bg-black/10"></div>
        
        <div className="relative z-10 flex items-center">
          <img src="/logo-yes.png" alt="YES Logo" className="h-20 w-auto object-contain brightness-0 invert" />
        </div>

        <div className="relative z-10 space-y-8 my-auto">
          <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-white tracking-tight">
            Portal Excellent<br/>Leader
          </h1>
          <p className="text-white/80 max-w-md text-lg leading-relaxed">
            Manage your data and activities with the YES GREAT Edunesia Dompet Dhuafa program
          </p>
          
          <div className="flex gap-4 mt-12">
            <div className="bg-white text-slate-900 p-5 rounded-2xl w-36 aspect-square flex flex-col justify-between shadow-xl">
              <div className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
              <p className="text-sm font-bold leading-tight">Awardee</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl w-36 aspect-square flex flex-col justify-between text-white">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <p className="text-sm font-bold leading-tight text-white/90">Mentor</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl w-36 aspect-square flex flex-col justify-between text-white">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Building className="w-4 h-4" />
              </div>
              <p className="text-sm font-bold leading-tight text-white/90">Management<br/>Center</p>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 text-white/50 text-xs">
          © {new Date().getFullYear()} Youth Ekselensia Scholarship. All rights reserved.
        </div>
      </div>

      {/* RIGHT PANEL - Dark Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 min-h-screen relative">
        <div className="max-w-md w-full z-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Login</h2>
            <p className="text-sm text-slate-500">Enter your gmail to access the platform.</p>
          </div>
          
          {error && <p className="text-xs font-semibold text-rose-500 mb-6 text-center">{error}</p>}

          <button
            onClick={signInWithGoogle}
            disabled={loading || redirecting}
            className="w-full py-3.5 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm text-slate-700 font-bold text-sm rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
            </svg>
            {loading ? "Redirecting..." : "Continue with Google"}
          </button>
          
          <div id="clerk-captcha" className="mt-4 flex justify-center empty:mt-0" />
        </div>
      </div>
    </div>
  );
}
