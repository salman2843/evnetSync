import { useState } from 'react';
import Button from '../ui/Button.jsx';
import Panel from '../ui/Panel.jsx';
import TextField from '../ui/TextField.jsx';
import { updateProfile } from '../../api/profile.js';
import getErrorMessage from '../../lib/apiError.js';
import { formatMonthYear } from '../../lib/format.js';

// Name, sign-in email and the month the planner joined. The email is shown but
// not editable, so nobody expects a save to move their account.
export default function ProfileForm({ user, onSaved, notify }) {
  const [name, setName] = useState(user?.name || '');
  const [nameError, setNameError] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const trimmed = name.trim();
  const unchanged = trimmed === (user?.name || '').trim();

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;

    if (!trimmed) {
      setNameError('Enter the name you want on your account.');
      return;
    }
    if (trimmed.length > 80) {
      setNameError('That name is too long. Use 80 characters or fewer.');
      return;
    }
    if (unchanged) return;

    setSaving(true);
    setNameError('');
    setFormError('');

    try {
      const updated = await updateProfile({ name: trimmed });
      onSaved(updated);
      notify('Your name was saved.');
    } catch (error) {
      setFormError(getErrorMessage(error, 'Could not save your name. Try again.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel
      id="profile"
      title="Your details"
      description="The name shown in the sidebar and on your account."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Your name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (nameError) setNameError('');
              if (formError) setFormError('');
            }}
            error={nameError}
            autoComplete="name"
            maxLength={80}
          />

          <TextField
            label="Email"
            value={user?.email || ''}
            readOnly
            hint="You sign in with this address. It cannot be changed here."
            autoComplete="email"
          />
        </div>

        <p className="text-[0.8rem] leading-snug text-muted">
          Member since {formatMonthYear(user?.createdAt) || 'your first sign-in'}.
        </p>

        {formError ? (
          <p
            role="alert"
            className="rounded-field border border-danger/20 bg-danger/[0.05] px-3.5 py-2.5 text-[0.8rem] leading-snug text-danger"
          >
            {formError}
          </p>
        ) : null}

        <div className="flex justify-end">
          <Button type="submit" size="sm" loading={saving} disabled={unchanged && !nameError}>
            Save name
          </Button>
        </div>
      </form>
    </Panel>
  );
}
