import React from 'react';
import { cn } from '../utils';
import styles from './Table.module.css';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {}

export const Table: React.FC<TableProps> = ({ children, className, ...props }) => {
  return (
    <div className={styles.wrapper}>
      <table className={cn(styles.table, className)} {...props}>
        {children}
      </table>
    </div>
  );
};

export const TableHead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <thead className={cn(styles.thead, className)} {...props}>
      {children}
    </thead>
  );
};

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <tbody className={cn(styles.tbody, className)} {...props}>
      {children}
    </tbody>
  );
};

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <tr className={cn(styles.tr, className)} {...props}>
      {children}
    </tr>
  );
};

export const TableHeader: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <th className={cn(styles.th, className)} {...props}>
      {children}
    </th>
  );
};

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <td className={cn(styles.td, className)} {...props}>
      {children}
    </td>
  );
};

export const TableEmpty: React.FC<{ message?: string; colSpan: number }> = ({
  message = 'No data available',
  colSpan,
}) => {
  return (
    <tr>
      <td colSpan={colSpan} className={styles.empty}>
        {message}
      </td>
    </tr>
  );
};
