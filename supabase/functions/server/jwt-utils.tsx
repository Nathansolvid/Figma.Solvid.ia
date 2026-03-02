// ============================================================================
// JWT UTILITIES - HARDCODED SECRET FOR CONSISTENCY
// ============================================================================
// Created: 2026-01-31 10:50:00 UTC
// This file contains JWT signing and verification logic with a hardcoded secret

// CRITICAL: This secret MUST be the same for signing and verifying
export const JWT_SECRET = 'solvid-dev-secret-key-change-in-production';

console.log('🔐 JWT Utils loaded - Secret length:', JWT_SECRET.length);

// Helper to encode base64url
function base64urlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Helper to decode base64url
function base64urlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Helper to create JWT
export async function generateToken(userId: string, email: string): Promise<string> {
  const encoder = new TextEncoder();
  
  console.log('🔐 generateToken - Using secret length:', JWT_SECRET.length);
  
  // Create header
  const header = {
    alg: "HS256",
    typ: "JWT"
  };
  const encodedHeader = base64urlEncode(encoder.encode(JSON.stringify(header)));
  
  // Create payload
  const payload = {
    sub: userId,
    email: email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
  };
  const encodedPayload = base64urlEncode(encoder.encode(JSON.stringify(payload)));
  
  // Create signature
  const data = `${encodedHeader}.${encodedPayload}`;
  const keyData = encoder.encode(JWT_SECRET);
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(data)
  );
  const encodedSignature = base64urlEncode(new Uint8Array(signatureBuffer));
  
  const token = `${data}.${encodedSignature}`;
  console.log('🔐 generateToken - Token generated, length:', token.length);
  
  return token;
}

// Helper to verify JWT
export async function verifyToken(token: string): Promise<{ sub: string; email: string; exp: number } | null> {
  try {
    console.log('🔐 verifyToken - Starting verification with secret length:', JWT_SECRET.length);
    console.log('🔐 verifyToken - Token length:', token.length);
    console.log('🔐 verifyToken - Token preview:', token.substring(0, 50));
    
    const encoder = new TextEncoder();
    const parts = token.split('.');
    
    console.log('🔐 verifyToken - Parts count:', parts.length);
    
    if (parts.length !== 3) {
      console.error('❌ verifyToken - Invalid JWT format, expected 3 parts, got', parts.length);
      return null;
    }
    
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    
    console.log('🔐 verifyToken - Header length:', encodedHeader.length);
    console.log('🔐 verifyToken - Payload length:', encodedPayload.length);
    console.log('🔐 verifyToken - Signature length:', encodedSignature.length);
    
    // Verify signature
    const data = `${encodedHeader}.${encodedPayload}`;
    const keyData = encoder.encode(JWT_SECRET);
    
    console.log('🔐 verifyToken - JWT_SECRET available:', !!JWT_SECRET);
    console.log('🔐 verifyToken - JWT_SECRET length:', JWT_SECRET.length);
    
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    
    console.log('🔐 verifyToken - Key imported successfully');
    
    const signature = base64urlDecode(encodedSignature);
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signature,
      encoder.encode(data)
    );
    
    console.log('🔐 verifyToken - Signature valid:', isValid);
    
    if (!isValid) {
      console.error('❌ verifyToken - Invalid signature');
      return null;
    }
    
    // Decode payload
    const payloadJson = new TextDecoder().decode(base64urlDecode(encodedPayload));
    console.log('🔐 verifyToken - Payload JSON:', payloadJson);
    
    const payload = JSON.parse(payloadJson);
    
    console.log('🔐 verifyToken - Parsed payload:', payload);
    
    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      console.error('❌ verifyToken - Token expired. Exp:', payload.exp, 'Now:', Date.now() / 1000);
      return null;
    }
    
    console.log('✅ verifyToken - Token valid!');
    
    return payload;
  } catch (error) {
    console.error('❌ verifyToken - Error:', error);
    console.error('❌ verifyToken - Error stack:', error.stack);
    return null;
  }
}
