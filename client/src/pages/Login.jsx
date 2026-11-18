import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import AuthPanel from '../components/auth/AuthPanel.jsx';
import BrandMark from '../components/BrandMark.jsx';
import FullScreenLoader from '../components/FullScreenLoader.jsx';
import Button from '../components/ui/Button.jsx';
import PasswordField from '../components/ui/PasswordField.jsx';
import TextField from '../components/ui/TextField.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import getErrorMessage from '../lib/apiError.js';
import usePageTitle from '../lib/usePageTitle.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values) {
  const errors = {};
  if (!values.email.trim()) errors.email = 'Enter the email you signed up with.';
  else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'That address is missing an @ or a domain.';
  }
  if (!values.password) errors.password = 'Enter your password.';
  return errors;
}

export default function Login() {
  usePageTitle('Sign in');
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
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
      <AuthPanel />

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

            <PasswordField
              ref={passwordRef}
              id="login-password"
              name="password"
              label="Password"
              autoComplete="current-password"
              placeholder="Your password"
              value={values.password}
              onChange={handleChange}
              error={errors.password}
            />

            <Button type="submit" className="w-full" loading={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="panel-enter mt-8 text-sm text-muted" style={{ animationDelay: '140ms' }}>
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
