import React from 'react';
import { cn } from '../utils';
import styles from './Stat.module.css';

export interface StatProps {
  label: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon?: React.ReactNode;
  className?: string;
}

export const Stat: React.FC<StatProps> = ({
  label,
  value,
  change,
  icon,
  className,
}) => {
  return (
    <div className={cn(styles.stat, className)}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <div className={styles.content}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{value}</span>
        {change && (
          <span className={cn(styles.change, styles[change.type])}>
            {change.type === 'increase' ? '↑' : '↓'} {Math.abs(change.value)}%
          </span>
        )}
      </div>
    </div>
  );
};

