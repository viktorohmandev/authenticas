import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import companiesRoutes from './routes/companies';
import usersRoutes from './routes/users';
import transactionsRoutes from './routes/transactions';
import auditRoutes from './routes/audit';
import retailersRoutes from './routes/retailers';
import disconnectRequestsRoutes from './routes/disconnectRequests';
import linksRoutes from './routes/links';

// Import utilities
import { initializeDataFiles } from './utils/fileUtils';
import { verifyPurchase } from './controllers/transactionController';
import { authenticateAny } from './middleware/authMiddleware';
import { ApiResponse } from './models/types';

// Initialize Express app
const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Authenticas API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/retailers', retailersRoutes);
app.use('/api/disconnect-requests', disconnectRequestsRoutes);
app.use('/api/links', linksRoutes);

// Direct verifyPurchase endpoint (as specified in requirements)
app.post('/verifyPurchase', authenticateAny, verifyPurchase);

// 404 handler
app.use((req: Request, res: Response) => {
  const response: ApiResponse = {
    success: false,
    error: `Route ${req.method} ${req.path} not found`
  };
  res.status(404).json(response);
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  
  const response: ApiResponse = {
    success: false,
    error: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'An unexpected error occurred'
  };
  res.status(500).json(response);
});

// Initialize and start server
async function startServer(): Promise<void> {
  try {
    // Initialize data files
    await initializeDataFiles();
    console.log('✅ Data files initialized');
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`🔐 AUTHENTICAS API SERVER started`);
      console.log(`   Port: ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Health check: /health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

// Start the server
startServer();

export default app;
