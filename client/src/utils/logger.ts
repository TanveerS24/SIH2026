/**
 * Client-side Secure Logger
 * Masks sensitive authorization tokens, session tokens, passwords, and private data
 * to ensure secure operational logging and prevent credential leakage in console.
 */

const REDACTED_KEYS = new Set([
  'password',
  'currentpassword',
  'newpassword',
  'accesstoken',
  'refreshtoken',
  'sessiontoken',
  'token',
  'totpcode',
  'secret',
  'authorization',
]);

function maskSensitive(obj: any, depth = 0): any {
  if (depth > 4 || obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => maskSensitive(item, depth + 1));
  }

  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (REDACTED_KEYS.has(k.toLowerCase())) {
      clean[k] = '[PROTECTED_CREDENTIAL]';
    } else if (typeof v === 'object' && v !== null) {
      clean[k] = maskSensitive(v, depth + 1);
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

export const logger = {
  info: (tag: string, message: string, data?: any) => {
    if (__DEV__) {
      console.log(`[${tag}] ${message}`, data ? maskSensitive(data) : '');
    }
  },
  warn: (tag: string, message: string, data?: any) => {
    console.warn(`[${tag}] ${message}`, data ? maskSensitive(data) : '');
  },
  error: (tag: string, message: string, err?: any) => {
    console.error(`[${tag}] ${message}`, err ? maskSensitive(err) : '');
  },
};
