import { useEffect } from 'react';
import { useEventStore } from '../../../state/useEventStore';

/**
 * Component to dynamically update document title and favicon
 * based on event settings
 */
export const DocumentHead: React.FC = () => {
  const { event } = useEventStore();

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
      // Remove existing favicon links
      const existingLinks = document.querySelectorAll("link[rel*='icon']");
      existingLinks.forEach((link) => link.remove());

      if (iconUrl) {
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

        // Create new favicon link
        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = type;
        link.href = iconUrl;
        document.head.appendChild(link);

        // Also add apple-touch-icon for better mobile support
        const appleLink = document.createElement('link');
        appleLink.rel = 'apple-touch-icon';
        appleLink.href = iconUrl;
        document.head.appendChild(appleLink);
      } else {
        // Reset to default favicon if no custom icon
        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/svg+xml';
        link.href = '/vite.svg';
        document.head.appendChild(link);
      }
    };

    updateFavicon(event?.site_icon_url);
  }, [event?.site_icon_url]);

  return null; // This component doesn't render anything
};

