/**
 * Resolves the event slug from the current hostname
 * Supports subdomain-based multi-event architecture
 */
export function getEventSlugFromHostname(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const hostname = window.location.hostname;
  
  // Remove 'www.' prefix if present
  const cleanHostname = hostname.replace(/^www\./, '');
  
  // Handle Netlify preview domains (e.g., random-name-123.netlify.app)
  if (cleanHostname.includes('.netlify.app') || cleanHostname.includes('.netlify.app')) {
    // For Netlify previews, try to extract from subdomain or use query param
    const parts = cleanHostname.split('.');
    if (parts.length > 3) {
      // Has subdomain before .netlify.app (e.g., event-slug.random-name.netlify.app)
      return parts[0];
    }
    // Fall through to query param check
  }
  
  // If it's the base domain (e.g., quadrursvp.site, quadrursvp.co.za), return null or default
  const baseDomains = ['quadrursvp.site', 'quadrursvp.co.za', 'localhost', '127.0.0.1'];
  if (baseDomains.some(domain => cleanHostname === domain || cleanHostname.endsWith(`.${domain}`))) {
    // Extract subdomain
    const parts = cleanHostname.split('.');
    if (parts.length > 2) {
      // Has subdomain (e.g., viljoenbruilof.quadrursvp.site)
      return parts[0];
    }
    // Base domain - return null (will need to handle default event)
    return null;
  }
  
  // For localhost development, allow query param or default
  if (cleanHostname === 'localhost' || cleanHostname === '127.0.0.1') {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('event');
    if (slug) return slug;
    // Default for local dev
    return 'default-event';
  }
  
  // Extract first subdomain as slug
  const parts = cleanHostname.split('.');
  return parts.length > 2 ? parts[0] : null;
}

/**
 * Gets the current event slug, with fallback
 */
export function getCurrentEventSlug(): string {
  const slug = getEventSlugFromHostname();
  return slug || 'default-event';
}

