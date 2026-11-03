function databaseSsl(env) {
  return env.DATABASE_SSL === 'true'
    ? { rejectUnauthorized: env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' }
    : undefined;
}
module.exports = { databaseSsl };
