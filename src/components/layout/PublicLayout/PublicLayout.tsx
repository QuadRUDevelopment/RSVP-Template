import React from 'react';
import { Outlet } from 'react-router-dom';
import './PublicLayout.css';

export const PublicLayout: React.FC = () => {
  return (
    <div className="public-layout">
      <Outlet />
    </div>
  );
};

