import './ui.css';

export default function Select({ label, error, helper, id, options = [], placeholder, className = '', ...props }) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="input-wrapper">
      {label && (
        <label className="input-label" htmlFor={selectId}>
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`select-field${error ? ' has-error' : ''} ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="input-error">{error}</span>}
      {!error && helper && <span className="input-helper">{helper}</span>}
    </div>
  );
}
