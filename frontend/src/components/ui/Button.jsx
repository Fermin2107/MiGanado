import './ui.css';
import Spinner from './Spinner';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className = '',
  ...props
}) {
  const classes = [
    'btn',
    `btn-${variant}`,
    size !== 'md' && `btn-${size}`,
    fullWidth && 'btn-full',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} disabled={loading || props.disabled} {...props}>
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
