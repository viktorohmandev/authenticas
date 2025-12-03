import { Request, Response } from 'express';
import { 
  CompanyRetailerLink, 
  Company,
  Retailer,
  ApiResponse 
} from '../models/types';
import { 
  readJsonFile, 
  findById, 
  findAllBy,
  appendToJsonFile,
  updateInJsonFile
} from '../utils/fileUtils';
import { generateId } from '../utils/apiKeyUtils';
import { getCurrentTimestamp } from '../utils/dateUtils';

const LINKS_FILE = 'company_retailer_links.json';
const COMPANIES_FILE = 'companies.json';
const RETAILERS_FILE = 'retailers.json';

// Get all links (system_admin only)
export async function getAllLinks(req: Request, res: Response): Promise<void> {
  try {
    const links = await readJsonFile<CompanyRetailerLink>(LINKS_FILE);
    
    const response: ApiResponse<CompanyRetailerLink[]> = {
      success: true,
      data: links
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch links'
    };
    res.status(500).json(response);
  }
}

// Get companies linked to a retailer
export async function getCompaniesForRetailer(req: Request, res: Response): Promise<void> {
  try {
    const { id: retailerId } = req.params;
    
    // For retailer_admin, verify they can only access their own retailer
    if (req.user?.role === 'retailer_admin' && req.user.retailerId !== retailerId) {
      const response: ApiResponse = {
        success: false,
        error: 'Access denied. You can only view companies for your own retailer.'
      };
      res.status(403).json(response);
      return;
    }
    
    // Get all active links for this retailer
    const links = await findAllBy<CompanyRetailerLink>(
      LINKS_FILE, 
      l => l.retailerId === retailerId && l.status === 'active'
    );
    
    // Get company details
    const companies = await readJsonFile<Company>(COMPANIES_FILE);
    const linkedCompanies = companies.filter(c => 
      links.some(l => l.companyId === c.id)
    );
    
    const response: ApiResponse<Company[]> = {
      success: true,
      data: linkedCompanies
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch companies for retailer'
    };
    res.status(500).json(response);
  }
}

// Get retailers linked to a company
export async function getRetailersForCompany(req: Request, res: Response): Promise<void> {
  try {
    const { id: companyId } = req.params;
    
    // For company roles, verify they can only access their own company
    if ((req.user?.role === 'company_admin' || req.user?.role === 'company_user') && 
        req.user.companyId !== companyId) {
      const response: ApiResponse = {
        success: false,
        error: 'Access denied. You can only view retailers for your own company.'
      };
      res.status(403).json(response);
      return;
    }
    
    // Get all active links for this company
    const links = await findAllBy<CompanyRetailerLink>(
      LINKS_FILE, 
      l => l.companyId === companyId && l.status === 'active'
    );
    
    // Get retailer details
    const retailers = await readJsonFile<Retailer>(RETAILERS_FILE);
    const linkedRetailers = retailers.filter(r => 
      links.some(l => l.retailerId === r.id)
    );
    
    const response: ApiResponse<Retailer[]> = {
      success: true,
      data: linkedRetailers
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch retailers for company'
    };
    res.status(500).json(response);
  }
}

// Create a link between company and retailer (system_admin only)
export async function createLink(req: Request, res: Response): Promise<void> {
  try {
    const { companyId, retailerId } = req.body;
    
    if (!companyId || !retailerId) {
      const response: ApiResponse = {
        success: false,
        error: 'companyId and retailerId are required'
      };
      res.status(400).json(response);
      return;
    }
    
    // Verify company exists
    const company = await findById<Company>(COMPANIES_FILE, companyId);
    if (!company) {
      const response: ApiResponse = {
        success: false,
        error: 'Company not found'
      };
      res.status(404).json(response);
      return;
    }
    
    // Verify retailer exists
    const retailer = await findById<Retailer>(RETAILERS_FILE, retailerId);
    if (!retailer) {
      const response: ApiResponse = {
        success: false,
        error: 'Retailer not found'
      };
      res.status(404).json(response);
      return;
    }
    
    // Check if link already exists
    const existingLinks = await readJsonFile<CompanyRetailerLink>(LINKS_FILE);
    const existingLink = existingLinks.find(
      l => l.companyId === companyId && l.retailerId === retailerId
    );
    
    if (existingLink) {
      if (existingLink.status === 'active') {
        const response: ApiResponse = {
          success: false,
          error: 'Link already exists between this company and retailer'
        };
        res.status(400).json(response);
        return;
      }
      
      // Reactivate inactive link
      const updatedLink = await updateInJsonFile<CompanyRetailerLink>(LINKS_FILE, existingLink.id, {
        status: 'active',
        updatedAt: getCurrentTimestamp()
      });
      
      const response: ApiResponse<CompanyRetailerLink> = {
        success: true,
        data: updatedLink!,
        message: 'Link reactivated successfully'
      };
      res.json(response);
      return;
    }
    
    // Create new link
    const newLink: CompanyRetailerLink = {
      id: generateId(),
      companyId,
      retailerId,
      status: 'active',
      createdAt: getCurrentTimestamp()
    };
    
    await appendToJsonFile(LINKS_FILE, newLink);
    
    const response: ApiResponse<CompanyRetailerLink> = {
      success: true,
      data: newLink,
      message: 'Link created successfully'
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Create link error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create link'
    };
    res.status(500).json(response);
  }
}

// Deactivate a link (used by disconnect approval)
export async function deactivateLink(companyId: string, retailerId: string): Promise<boolean> {
  try {
    const links = await readJsonFile<CompanyRetailerLink>(LINKS_FILE);
    const link = links.find(
      l => l.companyId === companyId && l.retailerId === retailerId && l.status === 'active'
    );
    
    if (!link) {
      return false;
    }
    
    await updateInJsonFile<CompanyRetailerLink>(LINKS_FILE, link.id, {
      status: 'inactive',
      updatedAt: getCurrentTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Deactivate link error:', error);
    return false;
  }
}

// Check if a company-retailer link exists and is active
export async function isLinked(companyId: string, retailerId: string): Promise<boolean> {
  try {
    const links = await readJsonFile<CompanyRetailerLink>(LINKS_FILE);
    return links.some(
      l => l.companyId === companyId && l.retailerId === retailerId && l.status === 'active'
    );
  } catch (error) {
    return false;
  }
}

// Get all active links for a retailer (helper function)
export async function getActiveLinksForRetailer(retailerId: string): Promise<CompanyRetailerLink[]> {
  return findAllBy<CompanyRetailerLink>(
    LINKS_FILE, 
    l => l.retailerId === retailerId && l.status === 'active'
  );
}

// Get all active links for a company (helper function)
export async function getActiveLinksForCompany(companyId: string): Promise<CompanyRetailerLink[]> {
  return findAllBy<CompanyRetailerLink>(
    LINKS_FILE, 
    l => l.companyId === companyId && l.status === 'active'
  );
}

