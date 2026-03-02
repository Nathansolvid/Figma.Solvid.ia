/**
 * SECURITY MIDDLEWARE - PHASE 9 HARDENING
 * 
 * Middlewares de sécurité pour l'application Solvid.IA
 * - Rate limiting
 * - Input validation
 * - Security headers
 * - Error sanitization
 */

import { Context, Next } from 'npm:hono@4';

// ============================================================================
// RATE LIMITING
// ============================================================================

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(config: RateLimitConfig) {
  return async (c: Context, next: Next) => {
    const key = c.req.header('X-User-Id') || c.req.header('X-Forwarded-For') || 'anonymous';
    const now = Date.now();
    
    // Nettoyer les anciennes entrées (toutes les 5 minutes)
    if (Math.random() < 0.01) {
      for (const [k, v] of rateLimitStore.entries()) {
        if (v.resetTime < now) {
          rateLimitStore.delete(k);
        }
      }
    }
    
    let limitData = rateLimitStore.get(key);
    
    if (!limitData || limitData.resetTime < now) {
      limitData = {
        count: 0,
        resetTime: now + config.windowMs
      };
      rateLimitStore.set(key, limitData);
    }
    
    limitData.count++;
    
    if (limitData.count > config.maxRequests) {
      return c.json({
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Trop de requêtes. Limite: ${config.maxRequests} par ${config.windowMs / 1000}s`,
        retryAfter: Math.ceil((limitData.resetTime - now) / 1000)
      }, 429);
    }
    
    // Ajouter headers rate limit
    c.header('X-RateLimit-Limit', String(config.maxRequests));
    c.header('X-RateLimit-Remaining', String(config.maxRequests - limitData.count));
    c.header('X-RateLimit-Reset', String(Math.ceil(limitData.resetTime / 1000)));
    
    await next();
  };
}

// Configurations par défaut
export const rateLimitConfigs = {
  // API publique : 100 req/min
  public: { windowMs: 60 * 1000, maxRequests: 100 },
  
  // API authentifiée : 300 req/min
  authenticated: { windowMs: 60 * 1000, maxRequests: 300 },
  
  // Mutations : 50 req/min
  mutations: { windowMs: 60 * 1000, maxRequests: 50 },
  
  // Auth/login : 10 req/min (protection bruteforce)
  auth: { windowMs: 60 * 1000, maxRequests: 10 }
};

// ============================================================================
// SECURITY HEADERS
// ============================================================================

export function securityHeaders() {
  return async (c: Context, next: Next) => {
    await next();
    
    // CORS déjà géré ailleurs, on ajoute les autres headers
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('X-XSS-Protection', '1; mode=block');
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // CSP (Content Security Policy) - à adapter selon vos besoins
    c.header(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
    );
  };
}

// ============================================================================
// INPUT VALIDATION
// ============================================================================

export function validateInput(schema: Record<string, any>) {
  return async (c: Context, next: Next) => {
    const body = await c.req.json().catch(() => ({}));
    
    const errors: string[] = [];
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = body[field];
      
      // Required
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`Le champ '${field}' est obligatoire`);
        continue;
      }
      
      // Skip validation if not required and not provided
      if (!rules.required && !value) continue;
      
      // Type validation
      if (rules.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== rules.type) {
          errors.push(`Le champ '${field}' doit être de type ${rules.type}`);
        }
      }
      
      // String validations
      if (rules.type === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`Le champ '${field}' doit contenir au moins ${rules.minLength} caractères`);
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`Le champ '${field}' doit contenir au maximum ${rules.maxLength} caractères`);
        }
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`Le champ '${field}' a un format invalide`);
        }
        if (rules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push(`Le champ '${field}' doit être un email valide`);
        }
      }
      
      // Number validations
      if (rules.type === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push(`Le champ '${field}' doit être >= ${rules.min}`);
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push(`Le champ '${field}' doit être <= ${rules.max}`);
        }
      }
      
      // Enum validation
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`Le champ '${field}' doit être l'une des valeurs: ${rules.enum.join(', ')}`);
      }
    }
    
    if (errors.length > 0) {
      return c.json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        message: 'Les données envoyées sont invalides',
        details: errors
      }, 400);
    }
    
    await next();
  };
}

// Schemas de validation communs
export const validationSchemas = {
  createPack: {
    name: { type: 'string', required: true, minLength: 3, maxLength: 200 },
    type: { type: 'string', required: true, enum: ['donneur-ordre', 'questionnaire', 'banque', 'pre-audit'] },
    description: { type: 'string', required: false, maxLength: 1000 },
    userId: { type: 'string', required: true },
    organizationId: { type: 'string', required: true }
  },
  
  createEvidence: {
    indicatorId: { type: 'string', required: true },
    fileName: { type: 'string', required: true, maxLength: 255 },
    fileType: { type: 'string', required: true },
    fileSize: { type: 'number', required: true, min: 0, max: 100 * 1024 * 1024 }, // 100 MB max
    description: { type: 'string', required: false, maxLength: 1000 }
  },
  
  updateIndicator: {
    status: { 
      type: 'string', 
      required: false, 
      enum: ['missing', 'in-progress', 'provided', 'needs-review', 'accepted', 'rejected'] 
    },
    currentValue: { type: 'number', required: false },
    comment: { type: 'string', required: false, maxLength: 2000 }
  },
  
  requestChanges: {
    message: { type: 'string', required: true, minLength: 10, maxLength: 2000 },
    assignToUserId: { type: 'string', required: true },
    priority: { type: 'string', required: false, enum: ['low', 'medium', 'high'] }
  }
};

// ============================================================================
// ERROR SANITIZATION
// ============================================================================

export function sanitizeError(error: any): { message: string; code?: string; status: number } {
  // Ne jamais exposer les détails internes en production
  const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development';
  
  // Erreurs connues
  if (error.code === 'EVIDENCE_REQUIRED') {
    return {
      message: error.message || 'Evidence requise',
      code: error.code,
      status: 400
    };
  }
  
  if (error.code === 'VALIDATION_ERROR') {
    return {
      message: error.message || 'Validation échouée',
      code: error.code,
      status: 400
    };
  }
  
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    return {
      message: 'Trop de requêtes, veuillez réessayer plus tard',
      code: 'RATE_LIMIT_EXCEEDED',
      status: 429
    };
  }
  
  // Erreurs génériques
  if (isDevelopment) {
    return {
      message: error.message || 'Erreur serveur',
      code: error.code || 'INTERNAL_ERROR',
      status: error.status || 500
    };
  }
  
  // En production, ne pas exposer les détails
  return {
    message: 'Une erreur est survenue. Veuillez réessayer.',
    code: 'INTERNAL_ERROR',
    status: 500
  };
}

// ============================================================================
// SQL INJECTION PREVENTION (pour queries KV Store)
// ============================================================================

export function sanitizeKey(key: string): string {
  // Empêcher traversal et injection
  return key
    .replace(/\.\./g, '')  // Pas de ../
    .replace(/[^a-zA-Z0-9:_-]/g, '_');  // Caractères autorisés seulement
}

export function sanitizePrefix(prefix: string): string {
  return sanitizeKey(prefix);
}

// ============================================================================
// REQUEST LOGGING (pour audit/debugging)
// ============================================================================

export function requestLogger() {
  return async (c: Context, next: Next) => {
    const start = Date.now();
    const method = c.req.method;
    const path = c.req.path;
    const userId = c.get('userId') || c.req.header('X-User-Id') || 'anonymous';
    
    console.log(`➡️  ${method} ${path} | User: ${userId}`);
    
    await next();
    
    const duration = Date.now() - start;
    const status = c.res.status;
    
    const emoji = status < 300 ? '✅' : status < 400 ? '↩️' : status < 500 ? '⚠️' : '❌';
    
    console.log(`${emoji} ${method} ${path} | ${status} | ${duration}ms`);
  };
}

// ============================================================================
// CORS VALIDATION STRICTE
// ============================================================================

export function strictCORS(allowedOrigins: string[]) {
  return async (c: Context, next: Next) => {
    const origin = c.req.header('Origin');
    
    if (origin && !allowedOrigins.includes(origin)) {
      console.warn(`⚠️ CORS violation: Origin ${origin} not allowed`);
      return c.json({
        error: 'CORS policy violation',
        message: 'Origin not allowed'
      }, 403);
    }
    
    await next();
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  rateLimit,
  rateLimitConfigs,
  securityHeaders,
  validateInput,
  validationSchemas,
  sanitizeError,
  sanitizeKey,
  sanitizePrefix,
  requestLogger,
  strictCORS
};
