import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { getSwalConfig } from '../../lib/sweetalert2Config';
import { GuestLookup } from '../../components/rsvp/GuestLookup/GuestLookup';
import { RSVPForm } from '../../components/rsvp/RSVPForm/RSVPForm';
import { TopNav } from '../../components/layout/TopNav/TopNav';
import { submitRSVP, fetchPublicEvent } from '../../lib/apiClient';
import { getCurrentEventSlug } from '../../lib/eventResolver';
import { useEventStore, getThemeColors } from '../../state/useEventStore';
import { AccommodationCard } from '../Accommodation/Accommodation';
import './RSVP.css';

export const RSVP: React.FC = () => {
  const { event, setEvent } = useEventStore();
  const theme = getThemeColors(event);
  const [step, setStep] = useState<'lookup' | 'form'>('lookup');
  const [guestData, setGuestData] = useState<any>(null);

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

  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '37, 99, 235';
  };

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

  const handleGuestFound = (data: any) => {
    setGuestData(data);
    setStep('form');
  };

  const handleRSVPSubmit = async (rsvpData: any) => {
    const slug = getCurrentEventSlug();

    await submitRSVP({
      slug,
      inviteCode: guestData.guest.invite_code,
      rsvp: rsvpData,
    });

    const mealChoice = guestData.menuItems?.find(
      (item: any) => item.id === rsvpData.mealChoiceId
    )?.name;

    const guestName =
      guestData.guest.display_name ||
      `${guestData.guest.first_name} ${guestData.guest.last_name}`;
    const plusOnesCount = rsvpData.plusOnes?.length || 0;
    const imageUrl =
      rsvpData.status === 'yes' ? event?.rsvp_yes_image_url : event?.rsvp_no_image_url;

    const getMessage = () => {
      switch (rsvpData.status) {
        case 'yes':
          return { title: 'Thank you!', message: "We can't wait to celebrate with you!", icon: 'success' as const };
        case 'no':
          return { title: "We're sorry you can't make it", message: "Thank you for letting us know. We'll miss you!", icon: 'info' as const };
        case 'maybe':
          return { title: 'Thanks for letting us know', message: 'Please update your RSVP when you know for sure.', icon: 'info' as const };
        default:
          return { title: 'Thank you!', message: 'Your RSVP has been received.', icon: 'success' as const };
      }
    };

    const { title, message, icon } = getMessage();
    let html = `<p>${message}</p>`;
    if (rsvpData.status === 'yes') {
      html += `<p><strong>Guest:</strong> ${guestName}</p>`;
      if (plusOnesCount > 0) html += `<p><strong>Plus Ones:</strong> ${plusOnesCount}</p>`;
      if (mealChoice) html += `<p><strong>Meal Choice:</strong> ${mealChoice}</p>`;
    }

    await Swal.fire({
      ...getSwalConfig(),
      title,
      html,
      icon,
      imageUrl: imageUrl || undefined,
      imageWidth: imageUrl ? 400 : undefined,
      imageAlt: 'Confirmation',
      confirmButtonText: 'Close',
      showCancelButton: false,
    });

    setStep('lookup');
    setGuestData(null);
  };

  const guestAccommodations: any[] = guestData?.accommodations || [];

  return (
    <div className="rsvp-page">
      <TopNav />
      <div className="rsvp-container">
        {step === 'lookup' ? (
          <div className="rsvp-section">
            <h1>RSVP</h1>
            <p className="rsvp-subtitle">Please enter your invite code or name to continue</p>
            <GuestLookup onGuestFound={handleGuestFound} />
          </div>
        ) : (
          <div className="rsvp-section">
            <h1>
              RSVP for{' '}
              {guestData?.guest?.display_name ||
                `${guestData?.guest?.first_name} ${guestData?.guest?.last_name}`}
            </h1>
            <RSVPForm
              guest={guestData.guest}
              rsvp={guestData.rsvp}
              menuItems={event?.menu_enabled !== false ? guestData.menuItems : []}
              onSubmit={handleRSVPSubmit}
            />

            {/* Personalised accommodation section */}
            {guestAccommodations.length > 0 && (
              <div className="rsvp-accommodation-section">
                <div className="rsvp-accommodation-header">
                  <div className="rsvp-accommodation-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  </div>
                  <div>
                    <h2>Recommended Accommodation</h2>
                    <p>Accommodation options selected for your group</p>
                  </div>
                </div>
                <div className="rsvp-accommodation-grid">
                  {guestAccommodations.map((acc: any) => (
                    <AccommodationCard key={acc.id} acc={acc} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
