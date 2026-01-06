import React, { useState, useEffect } from 'react';
import { TopNav } from '../../components/layout/TopNav/TopNav';
import { Card } from '../../components/ui/Card/Card';
import { Button } from '../../components/ui/Button/Button';
import { GiftBooking } from '../../components/gift/GiftBooking/GiftBooking';
import { getCurrentEventSlug } from '../../lib/eventResolver';
import { fetchPublicGiftRegistry, fetchPublicEvent } from '../../lib/apiClient';
import { useEventStore, getThemeColors } from '../../state/useEventStore';
import './GiftRegistry.css';

export const GiftRegistry: React.FC = () => {
  const { event, setEvent } = useEventStore();
  const theme = getThemeColors(event);
  const [gifts, setGifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load event data if not already loaded
  useEffect(() => {
    const loadEvent = async () => {
      if (!event) {
        try {
          const slug = getCurrentEventSlug();
          const eventData = await fetchPublicEvent(slug);
          setEvent(eventData);
        } catch (err) {
          console.error('Failed to load event:', err);
        }
      }
    };
    loadEvent();
  }, [event, setEvent]);

  // Load gifts
  useEffect(() => {
    const loadGifts = async () => {
      try {
        const slug = getCurrentEventSlug();
        const result = await fetchPublicGiftRegistry(slug);
        setGifts(result.gifts || []);
      } catch (err) {
        console.error('Failed to load gifts:', err);
      } finally {
        setLoading(false);
      }
    };
    loadGifts();
  }, [refreshKey]);

  // Check if gift registry feature is disabled
  if (event && event.gift_registry_enabled === false) {
    return (
      <div className="gift-registry-page">
        <TopNav />
        <div className="gift-registry-container">
          <Card className="gift-registry-section">
            <h1>Gift Registry</h1>
            <p>Hierdie afdeling is nie beskikbaar vir hierdie geleentheid nie.</p>
          </Card>
        </div>
      </div>
    );
  }

  // Helper to convert hex to RGB
  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '37, 99, 235';
  };

  // Apply theme colors
  useEffect(() => {
    if (event) {
      const root = document.documentElement;
      root.style.setProperty('--theme-primary', theme.primary);
      root.style.setProperty('--theme-primary-rgb', hexToRgb(theme.primary));
      root.style.setProperty('--theme-container-rgb', hexToRgb(theme.container));
    }
  }, [event, theme]);

  const handleBookingChanged = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="gift-registry-page">
        <TopNav />
        <div className="gift-registry-loading">Loading gift registry...</div>
      </div>
    );
  }

  if (showBooking) {
    return (
      <div className="gift-registry-page">
        <TopNav />
        <div className="gift-registry-container">
          <Button
            variant="secondary"
            onClick={() => setShowBooking(false)}
            style={{ marginBottom: '1rem' }}
          >
            ← Back to Registry
          </Button>
          <GiftBooking gifts={gifts} onBookingChanged={handleBookingChanged} />
        </div>
      </div>
    );
  }

  return (
    <div className="gift-registry-page">
      <TopNav />
      <div className="gift-registry-container">
        <Card className="gift-registry-section">
          <div className="gift-registry-header">
            <h1>Gift Registry</h1>
            <Button variant="primary" onClick={() => setShowBooking(true)}>
              Book a Gift
            </Button>
          </div>

          {gifts.length === 0 ? (
            <p>No gifts available at the moment.</p>
          ) : (
            <>
              <div className="gifts-grid">
                {gifts.map((gift) => (
                  <div key={gift.id} className={`gift-card ${gift.booked ? 'booked' : ''}`}>
                    <div className="gift-card-content">
                      <h3>{gift.name}</h3>
                      {gift.description && <p>{gift.description}</p>}
                      {gift.url && (
                        <a 
                          href={gift.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="registry-link"
                        >
                          View Registry →
                        </a>
                      )}
                    </div>
                    {gift.booked && (
                      <span className="booked-badge">Booked</span>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Bottom Book Button */}
              <div className="gift-registry-bottom-actions">
                <Button 
                  variant="primary" 
                  onClick={() => setShowBooking(true)}
                  style={{ width: '100%', maxWidth: '300px', margin: '2rem auto 0' }}
                >
                  Book a Gift
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

