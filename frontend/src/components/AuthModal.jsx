import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { signUpUser, signInUser } from '../api';

/**
 * AuthModal Component
 * Handles User Sign In and Sign Up with:
 * - Password Show/Hide toggle button (👁️ / 🙈)
 * - Strict password policy (8+ chars, letter, number, special char)
 * - Real-time password criteria checklist
 * - MongoDB database persistence & localStorage 1-time session caching.
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

  if (!isOpen) return null;

  // Password criteria verification
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const isPasswordValid = hasMinLength && hasLetter && hasNumber && hasSpecial;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast.error('Please fill in all required fields.');
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
          email: email.trim(),
          password
        });
        localStorage.setItem('wa_auth_user', JSON.stringify(data.user));
        if (data.token) localStorage.setItem('wa_auth_token', data.token);
        toast.success(`Account created! Welcome, ${data.user.name}`);
        onSuccess?.(data.user);
      } else {
        const data = await signInUser({
          email: email.trim(),
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
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in" role="dialog" aria-modal="true">
      <div 
        className="w-full max-w-md bg-white dark:bg-wa-dpanel text-slate-900 dark:text-wa-dtext rounded-3xl shadow-2xl border border-slate-200 dark:border-wa-dbdr overflow-hidden flex flex-col transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-wa-dbdr/60 flex items-center justify-between bg-slate-50/50 dark:bg-wa-dsurf/40">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-emerald-500/15 text-wa-teal dark:text-wa-green flex items-center justify-center text-lg shrink-0">
              🔑
            </span>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                {mode === 'signup' ? 'Create Your Account' : 'Sign In to Account'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-wa-dmuted mt-0.5">
                {mode === 'signup' ? 'One-time registration to unlock WhatsApp Scheduler' : 'Sign in to access your scheduled messages'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-close w-8 h-8 text-sm"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-wa-dbdr bg-slate-100/60 dark:bg-slate-900/60 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'signup'
                ? 'bg-white dark:bg-wa-dpanel text-wa-teal dark:text-wa-green shadow-xs'
                : 'text-slate-500 dark:text-wa-dmuted hover:text-slate-800 dark:hover:text-wa-dtext'
            }`}
          >
            ✨ Sign Up (New User)
          </button>
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'signin'
                ? 'bg-white dark:bg-wa-dpanel text-wa-teal dark:text-wa-green shadow-xs'
                : 'text-slate-500 dark:text-wa-dmuted hover:text-slate-800 dark:hover:text-wa-dtext'
            }`}
          >
            🔐 Sign In
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-wa-dtext">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rahul Sharma"
                  className="w-full bg-slate-50 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr rounded-xl px-3.5 py-2.5 pl-9 text-sm text-slate-900 dark:text-wa-dtext focus:outline-none focus:border-wa-teal focus:ring-1 focus:ring-wa-teal transition-all"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none select-none">
                  👤
                </span>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-wa-dtext">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-50 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr rounded-xl px-3.5 py-2.5 pl-9 text-sm text-slate-900 dark:text-wa-dtext focus:outline-none focus:border-wa-teal focus:ring-1 focus:ring-wa-teal transition-all"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none select-none">
                📧
              </span>
            </div>
          </div>

          {/* Password with Eye Show/Hide toggle */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-wa-dtext">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr rounded-xl px-3.5 py-2.5 pl-9 pr-10 text-sm text-slate-900 dark:text-wa-dtext focus:outline-none focus:border-wa-teal focus:ring-1 focus:ring-wa-teal transition-all"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none select-none">
                🔒
              </span>
              {/* Eye Button Toggle */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs focus:outline-none transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Real-time Password Requirements Checklist for Sign Up */}
          {mode === 'signup' && (
            <div className="bg-slate-50 dark:bg-wa-dsurf/70 border border-slate-200/80 dark:border-wa-dbdr rounded-xl p-2.5 space-y-1.5">
              <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-wa-dmuted mb-1">
                Password Requirements
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <div className={`flex items-center gap-1.5 font-medium ${hasMinLength ? 'text-emerald-600 dark:text-wa-green font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
                  <span>{hasMinLength ? '✓' : '○'}</span>
                  <span>8+ Characters</span>
                </div>
                <div className={`flex items-center gap-1.5 font-medium ${hasLetter ? 'text-emerald-600 dark:text-wa-green font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
                  <span>{hasLetter ? '✓' : '○'}</span>
                  <span>Letter (A-Z)</span>
                </div>
                <div className={`flex items-center gap-1.5 font-medium ${hasNumber ? 'text-emerald-600 dark:text-wa-green font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
                  <span>{hasNumber ? '✓' : '○'}</span>
                  <span>Number (0-9)</span>
                </div>
                <div className={`flex items-center gap-1.5 font-medium ${hasSpecial ? 'text-emerald-600 dark:text-wa-green font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
                  <span>{hasSpecial ? '✓' : '○'}</span>
                  <span>Special (!@#$)</span>
                </div>
              </div>
            </div>
          )}

          {/* Confirm Password (Sign Up) */}
          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-wa-dtext">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr rounded-xl px-3.5 py-2.5 pl-9 pr-10 text-sm text-slate-900 dark:text-wa-dtext focus:outline-none focus:border-wa-teal focus:ring-1 focus:ring-wa-teal transition-all"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none select-none">
                  🛡️
                </span>
                {/* Eye Button Toggle */}
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs focus:outline-none transition-colors"
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
            disabled={loading || (mode === 'signup' && !isPasswordValid)}
            className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-wa-teal to-emerald-500 hover:from-emerald-600 hover:to-wa-teal shadow-lg shadow-emerald-500/25 transition-all duration-200 disabled:opacity-50 active:scale-98 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {mode === 'signup' ? 'Creating Account…' : 'Signing In…'}
              </>
            ) : (
              <>{mode === 'signup' ? '🚀 Create Account & Save Data' : '🔓 Sign In & Access'}</>
            )}
          </button>

          {/* Footer Note */}
          <p className="text-[11px] text-center text-slate-400 dark:text-wa-dmuted leading-tight pt-1">
            🔒 Credentials stored securely in database. 1-time authentication.
          </p>
        </form>
      </div>
    </div>
  );
}
