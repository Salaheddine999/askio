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
import { useNavigate } from "react-router-dom";

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
        });
        toast.success("Registration successful!");
        navigate("/dashboard");
      }
    } catch (error) {
      setError((error as Error).message);
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
        });
      }
      navigate("/dashboard");
    } catch (error) {
      setError((error as Error).message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0f2ff] via-white to-[#e8ecff] dark:from-[#1C1917] dark:via-[#292524] dark:to-[#1C1917] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-gradient-to-br from-indigo-200 to-indigo-100 dark:from-[#292524] dark:to-[#1C1917] rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-gradient-to-tl from-indigo-100 to-indigo-200 dark:from-[#1C1917] dark:to-[#292524] rounded-full opacity-20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-indigo-100/10 to-transparent rounded-full blur-3xl"></div>
      </div>

      {/* Main container */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left side - Branding & Info */}
          <div className="hidden lg:block space-y-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <img src="./icon.svg" alt="Askio" className="w-12 h-12" />
                <span className="text-3xl font-bold text-gray-800 dark:text-[#F5F5F4]">Askio</span>
              </div>
              <h1 className="text-5xl font-bold text-gray-800 dark:text-[#F5F5F4] leading-tight">
                Build Amazing
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-indigo-500">
                  Chatbots
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-[#A8A29E] leading-relaxed">
                Create custom chatbots tailored to your brand. Engage visitors with smarter, personalized interactions.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="space-y-4">
              <div className="flex items-start space-x-4 group">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-300 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-[#F5F5F4]">Easy Customization</h3>
                  <p className="text-gray-600 dark:text-[#A8A29E] text-sm">Match your brand perfectly</p>
                </div>
              </div>
              <div className="flex items-start space-x-4 group">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-300 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-[#F5F5F4]">Quick Integration</h3>
                  <p className="text-gray-600 dark:text-[#A8A29E] text-sm">Deploy in minutes, not hours</p>
                </div>
              </div>
              <div className="flex items-start space-x-4 group">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-300 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-[#F5F5F4]">24/7 Engagement</h3>
                  <p className="text-gray-600 dark:text-[#A8A29E] text-sm">Never miss a customer query</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Auth form */}
          <div className="w-full">
            <div className="bg-white/80 dark:bg-[#292524]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-[#44403C]/50 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-400 to-indigo-300 px-8 py-6">
                <div className="flex items-center justify-center lg:hidden mb-4">
                  <img src="./icon.svg" alt="Askio" className="w-10 h-10 mr-2" />
                  <span className="text-2xl font-bold text-white">Askio</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white text-center">
                  {mode === "login" ? "Welcome Back" : "Get Started"}
                </h2>
                <p className="text-indigo-50 text-center mt-2">
                  {mode === "login"
                    ? "Sign in to continue to your dashboard"
                    : "Create your account to start building"}
                </p>
              </div>

              {/* Form */}
              <div className="px-8 py-8">
                {error && (
                  <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleAuth} className="space-y-5">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-semibold text-gray-700 dark:text-[#F5F5F4] mb-2"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                      <input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-[#44403C] rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-[#1C1917] hover:bg-white dark:hover:bg-[#292524] text-gray-900 dark:text-[#F5F5F4]"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-gray-700 dark:text-[#F5F5F4] mb-2"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-[#44403C] rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-[#1C1917] hover:bg-white dark:hover:bg-[#292524] text-gray-900 dark:text-[#F5F5F4]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-indigo-400 to-indigo-500 text-white py-3 px-4 rounded-xl font-semibold hover:from-indigo-500 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      <span>{mode === "login" ? "Sign In" : "Create Account"}</span>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-[#44403C]"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white dark:bg-[#292524] text-gray-500 dark:text-[#A8A29E] font-medium">Or continue with</span>
                  </div>
                </div>

                {/* OAuth */}
                <button
                  onClick={handleOAuth}
                  className="w-full flex items-center justify-center py-3 px-4 border-2 border-gray-300 dark:border-[#44403C] rounded-xl shadow-sm bg-white dark:bg-[#292524] text-gray-700 dark:text-[#F5F5F4] font-medium hover:bg-gray-50 dark:hover:bg-[#1C1917] hover:border-gray-400 dark:hover:border-[#57534E] focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 transition-all duration-200 group"
                >
                  <svg className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                {/* Toggle mode */}
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setMode(mode === "login" ? "register" : "login")}
                    className="text-sm text-gray-600 dark:text-[#A8A29E] hover:text-indigo-500 font-medium transition-colors duration-200"
                  >
                    {mode === "login" ? (
                      <span>
                        Don't have an account?{" "}
                        <span className="text-indigo-500 font-semibold">Sign up</span>
                      </span>
                    ) : (
                      <span>
                        Already have an account?{" "}
                        <span className="text-indigo-500 font-semibold">Sign in</span>
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Trust indicators */}
            <div className="mt-6 text-center text-sm text-gray-600 dark:text-[#A8A29E]">
              <p className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Secure & encrypted connection</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
