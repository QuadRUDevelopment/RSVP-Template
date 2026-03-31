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

type TabId = 'general' | 'appearance' | 'content' | 'features';

const TABS: { id: TabId; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'content', label: 'Content' },
  { id: 'features', label: 'Features' },
];

const DEFAULT_RSVP_OPTIONS = {
  yes: { label: 'Yes', emoji: '🎉', enabled: true },
  no: { label: 'No', emoji: '😢', enabled: true },
  maybe: { label: 'Maybe', emoji: '🤔', enabled: true },
};

export const Settings: React.FC = () => {
  const { token } = useAdminAuth();
  const { setEvent } = useEventStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('general');
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
        if (!data || !data.slug) {
          setFormData({ slug });
        } else {
          setFormData(data);
          setEvent(data);
        }
      } catch (err: any) {
        if (err.message?.includes('not found') || err.message?.includes('404')) {
          setFormData({ slug: getCurrentEventSlug() });
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
      const slug = formData.slug || getCurrentEventSlug();
      if (!slug) {
        const { createErrorModal } = await import('../../../lib/sweetalert2Config');
        await createErrorModal('Error', 'Event slug is required.');
        setSaving(false);
        return;
      }
      const updated = await adminRequest(
        'admin-settings',
        { method: 'POST', body: JSON.stringify({ slug, ...formData }) },
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

  // Helper: read/write rsvp_options with defaults
  const getRsvpOptions = () => {
    const saved = formData.rsvp_options || {};
    return {
      yes: { ...DEFAULT_RSVP_OPTIONS.yes, ...saved.yes },
      no: { ...DEFAULT_RSVP_OPTIONS.no, ...saved.no },
      maybe: { ...DEFAULT_RSVP_OPTIONS.maybe, ...saved.maybe },
    };
  };

  const updateRsvpOption = (key: 'yes' | 'no' | 'maybe', field: string, value: any) => {
    const opts = getRsvpOptions();
    handleChange('rsvp_options', { ...opts, [key]: { ...opts[key], [field]: value } });
  };

  if (loading) return <div className="settings-loading">Loading settings...</div>;

  const rsvpOpts = getRsvpOptions();

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Event Settings</h1>
        <Button onClick={handleSave} disabled={saving} variant="primary">
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* Tab Bar */}
      <div className="settings-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="settings-grid">

        {/* ── GENERAL TAB ── */}
        {activeTab === 'general' && (
          <>
            <Card className="settings-section">
              <h2>Site General</h2>
              <p className="section-desc">Configure your site's general appearance and branding.</p>
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
                  Appears in the browser tab. Recommended: 50–60 characters.{' '}
                  Current length: {formData.site_name?.length || 0}/60
                </small>
              </div>
              <div className="form-group">
                <ImageUpload
                  currentImageUrl={formData.site_icon_url}
                  onUpload={(url) => handleChange('site_icon_url', url)}
                  folder="site"
                  label="Site Icon / Favicon"
                />
                <small>Recommended: 32×32px or 64×64px PNG/SVG. Under 100 KB.</small>
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
                    ? 'Subdomain identifier — cannot be changed after creation.'
                    : `Current subdomain: ${getCurrentEventSlug()}. Used as slug when you save.`}
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
              <h2>Event Details</h2>
              <div className="form-group">
                <label>Wedding Date &amp; Time</label>
                <DatePicker
                  selected={formData.wedding_date ? new Date(formData.wedding_date) : null}
                  onChange={(date: Date | null) =>
                    handleChange('wedding_date', date ? date.toISOString() : null)
                  }
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="MMMM d, yyyy h:mm aa"
                  placeholderText="Select wedding date and time"
                  className="date-picker-input"
                  wrapperClassName="date-picker-wrapper"
                  isClearable
                />
                <small>Used for the countdown timer on the home page.</small>
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
                  Google Maps → Share → Embed a map → copy the <code>src</code> URL.{' '}
                  <strong style={{ color: '#10b981' }}>No API key required.</strong>
                </small>
              </div>
              <div className="form-group">
                <label>Venue Display Text</label>
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
          </>
        )}

        {/* ── APPEARANCE TAB ── */}
        {activeTab === 'appearance' && (
          <>
            <Card className="settings-section">
              <h2>Theme Colors</h2>
              <p className="section-desc">
                Customize the color scheme for buttons, links, and UI elements throughout your site.
              </p>
              {(
                [
                  { key: 'primaryColor', label: 'Primary Color', desc: 'Primary buttons, links, and accents', default: '#2563eb' },
                  { key: 'secondaryColor', label: 'Secondary Color', desc: 'Secondary buttons and less prominent elements', default: '#64748b' },
                  { key: 'textColor', label: 'Text Color', desc: 'Main text color for headings and body', default: '#111827' },
                  { key: 'backgroundColor', label: 'Background Color', desc: 'Main page background', default: '#ffffff' },
                  { key: 'accentColor', label: 'Accent Color', desc: 'Highlights, active states, special elements', default: '#2563eb' },
                  { key: 'containerColor', label: 'Container Color', desc: 'Section containers across all public pages', default: '#2563eb' },
                ] as const
              ).map(({ key, label, desc, default: def }) => (
                <div className="form-group" key={key}>
                  <label>{label}</label>
                  <div className="color-input-row">
                    <input
                      type="color"
                      value={formData.theme_json?.[key] || def}
                      onChange={(e) => {
                        const theme = formData.theme_json || {};
                        handleChange('theme_json', { ...theme, [key]: e.target.value });
                      }}
                      className="color-swatch"
                    />
                    <input
                      type="text"
                      value={formData.theme_json?.[key] || def}
                      onChange={(e) => {
                        const theme = formData.theme_json || {};
                        handleChange('theme_json', { ...theme, [key]: e.target.value });
                      }}
                      placeholder={def}
                      style={{ flex: 1 }}
                    />
                  </div>
                  <small>{desc}</small>
                </div>
              ))}
            </Card>

            {/* ── Text Colors ── */}
            <Card className="settings-section">
              <h2>Text Colors</h2>
              <p className="section-desc">
                Override the text color for specific areas of your public site. Leave at default to inherit the main Text Color set above.
              </p>
              {(
                [
                  {
                    key: 'heading',
                    label: 'Page Headings',
                    desc: 'H1 titles on every public page (e.g. "Plek", "Spyskaart")',
                    default: '#111827',
                  },
                  {
                    key: 'story',
                    label: 'Story Text',
                    desc: 'The story/about paragraph on the home page',
                    default: '#4b5563',
                  },
                  {
                    key: 'invitation',
                    label: 'Invitation Text',
                    desc: '"We are so excited to celebrate…" text on the home RSVP section',
                    default: '#111827',
                  },
                  {
                    key: 'additionalNotes',
                    label: 'Additional Notes Text',
                    desc: 'The notes block displayed above the invitation text',
                    default: '#111827',
                  },
                  {
                    key: 'rsvp',
                    label: 'RSVP Text',
                    desc: 'Invitation text, additional notes, and copy in the RSVP section (home page + /rsvp page)',
                    default: '#111827',
                  },
                  {
                    key: 'guestMessage',
                    label: 'Guest Message Text',
                    desc: 'The "Message for Guests" shown at the bottom of the home RSVP section',
                    default: '#4b5563',
                  },
                  {
                    key: 'muted',
                    label: 'Muted / Secondary Text',
                    desc: 'Descriptions, captions, and helper text across all pages',
                    default: '#6b7280',
                  },
                ] as const
              ).map(({ key, label, desc, default: def }) => {
                const tc = formData.theme_json?.textColors || {};
                const value = tc[key] || def;
                return (
                  <div className="form-group" key={key}>
                    <label>{label}</label>
                    <div className="color-input-row">
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => {
                          const theme = formData.theme_json || {};
                          handleChange('theme_json', {
                            ...theme,
                            textColors: { ...tc, [key]: e.target.value },
                          });
                        }}
                        className="color-swatch"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => {
                          const theme = formData.theme_json || {};
                          handleChange('theme_json', {
                            ...theme,
                            textColors: { ...tc, [key]: e.target.value },
                          });
                        }}
                        placeholder={def}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        title="Reset to default"
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        onClick={() => {
                          const theme = formData.theme_json || {};
                          const updated = { ...tc };
                          delete updated[key];
                          handleChange('theme_json', { ...theme, textColors: updated });
                        }}
                      >
                        Reset
                      </button>
                    </div>
                    <small>{desc}</small>
                  </div>
                );
              })}
            </Card>

            <Card className="settings-section">
              <h2>Top Navigation</h2>
              <p className="section-desc">Customize navigation bar appearance.</p>
              <div className="form-group">
                <label>Navigation Font Color</label>
                <div className="color-input-row">
                  <input
                    type="color"
                    value={formData.theme_json?.navFontColor || '#6b7280'}
                    onChange={(e) => {
                      const theme = formData.theme_json || {};
                      handleChange('theme_json', { ...theme, navFontColor: e.target.value });
                    }}
                    className="color-swatch"
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
                />
                <small>Default: 1rem. Recommended: 0.875–1.25rem</small>
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
                  min="24" max="120"
                />
                <small>Recommended: 48–80px. Default: 64px</small>
              </div>
              <div className="form-group">
                <label>Text Color</label>
                <div className="color-input-row">
                  <input
                    type="color"
                    value={formData.banner_text_color || '#ffffff'}
                    onChange={(e) => handleChange('banner_text_color', e.target.value)}
                    className="color-swatch"
                  />
                  <input
                    type="text"
                    value={formData.banner_text_color || '#ffffff'}
                    onChange={(e) => handleChange('banner_text_color', e.target.value)}
                    placeholder="#ffffff"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              {/* Shadow */}
              <div className="form-group toggle-group">
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
                <div className="sub-fields">
                  {[
                    { key: 'banner_text_shadow_x', label: 'Shadow X Offset', min: -20, max: 20, def: 2 },
                    { key: 'banner_text_shadow_y', label: 'Shadow Y Offset', min: -20, max: 20, def: 2 },
                    { key: 'banner_text_shadow_blur', label: 'Shadow Blur', min: 0, max: 20, def: 4 },
                  ].map(({ key, label, min, max, def }) => (
                    <div className="form-group" key={key}>
                      <label>{label} (px)</label>
                      <input
                        type="number"
                        value={formData[key] ?? def}
                        onChange={(e) => handleChange(key, parseInt(e.target.value) || 0)}
                        min={min} max={max}
                      />
                    </div>
                  ))}
                  <div className="form-group">
                    <label>Shadow Color</label>
                    <input
                      type="text"
                      value={formData.banner_text_shadow_color || 'rgba(0, 0, 0, 0.5)'}
                      onChange={(e) => handleChange('banner_text_shadow_color', e.target.value)}
                      placeholder="rgba(0, 0, 0, 0.5)"
                    />
                    <small>Use rgba for opacity, e.g. rgba(0,0,0,0.5)</small>
                  </div>
                </div>
              )}

              {/* Border */}
              <div className="form-group toggle-group" style={{ marginTop: '1.5rem', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
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
                <div className="sub-fields">
                  <div className="form-group">
                    <label>Border Width (px)</label>
                    <input
                      type="number"
                      value={formData.banner_text_border_width ?? 2}
                      onChange={(e) => handleChange('banner_text_border_width', parseInt(e.target.value) || 0)}
                      min="1" max="10"
                    />
                  </div>
                  <div className="form-group">
                    <label>Border Color</label>
                    <div className="color-input-row">
                      <input
                        type="color"
                        value={formData.banner_text_border_color || '#ffffff'}
                        onChange={(e) => handleChange('banner_text_border_color', e.target.value)}
                        className="color-swatch"
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
                    <label>Border Opacity (0–1)</label>
                    <input
                      type="number" step="0.1" min="0" max="1"
                      value={formData.banner_text_border_opacity ?? 1.0}
                      onChange={(e) => handleChange('banner_text_border_opacity', parseFloat(e.target.value) || 1.0)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Border Radius (px)</label>
                    <input
                      type="number" min="0" max="50"
                      value={formData.banner_text_border_radius ?? 8}
                      onChange={(e) => handleChange('banner_text_border_radius', parseInt(e.target.value) || 8)}
                    />
                  </div>
                </div>
              )}

              {/* Background */}
              <div className="form-group toggle-group" style={{ marginTop: '1.5rem', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
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
                <div className="sub-fields">
                  <div className="form-group">
                    <label>Background Color</label>
                    <div className="color-input-row">
                      <input
                        type="color"
                        value={formData.banner_text_background_color || '#000000'}
                        onChange={(e) => handleChange('banner_text_background_color', e.target.value)}
                        className="color-swatch"
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
                    <label>Background Opacity (0–1)</label>
                    <input
                      type="number" step="0.1" min="0" max="1"
                      value={formData.banner_text_background_opacity ?? 0.5}
                      onChange={(e) => handleChange('banner_text_background_opacity', parseFloat(e.target.value) || 0.5)}
                    />
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginTop: '1.5rem', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
                <label>Padding (px)</label>
                <input
                  type="number" min="0" max="50"
                  value={formData.banner_text_padding ?? 16}
                  onChange={(e) => handleChange('banner_text_padding', parseInt(e.target.value) || 16)}
                />
                <small>Padding between border and text. Default: 16px</small>
              </div>
            </Card>

            <Card className="settings-section">
              <h2>Gallery Carousel Settings</h2>
              <div className="form-group">
                <label>Auto-Rotation Speed (milliseconds)</label>
                <input
                  type="number"
                  value={formData.gallery_carousel_speed ?? 3000}
                  onChange={(e) => handleChange('gallery_carousel_speed', parseInt(e.target.value) || 3000)}
                  min="1000" max="10000" step="500"
                />
                <small>Default: 3000ms (3 seconds). Recommended: 2000–5000ms.</small>
              </div>
            </Card>

            <Card className="settings-section">
              <h2>Section Backgrounds</h2>
              <p className="section-desc">
                Set background image, color, and overlay for each home page section.
              </p>
              {(['banner', 'story', 'venue', 'schedule', 'rsvp'] as const).map((sectionKey) => {
                const section = formData.section_backgrounds?.[sectionKey] || {};
                const sectionNames: Record<string, string> = {
                  banner: 'Banner Section',
                  story: 'Storie Afdeling',
                  venue: 'Plek Afdeling',
                  schedule: 'Skedule Afdeling',
                  rsvp: 'RSVP Afdeling',
                };
                const updateSection = (field: string, value: any) => {
                  const backgrounds = formData.section_backgrounds || {};
                  handleChange('section_backgrounds', {
                    ...backgrounds,
                    [sectionKey]: { ...backgrounds[sectionKey], [field]: value },
                  });
                };
                return (
                  <div key={sectionKey} className="section-bg-block">
                    <h3>{sectionNames[sectionKey]}</h3>
                    <div className="form-group">
                      <ImageUpload
                        currentImageUrl={section.background_image_url}
                        onUpload={(url) => updateSection('background_image_url', url)}
                        folder={`sections/${sectionKey}`}
                        label="Background Image"
                      />
                    </div>
                    <div className="form-group">
                      <label>Background Color</label>
                      <div className="color-input-row">
                        <input
                          type="color"
                          value={section.background_color || '#ffffff'}
                          onChange={(e) => updateSection('background_color', e.target.value)}
                          className="color-swatch"
                        />
                        <input
                          type="text"
                          value={section.background_color || '#ffffff'}
                          onChange={(e) => updateSection('background_color', e.target.value)}
                          placeholder="#ffffff"
                          style={{ flex: 1 }}
                        />
                      </div>
                    </div>
                    <div className="form-group toggle-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={section.overlay_enabled || false}
                          onChange={(e) => updateSection('overlay_enabled', e.target.checked)}
                          style={{ width: 18, height: 18 }}
                        />
                        {' '}Enable Overlay
                      </label>
                    </div>
                    {section.overlay_enabled && (
                      <div className="sub-fields">
                        <div className="form-group">
                          <label>Overlay Color</label>
                          <div className="color-input-row">
                            <input
                              type="color"
                              value={section.overlay_color || '#000000'}
                              onChange={(e) => updateSection('overlay_color', e.target.value)}
                              className="color-swatch"
                            />
                            <input
                              type="text"
                              value={section.overlay_color || '#000000'}
                              onChange={(e) => updateSection('overlay_color', e.target.value)}
                              placeholder="#000000"
                              style={{ flex: 1 }}
                            />
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Overlay Opacity (0–1)</label>
                          <input
                            type="number" min="0" max="1" step="0.1"
                            value={section.overlay_opacity !== undefined ? section.overlay_opacity : 0.4}
                            onChange={(e) => updateSection('overlay_opacity', parseFloat(e.target.value) || 0.4)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </Card>

            {/* Typography */}
            <Card className="settings-section">
              <h2>Typography</h2>
              <p className="section-desc">
                Choose a font pairing for your public site. The heading font is used for titles and
                the body font for all other text. Changes take effect immediately on the public site.
              </p>
              <div className="form-group">
                <label>Font Pairing</label>
                <select
                  value={formData.theme_json?.fontPair || 'default'}
                  onChange={(e) => {
                    const theme = formData.theme_json || {};
                    handleChange('theme_json', { ...theme, fontPair: e.target.value });
                  }}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '0.95rem' }}
                >
                  <option value="default">Default (Inter) — clean modern sans-serif</option>
                  <option value="great-vibes">Great Vibes + Lato — flowing script + elegant body</option>
                  <option value="pinyon-script">Pinyon Script + Lato — classic calligraphy + elegant body</option>
                  <option value="dancing-script">Dancing Script + Raleway — romantic script + refined body</option>
                  <option value="alex-brush">Alex Brush + Montserrat — playful script + modern body</option>
                  <option value="tangerine">Tangerine + Source Sans 3 — tall formal script + airy body</option>
                  <option value="niconne">Niconne + Nunito — modern calligraphy + soft body</option>
                </select>
                <small>
                  Script heading fonts work best for event names, titles, and decorative headings.
                  "Default" keeps the clean Inter font used throughout the admin panel.
                </small>
              </div>

              {/* Live preview */}
              {(() => {
                const FONT_PAIRINGS = [
                  { value: 'default',        heading: 'Inter',          body: 'Inter' },
                  { value: 'great-vibes',    heading: 'Great Vibes',    body: 'Lato' },
                  { value: 'pinyon-script',  heading: 'Pinyon Script',  body: 'Lato' },
                  { value: 'dancing-script', heading: 'Dancing Script', body: 'Raleway' },
                  { value: 'alex-brush',     heading: 'Alex Brush',     body: 'Montserrat' },
                  { value: 'tangerine',      heading: 'Tangerine',      body: 'Source Sans 3' },
                  { value: 'niconne',        heading: 'Niconne',        body: 'Nunito' },
                ] as const;
                const selected = FONT_PAIRINGS.find(p => p.value === (formData.theme_json?.fontPair || 'default')) ?? FONT_PAIRINGS[0];
                const googleFamilies = [selected.heading, selected.body].filter(f => f !== 'Inter');
                if (googleFamilies.length > 0) {
                  const linkId = 'settings-font-preview-link';
                  let link = document.getElementById(linkId) as HTMLLinkElement | null;
                  if (!link) {
                    link = document.createElement('link');
                    link.id = linkId;
                    link.rel = 'stylesheet';
                    document.head.appendChild(link);
                  }
                  link.href = `https://fonts.googleapis.com/css2?${googleFamilies.map(f => `family=${encodeURIComponent(f)}&display=swap`).join('&')}`;
                }
                return (
                  <div style={{ marginTop: '1rem', padding: '1.25rem 1.5rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <p style={{ fontFamily: `'${selected.heading}', cursive`, fontSize: '2rem', marginBottom: '0.5rem', color: '#111827', lineHeight: 1.2 }}>
                      {formData.couple_names || 'Event Heading Preview'}
                    </p>
                    <p style={{ fontFamily: `'${selected.body}', sans-serif`, fontSize: '0.95rem', color: '#6b7280' }}>
                      Body text preview — your invitation details, descriptions, and page content will appear in this font.
                    </p>
                  </div>
                );
              })()}
            </Card>
          </>
        )}

        {/* ── CONTENT TAB ── */}
        {activeTab === 'content' && (
          <>
            <Card className="settings-section">
              <h2>Story Content</h2>
              <div className="form-group">
                <label>Additional Notes</label>
                <textarea
                  value={formData.additional_notes || ''}
                  onChange={(e) => handleChange('additional_notes', e.target.value)}
                  placeholder="e.g. Please note parking is available at the venue gate..."
                  rows={3}
                />
                <small>Displayed just <strong>above</strong> the invitation text on the home page RSVP section.</small>
              </div>
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
                  onUpload={(url) => handleChange('story_image_url', url)}
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
                <small>Displayed at the bottom of the RSVP section on the home page. Colour can be set in Appearance → Text Colors → Guest Message Text.</small>
              </div>
            </Card>

            <Card className="settings-section">
              <h2>Images</h2>
              <div className="form-group">
                <ImageUpload
                  currentImageUrl={formData.social_sharing_image_url}
                  onUpload={(url) => handleChange('social_sharing_image_url', url)}
                  folder="social"
                  label="Social Sharing Image"
                />
                <small>
                  Shown when your link is shared on WhatsApp / Facebook. Recommended: 1200×630px JPG/PNG, under 1 MB.
                </small>
              </div>
              <div className="form-group">
                <ImageUpload
                  currentImageUrl={formData.hero_image_url}
                  onUpload={(url) => handleChange('hero_image_url', url)}
                  folder="hero"
                  label="Hero / Banner Image"
                />
              </div>
              <div className="form-group">
                <ImageUpload
                  currentImageUrl={formData.rsvp_yes_image_url}
                  onUpload={(url) => handleChange('rsvp_yes_image_url', url)}
                  folder="rsvp"
                  label="RSVP Yes Confirmation Image"
                />
              </div>
              <div className="form-group">
                <ImageUpload
                  currentImageUrl={formData.rsvp_no_image_url}
                  onUpload={(url) => handleChange('rsvp_no_image_url', url)}
                  folder="rsvp"
                  label="RSVP No Confirmation Image"
                />
              </div>
            </Card>
          </>
        )}

        {/* ── FEATURES TAB ── */}
        {activeTab === 'features' && (
          <>
            <Card className="settings-section">
              <h2>Feature Toggles</h2>
              <p className="section-desc">
                Enable or disable features. Disabled features are hidden from the navigation menu.
              </p>

              {([
                { key: 'menu_enabled', label: 'Menu', desc: 'Guests can browse the event menu.' },
                { key: 'schedule_enabled', label: 'Schedule', desc: 'Guests can view the event schedule.' },
                { key: 'accommodation_enabled', label: 'Accommodation', desc: 'Accommodation section is visible.' },
              ] as const).map(({ key, label, desc }) => (
                <div className="feature-toggle-row" key={key}>
                  <div className="toggle-info">
                    <span className="toggle-label">{label}</span>
                    <span className="toggle-desc">{desc}</span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={formData[key] !== false}
                      onChange={(e) => handleChange(key, e.target.checked)}
                    />
                    <span className="slider" />
                  </label>
                </div>
              ))}

              {/* Gift Registry toggle with sub-option */}
              <div className="feature-toggle-row">
                <div className="toggle-info">
                  <span className="toggle-label">Gift Registry</span>
                  <span className="toggle-desc">Guests can browse and book gifts.</span>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={formData.gift_registry_enabled === true}
                    onChange={(e) => handleChange('gift_registry_enabled', e.target.checked)}
                  />
                  <span className="slider" />
                </label>
              </div>
              {formData.gift_registry_enabled && (
                <div className="sub-option">
                  <label htmlFor="max_gifts_per_guest">Maximum Gifts Per Guest</label>
                  <input
                    id="max_gifts_per_guest"
                    type="number" min="0" max="10"
                    value={formData.max_gifts_per_guest ?? 1}
                    onChange={(e) => handleChange('max_gifts_per_guest', parseInt(e.target.value) || 1)}
                    style={{ width: 100 }}
                  />
                  <small>0 = unlimited (not recommended)</small>
                </div>
              )}
            </Card>

            <Card className="settings-section">
              <h2>Accommodation Access</h2>
              <p className="section-desc">
                Control how guests access the public accommodation page.
              </p>
              <div className="feature-toggle-row">
                <div className="toggle-info">
                  <span className="toggle-label">Require Name Lookup</span>
                  <span className="toggle-desc">
                    When <strong>on</strong>: guests enter their name &amp; surname to see personalised accommodations.<br />
                    When <strong>off</strong>: all "all-group" accommodations are shown publicly without login.
                  </span>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={formData.accommodation_auth_required !== false}
                    onChange={(e) => handleChange('accommodation_auth_required', e.target.checked)}
                  />
                  <span className="slider" />
                </label>
              </div>
            </Card>

            <Card className="settings-section">
              <h2>RSVP Response Options</h2>
              <p className="section-desc">
                Customise the label and emoji for each RSVP response button. Disable options you don't need.
              </p>
              <div className="rsvp-options-grid">
                {(['yes', 'no', 'maybe'] as const).map((key) => {
                  const opt = rsvpOpts[key];
                  const colorMap = { yes: '#10b981', no: '#ef4444', maybe: '#f59e0b' };
                  return (
                    <div key={key} className={`rsvp-option-card ${opt.enabled ? 'enabled' : 'disabled'}`}>
                      <div className="rsvp-option-header">
                        <span className="rsvp-option-key" style={{ color: colorMap[key] }}>
                          {key.toUpperCase()}
                        </span>
                        <label className="switch small">
                          <input
                            type="checkbox"
                            checked={opt.enabled}
                            onChange={(e) => updateRsvpOption(key, 'enabled', e.target.checked)}
                          />
                          <span className="slider" />
                        </label>
                      </div>
                      <div className="form-group" style={{ marginTop: '0.75rem' }}>
                        <label>Button Label</label>
                        <input
                          type="text"
                          value={opt.label}
                          onChange={(e) => updateRsvpOption(key, 'label', e.target.value)}
                          placeholder={DEFAULT_RSVP_OPTIONS[key].label}
                          disabled={!opt.enabled}
                        />
                      </div>
                      <div className="form-group">
                        <label>Emoji / Icon</label>
                        <input
                          type="text"
                          value={opt.emoji}
                          onChange={(e) => updateRsvpOption(key, 'emoji', e.target.value)}
                          placeholder={DEFAULT_RSVP_OPTIONS[key].emoji}
                          disabled={!opt.enabled}
                          style={{ width: 80 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <small style={{ display: 'block', marginTop: '0.75rem', color: '#6b7280' }}>
                The underlying RSVP values stored are always yes / no / maybe. Labels are display-only.
              </small>
            </Card>

            <Card className="settings-section">
              <h2>Q&amp;A Section</h2>
              <p className="section-desc">
                Enable a Frequently Asked Questions section that appears as a page on your public site.
              </p>
              <div className="feature-toggle-row">
                <div className="toggle-info">
                  <span className="toggle-label">Enable Q&amp;A / FAQ Page</span>
                  <span className="toggle-desc">
                    When on, a Q&amp;A link appears in the navigation and guests can browse answers to common questions.
                    Manage your questions under the <strong>Q&amp;A</strong> admin section.
                  </span>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={formData.qa_enabled === true}
                    onChange={(e) => handleChange('qa_enabled', e.target.checked)}
                  />
                  <span className="slider" />
                </label>
              </div>
            </Card>
          </>
        )}

      </div>
    </div>
  );
};
