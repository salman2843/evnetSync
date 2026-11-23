import { useState } from 'react';
import Button from '../ui/Button.jsx';
import Panel from '../ui/Panel.jsx';
import PasswordField from '../ui/PasswordField.jsx';
import { changePassword } from '../../api/profile.js';
import getErrorMessage from '../../lib/apiError.js';

const PASSWORD_MIN_LENGTH = 8;

// Changing the password invalidates older sessions, so the API hands back a
// fresh token. Settings swaps it into the auth context to stay signed in here.
export default function PasswordForm({ onSaved, notify }) {
  const [values, setValues] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  function handleChange(field) {
    return (event) => {
      setValues((current) => ({ ...current, [field]: event.target.value }));
      setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
      if (formError) setFormError('');
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;

    const nextErrors = {};
    if (!values.currentPassword) nextErrors.currentPassword = 'Enter your current password.';
    if (!values.newPassword) nextErrors.newPassword = 'Choose a new password.';
    else if (values.newPassword.length < PASSWORD_MIN_LENGTH) {
      nextErrors.newPassword = `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
    } else if (values.newPassword === values.currentPassword) {
      nextErrors.newPassword = 'Choose a password different from the current one.';
    }
    if (!values.confirmPassword) nextErrors.confirmPassword = 'Repeat the new password.';
    else if (values.confirmPassword !== values.newPassword) {
      nextErrors.confirmPassword = 'The two passwords do not match.';
    }

    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) return;

    setSaving(true);

    try {
      const result = await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });
      onSaved(result.user, result.token);
      setValues({ currentPassword: '', newPassword: '', confirmPassword: '' });
      notify('Your password is updated. Other sessions have been signed out.');
    } catch (error) {
      setFormError(getErrorMessage(error, 'Could not change your password. Try again.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel
      id="password"
      title="Password"
      description="Use at least 8 characters. Other devices will need to sign in again."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <PasswordField
          label="Current password"
          value={values.currentPassword}
          onChange={handleChange('currentPassword')}
          error={errors.currentPassword}
          autoComplete="current-password"
        />
        <PasswordField
          label="New password"
          value={values.newPassword}
          onChange={handleChange('newPassword')}
          error={errors.newPassword}
          autoComplete="new-password"
        />
        <PasswordField
          label="Confirm new password"
          value={values.confirmPassword}
          onChange={handleChange('confirmPassword')}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        {formError ? (
          <p
            role="alert"
            className="rounded-field border border-danger/20 bg-danger/[0.05] px-3.5 py-2.5 text-[0.8rem] leading-snug text-danger"
          >
            {formError}
          </p>
        ) : null}

        <div className="flex justify-end pt-1">
          <Button type="submit" size="sm" loading={saving}>
            Change password
          </Button>
        </div>
      </form>
    </Panel>
  );
}
