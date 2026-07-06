/**
 * Smart Stadium Security & Defensive Programming Utilities
 * Dual-use library for server-side API validation and frontend interactive diagnostics
 */

// Strict length limits for input values
export const SECURITY_LIMITS = {
  maxMessageLength: 800,
  maxListNameLength: 50,
  maxSeatStringLength: 100,
};

// Common adversarial terms used in LLM Prompt Injection attacks
const PROMPT_INJECTION_BLACKLIST = [
  "ignore previous instructions",
  "disregard all instructions",
  "bypass safety guidelines",
  "system instructions",
  "you must now act as",
  "override all settings",
  "ignore system limits",
  "forget your role",
  "instead, tell me how to",
];

/**
 * Sanitizes user input to prevent XSS and strip prompt-injection attempts.
 * @param text The input string to sanitize
 */
export function sanitizeInput(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  // Strip HTML elements to prevent scripting injections (XSS)
  let clean = text.replace(/<[^>]*>/g, '');

  // Detect and flag/neutralize prompt injection keywords by wrapping them or stripping
  const lowerText = clean.toLowerCase();
  for (const term of PROMPT_INJECTION_BLACKLIST) {
    if (lowerText.includes(term)) {
      // Neutralize the injection block dynamically by appending safety blocks
      clean = clean.replace(new RegExp(term, 'gi'), `[Redacted Security Threat Keyword]`);
    }
  }

  // Enforce rigid maximum character length
  if (clean.length > SECURITY_LIMITS.maxMessageLength) {
    clean = clean.substring(0, SECURITY_LIMITS.maxMessageLength);
  }

  return clean;
}

/**
 * Validate generic operational parameters defensively.
 */
export function validateParams(params: Record<string, any>): { valid: boolean; error?: string } {
  for (const [key, val] of Object.entries(params)) {
    if (val === undefined || val === null) {
      return { valid: false, error: `Missing parameter: ${key}` };
    }

    if (typeof val === 'string') {
      if (val.trim() === '') {
        return { valid: false, error: `Parameter cannot be empty: ${key}` };
      }
      if (val.length > SECURITY_LIMITS.maxMessageLength) {
        return { valid: false, error: `Parameter is too long: ${key} (Max ${SECURITY_LIMITS.maxMessageLength} chars)` };
      }
    }

    if (Array.isArray(val)) {
      if (val.length > SECURITY_LIMITS.maxListNameLength) {
        return { valid: false, error: `List exceeds maximum allowed capacity: ${key}` };
      }
    }
  }
  return { valid: true };
}

/**
 * Resilient JSON parsing helper. Sanitizes Markdown boxes and corrects formatting flaws (e.g. trailing commas, garbage text).
 * If parsing is totally unrecoverable, returns a fallback structure conforming to the target schema to prevent server downtime.
 */
export function safeJSONParse<T>(rawText: string, fallbackStructure: T): T {
  if (!rawText || typeof rawText !== 'string') return fallbackStructure;

  let sanitized = rawText.trim();

  // 1. Strip Markdown Code Fences: ```json ... ```
  const jsonMatch = sanitized.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch && jsonMatch[1]) {
    sanitized = jsonMatch[1].trim();
  }

  // 2. Locate first '{' or '[' and last '}' or ']' to isolate JSON block from LLM chat chatter
  const firstBrace = sanitized.indexOf('{');
  const lastBrace = sanitized.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    sanitized = sanitized.substring(firstBrace, lastBrace + 1);
  }

  try {
    // Attempt standard parse first
    return JSON.parse(sanitized) as T;
  } catch (err) {
    console.warn('JSON parsing failed. Attempting structural recovery procedures...', err);

    try {
      // Heuristic Clean 1: Clean trailing commas before closing symbols
      let repaired = sanitized
        .replace(/,\s*([}\]])/g, '$1') // Removes trailing commas (e.g., [a, b, ] -> [a, b])
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":') // Wrap unquoted keys in double quotes
        .replace(/:\s*'(.*?)'/g, ':"$1"'); // Turn single-quoted string values into double-quoted values

      return JSON.parse(repaired) as T;
    } catch (secondErr) {
      console.error('JSON recovery procedure failed. Utilizing hardcoded fallback block.', secondErr);
      return fallbackStructure;
    }
  }
}
