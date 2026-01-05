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
    // Update document title - prioritize site_name from settings
    // This is what appears in browser tabs and should be used for social sharing
    const title = event?.site_name || event?.title || 'QuadruRSVP';
    document.title = title;
    
    // Also update the <title> tag in the HTML head if it exists
    const titleElement = document.querySelector('title');
    if (titleElement) {
      titleElement.textContent = title;
    }

    // Update or create Open Graph and Twitter Card meta tags
    const updateMetaTag = (property: string, content: string, isProperty = true) => {
      const selector = isProperty ? `meta[property="${property}"]` : `meta[name="${property}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (isProperty) {
          meta.setAttribute('property', property);
        } else {
          meta.setAttribute('name', property);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Open Graph tags
    updateMetaTag('og:title', title);
    updateMetaTag('og:type', 'website');
    
    // Description - use invitation_text, story_text, or a default
    const description = event?.invitation_text || event?.story_text || event?.banner_text || 'Join us for a special celebration!';
    updateMetaTag('og:description', description);
    
    // Image - prioritize dedicated social sharing image, then hero image, then site icon
    // Social sharing image should be optimized for social media (1200x630px recommended)
    const imageUrl = event?.social_sharing_image_url || event?.hero_image_url || event?.site_icon_url || '';
    if (imageUrl) {
      updateMetaTag('og:image', imageUrl);
      updateMetaTag('og:image:width', '1200');
      updateMetaTag('og:image:height', '630');
      updateMetaTag('og:image:type', 'image/png');
      updateMetaTag('og:image:alt', title); // Add alt text for accessibility
    }
    
    // URL - current page URL
    updateMetaTag('og:url', window.location.href);
    updateMetaTag('og:site_name', title);

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image', false);
    updateMetaTag('twitter:title', title, false);
    updateMetaTag('twitter:description', description, false);
    if (imageUrl) {
      updateMetaTag('twitter:image', imageUrl, false);
    }

    // Standard meta description (for SEO)
    updateMetaTag('description', description, false);
  }, [event?.site_name, event?.title, event?.invitation_text, event?.story_text, event?.banner_text, event?.site_icon_url, event?.hero_image_url]);

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

