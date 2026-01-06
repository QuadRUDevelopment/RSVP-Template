import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { getSwalConfig, createSuccessModal, createErrorModal, createDeleteModal } from '../../../lib/sweetalert2Config';
import { Card } from '../../../components/ui/Card/Card';
import { Button } from '../../../components/ui/Button/Button';
import { DataTable } from '../../../components/ui/DataTable/DataTable';
import { getCurrentEventSlug } from '../../../lib/eventResolver';
import { adminRequest, fetchGroups } from '../../../lib/apiClient';
import { useAdminAuth } from '../../../state/useAdminAuth';
import { useEventStore } from '../../../state/useEventStore';
import '../Accommodation/Accommodation.css';

// Helper function to convert time text to time input format (HH:MM)
const convertToTimeInput = (timeText: string): string => {
  if (!timeText) return '';
  
  // If already in HH:MM format, return as is
  if (/^\d{2}:\d{2}$/.test(timeText)) {
    return timeText;
  }
  
  // Try to parse common time formats
  // e.g., "2:00 PM" -> "14:00", "10:30 AM" -> "10:30"
  const timeLower = timeText.toLowerCase().trim();
  const pmMatch = timeLower.match(/(\d{1,2}):(\d{2})\s*pm/);
  const amMatch = timeLower.match(/(\d{1,2}):(\d{2})\s*am/);
  
  if (pmMatch) {
    let hours = parseInt(pmMatch[1]);
    if (hours !== 12) hours += 12;
    const minutes = pmMatch[2];
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }
  
  if (amMatch) {
    let hours = parseInt(amMatch[1]);
    if (hours === 12) hours = 0;
    const minutes = amMatch[2];
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }
  
  // If no match, try to extract HH:MM pattern
  const timeMatch = timeText.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1]).toString().padStart(2, '0');
    const minutes = timeMatch[2];
    return `${hours}:${minutes}`;
  }
  
  return '';
};

// Helper function to format time input (HH:MM) to display format
const formatTimeForDisplay = (timeInput: string): string => {
  if (!timeInput) return '';
  
  const [hours, minutes] = timeInput.split(':');
  const hour24 = parseInt(hours);
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  const ampm = hour24 >= 12 ? 'PM' : 'AM';
  
  return `${hour12}:${minutes} ${ampm}`;
};

export const Timeline: React.FC = () => {
  const { token } = useAdminAuth();
  const { event } = useEventStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if schedule feature is disabled
  if (event && event.schedule_enabled === false) {
    return (
      <div style={{ padding: '2rem' }}>
        <Card>
          <h2>Schedule Feature Disabled</h2>
          <p>This feature is currently disabled. Enable it in Settings to manage timeline items.</p>
          <Link to="/admin/settings">
            <Button variant="primary">Go to Settings</Button>
          </Link>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    loadItems();
  }, [token]);

  const loadItems = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const slug = getCurrentEventSlug();
      const data = await adminRequest(
        `admin-timeline?slug=${encodeURIComponent(slug)}`,
        { method: 'GET' },
        token
      );
      setItems(data.timelineItems || []);
    } catch (err) {
      console.error('Failed to load timeline items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    showTimelineForm();
  };

  const handleEdit = (item: any) => {
    showTimelineForm(item);
  };

  const showTimelineForm = async (editingItem: any = null) => {
    // Fetch groups
    let groups: any[] = [];
    try {
      if (token) {
        const slug = getCurrentEventSlug();
        const groupsData = await fetchGroups(slug, token);
        groups = groupsData.groups || [];
      }
    } catch (err) {
      console.error('Failed to load groups:', err);
      // Fallback to default groups
      groups = [
        { key: 'all', name: 'All' },
        { key: 'family', name: 'Family' },
        { key: 'friends', name: 'Friends' },
      ];
    }

    // Build group options
    const groupOptions = groups.map(g => 
      `<option value="${g.key}" ${editingItem?.audience_key === g.key ? 'selected' : ''}>${g.name}</option>`
    ).join('');

    const { value: formValues } = await Swal.fire({
      ...getSwalConfig(),
      title: editingItem ? 'Edit Timeline Item' : 'Add Timeline Item',
      html: `
        <label for="swal-time" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-bottom: 0.5rem;">Time *</label>
        <input id="swal-time" class="swal2-custom-input" type="time" value="${editingItem?.time ? convertToTimeInput(editingItem.time) : ''}" required>
        <label for="swal-title" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Title *</label>
        <input id="swal-title" class="swal2-custom-input" placeholder="Enter timeline item title" value="${editingItem?.title || ''}" required>
        <label for="swal-location" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Location</label>
        <input id="swal-location" class="swal2-custom-input" placeholder="Enter location" value="${editingItem?.location || ''}">
        <label for="swal-notes" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Notes</label>
        <textarea id="swal-notes" class="swal2-custom-textarea" placeholder="Enter notes">${editingItem?.notes || ''}</textarea>
        <label for="swal-audience" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Audience</label>
        <select id="swal-audience" class="swal2-custom-select">
          ${groupOptions}
        </select>
        <label for="swal-sort" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Sort Order</label>
        <input id="swal-sort" class="swal2-custom-input" type="number" placeholder="0" value="${editingItem?.sort_order || 0}">
      `,
      showCancelButton: true,
      preConfirm: () => {
        const timeInput = (document.getElementById('swal-time') as HTMLInputElement)?.value;
        const title = (document.getElementById('swal-title') as HTMLInputElement)?.value;
        if (!timeInput || !title) {
          Swal.showValidationMessage('Time and Title are required');
          return false;
        }
        // Convert time input (HH:MM) to display format (e.g., "2:00 PM")
        const time = formatTimeForDisplay(timeInput);
        return {
          time,
          title,
          location: (document.getElementById('swal-location') as HTMLInputElement)?.value || '',
          notes: (document.getElementById('swal-notes') as HTMLTextAreaElement)?.value || '',
          audience_key: (document.getElementById('swal-audience') as HTMLSelectElement)?.value || 'all',
          sort_order: parseInt((document.getElementById('swal-sort') as HTMLInputElement)?.value || '0'),
        };
      },
    });

    if (formValues) {
      if (!token) return;
      try {
        const slug = getCurrentEventSlug();
        if (editingItem) {
          await adminRequest(
            'admin-timeline',
            {
              method: 'PUT',
              body: JSON.stringify({ id: editingItem.id, ...formValues }),
            },
            token
          );
        } else {
          await adminRequest(
            'admin-timeline',
            {
              method: 'POST',
              body: JSON.stringify({ slug, ...formValues }),
            },
            token
          );
        }
        await createSuccessModal('Success!', 'Timeline item saved successfully.');
        loadItems();
      } catch (err: any) {
        await createErrorModal('Error', `Failed to save: ${err.message}`);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    const result = await createDeleteModal();

    if (result.isConfirmed) {
      try {
        await adminRequest(
          `admin-timeline?id=${id}`,
          { method: 'DELETE' },
          token
        );
        await createSuccessModal('Deleted!', 'Timeline item has been deleted.');
        loadItems();
      } catch (err: any) {
        await createErrorModal('Error', `Failed to delete: ${err.message}`);
      }
    }
  };

  const columns = [
    { key: 'time', label: 'Time', sortable: true, filterable: true },
    { key: 'title', label: 'Title', sortable: true, filterable: true },
    { key: 'location', label: 'Location', sortable: true, filterable: true },
    { key: 'audience_key', label: 'Audience', sortable: true, filterable: true },
    { key: 'sort_order', label: 'Order', sortable: true },
  ];

  return (
    <div className="accommodation-admin-page">
      <div className="page-header">
        <h1>Timeline Management</h1>
        <Button variant="primary" onClick={handleAdd}>
          Add Timeline Item
        </Button>
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={items}
          onRowClick={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />
      </Card>
    </div>
  );
};

