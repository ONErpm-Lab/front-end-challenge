/** The value of the cookie `name` in a `Cookie` request header or in `document.cookie`, or `null` when absent. */
export function readCookie(header: string | null | undefined, name: string): string | null {
  if (!header) {
    return null;
  }
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator > 0 && part.slice(0, separator).trim() === name) {
      try {
        return decodeURIComponent(part.slice(separator + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}

/** A `Set-Cookie`-style string, for the whole site, lasting `maxAgeSeconds`. */
export function serializeCookie(
  name: string,
  value: string,
  options: { readonly maxAgeSeconds: number; readonly secure: boolean },
): string {
  const attributes = ['Path=/', `Max-Age=${options.maxAgeSeconds}`, 'SameSite=Lax'];
  if (options.secure) {
    attributes.push('Secure');
  }
  return `${name}=${encodeURIComponent(value)}; ${attributes.join('; ')}`;
}
