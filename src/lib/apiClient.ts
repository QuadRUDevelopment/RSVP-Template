/**
 * API Client for Netlify Functions
 */

// Detect if we're running with netlify dev (port 8888) or vite dev (port 5173)
const getApiBase = () => {
  if (import.meta.env.DEV) {
    // If running on port 8888, we're using netlify dev (functions are on same origin)
    if (window.location.port === '8888' || (window.location.hostname === 'localhost' && window.location.port === '')) {
      return '/.netlify/functions';
    }
    // Check if we're on port 5173 (Vite dev server)
    if (window.location.port === '5173') {
      // Try to connect to Netlify Functions on 8888
      // If it fails, the error will be caught and handled gracefully
      return 'http://localhost:8888/.netlify/functions';
    }
    // Default: same origin (for production or other setups)
    return '/.netlify/functions';
  }
  return '/.netlify/functions';
};

const API_BASE = getApiBase();

export interface GuestLookupRequest {
  slug: string;
  inviteCode?: string;
  firstName?: string;
  lastName?: string;
}

export interface RSVPSubmitRequest {
  slug: string;
  inviteCode: string;
  rsvp: {
    status: 'yes' | 'no' | 'maybe';
    plusOnes: Array<{ name: string; mealChoiceId?: string }>;
    mealChoiceId?: string;
    dietaryNotes?: string;
    notes?: string;
  };
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export async function fetchPublicEvent(slug: string) {
  try {
    const response = await fetch(`${API_BASE}/public-event?slug=${encodeURIComponent(slug)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch event: ${response.statusText}`);
    }
    return response.json();
  } catch (error: any) {
    // If connection refused, provide helpful error message
    if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
      console.warn('Netlify Functions server not running. Please run "netlify dev" to start the server.');
      throw new Error('Netlify Functions server is not running. Please start it with "netlify dev"');
    }
    throw error;
  }
}

export async function fetchPublicMenu(slug: string) {
  const response = await fetch(`${API_BASE}/public-menu?slug=${encodeURIComponent(slug)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch menu: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchPublicTimeline(slug: string) {
  const response = await fetch(`${API_BASE}/public-timeline?slug=${encodeURIComponent(slug)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch timeline: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchPublicGallery(slug: string) {
  const response = await fetch(`${API_BASE}/public-gallery?slug=${encodeURIComponent(slug)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch gallery: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchPublicGiftRegistry(slug: string) {
  const response = await fetch(`${API_BASE}/public-gift-registry?slug=${encodeURIComponent(slug)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch gift registry: ${response.statusText}`);
  }
  return response.json();
}

export async function getGuestGiftBookings(slug: string, inviteCode?: string, firstName?: string, lastName?: string) {
  const response = await fetch(`${API_BASE}/gift-booking?slug=${encodeURIComponent(slug)}${inviteCode ? `&inviteCode=${encodeURIComponent(inviteCode)}` : ''}${firstName ? `&firstName=${encodeURIComponent(firstName)}` : ''}${lastName ? `&lastName=${encodeURIComponent(lastName)}` : ''}`, {
    method: 'GET',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to fetch bookings: ${response.statusText}`);
  }
  return response.json();
}

export async function bookGift(slug: string, giftId: string, inviteCode?: string, firstName?: string, lastName?: string) {
  const response = await fetch(`${API_BASE}/gift-booking`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      slug,
      giftId,
      inviteCode,
      firstName,
      lastName,
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to book gift: ${response.statusText}`);
  }
  return response.json();
}

export async function releaseGift(slug: string, giftId: string, inviteCode?: string, firstName?: string, lastName?: string) {
  const response = await fetch(`${API_BASE}/gift-booking`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      slug,
      giftId,
      inviteCode,
      firstName,
      lastName,
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to release gift: ${response.statusText}`);
  }
  return response.json();
}

export async function uploadImage(
  imageData: string,
  fileName: string,
  folder: string,
  token: string
): Promise<{ url: string; path: string }> {
  const { getCurrentEventSlug } = await import('./eventResolver');
  const slug = getCurrentEventSlug();
  return adminRequest(
    'admin-upload-image',
    {
      method: 'POST',
      body: JSON.stringify({
        slug,
        imageData,
        fileName,
        folder,
      }),
    },
    token
  );
}

export async function guestLookup(request: GuestLookupRequest) {
  const response = await fetch(`${API_BASE}/guest-lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error(`Guest lookup failed: ${response.statusText}`);
  }
  return response.json();
}

export async function submitRSVP(request: RSVPSubmitRequest) {
  const response = await fetch(`${API_BASE}/rsvp-submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error(`RSVP submission failed: ${response.statusText}`);
  }
  return response.json();
}

export async function adminLogin(email: string, password: string): Promise<{ token: string; refreshToken: string; user: { id: string; email: string } }> {
  const response = await fetch(`${API_BASE}/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Invalid credentials' }));
    throw new Error(error.error || 'Invalid credentials');
  }
  return response.json();
}

export async function adminRequest(
  endpoint: string,
  options: RequestInit = {},
  token?: string
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE}/${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
    throw new Error(`Request failed: ${response.statusText}`);
  }
  
  return response.json();
}

export async function fetchGroups(slug: string, token: string) {
  return adminRequest(
    `admin-groups?slug=${encodeURIComponent(slug)}`,
    { method: 'GET' },
    token
  );
}

// Custom RSVP Fields
export async function fetchCustomFields(slug: string, token: string) {
  return adminRequest(
    `admin-custom-fields?slug=${encodeURIComponent(slug)}`,
    { method: 'GET' },
    token
  );
}

export async function createCustomField(slug: string, fieldData: any, token: string) {
  return adminRequest(
    `admin-custom-fields?slug=${encodeURIComponent(slug)}`,
    {
      method: 'POST',
      body: JSON.stringify(fieldData),
    },
    token
  );
}

export async function updateCustomField(slug: string, fieldData: any, token: string) {
  return adminRequest(
    `admin-custom-fields?slug=${encodeURIComponent(slug)}`,
    {
      method: 'PUT',
      body: JSON.stringify(fieldData),
    },
    token
  );
}

export async function deleteCustomField(slug: string, fieldId: string, token: string) {
  return adminRequest(
    `admin-custom-fields?slug=${encodeURIComponent(slug)}&id=${fieldId}`,
    { method: 'DELETE' },
    token
  );
}

// Public: Fetch custom fields for RSVP form
export async function fetchPublicCustomFields(slug: string) {
  const response = await fetch(`${API_BASE}/public-custom-fields?slug=${encodeURIComponent(slug)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch custom fields: ${response.statusText}`);
  }
  return response.json();
}

