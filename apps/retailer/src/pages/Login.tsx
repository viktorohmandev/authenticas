import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@shared/hooks';
import { Button, Input, Card, useToast } from '@shared/components';
import styles from './Login.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const result = await login(email, password);
    
    if (result.success) {
      showToast('Welcome to Retailer Portal!', 'success');
      navigate('/');
    } else {
      showToast(result.error || 'Login failed', 'error');
    }
    
    setIsLoading(false);
  };
  
  return (
    <div className={styles.container}>
      <div className={styles.background}>
        <div className={styles.gradient1} />
        <div className={styles.gradient2} />
      </div>
      
      <Card variant="elevated" className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🔐</span>
            <span className={styles.logoText}>Authenticas</span>
          </div>
          <h1 className={styles.title}>Retailer Portal</h1>
          <p className={styles.subtitle}>Verify purchases and manage webhooks</p>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            type="email"
            label="Email"
            placeholder="retailer@store.com"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            required
          />
          
          <Input
            type="password"
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            required
          />
          
          <Button
            type="submit"
            isLoading={isLoading}
            className={styles.submitButton}
          >
            Sign In
          </Button>
        </form>
        
        <a href="/" className={styles.backLink}>
          ← Back to Home
        </a>
      </Card>
    </div>
  );
}

