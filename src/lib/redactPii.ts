/** Enterprise display helpers — PII minimization for operator consoles */

export function maskEmail(email: string): string {
  const t = email.trim();
  if (!t.includes('@')) return '***';
  const [local, domain] = t.split('@');
  if (!domain) return '***';
  const a = local.slice(0, 1) || '*';
  return `${a}***@${domain}`;
}

function maskScalar(value: unknown): unknown {
  if (typeof value === 'string') {
    if (value.includes('@') && value.length > 4) return maskEmail(value);
    if (value.length > 24) return `${value.slice(0, 6)}…[REDACTED]`;
    if (value.length > 3) return `${value.slice(0, 1)}${'*'.repeat(Math.min(value.length - 1, 8))}`;
  }
  return value;
}

/** Recursively redact string leaves for audit-safe preview */
export function redactPayloadForDisplay(input: unknown): unknown {
  if (input === null || input === undefined) return input;
  if (Array.isArray(input)) return input.map((x) => redactPayloadForDisplay(x));
  if (typeof input === 'object') {
    const o = input as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(o)) {
      const key = k.toLowerCase();
      if (
        key.includes('email') ||
        key.includes('phone') ||
        key.includes('name') ||
        key.includes('address') ||
        key.includes('national') ||
        key.includes('passport')
      ) {
        out[k] = typeof v === 'string' ? maskScalar(v) : redactPayloadForDisplay(v);
      } else {
        out[k] = redactPayloadForDisplay(v);
      }
    }
    return out;
  }
  return maskScalar(input);
}
