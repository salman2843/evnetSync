import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import TextField from './TextField.jsx';

// Password input with a reveal control. Each field keeps its own state, so a
// register form with two password boxes can reveal them independently.
const PasswordField = forwardRef(function PasswordField({ label = 'Password', ...props }, ref) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      ref={ref}
      label={label}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="grid h-10 w-10 place-items-center rounded-lg text-muted transition-colors duration-150 hover:bg-wash hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          {visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        </button>
      }
    />
  );
});

export default PasswordField;
