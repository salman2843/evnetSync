import { Link } from 'react-router-dom';
import BrandMark from '../components/BrandMark.jsx';
import Button from '../components/ui/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// Temporary screen for routes whose page is built in the next phase.
export default function ComingSoon({ title, description, signedIn = false }) {
  const { user, logout } = useAuth();

  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-6">
      <div className="panel-enter w-full max-w-md">
        <BrandMark className="h-9 w-9 text-brand" />
        <h1 className="mt-8 font-display text-[2rem] leading-[1.1] tracking-[-0.02em] text-ink">
          {title}
        </h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">{description}</p>

        {signedIn && user ? (
          <p className="mt-6 rounded-field border border-line bg-surface px-4 py-3 text-sm text-ink-soft">
            Signed in as <span className="font-medium text-ink">{user.name}</span>
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center gap-5">
          {signedIn ? (
            <Button variant="ghost" onClick={logout}>
              Sign out
            </Button>
          ) : (
            <Link
              to="/login"
              className="text-sm font-medium text-brand underline decoration-brand/30 underline-offset-4 transition-colors hover:text-brand-hover hover:decoration-brand"
            >
              Back to sign in
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
