import React, { useEffect, useState } from 'react';
import { TopNav } from '../../components/layout/TopNav/TopNav';
import { Card } from '../../components/ui/Card/Card';
import { getCurrentEventSlug } from '../../lib/eventResolver';
import { fetchPublicTimeline } from '../../lib/apiClient';
import './Schedule.css';

export const Schedule: React.FC = () => {
  const [timelineItems, setTimelineItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSchedule = async () => {
      setLoading(true);
      setError(null);
      try {
        const slug = getCurrentEventSlug();
        const result = await fetchPublicTimeline(slug);
        setTimelineItems(result.timelineItems || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, []);

  if (loading) {
    return (
      <div className="schedule-page">
        <TopNav />
        <div className="schedule-loading">Loading schedule...</div>
      </div>
    );
  }

  return (
    <div className="schedule-page">
      <TopNav />
      <div className="schedule-container">
        <h1>Schedule</h1>
        {error ? (
          <Card>
            <p>Unable to load schedule at this time.</p>
          </Card>
        ) : timelineItems.length === 0 ? (
          <Card>
            <p>Schedule information will be available soon.</p>
          </Card>
        ) : (
          <div className="timeline">
            {timelineItems.map((item) => (
              <div key={item.id} className="timeline-item">
                <div className="timeline-marker" />
                <Card className="timeline-content">
                  <div className="timeline-time">{item.time}</div>
                  <h3 className="timeline-title">{item.title}</h3>
                  {item.location && (
                    <div className="timeline-location">📍 {item.location}</div>
                  )}
                  {item.notes && (
                    <p className="timeline-notes">{item.notes}</p>
                  )}
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

