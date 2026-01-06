import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
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

    // Generate RSVP link if editing guest with invite code
    const inviteCode = editingGuest?.invite_code || '';
    
    // Construct the base URL - use the current origin (protocol + hostname + port)
    // This will work for both localhost and production
    const baseUrl = window.location.origin;
    
    // Generate the RSVP link with code parameter
    const finalRsvpLink = inviteCode 
      ? `${baseUrl}/rsvp?code=${encodeURIComponent(inviteCode)}`
      : '';

    // Escape HTML to prevent XSS and template breaking
    const escapeHtml = (text: string | null | undefined): string => {
      if (!text) return '';
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };

    const firstName = escapeHtml(editingGuest?.first_name);
    const lastName = escapeHtml(editingGuest?.last_name);
    const displayName = escapeHtml(editingGuest?.display_name);
    const inviteCodeEscaped = escapeHtml(editingGuest?.invite_code);
    const email = escapeHtml(editingGuest?.email);
    const phone = escapeHtml(editingGuest?.phone);
    const maxPlusOnes = editingGuest?.max_plus_ones || 0;
    
    // Get plus ones from RSVP
    const rsvp = editingGuest?.rsvps?.[0];
    const plusOnes = rsvp?.plus_ones || [];
    const plusOnesCount = rsvp?.plus_ones_count || 0;

    const { value: formValues } = await Swal.fire({
      ...getSwalConfig(),
      title: editingGuest ? 'Edit Guest' : 'Add Guest',
      html: `
        <label for="swal-first-name" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-bottom: 0.5rem;">First Name</label>
        <input id="swal-first-name" class="swal2-custom-input" placeholder="Enter first name" value="${firstName}">
        <label for="swal-last-name" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Last Name</label>
        <input id="swal-last-name" class="swal2-custom-input" placeholder="Enter last name" value="${lastName}">
        <label for="swal-display-name" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Display Name</label>
        <input id="swal-display-name" class="swal2-custom-input" placeholder="Enter display name" value="${displayName}">
        <label for="swal-invite-code" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Invite Code</label>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <input id="swal-invite-code" class="swal2-custom-input" placeholder="Auto-generated if empty" value="${inviteCodeEscaped}" style="flex: 1;">
          ${editingGuest?.invite_code ? `
            <button 
              id="swal-copy-link" 
              type="button"
              style="
                padding: 0.75rem 1rem;
                height: 100%;
                min-height: 42px;
                background-color: var(--theme-primary, #2563eb);
                color: white;
                border: none;
                border-radius: 0.5rem;
                cursor: pointer;
                font-size: 0.875rem;
                font-weight: 500;
                white-space: nowrap;
                transition: background-color 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
              "
              onmouseover="this.style.backgroundColor='var(--theme-primary-hover, #1d4ed8)'"
              onmouseout="this.style.backgroundColor='var(--theme-primary, #2563eb)'"
            >
              📋 Copy Link
            </button>
          ` : ''}
        </div>
        ${editingGuest?.invite_code ? `
          <small style="display: block; font-size: 0.75rem; color: #6b7280; margin-top: 0.5rem;">
            Share this link with the guest. The invite code will be auto-filled when they visit.
          </small>
        ` : ''}
        <label for="swal-group" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Group</label>
        <select id="swal-group" class="swal2-custom-select">
          ${groupOptions}
        </select>
        <label for="swal-max-plus-ones" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Max Plus Ones</label>
        <input id="swal-max-plus-ones" class="swal2-custom-input" type="number" min="0" placeholder="0" value="${maxPlusOnes}">
        <label for="swal-email" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Email (Optional)</label>
        <input id="swal-email" class="swal2-custom-input" type="email" placeholder="email@example.com" value="${email}">
        <label for="swal-phone" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Phone (Optional)</label>
        <input id="swal-phone" class="swal2-custom-input" type="tel" placeholder="+1234567890" value="${phone}">
        ${editingGuest && plusOnesCount > 0 ? `
          <div style="margin-top: 1.5rem; padding: 1rem; background: #f3f4f6; border-radius: 0.5rem;">
            <label style="display: block; font-weight: 600; color: #374151; font-size: 0.875rem; margin-bottom: 0.75rem;">Plus Ones (${plusOnesCount})</label>
            ${plusOnes.length > 0 ? plusOnes.map((po: any, idx: number) => `
              <div style="margin-bottom: 0.5rem; padding: 0.5rem; background: white; border-radius: 0.375rem; font-size: 0.875rem;">
                <strong>${idx + 1}.</strong> ${escapeHtml(po.name || 'Unnamed')}
              </div>
            `).join('') : '<div style="font-size: 0.875rem; color: #6b7280;">No names provided</div>'}
          </div>
        ` : ''}
      `,
      showCancelButton: true,
      didOpen: () => {
        // Add click handler for copy link button
        const copyButton = document.getElementById('swal-copy-link');
        if (copyButton && finalRsvpLink) {
          copyButton.addEventListener('click', async () => {
            try {
              await navigator.clipboard.writeText(finalRsvpLink);
              // Show success feedback
              const originalText = copyButton.textContent;
              copyButton.textContent = '✅ Copied!';
              copyButton.style.backgroundColor = '#10b981';
              setTimeout(() => {
                copyButton.textContent = originalText;
                copyButton.style.backgroundColor = '';
              }, 2000);
            } catch (err) {
              // Fallback for older browsers
              const textArea = document.createElement('textarea');
              textArea.value = finalRsvpLink;
              textArea.style.position = 'fixed';
              textArea.style.opacity = '0';
              document.body.appendChild(textArea);
              textArea.select();
              try {
                document.execCommand('copy');
                const originalText = copyButton.textContent;
                copyButton.textContent = '✅ Copied!';
                copyButton.style.backgroundColor = '#10b981';
                setTimeout(() => {
                  copyButton.textContent = originalText;
                  copyButton.style.backgroundColor = '';
                }, 2000);
              } catch (err) {
                await createErrorModal('Error', 'Failed to copy link. Please copy manually.');
              }
              document.body.removeChild(textArea);
            }
          });
        }
      },
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

  const handleDownloadTemplate = () => {
    // Create template with required columns
    const templateData = [
      {
        'First Name': 'John',
        'Last Name': 'Doe',
        'Display Name': 'John Doe',
        'Invite Code': 'ABC123',
        'Group Key': 'friends',
        'Max Plus Ones': '2',
        'Email': 'john.doe@example.com',
        'Phone': '+1234567890'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Guests');
    
    // Add instructions sheet
    const instructions = [
      ['GUEST IMPORT TEMPLATE'],
      [''],
      ['Required Columns:'],
      ['- First Name (required)'],
      ['- Last Name (required)'],
      ['- Display Name (optional, will use First + Last if empty)'],
      ['- Invite Code (optional, will auto-generate if empty)'],
      ['- Group Key (required: all, family, friends, or custom group key)'],
      ['- Max Plus Ones (number, default: 0)'],
      ['- Email (optional)'],
      ['- Phone (optional)'],
      [''],
      ['Key Column for Matching:'],
      ['- First Name + Last Name combination is used to match existing guests'],
      ['- If match found, guest will be updated'],
      ['- If no match, new guest will be created'],
      [''],
      ['Notes:'],
      ['- Remove this instruction row before importing'],
      ['- Keep only the header row and data rows'],
      ['- Group Key must match an existing group key in your event']
    ];
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');
    
    XLSX.writeFile(wb, 'guests-import-template.xlsx');
    createSuccessModal('Template Downloaded!', 'Fill in the template and import it back.');
  };

  const validateImportData = async (data: any[], validGroupKeys: string[]): Promise<{ valid: boolean; errors: string[] }> => {
    const errors: string[] = [];
    const requiredColumns = ['First Name', 'Last Name'];

    if (data.length === 0) {
      errors.push('File is empty or has no data rows');
      return { valid: false, errors };
    }

    // Check first row for required columns
    const firstRow = data[0];
    const columns = Object.keys(firstRow);
    
    requiredColumns.forEach(col => {
      if (!columns.includes(col)) {
        errors.push(`Missing required column: ${col}`);
      }
    });

    // Validate each row
    data.forEach((row, index) => {
      const rowNum = index + 2; // +2 because Excel is 1-indexed and we skip header
      
      if (!row['First Name'] || !row['Last Name']) {
        errors.push(`Row ${rowNum}: First Name and Last Name are required`);
      }

      if (row['Group Key']) {
        const groupKey = String(row['Group Key']).toLowerCase().trim();
        if (!validGroupKeys.includes(groupKey)) {
          errors.push(`Row ${rowNum}: Invalid Group Key "${row['Group Key']}". Must be one of: ${validGroupKeys.join(', ')}`);
        }
      }

      if (row['Max Plus Ones']) {
        const maxPlusOnes = parseInt(String(row['Max Plus Ones']));
        if (isNaN(maxPlusOnes) || maxPlusOnes < 0) {
          errors.push(`Row ${rowNum}: Max Plus Ones must be a non-negative number`);
        }
      }

      if (row['Email'] && String(row['Email']).trim()) {
        const email = String(row['Email']).trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push(`Row ${rowNum}: Invalid email format`);
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
    input.style.display = 'none'; // Hide it
    document.body.appendChild(input); // Add to DOM (required for some browsers)

    // Handle cleanup if user cancels
    const cleanup = () => {
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    };

    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      
      // Clean up input element
      cleanup();
      
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

        // Fetch groups to validate group keys
        const slug = getCurrentEventSlug();
        let groups: any[] = [];
        try {
          const groupsData = await fetchGroups(slug, token);
          groups = groupsData.groups || [];
        } catch (err) {
          console.error('Failed to load groups:', err);
          // Fallback to default groups
          groups = [
            { key: 'all', name: 'All' },
            { key: 'family', name: 'Family' },
            { key: 'friends', name: 'Friends' },
          ];
        }

        const validGroupKeys = groups.map(g => g.key.toLowerCase());

        // Validate data
        const validation = await validateImportData(jsonData, validGroupKeys);
        if (!validation.valid) {
          await createErrorModal(
            'Validation Errors',
            `Please fix the following errors:\n\n${validation.errors.slice(0, 10).join('\n')}${validation.errors.length > 10 ? `\n... and ${validation.errors.length - 10} more errors` : ''}`
          );
          return;
        }
        
        // Transform data (validation already done above)
        const transformedData = jsonData.map((row: any) => {
          const groupKey = (row['Group Key'] || 'all').toLowerCase().trim();

          return {
            first_name: String(row['First Name'] || '').trim(),
            last_name: String(row['Last Name'] || '').trim(),
            display_name: String(row['Display Name'] || '').trim() || undefined,
            invite_code: String(row['Invite Code'] || '').trim().toUpperCase() || undefined,
            group_key: groupKey,
            max_plus_ones: parseInt(String(row['Max Plus Ones'] || '0')) || 0,
            email: String(row['Email'] || '').trim() || undefined,
            phone: String(row['Phone'] || '').trim() || undefined,
          };
        });

        // Show confirmation
        const result = await Swal.fire({
          ...getSwalConfig(),
          title: 'Confirm Import',
          html: `
            <p>You are about to import <strong>${transformedData.length}</strong> guest(s).</p>
            <p style="font-size: 0.875rem; color: #6b7280; margin-top: 1rem;">
              Guests will be matched by First Name + Last Name combination.<br>
              If a match is found, the guest will be updated.<br>
              If no match is found, a new guest will be created.
            </p>
          `,
          showCancelButton: true,
          confirmButtonText: 'Import',
          cancelButtonText: 'Cancel',
        });

        if (!result.isConfirmed) return;

        // Import guests (create or update) with progress
        const totalGuests = transformedData.length;
        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        // Show progress modal
        Swal.fire({
          ...getSwalConfig(),
          title: 'Importing Guests...',
          html: `
            <div style="text-align: center;">
              <div style="margin-bottom: 1rem;">
                <div style="width: 100%; height: 20px; background: #e5e7eb; border-radius: 10px; overflow: hidden;">
                  <div id="progress-bar" style="width: 0%; height: 100%; background: #2563eb; transition: width 0.3s; border-radius: 10px;"></div>
                </div>
              </div>
              <p id="progress-text" style="color: #6b7280; font-size: 0.875rem; margin: 0;">
                Processing 0 of ${totalGuests} guests...
              </p>
              <p id="progress-details" style="color: #9ca3af; font-size: 0.75rem; margin-top: 0.5rem;">
                Success: 0 | Errors: 0
              </p>
            </div>
          `,
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
        });

        // Update progress function
        const updateProgress = (current: number, success: number, error: number) => {
          const percentage = Math.round((current / totalGuests) * 100);
          const progressBar = document.getElementById('progress-bar');
          const progressText = document.getElementById('progress-text');
          const progressDetails = document.getElementById('progress-details');
          
          if (progressBar) {
            progressBar.style.width = `${percentage}%`;
          }
          if (progressText) {
            progressText.textContent = `Processing ${current} of ${totalGuests} guests...`;
          }
          if (progressDetails) {
            progressDetails.textContent = `Success: ${success} | Errors: ${error}`;
          }
        };

        for (let i = 0; i < transformedData.length; i++) {
          const guestData = transformedData[i];
          const currentIndex = i + 1;
          
          try {
            // Check if guest exists (by first_name + last_name)
            const existingGuests = guests.filter(
              g => g.first_name?.toLowerCase() === guestData.first_name.toLowerCase() &&
                   g.last_name?.toLowerCase() === guestData.last_name.toLowerCase()
            );

            if (existingGuests.length > 0) {
              // Update existing guest
              await adminRequest(
                'admin-guests',
                {
                  method: 'PUT',
                  body: JSON.stringify({ id: existingGuests[0].id, ...guestData }),
                },
                token
              );
            } else {
              // Create new guest
              await adminRequest(
                'admin-guests',
                {
                  method: 'POST',
                  body: JSON.stringify({ slug, ...guestData }),
                },
                token
              );
            }
            successCount++;
          } catch (err: any) {
            errorCount++;
            errors.push(`${guestData.first_name} ${guestData.last_name}: ${err.message}`);
          }
          
          // Update progress
          updateProgress(currentIndex, successCount, errorCount);
          
          // Small delay to allow UI to update
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Close progress modal
        Swal.close();

        // Show results
        if (errorCount === 0) {
          await createSuccessModal(
            'Import Successful!',
            `Successfully imported ${successCount} guest(s).`
          );
        } else {
          await createErrorModal(
            'Import Completed with Errors',
            `Imported: ${successCount}\nErrors: ${errorCount}\n\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... and ${errors.length - 5} more` : ''}`
          );
        }

        // Reload guests
        loadGuests();
      } catch (err: any) {
        await createErrorModal('Import Error', err.message || 'Failed to import guests');
      }
    };

    // Handle case where user cancels file picker
    input.oncancel = () => {
      cleanup();
    };

    // Trigger file picker
    input.click();
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
        const plusOnes = rsvp?.plus_ones || [];
        const count = rsvp?.plus_ones_count || 0;
        
        if (count === 0) {
          return '0';
        }
        
        // Show count and names
        const names = plusOnes.map((po: any) => po.name).filter(Boolean);
        if (names.length > 0) {
          return `${count} - ${names.join(', ')}`;
        }
        return `${count} (no names)`;
      },
    },
    {
      key: 'custom_fields',
      label: 'Custom Fields',
      sortable: false,
      render: (_value: any, row: any) => {
        const rsvp = row.rsvps?.[0];
        const customResponses = rsvp?.custom_rsvp_field_responses || [];
        
        if (customResponses.length === 0) {
          return <span style={{ color: '#9ca3af' }}>-</span>;
        }
        
        // Show count and allow clicking to view details
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              showCustomFieldsModal(row);
            }}
            style={{
              background: 'none',
              border: '1px solid #2563eb',
              color: '#2563eb',
              padding: '0.25rem 0.75rem',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            View ({customResponses.length})
          </button>
        );
      },
    },
  ];

  const showCustomFieldsModal = async (guest: any) => {
    const rsvp = guest.rsvps?.[0];
    const customResponses = rsvp?.custom_rsvp_field_responses || [];
    
    if (customResponses.length === 0) {
      await createErrorModal('No Custom Fields', 'This guest has not submitted any custom field responses.');
      return;
    }

    const fieldsHtml = customResponses
      .map((response: any) => {
        const field = response.custom_rsvp_fields;
        if (!field) return '';
        return `
          <div style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #e5e7eb;">
            <strong style="display: block; margin-bottom: 0.5rem; color: #374151;">${field.label}</strong>
            <span style="color: #6b7280;">${response.value || '(empty)'}</span>
          </div>
        `;
      })
      .join('');

    await Swal.fire({
      ...getSwalConfig(),
      title: `Custom Fields - ${guest.display_name || `${guest.first_name} ${guest.last_name}`}`,
      html: `
        <div style="text-align: left; max-height: 400px; overflow-y: auto;">
          ${fieldsHtml}
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: 'Close',
      showCancelButton: false,
      width: '600px',
    });
  };

  return (
    <div className="guests-page">
      <div className="guests-header">
        <h1>Guests Management</h1>
        <div className="guests-actions">
          <Button variant="outline" onClick={handleDownloadTemplate}>
            📥 Download Template
          </Button>
          <Button variant="outline" onClick={handleImport}>
            📤 Import Excel
          </Button>
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

