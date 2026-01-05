import React, { useEffect, useState } from 'react';
import { TopNav } from '../../components/layout/TopNav/TopNav';
import { Card } from '../../components/ui/Card/Card';
import { useEventStore } from '../../state/useEventStore';
import { getCurrentEventSlug } from '../../lib/eventResolver';
import { fetchPublicEvent } from '../../lib/apiClient';
import './Venue.css';

export const Venue: React.FC = () => {
  const { event, setEvent, setLoading } = useEventStore();
  const slug = getCurrentEventSlug();
  const [localLoading, setLocalLoading] = useState(true);

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
        <h1>Venue</h1>
        <Card className="venue-card">
          {event?.venue_name && (
            <h2 className="venue-name">{event.venue_name}</h2>
          )}
          {event?.venue_text && (
            <p className="venue-text">{event.venue_text}</p>
          )}
          {event?.venue_address && (
            <div className="venue-address">
              <strong>Address:</strong> {event.venue_address}
            </div>
          )}
          {event?.venue_map_url && (
            <div className="venue-map">
              <iframe
                src={event.venue_map_url}
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
          {!event?.venue_text && !event?.venue_address && (
            <p>Venue information will be available soon.</p>
          )}
        </Card>
      </div>
    </div>
  );
};

