import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { getSwalConfig, createSuccessModal, createErrorModal, createDeleteModal } from '../../../lib/sweetalert2Config';
import { Card } from '../../../components/ui/Card/Card';
import { Button } from '../../../components/ui/Button/Button';
import { DataTable } from '../../../components/ui/DataTable/DataTable';
import { getCurrentEventSlug } from '../../../lib/eventResolver';
import { adminRequest } from '../../../lib/apiClient';
import { useAdminAuth } from '../../../state/useAdminAuth';
import '../Accommodation/Accommodation.css';

export const Groups: React.FC = () => {
  const { token } = useAdminAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroups();
  }, [token]);

  const loadGroups = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const slug = getCurrentEventSlug();
      const data = await adminRequest(
        `admin-groups?slug=${encodeURIComponent(slug)}`,
        { method: 'GET' },
        token
      );
      setGroups(data.groups || []);
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    showGroupForm();
  };

  const handleEdit = (group: any) => {
    showGroupForm(group);
  };

  const showGroupForm = async (editingGroup: any = null) => {
    const { value: formValues } = await Swal.fire({
      ...getSwalConfig(),
      title: editingGroup ? 'Edit Group' : 'Add Group',
      html: `
        <label for="swal-key" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-bottom: 0.5rem;">Key *</label>
        <input id="swal-key" class="swal2-custom-input" placeholder="e.g., family, friends, vip" value="${editingGroup?.key || ''}" ${editingGroup ? 'readonly' : ''} required>
        <small style="display: block; font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem; margin-bottom: 0.5rem;">${editingGroup ? 'Key cannot be changed after creation' : 'Unique identifier (lowercase, no spaces)'}</small>
        <label for="swal-name" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Name *</label>
        <input id="swal-name" class="swal2-custom-input" placeholder="e.g., Family, Friends, VIP" value="${editingGroup?.name || ''}" required>
        <label for="swal-description" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Description</label>
        <textarea id="swal-description" class="swal2-custom-textarea" placeholder="Enter description">${editingGroup?.description || ''}</textarea>
        <label for="swal-sort" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Sort Order</label>
        <input id="swal-sort" class="swal2-custom-input" type="number" placeholder="0" value="${editingGroup?.sort_order || 0}">
      `,
      showCancelButton: true,
      preConfirm: () => {
        const key = (document.getElementById('swal-key') as HTMLInputElement)?.value.toLowerCase().trim();
        const name = (document.getElementById('swal-name') as HTMLInputElement)?.value;
        if (!key || !name) {
          Swal.showValidationMessage('Key and Name are required');
          return false;
        }
        if (!/^[a-z0-9_-]+$/.test(key)) {
          Swal.showValidationMessage('Key must contain only lowercase letters, numbers, hyphens, or underscores');
          return false;
        }
        return {
          key,
          name,
          description: (document.getElementById('swal-description') as HTMLTextAreaElement)?.value || '',
          sort_order: parseInt((document.getElementById('swal-sort') as HTMLInputElement)?.value || '0'),
        };
      },
    });

    if (formValues) {
      if (!token) return;
      try {
        const slug = getCurrentEventSlug();
        if (editingGroup) {
          await adminRequest(
            'admin-groups',
            {
              method: 'PUT',
              body: JSON.stringify({ id: editingGroup.id, ...formValues }),
            },
            token
          );
        } else {
          await adminRequest(
            'admin-groups',
            {
              method: 'POST',
              body: JSON.stringify({ slug, ...formValues }),
            },
            token
          );
        }
        await createSuccessModal('Success!', 'Group saved successfully.');
        loadGroups();
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
          `admin-groups?id=${id}`,
          { method: 'DELETE' },
          token
        );
        await createSuccessModal('Deleted!', 'Group has been deleted.');
        loadGroups();
      } catch (err: any) {
        await createErrorModal('Error', `Failed to delete: ${err.message}`);
      }
    }
  };

  const columns = [
    { key: 'key', label: 'Key', sortable: true, filterable: true },
    { key: 'name', label: 'Name', sortable: true, filterable: true },
    { key: 'description', label: 'Description', filterable: true },
    { key: 'sort_order', label: 'Sort Order', sortable: true },
  ];

  return (
    <div className="accommodation-admin-page">
      <div className="page-header">
        <h1>Groups Management</h1>
        <Button variant="primary" onClick={handleAdd}>
          Add Group
        </Button>
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={groups}
          onRowClick={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />
      </Card>
    </div>
  );
};

