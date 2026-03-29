import React, { useState, useEffect } from 'react';
import { TopNav } from '../../components/layout/TopNav/TopNav';
import { getCurrentEventSlug } from '../../lib/eventResolver';
import { fetchPublicQA, fetchPublicEvent } from '../../lib/apiClient';
import { useEventStore, getThemeColors } from '../../state/useEventStore';
import './QA.css';

export const QA: React.FC = () => {
  const { event, setEvent } = useEventStore();
  const theme = getThemeColors(event);
  const [qaItems, setQaItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const init = async () => {
      try {
        const slug = getCurrentEventSlug();
        if (!event) {
          const eventData = await fetchPublicEvent(slug);
          setEvent(eventData);
        }
        const data = await fetchPublicQA(slug);
        setQaItems(data.qaItems || []);
      } catch (err) {
        console.error('Failed to load Q&A:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '37, 99, 235';
  };

  useEffect(() => {
    if (event) {
      const root = document.documentElement;
      root.style.setProperty('--theme-primary', theme.primary);
      root.style.setProperty('--theme-secondary', theme.secondary);
      root.style.setProperty('--theme-text', theme.text);
      root.style.setProperty('--theme-background', theme.background);
      root.style.setProperty('--theme-accent', theme.accent);
      root.style.setProperty('--theme-accent-rgb', hexToRgb(theme.accent));
      root.style.setProperty('--theme-container', theme.container);
      root.style.setProperty('--theme-container-rgb', hexToRgb(theme.container));
      document.body.style.backgroundColor = theme.background;
    }
  }, [event, theme]);

  const toggleItem = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="qa-page">
        <TopNav />
        <div className="qa-container">
          <div className="qa-loading">
            <div className="qa-spinner" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="qa-page">
      <TopNav />
      <div className="qa-container">
        <div className="qa-header">
          <h1>Frequently Asked Questions</h1>
          {event?.title && (
            <p className="qa-subtitle">
              Common questions about {event.title}
            </p>
          )}
        </div>

        {qaItems.length === 0 ? (
          <div className="qa-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p>No questions yet. Check back soon!</p>
          </div>
        ) : (
          <div className="qa-accordion">
            {qaItems.map((item, index) => {
              const isOpen = openIds.has(item.id);
              return (
                <div
                  key={item.id}
                  className={`qa-item ${isOpen ? 'open' : ''}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <button
                    className="qa-item-trigger"
                    onClick={() => toggleItem(item.id)}
                    aria-expanded={isOpen}
                  >
                    <span className="qa-item-topic">{item.topic}</span>
                    <span className="qa-item-chevron">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`chevron-icon ${isOpen ? 'rotated' : ''}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </button>
                  <div className="qa-item-body">
                    <div className="qa-item-content">
                      <p>{item.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
