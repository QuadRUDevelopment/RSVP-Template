import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { getSwalConfig, createSuccessModal, createErrorModal, createDeleteModal } from '../../../lib/sweetalert2Config';
import { Card } from '../../../components/ui/Card/Card';
import { Button } from '../../../components/ui/Button/Button';
import { DataTable } from '../../../components/ui/DataTable/DataTable';
import { getCurrentEventSlug } from '../../../lib/eventResolver';
import { fetchAdminQA, createQAItem, updateQAItem, deleteQAItem } from '../../../lib/apiClient';
import { useAdminAuth } from '../../../state/useAdminAuth';
import '../Accommodation/Accommodation.css';

export const QA: React.FC = () => {
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
      const data = await fetchAdminQA(slug, token);
      setItems(data.qaItems || []);
    } catch (err: any) {
      console.error('Failed to load Q&A items:', err);
      if (err.message?.includes('does not exist') || err.message?.includes('relation')) {
        await createErrorModal('Setup Required', 'Please run qa_schema.sql in your Supabase SQL editor to create the Q&A table.');
      }
    } finally {
      setLoading(false);
    }
  };

  const showItemForm = async (editingItem: any = null) => {
    const { value: formValues } = await Swal.fire({
      ...getSwalConfig(),
      title: editingItem ? 'Edit Q&A Item' : 'Add Q&A Item',
      html: `
        <label for="swal-topic" style="display:block;font-weight:500;color:#374151;font-size:0.875rem;margin-bottom:0.5rem;">Topic / Question *</label>
        <input id="swal-topic" class="swal2-custom-input" placeholder="e.g., What time does the ceremony start?" value="${editingItem?.topic?.replace(/"/g, '&quot;') || ''}" required>
        <label for="swal-description" style="display:block;font-weight:500;color:#374151;font-size:0.875rem;margin-top:1rem;margin-bottom:0.5rem;">Answer / Description *</label>
        <textarea id="swal-description" class="swal2-custom-textarea" placeholder="Provide a clear answer to the question..." rows="4">${editingItem?.description || ''}</textarea>
        <label for="swal-sort" style="display:block;font-weight:500;color:#374151;font-size:0.875rem;margin-top:1rem;margin-bottom:0.5rem;">Sort Order</label>
        <input id="swal-sort" class="swal2-custom-input" type="number" placeholder="0" value="${editingItem?.sort_order ?? 0}">
      `,
      showCancelButton: true,
      preConfirm: () => {
        const topic = (document.getElementById('swal-topic') as HTMLInputElement)?.value?.trim();
        const description = (document.getElementById('swal-description') as HTMLTextAreaElement)?.value?.trim();
        const sort_order = parseInt((document.getElementById('swal-sort') as HTMLInputElement)?.value || '0');

        if (!topic || !description) {
          Swal.showValidationMessage('Topic and Description are required');
          return false;
        }
        return {
          ...(editingItem ? { id: editingItem.id } : {}),
          topic,
          description,
          sort_order,
        };
      },
    });

    if (formValues) {
      if (!token) return;
      try {
        const slug = getCurrentEventSlug();
        if (editingItem) {
          await updateQAItem(slug, formValues, token);
          await createSuccessModal('Updated!', 'Q&A item has been updated.');
        } else {
          await createQAItem(slug, formValues, token);
          await createSuccessModal('Created!', 'Q&A item has been created.');
        }
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
        const slug = getCurrentEventSlug();
        await deleteQAItem(slug, id, token);
        await createSuccessModal('Deleted!', 'Q&A item has been deleted.');
        loadItems();
      } catch (err: any) {
        await createErrorModal('Error', `Failed to delete: ${err.message}`);
      }
    }
  };

  const columns = [
    { key: 'topic', label: 'Topic / Question', sortable: true, filterable: true },
    { key: 'description', label: 'Answer', filterable: true },
    { key: 'sort_order', label: 'Order', sortable: true },
  ];

  return (
    <div className="accommodation-admin-page">
      <div className="page-header">
        <h1>Q&amp;A / FAQ</h1>
        <Button variant="primary" onClick={() => showItemForm()}>
          Add Q&amp;A Item
        </Button>
      </div>

      <div style={{ marginBottom: '1rem', padding: '0.875rem 1rem', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#0369a1' }}>
        Enable the Q&amp;A section in <strong>Settings → Features → Q&amp;A Section</strong> to show it on the public site.
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={items}
          onRowClick={showItemForm}
          onDelete={handleDelete}
          loading={loading}
        />
      </Card>
    </div>
  );
};
