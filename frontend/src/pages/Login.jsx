import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ChevronRight, Flame } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function EmberParticle({ delay, left, duration }) {
  return (
    <div
      className="absolute bottom-0 rounded-full pointer-events-none"
      style={{
        left: `${left}%`,
        width: Math.random() * 3 + 1.5 + 'px',
        height: Math.random() * 3 + 1.5 + 'px',
        background: `radial-gradient(circle, #f59e0b, #d4872a)`,
        animation: `ember-rise ${duration}s ${delay}s ease-out infinite`,
        opacity: 0,
      }}
    />
  );
}

function ForgeGlow() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Bottom forge glow */}
      <div
        className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full"
        style={{
          background: 'radial-gradient(ellipse, rgba(212,135,42,0.15) 0%, rgba(212,135,42,0.05) 40%, transparent 70%)',
          animation: 'forge-pulse 4s ease-in-out infinite',
        }}
      />
      {/* Top-left ambient */}
      <div
        className="absolute -top-32 -left-32 w-64 h-64 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(184,107,31,0.08) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}

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

  const embers = Array.from({ length: 12 }, (_, i) => ({
    delay: Math.random() * 6,
    left: 20 + Math.random() * 60,
    duration: 3 + Math.random() * 4,
    key: i,
  }));

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
    <div className="relative flex flex-col items-center justify-between min-h-screen overflow-hidden bg-[#0c0a09]">
      <ForgeGlow />

      {/* Ember particles */}
      <div className="absolute inset-0 pointer-events-none">
        {embers.map((e) => (
          <EmberParticle key={e.key} {...e} />
        ))}
      </div>

      {/* Decorative top border — forge line */}
      <div className="w-full h-[2px] relative z-10 flex-shrink-0">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent 5%, #d4872a33 20%, #d4872a 50%, #d4872a33 80%, transparent 95%)',
            animation: 'forge-line-glow 3s ease-in-out infinite',
          }}
        />
      </div>

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
          {/* Forge icon */}
          <div className="relative mb-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#d4872a] to-[#96501d] shadow-lg shadow-[#d4872a20]">
              <Flame className="w-8 h-8 text-[#fdf8f0]" strokeWidth={1.5} />
            </div>
            <div
              className="absolute -inset-2 rounded-3xl"
              style={{
                background: 'radial-gradient(circle, rgba(212,135,42,0.12) 0%, transparent 70%)',
                animation: 'forge-pulse 3s ease-in-out infinite',
              }}
            />
          </div>

          <h1
            className="text-4xl tracking-[0.15em] font-semibold text-[#fafaf9] mb-2"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            GYMLI
          </h1>
          <p className="text-sm tracking-[0.2em] uppercase text-[#a8a29e] font-light">
            Your AI Gym Companion
          </p>
        </div>

        {/* Forge divider */}
        <div
          className="w-full max-w-[200px] h-px mb-10 transition-all duration-700 delay-200"
          style={{
            opacity: mounted ? 1 : 0,
            background: 'linear-gradient(90deg, transparent, #d4872a66, transparent)',
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
              {/* Google sign-in — primary */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="group relative flex items-center justify-center gap-3 w-full py-3.5 px-4 rounded-xl bg-[#fafaf9] text-[#1c1917] font-medium text-[15px] transition-all duration-200 hover:bg-white hover:shadow-lg hover:shadow-[#d4872a10] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
                <ChevronRight className="absolute right-4 w-4 h-4 text-[#78716c] opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5" />
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 my-2">
                <div className="flex-1 h-px bg-[#44403c]" />
                <span className="text-xs text-[#78716c] tracking-wider uppercase">or</span>
                <div className="flex-1 h-px bg-[#44403c]" />
              </div>

              {/* Email option — secondary */}
              <button
                onClick={() => setMode('email')}
                className="group relative flex items-center justify-center gap-3 w-full py-3.5 px-4 rounded-xl border border-[#44403c] text-[#a8a29e] font-medium text-[15px] transition-all duration-200 hover:border-[#d4872a55] hover:text-[#fafaf9] hover:bg-[#1c191708] active:scale-[0.98]"
              >
                <Mail className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                Continue with Email
                <ChevronRight className="absolute right-4 w-4 h-4 text-[#78716c] opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
              {/* Back button */}
              <button
                type="button"
                onClick={() => { setMode('landing'); setError(''); }}
                className="self-start flex items-center gap-1 text-sm text-[#a8a29e] hover:text-[#fafaf9] transition-colors mb-1"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back
              </button>

              <h2 className="text-xl font-semibold text-[#fafaf9] mb-1">
                {isSignUp ? 'Create your account' : 'Welcome back'}
              </h2>

              {/* Email input */}
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#78716c]" strokeWidth={1.5} />
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-[#1c1917] border border-[#44403c] text-[#fafaf9] placeholder-[#78716c] text-[15px] outline-none transition-all duration-200 focus:border-[#d4872a] focus:ring-1 focus:ring-[#d4872a33]"
                />
              </div>

              {/* Password input */}
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#78716c]" strokeWidth={1.5} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  minLength={6}
                  className="w-full py-3.5 pl-11 pr-12 rounded-xl bg-[#1c1917] border border-[#44403c] text-[#fafaf9] placeholder-[#78716c] text-[15px] outline-none transition-all duration-200 focus:border-[#d4872a] focus:ring-1 focus:ring-[#d4872a33]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#78716c] hover:text-[#a8a29e] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#d4872a] to-[#b86b1f] text-[#fdf8f0] font-semibold text-[15px] transition-all duration-200 hover:shadow-lg hover:shadow-[#d4872a25] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#fdf8f0] border-t-transparent rounded-full animate-spin" />
                    {isSignUp ? 'Forging account...' : 'Opening the gates...'}
                  </span>
                ) : (
                  isSignUp ? 'Create Account' : 'Sign In'
                )}
              </button>

              {/* Toggle sign-in / sign-up */}
              <p className="text-center text-sm text-[#78716c]">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                  className="text-[#d4872a] hover:text-[#e8b96e] transition-colors font-medium"
                >
                  {isSignUp ? 'Sign in' : 'Create one'}
                </button>
              </p>
            </form>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 px-4 py-3 rounded-xl bg-[#ef444415] border border-[#ef444433] text-[#fca5a5] text-sm text-center">
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
        <p className="text-xs text-[#78716c44]">
          Built with iron and code
        </p>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes ember-rise {
          0% {
            opacity: 0;
            transform: translateY(0) scale(0.5);
          }
          15% {
            opacity: 0.8;
          }
          100% {
            opacity: 0;
            transform: translateY(-40vh) translateX(${Math.random() > 0.5 ? '' : '-'}${Math.random() * 30}px) scale(0);
          }
        }

        @keyframes forge-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        @keyframes forge-line-glow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
