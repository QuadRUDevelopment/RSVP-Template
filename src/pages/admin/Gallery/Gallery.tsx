import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { getSwalConfig, createSuccessModal, createErrorModal, createDeleteModal } from '../../../lib/sweetalert2Config';
import { Card } from '../../../components/ui/Card/Card';
import { Button } from '../../../components/ui/Button/Button';
import { getCurrentEventSlug } from '../../../lib/eventResolver';
import { adminRequest, uploadImage } from '../../../lib/apiClient';
import { useAdminAuth } from '../../../state/useAdminAuth';
import './Gallery.css';

export const Gallery: React.FC = () => {
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
        `admin-gallery?slug=${encodeURIComponent(slug)}`,
        { method: 'GET' },
        token
      );
      setItems(data.galleryItems || []);
    } catch (err) {
      console.error('Failed to load gallery items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    showGalleryForm();
  };

  const handleEdit = (item: any) => {
    showGalleryForm(item);
  };

  const showGalleryForm = async (editingItem: any = null) => {
    const { value: formValues } = await Swal.fire({
      ...getSwalConfig(),
      title: editingItem ? 'Edit Gallery Item' : 'Add Gallery Item',
      html: `
        <div id="swal-image-upload-area" style="border: 2px dashed #d1d5db; border-radius: 0.5rem; padding: 1.5rem; text-align: center; background: #f9fafb; margin-bottom: 1rem; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='#9ca3af'; this.style.background='#f3f4f6';" onmouseout="this.style.borderColor='#d1d5db'; this.style.background='#f9fafb';" onclick="document.getElementById('swal-image-file').click();">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" style="margin: 0 auto 0.5rem; display: block;">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p style="margin: 0; color: #6b7280; font-size: 0.875rem;">Click to upload or drag & drop image here</p>
          <p style="margin: 0.25rem 0 0; color: #9ca3af; font-size: 0.75rem;">PNG, JPG, GIF up to 5MB</p>
        </div>
        <input id="swal-image-file" type="file" accept="image/*" style="display: none;" onchange="const fileName = this.files[0]?.name || 'No file selected'; document.getElementById('swal-file-name').textContent = fileName; document.getElementById('swal-image-url').value = '';">
        <div id="swal-file-name" style="font-size: 0.875rem; color: #2563eb; margin-bottom: 1rem; text-align: center; min-height: 1.25rem;"></div>
        <label for="swal-image-url" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Or Enter Image URL</label>
        <input id="swal-image-url" class="swal2-custom-input" type="url" placeholder="https://example.com/image.jpg" value="${editingItem?.url || ''}" onchange="if(this.value) { document.getElementById('swal-image-file').value = ''; document.getElementById('swal-file-name').textContent = ''; }">
        <label for="swal-caption" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Caption</label>
        <input id="swal-caption" class="swal2-custom-input" placeholder="Enter image caption" value="${editingItem?.caption || ''}">
        <label for="swal-sort" style="display: block; font-weight: 500; color: #374151; font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem;">Sort Order</label>
        <input id="swal-sort" class="swal2-custom-input" type="number" placeholder="0" value="${editingItem?.sort_order || 0}">
      `,
      showCancelButton: true,
      preConfirm: async () => {
        const fileInput = document.getElementById('swal-image-file') as HTMLInputElement;
        const urlInput = document.getElementById('swal-image-url') as HTMLInputElement;
        let imageUrl = urlInput?.value || '';

        // If file is selected, upload it first
        if (fileInput?.files && fileInput.files.length > 0) {
          const file = fileInput.files[0];
          try {
            if (!token) {
              Swal.showValidationMessage('Authentication required');
              return false;
            }
            // Convert file to base64
            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = (error) => reject(error);
            });
            const result = await uploadImage(base64, file.name, 'gallery', token);
            imageUrl = result.url;
          } catch (err: any) {
            Swal.showValidationMessage(`Upload failed: ${err.message}`);
            return false;
          }
        }

        if (!editingItem && !imageUrl) {
          Swal.showValidationMessage('Please provide an image URL or upload a file');
          return false;
        }

        return {
          url: imageUrl || editingItem?.url || '',
          caption: (document.getElementById('swal-caption') as HTMLInputElement)?.value || '',
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
            'admin-gallery',
            {
              method: 'PUT',
              body: JSON.stringify({ id: editingItem.id, ...formValues }),
            },
            token
          );
        } else {
          await adminRequest(
            'admin-gallery',
            {
              method: 'POST',
              body: JSON.stringify({ slug, ...formValues }),
            },
            token
          );
        }
        await createSuccessModal('Success!', 'Gallery item saved successfully.');
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
          `admin-gallery?id=${id}`,
          { method: 'DELETE' },
          token
        );
        await createSuccessModal('Deleted!', 'Gallery item has been deleted.');
        loadItems();
      } catch (err: any) {
        await createErrorModal('Error', `Failed to delete: ${err.message}`);
      }
    }
  };

  if (loading) {
    return <div className="gallery-loading">Loading gallery...</div>;
  }

  return (
    <div className="gallery-admin-page">
      <div className="page-header">
        <h1>Gallery Management</h1>
        <Button variant="primary" onClick={handleAdd}>
          Add Image
        </Button>
      </div>

      <div className="gallery-grid">
        {items.map((item) => (
          <Card key={item.id} className="gallery-item-card">
            <div className="gallery-image">
              <img src={item.url} alt={item.caption || 'Gallery image'} />
            </div>
            <div className="gallery-info">
              <p className="gallery-caption">{item.caption || 'No caption'}</p>
              <div className="gallery-actions">
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => handleEdit(item)}
                >
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => handleDelete(item.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {items.length === 0 && (
          <div className="gallery-empty">No images in gallery yet</div>
        )}
      </div>
    </div>
  );
};

