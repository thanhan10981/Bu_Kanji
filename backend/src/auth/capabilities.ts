export function authCapabilities(get: (key: string) => string | undefined) {
  const configured = (key: string) => {
    const value = get(key)?.trim();
    return Boolean(value && !/replace_|YOUR-|re_xxx|example\.com/i.test(value));
  };
  const from = get('RESEND_FROM_EMAIL') ?? '';
  const email = configured('RESEND_API_KEY') && configured('RESEND_FROM_EMAIL')
    && !(get('NODE_ENV') === 'production' && /@resend\.dev\b/i.test(from));
  return {
    emailRegistration: true,
    passwordReset: email,
    googleLogin: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_CALLBACK_URL'].every(configured),
  };
}
