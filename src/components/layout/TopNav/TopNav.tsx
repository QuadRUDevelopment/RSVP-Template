import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useEventStore, getThemeColors } from '../../../state/useEventStore';
import { CountdownTimer } from '../../ui/CountdownTimer/CountdownTimer';
import './TopNav.css';

export const TopNav: React.FC = () => {
  const location = useLocation();
  const { event } = useEventStore();
  const theme = getThemeColors(event);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const scrollTimeoutRef = useRef<number | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }

      // Hide nav when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down and past 100px
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up
        setIsVisible(true);
      }

      // Show nav when scrolling stops
      scrollTimeoutRef.current = window.setTimeout(() => {
        setIsVisible(true);
      }, 150); // Show after 150ms of no scrolling

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [lastScrollY]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navLinks = [
    { path: '/accommodation', label: 'Accommodations' },
    { path: '/venue', label: 'Venue' },
    ...(event?.menu_enabled !== false ? [{ path: '/menu', label: 'Menu' }] : []),
    ...(event?.schedule_enabled !== false ? [{ path: '/schedule', label: 'Schedule' }] : []),
  ];

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav 
      className={`top-nav ${isVisible ? 'nav-visible' : 'nav-hidden'}`}
      style={{ 
        '--theme-primary': theme.primary, 
        '--theme-accent': theme.accent, 
        '--theme-text': theme.text,
        '--theme-nav-font-color': theme.navFontColor,
        '--theme-nav-font-size': `${theme.navFontSize}rem`,
      } as React.CSSProperties}
    >
      <div className="nav-container">
        {/* Desktop: Countdown on left */}
        <div className="nav-left" style={{ color: theme.navFontColor }}>
          {event?.wedding_date && (
            <CountdownTimer targetDate={event.wedding_date} />
          )}
        </div>

        {/* Mobile: Dropdown menu on left */}
        <div className="nav-mobile-menu" ref={menuRef}>
          <button
            className="mobile-menu-button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" />
              )}
            </svg>
          </button>
          {mobileMenuOpen && (
            <div className="mobile-menu-dropdown">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`mobile-menu-link ${isActive(link.path) ? 'active' : ''}`}
                  onClick={handleLinkClick}
                  style={{ '--theme-primary': theme.primary } as React.CSSProperties}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Mobile: Countdown in middle (if enabled) */}
        <div className="nav-mobile-countdown" style={{ color: theme.navFontColor }}>
          {event?.wedding_date && (
            <CountdownTimer targetDate={event.wedding_date} />
          )}
        </div>

        {/* Home logo in center */}
        <Link to="/" className="nav-logo" style={{ color: theme.navFontColor }} onClick={handleLinkClick}>
          Home
        </Link>

        {/* Desktop: Nav links on right */}
        <div className="nav-links">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
              style={{ '--theme-primary': theme.primary } as React.CSSProperties}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

