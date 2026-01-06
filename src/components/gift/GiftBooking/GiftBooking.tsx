import React, { useState, useEffect } from 'react';
import { GuestLookup } from '../../rsvp/GuestLookup/GuestLookup';
import { Button } from '../../ui/Button/Button';
import { Card } from '../../ui/Card/Card';
import { getCurrentEventSlug } from '../../../lib/eventResolver';
import { getGuestGiftBookings, bookGift, releaseGift } from '../../../lib/apiClient';
import { useEventStore } from '../../../state/useEventStore';
import Swal from 'sweetalert2';
import { getSwalConfig, createSuccessModal, createErrorModal } from '../../../lib/sweetalert2Config';
import './GiftBooking.css';

interface GiftBookingProps {
  gifts: Array<{
    id: string;
    name: string;
    description?: string;
    url?: string;
    booked: boolean;
  }>;
  onBookingChanged: () => void;
}

export const GiftBooking: React.FC<GiftBookingProps> = ({ gifts, onBookingChanged }) => {
  const { event } = useEventStore();
  const [step, setStep] = useState<'lookup' | 'select'>('lookup');
  const [guestData, setGuestData] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [maxGiftsPerGuest, setMaxGiftsPerGuest] = useState(1);
  const [remainingGifts, setRemainingGifts] = useState(1);
  const [selectedGiftId, setSelectedGiftId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGuestFound = async (data: any) => {
    setGuestData(data);
    setStep('select');
    await loadBookings(data.guest);
  };

  const loadBookings = async (guest: any) => {
    setLoading(true);
    try {
      const slug = getCurrentEventSlug();
      const result = await getGuestGiftBookings(
        slug,
        guest.invite_code,
        guest.first_name,
        guest.last_name
      );
      setBookings(result.bookings || []);
      setMaxGiftsPerGuest(result.maxGiftsPerGuest || 1);
      setRemainingGifts(result.remainingGifts || 0);
    } catch (err: any) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookGift = async () => {
    if (!selectedGiftId || !guestData) return;

    setLoading(true);
    try {
      const slug = getCurrentEventSlug();
      await bookGift(
        slug,
        selectedGiftId,
        guestData.guest.invite_code,
        guestData.guest.first_name,
        guestData.guest.last_name
      );
      await createSuccessModal('Success!', 'Gift booked successfully.');
      await loadBookings(guestData.guest);
      setSelectedGiftId(null);
      onBookingChanged();
    } catch (err: any) {
      await createErrorModal('Error', err.message || 'Failed to book gift');
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseGift = async (giftId: string) => {
    if (!guestData) return;

    const result = await Swal.fire({
      ...getSwalConfig(),
      title: 'Release Gift?',
      text: 'This will make the gift available for booking again.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, release it',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        const slug = getCurrentEventSlug();
        await releaseGift(
          slug,
          giftId,
          guestData.guest.invite_code,
          guestData.guest.first_name,
          guestData.guest.last_name
        );
        await createSuccessModal('Success!', 'Gift released successfully.');
        await loadBookings(guestData.guest);
        onBookingChanged();
      } catch (err: any) {
        await createErrorModal('Error', err.message || 'Failed to release gift');
      } finally {
        setLoading(false);
      }
    }
  };

  const availableGifts = gifts.filter(gift => !gift.booked || bookings.some(b => b.gift_id === gift.id));

  if (step === 'lookup') {
    return (
      <div className="gift-booking">
        <Card className="gift-booking-card">
          <h2>Book a Gift</h2>
          <p>Please identify yourself to book a gift from the registry.</p>
          <GuestLookup onGuestFound={handleGuestFound} />
        </Card>
      </div>
    );
  }

  return (
    <div className="gift-booking">
      <Card className="gift-booking-card">
        <div className="gift-booking-header">
          <h2>Book a Gift</h2>
          <button 
            onClick={() => {
              setStep('lookup');
              setGuestData(null);
              setBookings([]);
              setSelectedGiftId(null);
            }}
            className="change-guest-btn"
          >
            Change Guest
          </button>
        </div>

        {maxGiftsPerGuest > 1 && (
          <div className="booking-status">
            <p>You have booked <strong>{bookings.length}</strong> of <strong>{maxGiftsPerGuest}</strong> gifts.</p>
          </div>
        )}

        {bookings.length > 0 && (
          <div className="current-bookings">
            <h3>Your Current Bookings</h3>
            {bookings.map((booking) => {
              const gift = gifts.find(g => g.id === booking.gift_id);
              if (!gift) return null;
              return (
                <div key={booking.id} className="booking-item">
                  <div>
                    <strong>{gift.name}</strong>
                    {gift.description && <p>{gift.description}</p>}
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => handleReleaseGift(gift.id)}
                    disabled={loading}
                  >
                    Release
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {remainingGifts > 0 ? (
          <div className="available-gifts">
            <h3>Available Gifts</h3>
            {availableGifts.length === 0 ? (
              <p>No gifts available at the moment.</p>
            ) : (
              <div className="gifts-list">
                {availableGifts.map((gift) => {
                  const isBooked = bookings.some(b => b.gift_id === gift.id);
                  const isSelected = selectedGiftId === gift.id;
                  return (
                    <div
                      key={gift.id}
                      className={`gift-item ${isSelected ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
                      onClick={() => !isBooked && setSelectedGiftId(gift.id)}
                    >
                      <div className="gift-info">
                        <h4>{gift.name}</h4>
                        {gift.description && <p>{gift.description}</p>}
                        {gift.url && (
                          <a href={gift.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                            View Registry →
                          </a>
                        )}
                        {isBooked && <span className="booked-badge">Already Booked</span>}
                      </div>
                      {isSelected && !isBooked && (
                        <div className="selected-indicator">✓ Selected</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {selectedGiftId && (
              <div className="book-actions">
                <Button
                  variant="primary"
                  onClick={handleBookGift}
                  disabled={loading}
                >
                  {loading ? 'Booking...' : 'Book Gift'}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="limit-reached">
            <p>You've reached your gift limit ({maxGiftsPerGuest} gift{maxGiftsPerGuest > 1 ? 's' : ''}).</p>
            {maxGiftsPerGuest === 1 && bookings.length > 0 && (
              <p>Release your current booking to select a different gift.</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

