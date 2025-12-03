import { Request, Response } from 'express';
import { 
  DisconnectRequest, 
  Company,
  CompanyRetailerLink,
  CreateDisconnectRequest,
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
import { audit } from '../services/auditService';
import { deactivateLink, isLinked } from './linkController';

const DISCONNECT_REQUESTS_FILE = 'disconnect_requests.json';
const COMPANIES_FILE = 'companies.json';
const LINKS_FILE = 'company_retailer_links.json';

// Create disconnect request for a specific retailer (company_admin only)
export async function createDisconnectRequest(req: Request, res: Response): Promise<void> {
  try {
    const { id: companyId } = req.params;
    const { retailerId, reason } = req.body as CreateDisconnectRequest;
    
    // Verify user is company_admin of this company
    if (req.user?.role !== 'system_admin' && req.user?.companyId !== companyId) {
      const response: ApiResponse = {
        success: false,
        error: 'Access denied. You can only create disconnect requests for your own company.'
      };
      res.status(403).json(response);
      return;
    }
    
    // retailerId is now required in multi-retailer architecture
    if (!retailerId) {
      const response: ApiResponse = {
        success: false,
        error: 'retailerId is required. Specify which retailer you want to disconnect from.'
      };
      res.status(400).json(response);
      return;
    }
    
    // Get company
    const company = await findById<Company>(COMPANIES_FILE, companyId);
    
    if (!company) {
      const response: ApiResponse = {
        success: false,
        error: 'Company not found'
      };
      res.status(404).json(response);
      return;
    }
    
    // Check if company is linked to this retailer using link table
    const linked = await isLinked(companyId, retailerId);
    if (!linked) {
      const response: ApiResponse = {
        success: false,
        error: 'Company is not connected to this retailer'
      };
      res.status(400).json(response);
      return;
    }
    
    // Check if there's already a pending request for this specific retailer
    const existingRequests = await readJsonFile<DisconnectRequest>(DISCONNECT_REQUESTS_FILE);
    const pendingRequest = existingRequests.find(
      r => r.companyId === companyId && r.retailerId === retailerId && r.status === 'pending'
    );
    
    if (pendingRequest) {
      const response: ApiResponse = {
        success: false,
        error: 'There is already a pending disconnect request for this retailer'
      };
      res.status(400).json(response);
      return;
    }
    
    const now = getCurrentTimestamp();
    
    const newRequest: DisconnectRequest = {
      id: generateId(),
      companyId,
      retailerId,
      status: 'pending',
      reason,
      requestedBy: req.user?.userId || 'system',
      createdAt: now,
      updatedAt: now
    };
    
    await appendToJsonFile(DISCONNECT_REQUESTS_FILE, newRequest);
    
    // Audit
    await audit.disconnectRequested(req.user?.userId || 'system', companyId, retailerId);
    
    const response: ApiResponse<DisconnectRequest> = {
      success: true,
      data: newRequest,
      message: 'Disconnect request created successfully'
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Create disconnect request error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create disconnect request'
    };
    res.status(500).json(response);
  }
}

// Get disconnect requests for retailer (retailer_admin only)
export async function getDisconnectRequestsForRetailer(req: Request, res: Response): Promise<void> {
  try {
    const retailerId = req.user?.retailerId;
    
    // System admin can specify retailerId
    const targetRetailerId = req.user?.role === 'system_admin' 
      ? (req.query.retailerId as string) || retailerId
      : retailerId;
    
    if (!targetRetailerId && req.user?.role !== 'system_admin') {
      const response: ApiResponse = {
        success: false,
        error: 'Retailer ID is required'
      };
      res.status(400).json(response);
      return;
    }
    
    let requests: DisconnectRequest[];
    
    if (req.user?.role === 'system_admin' && !targetRetailerId) {
      // System admin can see all
      requests = await readJsonFile<DisconnectRequest>(DISCONNECT_REQUESTS_FILE);
    } else {
      requests = await findAllBy<DisconnectRequest>(
        DISCONNECT_REQUESTS_FILE, 
        r => r.retailerId === targetRetailerId
      );
    }
    
    const response: ApiResponse<DisconnectRequest[]> = {
      success: true,
      data: requests
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch disconnect requests'
    };
    res.status(500).json(response);
  }
}

// Get disconnect requests for company (company_admin only)
export async function getDisconnectRequestsForCompany(req: Request, res: Response): Promise<void> {
  try {
    const { id: companyId } = req.params;
    
    // Verify user can access this company
    if (req.user?.role !== 'system_admin' && req.user?.companyId !== companyId) {
      const response: ApiResponse = {
        success: false,
        error: 'Access denied. You can only view disconnect requests for your own company.'
      };
      res.status(403).json(response);
      return;
    }
    
    const requests = await findAllBy<DisconnectRequest>(
      DISCONNECT_REQUESTS_FILE, 
      r => r.companyId === companyId
    );
    
    const response: ApiResponse<DisconnectRequest[]> = {
      success: true,
      data: requests
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch disconnect requests'
    };
    res.status(500).json(response);
  }
}

// Approve disconnect request (retailer_admin only)
// Now deactivates the link instead of modifying Company
export async function approveDisconnectRequest(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    const request = await findById<DisconnectRequest>(DISCONNECT_REQUESTS_FILE, id);
    
    if (!request) {
      const response: ApiResponse = {
        success: false,
        error: 'Disconnect request not found'
      };
      res.status(404).json(response);
      return;
    }
    
    // Verify retailer_admin owns this request
    if (req.user?.role === 'retailer_admin' && req.user.retailerId !== request.retailerId) {
      const response: ApiResponse = {
        success: false,
        error: 'Access denied. You can only process requests for your own retailer.'
      };
      res.status(403).json(response);
      return;
    }
    
    if (request.status !== 'pending') {
      const response: ApiResponse = {
        success: false,
        error: `Request has already been ${request.status}`
      };
      res.status(400).json(response);
      return;
    }
    
    // Update request status
    const updatedRequest = await updateInJsonFile<DisconnectRequest>(DISCONNECT_REQUESTS_FILE, id, {
      status: 'approved',
      processedBy: req.user?.userId,
      updatedAt: getCurrentTimestamp()
    });
    
    if (!updatedRequest) {
      const response: ApiResponse = {
        success: false,
        error: 'Failed to approve request'
      };
      res.status(500).json(response);
      return;
    }
    
    // Deactivate the link in company_retailer_links table (NOT modifying Company)
    const linkDeactivated = await deactivateLink(request.companyId, request.retailerId);
    
    if (!linkDeactivated) {
      console.warn(`Link deactivation failed for company ${request.companyId} and retailer ${request.retailerId}`);
    }
    
    // Audit
    await audit.disconnectApproved(req.user?.userId || 'system', request.companyId, request.retailerId);
    
    const response: ApiResponse<DisconnectRequest> = {
      success: true,
      data: updatedRequest,
      message: 'Disconnect request approved. The company-retailer link has been deactivated.'
    };
    res.json(response);
  } catch (error) {
    console.error('Approve disconnect request error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to approve disconnect request'
    };
    res.status(500).json(response);
  }
}

// Reject disconnect request (retailer_admin only)
export async function rejectDisconnectRequest(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    const request = await findById<DisconnectRequest>(DISCONNECT_REQUESTS_FILE, id);
    
    if (!request) {
      const response: ApiResponse = {
        success: false,
        error: 'Disconnect request not found'
      };
      res.status(404).json(response);
      return;
    }
    
    // Verify retailer_admin owns this request
    if (req.user?.role === 'retailer_admin' && req.user.retailerId !== request.retailerId) {
      const response: ApiResponse = {
        success: false,
        error: 'Access denied. You can only process requests for your own retailer.'
      };
      res.status(403).json(response);
      return;
    }
    
    if (request.status !== 'pending') {
      const response: ApiResponse = {
        success: false,
        error: `Request has already been ${request.status}`
      };
      res.status(400).json(response);
      return;
    }
    
    // Update request status
    const updatedRequest = await updateInJsonFile<DisconnectRequest>(DISCONNECT_REQUESTS_FILE, id, {
      status: 'rejected',
      processedBy: req.user?.userId,
      updatedAt: getCurrentTimestamp()
    });
    
    if (!updatedRequest) {
      const response: ApiResponse = {
        success: false,
        error: 'Failed to reject request'
      };
      res.status(500).json(response);
      return;
    }
    
    // Audit
    await audit.disconnectRejected(req.user?.userId || 'system', request.companyId, request.retailerId);
    
    const response: ApiResponse<DisconnectRequest> = {
      success: true,
      data: updatedRequest,
      message: 'Disconnect request rejected.'
    };
    res.json(response);
  } catch (error) {
    console.error('Reject disconnect request error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to reject disconnect request'
    };
    res.status(500).json(response);
  }
}

// Get single disconnect request by ID
export async function getDisconnectRequestById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    const request = await findById<DisconnectRequest>(DISCONNECT_REQUESTS_FILE, id);
    
    if (!request) {
      const response: ApiResponse = {
        success: false,
        error: 'Disconnect request not found'
      };
      res.status(404).json(response);
      return;
    }
    
    // Verify access
    if (req.user?.role === 'retailer_admin' && req.user.retailerId !== request.retailerId) {
      const response: ApiResponse = {
        success: false,
        error: 'Access denied.'
      };
      res.status(403).json(response);
      return;
    }
    
    if (req.user?.role === 'company_admin' && req.user.companyId !== request.companyId) {
      const response: ApiResponse = {
        success: false,
        error: 'Access denied.'
      };
      res.status(403).json(response);
      return;
    }
    
    const response: ApiResponse<DisconnectRequest> = {
      success: true,
      data: request
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch disconnect request'
    };
    res.status(500).json(response);
  }
}
