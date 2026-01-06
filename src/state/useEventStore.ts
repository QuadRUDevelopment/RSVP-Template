import { create } from 'zustand';

export interface Event {
  id: string;
  slug: string;
  title: string;
  banner_text?: string;
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
  return {
    primary: theme.primaryColor || '#2563eb',
    secondary: theme.secondaryColor || '#64748b',
    text: theme.textColor || '#111827',
    background: theme.backgroundColor || '#ffffff',
    accent: theme.accentColor || '#2563eb',
    container: theme.containerColor || '#2563eb',
    navFontColor: theme.navFontColor || '#6b7280',
    navFontSize: theme.navFontSize || 1,
  };
};

