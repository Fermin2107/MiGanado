import './ui.css';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
        textAlign: 'center',
        gap: '16px',
      }}
    >
      {Icon && (
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 'var(--radius-xl)',
            background: 'var(--color-primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)',
            marginBottom: '8px',
          }}
        >
          <Icon size={28} />
        </div>
      )}
      <div>
        <p
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--color-text)',
            marginBottom: 6,
          }}
        >
          {title}
        </p>
        {description && (
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', maxWidth: 340 }}>
            {description}
          </p>
        )}
      </div>
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}
