import React from 'react';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
}

const styles = {
  base: {
    padding: 'var(--space-md)',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    gap: 'var(--space-sm)',
    border: '1px solid',
  },
  info: {
    background: 'rgba(0, 212, 255, 0.1)',
    borderColor: 'rgba(0, 212, 255, 0.3)',
    color: 'var(--color-accent-cyan)',
  },
  success: {
    background: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    color: 'var(--color-accent-green)',
  },
  warning: {
    background: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    color: 'var(--color-accent-amber)',
  },
  error: {
    background: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    color: 'var(--color-accent-red)',
  },
  icon: {
    flexShrink: 0,
    fontSize: '1.125rem',
  },
  content: {
    flex: 1,
  },
  title: {
    fontWeight: 600,
    marginBottom: '0.25rem',
  },
  message: {
    fontSize: '0.875rem',
    opacity: 0.9,
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    opacity: 0.7,
    fontSize: '1rem',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

const icons: Record<AlertVariant, string> = {
  info: 'ℹ',
  success: '✓',
  warning: '⚠',
  error: '✕',
};

export function Alert({ variant = 'info', title, children, onClose }: AlertProps) {
  const alertStyle: React.CSSProperties = {
    ...styles.base,
    ...styles[variant],
  };

  return (
    <div style={alertStyle}>
      <span style={styles.icon}>{icons[variant]}</span>
      <div style={styles.content}>
        {title && <div style={styles.title}>{title}</div>}
        <div style={styles.message}>{children}</div>
      </div>
      {onClose && (
        <button
          style={{ ...styles.closeButton, color: styles[variant].color }}
          onClick={onClose}
          aria-label="Close alert"
        >
          ✕
        </button>
      )}
    </div>
  );
}

