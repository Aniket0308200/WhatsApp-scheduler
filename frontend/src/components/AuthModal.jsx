import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { signUpUser, signInUser, fetchGoogleLoginUrl } from '../api';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * AuthModal Component
 * Redesigned Split 2-Column Layout (Desktop Side-by-Side & Mobile Compact Card)
 * Features:
 * - 1-Click Google Authentication ("Continue with Google")
 * - Real-time Email format and domain validation
 * - Password Show/Hide eye toggles (👁️ / 🙈)
 * - Password strength checklist (8+ chars, letter, number, special char)
 * - Micro-interactions, smooth tab transitions, and glassmorphism.
 */
export default function AuthModal({ isOpen, onClose, onSuccess, initialMode = 'signup' }) {
  const [mode, setMode] = useState(initialMode); // 'signin' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  if (!isOpen) return null;

  // Real-time validations
  const cleanEmail = email.trim();
  const isEmailValid = cleanEmail.length > 0 && EMAIL_REGEX.test(cleanEmail);

  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const isPasswordValid = hasMinLength && hasLetter && hasNumber && hasSpecial;

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const data = await fetchGoogleLoginUrl();
      if (!data?.url) throw new Error('Could not retrieve Google Auth URL.');

      const width = 500;
      const height = 620;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      window.open(data.url, 'google_login_popup', `width=${width},height=${height},left=${left},top=${top}`);

      const handleMessage = (event) => {
        if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
          window.removeEventListener('message', handleMessage);
          const { user, token } = event.data;
          localStorage.setItem('wa_auth_user', JSON.stringify(user));
          if (token) localStorage.setItem('wa_auth_token', token);
          toast.success(`Welcome, ${user.name}! (Verified by Google)`);
          setGoogleLoading(false);
          onSuccess?.(user);
        } else if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
          window.removeEventListener('message', handleMessage);
          toast.error(event.data.error || 'Google authentication failed.');
          setGoogleLoading(false);
        }
      };

      window.addEventListener('message', handleMessage);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to start Google auth.');
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!cleanEmail || !password) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      toast.error('Please enter a valid Gmail / Email address (e.g. name@gmail.com).');
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        toast.error('Please enter your full name.');
        return;
      }
      if (!hasMinLength) {
        toast.error('Password must be at least 8 characters long.');
        return;
      }
      if (!hasLetter) {
        toast.error('Password must contain at least one letter (a-z, A-Z).');
        return;
      }
      if (!hasNumber) {
        toast.error('Password must contain at least one number (0-9).');
        return;
      }
      if (!hasSpecial) {
        toast.error('Password must contain at least one special character (!@#$%^&*...).');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('Passwords do not match.');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const data = await signUpUser({
          name: name.trim(),
          email: cleanEmail,
          password
        });
        localStorage.setItem('wa_auth_user', JSON.stringify(data.user));
        if (data.token) localStorage.setItem('wa_auth_token', data.token);
        toast.success(`Account created! Welcome, ${data.user.name}`);
        onSuccess?.(data.user);
      } else {
        const data = await signInUser({
          email: cleanEmail,
          password
        });
        localStorage.setItem('wa_auth_user', JSON.stringify(data.user));
        if (data.token) localStorage.setItem('wa_auth_token', data.token);
        toast.success(`Welcome back, ${data.user.name}!`);
        onSuccess?.(data.user);
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Authentication failed.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true">
      <div 
        className="w-full max-w-3xl bg-white dark:bg-wa-dpanel text-slate-900 dark:text-wa-dtext rounded-3xl shadow-2xl border border-slate-200 dark:border-wa-dbdr overflow-hidden flex flex-col md:flex-row transition-all duration-300 max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── LEFT HERO BRANDING COLUMN (Desktop Side Banner) ── */}
        <div className="hidden md:flex flex-col justify-between w-5/12 bg-gradient-to-br from-wa-dark via-emerald-700 to-teal-800 text-white p-7 relative overflow-hidden shrink-0 select-none">
          {/* WhatsApp Pattern Background Image overlay */}
          <div 
            className="absolute inset-0 opacity-3 bg-cover bg-center pointer-events-none mix-blend-overlay"
            style={{ backgroundImage: "url('/green-bg-wp.jpg')" }}
          />

          {/* Background Ambient Glow Circles */}
          <div className="absolute -top-10 -left-10 w-44 h-44 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-52 h-52 bg-teal-300/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 space-y-6">
            {/* Logo Badge */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-sm">
              <span className="w-7 h-7 rounded-xl bg-emerald-500/30 flex items-center justify-center text-base">
                📲
              </span>
              <span className="font-extrabold text-sm text-white tracking-wide">
                WA Scheduler
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white leading-tight tracking-tight">
                {mode === 'signup' ? 'Join WhatsApp Automation' : 'Welcome Back!'}
              </h2>
              <p className="text-xs text-emerald-100/90 leading-relaxed">
                {mode === 'signup'
                  ? 'Create your free account once and access scheduled messages, group sync, & media dispatch from any device.'
                  : 'Sign in to access your scheduled message queue, contacts, and delivery analytics.'}
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-emerald-50 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/10">
                <span className="text-emerald-300 text-sm">🔒</span>
                <span>End-to-End Encrypted Storage</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-emerald-50 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/10">
                <span className="text-emerald-300 text-sm">⚡</span>
                <span>1-Click Google Verification</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-emerald-50 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/10">
                <span className="text-emerald-300 text-sm">💻</span>
                <span>Instant Multi-Device Sync</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-white/15 flex items-center justify-between text-[10px] text-emerald-200/80 font-medium">
            <span>v1.0.0 Stable</span>
            <span className="flex items-center gap-1 text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Cloud Ready
            </span>
          </div>
        </div>

        {/* ── RIGHT FORM COLUMN ── */}
        <div className="w-full md:w-7/12 p-5 sm:p-7 flex flex-col justify-between overflow-y-auto max-h-[90vh]">
          {/* Header */}
          <div>
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <span className="md:hidden w-7 h-7 rounded-lg bg-emerald-500/15 text-wa-teal dark:text-wa-green flex items-center justify-center text-sm">
                  🔑
                </span>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">
                    {mode === 'signup' ? 'Create Account' : 'Sign In'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-wa-dmuted mt-0.5">
                    {mode === 'signup' ? 'Instant 1-time setup for all devices' : 'Enter your credentials to continue'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="btn-close w-7 h-7 text-xs rounded-full hover:bg-slate-100 dark:hover:bg-wa-dsurf text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex border border-slate-200 dark:border-wa-dbdr bg-slate-100/70 dark:bg-slate-900/60 p-1 rounded-xl gap-1 my-3">
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                  mode === 'signup'
                    ? 'bg-white dark:bg-wa-dsurf text-wa-teal dark:text-wa-green shadow-xs'
                    : 'text-slate-500 dark:text-wa-dmuted hover:text-slate-800 dark:hover:text-wa-dtext'
                }`}
              >
                ✨ Sign Up (New)
              </button>
              <button
                type="button"
                onClick={() => setMode('signin')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                  mode === 'signin'
                    ? 'bg-white dark:bg-wa-dsurf text-wa-teal dark:text-wa-green shadow-xs'
                    : 'text-slate-500 dark:text-wa-dmuted hover:text-slate-800 dark:hover:text-wa-dtext'
                }`}
              >
                🔐 Sign In
              </button>
            </div>

            {/* 🌐 1-Click Google Auth Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              className="w-full py-2 px-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-100 bg-slate-50 dark:bg-wa-dsurf hover:bg-slate-100 dark:hover:bg-wa-dbdr border border-slate-200/80 dark:border-wa-dbdr shadow-2xs transition-all flex items-center justify-center gap-2 active:scale-98 hover:scale-[1.01] my-2"
            >
              {googleLoading ? (
                <span className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              <span>{mode === 'signup' ? 'Continue with Google (1-Click)' : 'Sign In with Google'}</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-2.5">
              <div className="border-t border-slate-200 dark:border-wa-dbdr/60 w-full" />
              <span className="bg-white dark:bg-wa-dpanel px-2.5 text-[9px] uppercase font-extrabold tracking-wider text-slate-400 dark:text-wa-dmuted shrink-0">
                OR
              </span>
              <div className="border-t border-slate-200 dark:border-wa-dbdr/60 w-full" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'signup' && (
                <div className="space-y-1">
                  <label htmlFor="auth-fullname" className="block text-[11px] font-bold text-slate-700 dark:text-wa-dtext">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      id="auth-fullname"
                      name="fullName"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Rahul Sharma"
                      className="w-full bg-slate-50 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr rounded-xl px-3 py-2 pl-8 text-xs text-slate-900 dark:text-wa-dtext focus:outline-none focus:border-wa-teal focus:ring-1 focus:ring-wa-teal transition-all"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none select-none">
                      👤
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="auth-email" className="block text-[11px] font-bold text-slate-700 dark:text-wa-dtext">
                    Email Address
                  </label>
                  {cleanEmail.length > 0 && (
                    <span className={`text-[9px] font-bold ${isEmailValid ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {isEmailValid ? '✓ Valid' : '⚠️ Invalid Email'}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="auth-email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className={`w-full bg-slate-50 dark:bg-wa-dsurf border ${
                      cleanEmail.length > 0 && !isEmailValid ? 'border-amber-400 dark:border-amber-500' : 'border-slate-200 dark:border-wa-dbdr'
                    } rounded-xl px-3 py-2 pl-8 text-xs text-slate-900 dark:text-wa-dtext focus:outline-none focus:border-wa-teal focus:ring-1 focus:ring-wa-teal transition-all`}
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none select-none">
                    📧
                  </span>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label htmlFor="auth-password" className="block text-[11px] font-bold text-slate-700 dark:text-wa-dtext">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="auth-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr rounded-xl px-3 py-2 pl-8 pr-9 text-xs text-slate-900 dark:text-wa-dtext focus:outline-none focus:border-wa-teal focus:ring-1 focus:ring-wa-teal transition-all"
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none select-none">
                    🔒
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs focus:outline-none transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Password Requirements (Sign Up) */}
              {mode === 'signup' && (
                <div className="bg-slate-50 dark:bg-wa-dsurf/60 border border-slate-200/80 dark:border-wa-dbdr rounded-xl p-2 space-y-1">
                  <div className="text-[9px] font-bold tracking-wider uppercase text-slate-400 dark:text-wa-dmuted">
                    Requirements
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <div className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-600 dark:text-wa-green font-bold' : 'text-slate-400'}`}>
                      <span>{hasMinLength ? '✓' : '○'}</span>
                      <span>8+ Chars</span>
                    </div>
                    <div className={`flex items-center gap-1 ${hasLetter ? 'text-emerald-600 dark:text-wa-green font-bold' : 'text-slate-400'}`}>
                      <span>{hasLetter ? '✓' : '○'}</span>
                      <span>Letter (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-600 dark:text-wa-green font-bold' : 'text-slate-400'}`}>
                      <span>{hasNumber ? '✓' : '○'}</span>
                      <span>Number (0-9)</span>
                    </div>
                    <div className={`flex items-center gap-1 ${hasSpecial ? 'text-emerald-600 dark:text-wa-green font-bold' : 'text-slate-400'}`}>
                      <span>{hasSpecial ? '✓' : '○'}</span>
                      <span>Special (!@#$)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm Password (Sign Up) */}
              {mode === 'signup' && (
                <div className="space-y-1">
                  <label htmlFor="auth-confirm-password" className="block text-[11px] font-bold text-slate-700 dark:text-wa-dtext">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="auth-confirm-password"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr rounded-xl px-3 py-2 pl-8 pr-9 text-xs text-slate-900 dark:text-wa-dtext focus:outline-none focus:border-wa-teal focus:ring-1 focus:ring-wa-teal transition-all"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none select-none">
                      🛡️
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs focus:outline-none transition-colors"
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || googleLoading || !isEmailValid || (mode === 'signup' && !isPasswordValid)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-wa-teal to-emerald-500 hover:from-emerald-600 hover:to-wa-teal shadow-md shadow-emerald-500/20 transition-all duration-200 disabled:opacity-50 active:scale-98 flex items-center justify-center gap-1.5 mt-2"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {mode === 'signup' ? 'Creating Account…' : 'Signing In…'}
                  </>
                ) : (
                  <>{mode === 'signup' ? '🚀 Create Account & Save Data' : '🔓 Sign In & Access'}</>
                )}
              </button>

              <p className="text-[10px] text-center text-slate-400 dark:text-wa-dmuted leading-tight pt-0.5">
                🔒 Credentials stored securely in database. 1-time setup.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
