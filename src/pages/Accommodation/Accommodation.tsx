import React, { useState, useEffect } from 'react';
import { TopNav } from '../../components/layout/TopNav/TopNav';
import { Card } from '../../components/ui/Card/Card';
import { Button } from '../../components/ui/Button/Button';
import { getCurrentEventSlug } from '../../lib/eventResolver';
import { guestLookup, fetchPublicAccommodations, fetchPublicEvent } from '../../lib/apiClient';
import { useEventStore } from '../../state/useEventStore';
import { applyTheme } from '../../lib/applyTheme';
import './Accommodation.css';

export const Accommodation: React.FC = () => {
  const { event, setEvent } = useEventStore();
  const [step, setStep] = useState<'lookup' | 'results'>('lookup');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accommodations, setAccommodations] = useState<any[]>([]);

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

  // When auth not required: load open accommodations automatically
  useEffect(() => {
    if (event && event.accommodation_auth_required === false && step === 'lookup') {
      const loadOpen = async () => {
        setLoading(true);
        try {
          const slug = getCurrentEventSlug();
          const result = await fetchPublicAccommodations(slug);
          setAccommodations(result.accommodations || []);
          setStep('results');
        } catch (err) {
          console.error('Failed to load open accommodations:', err);
        } finally {
          setLoading(false);
        }
      };
      loadOpen();
    }
  }, [event, step]);

  useEffect(() => { applyTheme(event); }, [event]);

  if (event && event.accommodation_enabled === false) {
    return (
      <div className="accommodation-page">
        <TopNav />
        <div className="accommodation-container">
          <Card className="accommodation-section">
            <h1>Akkommodasie</h1>
            <p>Hierdie afdeling is nie beskikbaar vir hierdie geleentheid nie.</p>
          </Card>
        </div>
      </div>
    );
  }

  if (loading && step === 'lookup') {
    return (
      <div className="accommodation-page">
        <TopNav />
        <div className="accommodation-container">
          <Card className="lookup-card">
            <p>Laai akkommodasie...</p>
          </Card>
        </div>
      </div>
    );
  }

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const slug = getCurrentEventSlug();
      const result = await guestLookup({ slug, firstName, lastName });
      const filteredAccommodations = (result.accommodations || []).filter(
        (acc: any) => acc.audience_key === 'all' || acc.audience_key === result.guest.group_key
      );
      setAccommodations(filteredAccommodations);
      setStep('results');
    } catch (err: any) {
      setError(err.message || 'Guest not found. Please check your name and surname.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="accommodation-page">
      <TopNav />
      <div className="accommodation-container">
        {step === 'lookup' ? (
          <Card className="lookup-card">
            <h1>Akkommodasie Opsies</h1>
            <p className="lookup-subtitle">
              Voer asseblief jou naam en van in om gepersonaliseerde akkommodasie opsies te sien
            </p>
            <form onSubmit={handleLookup} className="lookup-form">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                  required
                />
              </div>
              {error && <div className="error-message">{error}</div>}
              <Button type="submit" disabled={loading} size="large" className="submit-button">
                {loading ? 'Soek...' : 'Bekyk Akkommodasie'}
              </Button>
            </form>
          </Card>
        ) : (
          <div className="accommodation-results">
            <h1>Akkommodasie Opsies</h1>
            {accommodations.length === 0 ? (
              <Card>
                <p>Geen akkommodasie opsies beskikbaar vir jou groep op die oomblik nie.</p>
              </Card>
            ) : (
              <div className="accommodation-grid">
                {accommodations.map((acc) => <AccommodationCard key={acc.id} acc={acc} />)}
              </div>
            )}
            {event?.accommodation_auth_required !== false && (
              <Button
                variant="secondary"
                onClick={() => {
                  setStep('lookup');
                  setFirstName('');
                  setLastName('');
                  setAccommodations([]);
                }}
              >
                Search Again
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const AccommodationCard: React.FC<{ acc: any }> = ({ acc }) => {
  const getDirectionsUrl = () => {
    if (!acc.address) return null;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(acc.address)}`;
  };

  const getMapUrl = (url: string | undefined): string | null => {
    if (!url) return null;
    try {
      let mapUrl = url.trim();
      const iframeMatch = mapUrl.match(/src=["']([^"']+)["']/);
      if (iframeMatch) mapUrl = iframeMatch[1];
      if (!mapUrl.startsWith('https://www.google.com/maps/embed')) return null;
      return mapUrl;
    } catch {
      return null;
    }
  };

  const mapUrl = getMapUrl(acc.map_url);

  return (
    <Card className="accommodation-card">
      <h3>{acc.name}</h3>
      {acc.description && <p className="accommodation-description">{acc.description}</p>}
      {acc.price && <div className="accommodation-price">{acc.price}</div>}

      {/* Contact details */}
      {(acc.phone || acc.email) && (
        <div className="accommodation-contact">
          {acc.phone && (
            <a href={`tel:${acc.phone}`} className="contact-link contact-phone">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.64A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
              </svg>
              {acc.phone}
            </a>
          )}
          {acc.email && (
            <a href={`mailto:${acc.email}`} className="contact-link contact-email">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              {acc.email}
            </a>
          )}
        </div>
      )}

      {acc.address && (
        <div className="accommodation-address">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          {acc.address}
        </div>
      )}

      {mapUrl && (
        <div className="accommodation-map">
          <iframe
            src={mapUrl}
            width="100%"
            height="200"
            style={{ border: 0, borderRadius: '0.5rem' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Map for ${acc.name}`}
          />
        </div>
      )}

      <div className="accommodation-actions">
        {getDirectionsUrl() && (
          <Button
            variant="primary"
            size="medium"
            onClick={() => window.open(getDirectionsUrl()!, '_blank')}
          >
            Get Directions
          </Button>
        )}
        {acc.url && (
          <Button
            variant="outline"
            size="medium"
            onClick={() => {
              const url = acc.url.startsWith('http://') || acc.url.startsWith('https://')
                ? acc.url
                : `https://${acc.url}`;
              window.open(url, '_blank', 'noopener,noreferrer');
            }}
          >
            View Details
          </Button>
        )}
      </div>
    </Card>
  );
};
