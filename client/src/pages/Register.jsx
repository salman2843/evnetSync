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
const PASSWORD_MIN_LENGTH = 8;

// Field order here is also the focus order on error: fix the first thing first.
function validate(values) {
  const errors = {};

  if (!values.name.trim()) errors.name = 'Enter the name you want on your account.';
  else if (values.name.trim().length < 2) errors.name = 'That looks too short.';

  if (!values.email.trim()) errors.email = 'Enter the email you will sign in with.';
  else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'That address is missing an @ or a domain.';
  }

  if (!values.password) errors.password = 'Choose a password.';
  else if (values.password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  }

  if (!values.confirmPassword) errors.confirmPassword = 'Repeat your password.';
  else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'The two passwords do not match.';
  }

  return errors;
}

const FIRST_FIELD = ['name', 'email', 'password', 'confirmPassword'];

export default function Register() {
  usePageTitle('Create your account');
  const { user, loading, register } = useAuth();
  const navigate = useNavigate();

  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);
  const refs = { name: nameRef, email: emailRef, password: passwordRef, confirmPassword: confirmRef };

  const [values, setValues] = useState({
    name: '',
    businessName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
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

    const firstInvalid = FIRST_FIELD.find((field) => nextErrors[field]);
    if (firstInvalid) {
      refs[firstInvalid].current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        // The API treats an absent business name as "not set yet".
        ...(values.businessName.trim() ? { businessName: values.businessName.trim() } : {})
      });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const message = getErrorMessage(error, 'Could not create your account. Try again.');
      // A duplicate email belongs on the email field, not in a banner.
      if (error?.response?.status === 409) {
        setErrors((current) => ({ ...current, email: message }));
        emailRef.current?.focus();
      } else {
        setFormError(message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <AuthPanel
        headline={
          <>
            Plan the work,
            <br />
            not the chasing.
          </>
        }
        body="One account for your clients, vendors, budgets and the next thing to do. Set it up once and every event starts ahead."
        footnote="Takes about a minute."
      />

      <main className="flex min-h-screen flex-col px-6 pb-8 pt-7 sm:px-10 lg:min-h-0 lg:px-16 lg:py-10">
        <div className="flex items-center gap-2.5 lg:hidden">
          <BrandMark className="h-7 w-7 text-brand" />
          <span className="font-display text-lg tracking-tight text-ink">EventSync</span>
        </div>

        <div className="mx-auto flex w-full max-w-[26rem] flex-1 flex-col justify-center py-10">
          <div className="panel-enter">
            <h1 className="font-display text-[2.1rem] leading-[1.08] tracking-[-0.02em] text-ink sm:text-[2.4rem]">
              Create your account
            </h1>
            <p className="mt-3 max-w-[38ch] text-[0.95rem] leading-relaxed text-muted">
              One login for every event you run. You can change the details later.
            </p>
          </div>

          <form
            className="panel-enter mt-8 space-y-4"
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
              ref={nameRef}
              id="register-name"
              name="name"
              label="Your name"
              autoComplete="name"
              placeholder="Your full name"
              value={values.name}
              onChange={handleChange}
              error={errors.name}
            />

            <TextField
              id="register-business"
              name="businessName"
              label="Business name"
              autoComplete="organization"
              placeholder="Your business name"
              hint="Optional. Shown on your profile."
              value={values.businessName}
              onChange={handleChange}
            />

            <TextField
              ref={emailRef}
              id="register-email"
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
              id="register-password"
              name="password"
              label="Password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              hint={`Use at least ${PASSWORD_MIN_LENGTH} characters.`}
              value={values.password}
              onChange={handleChange}
              error={errors.password}
            />

            <PasswordField
              ref={confirmRef}
              id="register-confirm"
              name="confirmPassword"
              label="Confirm password"
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={values.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
            />

            <Button type="submit" className="w-full" loading={submitting}>
              {submitting ? 'Creating your account…' : 'Create account'}
            </Button>
          </form>

          <p className="panel-enter mt-7 text-sm text-muted" style={{ animationDelay: '140ms' }}>
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-brand underline decoration-brand/30 underline-offset-4 transition-colors hover:text-brand-hover hover:decoration-brand"
            >
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-[0.72rem] tracking-wide text-muted">© 2026 EventSync</p>
      </main>
    </div>
  );
}
