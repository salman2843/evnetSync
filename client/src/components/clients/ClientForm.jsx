import { useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import Button from '../ui/Button.jsx';
import PhoneField from '../ui/PhoneField.jsx';
import Select from '../ui/Select.jsx';
import TextField from '../ui/TextField.jsx';
import Textarea from '../ui/Textarea.jsx';
import { createClient, updateClient } from '../../api/clients.js';
import getErrorMessage from '../../lib/apiError.js';
import { CLIENT_SOURCES, CLIENT_STATUS_ORDER, PREFERRED_CONTACTS } from '../../lib/labels.js';
import { EMAIL_PATTERN, NATIONAL_PHONE_LENGTH, nationalFromPhone, toE164 } from '../../lib/validation.js';

const EMPTY_VALUES = {
  name: '',
  phone: '',
  email: '',
  company: '',
  source: '',
  preferredContact: 'WhatsApp',
  status: 'New',
  address: '',
  notes: ''
};

function initialValues(client) {
  if (!client) return EMPTY_VALUES;
  return {
    name: client.name || '',
    // The form keeps only the ten national digits; +91 is the fixed prefix.
    phone: nationalFromPhone(client.phone),
    email: client.email || '',
    company: client.company || '',
    source: client.source || '',
    preferredContact: client.preferredContact || 'WhatsApp',
    status: client.status || 'New',
    address: client.address || '',
    notes: client.notes || ''
  };
}

// Same rules as the server. Fix the first problem first; the rest can wait.
function validate(values) {
  const errors = {};

  if (!values.name.trim()) errors.name = 'Enter the client’s name.';

  if (!values.phone) errors.phone = 'Enter a phone number.';
  else if (values.phone.length !== NATIONAL_PHONE_LENGTH) {
    errors.phone = 'Enter all 10 digits.';
  }

  if (values.email.trim() && !EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }

  return errors;
}

const FIELD_ORDER = ['name', 'phone', 'email'];

// One form for create and edit. It calls the API module and hands the saved
// client back to the page, which closes the sheet and refreshes the grid.
// The form fills the drawer: only the fields scroll, the buttons stay put.
export default function ClientForm({ client, onSaved, onCancel }) {
  const editing = Boolean(client);
  const [values, setValues] = useState(() => initialValues(client));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const nameRef = useRef(null);
  const phoneRef = useRef(null);
  const emailRef = useRef(null);
  const refs = { name: nameRef, phone: phoneRef, email: emailRef };

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
    if (formError) setFormError('');
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
      phone: toE164(values.phone),
      email: values.email.trim().toLowerCase(),
      company: values.company.trim(),
      source: values.source,
      preferredContact: values.preferredContact,
      status: values.status,
      address: values.address.trim(),
      notes: values.notes.trim()
    };

    setSaving(true);
    try {
      const saved = editing
        ? await updateClient(client._id, payload)
        : await createClient(payload);
      onSaved(saved, editing);
    } catch (error) {
      setFormError(getErrorMessage(error, 'Could not save this client. Try again.'));
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
            Contact
          </legend>

          <TextField
            ref={nameRef}
            id="client-name"
            name="name"
            label="Client name"
            autoFocus
            autoComplete="name"
            placeholder="Full name"
            value={values.name}
            onChange={handleChange}
            error={errors.name}
          />

          <PhoneField
            ref={phoneRef}
            id="client-phone"
            name="phone"
            label="Phone number"
            placeholder="98765 43210"
            hint="10-digit mobile number."
            value={values.phone}
            onChange={handleChange}
            error={errors.phone}
          />

          <TextField
            ref={emailRef}
            id="client-email"
            name="email"
            type="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck="false"
            label="Email address"
            autoComplete="email"
            placeholder="name@example.com"
            hint="Optional."
            value={values.email}
            onChange={handleChange}
            error={errors.email}
          />

          <Select
            id="client-preferred-contact"
            name="preferredContact"
            label="Preferred contact"
            value={values.preferredContact}
            onChange={handleChange}
          >
            {PREFERRED_CONTACTS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </Select>
        </fieldset>

        <fieldset className="mt-7 min-w-0 space-y-4 border-0 p-0">
          <legend className="text-[0.68rem] font-medium uppercase tracking-[0.14em] text-muted">
            About
          </legend>

          <TextField
            id="client-company"
            name="company"
            label="Company"
            autoComplete="organization"
            placeholder="Company or family name"
            hint="Optional."
            value={values.company}
            onChange={handleChange}
          />

          <Select
            id="client-source"
            name="source"
            label="How did they find you?"
            value={values.source}
            onChange={handleChange}
          >
            <option value="">Choose a source</option>
            {CLIENT_SOURCES.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </Select>

          <Select
            id="client-status"
            name="status"
            label="Status"
            value={values.status}
            onChange={handleChange}
          >
            {CLIENT_STATUS_ORDER.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>

          <Textarea
            id="client-address"
            name="address"
            label="Where they are based"
            autoComplete="street-address"
            rows={2}
            placeholder="Area, city"
            value={values.address}
            onChange={handleChange}
          />

          <Textarea
            id="client-notes"
            name="notes"
            label="Notes"
            rows={4}
            placeholder="Preferences, budget hints, anything to remember"
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
          {editing ? 'Save changes' : 'Save client'}
        </Button>
      </div>
    </form>
  );
}
