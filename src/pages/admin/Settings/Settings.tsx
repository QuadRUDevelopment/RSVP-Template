import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Card } from '../../../components/ui/Card/Card';
import { Button } from '../../../components/ui/Button/Button';
import { ImageUpload } from '../../../components/ui/ImageUpload/ImageUpload';
import { getCurrentEventSlug } from '../../../lib/eventResolver';
import { adminRequest } from '../../../lib/apiClient';
import { useAdminAuth } from '../../../state/useAdminAuth';
import { useEventStore } from '../../../state/useEventStore';
import './Settings.css';

export const Settings: React.FC = () => {
  const { token } = useAdminAuth();
  const { setEvent } = useEventStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    const loadSettings = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const slug = getCurrentEventSlug();
        const data = await adminRequest(
          `admin-settings?slug=${encodeURIComponent(slug)}`,
          { method: 'GET' },
          token
        );
        // If event doesn't exist, initialize with current slug
        if (!data || !data.slug) {
          setFormData({ slug: slug });
        } else {
          setFormData(data);
          setEvent(data);
        }
      } catch (err: any) {
        // If event not found, initialize with current slug for creation
        if (err.message?.includes('not found') || err.message?.includes('404')) {
          const slug = getCurrentEventSlug();
          setFormData({ slug: slug });
        } else {
          console.error('Failed to load settings:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [token, setEvent]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      // Use the slug from formData if it exists, otherwise use current slug from subdomain
      const slug = formData.slug || getCurrentEventSlug();
      
      // Ensure slug is set
      if (!slug) {
        const { createErrorModal } = await import('../../../lib/sweetalert2Config');
        await createErrorModal('Error', 'Event slug is required. Please access the admin panel via a subdomain (e.g., your-event.quadrursvp.co.za)');
        setSaving(false);
        return;
      }

      const updated = await adminRequest(
        'admin-settings',
        {
          method: 'POST',
          body: JSON.stringify({ slug, ...formData }),
        },
        token
      );
      setEvent(updated);
      const { createSuccessModal } = await import('../../../lib/sweetalert2Config');
      await createSuccessModal('Success!', 'Settings saved successfully.');
    } catch (err: any) {
      const { createErrorModal } = await import('../../../lib/sweetalert2Config');
      await createErrorModal('Error', `Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="settings-loading">Loading settings...</div>;
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Event Settings</h1>
        <Button onClick={handleSave} disabled={saving} variant="primary">
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <div className="settings-grid">
        <Card className="settings-section">
          <h2>Site General</h2>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
            Configure your site's general appearance and branding.
          </p>
          <div className="form-group">
            <label>Site Name (Browser Tab Title)</label>
            <input
              type="text"
              value={formData.site_name || ''}
              onChange={(e) => handleChange('site_name', e.target.value)}
              placeholder="My Wedding Celebration"
              maxLength={60}
            />
            <small>
              This appears in the browser tab. Recommended: 50-60 characters. 
              Current length: {formData.site_name?.length || 0}/60
            </small>
          </div>
          <div className="form-group">
            <ImageUpload
              currentImageUrl={formData.site_icon_url}
              onUpload={async (url) => handleChange('site_icon_url', url)}
              folder="site"
              label="Site Icon / Favicon"
            />
            <small>
              <strong>Image Requirements:</strong>
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', fontSize: '0.875rem' }}>
                <li>Recommended size: 32x32px or 64x64px (square)</li>
                <li>Formats: PNG, SVG, or ICO</li>
                <li>File size: Under 100KB for best performance</li>
                <li>This icon appears in browser tabs, bookmarks, and browser history</li>
              </ul>
            </small>
          </div>
        </Card>

        <Card className="settings-section">
          <h2>Basic Information</h2>
          <div className="form-group">
            <label>Event Slug (Subdomain)</label>
            <input
              type="text"
              value={formData.slug || getCurrentEventSlug()}
              onChange={(e) => handleChange('slug', e.target.value)}
              placeholder="event-slug"
              disabled={!!formData.slug}
            />
            <small>
              {formData.slug 
                ? 'This is your subdomain identifier. Cannot be changed after creation.'
                : `Current subdomain: ${getCurrentEventSlug()}. This will be used as the event slug when you save.`
              }
            </small>
          </div>
          <div className="form-group">
            <label>Event Title</label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Wedding Celebration"
            />
          </div>
          <div className="form-group">
            <label>Banner Text</label>
            <input
              type="text"
              value={formData.banner_text || ''}
              onChange={(e) => handleChange('banner_text', e.target.value)}
              placeholder="Welcome to our celebration!"
            />
          </div>
        </Card>

        <Card className="settings-section">
          <h2>Banner Text Styling</h2>
          <div className="form-group">
            <label>Font Size (pixels)</label>
            <input
              type="number"
              value={formData.banner_text_font_size ?? 64}
              onChange={(e) => handleChange('banner_text_font_size', parseInt(e.target.value) || 64)}
              min="24"
              max="120"
              placeholder="64"
            />
            <small>Recommended: 48-80px. Default: 64px (4rem)</small>
          </div>
          <div className="form-group">
            <label>Text Color</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="color"
                value={formData.banner_text_color || '#ffffff'}
                onChange={(e) => handleChange('banner_text_color', e.target.value)}
                style={{ width: '60px', height: '40px', cursor: 'pointer' }}
              />
              <input
                type="text"
                value={formData.banner_text_color || '#ffffff'}
                onChange={(e) => handleChange('banner_text_color', e.target.value)}
                placeholder="#ffffff"
                style={{ flex: 1 }}
              />
            </div>
            <small>Hex color code (e.g., #ffffff for white)</small>
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.banner_text_shadow_enabled !== false}
                onChange={(e) => handleChange('banner_text_shadow_enabled', e.target.checked)}
              />
              {' '}Enable Text Shadow
            </label>
          </div>
          {formData.banner_text_shadow_enabled !== false && (
            <>
              <div className="form-group">
                <label>Shadow Horizontal Offset (pixels)</label>
                <input
                  type="number"
                  value={formData.banner_text_shadow_x ?? 2}
                  onChange={(e) => handleChange('banner_text_shadow_x', parseInt(e.target.value) || 0)}
                  min="-20"
                  max="20"
                  placeholder="2"
                />
              </div>
              <div className="form-group">
                <label>Shadow Vertical Offset (pixels)</label>
                <input
                  type="number"
                  value={formData.banner_text_shadow_y ?? 2}
                  onChange={(e) => handleChange('banner_text_shadow_y', parseInt(e.target.value) || 0)}
                  min="-20"
                  max="20"
                  placeholder="2"
                />
              </div>
              <div className="form-group">
                <label>Shadow Blur Radius (pixels)</label>
                <input
                  type="number"
                  value={formData.banner_text_shadow_blur ?? 4}
                  onChange={(e) => handleChange('banner_text_shadow_blur', parseInt(e.target.value) || 0)}
                  min="0"
                  max="20"
                  placeholder="4"
                />
              </div>
              <div className="form-group">
                <label>Shadow Color</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={(() => {
                      const shadowColor = formData.banner_text_shadow_color || 'rgba(0, 0, 0, 0.5)';
                      // Extract RGB from rgba string
                      const rgbaMatch = shadowColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                      if (rgbaMatch) {
                        const r = parseInt(rgbaMatch[1]).toString(16).padStart(2, '0');
                        const g = parseInt(rgbaMatch[2]).toString(16).padStart(2, '0');
                        const b = parseInt(rgbaMatch[3]).toString(16).padStart(2, '0');
                        return `#${r}${g}${b}`;
                      }
                      // If it's already hex, return it
                      if (shadowColor.startsWith('#')) {
                        return shadowColor;
                      }
                      return '#000000';
                    })()}
                    onChange={(e) => {
                      const hex = e.target.value;
                      const r = parseInt(hex.slice(1, 3), 16);
                      const g = parseInt(hex.slice(3, 5), 16);
                      const b = parseInt(hex.slice(5, 7), 16);
                      // Preserve existing opacity if it was rgba, otherwise use 0.5
                      const existingColor = formData.banner_text_shadow_color || 'rgba(0, 0, 0, 0.5)';
                      const opacityMatch = existingColor.match(/rgba?\([^)]+,\s*([\d.]+)\)/);
                      const opacity = opacityMatch ? opacityMatch[1] : '0.5';
                      handleChange('banner_text_shadow_color', `rgba(${r}, ${g}, ${b}, ${opacity})`);
                    }}
                    style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={formData.banner_text_shadow_color || 'rgba(0, 0, 0, 0.5)'}
                    onChange={(e) => handleChange('banner_text_shadow_color', e.target.value)}
                    placeholder="rgba(0, 0, 0, 0.5)"
                    style={{ flex: 1 }}
                  />
                </div>
                <small>RGBA color (e.g., rgba(0, 0, 0, 0.5) for semi-transparent black) or hex color</small>
              </div>
            </>
          )}

          <div className="form-group" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
            <label>
              <input
                type="checkbox"
                checked={formData.banner_text_border_enabled === true}
                onChange={(e) => handleChange('banner_text_border_enabled', e.target.checked)}
              />
              {' '}Enable Border
            </label>
          </div>
          {formData.banner_text_border_enabled === true && (
            <>
              <div className="form-group">
                <label>Border Width (pixels)</label>
                <input
                  type="number"
                  value={formData.banner_text_border_width ?? 2}
                  onChange={(e) => handleChange('banner_text_border_width', parseInt(e.target.value) || 0)}
                  min="1"
                  max="10"
                  placeholder="2"
                />
              </div>
              <div className="form-group">
                <label>Border Color</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={formData.banner_text_border_color || '#ffffff'}
                    onChange={(e) => handleChange('banner_text_border_color', e.target.value)}
                    style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={formData.banner_text_border_color || '#ffffff'}
                    onChange={(e) => handleChange('banner_text_border_color', e.target.value)}
                    placeholder="#ffffff"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Border Opacity (0.0 - 1.0)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={formData.banner_text_border_opacity ?? 1.0}
                  onChange={(e) => handleChange('banner_text_border_opacity', parseFloat(e.target.value) || 1.0)}
                  placeholder="1.0"
                />
                <small>0.0 = fully transparent, 1.0 = fully opaque</small>
              </div>
              <div className="form-group">
                <label>Border Radius (pixels)</label>
                <input
                  type="number"
                  value={formData.banner_text_border_radius ?? 8}
                  onChange={(e) => handleChange('banner_text_border_radius', parseInt(e.target.value) || 8)}
                  min="0"
                  max="50"
                  placeholder="8"
                />
                <small>Default: 8px</small>
              </div>
            </>
          )}

          <div className="form-group" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
            <label>
              <input
                type="checkbox"
                checked={formData.banner_text_background_enabled === true}
                onChange={(e) => handleChange('banner_text_background_enabled', e.target.checked)}
              />
              {' '}Enable Background
            </label>
          </div>
          {formData.banner_text_background_enabled === true && (
            <>
              <div className="form-group">
                <label>Background Color</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={formData.banner_text_background_color || '#000000'}
                    onChange={(e) => handleChange('banner_text_background_color', e.target.value)}
                    style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={formData.banner_text_background_color || '#000000'}
                    onChange={(e) => handleChange('banner_text_background_color', e.target.value)}
                    placeholder="#000000"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Background Opacity (0.0 - 1.0)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={formData.banner_text_background_opacity ?? 0.5}
                  onChange={(e) => handleChange('banner_text_background_opacity', parseFloat(e.target.value) || 0.5)}
                  placeholder="0.5"
                />
                <small>0.0 = fully transparent, 1.0 = fully opaque</small>
              </div>
            </>
          )}

          <div className="form-group" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
            <label>Padding (pixels)</label>
            <input
              type="number"
              value={formData.banner_text_padding ?? 16}
              onChange={(e) => handleChange('banner_text_padding', parseInt(e.target.value) || 16)}
              min="0"
              max="50"
              placeholder="16"
            />
            <small>Padding between border and text. Default: 16px</small>
          </div>
        </Card>

        <Card className="settings-section">
          <h2>Story Content</h2>
          <div className="form-group">
            <label>Invitation Text</label>
            <textarea
              value={formData.invitation_text || ''}
              onChange={(e) => handleChange('invitation_text', e.target.value)}
              placeholder="You are cordially invited..."
              rows={3}
            />
          </div>
          <div className="form-group">
            <label>Ons Storie</label>
            <textarea
              value={formData.story_text || ''}
              onChange={(e) => handleChange('story_text', e.target.value)}
              placeholder="Tell your story..."
              rows={5}
            />
          </div>
          <div className="form-group">
            <ImageUpload
              currentImageUrl={formData.story_image_url}
              onUpload={async (url) => handleChange('story_image_url', url)}
              folder="story"
              label="Story Image"
            />
          </div>
          <div className="form-group">
            <label>Message for Guests</label>
            <textarea
              value={formData.guest_message || ''}
              onChange={(e) => handleChange('guest_message', e.target.value)}
              placeholder="A personal message for your guests..."
              rows={3}
            />
          </div>
        </Card>

        <Card className="settings-section">
          <h2>Event Details</h2>
          <div className="form-group">
            <label>Wedding Date & Time</label>
            <DatePicker
              selected={formData.wedding_date ? new Date(formData.wedding_date) : null}
              onChange={(date: Date | null) => {
                if (date) {
                  handleChange('wedding_date', date.toISOString());
                } else {
                  handleChange('wedding_date', null);
                }
              }}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="MMMM d, yyyy h:mm aa"
              placeholderText="Select wedding date and time"
              className="date-picker-input"
              wrapperClassName="date-picker-wrapper"
              isClearable
            />
            <small>This date is used for the countdown timer and event display on the home page.</small>
          </div>
          <div className="form-group">
            <label>Venue Name</label>
            <input
              type="text"
              value={formData.venue_name || ''}
              onChange={(e) => handleChange('venue_name', e.target.value)}
              placeholder="Beautiful Venue"
            />
          </div>
          <div className="form-group">
            <label>Venue Address</label>
            <input
              type="text"
              value={formData.venue_address || ''}
              onChange={(e) => handleChange('venue_address', e.target.value)}
              placeholder="123 Main St, City, Country"
            />
          </div>
          <div className="form-group">
            <label>Venue Map URL (Google Maps Embed)</label>
            <input
              type="text"
              value={formData.venue_map_url || ''}
              onChange={(e) => handleChange('venue_map_url', e.target.value)}
              placeholder="https://www.google.com/maps/embed?pb=..."
            />
            <small>
              <strong>How to get the embed URL:</strong>
              <ol style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', fontSize: '0.875rem' }}>
                <li>Go to <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer">Google Maps</a></li>
                <li>Search for your venue address</li>
                <li>Click the <strong>Share</strong> button</li>
                <li>Select <strong>"Embed a map"</strong> tab</li>
                <li>Copy the iframe src URL (starts with <code>https://www.google.com/maps/embed?pb=...</code>)</li>
                <li>Paste it here</li>
              </ol>
              <strong style={{ color: '#10b981' }}>✓ No API key required!</strong> Google Maps embeds work without credentials.
            </small>
          </div>
          <div className="form-group">
            <label>Venue Text (Display Text)</label>
            <input
              type="text"
              value={formData.venue_text || ''}
              onChange={(e) => handleChange('venue_text', e.target.value)}
              placeholder="Beautiful Venue"
            />
          </div>
          <div className="form-group">
            <label>Dress Code</label>
            <input
              type="text"
              value={formData.dress_code || ''}
              onChange={(e) => handleChange('dress_code', e.target.value)}
              placeholder="Formal / Semi-Formal / Casual"
            />
          </div>
        </Card>

        <Card className="settings-section">
          <h2>Theme Colors</h2>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
            Customize the color scheme for buttons, links, and other UI elements throughout your event site.
          </p>
          <div className="form-group">
            <label>Primary Color</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="color"
                value={formData.theme_json?.primaryColor || '#2563eb'}
                onChange={(e) => {
                  const theme = formData.theme_json || {};
                  handleChange('theme_json', { ...theme, primaryColor: e.target.value });
                }}
                style={{ width: '60px', height: '40px', cursor: 'pointer' }}
              />
              <input
                type="text"
                value={formData.theme_json?.primaryColor || '#2563eb'}
                onChange={(e) => {
                  const theme = formData.theme_json || {};
                  handleChange('theme_json', { ...theme, primaryColor: e.target.value });
                }}
                placeholder="#2563eb"
                style={{ flex: 1 }}
              />
            </div>
            <small>Used for primary buttons, links, and accents</small>
          </div>
          <div className="form-group">
            <label>Secondary Color</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="color"
                value={formData.theme_json?.secondaryColor || '#64748b'}
                onChange={(e) => {
                  const theme = formData.theme_json || {};
                  handleChange('theme_json', { ...theme, secondaryColor: e.target.value });
                }}
                style={{ width: '60px', height: '40px', cursor: 'pointer' }}
              />
              <input
                type="text"
                value={formData.theme_json?.secondaryColor || '#64748b'}
                onChange={(e) => {
                  const theme = formData.theme_json || {};
                  handleChange('theme_json', { ...theme, secondaryColor: e.target.value });
                }}
                placeholder="#64748b"
                style={{ flex: 1 }}
              />
            </div>
            <small>Used for secondary buttons and less prominent elements</small>
          </div>
          <div className="form-group">
            <label>Text Color</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="color"
                value={formData.theme_json?.textColor || '#111827'}
                onChange={(e) => {
                  const theme = formData.theme_json || {};
                  handleChange('theme_json', { ...theme, textColor: e.target.value });
                }}
                style={{ width: '60px', height: '40px', cursor: 'pointer' }}
              />
              <input
                type="text"
                value={formData.theme_json?.textColor || '#111827'}
                onChange={(e) => {
                  const theme = formData.theme_json || {};
                  handleChange('theme_json', { ...theme, textColor: e.target.value });
                }}
                placeholder="#111827"
                style={{ flex: 1 }}
              />
            </div>
            <small>Main text color for headings and body text</small>
          </div>
          <div className="form-group">
            <label>Background Color</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="color"
                value={formData.theme_json?.backgroundColor || '#ffffff'}
                onChange={(e) => {
                  const theme = formData.theme_json || {};
                  handleChange('theme_json', { ...theme, backgroundColor: e.target.value });
                }}
                style={{ width: '60px', height: '40px', cursor: 'pointer' }}
              />
              <input
                type="text"
                value={formData.theme_json?.backgroundColor || '#ffffff'}
                onChange={(e) => {
                  const theme = formData.theme_json || {};
                  handleChange('theme_json', { ...theme, backgroundColor: e.target.value });
                }}
                placeholder="#ffffff"
                style={{ flex: 1 }}
              />
            </div>
            <small>Main background color for pages</small>
          </div>
          <div className="form-group">
            <label>Accent Color</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="color"
                value={formData.theme_json?.accentColor || '#2563eb'}
                onChange={(e) => {
                  const theme = formData.theme_json || {};
                  handleChange('theme_json', { ...theme, accentColor: e.target.value });
                }}
                style={{ width: '60px', height: '40px', cursor: 'pointer' }}
              />
              <input
                type="text"
                value={formData.theme_json?.accentColor || '#2563eb'}
                onChange={(e) => {
                  const theme = formData.theme_json || {};
                  handleChange('theme_json', { ...theme, accentColor: e.target.value });
                }}
                placeholder="#2563eb"
                style={{ flex: 1 }}
              />
            </div>
            <small>Used for highlights, active states, and special elements</small>
          </div>
          <div className="form-group">
            <label>Container Color</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="color"
                value={formData.theme_json?.containerColor || '#2563eb'}
                onChange={(e) => {
                  const theme = formData.theme_json || {};
                  handleChange('theme_json', { ...theme, containerColor: e.target.value });
                }}
                style={{ width: '60px', height: '40px', cursor: 'pointer' }}
              />
              <input
                type="text"
                value={formData.theme_json?.containerColor || '#2563eb'}
                onChange={(e) => {
                  const theme = formData.theme_json || {};
                  handleChange('theme_json', { ...theme, containerColor: e.target.value });
                }}
                placeholder="#2563eb"
                style={{ flex: 1 }}
              />
            </div>
            <small>Used for all container sections across the site (Accommodation, Venue, Menu, Schedule, RSVP)</small>
          </div>
        </Card>

        <Card className="settings-section">
          <h2>Top Navigation</h2>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
            Customize the appearance of navigation items in the top navigation bar.
          </p>
          <div className="form-group">
            <label>Navigation Font Color</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="color"
                value={formData.theme_json?.navFontColor || '#6b7280'}
                onChange={(e) => {
                  const theme = formData.theme_json || {};
                  handleChange('theme_json', { ...theme, navFontColor: e.target.value });
                }}
                style={{ width: '60px', height: '40px', cursor: 'pointer' }}
              />
              <input
                type="text"
                value={formData.theme_json?.navFontColor || '#6b7280'}
                onChange={(e) => {
                  const theme = formData.theme_json || {};
                  handleChange('theme_json', { ...theme, navFontColor: e.target.value });
                }}
                placeholder="#6b7280"
                style={{ flex: 1 }}
              />
            </div>
            <small>Color for navigation links (default: #6b7280)</small>
          </div>
          <div className="form-group">
            <label>Navigation Font Size (rem)</label>
            <input
              type="number"
              min="0.5"
              max="2"
              step="0.1"
              value={formData.theme_json?.navFontSize || 1}
              onChange={(e) => {
                const theme = formData.theme_json || {};
                handleChange('theme_json', { ...theme, navFontSize: parseFloat(e.target.value) || 1 });
              }}
              placeholder="1"
              style={{ width: '100%' }}
            />
            <small>Font size for navigation items in rem units (default: 1rem). Recommended: 0.875rem - 1.25rem</small>
          </div>
        </Card>

        <Card className="settings-section">
          <h2>Section Backgrounds</h2>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
            Customize the background for each section on the home page. You can set a background image, background color, and optionally add an overlay with custom color and opacity.
          </p>
          
          {['banner', 'story', 'venue', 'schedule', 'rsvp'].map((sectionKey) => {
            const section = formData.section_backgrounds?.[sectionKey] || {};
            const sectionNames: Record<string, string> = {
              banner: 'Banner Section',
              story: 'Storie Afdeling',
              venue: 'Plek Afdeling',
              schedule: 'Skedule Afdeling',
              rsvp: 'RSVP Afdeling',
            };

            return (
              <div key={sectionKey} style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#111827' }}>
                  {sectionNames[sectionKey]}
                </h3>
                
                <div className="form-group">
                  <label>Background Image</label>
                  <ImageUpload
                    currentImageUrl={section.background_image_url}
                    onUpload={async (url) => {
                      const backgrounds = formData.section_backgrounds || {};
                      handleChange('section_backgrounds', {
                        ...backgrounds,
                        [sectionKey]: {
                          ...backgrounds[sectionKey],
                          background_image_url: url,
                        },
                      });
                    }}
                    folder={`sections/${sectionKey}`}
                    label=""
                  />
                  <small>Optional: Upload a background image for this section</small>
                </div>

                <div className="form-group">
                  <label>Background Color</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={section.background_color || '#ffffff'}
                      onChange={(e) => {
                        const backgrounds = formData.section_backgrounds || {};
                        handleChange('section_backgrounds', {
                          ...backgrounds,
                          [sectionKey]: {
                            ...backgrounds[sectionKey],
                            background_color: e.target.value,
                          },
                        });
                      }}
                      style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={section.background_color || '#ffffff'}
                      onChange={(e) => {
                        const backgrounds = formData.section_backgrounds || {};
                        handleChange('section_backgrounds', {
                          ...backgrounds,
                          [sectionKey]: {
                            ...backgrounds[sectionKey],
                            background_color: e.target.value,
                          },
                        });
                      }}
                      placeholder="#ffffff"
                      style={{ flex: 1 }}
                    />
                  </div>
                  <small>Background color (used if no image is set, or as fallback)</small>
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={section.overlay_enabled || false}
                      onChange={(e) => {
                        const backgrounds = formData.section_backgrounds || {};
                        handleChange('section_backgrounds', {
                          ...backgrounds,
                          [sectionKey]: {
                            ...backgrounds[sectionKey],
                            overlay_enabled: e.target.checked,
                          },
                        });
                      }}
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                    <span>Enable Overlay</span>
                  </label>
                  <small>Add a colored overlay on top of the background image</small>
                </div>

                {section.overlay_enabled && (
                  <>
                    <div className="form-group">
                      <label>Overlay Color</label>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="color"
                          value={section.overlay_color || '#000000'}
                          onChange={(e) => {
                            const backgrounds = formData.section_backgrounds || {};
                            handleChange('section_backgrounds', {
                              ...backgrounds,
                              [sectionKey]: {
                                ...backgrounds[sectionKey],
                                overlay_color: e.target.value,
                              },
                            });
                          }}
                          style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                        />
                        <input
                          type="text"
                          value={section.overlay_color || '#000000'}
                          onChange={(e) => {
                            const backgrounds = formData.section_backgrounds || {};
                            handleChange('section_backgrounds', {
                              ...backgrounds,
                              [sectionKey]: {
                                ...backgrounds[sectionKey],
                                overlay_color: e.target.value,
                              },
                            });
                          }}
                          placeholder="#000000"
                          style={{ flex: 1 }}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Overlay Opacity (0-1)</label>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={section.overlay_opacity !== undefined ? section.overlay_opacity : 0.4}
                        onChange={(e) => {
                          const backgrounds = formData.section_backgrounds || {};
                          handleChange('section_backgrounds', {
                            ...backgrounds,
                            [sectionKey]: {
                              ...backgrounds[sectionKey],
                              overlay_opacity: parseFloat(e.target.value) || 0.4,
                            },
                          });
                        }}
                        placeholder="0.4"
                        style={{ width: '100%' }}
                      />
                      <small>Opacity value between 0 (transparent) and 1 (opaque). Default: 0.4</small>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </Card>

        <Card className="settings-section">
          <h2>Feature Toggles</h2>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
            Enable or disable features. Disabled features will not appear in the navigation menu.
          </p>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.menu_enabled !== false}
                onChange={(e) => handleChange('menu_enabled', e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <span>Enable Menu Feature</span>
            </label>
            <small>When enabled, the Menu link appears in the top navigation. When disabled, it's hidden.</small>
          </div>
          <div className="form-group" style={{ marginTop: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.schedule_enabled !== false}
                onChange={(e) => handleChange('schedule_enabled', e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <span>Enable Schedule Feature</span>
            </label>
            <small>When enabled, the Schedule link appears in the top navigation. When disabled, it's hidden.</small>
          </div>
          <div className="form-group" style={{ marginTop: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.accommodation_enabled !== false}
                onChange={(e) => handleChange('accommodation_enabled', e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <span>Enable Accommodation Feature</span>
            </label>
            <small>When enabled, the Accommodation link appears in the top navigation. When disabled, it's hidden.</small>
          </div>
          <div className="form-group" style={{ marginTop: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.gift_registry_enabled === true}
                onChange={(e) => handleChange('gift_registry_enabled', e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <span>Enable Gift Registry Feature</span>
            </label>
            <small>When enabled, guests can browse and book gifts from the registry. When disabled, it's hidden.</small>
          </div>
          {formData.gift_registry_enabled && (
            <div className="form-group" style={{ marginTop: '1.5rem', marginLeft: '2rem' }}>
              <label htmlFor="max_gifts_per_guest" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Maximum Gifts Per Guest
              </label>
              <input
                id="max_gifts_per_guest"
                type="number"
                min="0"
                max="10"
                value={formData.max_gifts_per_guest ?? 1}
                onChange={(e) => handleChange('max_gifts_per_guest', parseInt(e.target.value) || 1)}
                style={{ width: '100px', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
              />
              <small style={{ display: 'block', marginTop: '0.5rem', color: '#6b7280' }}>
                Set to 1 for one gift per guest (most common), 2 for two gifts, etc. Set to 0 for unlimited (not recommended).
              </small>
            </div>
          )}
        </Card>


        <Card className="settings-section">
          <h2>Images</h2>
          <div className="form-group">
            <ImageUpload
              currentImageUrl={formData.social_sharing_image_url}
              onUpload={async (url) => handleChange('social_sharing_image_url', url)}
              folder="social"
              label="Social Sharing Image"
            />
            <small>
              <strong>Image for Social Media Sharing (WhatsApp, Facebook, etc.)</strong>
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', fontSize: '0.875rem' }}>
                <li>Recommended size: 1200x630px (1.91:1 ratio)</li>
                <li>Minimum size: 600x315px</li>
                <li>Formats: JPG or PNG</li>
                <li>File size: Under 1MB for best performance</li>
                <li>This image appears when someone shares your link on social media</li>
                <li>If not set, will use Hero/Banner Image as fallback</li>
              </ul>
            </small>
          </div>
          <div className="form-group">
            <ImageUpload
              currentImageUrl={formData.hero_image_url}
              onUpload={async (url) => handleChange('hero_image_url', url)}
              folder="hero"
              label="Hero/Banner Image"
            />
          </div>
          <div className="form-group">
            <ImageUpload
              currentImageUrl={formData.rsvp_yes_image_url}
              onUpload={async (url) => handleChange('rsvp_yes_image_url', url)}
              folder="rsvp"
              label="RSVP Yes Confirmation Image"
            />
          </div>
          <div className="form-group">
            <ImageUpload
              currentImageUrl={formData.rsvp_no_image_url}
              onUpload={async (url) => handleChange('rsvp_no_image_url', url)}
              folder="rsvp"
              label="RSVP No Confirmation Image"
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

