/**
 * Input Security Scanner & Sanitizer
 * Detects common web attacks: XSS scripts, SQL Injection, Path Traversal, Command Injection.
 */

// Patterns indicating potential attacks
const SUSPICIOUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // XSS <script> tags
  /javascript:/gi,                                        // JS protocol URIs
  /onerror\s*=/gi,                                        // XSS event handlers
  /onload\s*=/gi,
  /onclick\s*=/gi,
  /\bUNION\s+SELECT\b/gi,                                // SQL Injection
  /\bSELECT\b.+\bFROM\b/gi,
  /\bINSERT\s+INTO\b/gi,
  /\bDROP\s+TABLE\b/gi,
  /;\s*--/g,
  /\.\.\/\.\./g,                                         // Path Traversal (../../)
  /\bexec\s*\(/gi,                                       // Command Injection
  /<\?php/gi,                                            // PHP Code Injection
];

export interface ScanResult {
  isSafe: boolean;
  matchedPattern?: string;
}

/**
 * Scans a string or object values for suspicious security threat patterns
 */
export function scanForThreats(input: unknown): ScanResult {
  if (typeof input === "string") {
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(input)) {
        return { isSafe: false, matchedPattern: pattern.source };
      }
    }
    return { isSafe: true };
  }

  if (typeof input === "object" && input !== null) {
    for (const key of Object.keys(input)) {
      const val = (input as Record<string, unknown>)[key];
      const result = scanForThreats(val);
      if (!result.isSafe) return result;
    }
  }

  return { isSafe: true };
}

/**
 * Escapes HTML characters to prevent XSS output rendering
 */
export function sanitizeHtmlString(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}
