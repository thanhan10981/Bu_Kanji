export function safeReturnPath(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/vocabulary') || value.startsWith('//')
    || /[\\\r\n]/.test(value) || /%2f|%5c|%0d|%0a/i.test(value)) return '/kanji';
  const parsed = new URL(value, 'https://internal.example');
  return parsed.origin === 'https://internal.example' && /^\/vocabulary(?:\/|$)/.test(parsed.pathname)
    ? parsed.pathname + parsed.search : '/kanji';
}
