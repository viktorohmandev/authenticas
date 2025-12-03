import { Request, Response } from 'express';
import { 
  Retailer, 
  CreateRetailerRequest, 
  UpdateRetailerRequest,
  ApiResponse 
} from '../models/types';
import { 
  readJsonFile, 
  findById, 
  findBy,
  appendToJsonFile,
  updateInJsonFile,
  deleteFromJsonFile
} from '../utils/fileUtils';
import { generateId, generateApiKey } from '../utils/apiKeyUtils';
import { getCurrentTimestamp } from '../utils/dateUtils';
import { audit } from '../services/auditService';

const RETAILERS_FILE = 'retailers.json';

// Get all retailers (system_admin only)
export async function getAllRetailers(req: Request, res: Response): Promise<void> {
  try {
    const retailers = await readJsonFile<Retailer>(RETAILERS_FILE);
    
    const response: ApiResponse<Retailer[]> = {
      success: true,
      data: retailers
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch retailers'
    };
    res.status(500).json(response);
  }
}

// Get retailer by ID
export async function getRetailerById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    // For retailer_admin, verify they can only access their own retailer
    if (req.user?.role === 'retailer_admin' && req.user.retailerId !== id) {
      const response: ApiResponse = {
        success: false,
        error: 'Access denied. You can only access your own retailer.'
      };
      res.status(403).json(response);
      return;
    }
    
    const retailer = await findById<Retailer>(RETAILERS_FILE, id);
    
    if (!retailer) {
      const response: ApiResponse = {
        success: false,
        error: 'Retailer not found'
      };
      res.status(404).json(response);
      return;
    }
    
    const response: ApiResponse<Retailer> = {
      success: true,
      data: retailer
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch retailer'
    };
    res.status(500).json(response);
  }
}

// Create new retailer (system_admin only)
export async function createRetailer(req: Request, res: Response): Promise<void> {
  try {
    const { name, webhookUrl } = req.body as CreateRetailerRequest;
    
    if (!name) {
      const response: ApiResponse = {
        success: false,
        error: 'Retailer name is required'
      };
      res.status(400).json(response);
      return;
    }
    
    // Check if retailer with same name exists
    const existingRetailer = await findBy<Retailer>(RETAILERS_FILE, r => r.name.toLowerCase() === name.toLowerCase());
    if (existingRetailer) {
      const response: ApiResponse = {
        success: false,
        error: 'Retailer with this name already exists'
      };
      res.status(400).json(response);
      return;
    }
    
    const now = getCurrentTimestamp();
    
    const newRetailer: Retailer = {
      id: generateId(),
      name: name.trim(),
      apiKey: generateApiKey(),
      webhookUrl,
      createdAt: now,
      updatedAt: now,
      isActive: true
    };
    
    await appendToJsonFile(RETAILERS_FILE, newRetailer);
    
    // Audit
    const performedBy = req.user?.userId || 'system';
    await audit.retailerCreated(performedBy, newRetailer.id, { name: newRetailer.name });
    
    const response: ApiResponse<Retailer> = {
      success: true,
      data: newRetailer,
      message: 'Retailer created successfully'
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Create retailer error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create retailer'
    };
    res.status(500).json(response);
  }
}

// Update retailer
export async function updateRetailer(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const updates = req.body as UpdateRetailerRequest;
    
    // For retailer_admin, verify they can only update their own retailer
    if (req.user?.role === 'retailer_admin' && req.user.retailerId !== id) {
      const response: ApiResponse = {
        success: false,
        error: 'Access denied. You can only update your own retailer.'
      };
      res.status(403).json(response);
      return;
    }
    
    const existingRetailer = await findById<Retailer>(RETAILERS_FILE, id);
    
    if (!existingRetailer) {
      const response: ApiResponse = {
        success: false,
        error: 'Retailer not found'
      };
      res.status(404).json(response);
      return;
    }
    
    const updatedRetailer = await updateInJsonFile<Retailer>(RETAILERS_FILE, id, {
      ...updates,
      updatedAt: getCurrentTimestamp()
    });
    
    if (!updatedRetailer) {
      const response: ApiResponse = {
        success: false,
        error: 'Failed to update retailer'
      };
      res.status(500).json(response);
      return;
    }
    
    // Audit
    const performedBy = req.user?.userId || 'system';
    await audit.retailerUpdated(performedBy, id, { ...existingRetailer }, { ...updatedRetailer });
    
    const response: ApiResponse<Retailer> = {
      success: true,
      data: updatedRetailer,
      message: 'Retailer updated successfully'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update retailer'
    };
    res.status(500).json(response);
  }
}

// Delete retailer (system_admin only)
export async function deleteRetailer(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    const existingRetailer = await findById<Retailer>(RETAILERS_FILE, id);
    
    if (!existingRetailer) {
      const response: ApiResponse = {
        success: false,
        error: 'Retailer not found'
      };
      res.status(404).json(response);
      return;
    }
    
    const deleted = await deleteFromJsonFile<Retailer>(RETAILERS_FILE, id);
    
    if (!deleted) {
      const response: ApiResponse = {
        success: false,
        error: 'Failed to delete retailer'
      };
      res.status(500).json(response);
      return;
    }
    
    // Audit
    const performedBy = req.user?.userId || 'system';
    await audit.retailerDeleted(performedBy, id, { name: existingRetailer.name });
    
    const response: ApiResponse = {
      success: true,
      message: 'Retailer deleted successfully'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete retailer'
    };
    res.status(500).json(response);
  }
}

// Regenerate API key for retailer
export async function regenerateRetailerApiKey(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    // For retailer_admin, verify they can only regenerate their own API key
    if (req.user?.role === 'retailer_admin' && req.user.retailerId !== id) {
      const response: ApiResponse = {
        success: false,
        error: 'Access denied. You can only regenerate your own API key.'
      };
      res.status(403).json(response);
      return;
    }
    
    const existingRetailer = await findById<Retailer>(RETAILERS_FILE, id);
    
    if (!existingRetailer) {
      const response: ApiResponse = {
        success: false,
        error: 'Retailer not found'
      };
      res.status(404).json(response);
      return;
    }
    
    const newApiKey = generateApiKey();
    
    const updatedRetailer = await updateInJsonFile<Retailer>(RETAILERS_FILE, id, {
      apiKey: newApiKey,
      updatedAt: getCurrentTimestamp()
    });
    
    if (!updatedRetailer) {
      const response: ApiResponse = {
        success: false,
        error: 'Failed to regenerate API key'
      };
      res.status(500).json(response);
      return;
    }
    
    const response: ApiResponse<{ apiKey: string }> = {
      success: true,
      data: { apiKey: newApiKey },
      message: 'API key regenerated successfully'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to regenerate API key'
    };
    res.status(500).json(response);
  }
}

// Register webhook URL for retailer
export async function registerRetailerWebhook(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { webhookUrl } = req.body;
    
    // For retailer_admin, verify they can only update their own webhook
    if (req.user?.role === 'retailer_admin' && req.user.retailerId !== id) {
      const response: ApiResponse = {
        success: false,
        error: 'Access denied. You can only update your own webhook.'
      };
      res.status(403).json(response);
      return;
    }
    
    if (!webhookUrl) {
      const response: ApiResponse = {
        success: false,
        error: 'Webhook URL is required'
      };
      res.status(400).json(response);
      return;
    }
    
    const existingRetailer = await findById<Retailer>(RETAILERS_FILE, id);
    
    if (!existingRetailer) {
      const response: ApiResponse = {
        success: false,
        error: 'Retailer not found'
      };
      res.status(404).json(response);
      return;
    }
    
    const updatedRetailer = await updateInJsonFile<Retailer>(RETAILERS_FILE, id, {
      webhookUrl,
      updatedAt: getCurrentTimestamp()
    });
    
    if (!updatedRetailer) {
      const response: ApiResponse = {
        success: false,
        error: 'Failed to register webhook'
      };
      res.status(500).json(response);
      return;
    }
    
    const response: ApiResponse<Retailer> = {
      success: true,
      data: updatedRetailer,
      message: 'Webhook registered successfully'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to register webhook'
    };
    res.status(500).json(response);
  }
}

