import React, { useEffect, useState } from 'react';
import { TopNav } from '../../components/layout/TopNav/TopNav';
import { Card } from '../../components/ui/Card/Card';
import { getCurrentEventSlug } from '../../lib/eventResolver';
import { fetchPublicMenu, fetchPublicEvent } from '../../lib/apiClient';
import { useEventStore } from '../../state/useEventStore';
import { applyTheme } from '../../lib/applyTheme';
import './Menu.css';

export const Menu: React.FC = () => {
  const { event, setEvent } = useEventStore();
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load event data if not already loaded
  useEffect(() => {
    const loadEvent = async () => {
      if (!event) {
        try {
          const slug = getCurrentEventSlug();
          const eventData = await fetchPublicEvent(slug);
          setEvent(eventData);
        } catch (err) {
          console.error('Failed to load event:', err);
        }
      }
    };
    loadEvent();
  }, [event, setEvent]);

  // Check if menu feature is disabled
  if (event && event.menu_enabled === false) {
    return (
      <div className="menu-page">
        <TopNav />
        <div className="menu-container">
          <Card className="menu-section">
            <h1>Spyskaart</h1>
            <p>Hierdie afdeling is nie beskikbaar vir hierdie geleentheid nie.</p>
          </Card>
        </div>
      </div>
    );
  }

  useEffect(() => { applyTheme(event); }, [event]);

  useEffect(() => {
    const loadMenu = async () => {
      setLoading(true);
      setError(null);
      try {
        const slug = getCurrentEventSlug();
        const result = await fetchPublicMenu(slug);
        setMenuItems(result.menuItems || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadMenu();
  }, []);

  // Group menu items by category
  const groupedMenu = menuItems.reduce((acc: Record<string, any[]>, item: any) => {
    const category = item.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  if (loading) {
    return (
      <div className="menu-page">
        <TopNav />
        <div className="menu-loading">Loading menu...</div>
      </div>
    );
  }

  return (
    <div className="menu-page">
      <TopNav />
      <div className="menu-container">
        <h1>Spyskaart</h1>
        {error ? (
          <Card>
            <p>Unable to load menu at this time.</p>
          </Card>
        ) : Object.keys(groupedMenu).length === 0 ? (
          <Card>
            <p>Spyskaart inligting sal binnekort beskikbaar wees.</p>
          </Card>
        ) : (
          <div className="menu-sections">
            {Object.entries(groupedMenu).map(([category, items]) => (
              <div key={category} className="menu-section">
                <h2 className="menu-category">{category}</h2>
                <div className="menu-items">
                  {items.map((item) => (
                    <Card key={item.id} className="menu-item">
                      <h3>{item.name}</h3>
                      {item.description && (
                        <p className="menu-description">{item.description}</p>
                      )}
                      {item.diet_tags && item.diet_tags.length > 0 && (
                        <div className="diet-tags">
                          {item.diet_tags.map((tag: string, idx: number) => (
                            <span key={idx} className="diet-tag">{tag}</span>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

