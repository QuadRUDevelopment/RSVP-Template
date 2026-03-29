import React, { useEffect, useState } from 'react';
import { TopNav } from '../../components/layout/TopNav/TopNav';
import { Card } from '../../components/ui/Card/Card';
import { getCurrentEventSlug } from '../../lib/eventResolver';
import { fetchPublicTimeline, fetchPublicEvent } from '../../lib/apiClient';
import { useEventStore } from '../../state/useEventStore';
import { applyTheme } from '../../lib/applyTheme';
import './Schedule.css';

export const Schedule: React.FC = () => {
  const { event, setEvent } = useEventStore();
  const [timelineItems, setTimelineItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { applyTheme(event); }, [event]);

  // Check if schedule feature is disabled
  if (event && event.schedule_enabled === false) {
    return (
      <div className="schedule-page">
        <TopNav />
        <div className="schedule-container">
          <Card className="schedule-section">
            <h1>Skedule</h1>
            <p>Hierdie afdeling is nie beskikbaar vir hierdie geleentheid nie.</p>
          </Card>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const loadSchedule = async () => {
      setLoading(true);
      setError(null);
      try {
        const slug = getCurrentEventSlug();
        
        // Load event data if not already loaded
        if (!event) {
          const eventData = await fetchPublicEvent(slug);
          setEvent(eventData);
        }
        
        // Load timeline
        const result = await fetchPublicTimeline(slug);
        setTimelineItems(result.timelineItems || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, [event, setEvent]);

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
        <h1>Skedule</h1>
        {error ? (
          <Card>
            <p>Unable to load schedule at this time.</p>
          </Card>
        ) : timelineItems.length === 0 ? (
          <Card>
            <p>Skedule inligting sal binnekort beskikbaar wees.</p>
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

