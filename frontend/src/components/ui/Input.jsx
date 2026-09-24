import './ui.css';

export default function Input({ label, error, helper, id, className = '', ...props }) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="input-wrapper">
      {label && (
        <label className="input-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`input-field${error ? ' has-error' : ''} ${className}`}
        {...props}
      />
      {error && <span className="input-error">{error}</span>}
      {!error && helper && <span className="input-helper">{helper}</span>}
    </div>
  );
}
