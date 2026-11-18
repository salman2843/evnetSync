import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import BrandMark from '../components/BrandMark.jsx';
import FullScreenLoader from '../components/FullScreenLoader.jsx';
import Button from '../components/ui/Button.jsx';
import TextField from '../components/ui/TextField.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import getErrorMessage from '../lib/apiError.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Illustrative planner week for the brand panel. No customer names or figures,
// so nothing here reads as a claim about real data.
const WEEK = [
  { date: '19', title: 'Venue walkthrough', meta: 'Catering · Decor', status: 'Confirmed' },
  { date: '21', title: 'Cake tasting', meta: 'Birthday · Client', status: 'Planning' },
  { date: '24', title: 'AV hold', meta: 'Conference · 2 days', status: 'Inquiry' }
];

function validate(values) {
  const errors = {};
  if (!values.email.trim()) errors.email = 'Enter the email you signed up with.';
  else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'That address is missing an @ or a domain.';
  }
  if (!values.password) errors.password = 'Enter your password.';
  return errors;
}

function BrandPanel() {
  return (
    <aside
      aria-hidden="true"
      className="relative hidden overflow-hidden bg-ink px-12 py-12 lg:flex lg:flex-col xl:px-16 xl:py-14"
    >
      {/* Warm light on ink, low and soft; the only colour field on the page. */}
      <div className="pointer-events-none absolute -right-32 -top-40 h-[34rem] w-[34rem] rounded-full bg-brand/25 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-48 -left-28 h-[26rem] w-[26rem] rounded-full bg-accent/10 blur-[110px]" />

      <div className="relative flex items-center gap-3">
        <BrandMark className="h-9 w-9 text-brand-tint" />
        <span className="font-display text-[1.35rem] tracking-[-0.01em] text-canvas">EventSync</span>
      </div>

      <div className="relative mt-auto max-w-[30rem]">
        <p className="font-display text-[2.75rem] leading-[1.06] tracking-[-0.025em] text-canvas xl:text-[3.15rem]">
          The whole event,
          <br />
          on one page.
        </p>
        <p className="mt-6 max-w-[38ch] text-[0.95rem] leading-relaxed text-onInk-soft">
          Clients, vendors, budgets and the next thing to do — kept together from first enquiry to
          final invoice.
        </p>

        <div className="mt-12 rounded-card border border-onInk/10 bg-onInk/[0.04] p-5">
          <div className="flex items-baseline justify-between">
            <span className="text-[0.68rem] uppercase tracking-[0.16em] text-onInk-muted">
              This week
            </span>
            <span className="text-[0.68rem] tracking-wide text-onInk-muted">November</span>
          </div>

          <div className="rule-draw mt-4 h-px bg-gradient-to-r from-brand/80 via-brand/30 to-transparent" />

          <ol>
            {WEEK.map((item, index) => (
              <li
                key={item.title}
                className="row-enter flex items-start gap-4 border-b border-onInk/10 py-3.5 last:border-b-0 last:pb-0"
                style={{ animationDelay: `${180 + index * 90}ms` }}
              >
                <span className="w-8 shrink-0 font-display text-xl leading-none text-canvas">
                  {item.date}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-[0.85rem] font-medium text-onInk">
                      {item.title}
                    </span>
                    <span className="shrink-0 rounded-full border border-onInk/15 px-2 py-0.5 text-[0.65rem] font-medium text-onInk-soft">
                      {item.status}
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-[0.75rem] text-onInk-muted">
                    {item.meta}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <p className="relative mt-12 text-[0.72rem] tracking-wide text-onInk-muted">
        Built for independent event planners.
      </p>
    </aside>
  );
}

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <FullScreenLoader label="Checking your session" />;
  if (user) return <Navigate to="/dashboard" replace />;

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
    if (formError) setFormError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const nextErrors = validate(values);
    setErrors(nextErrors);
    setFormError('');

    if (nextErrors.email) {
      emailRef.current?.focus();
      return;
    }
    if (nextErrors.password) {
      passwordRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      await login({ email: values.email.trim(), password: values.password });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setFormError(
        getErrorMessage(error, 'Could not sign you in. Check your details and try again.')
      );
      passwordRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <BrandPanel />

      <main className="flex min-h-screen flex-col px-6 pb-8 pt-7 sm:px-10 lg:min-h-0 lg:px-16 lg:py-10">
        <div className="flex items-center gap-2.5 lg:hidden">
          <BrandMark className="h-7 w-7 text-brand" />
          <span className="font-display text-lg tracking-tight text-ink">EventSync</span>
        </div>

        <div className="mx-auto flex w-full max-w-[25rem] flex-1 flex-col justify-center py-12">
          <div className="panel-enter">
            <h1 className="font-display text-[2.1rem] leading-[1.08] tracking-[-0.02em] text-ink sm:text-[2.4rem]">
              Sign in to EventSync
            </h1>
            <p className="mt-3 max-w-[36ch] text-[0.95rem] leading-relaxed text-muted">
              Welcome back. Pick up where your events left off.
            </p>
          </div>

          <form
            className="panel-enter mt-9 space-y-5"
            style={{ animationDelay: '80ms' }}
            onSubmit={handleSubmit}
            noValidate
          >
            {formError ? (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-field border border-danger/25 bg-danger/[0.06] px-3.5 py-3 text-[0.85rem] leading-snug text-danger"
              >
                <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                <p>{formError}</p>
              </div>
            ) : null}

            <TextField
              ref={emailRef}
              id="login-email"
              name="email"
              type="email"
              label="Email address"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck="false"
              placeholder="you@studio.com"
              value={values.email}
              onChange={handleChange}
              error={errors.email}
            />

            <TextField
              ref={passwordRef}
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              label="Password"
              autoComplete="current-password"
              placeholder="Your password"
              value={values.password}
              onChange={handleChange}
              error={errors.password}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="grid h-10 w-10 place-items-center rounded-lg text-muted transition-colors duration-150 hover:bg-wash hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                >
                  {showPassword ? (
                    <EyeOff size={16} aria-hidden="true" />
                  ) : (
                    <Eye size={16} aria-hidden="true" />
                  )}
                </button>
              }
            />

            <Button type="submit" className="w-full" loading={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p
            className="panel-enter mt-8 text-sm text-muted"
            style={{ animationDelay: '140ms' }}
          >
            New to EventSync?{' '}
            <Link
              to="/register"
              className="font-medium text-brand underline decoration-brand/30 underline-offset-4 transition-colors hover:text-brand-hover hover:decoration-brand"
            >
              Create an account
            </Link>
          </p>
        </div>

        <p className="text-[0.72rem] tracking-wide text-muted">© 2026 EventSync</p>
      </main>
    </div>
  );
}
