import React from 'react';
import { cn } from '../utils';
import styles from './Spinner.module.css';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => {
  return (
    <div className={cn(styles.spinner, styles[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="31.4 31.4"
        />
      </svg>
    </div>
  );
};

export const PageLoader: React.FC = () => {
  return (
    <div className={styles.pageLoader}>
      <Spinner size="lg" />
      <span>Loading...</span>
    </div>
  );
};
