import { create } from 'zustand';

export interface Event {
  id: string;
  slug: string;
  title: string;
  banner_text?: string;
  banner_text_font_size?: number; // in pixels
  banner_text_color?: string; // hex color
  banner_text_shadow_enabled?: boolean;
  banner_text_shadow_x?: number; // horizontal offset in pixels
  banner_text_shadow_y?: number; // vertical offset in pixels
  banner_text_shadow_blur?: number; // blur radius in pixels
  banner_text_shadow_color?: string; // shadow color
  banner_text_border_enabled?: boolean;
  banner_text_border_width?: number; // border width in pixels
  banner_text_border_color?: string; // border color (hex)
  banner_text_border_opacity?: number; // border opacity 0.0-1.0
  banner_text_border_radius?: number; // border radius in pixels
  banner_text_background_enabled?: boolean;
  banner_text_background_color?: string; // background color (hex)
  banner_text_background_opacity?: number; // background opacity 0.0-1.0
  banner_text_padding?: number; // padding in pixels
  gallery_carousel_speed?: number; // carousel rotation speed in milliseconds
  date_text?: string;
  venue_text?: string;
  dress_code?: string;
  theme_json?: any;
  hero_image_url?: string;
  rsvp_yes_image_url?: string;
  rsvp_no_image_url?: string;
  invitation_text?: string;
  story_text?: string;
  story_image_url?: string;
  guest_message?: string;
  venue_name?: string;
  venue_address?: string;
  venue_map_url?: string;
  menu_enabled?: boolean;
  schedule_enabled?: boolean;
  accommodation_enabled?: boolean;
  gift_registry_enabled?: boolean;
  max_gifts_per_guest?: number;
  wedding_date?: string; // ISO date string
  site_name?: string;
  site_icon_url?: string;
  social_sharing_image_url?: string;
  section_backgrounds?: {
    [key: string]: {
      background_image_url?: string;
      background_color?: string;
      overlay_enabled?: boolean;
      overlay_color?: string;
      overlay_opacity?: number;
    };
  };
  // Additional notes shown above invitation text on home RSVP section
  additional_notes?: string;
  // Accommodation access control
  accommodation_auth_required?: boolean;
  // Configurable RSVP response options
  rsvp_options?: {
    yes?: { label?: string; emoji?: string; enabled?: boolean };
    no?: { label?: string; emoji?: string; enabled?: boolean };
    maybe?: { label?: string; emoji?: string; enabled?: boolean };
  };
  // Q&A / FAQ feature
  qa_enabled?: boolean;
}

interface EventStore {
  event: Event | null;
  loading: boolean;
  error: string | null;
  setEvent: (event: Event | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useEventStore = create<EventStore>((set) => ({
  event: null,
  loading: false,
  error: null,
  setEvent: (event) => set({ event }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

// Helper function to get theme colors with defaults
export const getThemeColors = (event: Event | null) => {
  const theme = event?.theme_json || {};
  const tc = theme.textColors || {};          // nested per-area overrides
  const baseText = theme.textColor || '#111827';
  return {
    primary: theme.primaryColor || '#2563eb',
    secondary: theme.secondaryColor || '#64748b',
    text: baseText,
    background: theme.backgroundColor || '#ffffff',
    accent: theme.accentColor || '#2563eb',
    container: theme.containerColor || '#2563eb',
    navFontColor: theme.navFontColor || '#6b7280',
    navFontSize: theme.navFontSize || 1,
    fontPair: (theme.fontPair as string) || 'default',
    // ── Per-area text colours (all default to baseText or a sensible fallback) ──
    textHeading: tc.heading || baseText,
    textMuted: tc.muted || '#6b7280',
    textStory: tc.story || '#4b5563',
    textInvitation: tc.invitation || baseText,
    textAdditionalNotes: tc.additionalNotes || baseText,
    textRsvp: tc.rsvp || baseText,
  };
};

