'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  endpoint: 'profile' | 'club' | 'organization' | 'feed' | 'match-evidence';
  currentImageUrl?: string | null;
  onUploadSuccess?: (url: string) => void;
  onUploadError?: (error: Error) => void;
  className?: string;
  label?: string;
  name?: string;
}

export function ImageUpload({
  endpoint,
  currentImageUrl,
  onUploadSuccess,
  onUploadError,
  className = '',
  label = 'Upload Image',
  name = 'imageUrl'
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create a local preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/upload`, {
        method: 'POST',
        headers: {
          'x-upload-endpoint': endpoint,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Falha no upload da imagem');
      }

      const data = await response.json();
      if (onUploadSuccess) onUploadSuccess(data.url);
      setPreviewUrl(data.url);
    } catch (error: any) {
      if (onUploadError) {
        onUploadError(error);
      } else {
        console.error('Upload Error:', error);
        alert('Erro ao fazer upload da imagem.');
      }
      // Revert preview on failure
      setPreviewUrl(currentImageUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  const clearImage = () => {
    setPreviewUrl(null);
    if (onUploadSuccess) onUploadSuccess('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>}
      <div className="relative group rounded-lg overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 transition-colors h-32 w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 cursor-pointer"
           onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/png, image/jpeg, image/webp" 
          onChange={handleFileChange}
          disabled={isUploading}
        />
        
        {previewUrl ? (
          <>
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            {!isUploading && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <p className="text-white text-sm flex items-center gap-2">
                  <Upload size={16} /> Trocar
                </p>
              </div>
            )}
            <button 
              type="button"
              className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-red-500 transition-colors z-10 opacity-0 group-hover:opacity-100"
              onClick={(e) => { e.stopPropagation(); clearImage(); }}
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <ImageIcon size={24} />
            <span className="text-sm">Clique para upload</span>
          </div>
        )}

      {isUploading && (
        <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-brand-500 mb-2" size={24} />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Enviando...</span>
        </div>
      )}
      
      {/* Hidden input to allow form submission without JS handlers */}
      {name && <input type="hidden" name={name} value={previewUrl || ''} />}
    </div>
  </div>
);
}
