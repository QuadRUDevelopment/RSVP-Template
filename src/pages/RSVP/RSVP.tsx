import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { getSwalConfig } from '../../lib/sweetalert2Config';
import { GuestLookup } from '../../components/rsvp/GuestLookup/GuestLookup';
import { RSVPForm } from '../../components/rsvp/RSVPForm/RSVPForm';
import { TopNav } from '../../components/layout/TopNav/TopNav';
import { submitRSVP } from '../../lib/apiClient';
import { getCurrentEventSlug } from '../../lib/eventResolver';
import { useEventStore } from '../../state/useEventStore';
import './RSVP.css';

export const RSVP: React.FC = () => {
  const [step, setStep] = useState<'lookup' | 'form'>('lookup');
  const [guestData, setGuestData] = useState<any>(null);
  const { event } = useEventStore();

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

    // Get meal choice name
    const mealChoice = guestData.menuItems?.find(
      (item: any) => item.id === rsvpData.mealChoiceId
    )?.name;

    const guestName = guestData.guest.display_name || 
                `${guestData.guest.first_name} ${guestData.guest.last_name}`;
    const plusOnesCount = rsvpData.plusOnes?.length || 0;
    const imageUrl = rsvpData.status === 'yes' 
      ? event?.rsvp_yes_image_url 
      : event?.rsvp_no_image_url;

    // Show confirmation with SweetAlert2
    const getMessage = () => {
      switch (rsvpData.status) {
        case 'yes':
          return {
            title: "Thank you!",
            message: "We can't wait to celebrate with you!",
            icon: 'success' as const,
          };
        case 'no':
          return {
            title: "We're sorry you can't make it",
            message: "Thank you for letting us know. We'll miss you!",
            icon: 'info' as const,
          };
        case 'maybe':
          return {
            title: "Thanks for letting us know",
            message: "Please update your RSVP when you know for sure.",
            icon: 'info' as const,
          };
        default:
          return {
            title: "Thank you!",
            message: "Your RSVP has been received.",
            icon: 'success' as const,
          };
      }
    };

    const { title, message, icon } = getMessage();
    let html = `<p>${message}</p>`;
    
    if (rsvpData.status === 'yes') {
      html += `<p><strong>Guest:</strong> ${guestName}</p>`;
      if (plusOnesCount > 0) {
        html += `<p><strong>Plus Ones:</strong> ${plusOnesCount}</p>`;
      }
      if (mealChoice) {
        html += `<p><strong>Meal Choice:</strong> ${mealChoice}</p>`;
      }
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

    // Reset form
    setStep('lookup');
    setGuestData(null);
  };

  return (
    <div className="rsvp-page">
      <TopNav />
      <div className="rsvp-container">
        {step === 'lookup' ? (
          <div className="rsvp-section">
            <h1>RSVP</h1>
            <p className="rsvp-subtitle">
              Please enter your invite code or name to continue
            </p>
            <GuestLookup onGuestFound={handleGuestFound} />
          </div>
        ) : (
          <div className="rsvp-section">
            <h1>RSVP for {guestData?.guest?.display_name || 
              `${guestData?.guest?.first_name} ${guestData?.guest?.last_name}`}</h1>
            <RSVPForm
              guest={guestData.guest}
              rsvp={guestData.rsvp}
              menuItems={guestData.menuItems}
              onSubmit={handleRSVPSubmit}
            />
          </div>
        )}
      </div>
    </div>
  );
};

