import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/Button/Button';
import { PlusOnes } from '../PlusOnes/PlusOnes';
import { fetchPublicCustomFields } from '../../../lib/apiClient';
import { getCurrentEventSlug } from '../../../lib/eventResolver';
import { useEventStore } from '../../../state/useEventStore';
import './RSVPForm.css';

const DEFAULT_RSVP_OPTIONS = {
  yes: { label: 'Yes', emoji: '🎉', enabled: true },
  no: { label: 'No', emoji: '😢', enabled: true },
  maybe: { label: 'Maybe', emoji: '🤔', enabled: true },
};

interface RSVPFormProps {
  guest: any;
  rsvp?: any;
  menuItems?: Array<{ id: string; name: string; category: string }>;
  onSubmit: (data: any) => Promise<void>;
}

export const RSVPForm: React.FC<RSVPFormProps> = ({
  guest,
  rsvp,
  menuItems = [],
  onSubmit,
}) => {
  const { event } = useEventStore();

  // Build effective RSVP options from event config (or defaults)
  const savedOpts = event?.rsvp_options || {};
  const rsvpOptions = (['yes', 'no', 'maybe'] as const)
    .map((key) => ({
      value: key,
      ...DEFAULT_RSVP_OPTIONS[key],
      ...(savedOpts[key] || {}),
    }))
    .filter((o) => o.enabled !== false);

  const defaultStatus = (rsvp?.status as 'yes' | 'no' | 'maybe') ||
    (rsvpOptions[0]?.value ?? 'yes');

  const [status, setStatus] = useState<'yes' | 'no' | 'maybe'>(defaultStatus);
  const [plusOnes, setPlusOnes] = useState<Array<{ name: string; mealChoiceId?: string }>>(
    rsvp?.plusOnes || []
  );
  const [mealChoiceId, setMealChoiceId] = useState(rsvp?.meal_choice_id || '');
  const [dietaryNotes, setDietaryNotes] = useState(rsvp?.dietary_notes || '');
  const [notes, setNotes] = useState(rsvp?.notes || '');
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCustomFields = async () => {
      try {
        const slug = getCurrentEventSlug();
        const data = await fetchPublicCustomFields(slug);
        setCustomFields(data.customFields || []);
      } catch (err) {
        console.error('Failed to load custom fields:', err);
      }
    };
    loadCustomFields();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate required custom fields
    const missingFields: string[] = [];
    customFields.forEach((field) => {
      if (field.required && !customFieldValues[field.id]) {
        missingFields.push(field.label);
      }
    });

    if (missingFields.length > 0) {
      setError(`Please fill in required fields: ${missingFields.join(', ')}`);
      setLoading(false);
      return;
    }

    try {
      await onSubmit({
        status,
        plusOnes,
        mealChoiceId: mealChoiceId || undefined,
        dietaryNotes: dietaryNotes || undefined,
        notes: notes || undefined,
        customFields: customFieldValues,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to submit RSVP');
    } finally {
      setLoading(false);
    }
  };

  const renderCustomField = (field: any) => {
    const value = customFieldValues[field.id] || '';
    const fieldId = `custom-field-${field.id}`;

    switch (field.field_type) {
      case 'textarea':
        return (
          <textarea
            id={fieldId}
            value={value}
            onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })}
            placeholder={field.placeholder || ''}
            required={field.required}
            rows={4}
          />
        );
      case 'select':
        const options = field.options?.options || [];
        return (
          <select
            id={fieldId}
            value={value}
            onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })}
            required={field.required}
          >
            <option value="">Select an option</option>
            {options.map((opt: string, idx: number) => (
              <option key={idx} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );
      case 'checkbox':
        return (
          <label className="checkbox-label">
            <input
              type="checkbox"
              id={fieldId}
              checked={value === 'true'}
              onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.checked ? 'true' : 'false' })}
              required={field.required}
            />
            <span>{field.placeholder || 'Yes'}</span>
          </label>
        );
      default:
        return (
          <input
            type={field.field_type}
            id={fieldId}
            value={value}
            onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })}
            placeholder={field.placeholder || ''}
            required={field.required}
          />
        );
    }
  };

  return (
    <form className="rsvp-form" onSubmit={handleSubmit}>
      <div className="form-section">
        <label className="section-label">Will you be attending?</label>
        <div className="attendance-buttons">
          {rsvpOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`attendance-btn ${status === opt.value ? 'active' : ''}`}
              onClick={() => setStatus(opt.value)}
            >
              {opt.emoji && <span className="attendance-emoji">{opt.emoji}</span>}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {status !== 'no' && (
        <>
          <PlusOnes
            maxCount={guest.max_plus_ones || 0}
            value={plusOnes}
            onChange={setPlusOnes}
            menuItems={menuItems}
          />

          {menuItems.length > 0 && (
            <div className="form-group">
              <label htmlFor="mealChoice">Meal Choice</label>
              <select
                id="mealChoice"
                value={mealChoiceId}
                onChange={(e) => setMealChoiceId(e.target.value)}
                disabled={menuItems.length === 0}
              >
                <option value="">Select a meal</option>
                {menuItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.category})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="dietaryNotes">Dietary Notes</label>
            <textarea
              id="dietaryNotes"
              value={dietaryNotes}
              onChange={(e) => setDietaryNotes(e.target.value)}
              placeholder="Any dietary restrictions or preferences?"
              rows={3}
            />
          </div>
        </>
      )}

      <div className="form-group">
        <label htmlFor="notes">Notes / Message</label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional message for the hosts?"
          rows={3}
        />
      </div>

      {/* Custom Fields */}
      {customFields.length > 0 && (
        <div className="form-section">
          <label className="section-label">Additional Information</label>
          {customFields.map((field) => (
            <div key={field.id} className="form-group">
              <label htmlFor={`custom-field-${field.id}`}>
                {field.label}
                {field.required && <span className="required-asterisk">*</span>}
              </label>
              {renderCustomField(field)}
            </div>
          ))}
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <Button type="submit" disabled={loading} size="large">
        {loading ? 'Submitting...' : 'Submit RSVP'}
      </Button>
    </form>
  );
};

