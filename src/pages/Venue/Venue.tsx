import React, { useEffect, useState } from 'react';
import { TopNav } from '../../components/layout/TopNav/TopNav';
import { Card } from '../../components/ui/Card/Card';
import { useEventStore, getThemeColors } from '../../state/useEventStore';
import { getCurrentEventSlug } from '../../lib/eventResolver';
import { fetchPublicEvent } from '../../lib/apiClient';
import './Venue.css';

export const Venue: React.FC = () => {
  const { event, setEvent, setLoading } = useEventStore();
  const theme = getThemeColors(event);
  const slug = getCurrentEventSlug();
  const [localLoading, setLocalLoading] = useState(true);

  // Helper to convert hex to RGB
  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '37, 99, 235'; // Default blue
  };

  // Apply theme colors
  useEffect(() => {
    if (event) {
      const root = document.documentElement;
      root.style.setProperty('--theme-primary', theme.primary);
      root.style.setProperty('--theme-secondary', theme.secondary);
      root.style.setProperty('--theme-text', theme.text);
      root.style.setProperty('--theme-background', theme.background);
      root.style.setProperty('--theme-accent', theme.accent);
      root.style.setProperty('--theme-accent-rgb', hexToRgb(theme.accent));
      root.style.setProperty('--theme-container', theme.container);
      root.style.setProperty('--theme-container-rgb', hexToRgb(theme.container));
      document.body.style.backgroundColor = theme.background;
    }
  }, [event, theme]);

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
                      backgroundColor: theme.primary,
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: 500,
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      // Darken primary color by 10%
                      const primaryColor = theme.primary;
                      e.currentTarget.style.backgroundColor = primaryColor;
                      e.currentTarget.style.opacity = '0.9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme.primary;
                      e.currentTarget.style.opacity = '1';
                    }}
                  >
                    📍 Get Directions (Google Maps)
                  </a>
                </div>
              )}
            </div>
          )}
          {event?.venue_map_url && (
            <div className="venue-map">
              <iframe
                src={event.venue_map_url}
                width="100%"
                height="400"
                style={{ border: 0, borderRadius: '0.5rem', marginTop: '1rem' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Venue Location Map"
              />
            </div>
          )}
          {!event?.venue_text && !event?.venue_address && (
            <p>Plek inligting sal binnekort beskikbaar wees.</p>
          )}
        </Card>
      </div>
    </div>
  );
};

