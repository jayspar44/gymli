import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ChevronRight, Dumbbell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [mode, setMode] = useState('landing'); // 'landing' | 'email'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const emailRef = useRef(null);
  const navigate = useNavigate();
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, user } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (mode === 'email' && emailRef.current) {
      emailRef.current.focus();
    }
  }, [mode]);

  async function handleGoogleSignIn() {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential'
        ? 'Invalid email or password'
        : err.code === 'auth/email-already-in-use'
          ? 'An account with this email already exists'
          : err.code === 'auth/weak-password'
            ? 'Password must be at least 6 characters'
            : err.message || 'Authentication failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex flex-col items-center justify-between min-h-screen overflow-hidden bg-[var(--color-bg)]">
      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full max-w-sm px-6 py-12">

        {/* Logo & branding */}
        <div
          className="flex flex-col items-center mb-12 transition-all duration-700"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          }}
        >
          <div className="relative mb-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)]">
              <Dumbbell className="w-8 h-8 text-white" strokeWidth={1.5} />
            </div>
          </div>

          <h1
            className="text-4xl tracking-[0.15em] font-bold text-[var(--color-text)] mb-2"
          >
            GYMLI
          </h1>
          <p className="text-sm tracking-[0.2em] uppercase text-[var(--color-text-secondary)] font-light">
            Your AI Gym Companion
          </p>
        </div>

        {/* Divider */}
        <div
          className="w-full max-w-[200px] h-px mb-10 transition-all duration-700 delay-200"
          style={{
            opacity: mounted ? 1 : 0,
            background: 'var(--color-border)',
          }}
        />

        {/* Auth content */}
        <div
          className="w-full transition-all duration-700 delay-300"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(12px)',
          }}
        >
          {mode === 'landing' ? (
            <div className="flex flex-col gap-3">
              {/* Google sign-in */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="group relative flex items-center justify-center gap-3 w-full py-3.5 px-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] font-medium text-[15px] transition-all duration-200 hover:bg-[var(--color-surface-alt)] hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
                <ChevronRight className="absolute right-4 w-4 h-4 text-[var(--color-text-secondary)] opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5" />
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 my-2">
                <div className="flex-1 h-px bg-[var(--color-border)]" />
                <span className="text-xs text-[var(--color-text-secondary)] tracking-wider uppercase">or</span>
                <div className="flex-1 h-px bg-[var(--color-border)]" />
              </div>

              {/* Email option */}
              <button
                onClick={() => setMode('email')}
                className="group relative flex items-center justify-center gap-3 w-full py-3.5 px-4 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] font-medium text-[15px] transition-all duration-200 hover:border-[var(--color-primary)] hover:text-[var(--color-text)] active:scale-[0.98]"
              >
                <Mail className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                Continue with Email
                <ChevronRight className="absolute right-4 w-4 h-4 text-[var(--color-text-secondary)] opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
              {/* Back button */}
              <button
                type="button"
                onClick={() => { setMode('landing'); setError(''); }}
                className="self-start flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors mb-1"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back
              </button>

              <h2 className="text-xl font-semibold text-[var(--color-text)] mb-1">
                {isSignUp ? 'Create your account' : 'Welcome back'}
              </h2>

              {/* Email input */}
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--color-text-secondary)]" strokeWidth={1.5} />
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-secondary)] text-[15px] outline-none transition-all duration-200 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/30"
                />
              </div>

              {/* Password input */}
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--color-text-secondary)]" strokeWidth={1.5} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  minLength={6}
                  className="w-full py-3.5 pl-11 pr-12 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-secondary)] text-[15px] outline-none transition-all duration-200 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white font-semibold text-[15px] transition-all duration-200 hover:shadow-lg hover:shadow-[var(--color-primary)]/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isSignUp ? 'Creating account...' : 'Signing in...'}
                  </span>
                ) : (
                  isSignUp ? 'Create Account' : 'Sign In'
                )}
              </button>

              {/* Toggle sign-in / sign-up */}
              <p className="text-center text-sm text-[var(--color-text-secondary)]">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                  className="text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors font-medium"
                >
                  {isSignUp ? 'Sign in' : 'Create one'}
                </button>
              </p>
            </form>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 px-4 py-3 rounded-xl bg-[var(--color-danger-muted)] border border-[var(--color-danger)]/20 text-[var(--color-danger)] text-sm text-center">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Bottom text */}
      <div
        className="relative z-10 pb-8 text-center transition-all duration-700 delay-500"
        style={{
          opacity: mounted ? 1 : 0,
        }}
      >
        <p className="text-xs text-[var(--color-text-secondary)]/40">
          Built with iron and code
        </p>
      </div>
    </div>
  );
}
