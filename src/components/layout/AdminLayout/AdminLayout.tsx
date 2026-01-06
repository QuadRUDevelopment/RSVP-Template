import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../../state/useAdminAuth';
import { useEventStore } from '../../../state/useEventStore';
import './AdminLayout.css';

export const AdminLayout: React.FC = () => {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const { event } = useEventStore();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Admin</h2>
        </div>
        <nav className="sidebar-nav">
          <Link to="/admin/dashboard" className="nav-item">Dashboard</Link>
          <Link to="/admin/guests" className="nav-item">Guests</Link>
          {event?.accommodation_enabled !== false && (
            <Link to="/admin/accommodation" className="nav-item">Accommodation</Link>
          )}
          {event?.menu_enabled !== false && (
            <Link to="/admin/menu" className="nav-item">Menu</Link>
          )}
          {event?.schedule_enabled !== false && (
            <Link to="/admin/timeline" className="nav-item">Timeline</Link>
          )}
          {event?.gift_registry_enabled === true && (
            <Link to="/admin/gift-registry" className="nav-item">Gift Registry</Link>
          )}
          <Link to="/admin/gallery" className="nav-item">Gallery</Link>
          <Link to="/admin/groups" className="nav-item">Groups</Link>
          <Link to="/admin/custom-fields" className="nav-item">Custom RSVP Fields</Link>
          <Link to="/admin/settings" className="nav-item">Settings</Link>
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

