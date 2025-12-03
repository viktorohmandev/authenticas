import { Request, Response } from 'express';
import { 
  Company, 
  User,
  CompanyRetailerLink,
  CreateCompanyRequest, 
  UpdateCompanyRequest, 
  RegisterWebhookRequest,
  ApiResponse 
} from '../models/types';
import { 
  readJsonFile, 
  findById, 
  appendToJsonFile,
  updateInJsonFile,
  deleteFromJsonFile,
  findAllBy
} from '../utils/fileUtils';
import { generateId, generateApiKey, maskApiKey } from '../utils/apiKeyUtils';
import { getCurrentTimestamp } from '../utils/dateUtils';
import { audit } from '../services/auditService';
import { getActiveLinksForRetailer, isLinked } from './linkController';

const COMPANIES_FILE = 'companies.json';
const USERS_FILE = 'users.json';
const LINKS_FILE = 'company_retailer_links.json';

// Sanitize company for response (hide full API key)
function sanitizeCompany(company: Company): Omit<Company, 'apiKey'> & { apiKey: string } {
  return {
    ...company,
    apiKey: maskApiKey(company.apiKey)
  };
}

// Get all companies (filtered by role using link table)
export async function getAllCompanies(req: Request, res: Response): Promise<void> {
  try {
    let companies = await readJsonFile<Company>(COMPANIES_FILE);
    
    // Filter based on user role
    if (req.user?.role === 'retailer_admin' && req.user.retailerId) {
      // Retailer admin sees only companies linked to their retailer
      const links = await getActiveLinksForRetailer(req.user.retailerId);
      const linkedCompanyIds = new Set(links.map(l => l.companyId));
      companies = companies.filter(c => linkedCompanyIds.has(c.id));
    } else if (req.user?.role === 'company_admin' || req.user?.role === 'company_user') {
      // Company admin/user sees only their own company
      companies = companies.filter(c => c.id === req.user!.companyId);
    }
    // system_admin sees all
    
    const sanitized = companies.map(sanitizeCompany);
    
    const response: ApiResponse<typeof sanitized> = {
      success: true,
      data: sanitized
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch companies'
    };
    res.status(500).json(response);
  }
}

// Get company by ID
export async function getCompanyById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const company = await findById<Company>(COMPANIES_FILE, id);
    
    if (!company) {
      const response: ApiResponse = {
        success: false,
        error: 'Company not found'
      };
      res.status(404).json(response);
      return;
    }
    
    // Additional access check for retailer_admin using link table
    if (req.user?.role === 'retailer_admin' && req.user.retailerId) {
      const linked = await isLinked(id, req.user.retailerId);
      if (!linked) {
        const response: ApiResponse = {
          success: false,
          error: 'Access denied. Company is not linked to your retailer.'
        };
        res.status(403).json(response);
        return;
      }
    }
    
    const response: ApiResponse = {
      success: true,
      data: sanitizeCompany(company)
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch company'
    };
    res.status(500).json(response);
  }
}

// Create new company (system_admin only)
// Note: In multi-retailer architecture, companies are created independently
// and then linked to retailers via the link table
export async function createCompany(req: Request, res: Response): Promise<void> {
  try {
    const { name, webhookUrl } = req.body as CreateCompanyRequest;
    
    if (!name || name.trim().length === 0) {
      const response: ApiResponse = {
        success: false,
        error: 'Company name is required'
      };
      res.status(400).json(response);
      return;
    }
    
    const now = getCurrentTimestamp();
    const newCompany: Company = {
      id: generateId(),
      name: name.trim(),
      apiKey: generateApiKey(),
      webhookUrl: webhookUrl?.trim(),
      createdAt: now,
      updatedAt: now,
      isActive: true
    };
    
    await appendToJsonFile(COMPANIES_FILE, newCompany);
    
    // Audit
    const performedBy = req.user?.userId || 'system';
    await audit.companyCreated(performedBy, newCompany.id, { name: newCompany.name });
    
    const response: ApiResponse = {
      success: true,
      data: {
        ...newCompany,
        apiKey: newCompany.apiKey // Return full API key only on creation
      },
      message: 'Company created successfully. Use the links API to connect it to retailers. Save the API key - it will not be shown again in full.'
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create company'
    };
    res.status(500).json(response);
  }
}

// Update company
export async function updateCompany(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const updates = req.body as UpdateCompanyRequest;
    
    const existingCompany = await findById<Company>(COMPANIES_FILE, id);
    
    if (!existingCompany) {
      const response: ApiResponse = {
        success: false,
        error: 'Company not found'
      };
      res.status(404).json(response);
      return;
    }
    
    const beforeState = { 
      name: existingCompany.name, 
      webhookUrl: existingCompany.webhookUrl,
      isActive: existingCompany.isActive 
    };
    
    const updatedCompany = await updateInJsonFile<Company>(COMPANIES_FILE, id, {
      ...updates,
      updatedAt: getCurrentTimestamp()
    });
    
    if (!updatedCompany) {
      const response: ApiResponse = {
        success: false,
        error: 'Failed to update company'
      };
      res.status(500).json(response);
      return;
    }
    
    const afterState = { 
      name: updatedCompany.name, 
      webhookUrl: updatedCompany.webhookUrl,
      isActive: updatedCompany.isActive 
    };
    
    // Audit
    const performedBy = req.user?.userId || 'system';
    await audit.companyUpdated(performedBy, id, beforeState, afterState);
    
    const response: ApiResponse = {
      success: true,
      data: sanitizeCompany(updatedCompany),
      message: 'Company updated successfully'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update company'
    };
    res.status(500).json(response);
  }
}

// Delete company (system_admin only)
export async function deleteCompany(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    const existingCompany = await findById<Company>(COMPANIES_FILE, id);
    
    if (!existingCompany) {
      const response: ApiResponse = {
        success: false,
        error: 'Company not found'
      };
      res.status(404).json(response);
      return;
    }
    
    const deleted = await deleteFromJsonFile<Company>(COMPANIES_FILE, id);
    
    if (!deleted) {
      const response: ApiResponse = {
        success: false,
        error: 'Failed to delete company'
      };
      res.status(500).json(response);
      return;
    }
    
    // Audit
    const performedBy = req.user?.userId || 'system';
    await audit.companyDeleted(performedBy, id, { name: existingCompany.name });
    
    const response: ApiResponse = {
      success: true,
      message: 'Company deleted successfully'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete company'
    };
    res.status(500).json(response);
  }
}

// Regenerate API key
export async function regenerateApiKey(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    const existingCompany = await findById<Company>(COMPANIES_FILE, id);
    
    if (!existingCompany) {
      const response: ApiResponse = {
        success: false,
        error: 'Company not found'
      };
      res.status(404).json(response);
      return;
    }
    
    const newApiKey = generateApiKey();
    
    const updatedCompany = await updateInJsonFile<Company>(COMPANIES_FILE, id, {
      apiKey: newApiKey,
      updatedAt: getCurrentTimestamp()
    });
    
    if (!updatedCompany) {
      const response: ApiResponse = {
        success: false,
        error: 'Failed to regenerate API key'
      };
      res.status(500).json(response);
      return;
    }
    
    // Audit
    const performedBy = req.user?.userId || 'system';
    await audit.apiKeyRegenerated(performedBy, id);
    
    const response: ApiResponse = {
      success: true,
      data: {
        apiKey: newApiKey
      },
      message: 'API key regenerated successfully. Save the new key - it will not be shown again in full.'
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

// Register webhook URL
export async function registerWebhook(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { webhookUrl } = req.body as RegisterWebhookRequest;
    
    if (!webhookUrl || !webhookUrl.trim().startsWith('http')) {
      const response: ApiResponse = {
        success: false,
        error: 'Valid webhook URL is required (must start with http:// or https://)'
      };
      res.status(400).json(response);
      return;
    }
    
    const existingCompany = await findById<Company>(COMPANIES_FILE, id);
    
    if (!existingCompany) {
      const response: ApiResponse = {
        success: false,
        error: 'Company not found'
      };
      res.status(404).json(response);
      return;
    }
    
    const updatedCompany = await updateInJsonFile<Company>(COMPANIES_FILE, id, {
      webhookUrl: webhookUrl.trim(),
      updatedAt: getCurrentTimestamp()
    });
    
    if (!updatedCompany) {
      const response: ApiResponse = {
        success: false,
        error: 'Failed to register webhook'
      };
      res.status(500).json(response);
      return;
    }
    
    // Audit
    const performedBy = req.user?.userId || 'system';
    await audit.webhookRegistered(performedBy, id, webhookUrl.trim());
    
    const response: ApiResponse = {
      success: true,
      data: sanitizeCompany(updatedCompany),
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

// Get company users
export async function getCompanyUsers(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    const company = await findById<Company>(COMPANIES_FILE, id);
    
    if (!company) {
      const response: ApiResponse = {
        success: false,
        error: 'Company not found'
      };
      res.status(404).json(response);
      return;
    }
    
    // Additional access check for retailer_admin using link table
    if (req.user?.role === 'retailer_admin' && req.user.retailerId) {
      const linked = await isLinked(id, req.user.retailerId);
      if (!linked) {
        const response: ApiResponse = {
          success: false,
          error: 'Access denied. Company is not linked to your retailer.'
        };
        res.status(403).json(response);
        return;
      }
    }
    
    const users = await findAllBy<User>(USERS_FILE, (u) => u.companyId === id);
    
    // Remove passwords from response
    const sanitizedUsers = users.map(({ password, ...user }) => user);
    
    const response: ApiResponse = {
      success: true,
      data: sanitizedUsers
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch company users'
    };
    res.status(500).json(response);
  }
}
