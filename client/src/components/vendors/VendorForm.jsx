import { useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import Button from '../ui/Button.jsx';
import MultiSelectChips from '../ui/MultiSelectChips.jsx';
import PhoneField from '../ui/PhoneField.jsx';
import TextField from '../ui/TextField.jsx';
import Textarea from '../ui/Textarea.jsx';
import { createVendor, updateVendor } from '../../api/vendors.js';
import getErrorMessage from '../../lib/apiError.js';
import { EMAIL_PATTERN, NATIONAL_PHONE_LENGTH, nationalFromPhone, toE164 } from '../../lib/validation.js';

const WEBSITE_PATTERN = /^https?:\/\/\S+\.\S+$/i;

const EMPTY_VALUES = {
  name: '',
  serviceCategoryIds: [],
  phone: '',
  email: '',
  website: '',
  address: '',
  notes: ''
};

function initialValues(vendor) {
  if (!vendor) return EMPTY_VALUES;
  return {
    name: vendor.name || '',
    serviceCategoryIds: vendor.serviceCategoryIds || [],
    phone: nationalFromPhone(vendor.phone),
    email: vendor.email || '',
    website: vendor.website || '',
    address: vendor.address || '',
    notes: vendor.notes || ''
  };
}

// Same rules as the server: only the name is required; contact details must be
// valid when they are filled in.
function validate(values) {
  const errors = {};

  if (!values.name.trim()) errors.name = 'Enter the vendor’s name.';

  if (values.phone && values.phone.length !== NATIONAL_PHONE_LENGTH) {
    errors.phone = 'Enter all 10 digits.';
  }
  if (values.email.trim() && !EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  if (values.website.trim() && !WEBSITE_PATTERN.test(values.website.trim())) {
    errors.website = 'Start the address with http:// or https://.';
  }

  return errors;
}

const FIELD_ORDER = ['name', 'phone', 'email', 'website'];

// One form for create and edit. Like the client form, only the fields scroll;
// the buttons stay pinned to the bottom of the sheet.
export default function VendorForm({ vendor, categories = [], onSaved, onCancel }) {
  const editing = Boolean(vendor);
  const [values, setValues] = useState(() => initialValues(vendor));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const nameRef = useRef(null);
  const phoneRef = useRef(null);
  const emailRef = useRef(null);
  const websiteRef = useRef(null);
  const refs = { name: nameRef, phone: phoneRef, email: emailRef, website: websiteRef };

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
    if (formError) setFormError('');
  }

  function handleCategories(next) {
    setValues((current) => ({ ...current, serviceCategoryIds: next }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;

    const nextErrors = validate(values);
    setErrors(nextErrors);
    setFormError('');

    const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field]);
    if (firstInvalid) {
      refs[firstInvalid].current?.focus();
      return;
    }

    const payload = {
      name: values.name.trim(),
      serviceCategoryIds: values.serviceCategoryIds,
      phone: toE164(values.phone),
      email: values.email.trim().toLowerCase(),
      website: values.website.trim(),
      address: values.address.trim(),
      notes: values.notes.trim()
    };

    setSaving(true);
    try {
      const saved = editing
        ? await updateVendor(vendor._id, payload)
        : await createVendor(payload);
      onSaved(saved, editing);
    } catch (error) {
      setFormError(getErrorMessage(error, 'Could not save this vendor. Try again.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {formError ? (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2.5 rounded-field border border-danger/25 bg-danger/[0.06] px-3.5 py-3 text-[0.85rem] leading-snug text-danger"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <p>{formError}</p>
          </div>
        ) : null}

        <fieldset className="min-w-0 space-y-4 border-0 p-0">
          <legend className="text-[0.68rem] font-medium uppercase tracking-[0.14em] text-muted">
            The vendor
          </legend>

          <TextField
            ref={nameRef}
            id="vendor-name"
            name="name"
            label="Vendor name"
            autoFocus
            autoComplete="organization"
            placeholder="Royal Caterers"
            value={values.name}
            onChange={handleChange}
            error={errors.name}
          />

          {categories.length ? (
            <MultiSelectChips
              label="What they do"
              options={categories}
              value={values.serviceCategoryIds}
              onChange={handleCategories}
              hint="Pick every service this vendor covers."
            />
          ) : null}
        </fieldset>

        <fieldset className="mt-7 min-w-0 space-y-4 border-0 p-0">
          <legend className="text-[0.68rem] font-medium uppercase tracking-[0.14em] text-muted">
            Contact
          </legend>

          <PhoneField
            ref={phoneRef}
            id="vendor-phone"
            name="phone"
            label="Phone number"
            placeholder="98765 43210"
            hint="Optional. 10-digit mobile number."
            value={values.phone}
            onChange={handleChange}
            error={errors.phone}
          />

          <TextField
            ref={emailRef}
            id="vendor-email"
            name="email"
            type="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck="false"
            label="Email address"
            autoComplete="email"
            placeholder="hello@example.com"
            hint="Optional."
            value={values.email}
            onChange={handleChange}
            error={errors.email}
          />

          <TextField
            ref={websiteRef}
            id="vendor-website"
            name="website"
            type="url"
            inputMode="url"
            autoCapitalize="none"
            spellCheck="false"
            label="Website"
            placeholder="https://example.com"
            hint="Optional. Start with https://."
            value={values.website}
            onChange={handleChange}
            error={errors.website}
          />

          <Textarea
            id="vendor-address"
            name="address"
            label="Where they are based"
            autoComplete="street-address"
            rows={2}
            placeholder="Area, city"
            value={values.address}
            onChange={handleChange}
          />
        </fieldset>

        <fieldset className="mt-7 min-w-0 space-y-4 border-0 p-0">
          <legend className="text-[0.68rem] font-medium uppercase tracking-[0.14em] text-muted">
            Notes
          </legend>

          <Textarea
            id="vendor-notes"
            name="notes"
            label="Anything to remember"
            rows={4}
            placeholder="Rates, contacts, what they did last time"
            value={values.notes}
            onChange={handleChange}
          />
        </fieldset>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-line px-5 py-3">
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {editing ? 'Save changes' : 'Save vendor'}
        </Button>
      </div>
    </form>
  );
}
