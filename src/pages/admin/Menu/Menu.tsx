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

export const Menu: React.FC = () => {
  const { token } = useAdminAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, [token]);

  const loadItems = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const slug = getCurrentEventSlug();
      const data = await adminRequest(
        `admin-menu?slug=${encodeURIComponent(slug)}`,
        { method: 'GET' },
        token
      );
      setItems(data.menuItems || []);
    } catch (err) {
      console.error('Failed to load menu items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    showMenuForm();
  };

  const handleEdit = (item: any) => {
    showMenuForm(item);
  };

  const showMenuForm = async (editingItem: any = null) => {
    const dietTagsStr = editingItem?.diet_tags && Array.isArray(editingItem.diet_tags) 
      ? editingItem.diet_tags.join(', ') 
      : '';

    const { value: formValues } = await Swal.fire({
      ...getSwalConfig(),
      title: editingItem ? 'Edit Menu Item' : 'Add Menu Item',
      html: `
        <label for="swal-category" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-bottom: 0.5rem;">Category *</label>
        <select id="swal-category" class="swal2-custom-select">
          <option value="Starter" ${editingItem?.category === 'Starter' ? 'selected' : ''}>Starter</option>
          <option value="Main" ${!editingItem || editingItem?.category === 'Main' ? 'selected' : ''}>Main</option>
          <option value="Dessert" ${editingItem?.category === 'Dessert' ? 'selected' : ''}>Dessert</option>
          <option value="Drinks" ${editingItem?.category === 'Drinks' ? 'selected' : ''}>Drinks</option>
          <option value="Other" ${editingItem?.category === 'Other' ? 'selected' : ''}>Other</option>
        </select>
        <label for="swal-name" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Name *</label>
        <input id="swal-name" class="swal2-custom-input" placeholder="Enter menu item name" value="${editingItem?.name || ''}" required>
        <label for="swal-description" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Description</label>
        <textarea id="swal-description" class="swal2-custom-textarea" placeholder="Enter description">${editingItem?.description || ''}</textarea>
        <label for="swal-diet-tags" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Dietary Tags</label>
        <input id="swal-diet-tags" class="swal2-custom-input" placeholder="Comma-separated (e.g., vegan, vegetarian, gluten-free)" value="${dietTagsStr}">
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
        const dietTagsInput = (document.getElementById('swal-diet-tags') as HTMLInputElement)?.value || '';
        const dietTags = dietTagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
        return {
          category: (document.getElementById('swal-category') as HTMLSelectElement)?.value || 'Main',
          name,
          description: (document.getElementById('swal-description') as HTMLTextAreaElement)?.value || '',
          diet_tags: dietTags,
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
            'admin-menu',
            {
              method: 'PUT',
              body: JSON.stringify({ id: editingItem.id, ...formValues }),
            },
            token
          );
        } else {
          await adminRequest(
            'admin-menu',
            {
              method: 'POST',
              body: JSON.stringify({ slug, ...formValues }),
            },
            token
          );
        }
        await createSuccessModal('Success!', 'Menu item saved successfully.');
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
          `admin-menu?id=${id}`,
          { method: 'DELETE' },
          token
        );
        await createSuccessModal('Deleted!', 'Menu item has been deleted.');
        loadItems();
      } catch (err: any) {
        await createErrorModal('Error', `Failed to delete: ${err.message}`);
      }
    }
  };

  const columns = [
    { key: 'category', label: 'Category', sortable: true, filterable: true },
    { key: 'name', label: 'Name', sortable: true, filterable: true },
    { key: 'description', label: 'Description', filterable: true },
    {
      key: 'diet_tags',
      label: 'Diet Tags',
      filterable: true,
      render: (value: any) => (value && Array.isArray(value) ? value.join(', ') : '-'),
    },
    { key: 'sort_order', label: 'Order', sortable: true },
  ];

  return (
    <div className="accommodation-admin-page">
      <div className="page-header">
        <h1>Menu Management</h1>
        <Button variant="primary" onClick={handleAdd}>
          Add Menu Item
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

