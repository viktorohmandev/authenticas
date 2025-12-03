import React from 'react';
import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  accentColor?: string;
}

const styles = {
  card: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-sm)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: '0.8125rem',
    color: 'var(--color-text-muted)',
    fontWeight: 500,
  },
  icon: {
    width: '2rem',
    height: '2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--radius-md)',
    fontSize: '1rem',
  },
  value: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: 'var(--color-text-primary)',
    letterSpacing: '-0.02em',
  },
  change: {
    fontSize: '0.75rem',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  positive: {
    color: 'var(--color-accent-green)',
  },
  negative: {
    color: 'var(--color-accent-red)',
  },
  neutral: {
    color: 'var(--color-text-muted)',
  },
};

export function StatCard({
  label,
  value,
  change,
  changeType = 'neutral',
  icon,
  accentColor = 'var(--color-accent-cyan)',
}: StatCardProps) {
  return (
    <Card>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.label}>{label}</span>
          {icon && (
            <span
              style={{
                ...styles.icon,
                background: `${accentColor}15`,
                color: accentColor,
              }}
            >
              {icon}
            </span>
          )}
        </div>
        <div style={styles.value}>{value}</div>
        {change && (
          <div style={{ ...styles.change, ...styles[changeType] }}>
            {changeType === 'positive' && '↑'}
            {changeType === 'negative' && '↓'}
            {change}
          </div>
        )}
      </div>
    </Card>
  );
}

interface StatsGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
}

export function StatsGrid({ children, columns = 4 }: StatsGridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 'var(--space-lg)',
      }}
    >
      {children}
    </div>
  );
}

