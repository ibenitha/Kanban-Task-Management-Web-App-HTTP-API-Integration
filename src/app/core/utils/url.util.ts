// returnUrl comes from the query string, which a user (or a crafted link)
// could set to anything — e.g. ?returnUrl=https://evil.example.com. Only a
// plain internal path is safe to navigate to; an absolute or
// protocol-relative URL ("//evil.example.com") would silently redirect the
// user off the app after "logging in", which is the classic open-redirect bug.
export function isSafeInternalUrl(url: string | null | undefined): url is string {
  return !!url && url.startsWith('/') && !url.startsWith('//') && !url.includes('://');
}
