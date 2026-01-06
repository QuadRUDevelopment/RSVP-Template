import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
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

  const handleDownloadTemplate = () => {
    // Create template with required columns
    const templateData = [
      {
        'Name': 'Example Gift Item',
        'Description': 'A beautiful example gift for your registry',
        'URL': 'https://example.com/registry/item',
        'Sort Order': '0'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Gifts');
    
    // Add instructions sheet
    const instructions = [
      ['GIFT REGISTRY IMPORT TEMPLATE'],
      [''],
      ['Required Columns:'],
      ['- Name (required) - The name of the gift item'],
      [''],
      ['Optional Columns:'],
      ['- Description (optional) - Description of the gift'],
      ['- URL (optional) - Link to the gift registry item'],
      ['- Sort Order (optional, default: 0) - Number to control display order'],
      [''],
      ['Key Column for Matching:'],
      ['- Name is used to match existing gifts'],
      ['- If match found, gift will be updated'],
      ['- If no match, new gift will be created'],
      [''],
      ['Notes:'],
      ['- Remove this instruction row before importing'],
      ['- Keep only the header row and data rows'],
      ['- Sort Order must be a number']
    ];
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');
    
    XLSX.writeFile(wb, 'gifts-import-template.xlsx');
    createSuccessModal('Template Downloaded!', 'Fill in the template and import it back.');
  };

  const validateImportData = (data: any[]): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (data.length === 0) {
      errors.push('File is empty or has no data rows');
      return { valid: false, errors };
    }

    // Check first row for required columns
    const firstRow = data[0];
    const columns = Object.keys(firstRow);
    
    if (!columns.includes('Name')) {
      errors.push('Missing required column: Name');
    }

    // Validate each row
    data.forEach((row, index) => {
      const rowNum = index + 2; // +2 because Excel is 1-indexed and we skip header
      
      if (!row['Name'] || !String(row['Name']).trim()) {
        errors.push(`Row ${rowNum}: Name is required`);
      }

      if (row['Sort Order']) {
        const sortOrder = parseInt(String(row['Sort Order']));
        if (isNaN(sortOrder)) {
          errors.push(`Row ${rowNum}: Sort Order must be a number`);
        }
      }

      if (row['URL'] && String(row['URL']).trim()) {
        const url = String(row['URL']).trim();
        try {
          new URL(url);
        } catch {
          errors.push(`Row ${rowNum}: Invalid URL format`);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  };

  const handleImport = async () => {
    if (!token) return;

    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        // Read file
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          await createErrorModal('Error', 'File is empty or has no data rows');
          return;
        }

        // Validate data
        const validation = validateImportData(jsonData);
        if (!validation.valid) {
          await createErrorModal(
            'Validation Errors',
            `Please fix the following errors:\n\n${validation.errors.slice(0, 10).join('\n')}${validation.errors.length > 10 ? `\n... and ${validation.errors.length - 10} more errors` : ''}`
          );
          return;
        }
        
        // Transform data
        const transformedData = jsonData.map((row: any) => ({
          name: String(row['Name'] || '').trim(),
          description: String(row['Description'] || '').trim() || undefined,
          url: String(row['URL'] || '').trim() || undefined,
          sort_order: parseInt(String(row['Sort Order'] || '0')) || 0,
        }));

        // Show confirmation
        const result = await Swal.fire({
          ...getSwalConfig(),
          title: 'Confirm Import',
          html: `
            <p>You are about to import <strong>${transformedData.length}</strong> gift(s).</p>
            <p style="font-size: 0.875rem; color: #6b7280; margin-top: 1rem;">
              Gifts will be matched by Name.<br>
              If a match is found, the gift will be updated.<br>
              If no match is found, a new gift will be created.
            </p>
          `,
          showCancelButton: true,
          confirmButtonText: 'Import',
          cancelButtonText: 'Cancel',
        });

        if (!result.isConfirmed) return;

        // Import gifts (create or update)
        const slug = getCurrentEventSlug();
        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        for (const giftData of transformedData) {
          try {
            // Check if gift exists (by name)
            const existingGift = gifts.find(
              g => g.name?.toLowerCase() === giftData.name.toLowerCase()
            );

            if (existingGift) {
              // Update existing gift
              await adminRequest(
                'admin-gift-registry',
                {
                  method: 'POST',
                  body: JSON.stringify({ id: existingGift.id, slug, ...giftData }),
                },
                token
              );
            } else {
              // Create new gift
              await adminRequest(
                'admin-gift-registry',
                {
                  method: 'POST',
                  body: JSON.stringify({ slug, ...giftData }),
                },
                token
              );
            }
            successCount++;
          } catch (err: any) {
            errorCount++;
            errors.push(`${giftData.name}: ${err.message}`);
          }
        }

        // Show results
        if (errorCount === 0) {
          await createSuccessModal(
            'Import Successful!',
            `Successfully imported ${successCount} gift(s).`
          );
        } else {
          await createErrorModal(
            'Import Completed with Errors',
            `Imported: ${successCount}\nErrors: ${errorCount}\n\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... and ${errors.length - 5} more` : ''}`
          );
        }

        // Reload gifts
        loadGifts();
      } catch (err: any) {
        await createErrorModal('Error', `Failed to import: ${err.message}`);
      }
    };

    input.click();
  };

  const handleExport = async (format: 'xlsx' | 'csv' | 'json') => {
    if (!token) return;
    try {
      const slug = getCurrentEventSlug();
      
      if (format === 'xlsx') {
        // Export to Excel using XLSX library
        const exportData = gifts.map((gift: any) => ({
          'Name': gift.name || '',
          'Description': gift.description || '',
          'URL': gift.url || '',
          'Sort Order': gift.sort_order || 0,
          'Status': gift.booked ? 'Booked' : 'Available',
          'Booked By': gift.booked_by?.guest_name || '',
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Gifts');
        XLSX.writeFile(wb, `gifts-${slug}-${Date.now()}.xlsx`);
        await createSuccessModal('Export Successful!', 'Gifts exported to Excel file.');
      } else if (format === 'csv') {
        // Export to CSV
        const exportData = gifts.map((gift: any) => ({
          name: gift.name || '',
          description: gift.description || '',
          url: gift.url || '',
          sort_order: gift.sort_order || 0,
          status: gift.booked ? 'Booked' : 'Available',
          booked_by: gift.booked_by?.guest_name || '',
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gifts-${slug}-${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        await createSuccessModal('Export Successful!', 'Gifts exported to CSV file.');
      } else {
        // Export to JSON
        const exportData = gifts.map((gift: any) => ({
          name: gift.name,
          description: gift.description,
          url: gift.url,
          sort_order: gift.sort_order,
          booked: gift.booked,
          booked_by: gift.booked_by,
        }));

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gifts-${slug}-${Date.now()}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
        await createSuccessModal('Export Successful!', 'Gifts exported to JSON file.');
      }
    } catch (err: any) {
      await createErrorModal('Error', `Export failed: ${err.message}`);
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
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button variant="outline" onClick={handleDownloadTemplate}>
            📥 Download Template
          </Button>
          <Button variant="outline" onClick={handleImport}>
            📤 Import Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport('xlsx')}>
            Export Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport('csv')}>
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('json')}>
            Export JSON
          </Button>
          <Button variant="primary" onClick={handleAdd}>
            Add Gift
          </Button>
        </div>
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

