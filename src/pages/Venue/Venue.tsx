import React, { useEffect, useState } from 'react';
import { TopNav } from '../../components/layout/TopNav/TopNav';
import { Card } from '../../components/ui/Card/Card';
import { useEventStore } from '../../state/useEventStore';
import { applyTheme } from '../../lib/applyTheme';
import { getCurrentEventSlug } from '../../lib/eventResolver';
import { fetchPublicEvent } from '../../lib/apiClient';
import './Venue.css';

export const Venue: React.FC = () => {
  const { event, setEvent, setLoading } = useEventStore();
  const slug = getCurrentEventSlug();
  const [localLoading, setLocalLoading] = useState(true);

  useEffect(() => { applyTheme(event); }, [event]);

  useEffect(() => {
    const loadEvent = async () => {
      setLoading(true);
      setLocalLoading(true);
      try {
        const eventData = await fetchPublicEvent(slug);
        setEvent(eventData);
      } catch (err) {
        console.error('Failed to load event:', err);
      } finally {
        setLoading(false);
        setLocalLoading(false);
      }
    };

    if (!event) {
      loadEvent();
    } else {
      setLocalLoading(false);
    }
  }, [slug, setEvent, setLoading, event]);

  if (localLoading) {
    return (
      <div className="venue-page">
        <TopNav />
        <div className="venue-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="venue-page">
      <TopNav />
      <div className="venue-container">
        <h1>Plek</h1>
        <Card className="venue-card">
          {event?.venue_name && (
            <h2 className="venue-name">{event.venue_name}</h2>
          )}
          {event?.venue_text && (
            <p className="venue-text">{event.venue_text}</p>
          )}
          {event?.venue_address && (
            <div className="venue-address">
              <strong>📍 Address:</strong> {event.venue_address}
              {event.venue_address && (
                <div style={{ marginTop: '1rem' }}>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.venue_address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      padding: '0.75rem 1.5rem',
                      backgroundColor: 'var(--theme-primary)',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: 500,
                      transition: 'background-color 0.2s, opacity 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                  >
                    📍 Get Directions (Google Maps)
                  </a>
                </div>
              )}
            </div>
          )}
          {(() => {
            // Helper function to extract and validate Google Maps embed URL
            const getMapUrl = (url: string | undefined): string | null => {
              if (!url) return null;
              
              try {
                let mapUrl = url.trim();
                
                // If it looks like full iframe HTML, extract the src URL
                const iframeMatch = mapUrl.match(/src=["']([^"']+)["']/);
                if (iframeMatch) {
                  mapUrl = iframeMatch[1];
                }
                
                // Validate it's a Google Maps embed URL
                if (!mapUrl.startsWith('https://www.google.com/maps/embed')) {
                  console.warn('Invalid Google Maps embed URL:', mapUrl);
                  return null;
                }
                
                return mapUrl;
              } catch (err) {
                console.error('Error parsing map URL:', err);
                return null;
              }
            };
            
            const mapUrl = getMapUrl(event?.venue_map_url);
            if (!mapUrl) return null;
            
            return (
              <div className="venue-map">
                <iframe
                  src={mapUrl}
                  width="100%"
                  height="400"
                  style={{ border: 0, borderRadius: '0.5rem', marginTop: '1rem' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Venue Location Map"
                />
              </div>
            );
          })()}
          {!event?.venue_text && !event?.venue_address && (
            <p>Plek inligting sal binnekort beskikbaar wees.</p>
          )}
        </Card>
      </div>
    </div>
  );
};

