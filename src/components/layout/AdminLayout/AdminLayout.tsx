import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../../state/useAdminAuth';
import { useEventStore } from '../../../state/useEventStore';
import './AdminLayout.css';

export const AdminLayout: React.FC = () => {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { event } = useEventStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="admin-layout">
      {/* Mobile menu button */}
      <button 
        className="mobile-menu-toggle"
        onClick={toggleMobileMenu}
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

      {/* Overlay for mobile */}
      {mobileMenuOpen && <div className="sidebar-overlay" onClick={() => setMobileMenuOpen(false)} />}

      <aside 
        ref={sidebarRef}
        className={`admin-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}
      >
        <div className="sidebar-header">
          <h2>Admin</h2>
        </div>
        <nav className="sidebar-nav">
          <Link 
            to="/admin/dashboard" 
            className={`nav-item ${isActive('/admin/dashboard') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Dashboard
          </Link>
          <Link 
            to="/admin/guests" 
            className={`nav-item ${isActive('/admin/guests') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Guests
          </Link>
          {event?.accommodation_enabled !== false && (
            <Link 
              to="/admin/accommodation" 
              className={`nav-item ${isActive('/admin/accommodation') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Accommodation
            </Link>
          )}
          {event?.menu_enabled !== false && (
            <Link 
              to="/admin/menu" 
              className={`nav-item ${isActive('/admin/menu') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Menu
            </Link>
          )}
          {event?.schedule_enabled !== false && (
            <Link 
              to="/admin/timeline" 
              className={`nav-item ${isActive('/admin/timeline') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Timeline
            </Link>
          )}
          {event?.gift_registry_enabled === true && (
            <Link 
              to="/admin/gift-registry" 
              className={`nav-item ${isActive('/admin/gift-registry') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Gift Registry
            </Link>
          )}
          <Link 
            to="/admin/gallery" 
            className={`nav-item ${isActive('/admin/gallery') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Gallery
          </Link>
          <Link 
            to="/admin/groups" 
            className={`nav-item ${isActive('/admin/groups') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Groups
          </Link>
          <Link 
            to="/admin/custom-fields" 
            className={`nav-item ${isActive('/admin/custom-fields') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Custom RSVP Fields
          </Link>
          <Link 
            to="/admin/settings" 
            className={`nav-item ${isActive('/admin/settings') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Settings
          </Link>
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};

