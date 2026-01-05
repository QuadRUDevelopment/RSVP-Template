import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../Button/Button';
import './ImageUpload.css';

interface ImageUploadProps {
  currentImageUrl?: string;
  onUpload: (imageUrl: string) => Promise<void> | void;
  folder?: string;
  label?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImageUrl,
  onUpload,
  folder = 'general',
  label = 'Upload Image',
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Update preview when currentImageUrl changes
  useEffect(() => {
    if (currentImageUrl) {
      setPreview(currentImageUrl);
    }
  }, [currentImageUrl]);

  const processFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const { adminRequest } = await import('../../../lib/apiClient');
      const { getCurrentEventSlug } = await import('../../../lib/eventResolver');
      const { useAdminAuth } = await import('../../../state/useAdminAuth');
      
      const slug = getCurrentEventSlug();
      const token = useAdminAuth.getState().token;

      if (!token) {
        throw new Error('Not authenticated');
      }

      const result = await adminRequest(
        'admin-upload-image',
        {
          method: 'POST',
          body: JSON.stringify({
            slug,
            imageData: base64,
            fileName: file.name,
            folder,
          }),
        },
        token
      );

      await onUpload(result.url);
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
      setPreview(currentImageUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  return (
    <div className="image-upload">
      {label && <label className="image-upload-label">{label}</label>}
      <div 
        ref={dropZoneRef}
        className={`image-upload-container ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="image-input"
          id={`image-upload-input-${folder}`}
        />
        {preview ? (
          <div className="image-preview">
            <img src={preview} alt="Preview" />
            <button
              type="button"
              className="remove-image"
              onClick={() => {
                setPreview(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
                onUpload('');
              }}
            >
              ×
            </button>
          </div>
        ) : (
          <div className="image-upload-dropzone">
            <div className="dropzone-content">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p className="dropzone-text">
                {isDragging ? 'Drop image here' : 'Drag & drop image here or'}
              </p>
            </div>
          </div>
        )}
        <Button
          variant="outline"
          disabled={uploading}
          type="button"
          onClick={handleButtonClick}
        >
          {uploading ? 'Uploading...' : preview ? 'Change Image' : 'Select Image'}
        </Button>
      </div>
    </div>
  );
};

