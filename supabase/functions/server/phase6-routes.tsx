// ============================================================================
// PHASE 6: TRANSPARENCY & AUDIT TRAIL ROUTES
// ============================================================================
// Routes pour la transparence des calculs et l'audit trail complet
// Total: 19 routes (12 transparency + 7 audit trail)

import { Context } from "npm:hono";
import * as kv from "./kv_store.tsx";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Get userId from context or use default
function getUserId(c: Context): string {
  const userId = c.get('userId');
  if (!userId) {
    console.log('⚠️ No userId in context, using default: demo-user');
    return 'demo-user';
  }
  return userId;
}

// Helper function to get user from KV
async function getUserFromKV(userId: string) {
  const userData = await kv.get(`user:${userId}`);
  if (!userData) {
    // Return a default user if not found in KV
    console.warn(`⚠️ User ${userId} not found in KV store, using default organization`);
    return {
      id: userId,
      organizationId: 'default-org',
      email: 'demo@solvid.ia',
      name: 'Demo User',
    };
  }
  return JSON.parse(userData);
}

// Get organization ID from user
async function getOrgId(c: Context): Promise<string> {
  try {
    const userId = getUserId(c);
    const user = await getUserFromKV(userId);
    return user.organizationId;
  } catch (error) {
    console.warn('⚠️ Could not get org ID, using default-org');
    return 'default-org';
  }
}

// ============================================================================
// TRANSPARENCY ROUTES (12 routes)
// ============================================================================

// GET /indicators/:id/calculation-profile
export async function getCalculationProfile(c: Context) {
  try {
    const indicatorId = c.req.param('id');
    const userId = c.get('userId');
    
    console.log(`📊 GET calculation profile for indicator: ${indicatorId}`);
    
    // Get profile from KV store
    const profileData = await kv.get(`calculation-profile:${indicatorId}`);
    
    if (!profileData) {
      // Create default profile if doesn't exist
      const defaultProfile = {
        id: `prof-${Date.now()}`,
        indicatorId,
        formula: 'N/A',
        methodology: 'Non renseignée',
        status: 'draft',
        createdAt: new Date().toISOString(),
      };
      
      await kv.set(`calculation-profile:${indicatorId}`, JSON.stringify(defaultProfile));
      
      return c.json({ profile: defaultProfile });
    }
    
    const profile = JSON.parse(profileData);
    return c.json({ profile });
    
  } catch (error) {
    console.error('Get calculation profile error:', error);
    return c.json({ error: `Failed to get calculation profile: ${error.message}` }, 500);
  }
}

// PUT /calculation-profiles/:id
export async function updateCalculationProfile(c: Context) {
  try {
    const profileId = c.req.param('id');
    const updates = await c.req.json();
    const userId = c.get('userId');
    
    console.log(`📝 UPDATE calculation profile: ${profileId}`, updates);
    
    // Get existing profile
    const indicatorId = updates.indicatorId;
    const existingData = await kv.get(`calculation-profile:${indicatorId}`);
    
    if (!existingData) {
      return c.json({ error: 'Profile not found' }, 404);
    }
    
    const existing = JSON.parse(existingData);
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`calculation-profile:${indicatorId}`, JSON.stringify(updated));
    
    return c.json({ profile: updated });
    
  } catch (error) {
    console.error('Update calculation profile error:', error);
    return c.json({ error: `Failed to update calculation profile: ${error.message}` }, 500);
  }
}

// GET /calculation-profiles/:id/inputs
export async function getCalculationInputs(c: Context) {
  try {
    const profileId = c.req.param('id');
    
    console.log(`📊 GET calculation inputs for profile: ${profileId}`);
    
    // Get all inputs for this profile
    const inputKeys = await kv.getByPrefix(`calculation-input:${profileId}:`);
    const inputs = await Promise.all(
      inputKeys.map(async (key) => {
        const data = await kv.get(key);
        return data ? JSON.parse(data) : null;
      })
    );
    
    return c.json({ inputs: inputs.filter(Boolean) });
    
  } catch (error) {
    console.error('Get calculation inputs error:', error);
    return c.json({ error: `Failed to get calculation inputs: ${error.message}` }, 500);
  }
}

// POST /calculation-inputs
export async function addCalculationInput(c: Context) {
  try {
    const body = await c.req.json();
    const userId = c.get('userId');
    
    const inputId = `inp-${Date.now()}`;
    const input = {
      id: inputId,
      ...body,
      createdAt: new Date().toISOString(),
      createdBy: userId,
    };
    
    console.log(`➕ ADD calculation input:`, input);
    
    await kv.set(`calculation-input:${body.profileId}:${inputId}`, JSON.stringify(input));
    
    return c.json({ input }, 201);
    
  } catch (error) {
    console.error('Add calculation input error:', error);
    return c.json({ error: `Failed to add calculation input: ${error.message}` }, 500);
  }
}

// PUT /calculation-inputs/:id
export async function updateCalculationInput(c: Context) {
  try {
    const inputId = c.req.param('id');
    const updates = await c.req.json();
    const userId = c.get('userId');
    
    console.log(`📝 UPDATE calculation input: ${inputId}`, updates);
    
    // Find the input (we need to search by prefix since we don't know profileId)
    const allInputKeys = await kv.getByPrefix(`calculation-input:`);
    let found = false;
    
    for (const key of allInputKeys) {
      if (key.endsWith(`:${inputId}`)) {
        const existingData = await kv.get(key);
        const existing = JSON.parse(existingData);
        
        const updated = {
          ...existing,
          ...updates,
          updatedAt: new Date().toISOString(),
          updatedBy: userId,
        };
        
        await kv.set(key, JSON.stringify(updated));
        found = true;
        
        return c.json({ input: updated });
      }
    }
    
    if (!found) {
      return c.json({ error: 'Input not found' }, 404);
    }
    
  } catch (error) {
    console.error('Update calculation input error:', error);
    return c.json({ error: `Failed to update calculation input: ${error.message}` }, 500);
  }
}

// DELETE /calculation-inputs/:id
export async function deleteCalculationInput(c: Context) {
  try {
    const inputId = c.req.param('id');
    
    console.log(`🗑️ DELETE calculation input: ${inputId}`);
    
    // Find and delete the input
    const allInputKeys = await kv.getByPrefix(`calculation-input:`);
    
    for (const key of allInputKeys) {
      if (key.endsWith(`:${inputId}`)) {
        await kv.del(key);
        return c.json({ message: 'Input deleted successfully' });
      }
    }
    
    return c.json({ error: 'Input not found' }, 404);
    
  } catch (error) {
    console.error('Delete calculation input error:', error);
    return c.json({ error: `Failed to delete calculation input: ${error.message}` }, 500);
  }
}

// GET /calculation-profiles/:id/factors
export async function getCalculationFactors(c: Context) {
  try {
    const profileId = c.req.param('id');
    
    console.log(`📊 GET calculation factors for profile: ${profileId}`);
    
    // Mock factors (en production, viendraient d'une base de référence)
    const factors = [
      {
        id: 'fac-001',
        name: 'Facteur émission gaz naturel',
        value: 0.227,
        unit: 'kgCO2e/kWh',
        source: 'Base Carbone ADEME 2024',
        standard: 'ISO 14064',
      },
      {
        id: 'fac-002',
        name: 'Facteur émission électricité France',
        value: 0.053,
        unit: 'kgCO2e/kWh',
        source: 'RTE 2024',
        standard: 'GHG Protocol',
      },
    ];
    
    return c.json({ factors });
    
  } catch (error) {
    console.error('Get calculation factors error:', error);
    return c.json({ error: `Failed to get calculation factors: ${error.message}` }, 500);
  }
}

// GET /calculation-profiles/:id/logs
export async function getCalculationLogs(c: Context) {
  try {
    const profileId = c.req.param('id');
    
    console.log(`📊 GET calculation logs for profile: ${profileId}`);
    
    // Get logs from KV store
    const logKeys = await kv.getByPrefix(`calculation-log:${profileId}:`);
    const logs = await Promise.all(
      logKeys.map(async (key) => {
        const data = await kv.get(key);
        return data ? JSON.parse(data) : null;
      })
    );
    
    // Sort by timestamp
    const sortedLogs = logs
      .filter(Boolean)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    return c.json({ logs: sortedLogs });
    
  } catch (error) {
    console.error('Get calculation logs error:', error);
    return c.json({ error: `Failed to get calculation logs: ${error.message}` }, 500);
  }
}

// GET /indicators/:id/calculation-summary
export async function getCalculationSummary(c: Context) {
  try {
    const indicatorId = c.req.param('id');
    
    console.log(`📊 GET calculation summary for indicator: ${indicatorId}`);
    
    // Get profile
    const profileData = await kv.get(`calculation-profile:${indicatorId}`);
    if (!profileData) {
      return c.json({
        summary: {
          totalInputs: 0,
          totalFactors: 0,
          totalSteps: 0,
          lastCalculated: null,
          result: 0,
          unit: '',
          confidence: 'low',
        },
      });
    }
    
    const profile = JSON.parse(profileData);
    
    // Count inputs
    const inputKeys = await kv.getByPrefix(`calculation-input:${profile.id}:`);
    
    // Mock summary
    const summary = {
      totalInputs: inputKeys.length,
      totalFactors: 2,
      totalSteps: 5,
      lastCalculated: new Date().toISOString(),
      result: 2837.5,
      unit: 'kgCO2e',
      confidence: inputKeys.length >= 3 ? 'high' : 'medium',
    };
    
    return c.json({ summary });
    
  } catch (error) {
    console.error('Get calculation summary error:', error);
    return c.json({ error: `Failed to get calculation summary: ${error.message}` }, 500);
  }
}

// GET /indicators/:id/calculation-warnings
export async function getCalculationWarnings(c: Context) {
  try {
    const indicatorId = c.req.param('id');
    
    console.log(`⚠️ GET calculation warnings for indicator: ${indicatorId}`);
    
    // Mock warnings (en production, analysées dynamiquement)
    const warnings = [
      {
        id: 'warn-001',
        type: 'outdated_factor',
        message: 'Le facteur d\'émission date de plus de 12 mois',
        severity: 'medium',
        field: 'factor1',
      },
    ];
    
    return c.json({ warnings });
    
  } catch (error) {
    console.error('Get calculation warnings error:', error);
    return c.json({ error: `Failed to get calculation warnings: ${error.message}` }, 500);
  }
}

// POST /calculation-profiles/:id/validate
export async function validateCalculation(c: Context) {
  try {
    const profileId = c.req.param('id');
    const { comment } = await c.req.json();
    const userId = c.get('userId');
    
    console.log(`✅ VALIDATE calculation profile: ${profileId}`);
    
    // Find profile by searching all indicators
    const profileKeys = await kv.getByPrefix(`calculation-profile:`);
    
    for (const key of profileKeys) {
      const data = await kv.get(key);
      const profile = JSON.parse(data);
      
      if (profile.id === profileId) {
        const updated = {
          ...profile,
          status: 'validated',
          validatedAt: new Date().toISOString(),
          validatedBy: userId,
          validationComment: comment,
        };
        
        await kv.set(key, JSON.stringify(updated));
        
        return c.json({ profile: updated });
      }
    }
    
    return c.json({ error: 'Profile not found' }, 404);
    
  } catch (error) {
    console.error('Validate calculation error:', error);
    return c.json({ error: `Failed to validate calculation: ${error.message}` }, 500);
  }
}

// GET /indicators/:id/export-transparency
export async function exportTransparency(c: Context) {
  try {
    const indicatorId = c.req.param('id');
    const format = c.req.query('format') || 'pdf';
    
    console.log(`📄 EXPORT transparency for indicator: ${indicatorId} as ${format}`);
    
    // Mock export URL (en production, génèrerait un vrai PDF/JSON/Excel)
    const downloadUrl = `https://storage.example.com/exports/transparency-${indicatorId}-${Date.now()}.${format}`;
    
    return c.json({ downloadUrl });
    
  } catch (error) {
    console.error('Export transparency error:', error);
    return c.json({ error: `Failed to export transparency: ${error.message}` }, 500);
  }
}

// ============================================================================
// AUDIT TRAIL ROUTES (7 routes)
// ============================================================================

// GET /audit-trail (with filters)
export async function getAuditTrailFiltered(c: Context) {
  try {
    const userId = c.get('userId');
    const user = await getUserFromKV(userId);
    const orgId = user.organizationId;
    
    // Parse query params
    const action = c.req.query('action');
    const entityType = c.req.query('entityType');
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');
    const search = c.req.query('search');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    
    console.log(`🔍 GET filtered audit trail for org: ${orgId}`, {
      action,
      entityType,
      startDate,
      endDate,
      search,
      limit,
      offset,
    });
    
    // Get all audit entries for org
    const auditKeys = await kv.getByPrefix(`org:${orgId}:audit:`);
    let auditEntries = await Promise.all(
      auditKeys.map(async (key) => {
        const auditId = key.split(':').pop();
        const auditData = await kv.get(`audit:${auditId}`);
        return auditData ? JSON.parse(auditData) : null;
      })
    );
    
    // Filter
    auditEntries = auditEntries.filter(Boolean);
    
    if (action) {
      auditEntries = auditEntries.filter(e => e.action === action);
    }
    
    if (entityType) {
      auditEntries = auditEntries.filter(e => e.entityType === entityType);
    }
    
    if (startDate) {
      auditEntries = auditEntries.filter(e => 
        new Date(e.timestamp) >= new Date(startDate)
      );
    }
    
    if (endDate) {
      auditEntries = auditEntries.filter(e => 
        new Date(e.timestamp) <= new Date(endDate)
      );
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      auditEntries = auditEntries.filter(e =>
        e.user?.toLowerCase().includes(searchLower) ||
        e.entityName?.toLowerCase().includes(searchLower) ||
        e.comment?.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by timestamp descending
    auditEntries.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // Paginate
    const total = auditEntries.length;
    const paginatedEntries = auditEntries.slice(offset, offset + limit);
    
    return c.json({ 
      entries: paginatedEntries,
      total,
      hasMore: offset + limit < total,
    });
    
  } catch (error) {
    console.error('Get filtered audit trail error:', error);
    return c.json({ error: `Failed to get audit trail: ${error.message}` }, 500);
  }
}

// GET /indicators/:id/audit-trail
export async function getIndicatorAuditTrail(c: Context) {
  try {
    const indicatorId = c.req.param('id');
    const userId = c.get('userId');
    const user = await getUserFromKV(userId);
    const orgId = user.organizationId;
    
    console.log(`📊 GET audit trail for indicator: ${indicatorId}`);
    
    // Get all audit entries and filter by indicator
    const auditKeys = await kv.getByPrefix(`org:${orgId}:audit:`);
    const auditEntries = await Promise.all(
      auditKeys.map(async (key) => {
        const auditId = key.split(':').pop();
        const auditData = await kv.get(`audit:${auditId}`);
        return auditData ? JSON.parse(auditData) : null;
      })
    );
    
    const filteredEntries = auditEntries
      .filter(Boolean)
      .filter(e => e.entityId === indicatorId && e.entityType === 'indicator')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return c.json({ entries: filteredEntries });
    
  } catch (error) {
    console.error('Get indicator audit trail error:', error);
    return c.json({ error: `Failed to get indicator audit trail: ${error.message}` }, 500);
  }
}

// GET /packs/:id/audit-trail
export async function getPackAuditTrail(c: Context) {
  try {
    const packId = c.req.param('id');
    const userId = c.get('userId');
    const user = await getUserFromKV(userId);
    const orgId = user.organizationId;
    
    console.log(`📦 GET audit trail for pack: ${packId}`);
    
    // Get all audit entries and filter by pack
    const auditKeys = await kv.getByPrefix(`org:${orgId}:audit:`);
    const auditEntries = await Promise.all(
      auditKeys.map(async (key) => {
        const auditId = key.split(':').pop();
        const auditData = await kv.get(`audit:${auditId}`);
        return auditData ? JSON.parse(auditData) : null;
      })
    );
    
    const filteredEntries = auditEntries
      .filter(Boolean)
      .filter(e => e.entityId === packId && e.entityType === 'pack')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return c.json({ entries: filteredEntries });
    
  } catch (error) {
    console.error('Get pack audit trail error:', error);
    return c.json({ error: `Failed to get pack audit trail: ${error.message}` }, 500);
  }
}

// GET /packs/:id/audit-trail-direct (NO JWT - For Figma Make compatibility)
export async function getPackAuditTrailDirect(c: Context) {
  try {
    const packId = c.req.param('id');
    
    console.log(`📦🔓 GET audit trail for pack (DIRECT - NO JWT): ${packId}`);
    
    // Get pack to find organizationId
    const packData = await kv.get(`pack:${packId}`);
    if (!packData) {
      console.warn(`⚠️ Pack not found: ${packId}`);
      return c.json({ entries: [] }); // Return empty instead of error
    }
    
    const pack = JSON.parse(packData);
    const orgId = pack.organizationId;
    
    console.log(`✅ Pack found, orgId: ${orgId}`);
    
    // Get all audit entries for this organization
    const auditKeys = await kv.getByPrefix(`org:${orgId}:audit:`);
    console.log(`📋 Found ${auditKeys.length} total audit keys for organization`);
    
    const auditEntries = await Promise.all(
      auditKeys.map(async (key) => {
        const auditId = key.split(':').pop();
        const auditData = await kv.get(`audit:${auditId}`);
        return auditData ? JSON.parse(auditData) : null;
      })
    );
    
    console.log(`📋 Loaded ${auditEntries.filter(Boolean).length} audit entries`);
    
    // Filter entries related to this pack (pack itself + its folders/indicators)
    const filteredEntries = auditEntries
      .filter(Boolean)
      .filter(e => {
        // Include if it's directly about the pack
        if (e.entityId === packId && e.entityType === 'pack') return true;
        
        // Include if it's about pack creation mentioning this pack
        if (e.action === 'pack_created_direct' && e.entityId === packId) return true;
        
        // Include if details mention this pack
        if (e.details?.packId === packId) return true;
        
        return false;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    console.log(`✅ Filtered to ${filteredEntries.length} entries for pack ${packId}`);
    console.log(`📊 Entry details:`, filteredEntries.map(e => ({
      id: e.id,
      action: e.action,
      entityType: e.entityType,
      timestamp: e.timestamp
    })));
    
    // Enrich entries with user information
    const enrichedEntries = await Promise.all(
      filteredEntries.map(async (entry) => {
        let userName = 'Utilisateur inconnu';
        let userRole = 'client';
        
        if (entry.userId) {
          try {
            const userData = await kv.get(`user:${entry.userId}`);
            if (userData) {
              const user = JSON.parse(userData);
              userName = user.name || user.email || 'Utilisateur inconnu';
              
              // Map role to expected format
              if (user.role === 'Auditeur externe') {
                userRole = 'auditeur';
              } else if (user.role === 'Consultant ESG') {
                userRole = 'consultant';
              } else {
                userRole = 'client';
              }
            }
          } catch (error) {
            console.warn(`⚠️ Could not load user ${entry.userId}:`, error);
          }
        }
        
        return {
          ...entry,
          user: userName,
          role: userRole,
          entityName: entry.details?.packName || pack.name,
        };
      })
    );
    
    console.log(`✅ Enriched ${enrichedEntries.length} entries with user info`);
    
    return c.json({ entries: enrichedEntries });
    
  } catch (error) {
    console.error('Get pack audit trail (direct) error:', error);
    return c.json({ error: `Failed to get pack audit trail: ${error.message}` }, 500);
  }
}

// POST /audit-trail
export async function createAuditEntry(c: Context) {
  try {
    const body = await c.req.json();
    const userId = c.get('userId');
    const user = await getUserFromKV(userId);
    const orgId = user.organizationId;
    
    const auditId = `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const entry = {
      id: auditId,
      timestamp: new Date().toISOString(),
      ...body,
    };
    
    console.log(`➕ CREATE audit entry:`, entry);
    
    // Store audit entry
    await kv.set(`audit:${auditId}`, JSON.stringify(entry));
    await kv.set(`org:${orgId}:audit:${auditId}`, auditId);
    
    return c.json({ entry }, 201);
    
  } catch (error) {
    console.error('Create audit entry error:', error);
    return c.json({ error: `Failed to create audit entry: ${error.message}` }, 500);
  }
}

// GET /audit-trail/export
export async function exportAuditTrail(c: Context) {
  try {
    const format = c.req.query('format') || 'pdf';
    const userId = c.get('userId');
    
    console.log(`📄 EXPORT audit trail as ${format}`);
    
    // Mock export URL
    const downloadUrl = `https://storage.example.com/exports/audit-trail-${Date.now()}.${format}`;
    
    return c.json({ downloadUrl });
    
  } catch (error) {
    console.error('Export audit trail error:', error);
    return c.json({ error: `Failed to export audit trail: ${error.message}` }, 500);
  }
}

// GET /audit-trail/organization
export async function getOrganizationAuditTrail(c: Context) {
  try {
    // Get userId from header (no JWT auth for Figma Make compatibility)
    const userId = c.req.header('X-User-Id') || c.get('userId');
    
    if (!userId) {
      console.error('❌ Missing userId in request');
      return c.json({ error: 'User ID required (X-User-Id header)' }, 400);
    }
    
    const user = await getUserFromKV(userId);
    
    if (!user) {
      console.error('❌ User not found:', userId);
      return c.json({ error: 'User not found' }, 404);
    }
    
    const orgId = user.organizationId;
    
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    const action = c.req.query('action');
    const entityType = c.req.query('entityType');
    
    console.log(`🏢 GET organization audit trail for org: ${orgId}`, {
      userId,
      limit,
      offset,
      action,
      entityType
    });
    
    // Get all audit entries for organization
    const auditKeys = await kv.getByPrefix(`org:${orgId}:audit:`);
    let auditEntries = await Promise.all(
      auditKeys.map(async (key) => {
        const auditId = key.split(':').pop();
        const auditData = await kv.get(`audit:${auditId}`);
        return auditData ? JSON.parse(auditData) : null;
      })
    );
    
    auditEntries = auditEntries.filter(Boolean);
    
    console.log(`📊 Found ${auditEntries.length} total audit entries for org ${orgId}`);
    
    // Filter by action if provided
    if (action) {
      auditEntries = auditEntries.filter(e => e.action === action);
    }
    
    // Filter by entity type if provided
    if (entityType) {
      auditEntries = auditEntries.filter(e => e.entityType === entityType);
    }
    
    // Sort by timestamp (newest first)
    auditEntries.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // Pagination
    const total = auditEntries.length;
    const paginatedEntries = auditEntries.slice(offset, offset + limit);
    const hasMore = offset + limit < total;
    
    console.log(`✅ Returning ${paginatedEntries.length} audit entries (total: ${total}, hasMore: ${hasMore})`);
    
    return c.json({ 
      entries: paginatedEntries, 
      total,
      hasMore
    });
    
  } catch (error) {
    console.error('Get organization audit trail error:', error);
    return c.json({ error: `Failed to get organization audit trail: ${error.message}` }, 500);
  }
}

// GET /audit-trail/statistics
export async function getAuditStatistics(c: Context) {
  try {
    // Get userId from header (no JWT auth for Figma Make compatibility)
    const userId = c.req.header('X-User-Id') || c.get('userId');
    
    if (!userId) {
      console.error('❌ Missing userId in request for statistics');
      return c.json({ error: 'User ID required (X-User-Id header)' }, 400);
    }
    
    const user = await getUserFromKV(userId);
    
    if (!user) {
      console.error('❌ User not found for statistics:', userId);
      return c.json({ error: 'User not found' }, 404);
    }
    
    const orgId = user.organizationId;
    
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');
    
    console.log(`📊 GET audit statistics for org: ${orgId}`, {
      userId,
      startDate,
      endDate
    });
    
    // Get all audit entries
    const auditKeys = await kv.getByPrefix(`org:${orgId}:audit:`);
    let auditEntries = await Promise.all(
      auditKeys.map(async (key) => {
        const auditId = key.split(':').pop();
        const auditData = await kv.get(`audit:${auditId}`);
        return auditData ? JSON.parse(auditData) : null;
      })
    );
    
    auditEntries = auditEntries.filter(Boolean);
    
    // Filter by date range
    if (startDate) {
      auditEntries = auditEntries.filter(e => 
        new Date(e.timestamp) >= new Date(startDate)
      );
    }
    
    if (endDate) {
      auditEntries = auditEntries.filter(e => 
        new Date(e.timestamp) <= new Date(endDate)
      );
    }
    
    // Calculate statistics
    const entriesByAction: any = {};
    const entriesByEntityType: any = {};
    const entriesByUser: any = {};
    const entitiesCounts: any = {};
    
    auditEntries.forEach(entry => {
      // By action
      entriesByAction[entry.action] = (entriesByAction[entry.action] || 0) + 1;
      
      // By entity type
      entriesByEntityType[entry.entityType] = (entriesByEntityType[entry.entityType] || 0) + 1;
      
      // By user
      if (!entriesByUser[entry.userId]) {
        entriesByUser[entry.userId] = {
          userId: entry.userId,
          userName: entry.user,
          count: 0,
        };
      }
      entriesByUser[entry.userId].count++;
      
      // Most active entities
      const entityKey = `${entry.entityType}:${entry.entityId}`;
      if (!entitiesCounts[entityKey]) {
        entitiesCounts[entityKey] = {
          entityId: entry.entityId,
          entityName: entry.entityName || entry.entityId,
          entityType: entry.entityType,
          count: 0,
        };
      }
      entitiesCounts[entityKey].count++;
    });
    
    // Top 5 users
    const topUsers = Object.values(entriesByUser)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5);
    
    // Top 5 entities
    const topEntities = Object.values(entitiesCounts)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5);
    
    // Recent activity (last 7 days)
    const recentActivity: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = auditEntries.filter(e => 
        e.timestamp.startsWith(dateStr)
      ).length;
      
      recentActivity.push({ date: dateStr, count });
    }
    
    const statistics = {
      totalEntries: auditEntries.length,
      entriesByAction,
      entriesByEntityType,
      entriesByUser: topUsers,
      mostActiveEntities: topEntities,
      recentActivity,
    };
    
    return c.json({ statistics });
    
  } catch (error) {
    console.error('Get audit statistics error:', error);
    return c.json({ error: `Failed to get audit statistics: ${error.message}` }, 500);
  }
}