import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import Button from '../ui/Button.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import Panel from '../ui/Panel.jsx';
import TextField from '../ui/TextField.jsx';
import { removeLogo, updateProfile, uploadLogo } from '../../api/profile.js';
import { assetUrl } from '../../lib/assets.js';
import getErrorMessage from '../../lib/apiError.js';
import { initialsOf } from '../../lib/format.js';

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

// The preview is a tile, not an avatar: the whole logo stays visible instead of
// being cropped into a circle. With no file, the business monogram stands in.
function LogoTile({ user }) {
  const logoUrl = user?.businessLogo?.url;
  const businessName = String(user?.businessName || '').trim();

  if (logoUrl) {
    return (
      <img
        src={assetUrl(logoUrl)}
        alt={businessName ? `${businessName} logo` : 'Business logo'}
        className="h-28 w-28 shrink-0 rounded-card border border-line bg-wash object-contain p-2 shadow-field sm:h-32 sm:w-32"
      />
    );
  }

  const monogram = initialsOf(businessName || user?.name);

  return (
    <div
      aria-hidden="true"
      className="grid h-28 w-28 shrink-0 place-items-center rounded-card border border-line bg-brand-soft font-display text-[2rem] leading-none text-brand shadow-field sm:h-32 sm:w-32"
    >
      {monogram}
    </div>
  );
}

export default function BusinessForm({ user, onSaved, notify }) {
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [nameError, setNameError] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [logoError, setLogoError] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState('');

  const trimmed = businessName.trim();
  const savedName = String(user?.businessName || '').trim();
  const hasSavedName = Boolean(savedName);
  const hasLogo = Boolean(user?.businessLogo?.url);
  const unchanged = trimmed === savedName;

  async function handleSaveName(event) {
    event.preventDefault();
    if (saving) return;

    // Mirrors the server: a logo needs a business to belong to, so the name
    // cannot be cleared while the file is still attached.
    if (!trimmed && hasLogo) {
      setNameError('Remove your business logo before clearing the business name.');
      return;
    }
    if (unchanged) return;

    setSaving(true);
    setNameError('');
    setFormError('');

    try {
      const updated = await updateProfile({ businessName: trimmed });
      onSaved(updated);
      notify(trimmed ? 'Business name saved.' : 'Business name cleared.');
    } catch (error) {
      setFormError(getErrorMessage(error, 'Could not save the business name. Try again.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || uploading) return;

    const typeAllowed =
      ALLOWED_TYPES.includes(file.type) || (!file.type && /\.(png|jpe?g|webp)$/i.test(file.name));

    if (!typeAllowed) {
      setLogoError('Choose a PNG, JPEG or WebP image.');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError('That image is over 2 MB. Choose a smaller file.');
      return;
    }

    setUploading(true);
    setLogoError('');
    setFormError('');

    try {
      const updated = await uploadLogo(file);
      onSaved(updated);
      notify('Business logo updated.');
    } catch (error) {
      setLogoError(getErrorMessage(error, 'Could not upload the logo. Try again.'));
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveLogo() {
    if (removing) return;

    setRemoving(true);
    setRemoveError('');

    try {
      const updated = await removeLogo();
      onSaved(updated);
      setConfirmRemove(false);
      notify('Business logo removed.');
    } catch (error) {
      setRemoveError(getErrorMessage(error, 'Could not remove the logo. Try again.'));
    } finally {
      setRemoving(false);
    }
  }

  return (
    <Panel
      id="business"
      title="Your business"
      description="The name and mark your clients see on your workspace."
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <LogoTile user={user} />

          <div className="min-w-0 flex-1">
            {hasSavedName ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileChange}
                    className="sr-only"
                    tabIndex={-1}
                  />
                  <Button
                    size="sm"
                    loading={uploading}
                    onClick={() => fileRef.current?.click()}
                  >
                    <Upload size={15} aria-hidden="true" />
                    {hasLogo ? 'Replace logo' : 'Upload logo'}
                  </Button>

                  {hasLogo ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-danger hover:bg-danger/[0.06]"
                      onClick={() => {
                        setRemoveError('');
                        setConfirmRemove(true);
                      }}
                    >
                      <X size={15} aria-hidden="true" />
                      Remove
                    </Button>
                  ) : null}
                </div>
                <p className="mt-2 text-[0.78rem] leading-snug text-muted">
                  PNG, JPEG or WebP, up to 2 MB.
                </p>
              </>
            ) : (
              <p className="text-[0.82rem] leading-relaxed text-muted">
                Save a business name below, and the logo controls appear here.
              </p>
            )}

            {logoError ? (
              <p role="alert" className="mt-2 text-[0.8rem] leading-snug text-danger">
                {logoError}
              </p>
            ) : null}
          </div>
        </div>

        <form onSubmit={handleSaveName} noValidate className="space-y-5">
          <TextField
            label="Business name"
            value={businessName}
            onChange={(event) => {
              setBusinessName(event.target.value);
              if (nameError) setNameError('');
              if (formError) setFormError('');
            }}
            error={nameError}
            hint={
              hasLogo
                ? 'Your logo is attached, so clear it before emptying this name.'
                : 'Leave this empty if you plan events under your own name.'
            }
            autoComplete="organization"
            maxLength={120}
          />

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
              Save business
            </Button>
          </div>
        </form>
      </div>

      <ConfirmDialog
        open={confirmRemove}
        title="Remove your business logo?"
        description="The logo file will be deleted. Your monogram or initials will show in its place."
        confirmLabel="Remove logo"
        loading={removing}
        error={removeError}
        onConfirm={handleRemoveLogo}
        onCancel={() => {
          if (!removing) {
            setConfirmRemove(false);
            setRemoveError('');
          }
        }}
      />
    </Panel>
  );
}
