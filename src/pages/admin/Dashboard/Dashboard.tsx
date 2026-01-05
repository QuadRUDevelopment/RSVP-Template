import React, { useEffect, useState } from 'react';
import { StatCard } from '../../../components/ui/StatCard/StatCard';
import { getCurrentEventSlug } from '../../../lib/eventResolver';
import { adminRequest } from '../../../lib/apiClient';
import { useAdminAuth } from '../../../state/useAdminAuth';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const { token } = useAdminAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!token) return;
      
      setLoading(true);
      try {
        const slug = getCurrentEventSlug();
        const data = await adminRequest(
          `admin-dashboard?slug=${encodeURIComponent(slug)}`,
          { method: 'GET' },
          token
        );
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [token]);

  if (loading) {
    return <div className="dashboard-loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="stats-grid">
        <StatCard
          title="Total Guests"
          value={stats?.totalGuests || 0}
        />
        <StatCard
          title="Total Submissions"
          value={stats?.totalSubmissions || 0}
        />
        <StatCard
          title="Not Submitted"
          value={stats?.notSubmitted || 0}
        />
        <StatCard
          title="Attending (Yes)"
          value={stats?.attendingYes || 0}
        />
        <StatCard
          title="Not Attending (No)"
          value={stats?.attendingNo || 0}
        />
        <StatCard
          title="Maybe"
          value={stats?.maybe || 0}
        />
        <StatCard
          title="Total Headcount"
          value={stats?.totalHeadcount || 0}
          subtitle="Including plus ones"
        />
      </div>
    </div>
  );
};

