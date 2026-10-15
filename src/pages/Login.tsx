import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AirVent, ShieldCheck, Wrench, Sparkles, LogIn, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { signInWithGoogle, signInDemoMode, user, isDemoUser } = useAuth();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to dashboard
  React.useEffect(() => {
    if (user || isDemoUser) {
      navigate('/');
    }
  }, [user, isDemoUser, navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      success('Logged In', 'Welcome to CoolCare AC Service Management!');
      navigate('/');
    } catch (err: unknown) {
      error('Login failed', err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = () => {
    signInDemoMode();
    success('Demo Access Granted', 'Signed in as Master Technician.');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Decorative ambient gradients */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-800/90 backdrop-blur-md rounded-3xl p-8 border border-slate-700/80 shadow-2xl relative z-10 text-white space-y-6">
        {/* Brand Icon & Heading */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-blue-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-cyan-500/20">
            <AirVent className="w-9 h-9 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              CoolCare <span className="text-cyan-400 font-mono text-xs px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">PRO</span>
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              AC Home Service & Job Billing Management System
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-700/60 space-y-2 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Secure Firebase Firestore & Authentication</span>
          </div>
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Customer directory & multi-AC unit tracking</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Instant professional PDF bills & payment logs</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl text-xs shadow-md transition active:scale-98 disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading ? 'Authenticating...' : 'Sign In with Google Account'}</span>
          </button>

          <button
            onClick={handleDemoAccess}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-sky-950/40 transition active:scale-98"
          >
            <span>Enter as Technician (Demo / On-Site Mode)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="text-center text-[11px] text-slate-400">
          Admin account provisioned for <span className="text-cyan-400 font-mono">guna44662@gmail.com</span>
        </div>
      </div>
    </div>
  );
};
