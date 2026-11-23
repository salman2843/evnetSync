import { useAuth } from '../context/AuthContext.jsx';
import useToast from '../hooks/useToast.js';
import usePageTitle from '../lib/usePageTitle.js';
import BusinessForm from '../components/settings/BusinessForm.jsx';
import PasswordForm from '../components/settings/PasswordForm.jsx';
import ProfileForm from '../components/settings/ProfileForm.jsx';
import Toast from '../components/ui/Toast.jsx';

// Account, business identity and password in one place. Time zone and currency
// stay out for now: this build quotes everything in INR.
export default function Settings() {
  usePageTitle('Settings');

  const { user, updateUser } = useAuth();
  const { notice, notify } = useToast(6000);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <Toast text={notice.text} tone={notice.tone} />

      <header>
        <p className="text-[0.72rem] font-medium uppercase tracking-[0.16em] text-muted">
          Your workspace
        </p>
        <h1 className="mt-2 font-display text-[2.1rem] leading-[1.08] tracking-[-0.02em] text-ink sm:text-[2.4rem]">
          Settings
        </h1>
        <p className="mt-2 max-w-[52ch] text-[0.92rem] leading-relaxed text-muted">
          Your details, your business mark, and the password that keeps it all yours.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-start">
        <div className="space-y-6">
          <ProfileForm user={user} onSaved={updateUser} notify={notify} />
          <BusinessForm user={user} onSaved={updateUser} notify={notify} />
        </div>

        <PasswordForm onSaved={updateUser} notify={notify} />
      </div>
    </div>
  );
}
