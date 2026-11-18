// Small status pill. Tone tracks meaning, never decoration: neutral for plain
// states, brand for "in progress", semantic colours for real state.
const TONES = {
  neutral: 'border-line bg-canvas text-ink-soft',
  brand: 'border-brand/20 bg-brand-soft text-brand',
  success: 'border-success/25 bg-success/[0.07] text-success',
  warning: 'border-warning/25 bg-warning/[0.08] text-warning',
  danger: 'border-danger/25 bg-danger/[0.06] text-danger'
};

export default function Badge({ tone = 'neutral', className = '', children }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5',
        'text-[0.7rem] font-medium leading-5 tracking-[0.01em] whitespace-nowrap',
        TONES[tone] || TONES.neutral,
        className
      ].join(' ')}
    >
      {children}
    </span>
  );
}
