import { useEffect } from 'react';
import { useEventStore } from '../../../state/useEventStore';
import { getCurrentEventSlug } from '../../../lib/eventResolver';
import { fetchPublicEvent } from '../../../lib/apiClient';

/**
 * Component to dynamically update document title and favicon
 * based on event settings
 */
export const DocumentHead: React.FC = () => {
  const { event, setEvent } = useEventStore();

  // Ensure event is loaded if not already loaded
  useEffect(() => {
    if (!event) {
      const loadEvent = async () => {
        try {
          const slug = getCurrentEventSlug();
          const eventData = await fetchPublicEvent(slug);
          setEvent(eventData);
          console.log('[DocumentHead] Event loaded, site_icon_url:', eventData?.site_icon_url);
        } catch (err) {
          console.error('[DocumentHead] Failed to load event:', err);
        }
      };
      loadEvent();
    }
  }, [event, setEvent]);

  useEffect(() => {
    // Update document title
    if (event?.site_name) {
      document.title = event.site_name;
    } else if (event?.title) {
      document.title = event.title;
    } else {
      document.title = 'QuadruRSVP';
    }
  }, [event?.site_name, event?.title]);

  useEffect(() => {
    // Update favicon
    const updateFavicon = (iconUrl: string | undefined) => {
      console.log('[DocumentHead] Updating favicon, iconUrl:', iconUrl);
      
      // Remove ALL existing favicon links (including the one from index.html)
      const existingLinks = document.querySelectorAll("link[rel*='icon'], link[rel='shortcut icon']");
      existingLinks.forEach((link) => {
        console.log('[DocumentHead] Removing existing favicon:', link.getAttribute('href'));
        link.remove();
      });

      if (iconUrl && iconUrl.trim() !== '') {
        // Determine file type from URL
        const urlLower = iconUrl.toLowerCase();
        let type = 'image/png'; // Default
        
        if (urlLower.includes('.svg')) {
          type = 'image/svg+xml';
        } else if (urlLower.includes('.ico')) {
          type = 'image/x-icon';
        } else if (urlLower.includes('.jpg') || urlLower.includes('.jpeg')) {
          type = 'image/jpeg';
        }

        // Create new favicon link with cache busting to force browser to reload
        const cacheBustedUrl = iconUrl + (iconUrl.includes('?') ? '&' : '?') + 'v=' + Date.now();
        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = type;
        link.href = cacheBustedUrl;
        document.head.appendChild(link);
        console.log('[DocumentHead] Added favicon:', link.href);

        // Also add apple-touch-icon for better mobile support
        const appleLink = document.createElement('link');
        appleLink.rel = 'apple-touch-icon';
        appleLink.href = iconUrl;
        document.head.appendChild(appleLink);
        console.log('[DocumentHead] Added apple-touch-icon:', appleLink.href);
      } else {
        console.log('[DocumentHead] No custom icon, keeping default');
        // Don't reset to default - let the browser use what's in index.html
        // Or create a default if needed
      }
    };

    updateFavicon(event?.site_icon_url);
  }, [event?.site_icon_url]);

  return null; // This component doesn't render anything
};

