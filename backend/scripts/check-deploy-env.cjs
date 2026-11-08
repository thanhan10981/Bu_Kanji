function validateDeployEnv(env) {
  const errors = [];
  const example = value => !value || /replace_|YOUR-|USER:PASSWORD|change_me|re_xxx/i.test(value);
  if (env.NODE_ENV !== 'production') errors.push('NODE_ENV must be production');
  if (env.DATABASE_URL) {
    try { const url = new URL(env.DATABASE_URL); if (!['postgres:', 'postgresql:'].includes(url.protocol) || example(env.DATABASE_URL)) errors.push('DATABASE_URL must be a real PostgreSQL URL'); }
    catch { errors.push('DATABASE_URL is invalid'); }
  } else if (['POSTGRES_HOST', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB'].some(key => example(env[key]))) {
    errors.push('DATABASE_URL or the complete POSTGRES_* connection is required');
  }
  if (env.DATABASE_SSL && !['true', 'false'].includes(env.DATABASE_SSL)) errors.push('DATABASE_SSL must be true or false');
  if (env.DATABASE_SSL_REJECT_UNAUTHORIZED && !['true', 'false'].includes(env.DATABASE_SSL_REJECT_UNAUTHORIZED)) errors.push('DATABASE_SSL_REJECT_UNAUTHORIZED must be true or false');
  for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'AUTH_RATE_LIMIT_SECRET']) {
    if (example(env[key]) || env[key].length < 32) errors.push(`${key} must be a non-example secret of at least 32 characters`);
  }
  if (env.JWT_ACCESS_SECRET && env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) errors.push('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different');
  if (env.AUTH_RATE_LIMIT_SECRET && [env.JWT_ACCESS_SECRET,env.JWT_REFRESH_SECRET].includes(env.AUTH_RATE_LIMIT_SECRET)) errors.push('AUTH_RATE_LIMIT_SECRET must be separate from JWT secrets');
  for (const [key,maximum] of [['AUTH_LOGIN_EMAIL_LIMIT',1000],['AUTH_LOGIN_IP_LIMIT',10000],['AUTH_LOGIN_WINDOW_SECONDS',86400]]) {
    if (env[key] !== undefined && (!Number.isSafeInteger(Number(env[key])) || Number(env[key]) < 1 || Number(env[key]) > maximum)) errors.push(`${key} must be a positive integer within its supported range`);
  }
  const origin = value => {
    try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && url.origin === value
      && (url.protocol === 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)); }
    catch { return false; }
  };
  if (!origin(env.FRONTEND_URL)) errors.push('FRONTEND_URL must be an HTTPS origin without a trailing slash (HTTP loopback is allowed for tests)');
  const origins = (env.CORS_ORIGIN || env.FRONTEND_URL || '').split(',').map(value => value.trim()).filter(Boolean);
  if (!origins.length || origins.some(value => !origin(value)) || !origins.includes(env.FRONTEND_URL)) errors.push('CORS_ORIGIN must list exact origins including FRONTEND_URL');
  return errors;
}
module.exports = { validateDeployEnv };
if (require.main === module) {
  require('@nestjs/config').ConfigModule.forRoot();
  const errors = validateDeployEnv(process.env);
  if (errors.length) { console.error('Deployment configuration is incomplete:\n- ' + errors.join('\n- ')); process.exitCode = 1; }
  else console.log('Required deployment variables: configured (external credentials and database connectivity still need verification).');
}
