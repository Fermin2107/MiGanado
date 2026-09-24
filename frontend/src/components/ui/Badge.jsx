import './ui.css';

const VARIANT_MAP = {
  M:        'primary',
  H:        'primary',
  F:        'secondary',
  default:  'default',
  success:  'success',
  warning:  'warning',
  error:    'error',
  info:     'info',
};

export default function Badge({ children, variant, className = '' }) {
  const v = variant ?? VARIANT_MAP[children] ?? 'default';
  return (
    <span className={`badge badge-${v} ${className}`}>
      {children}
    </span>
  );
}
