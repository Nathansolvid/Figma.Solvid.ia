/**
 * ESG API Service - Centralized API client for all ESG data operations
 * NO DEAD CLICKS - Every action persists to backend
 */

import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-aa780fc8`;

// Get auth token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('solvid_access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : `Bearer ${publicAnonKey}`,
  };
};

// ============================================================================
// DOUBLE MATERIALITE (DMA) APIs
// ============================================================================

export const dmaApi = {
  // Get all campaigns for a dossier
  getCampaigns: async (dossierId: string) => {
    const response = await fetch(`${API_BASE}/dossiers/${dossierId}/dma/campaigns`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to get campaigns');
    return response.json();
  },

  // Create new campaign
  createCampaign: async (dossierId: string, data: {
    name: string;
    description?: string;
    stakeholders?: any[];
    issues?: any[];
  }) => {
    const response = await fetch(`${API_BASE}/dossiers/${dossierId}/dma/campaigns`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create campaign');
    return response.json();
  },

  // Update campaign
  updateCampaign: async (campaignId: string, data: any) => {
    const response = await fetch(`${API_BASE}/dma/campaigns/${campaignId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update campaign');
    return response.json();
  },

  // Vote on an issue
  voteIssue: async (campaignId: string, issueId: string, vote: {
    financialImpact: number;
    operationalImpact: number;
    comment?: string;
  }) => {
    const response = await fetch(`${API_BASE}/dma/campaigns/${campaignId}/issues/${issueId}/vote`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(vote),
    });
    if (!response.ok) throw new Error('Failed to vote');
    return response.json();
  },

  // Get votes for an issue
  getVotes: async (campaignId: string, issueId: string) => {
    const response = await fetch(`${API_BASE}/dma/campaigns/${campaignId}/issues/${issueId}/votes`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to get votes');
    return response.json();
  },
};

// ============================================================================
// QUANTITATIVE DATA APIs
// ============================================================================

export const quantitativeApi = {
  // Get all quantitative data for a dossier
  getAll: async (dossierId: string) => {
    const response = await fetch(`${API_BASE}/dossiers/${dossierId}/data/quantitative`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to get quantitative data');
    return response.json();
  },

  // Create or update data point
  save: async (dossierId: string, data: any) => {
    const response = await fetch(`${API_BASE}/dossiers/${dossierId}/data/quantitative`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to save quantitative data');
    return response.json();
  },

  // Bulk import data points
  bulkImport: async (dossierId: string, dataPoints: any[]) => {
    const response = await fetch(`${API_BASE}/dossiers/${dossierId}/data/quantitative/bulk`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ dataPoints }),
    });
    if (!response.ok) throw new Error('Failed to bulk import data');
    return response.json();
  },

  // Delete data point
  delete: async (dataId: string) => {
    const response = await fetch(`${API_BASE}/data/quantitative/${dataId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete data');
    return response.json();
  },
};

// ============================================================================
// QUALITATIVE DATA APIs
// ============================================================================

export const qualitativeApi = {
  // Get all sections for a dossier
  getAll: async (dossierId: string) => {
    const response = await fetch(`${API_BASE}/dossiers/${dossierId}/data/qualitative`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to get qualitative data');
    return response.json();
  },

  // Create or update section
  save: async (dossierId: string, section: any) => {
    const response = await fetch(`${API_BASE}/dossiers/${dossierId}/data/qualitative`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(section),
    });
    if (!response.ok) throw new Error('Failed to save qualitative section');
    return response.json();
  },

  // Delete section
  delete: async (sectionId: string) => {
    const response = await fetch(`${API_BASE}/data/qualitative/${sectionId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete section');
    return response.json();
  },
};

// ============================================================================
// INDICATORS APIs
// ============================================================================

export const indicatorsApi = {
  // Get all indicators for a dossier
  getAll: async (dossierId: string) => {
    const response = await fetch(`${API_BASE}/dossiers/${dossierId}/indicators`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to get indicators');
    return response.json();
  },

  // Create indicator
  create: async (dossierId: string, indicator: any) => {
    const response = await fetch(`${API_BASE}/dossiers/${dossierId}/indicators`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(indicator),
    });
    if (!response.ok) throw new Error('Failed to create indicator');
    return response.json();
  },
};

// ============================================================================
// COLLABORATION APIs
// ============================================================================

export const collaborationApi = {
  // Get all tasks for a dossier
  getTasks: async (dossierId: string) => {
    const response = await fetch(`${API_BASE}/dossiers/${dossierId}/tasks`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to get tasks');
    return response.json();
  },

  // Create task
  createTask: async (dossierId: string, task: any) => {
    const response = await fetch(`${API_BASE}/dossiers/${dossierId}/tasks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(task),
    });
    if (!response.ok) throw new Error('Failed to create task');
    return response.json();
  },

  // Update task
  updateTask: async (taskId: string, updates: any) => {
    const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update task');
    return response.json();
  },

  // Get comments for a data point
  getComments: async (dossierId: string, dataPointCode: string) => {
    const response = await fetch(`${API_BASE}/dossiers/${dossierId}/datapoints/${dataPointCode}/comments`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to get comments');
    return response.json();
  },

  // Create comment
  createComment: async (dossierId: string, dataPointCode: string, content: string, status?: string) => {
    const response = await fetch(`${API_BASE}/dossiers/${dossierId}/datapoints/${dataPointCode}/comments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ content, status }),
    });
    if (!response.ok) throw new Error('Failed to create comment');
    return response.json();
  },
};

// ============================================================================
// FILES APIs
// ============================================================================

export const filesApi = {
  // Upload file
  upload: async (dossierId: string, file: File, category: string, dataPointCode?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (dataPointCode) {
      formData.append('dataPointCode', dataPointCode);
    }

    const token = localStorage.getItem('solvid_access_token');
    const response = await fetch(`${API_BASE}/dossiers/${dossierId}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : `Bearer ${publicAnonKey}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload file');
    }
    
    return response.json();
  },

  // Get download URL
  getDownloadUrl: async (fileId: string) => {
    const response = await fetch(`${API_BASE}/files/${fileId}/download`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to get download URL');
    return response.json();
  },

  // Get all files for a dossier
  getAll: async (dossierId: string, category?: string) => {
    const url = category 
      ? `${API_BASE}/dossiers/${dossierId}/files?category=${category}`
      : `${API_BASE}/dossiers/${dossierId}/files`;
    
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to get files');
    return response.json();
  },

  // Delete file
  delete: async (fileId: string) => {
    const response = await fetch(`${API_BASE}/files/${fileId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete file');
    return response.json();
  },
};

// ============================================================================
// EXPORTS APIs
// ============================================================================

export const exportsApi = {
  // Export quantitative data to Excel
  exportQuantitativeExcel: async (dossierId: string) => {
    const response = await fetch(`${API_BASE}/dossiers/${dossierId}/export/excel/quantitative`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to export quantitative data');
    return response.json();
  },

  // Export qualitative data to Word
  exportQualitativeWord: async (dossierId: string) => {
    const response = await fetch(`${API_BASE}/dossiers/${dossierId}/export/word/qualitative`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to export qualitative data');
    return response.json();
  },

  // Export GRI report
  exportGRI: async (dossierId: string) => {
    const response = await fetch(`${API_BASE}/dossiers/${dossierId}/export/gri`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.text();
      console.error('Export GRI failed:', error);
      throw new Error('Failed to export GRI report');
    }
    return response.json();
  },

  // Export Carbon report
  exportCarbon: async (dossierId: string) => {
    const response = await fetch(`${API_BASE}/dossiers/${dossierId}/export/carbon`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to export carbon report');
    return response.json();
  },

  // Generate audit package
  generateAuditPackage: async (dossierId: string) => {
    const response = await fetch(`${API_BASE}/dossiers/${dossierId}/export/audit-package`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to generate audit package');
    return response.json();
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Download JSON as file
export const downloadJSON = (data: any, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// Convert Excel JSON to CSV
export const excelToCSV = (excelData: any): string => {
  const lines: string[] = [];
  
  // Add headers
  lines.push(excelData.headers.join(','));
  
  // Add rows
  excelData.rows.forEach((row: any[]) => {
    lines.push(row.map(cell => {
      // Escape commas and quotes
      if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(','));
  });
  
  return lines.join('\n');
};

// Download CSV
export const downloadCSV = (csvContent: string, filename: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};