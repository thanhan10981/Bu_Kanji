import { isIP } from 'net';

export function trustedProxies(raw?: string): string[] | false {
  if (!raw?.trim()) return false;
  const values = raw.split(',').map(value => value.trim());
  for (const value of values) {
    const [ip, prefix, ...extra] = value.split('/');
    const version = isIP(ip);
    if (!version || extra.length || (prefix !== undefined && (!/^\d+$/.test(prefix)
      || Number(prefix) < 1 || Number(prefix) > (version === 4 ? 32 : 128)))) {
      throw new Error('AUTH_TRUSTED_PROXY_CIDRS must contain explicit trusted IP addresses or CIDRs');
    }
  }
  return values;
}
