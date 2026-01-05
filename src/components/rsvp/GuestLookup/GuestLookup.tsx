import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../../ui/Button/Button';
import { guestLookup } from '../../../lib/apiClient';
import { getCurrentEventSlug } from '../../../lib/eventResolver';
import './GuestLookup.css';

interface GuestLookupProps {
  onGuestFound: (data: any) => void;
}

export const GuestLookup: React.FC<GuestLookupProps> = ({ onGuestFound }) => {
  const [searchParams] = useSearchParams();
  const [method, setMethod] = useState<'code' | 'name'>('code');
  const [inviteCode, setInviteCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasAutoSubmitted = useRef(false);

  const handleLookup = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const slug = getCurrentEventSlug();
      const result = await guestLookup({
        slug,
        ...(method === 'code' 
          ? { inviteCode } 
          : { firstName, lastName }
        ),
      });

      onGuestFound(result);
    } catch (err: any) {
      setError(err.message || 'Guest not found. Please check your information.');
    } finally {
      setLoading(false);
    }
  }, [method, inviteCode, firstName, lastName, onGuestFound]);

  // Check for invite code in URL parameter on mount and auto-submit
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl && !hasAutoSubmitted.current) {
      setInviteCode(codeFromUrl);
      setMethod('code');
      hasAutoSubmitted.current = true;
      
      // Auto-submit after a short delay to ensure state is updated
      const timer = setTimeout(() => {
        // Use the current invite code from URL
        const slug = getCurrentEventSlug();
        guestLookup({
          slug,
          inviteCode: codeFromUrl,
        })
          .then(onGuestFound)
          .catch((err: any) => {
            setError(err.message || 'Guest not found. Please check your information.');
          });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchParams, onGuestFound]);

  return (
    <div className="guest-lookup">
      <div className="lookup-tabs">
        <button
          className={`tab ${method === 'code' ? 'active' : ''}`}
          onClick={() => setMethod('code')}
        >
          Invite Code
        </button>
        <button
          className={`tab ${method === 'name' ? 'active' : ''}`}
          onClick={() => setMethod('name')}
        >
          Name & Surname
        </button>
      </div>

      <div className="lookup-form">
        {method === 'code' ? (
          <div className="form-group">
            <label htmlFor="inviteCode">Invite Code</label>
            <input
              id="inviteCode"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Enter your invite code"
              onKeyPress={(e) => e.key === 'Enter' && handleLookup()}
            />
          </div>
        ) : (
          <>
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name"
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
                onKeyPress={(e) => e.key === 'Enter' && handleLookup()}
              />
            </div>
          </>
        )}

        {error && <div className="error-message">{error}</div>}

        <Button
          onClick={handleLookup}
          disabled={loading || (method === 'code' ? !inviteCode : !firstName || !lastName)}
        >
          {loading ? 'Looking up...' : 'Continue'}
        </Button>
      </div>
    </div>
  );
};
