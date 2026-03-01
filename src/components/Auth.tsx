import React, { useState } from "react";
import { auth, db } from "../utils/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const Auth: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "register">("login");
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
        navigate("/dashboard");
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: userCredential.user.email,
          name: "",
          createdAt: new Date(),
          aiScansCount: 0,
          isPro: true,
        });
        toast.success("Registration successful!");
        navigate("/dashboard");
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || "";
      const messages: Record<string, string> = {
        "auth/invalid-credential": "Incorrect email or password. Please try again.",
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Incorrect password. Please try again.",
        "auth/email-already-in-use": "An account with this email already exists.",
        "auth/weak-password": "Password should be at least 6 characters.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/too-many-requests": "Too many attempts. Please try again later.",
      };
      setError(messages[code] || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async () => {
    try {
      const googleProvider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, googleProvider);
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: userCredential.user.email,
          name: userCredential.user.displayName || "",
          createdAt: new Date(),
          aiScansCount: 0,
          isPro: true,
        });
      }
      navigate("/dashboard");
    } catch (error) {
      setError((error as Error).message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F5F3] dark:bg-[#1C1917] px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-[380px]"
      >
        {/* Brand */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <img src="./logo.svg" alt="Askio" className="w-7 h-7" />
          <span className="text-lg font-medium font-sans text-[#37322F] dark:text-[#F5F5F4] tracking-tight">
            Askio
          </span>
        </Link>

        {/* Card */}
        <div className="bg-white dark:bg-[#292524] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_-10px_rgba(0,0,0,0.08)] dark:shadow-none border border-[rgba(55,50,47,0.06)] dark:border-[#44403C] overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: mode === "login" ? -8 : 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === "login" ? 8 : -8 }}
                transition={{ duration: 0.15 }}
              >
                <h2 className="text-xl font-serif text-[#37322F] dark:text-[#F5F5F4] tracking-tight">
                  {mode === "login" ? "Welcome back" : "Create account"}
                </h2>
                <p className="text-[13px] text-[#78716C] dark:text-[#A8A29E] mt-1">
                  {mode === "login"
                    ? "Sign in to your dashboard"
                    : "Start building chatbots for free"}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 12 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                >
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg px-3 py-2.5 flex items-start gap-2">
                    <svg
                      className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-[13px] text-red-700 dark:text-red-400 leading-snug">
                      {error}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Google OAuth */}
            <button
              onClick={handleOAuth}
              className="w-full flex items-center justify-center py-2.5 px-4 border border-[#E0DEDB] dark:border-[#44403C] rounded-xl bg-white dark:bg-[#1C1917] text-[#37322F] dark:text-[#F5F5F4] text-[13px] font-medium hover:bg-[#FAFAF9] dark:hover:bg-[#292524] hover:border-[#D6D3D1] dark:hover:border-[#57534E] transition-all duration-200 group"
            >
              <svg
                className="h-4 w-4 mr-2.5 group-hover:scale-110 transition-transform"
                viewBox="0 0 24 24"
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E0DEDB] dark:border-[#44403C]" />
              </div>
              <div className="relative flex justify-center text-[11px]">
                <span className="px-2.5 bg-white dark:bg-[#292524] text-[#9CA3AF] dark:text-[#78716C] font-medium uppercase tracking-wider">
                  or
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleAuth} className="space-y-3">
              <div>
                <label
                  htmlFor="email"
                  className="block text-[11px] font-semibold text-[#605A57] dark:text-[#A8A29E] mb-1 uppercase tracking-wider"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#E0DEDB] dark:border-[#44403C] rounded-xl focus:ring-2 focus:ring-[#37322F]/15 dark:focus:ring-[#F5F5F4]/15 focus:border-[#37322F] dark:focus:border-[#F5F5F4] transition-all duration-200 bg-[#FAFAF9] dark:bg-[#1C1917] text-[#37322F] dark:text-[#F5F5F4] text-[13px] placeholder-[#9CA3AF] dark:placeholder-[#78716C] outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-[11px] font-semibold text-[#605A57] dark:text-[#A8A29E] mb-1 uppercase tracking-wider"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#E0DEDB] dark:border-[#44403C] rounded-xl focus:ring-2 focus:ring-[#37322F]/15 dark:focus:ring-[#F5F5F4]/15 focus:border-[#37322F] dark:focus:border-[#F5F5F4] transition-all duration-200 bg-[#FAFAF9] dark:bg-[#1C1917] text-[#37322F] dark:text-[#F5F5F4] text-[13px] placeholder-[#9CA3AF] dark:placeholder-[#78716C] outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#37322F] dark:bg-[#F5F5F4] text-white dark:text-[#1C1917] py-2.5 px-4 rounded-xl text-[13px] font-medium hover:bg-[#2a2522] dark:hover:bg-[#E7E5E4] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] mt-1"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <span>
                    {mode === "login" ? "Sign In" : "Create Account"}
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-[#FAFAF9] dark:bg-[#1C1917] border-t border-[rgba(55,50,47,0.06)] dark:border-[#44403C]">
            <p className="text-center text-[13px] text-[#78716C] dark:text-[#A8A29E]">
              {mode === "login" ? (
                <span>
                  Don't have an account?{" "}
                  <button
                    onClick={() => setMode("register")}
                    className="text-[#37322F] dark:text-[#F5F5F4] font-semibold hover:underline"
                  >
                    Sign up
                  </button>
                </span>
              ) : (
                <span>
                  Already have an account?{" "}
                  <button
                    onClick={() => setMode("login")}
                    className="text-[#37322F] dark:text-[#F5F5F4] font-semibold hover:underline"
                  >
                    Sign in
                  </button>
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Trust line */}
        <p className="mt-5 text-center text-[11px] text-[#9CA3AF] dark:text-[#78716C]">
          Secure · No credit card required · Free forever
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
