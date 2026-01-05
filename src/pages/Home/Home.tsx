import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timeline } from 'primereact/timeline';
import { useEventStore, getThemeColors } from '../../state/useEventStore';
import { getCurrentEventSlug } from '../../lib/eventResolver';
import { fetchPublicEvent, fetchPublicGallery, fetchPublicTimeline } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button/Button';
import { TopNav } from '../../components/layout/TopNav/TopNav';
import { ScrollCarousel } from '../../components/gallery/ScrollCarousel/ScrollCarousel';
import './Home.css';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { event, setEvent, setLoading, setError } = useEventStore();
  const slug = getCurrentEventSlug();
  const [galleryImages, setGalleryImages] = useState<Array<{ id: string; url: string; caption?: string }>>([]);
  const [timelineItems, setTimelineItems] = useState<any[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const storyRef = useRef<HTMLDivElement>(null);
  const venueRef = useRef<HTMLDivElement>(null);
  const scheduleRef = useRef<HTMLDivElement>(null);
  const rsvpRef = useRef<HTMLDivElement>(null);

  // Helper to convert hex to RGB
  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '37, 99, 235'; // Default blue
  };

  // Apply theme colors to CSS variables
  useEffect(() => {
    if (event) {
      const theme = getThemeColors(event);
      const root = document.documentElement;
      root.style.setProperty('--theme-primary', theme.primary);
      root.style.setProperty('--theme-secondary', theme.secondary);
      root.style.setProperty('--theme-text', theme.text);
      root.style.setProperty('--theme-background', theme.background);
      root.style.setProperty('--theme-accent', theme.accent);
      root.style.setProperty('--theme-accent-rgb', hexToRgb(theme.accent));
      root.style.setProperty('--theme-container', theme.container);
      root.style.setProperty('--theme-container-rgb', hexToRgb(theme.container));
      root.style.setProperty('--theme-nav-font-color', theme.navFontColor);
      root.style.setProperty('--theme-nav-font-size', `${theme.navFontSize}rem`);
      
      // Also set background color on body/html
      document.body.style.backgroundColor = theme.background;
    }
  }, [event]);

  // Helper function to get section styles
  const getSectionStyles = (sectionKey: string): React.CSSProperties => {
    const section = event?.section_backgrounds?.[sectionKey] || {};
    const styles: React.CSSProperties = {};
    
    // Background image
    if (section.background_image_url) {
      styles.backgroundImage = `url(${section.background_image_url})`;
      styles.backgroundSize = 'cover';
      styles.backgroundPosition = 'center';
      styles.backgroundRepeat = 'no-repeat';
    }
    
    // Background color (fallback or primary)
    if (section.background_color) {
      styles.backgroundColor = section.background_color;
    }
    
    return styles;
  };

  // Helper function to get overlay styles
  const getOverlayStyles = (sectionKey: string): React.CSSProperties | null => {
    const section = event?.section_backgrounds?.[sectionKey] || {};
    
    if (section.overlay_enabled && section.overlay_color) {
      const opacity = section.overlay_opacity !== undefined ? section.overlay_opacity : 0.4;
      const color = section.overlay_color;
      
      // Convert hex to rgba if needed
      let rgbaColor = color;
      if (color.startsWith('#')) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        rgbaColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
      } else if (color.startsWith('rgb')) {
        // If it's already rgb, convert to rgba
        rgbaColor = color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
      }
      
      return {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: rgbaColor,
        zIndex: 0,
      };
    }
    
    return null;
  };

  useEffect(() => {
    const loadEvent = async () => {
      setLoading(true);
      setError(null);
      try {
        const eventData = await fetchPublicEvent(slug);
        setEvent(eventData);
        
        // Load gallery images
        try {
          const galleryData = await fetchPublicGallery(slug);
          const images = (galleryData.galleryItems || []).map((item: any) => ({
            id: item.id,
            url: item.url,
            caption: item.caption,
          }));
          setGalleryImages(images);
        } catch (galleryErr) {
          console.error('Failed to load gallery:', galleryErr);
          // Don't fail the whole page if gallery fails
        }

        // Load schedule if enabled
        if (eventData.schedule_enabled !== false) {
          try {
            setScheduleLoading(true);
            const timelineData = await fetchPublicTimeline(slug);
            setTimelineItems(timelineData.timelineItems || []);
          } catch (scheduleErr) {
            console.error('Failed to load schedule:', scheduleErr);
          } finally {
            setScheduleLoading(false);
          }
        }
      } catch (err: any) {
        setError(err.message);
        console.error('Failed to load event:', err);
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [slug, setEvent, setLoading, setError]);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (useEventStore.getState().loading) {
    return (
      <div className="home-loading">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="home-story">
      <TopNav />
      
      {/* Section 1: Banner Image */}
      <section 
        className="story-section banner-section"
        style={getSectionStyles('banner')}
      >
        {getOverlayStyles('banner') && (
          <div className="section-overlay" style={getOverlayStyles('banner') || {}} />
        )}
        {/* Fallback to hero_image_url if no section background is set */}
        {!event?.section_backgrounds?.banner?.background_image_url && event?.hero_image_url && (
          <div className="banner-overlay" />
        )}
        <div className="banner-content">
          {event?.title && <h1 className="banner-title">{event.title}</h1>}
          <div className="scroll-indicator" onClick={() => scrollToSection(storyRef)}>
            <span>Scroll down</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      </section>

      {/* Section 2: Our Story - Gallery on left, Story text on right */}
      {(galleryImages.length > 0 || event?.story_text) && (
        <section 
          ref={storyRef} 
          className="story-section story-section-with-gallery"
          style={getSectionStyles('story')}
        >
          {getOverlayStyles('story') && (
            <div className="section-overlay" style={getOverlayStyles('story') || {}} />
          )}
          <div className="section-content story-content-split">
            {/* Gallery Carousel on left */}
            {galleryImages.length > 0 && (
              <div className="story-gallery-left">
              <ScrollCarousel
                images={galleryImages}
              />
              </div>
            )}
            {/* Story text on right */}
            {event?.story_text && (
              <div className="story-text-right">
                <h2 className="section-title">Ons Storie</h2>
                <div className="story-text">
                  {event.story_text}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Section 3: Venue */}
      <section 
        ref={venueRef} 
        className="story-section venue-section"
        style={getSectionStyles('venue')}
      >
        {getOverlayStyles('venue') && (
          <div className="section-overlay" style={getOverlayStyles('venue') || {}} />
        )}
        <div className="section-content">
          <h2 className="section-title">Plek</h2>
          <div className="venue-content">
            {event?.venue_name && (
              <h3 className="venue-name">{event.venue_name}</h3>
            )}
            {event?.venue_text && (
              <p className="venue-text">{event.venue_text}</p>
            )}
            {event?.venue_address && (
              <div className="venue-address">
                <strong>📍 Address:</strong> {event.venue_address}
              </div>
            )}
            {event?.venue_map_url && (
              <div className="venue-map">
                <iframe
                  src={event.venue_map_url}
                  width="100%"
                  height="400"
                  style={{ border: 0, borderRadius: '0.5rem' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Venue Location"
                />
              </div>
            )}
            {!event?.venue_text && !event?.venue_address && (
              <p className="venue-placeholder">Plek inligting sal binnekort beskikbaar wees.</p>
            )}
            <Button 
              variant="outline" 
              size="medium"
              onClick={() => navigate('/venue')}
              style={{ marginTop: '1.5rem' }}
            >
              Bekyk Volledige Plek Besonderhede
            </Button>
          </div>
        </div>
      </section>

      {/* Section 4: Schedule (if enabled) */}
      {event?.schedule_enabled !== false && (
        <section 
          ref={scheduleRef} 
          className="story-section schedule-section"
          style={getSectionStyles('schedule')}
        >
          {getOverlayStyles('schedule') && (
            <div className="section-overlay" style={getOverlayStyles('schedule') || {}} />
          )}
          <div className="section-content">
            <h2 className="section-title">Skedule</h2>
            {scheduleLoading ? (
              <div className="section-loading">Loading schedule...</div>
            ) : timelineItems.length === 0 ? (
              <div className="section-empty">Skedule inligting sal binnekort beskikbaar wees.</div>
            ) : (
              <div className="timeline-container">
                <Timeline
                  value={timelineItems.map((item, index) => ({
                    id: item.id,
                    time: item.time,
                    title: item.title,
                    isEven: index % 2 === 1, // Track if it's an even index (second, fourth, etc.)
                  }))}
                  layout="horizontal"
                  content={(item) => (
                    <div className={`timeline-event ${item.isEven ? 'timeline-event-reversed' : ''}`}>
                      <div className="timeline-time">{item.time}</div>
                      <div className="timeline-title">{item.title}</div>
                    </div>
                  )}
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Section 5: RSVP */}
      <section 
        ref={rsvpRef} 
        className="story-section rsvp-section"
        style={getSectionStyles('rsvp')}
      >
        {getOverlayStyles('rsvp') && (
          <div className="section-overlay" style={getOverlayStyles('rsvp') || {}} />
        )}
        <div className="section-content">
          <h2 className="section-title">RSVP</h2>
          <div className="rsvp-content">
            {event?.invitation_text && (
              <div className="invitation-text">
                {event.invitation_text}
              </div>
            )}
            {event?.wedding_date && (
              <div className="rsvp-details">
                <div className="rsvp-detail-item">
                  <div className="rsvp-detail-icon">📅</div>
                  <div className="rsvp-detail-label">Date</div>
                  <div className="rsvp-detail-value">
                    {new Date(event.wedding_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                {event?.dress_code && (
                  <div className="rsvp-detail-item">
                    <div className="rsvp-detail-icon">👔</div>
                    <div className="rsvp-detail-label">Dress Code</div>
                    <div className="rsvp-detail-value">{event.dress_code}</div>
                  </div>
                )}
              </div>
            )}
            <Button 
              variant="primary" 
              size="large"
              onClick={() => navigate('/rsvp')}
              className="rsvp-button"
            >
              RSVP Now
            </Button>
            {event?.guest_message && (
              <div className="guest-message">
                {event.guest_message}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
