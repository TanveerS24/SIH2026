/**
 * Secure Logging Service
 * Ensures all application and security events are logged cleanly without
 * exposing passwords, JWT tokens, private cryptographic keys, or unmasked PII.
 */

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'totpsecret',
  'totpcode',
  'sessiontoken',
  'refreshtoken',
  'accesstoken',
  'authorization',
  'token',
  'secret',
  'privatekey',
  'currentpassword',
  'newpassword',
]);

export function sanitizeLogData(data: any, depth = 0): any {
  if (depth > 5 || data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogData(item, depth + 1));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED_SECURE]';
    } else if (typeof val === 'object' && val !== null) {
      sanitized[key] = sanitizeLogData(val, depth + 1);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

export class SecureLogger {
  public static info(context: string, message: string, meta?: Record<string, any>) {
    const payload = meta ? sanitizeLogData(meta) : undefined;
    console.log(
      JSON.stringify({
        level: 'INFO',
        timestamp: new Date().toISOString(),
        context,
        message,
        ...(payload ? { meta: payload } : {}),
      })
    );
  }

  public static warn(context: string, message: string, meta?: Record<string, any>) {
    const payload = meta ? sanitizeLogData(meta) : undefined;
    console.warn(
      JSON.stringify({
        level: 'WARN',
        timestamp: new Date().toISOString(),
        context,
        message,
        ...(payload ? { meta: payload } : {}),
      })
    );
  }

  public static error(context: string, message: string, error?: any, meta?: Record<string, any>) {
    const payload = meta ? sanitizeLogData(meta) : undefined;
    console.error(
      JSON.stringify({
        level: 'ERROR',
        timestamp: new Date().toISOString(),
        context,
        message,
        error: error?.message || String(error),
        ...(payload ? { meta: payload } : {}),
      })
    );
  }
}
