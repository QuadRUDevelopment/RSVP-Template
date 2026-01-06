import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { getSwalConfig, createSuccessModal, createErrorModal, createDeleteModal } from '../../../lib/sweetalert2Config';
import { Card } from '../../../components/ui/Card/Card';
import { Button } from '../../../components/ui/Button/Button';
import { DataTable } from '../../../components/ui/DataTable/DataTable';
import { getCurrentEventSlug } from '../../../lib/eventResolver';
import { adminRequest } from '../../../lib/apiClient';
import { useAdminAuth } from '../../../state/useAdminAuth';
import { useEventStore } from '../../../state/useEventStore';
import '../Accommodation/Accommodation.css';

export const GiftRegistry: React.FC = () => {
  const { token } = useAdminAuth();
  const { event } = useEventStore();
  const [gifts, setGifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if gift registry feature is disabled
  if (event && event.gift_registry_enabled === false) {
    return (
      <div style={{ padding: '2rem' }}>
        <Card>
          <h2>Gift Registry Feature Disabled</h2>
          <p>This feature is currently disabled. Enable it in Settings to manage gifts.</p>
          <Link to="/admin/settings">
            <Button variant="primary">Go to Settings</Button>
          </Link>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    loadGifts();
  }, [token]);

  const loadGifts = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const slug = getCurrentEventSlug();
      const data = await adminRequest(
        `admin-gift-registry?slug=${encodeURIComponent(slug)}`,
        { method: 'GET' },
        token
      );
      setGifts(data.gifts || []);
    } catch (err) {
      console.error('Failed to load gifts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    showGiftForm();
  };

  const handleEdit = (gift: any) => {
    showGiftForm(gift);
  };

  const showGiftForm = async (editingGift: any = null) => {
    const { value: formValues } = await Swal.fire({
      ...getSwalConfig(),
      title: editingGift ? 'Edit Gift' : 'Add Gift',
      html: `
        <label for="swal-name" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-bottom: 0.5rem;">Name *</label>
        <input id="swal-name" class="swal2-custom-input" placeholder="Enter gift name" value="${editingGift?.name || ''}" required>
        <label for="swal-description" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Description</label>
        <textarea id="swal-description" class="swal2-custom-textarea" placeholder="Enter gift description">${editingGift?.description || ''}</textarea>
        <label for="swal-url" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Registry URL</label>
        <input id="swal-url" class="swal2-custom-input" type="url" placeholder="https://example.com/registry" value="${editingGift?.url || ''}">
        <label for="swal-sort" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Sort Order</label>
        <input id="swal-sort" class="swal2-custom-input" type="number" placeholder="0" value="${editingGift?.sort_order || 0}">
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
          sort_order: parseInt((document.getElementById('swal-sort') as HTMLInputElement)?.value || '0'),
        };
      },
    });

    if (formValues) {
      if (!token) return;
      try {
        const slug = getCurrentEventSlug();
        if (editingGift) {
          await adminRequest(
            'admin-gift-registry',
            {
              method: 'POST',
              body: JSON.stringify({ id: editingGift.id, slug, ...formValues }),
            },
            token
          );
        } else {
          await adminRequest(
            'admin-gift-registry',
            {
              method: 'POST',
              body: JSON.stringify({ slug, ...formValues }),
            },
            token
          );
        }
        await createSuccessModal('Success!', 'Gift saved successfully.');
        loadGifts();
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
        const slug = getCurrentEventSlug();
        await adminRequest(
          `admin-gift-registry?slug=${encodeURIComponent(slug)}&id=${id}`,
          { method: 'DELETE' },
          token
        );
        await createSuccessModal('Deleted!', 'Gift has been deleted.');
        loadGifts();
      } catch (err: any) {
        await createErrorModal('Error', `Failed to delete: ${err.message}`);
      }
    }
  };

  const handleReleaseBooking = async (_giftId: string) => {
    if (!token) return;
    const result = await Swal.fire({
      ...getSwalConfig(),
      title: 'Release Booking?',
      text: 'This will make the gift available for booking again.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, release it',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
        // TODO: Add release booking API endpoint
        // For now, we'll need to manually delete the booking
        await createErrorModal('Not Implemented', 'Release booking feature will be available soon.');
      } catch (err: any) {
        await createErrorModal('Error', `Failed to release booking: ${err.message}`);
      }
    }
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true, filterable: true },
    { key: 'description', label: 'Description', filterable: true },
    {
      key: 'url',
      label: 'URL',
      render: (value: string) => value ? (
        <a href={value} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>
          View Registry
        </a>
      ) : '-',
    },
    {
      key: 'booked',
      label: 'Status',
      render: (value: boolean, row: any) => {
        if (value && row.booked_by) {
          return (
            <span style={{ color: '#dc2626', fontWeight: 500 }}>
              Booked by: {row.booked_by.guest_name}
            </span>
          );
        }
        return <span style={{ color: '#16a34a', fontWeight: 500 }}>Available</span>;
      },
    },
    { key: 'sort_order', label: 'Order', sortable: true },
  ];

  return (
    <div className="accommodation-admin-page">
      <div className="page-header">
        <h1>Gift Registry Management</h1>
        <Button variant="primary" onClick={handleAdd}>
          Add Gift
        </Button>
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={gifts}
          onRowClick={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />
      </Card>
    </div>
  );
};

