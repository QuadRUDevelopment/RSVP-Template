import React, { useState } from 'react';
import { TopNav } from '../../components/layout/TopNav/TopNav';
import { Card } from '../../components/ui/Card/Card';
import { Button } from '../../components/ui/Button/Button';
import { getCurrentEventSlug } from '../../lib/eventResolver';
import { guestLookup } from '../../lib/apiClient';
import './Accommodation.css';

export const Accommodation: React.FC = () => {
  const [step, setStep] = useState<'lookup' | 'results'>('lookup');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accommodations, setAccommodations] = useState<any[]>([]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const slug = getCurrentEventSlug();
      const result = await guestLookup({
        slug,
        firstName,
        lastName,
      });

      // Filter accommodations by guest group
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
            <h1>Accommodation Options</h1>
            <p className="lookup-subtitle">
              Please enter your name and surname to see personalized accommodation options
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
                {loading ? 'Looking up...' : 'View Accommodations'}
              </Button>
            </form>
          </Card>
        ) : (
          <div className="accommodation-results">
            <h1>Accommodation Options</h1>
            {accommodations.length === 0 ? (
              <Card>
                <p>No accommodation options available for your group at this time.</p>
              </Card>
            ) : (
              <div className="accommodation-grid">
                {accommodations.map((acc) => {
                  const getDirectionsUrl = () => {
                    if (!acc.address) return null;
                    // Encode address for Google Maps
                    const encodedAddress = encodeURIComponent(acc.address);
                    // Try native app first, fallback to web
                    return `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
                  };

                  return (
                    <Card key={acc.id} className="accommodation-card">
                      <h3>{acc.name}</h3>
                      {acc.description && (
                        <p className="accommodation-description">{acc.description}</p>
                      )}
                      {acc.price && (
                        <div className="accommodation-price">{acc.price}</div>
                      )}
                      {acc.address && (
                        <div className="accommodation-address">
                          <strong>📍 Address:</strong> {acc.address}
                        </div>
                      )}
                      {acc.map_url && (
                        <div className="accommodation-map">
                          <iframe
                            src={acc.map_url}
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
                            onClick={() => {
                              const url = getDirectionsUrl();
                              if (url) {
                                // Try to open native app, fallback to web
                                window.open(url, '_blank');
                              }
                            }}
                            style={{ marginRight: '0.5rem' }}
                          >
                            📍 Get Directions
                          </Button>
                        )}
                        {acc.url && (
                          <Button
                            variant="outline"
                            size="medium"
                            onClick={() => window.open(acc.url, '_blank')}
                          >
                            View Details
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
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
          </div>
        )}
      </div>
    </div>
  );
};

