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
import './Accommodation.css';

export const Accommodation: React.FC = () => {
  const { token } = useAdminAuth();
  const { event } = useEventStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if accommodation feature is disabled
  if (event && event.accommodation_enabled === false) {
    return (
      <div style={{ padding: '2rem' }}>
        <Card>
          <h2>Accommodation Feature Disabled</h2>
          <p>This feature is currently disabled. Enable it in Settings to manage accommodations.</p>
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
        `admin-accommodation?slug=${encodeURIComponent(slug)}`,
        { method: 'GET' },
        token
      );
      setItems(data.accommodations || []);
    } catch (err) {
      console.error('Failed to load accommodations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    showAccommodationForm();
  };

  const handleEdit = (item: any) => {
    showAccommodationForm(item);
  };

  const showAccommodationForm = async (editingItem: any = null) => {
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
      title: editingItem ? 'Edit Accommodation' : 'Add Accommodation',
      html: `
        <label for="swal-name" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-bottom: 0.5rem;">Name *</label>
        <input id="swal-name" class="swal2-custom-input" placeholder="Enter accommodation name" value="${editingItem?.name || ''}" required>
        <label for="swal-description" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Description</label>
        <textarea id="swal-description" class="swal2-custom-textarea" placeholder="Enter description">${editingItem?.description || ''}</textarea>
        <label for="swal-url" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">URL</label>
        <input id="swal-url" class="swal2-custom-input" type="url" placeholder="https://example.com" value="${editingItem?.url || ''}">
        <label for="swal-price" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Price</label>
        <input id="swal-price" class="swal2-custom-input" placeholder="Enter price" value="${editingItem?.price || ''}">
        <label for="swal-address" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Address</label>
        <input id="swal-address" class="swal2-custom-input" placeholder="Enter full address" value="${editingItem?.address || ''}">
        <small style="display: block; font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem; margin-bottom: 0.5rem;">Used for Google Maps directions</small>
        <label for="swal-map-url" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Google Maps Embed URL (Optional)</label>
        <input id="swal-map-url" class="swal2-custom-input" type="url" placeholder="https://www.google.com/maps/embed?pb=..." value="${editingItem?.map_url || ''}">
        <small style="display: block; font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem; margin-bottom: 0.5rem;">
          <strong>How to get:</strong> Google Maps → Search venue → Share → Embed a map → Copy iframe src URL<br>
          <strong style="color: #10b981;">✓ No API key required!</strong> Embeds work without credentials.
        </small>
        <label for="swal-audience" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Audience</label>
        <select id="swal-audience" class="swal2-custom-select">
          ${groupOptions}
        </select>
        <label for="swal-sort" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Sort Order</label>
        <input id="swal-sort" class="swal2-custom-input" type="number" placeholder="0" value="${editingItem?.sort_order || 0}">
      `,
      showCancelButton: true,
      preConfirm: () => {
        const name = (document.getElementById('swal-name') as HTMLInputElement)?.value;
        if (!name) {
          Swal.showValidationMessage('Name is required');
          return false;
        }
        return {
          name,
          description: (document.getElementById('swal-description') as HTMLTextAreaElement)?.value || '',
          url: (document.getElementById('swal-url') as HTMLInputElement)?.value || '',
          price: (document.getElementById('swal-price') as HTMLInputElement)?.value || '',
          address: (document.getElementById('swal-address') as HTMLInputElement)?.value || '',
          map_url: (document.getElementById('swal-map-url') as HTMLInputElement)?.value || '',
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
            'admin-accommodation',
            {
              method: 'PUT',
              body: JSON.stringify({ id: editingItem.id, ...formValues }),
            },
            token
          );
        } else {
          await adminRequest(
            'admin-accommodation',
            {
              method: 'POST',
              body: JSON.stringify({ slug, ...formValues }),
            },
            token
          );
        }
        await createSuccessModal('Success!', 'Accommodation saved successfully.');
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
          `admin-accommodation?id=${id}`,
          { method: 'DELETE' },
          token
        );
        await createSuccessModal('Deleted!', 'Accommodation has been deleted.');
        loadItems();
      } catch (err: any) {
        await createErrorModal('Error', `Failed to delete: ${err.message}`);
      }
    }
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true, filterable: true },
    { key: 'description', label: 'Description', filterable: true },
    { key: 'price', label: 'Price', sortable: true, filterable: true },
    { key: 'audience_key', label: 'Audience', sortable: true, filterable: true },
    { key: 'sort_order', label: 'Order', sortable: true },
  ];

  return (
    <div className="accommodation-admin-page">
      <div className="page-header">
        <h1>Accommodation Management</h1>
        <Button variant="primary" onClick={handleAdd}>
          Add Accommodation
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

