import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function Login() {
  const [mode, setMode] = useState('landing'); // 'landing' | 'email'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const emailRef = useRef(null);
  const navigate = useNavigate();
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, user } = useAuth();

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-bg)] px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Branding */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[var(--color-text)]">
            Gymli
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Your training, simplified.
          </p>
        </div>

        {/* Auth content */}
        {mode === 'landing' ? (
          <div className="flex flex-col gap-3">
            {/* Google sign-in */}
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-4 my-2">
              <div className="flex-1 h-px bg-[var(--color-border)]" />
              <span className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-[var(--color-border)]" />
            </div>

            {/* Email option */}
            <Button
              variant="ghost"
              size="lg"
              fullWidth
              onClick={() => setMode('email')}
            >
              <Mail className="w-5 h-5" strokeWidth={1.5} />
              Sign in with Email
            </Button>
          </div>
        ) : (
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
            {/* Back button */}
            <button
              type="button"
              onClick={() => { setMode('landing'); setError(''); }}
              className="self-start flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors mb-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <h2 className="text-xl font-semibold text-[var(--color-text)] mb-1">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>

            {/* Email input */}
            <Input
              ref={emailRef}
              type="email"
              label="Email"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
            />

            {/* Password input */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[var(--color-text)]">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  minLength={6}
                  className="w-full rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-secondary)] outline-none focus:border-[var(--color-primary)] transition-colors pl-10 pr-12 py-2.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>

            {/* Toggle sign-in / sign-up */}
            <p className="text-center text-sm text-[var(--color-text-secondary)]">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                className="text-[var(--color-primary)] font-medium transition-colors"
              >
                {isSignUp ? 'Sign in' : 'Create one'}
              </button>
            </p>
          </form>
        )}

        {/* Error */}
        {error && (
          <p className="mt-4 text-sm text-center text-[var(--color-danger)]">
            {error}
          </p>
        )}
      </motion.div>
    </div>
  );
}
