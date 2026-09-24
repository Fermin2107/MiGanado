import './ui.css';

export default function Spinner({ size = 'md', color, style }) {
  return (
    <span
      className={`spinner spinner-${size}`}
      style={color ? { color, ...style } : style}
      aria-label="Cargando"
    />
  );
}
