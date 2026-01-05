import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { getSwalConfig, createSuccessModal, createErrorModal, createDeleteModal } from '../../../lib/sweetalert2Config';
import { Card } from '../../../components/ui/Card/Card';
import { Button } from '../../../components/ui/Button/Button';
import { DataTable } from '../../../components/ui/DataTable/DataTable';
import { getCurrentEventSlug } from '../../../lib/eventResolver';
import { adminRequest, fetchGroups } from '../../../lib/apiClient';
import { useAdminAuth } from '../../../state/useAdminAuth';
import './Guests.css';

export const Guests: React.FC = () => {
  const { token } = useAdminAuth();
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGuests();
  }, [token]);

  const loadGuests = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const slug = getCurrentEventSlug();
      const data = await adminRequest(
        `admin-guests?slug=${encodeURIComponent(slug)}`,
        { method: 'GET' },
        token
      );
      setGuests(data.guests || []);
    } catch (err) {
      console.error('Failed to load guests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    showGuestForm();
  };

  const handleEdit = (guest: any) => {
    showGuestForm(guest);
  };

  const showGuestForm = async (editingGuest: any = null) => {
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
      `<option value="${g.key}" ${editingGuest?.group_key === g.key ? 'selected' : ''}>${g.name}</option>`
    ).join('');

    const { value: formValues } = await Swal.fire({
      ...getSwalConfig(),
      title: editingGuest ? 'Edit Guest' : 'Add Guest',
      html: `
        <label for="swal-first-name" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-bottom: 0.5rem;">First Name</label>
        <input id="swal-first-name" class="swal2-custom-input" placeholder="Enter first name" value="${editingGuest?.first_name || ''}">
        <label for="swal-last-name" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Last Name</label>
        <input id="swal-last-name" class="swal2-custom-input" placeholder="Enter last name" value="${editingGuest?.last_name || ''}">
        <label for="swal-display-name" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Display Name</label>
        <input id="swal-display-name" class="swal2-custom-input" placeholder="Enter display name" value="${editingGuest?.display_name || ''}">
        <label for="swal-invite-code" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Invite Code</label>
        <input id="swal-invite-code" class="swal2-custom-input" placeholder="Auto-generated if empty" value="${editingGuest?.invite_code || ''}">
        <label for="swal-group" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Group</label>
        <select id="swal-group" class="swal2-custom-select">
          ${groupOptions}
        </select>
        <label for="swal-max-plus-ones" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Max Plus Ones</label>
        <input id="swal-max-plus-ones" class="swal2-custom-input" type="number" min="0" placeholder="0" value="${editingGuest?.max_plus_ones || 0}">
        <label for="swal-email" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Email (Optional)</label>
        <input id="swal-email" class="swal2-custom-input" type="email" placeholder="email@example.com" value="${editingGuest?.email || ''}">
        <label for="swal-phone" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Phone (Optional)</label>
        <input id="swal-phone" class="swal2-custom-input" type="tel" placeholder="+1234567890" value="${editingGuest?.phone || ''}">
      `,
      showCancelButton: true,
      preConfirm: () => {
        return {
          first_name: (document.getElementById('swal-first-name') as HTMLInputElement)?.value || '',
          last_name: (document.getElementById('swal-last-name') as HTMLInputElement)?.value || '',
          display_name: (document.getElementById('swal-display-name') as HTMLInputElement)?.value || '',
          invite_code: (document.getElementById('swal-invite-code') as HTMLInputElement)?.value.toUpperCase() || '',
          group_key: (document.getElementById('swal-group') as HTMLSelectElement)?.value || 'all',
          max_plus_ones: parseInt((document.getElementById('swal-max-plus-ones') as HTMLInputElement)?.value || '0'),
          email: (document.getElementById('swal-email') as HTMLInputElement)?.value || '',
          phone: (document.getElementById('swal-phone') as HTMLInputElement)?.value || '',
        };
      },
    });

    if (formValues) {
      if (!token) return;
      try {
        const slug = getCurrentEventSlug();
        if (editingGuest) {
          await adminRequest(
            'admin-guests',
            {
              method: 'PUT',
              body: JSON.stringify({ id: editingGuest.id, ...formValues }),
            },
            token
          );
        } else {
          await adminRequest(
            'admin-guests',
            {
              method: 'POST',
              body: JSON.stringify({ slug, ...formValues }),
            },
            token
          );
        }
        await createSuccessModal('Success!', 'Guest saved successfully.');
        loadGuests();
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
          `admin-guests?id=${id}`,
          { method: 'DELETE' },
          token
        );
        await createSuccessModal('Deleted!', 'Guest has been deleted.');
        loadGuests();
      } catch (err: any) {
        await createErrorModal('Error', `Failed to delete: ${err.message}`);
      }
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    if (!token) return;
    try {
      const slug = getCurrentEventSlug();
      const response = await fetch(
        `${import.meta.env.DEV ? 'http://localhost:8888' : ''}/.netlify/functions/admin-export?slug=${encodeURIComponent(slug)}&format=${format}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      if (format === 'csv') {
        const csv = await response.text();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `guests-${slug}-${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `guests-${slug}-${Date.now()}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      await createErrorModal('Error', `Export failed: ${err.message}`);
    }
  };

  const columns = [
    { key: 'invite_code', label: 'Invite Code', sortable: true, filterable: true },
    {
      key: 'display_name',
      label: 'Name',
      sortable: true,
      filterable: true,
      render: (value: any, row: any) =>
        value || `${row.first_name || ''} ${row.last_name || ''}`.trim() || '-',
    },
    { key: 'group_key', label: 'Group', sortable: true, filterable: true },
    {
      key: 'rsvp_status',
      label: 'RSVP Status',
      sortable: true,
      filterable: true,
      render: (_value: any, row: any) => {
        const rsvp = row.rsvps?.[0];
        return rsvp?.status || 'Not Submitted';
      },
    },
    { key: 'max_plus_ones', label: 'Max Plus Ones', sortable: true },
    {
      key: 'plus_ones',
      label: 'Plus Ones',
      sortable: true,
      render: (_value: any, row: any) => {
        const rsvp = row.rsvps?.[0];
        return rsvp?.plus_ones_count || 0;
      },
    },
  ];

  return (
    <div className="guests-page">
      <div className="guests-header">
        <h1>Guests Management</h1>
        <div className="guests-actions">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('json')}>
            Export JSON
          </Button>
          <Button variant="primary" onClick={handleAdd}>
            Add Guest
          </Button>
        </div>
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={guests}
          onRowClick={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />
      </Card>
    </div>
  );
};

