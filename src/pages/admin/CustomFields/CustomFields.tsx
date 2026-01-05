import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { getSwalConfig, createSuccessModal, createErrorModal, createDeleteModal } from '../../../lib/sweetalert2Config';
import { Card } from '../../../components/ui/Card/Card';
import { Button } from '../../../components/ui/Button/Button';
import { DataTable } from '../../../components/ui/DataTable/DataTable';
import { getCurrentEventSlug } from '../../../lib/eventResolver';
import { fetchCustomFields, createCustomField, updateCustomField, deleteCustomField } from '../../../lib/apiClient';
import { useAdminAuth } from '../../../state/useAdminAuth';
import '../Accommodation/Accommodation.css';

export const CustomFields: React.FC = () => {
  const { token } = useAdminAuth();
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFields();
  }, [token]);

  const loadFields = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const slug = getCurrentEventSlug();
      const data = await fetchCustomFields(slug, token);
      setFields(data.customFields || []);
    } catch (err) {
      console.error('Failed to load custom fields:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    showFieldForm();
  };

  const handleEdit = (field: any) => {
    showFieldForm(field);
  };

  const showFieldForm = async (editingField: any = null) => {
    const fieldTypes = [
      { value: 'text', label: 'Text Input' },
      { value: 'textarea', label: 'Textarea' },
      { value: 'select', label: 'Select Dropdown' },
      { value: 'checkbox', label: 'Checkbox' },
      { value: 'number', label: 'Number' },
      { value: 'email', label: 'Email' },
      { value: 'tel', label: 'Phone' },
      { value: 'url', label: 'URL' },
    ];

    const fieldTypeOptions = fieldTypes.map(
      (type) => `<option value="${type.value}" ${editingField?.field_type === type.value ? 'selected' : ''}>${type.label}</option>`
    ).join('');

    const { value: formValues } = await Swal.fire({
      ...getSwalConfig(),
      title: editingField ? 'Edit Custom Field' : 'Add Custom Field',
      html: `
        <label for="swal-label" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-bottom: 0.5rem;">Field Label *</label>
        <input id="swal-label" class="swal2-custom-input" placeholder="e.g., Food Allergies, Favorite Song" value="${editingField?.label || ''}" required>
        <label for="swal-type" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Field Type *</label>
        <select id="swal-type" class="swal2-custom-select" required>
          ${fieldTypeOptions}
        </select>
        <label for="swal-placeholder" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Placeholder Text</label>
        <input id="swal-placeholder" class="swal2-custom-input" placeholder="e.g., Enter your food allergies" value="${editingField?.placeholder || ''}">
        <label for="swal-required" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Required Field</label>
        <select id="swal-required" class="swal2-custom-select">
          <option value="false" ${!editingField?.required ? 'selected' : ''}>No</option>
          <option value="true" ${editingField?.required ? 'selected' : ''}>Yes</option>
        </select>
        <label for="swal-options" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Options (for Select fields only)</label>
        <textarea id="swal-options" class="swal2-custom-textarea" placeholder="Enter options, one per line (e.g., Option 1&#10;Option 2&#10;Option 3)">${editingField?.options?.options ? editingField.options.options.join('\n') : ''}</textarea>
        <small style="display: block; font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem; margin-bottom: 0.5rem;">Only used for Select field type. Enter one option per line.</small>
        <label for="swal-sort" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Sort Order</label>
        <input id="swal-sort" class="swal2-custom-input" type="number" placeholder="0" value="${editingField?.sort_order || 0}">
      `,
      showCancelButton: true,
      preConfirm: () => {
        const label = (document.getElementById('swal-label') as HTMLInputElement)?.value;
        const field_type = (document.getElementById('swal-type') as HTMLSelectElement)?.value;
        const placeholder = (document.getElementById('swal-placeholder') as HTMLInputElement)?.value;
        const required = (document.getElementById('swal-required') as HTMLSelectElement)?.value === 'true';
        const optionsText = (document.getElementById('swal-options') as HTMLTextAreaElement)?.value;
        const sort_order = parseInt((document.getElementById('swal-sort') as HTMLInputElement)?.value || '0');

        if (!label || !field_type) {
          Swal.showValidationMessage('Label and Field Type are required');
          return false;
        }

        let options = null;
        if (field_type === 'select' && optionsText) {
          const optionList = optionsText.split('\n').filter(opt => opt.trim()).map(opt => opt.trim());
          if (optionList.length > 0) {
            options = { options: optionList };
          }
        }

        return {
          ...(editingField ? { id: editingField.id } : {}),
          label,
          field_type,
          placeholder: placeholder || null,
          required,
          options,
          sort_order,
        };
      },
    });

    if (formValues) {
      if (!token) return;
      try {
        const slug = getCurrentEventSlug();
        if (editingField) {
          await updateCustomField(slug, formValues, token);
          await createSuccessModal('Updated!', 'Custom field has been updated.');
        } else {
          await createCustomField(slug, formValues, token);
          await createSuccessModal('Created!', 'Custom field has been created.');
        }
        loadFields();
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
        await deleteCustomField(slug, id, token);
        await createSuccessModal('Deleted!', 'Custom field has been deleted.');
        loadFields();
      } catch (err: any) {
        await createErrorModal('Error', `Failed to delete: ${err.message}`);
      }
    }
  };

  const columns = [
    { key: 'label', label: 'Label', sortable: true, filterable: true },
    { key: 'field_type', label: 'Type', sortable: true, filterable: true },
    { key: 'required', label: 'Required', sortable: true },
    { key: 'sort_order', label: 'Order', sortable: true },
  ];

  return (
    <div className="accommodation-admin-page">
      <div className="page-header">
        <h1>Custom RSVP Fields</h1>
        <Button variant="primary" onClick={handleAdd}>
          Add Custom Field
        </Button>
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={fields}
          onRowClick={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />
      </Card>
    </div>
  );
};

